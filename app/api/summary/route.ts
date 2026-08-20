import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, fetchAllRows } from '@/lib/supabaseAdmin';
import { differenceInCalendarDays, subDays, formatISO } from 'date-fns';

export const runtime = 'nodejs';
export const maxDuration = 60;

// Fetches every order row matching the filter window (and the equivalent
// -length previous window, for the "previous period" deltas), then
// aggregates in memory. fetchAllRows() pages through Supabase/PostgREST's
// 1000-row-per-response cap so this is correct at 120K+ rows, not just
// the first 1000. Fine up to roughly hundreds of thousands of rows per
// query window; past that, replace the in-memory sums/averages below with
// Postgres RPC functions doing SUM/COUNT/GROUP BY server-side.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const restaurant = searchParams.get('restaurant') ?? 'All';
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  if (!startDate || !endDate) {
    return NextResponse.json({ error: 'startDate and endDate are required (yyyy-MM-dd).' }, { status: 400 });
  }

  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T23:59:59Z`);
  const spanDays = differenceInCalendarDays(end, start) + 1;
  const prevEnd = subDays(start, 1);
  const prevStart = subDays(prevEnd, spanDays - 1);

  const fetchOrders = (rangeStart: Date, rangeEnd: Date) =>
    fetchAllRows<any>((from, to) => {
      let q = supabaseAdmin
        .from('orders')
        .select('*')
        .gte('order_date', rangeStart.toISOString())
        .lte('order_date', rangeEnd.toISOString())
        .range(from, to);
      if (restaurant !== 'All') q = q.eq('restaurant_name', restaurant);
      return q;
    });

  let current: any[];
  let previous: any[];
  let restaurantNames: string[];

  try {
    [current, previous] = await Promise.all([
      fetchOrders(start, end),
      fetchOrders(prevStart, prevEnd)
    ]);

    // Distinct restaurant list for the filter dropdown: independent of the
    // date range, and via an RPC (single indexed DISTINCT) rather than
    // paging the whole orders table just to collect ~195 names.
    const { data: restaurantRows, error: restaurantErr } = await supabaseAdmin.rpc('distinct_restaurants');
    if (restaurantErr) throw new Error(restaurantErr.message);
    restaurantNames = (restaurantRows ?? []).map((r: any) => r.restaurant_name);
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Failed to load orders' }, { status: 500 });
  }

  // ---------------------------------------------------------------------
  // Aggregation helpers — every one is null/undefined-safe so rows with
  // missing timestamps (e.g. a cancelled order with no accepted_at) are
  // simply excluded from that particular average rather than producing
  // NaN or skewing the result.
  // ---------------------------------------------------------------------
  const sum = (rows: any[], key: string) =>
    rows.reduce((acc, r) => {
      const n = Number(r[key]);
      return acc + (Number.isFinite(n) ? n : 0);
    }, 0);

  const avg = (rows: any[], key: string) => {
    const vals = rows
      .map((r) => Number(r[key]))
      .filter((v) => Number.isFinite(v));
    if (vals.length === 0) return null;
    return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) / 100;
  };

  // Mirrors DATEDIFF(startKey, endKey, MINUTE): (endKey - startKey) in
  // minutes, averaged across rows where BOTH timestamps are present.
  const avgMinutesDiff = (rows: any[], startKey: string, endKey: string) => {
    const diffs: number[] = [];
    for (const r of rows) {
      const startVal = r[startKey];
      const endVal = r[endKey];
      if (!startVal || !endVal) continue;
      const start = new Date(startVal).getTime();
      const end = new Date(endVal).getTime();
      if (!Number.isFinite(start) || !Number.isFinite(end)) continue;
      diffs.push((end - start) / 60000);
    }
    if (diffs.length === 0) return null;
    return Math.round((diffs.reduce((a, b) => a + b, 0) / diffs.length) * 100) / 100;
  };

  // Mirrors HOUR(timestampKey), averaged / bucketed only over rows where
  // that timestamp is present (e.g. accepted_at is null until an order
  // is actually accepted).
  const hourOf = (row: any, key: string): number | null => {
    const val = row[key];
    if (!val) return null;
    const d = new Date(val);
    return Number.isFinite(d.getTime()) ? d.getUTCHours() : null;
  };
  const avgHourOf = (rows: any[], key: string) => {
    const hours = rows.map((r) => hourOf(r, key)).filter((h): h is number => h !== null);
    if (hours.length === 0) return null;
    return Math.round((hours.reduce((a, b) => a + b, 0) / hours.length) * 100) / 100;
  };

  // Total Stores = DISTINCT COUNT of Store ID — null/undefined store_id
  // values are excluded so they don't inflate the distinct count by one.
  const totalStores = new Set(
    current.map((r: any) => r.store_id).filter((id) => id !== null && id !== undefined)
  ).size;

  // Payment Method pie: COUNT of Payment Method
  const paymentMethodBreakdown = Object.entries(
    current.reduce((acc: Record<string, number>, r: any) => {
      const method = r.payment_method || 'Unknown';
      acc[method] = (acc[method] || 0) + 1;
      return acc;
    }, {})
  ).map(([method, count]) => ({ method, count: count as number }));

  // Hourly Order Traffic: X = Order Hour (HOUR(Accepted at)), Y = COUNT(Order ID).
  // Orders never accepted (e.g. cancelled pre-acceptance) have no hour and
  // are excluded, matching how Average Order Hour is computed below.
  const hourlyTraffic = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    count: current.filter((r: any) => hourOf(r, 'accepted_at') === hour).length
  }));

// Daily series — one point for every day in the selected date range.
// Days with no orders are included as 0 so the line chart stays continuous.

const dailyBuckets = current.reduce((acc: Record<string, any[]>, r: any) => {
  const date = formatISO(new Date(r.order_date), {
    representation: 'date'
  });

  (acc[date] ??= []).push(r);
  return acc;
}, {});

const dailyFinancials: {
  date: string;
  sales: number;
  commission: number;
  payout: number;
}[] = [];

const dailyOrders: {
  date: string;
  count: number;
}[] = [];

for (let i = 0; i < spanDays; i++) {
  const date = formatISO(subDays(end, spanDays - 1 - i), {
    representation: 'date'
  });

  const rows = dailyBuckets[date] ?? [];

  dailyFinancials.push({
    date,
    sales: Math.round(sum(rows, 'subtotal') * 100) / 100,
    commission: Math.round(sum(rows, 'commission') * 100) / 100,
    payout: Math.round(sum(rows, 'payout_amount') * 100) / 100
  });

  dailyOrders.push({
    date,
    count: rows.length
  });
}

  return NextResponse.json({
    totalStores, // DISTINCT COUNT(Store ID)
    totalOrders: current.length, // COUNT(Order ID)
    totalSales: Math.round(sum(current, 'subtotal') * 100) / 100, // SUM(Subtotal)
    payoutAmount: Math.round(sum(current, 'payout_amount') * 100) / 100, // SUM(Payout Amount)
    totalMarketingFees: Math.round(sum(current, 'marketing_fees') * 100) / 100, // SUM(Marketing Fees)
    taxAmount: Math.round(sum(current, 'tax_amount') * 100) / 100, // SUM(Tax Amount)
    payoutAfterFoodCost: Math.round(sum(current, 'Payout_after_Food_Cost') * 100) / 100,
    voucherFundedByYou: Math.round(sum(current, 'voucher_funded_by_you') * 100) / 100, // SUM(Voucher Funded by you)
    avgOrderHour: avgHourOf(current, 'accepted_at'), // HOUR(Accepted at)
    avgPrepTimeMin: avgMinutesDiff(current, 'accepted_at', 'ready_to_pickup_at'), // DATEDIFF(Accepted at, Ready to pick up at, MINUTE)
    avgDelayVsEstimateMin: avgMinutesDiff(current, 'estimated_delivery_at', 'delivered_at'), // DATEDIFF(Estimated delivery time, Delivered at, MINUTE)
    avgDeliveryTimeMin: avgMinutesDiff(current, 'in_delivery_at', 'delivered_at'), // DATEDIFF(In delivery at, Delivered at, MINUTE)
    previous: {
      totalOrders: previous.length,
      totalSales: Math.round(sum(previous, 'subtotal') * 100) / 100,
      payoutAmount: Math.round(sum(previous, 'payout_amount') * 100) / 100,
      totalMarketingFees: Math.round(sum(previous, 'marketing_fees') * 100) / 100,
      taxAmount: Math.round(sum(previous, 'tax_amount') * 100) / 100
    },
    paymentMethodBreakdown,
    hourlyTraffic,
    dailyFinancials, // { month, subtotal, commission, payout }[] — combo chart
    dailyOrders, // { month, count }[] — order-count line chart
    restaurants: restaurantNames
  });
}
