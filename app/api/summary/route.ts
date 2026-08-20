import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, fetchAllRows } from '@/lib/supabaseAdmin';
import { differenceInCalendarDays, subDays, formatISO } from 'date-fns';

export const runtime = 'nodejs';
export const maxDuration = 60;

// Fetches every order row matching the filter window (and the equivalent
// previous window), then aggregates in memory.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const restaurant = searchParams.get('restaurant') ?? 'All';
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  if (!startDate || !endDate) {
    return NextResponse.json(
      {
        error:
          'startDate and endDate are required (yyyy-MM-dd).',
      },
      { status: 400 }
    );
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

      if (restaurant !== 'All') {
        q = q.eq('restaurant_name', restaurant);
      }

      return q;
    });

  let current: any[];
  let previous: any[];
  let restaurantNames: string[];

  try {
    [current, previous] = await Promise.all([
      fetchOrders(start, end),
      fetchOrders(prevStart, prevEnd),
    ]);

    // Get distinct restaurant names for the filter dropdown.
    const { data: restaurantRows, error: restaurantErr } =
  await supabaseAdmin.rpc('distinct_restaurants');

if (restaurantErr) {
  throw new Error(restaurantErr.message);
}

const rows = (restaurantRows ?? []) as Array<{
  restaurant_name: string | null;
}>;

restaurantNames = rows
  .map((r) => r.restaurant_name)
  .filter((name): name is string => Boolean(name));
  } catch (err: any) {
    return NextResponse.json(
      {
        error: err.message ?? 'Failed to load orders',
      },
      { status: 500 }
    );
  }

  // ---------------------------------------------------------------------
  // Aggregation helpers
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

    if (vals.length === 0) {
      return null;
    }

    return (
      Math.round(
        (vals.reduce((a, b) => a + b, 0) / vals.length) * 100
      ) / 100
    );
  };

  // Mirrors DATEDIFF(startKey, endKey, MINUTE)
  const avgMinutesDiff = (
    rows: any[],
    startKey: string,
    endKey: string
  ) => {
    const diffs: number[] = [];

    for (const r of rows) {
      const startVal = r[startKey];
      const endVal = r[endKey];

      if (!startVal || !endVal) {
        continue;
      }

      const startTime = new Date(startVal).getTime();
      const endTime = new Date(endVal).getTime();

      if (
        !Number.isFinite(startTime) ||
        !Number.isFinite(endTime)
      ) {
        continue;
      }

      diffs.push((endTime - startTime) / 60000);
    }

    if (diffs.length === 0) {
      return null;
    }

    return (
      Math.round(
        (diffs.reduce((a, b) => a + b, 0) / diffs.length) * 100
      ) / 100
    );
  };

  // Returns UTC hour from a timestamp.
  const hourOf = (
    row: any,
    key: string
  ): number | null => {
    const val = row[key];

    if (!val) {
      return null;
    }

    const d = new Date(val);

    return Number.isFinite(d.getTime())
      ? d.getUTCHours()
      : null;
  };

  const avgHourOf = (
    rows: any[],
    key: string
  ) => {
    const hours = rows
      .map((r) => hourOf(r, key))
      .filter(
        (h): h is number => h !== null
      );

    if (hours.length === 0) {
      return null;
    }

    return (
      Math.round(
        (hours.reduce((a, b) => a + b, 0) /
          hours.length) *
          100
      ) / 100
    );
  };

  // ---------------------------------------------------------------------
  // Total Stores
  // ---------------------------------------------------------------------

  const totalStores = new Set(
    current
      .map((r: any) => r.store_id)
      .filter(
        (id) =>
          id !== null &&
          id !== undefined
      )
  ).size;

  // ---------------------------------------------------------------------
  // Payment Method Breakdown
  // ---------------------------------------------------------------------

  const paymentMethodBreakdown = Object.entries(
    current.reduce(
      (
        acc: Record<string, number>,
        r: any
      ) => {
        const method =
          r.payment_method || 'Unknown';

        acc[method] =
          (acc[method] || 0) + 1;

        return acc;
      },
      {}
    )
  ).map(([method, count]) => ({
    method,
    count: count as number,
  }));

  // ---------------------------------------------------------------------
  // Hourly Order Traffic
  // ---------------------------------------------------------------------

  const hourlyTraffic = Array.from(
    { length: 24 },
    (_, hour) => ({
      hour,
      count: current.filter(
        (r: any) =>
          hourOf(
            r,
            'accepted_at'
          ) === hour
      ).length,
    })
  );

  // ---------------------------------------------------------------------
  // Daily Series
  // ---------------------------------------------------------------------

  const dailyBuckets =
    current.reduce(
      (
        acc: Record<string, any[]>,
        r: any
      ) => {
        if (!r.order_date) {
          return acc;
        }

        const date = formatISO(
          new Date(r.order_date),
          {
            representation: 'date',
          }
        );

        (acc[date] ??= []).push(r);

        return acc;
      },
      {}
    );

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
    const date = formatISO(
      subDays(
        end,
        spanDays - 1 - i
      ),
      {
        representation: 'date',
      }
    );

    const rows =
      dailyBuckets[date] ?? [];

    dailyFinancials.push({
      date,

      sales:
        Math.round(
          sum(rows, 'subtotal') * 100
        ) / 100,

      commission:
        Math.round(
          sum(rows, 'commission') * 100
        ) / 100,

      payout:
        Math.round(
          sum(
            rows,
            'payout_amount'
          ) * 100
        ) / 100,
    });

    dailyOrders.push({
      date,
      count: rows.length,
    });
  }

  // ---------------------------------------------------------------------
  // Final Response
  // ---------------------------------------------------------------------

  return NextResponse.json({
    // Main KPIs
    totalStores,

    totalOrders:
      current.length,

    totalSales:
      Math.round(
        sum(current, 'subtotal') * 100
      ) / 100,

    payoutAmount:
      Math.round(
        sum(
          current,
          'payout_amount'
        ) * 100
      ) / 100,

    totalMarketingFees:
      Math.round(
        sum(
          current,
          'marketing_fees'
        ) * 100
      ) / 100,

    taxAmount:
      Math.round(
        sum(
          current,
          'tax_amount'
        ) * 100
      ) / 100,

    payoutAfterFoodCost:
      Math.round(
        sum(
          current,
          'Payout_after_Food_Cost'
        ) * 100
      ) / 100,

    voucherFundedByYou:
      Math.round(
        sum(
          current,
          'voucher_funded_by_you'
        ) * 100
      ) / 100,

    // Time KPIs
    avgOrderHour:
      avgHourOf(
        current,
        'accepted_at'
      ),

    avgPrepTimeMin:
      avgMinutesDiff(
        current,
        'accepted_at',
        'ready_to_pickup_at'
      ),

    avgDelayVsEstimateMin:
      avgMinutesDiff(
        current,
        'estimated_delivery_at',
        'delivered_at'
      ),

    avgDeliveryTimeMin:
      avgMinutesDiff(
        current,
        'in_delivery_at',
        'delivered_at'
      ),

    // Previous Period
    previous: {
      totalOrders:
        previous.length,

      totalSales:
        Math.round(
          sum(
            previous,
            'subtotal'
          ) * 100
        ) / 100,

      payoutAmount:
        Math.round(
          sum(
            previous,
            'payout_amount'
          ) * 100
        ) / 100,

      totalMarketingFees:
        Math.round(
          sum(
            previous,
            'marketing_fees'
          ) * 100
        ) / 100,

      taxAmount:
        Math.round(
          sum(
            previous,
            'tax_amount'
          ) * 100
        ) / 100,
    },

    // Charts
    paymentMethodBreakdown,

    hourlyTraffic,

    dailyFinancials,

    dailyOrders,

    // Restaurant filter
    restaurants:
      restaurantNames,
  });
}
