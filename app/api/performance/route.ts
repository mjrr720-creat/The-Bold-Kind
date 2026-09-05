import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, fetchAllRows } from '@/lib/supabaseAdmin';
import { PerformanceResponse, LabelValue, RestaurantPerformanceRow, DailyMetric } from '@/lib/performanceTypes';

export const runtime = 'nodejs';
export const maxDuration = 60;

// ============================================================================
// Performance Analysis API — separate module, separate Supabase table.
//
// This route ONLY queries `talabat_performance`. It never touches the
// `orders` table, and it does not modify or depend on /api/summary or
// /api/insights. Order Analysis and Performance Analysis remain fully
// independent data pipelines that happen to accept the same kind of
// filters (restaurant + date range) so the shared dashboard shell can
// apply one set of filters to both.
// ============================================================================

const TABLE = 'talabat_performance';

// The table's columns were imported verbatim from the Talabat performance
// export (spaces, mixed case, punctuation). We read them back with bracket
// notation via this helper rather than trying to alias every identifier.
type PerfRow = Record<string, any>;

// Only the columns actually read anywhere below. Selecting these explicitly
// (instead of '*') cuts payload size on top of the date/outlet filtering.
// Columns with spaces/punctuation must be double-quoted inside the select
// list so PostgREST's mini query-language parses them as single identifiers
// (this is separate from .eq()/.gte()/.in(), which take the column name as
// a plain string and don't need quoting).
const SELECT_COLUMNS = [
  '"Date"',
  '"Outlet name"',
  '"Restaurant ID"',
  '"Orders count"',
  '"Successful Orders"',
  '"Gross Sales"',
  '"Cancelled Orders"',
  '"Total customer complaints received"',
  '"Average preparation time (minutes)"',
  '"Orders marked as ready"',
  '"Pro Revenue"',
  '"Viewed your menu"',
  '"Impressions"',
  '"Added items to cart"',
  '"Orders from new customers"',
  '"Sales loss"',
  '"Orders from returning customers"',
  '"Placed an order"',
  '"Orders in Bucket1: < 5 minutes"',
  '"Orders in Bucket2: >= 5 Mins and < 10 Mins"',
  '"Orders in Bucket3: >= 10 Mins"',
  '"Avoidable Cancellation Reason"',
  '"Avoidable cancellation count"',
  '"Customer Complaint Reason"',
].join(',');

// ---------------------------------------------------------------------
// Lightweight in-memory caches for `restaurants` and `availableDateRange`.
// Both describe the FULL table, independent of any single request's
// filters, so they don't need to be recomputed (or scan the whole table)
// on every request — a short TTL keeps them fresh without adding an
// external cache dependency. Cache lives for the lifetime of the warm
// server instance; a cold start simply recomputes it once.
// ---------------------------------------------------------------------
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

let restaurantsCache: { data: string[]; expiresAt: number } | null = null;
let dateRangeCache: { data: { min: string | null; max: string | null }; expiresAt: number } | null = null;

async function getRestaurantsCached(): Promise<string[]> {
  const now = Date.now();
  if (restaurantsCache && restaurantsCache.expiresAt > now) {
    return restaurantsCache.data;
  }

  const t0 = Date.now();
  // DB-side DISTINCT via a Postgres function — one round trip, no paging
  // through the full table just to collect outlet names. Requires the
  // `get_distinct_outlets()` function to exist (see migration SQL).
  const { data, error } = await supabaseAdmin.rpc('get_distinct_outlets');
  if (error) throw new Error(error.message);
  console.log(`[/api/performance] restaurants (rpc): ${Date.now() - t0}ms (${data?.length ?? 0} outlets)`);

  const restaurants = (data ?? [])
    .map((r: { outlet_name: string }) => (r.outlet_name ?? '').trim())
    .filter((name: string) => Boolean(name))
    .sort((a: string, b: string) => a.localeCompare(b));

  restaurantsCache = { data: restaurants, expiresAt: now + CACHE_TTL_MS };
  return restaurants;
}

async function getDateRangeCached(): Promise<{ min: string | null; max: string | null }> {
  const now = Date.now();
  if (dateRangeCache && dateRangeCache.expiresAt > now) {
    return dateRangeCache.data;
  }

  const t0 = Date.now();
  // MIN/MAX via a single-row, indexed order-by-limit-1 query in each
  // direction — O(log n) with an index on "Date", never a full scan.
  const [minRes, maxRes] = await Promise.all([
    supabaseAdmin.from(TABLE).select('"Date"').order('Date', { ascending: true }).limit(1).maybeSingle(),
    supabaseAdmin.from(TABLE).select('"Date"').order('Date', { ascending: false }).limit(1).maybeSingle(),
  ]);
  console.log(`[/api/performance] date-range lookup: ${Date.now() - t0}ms`);

  if (minRes.error) throw minRes.error;
  if (maxRes.error) throw maxRes.error;

  const min = minRes.data ? normalizeRowDate(minRes.data as PerfRow) : null;
  const max = maxRes.data ? normalizeRowDate(maxRes.data as PerfRow) : null;

  const data = { min, max };
  dateRangeCache = { data, expiresAt: now + CACHE_TTL_MS };
  return data;
}

function num(row: PerfRow, key: string): number {
  const v = row[key];
  if (v === null || v === undefined || v === '') return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function str(row: PerfRow, key: string): string {
  const v = row[key];
  if (v === null || v === undefined) return '';
  return String(v).trim().replace(/^["']|["']$/g, '');
}

// "Date" is a native PostgreSQL DATE column. supabase-js returns DATE
// columns as a plain 'YYYY-MM-DD' string with no time-of-day or timezone
// component, so comparing these strings lexicographically is exact and
// timezone-safe (no Date object / local-timezone shifting involved).
function normalizeRowDate(row: PerfRow): string | null {
  const raw = str(row, 'Date');
  if (!raw) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  // Defensive fallback in case of an unexpected shape (e.g. an ISO
  // timestamp with a time component, or a legacy text value).
  if (/^\d{4}-\d{1,2}-\d{1,2}/.test(raw)) {
    const [datePart] = raw.split('T');
    const [yyyy, mm, dd] = datePart.split('-');
    if (!yyyy || !mm || !dd) return null;
    return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
  }

  return null;
}

// Enumerates every calendar date from start to end (inclusive) as
// 'yyyy-MM-dd' strings. Uses UTC arithmetic exclusively (never mixes with
// local-timezone Date methods) so adding 24h always advances exactly one
// calendar day with no DST-related drift.
function enumerateDates(start: string, end: string): string[] {
  const [sy, sm, sd] = start.split('-').map(Number);
  const [ey, em, ed] = end.split('-').map(Number);
  const startMs = Date.UTC(sy, sm - 1, sd);
  const endMs = Date.UTC(ey, em - 1, ed);

  const dates: string[] = [];
  for (let t = startMs; t <= endMs; t += 24 * 60 * 60 * 1000) {
    const d = new Date(t);
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(d.getUTCDate()).padStart(2, '0');
    dates.push(`${yyyy}-${mm}-${dd}`);
  }
  return dates;
}

function pushToBucket(map: Map<string, number>, key: string | null | undefined, amount = 1) {
  const label = (key ?? '').trim();
  if (!label) return;
  map.set(label, (map.get(label) ?? 0) + amount);
}

function mapToSortedLabelValue(map: Map<string, number>, limit?: number): LabelValue[] {
  const arr = Array.from(map.entries()).map(([label, value]) => ({ label, value }));
  arr.sort((a, b) => b.value - a.value);
  return limit ? arr.slice(0, limit) : arr;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const restaurant = searchParams.get('restaurant') ?? 'All';
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  if (!startDate || !endDate) {
    return NextResponse.json(
      { error: 'startDate and endDate are required (yyyy-MM-dd).' },
      { status: 400 }
    );
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
    return NextResponse.json({ error: 'Invalid startDate or endDate.' }, { status: 400 });
  }

  // Restaurant filter: 'All' or pipe-separated outlet names.
  const selectedRestaurants =
    restaurant && restaurant !== 'All'
      ? restaurant.split('|').map((r) => r.trim()).filter(Boolean)
      : null;

  // ---------------------------------------------------------------------
  // Fetch only the rows this request actually needs: Date range and (if
  // set) outlet filtering are applied directly in the Supabase query
  // instead of downloading the full table and filtering in JS. Each
  // request builds its own filtered query from scratch, so current-period
  // and comparison-period calls stay fully independent — nothing here is
  // shared or mutated across requests.
  // ---------------------------------------------------------------------
  const buildFilteredQuery = () => {
    let q = supabaseAdmin
      .from(TABLE)
      .select(SELECT_COLUMNS)
      .gte('Date', startDate)
      .lte('Date', endDate);

    if (selectedRestaurants) {
      q = selectedRestaurants.length === 1
        ? q.eq('Outlet name', selectedRestaurants[0])
        : q.in('Outlet name', selectedRestaurants);
    }
    return q;
  };

  let filtered: PerfRow[];
  let restaurants: string[];
  let minDate: string | null;
  let maxDate: string | null;
  try {
    const fetchStart = Date.now();
    const [filteredRows, restaurantList, dateRange] = await Promise.all([
      fetchAllRows<PerfRow>((from, to) => buildFilteredQuery().range(from, to)),
      getRestaurantsCached(),
      getDateRangeCached(),
    ]);
    console.log(
      `[/api/performance] query fetch: ${Date.now() - fetchStart}ms ` +
      `(restaurant=${restaurant}, ${startDate}..${endDate}, rows=${filteredRows.length})`
    );

    filtered = filteredRows;
    restaurants = restaurantList;
    minDate = dateRange.min;
    maxDate = dateRange.max;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load performance data.';
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const aggStart = Date.now();

  // ---------------------------------------------------------------------
  // KPIs
  // ---------------------------------------------------------------------
  const storeIdSet = new Set<string>();
  let totalOrders = 0;
  let totalGrossSales = 0;
  let totalProRevenue = 0;
  let totalMenuViews = 0;
  let totalImpressions = 0;
  let addedToCart = 0;
  let cancelledOrders = 0;
  let newCustomerOrders = 0;
  let salesLoss = 0;

  const bucket1 = { orders: 0, label: 'Bucket1: < 5 minutes' };
  const bucket2 = { orders: 0, label: 'Bucket2: 5–10 minutes' };
  const bucket3 = { orders: 0, label: 'Bucket3: >= 10 minutes' };

  const cancellationReasonMap = new Map<string, number>();
  const complaintReasonMap = new Map<string, number>();

  let returningCustomerOrders = 0;
  let viewedMenu = 0;
  let placedOrder = 0;

  // Per-day aggregation (for the continuous trend series)
  const dailyAgg = new Map<
    string,
    { orders: number; grossSales: number; cancelled: number; complaints: number; prepWeightedSum: number; prepWeight: number }
  >();

  // Per-restaurant aggregation
  const perRestaurant = new Map<
    string,
    {
      orders: number;
      successfulOrders: number;
      grossSales: number;
      cancelledOrders: number;
      complaints: number;
      prepWeightedSum: number;
      prepWeight: number;
    }
  >();

  for (const row of filtered) {
    const outlet = str(row, 'Outlet name') || 'Unknown';
    const storeId = str(row, 'Restaurant ID');
    const rowOrders = num(row, 'Orders count');
    const rowSuccessful = num(row, 'Successful Orders');
    const rowSales = num(row, 'Gross Sales');
    const rowCancelled = num(row, 'Cancelled Orders');
    const rowComplaints = num(row, 'Total customer complaints received');
    const rowPrepTimeRaw = row['Average preparation time (minutes)'];
    const rowMarkedReady = num(row, 'Orders marked as ready');
    const hasValidPrepTime = rowPrepTimeRaw !== null && rowPrepTimeRaw !== undefined && rowPrepTimeRaw !== '' && rowMarkedReady > 0;
    const rowPrepTime = hasValidPrepTime ? Number(rowPrepTimeRaw) : 0;

    if (storeId) storeIdSet.add(storeId);

    totalOrders += rowOrders;
    totalGrossSales += rowSales;
    totalProRevenue += num(row, 'Pro Revenue');
    totalMenuViews += num(row, 'Viewed your menu');
    totalImpressions += num(row, 'Impressions');
    addedToCart += num(row, 'Added items to cart');
    cancelledOrders += rowCancelled;
    newCustomerOrders += num(row, 'Orders from new customers');
    salesLoss += num(row, 'Sales loss');

    returningCustomerOrders += num(row, 'Orders from returning customers');
    viewedMenu += num(row, 'Viewed your menu');
    placedOrder += num(row, 'Placed an order');

    bucket1.orders += num(row, 'Orders in Bucket1: < 5 minutes');
    bucket2.orders += num(row, 'Orders in Bucket2: >= 5 Mins and < 10 Mins');
    bucket3.orders += num(row, 'Orders in Bucket3: >= 10 Mins');

    pushToBucket(cancellationReasonMap, str(row, 'Avoidable Cancellation Reason'), num(row, 'Avoidable cancellation count'));
    pushToBucket(complaintReasonMap, str(row, 'Customer Complaint Reason'), rowComplaints);

    // Daily bucket
    const rowDate = normalizeRowDate(row);
    if (rowDate) {
      const d = dailyAgg.get(rowDate) ?? { orders: 0, grossSales: 0, cancelled: 0, complaints: 0, prepWeightedSum: 0, prepWeight: 0 };
      d.orders += rowOrders;
      d.grossSales += rowSales;
      d.cancelled += rowCancelled;
      d.complaints += rowComplaints;
      if (hasValidPrepTime) {
        d.prepWeightedSum += rowPrepTime * rowMarkedReady;
        d.prepWeight += rowMarkedReady;
      }
      dailyAgg.set(rowDate, d);
    }

    // Per-restaurant bucket
    const entry = perRestaurant.get(outlet) ?? {
      orders: 0,
      successfulOrders: 0,
      grossSales: 0,
      cancelledOrders: 0,
      complaints: 0,
      prepWeightedSum: 0,
      prepWeight: 0,
    };
    entry.orders += rowOrders;
    entry.successfulOrders += rowSuccessful;
    entry.grossSales += rowSales;
    entry.cancelledOrders += rowCancelled;
    entry.complaints += rowComplaints;
    if (hasValidPrepTime) {
      entry.prepWeightedSum += rowPrepTime * rowMarkedReady;
      entry.prepWeight += rowMarkedReady;
    }
    perRestaurant.set(outlet, entry);
  }

  // ---------------------------------------------------------------------
  // Continuous daily series (zero-filled) for trend charts
  // ---------------------------------------------------------------------
  const dailyMetrics: DailyMetric[] = enumerateDates(startDate, endDate).map((date) => {
    const d = dailyAgg.get(date);
    if (!d) {
      return { date, orders: 0, grossSales: 0, cancellationPct: null, complaintPct: null, avgPrepTimeMin: null };
    }
    return {
      date,
      orders: d.orders,
      grossSales: d.grossSales,
      cancellationPct: d.orders > 0 ? (d.cancelled / d.orders) * 100 : null,
      complaintPct: d.orders > 0 ? (d.complaints / d.orders) * 100 : null,
      avgPrepTimeMin: d.prepWeight > 0 ? d.prepWeightedSum / d.prepWeight : null,
    };
  });

  // ---------------------------------------------------------------------
  // Per-restaurant table / ranking
  // ---------------------------------------------------------------------
  const restaurantPerformance: RestaurantPerformanceRow[] = Array.from(perRestaurant.entries())
    .map(([outletName, r]) => ({
      outletName,
      orders: r.orders,
      successfulOrders: r.successfulOrders,
      grossSales: r.grossSales,
      avgOrderValue: r.orders > 0 ? r.grossSales / r.orders : null,
      avgPrepTimeMin: r.prepWeight > 0 ? r.prepWeightedSum / r.prepWeight : null,
      cancellationPct: r.orders > 0 ? (r.cancelledOrders / r.orders) * 100 : null,
      complaintPct: r.orders > 0 ? (r.complaints / r.orders) * 100 : null,
    }))
    .sort((a, b) => b.grossSales - a.grossSales);

  console.log(`[/api/performance] aggregation: ${Date.now() - aggStart}ms (rows=${filtered.length})`);

  const response: PerformanceResponse = {
    kpis: {
      totalStores: storeIdSet.size,
      totalOrders,
      totalGrossSales,
      totalProRevenue,
      totalMenuViews,
      totalImpressions,
      addedToCart,
      cancelledOrders,
      newCustomerOrders,
      salesLoss,
    },
    dailyMetrics,
    prepTimeBuckets: [
      { label: bucket1.label, value: bucket1.orders },
      { label: bucket2.label, value: bucket2.orders },
      { label: bucket3.label, value: bucket3.orders },
    ],
    cancellationReasons: mapToSortedLabelValue(cancellationReasonMap, 10),
    complaintReasons: mapToSortedLabelValue(complaintReasonMap, 10),
    newVsReturning: [
      { label: 'New customers', value: newCustomerOrders },
      { label: 'Returning customers', value: returningCustomerOrders },
    ],
    funnel: [
      { label: 'Impressions', value: totalImpressions },
      { label: 'Viewed menu', value: viewedMenu },
      { label: 'Added to cart', value: addedToCart },
      { label: 'Placed order', value: placedOrder },
    ],
    restaurantPerformance,
    restaurants,
    availableDateRange: { min: minDate, max: maxDate },
  };

  return NextResponse.json(response);
}