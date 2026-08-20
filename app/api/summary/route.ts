import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, fetchAllRows } from '@/lib/supabaseAdmin';
import {
  differenceInCalendarDays,
  subDays,
  formatISO,
} from 'date-fns';

export const runtime = 'nodejs';
export const maxDuration = 60;

// Fetches every order row matching the filter window
// and the equivalent previous window, then aggregates in memory.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const restaurant = searchParams.get('restaurant') ?? 'All';
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  if (!startDate || !endDate) {
    return NextResponse.json(
      {
        error: 'startDate and endDate are required (yyyy-MM-dd).',
      },
      { status: 400 }
    );
  }

  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T23:59:59Z`);

  if (
    !Number.isFinite(start.getTime()) ||
    !Number.isFinite(end.getTime())
  ) {
    return NextResponse.json(
      {
        error: 'Invalid startDate or endDate.',
      },
      { status: 400 }
    );
  }

  const spanDays = differenceInCalendarDays(end, start) + 1;

  const prevEnd = subDays(start, 1);
  const prevStart = subDays(prevEnd, spanDays - 1);

  /*
   * IMPORTANT:
   * Read from orders_dashboard instead of public.orders.
   *
   * orders_dashboard normalizes:
   * - financial fields to numeric
   * - boolean fields to boolean
   * - blank text values to NULL
   *
   * This keeps the aggregation below reliable.
   */
  const fetchOrders = (rangeStart: Date, rangeEnd: Date) =>
    fetchAllRows<any>((from, to) => {
      let query = supabaseAdmin
        .from('orders_dashboard')
        .select('*')
        .gte('order_date', rangeStart.toISOString())
        .lte('order_date', rangeEnd.toISOString())
        .range(from, to);

      if (restaurant !== 'All') {
        query = query.eq('restaurant_name', restaurant);
      }

      return query;
    });

  let current: any[] = [];
  let previous: any[] = [];
  let restaurantNames: string[] = [];

  try {
    /*
     * Fetch current and previous period orders.
     */
    [current, previous] = await Promise.all([
      fetchOrders(start, end),
      fetchOrders(prevStart, prevEnd),
    ]);

    /*
     * Get distinct restaurant names for the filter dropdown.
     *
     * Keep using the existing RPC because it already returns
     * restaurant_name according to the current project structure.
     */
    const {
      data: restaurantRows,
      error: restaurantErr,
    } = await supabaseAdmin.rpc('distinct_restaurants');

    if (restaurantErr) {
      throw new Error(restaurantErr.message);
    }

    /*
     * Explicitly type the RPC result so TypeScript knows
     * restaurant_name is a string or null.
     */
    const restaurantNameRows =
      (restaurantRows ?? []) as Array<{
        restaurant_name: string | null;
      }>;

    restaurantNames = restaurantNameRows
      .map((restaurantRow) => restaurantRow.restaurant_name)
      .filter(
        (name): name is string =>
          typeof name === 'string' && name.trim().length > 0
      );

    /*
     * Remove duplicate restaurant names just in case.
     */
    restaurantNames = Array.from(new Set(restaurantNames)).sort();
  } catch (err: any) {
    return NextResponse.json(
      {
        error: err?.message ?? 'Failed to load orders',
      },
      { status: 500 }
    );
  }

  // ---------------------------------------------------------------------
  // Aggregation helpers
  // ---------------------------------------------------------------------

  /*
   * Safely sum numeric fields.
   *
   * orders_dashboard already returns financial fields as numeric,
   * but Number() keeps this helper defensive.
   */
  const sum = (orderRows: any[], key: string) =>
    orderRows.reduce((acc, row) => {
      const numberValue = Number(row[key]);

      return (
        acc +
        (Number.isFinite(numberValue) ? numberValue : 0)
      );
    }, 0);

  /*
   * Average numeric value.
   */
  const avg = (orderRows: any[], key: string) => {
    const values = orderRows
      .map((row) => Number(row[key]))
      .filter((value) => Number.isFinite(value));

    if (values.length === 0) {
      return null;
    }

    return (
      Math.round(
        (values.reduce((a, b) => a + b, 0) / values.length) * 100
      ) / 100
    );
  };

  /*
   * Returns the average difference in minutes between two timestamps.
   */
  const avgMinutesDiff = (
    orderRows: any[],
    startKey: string,
    endKey: string
  ) => {
    const differences: number[] = [];

    for (const row of orderRows) {
      const startValue = row[startKey];
      const endValue = row[endKey];

      if (!startValue || !endValue) {
        continue;
      }

      const startTime = new Date(startValue).getTime();
      const endTime = new Date(endValue).getTime();

      if (
        !Number.isFinite(startTime) ||
        !Number.isFinite(endTime)
      ) {
        continue;
      }

      const difference = (endTime - startTime) / 60000;

      /*
       * Ignore negative durations caused by bad/misaligned
       * timestamps rather than allowing them to distort averages.
       */
      if (difference >= 0) {
        differences.push(difference);
      }
    }

    if (differences.length === 0) {
      return null;
    }

    return (
      Math.round(
        (differences.reduce((a, b) => a + b, 0) /
          differences.length) *
          100
      ) / 100
    );
  };

  /*
   * Returns UTC hour from a timestamp.
   */
  const hourOf = (
    row: any,
    key: string
  ): number | null => {
    const value = row[key];

    if (!value) {
      return null;
    }

    const date = new Date(value);

    return Number.isFinite(date.getTime())
      ? date.getUTCHours()
      : null;
  };

  /*
   * Average order hour.
   */
  const avgHourOf = (
    orderRows: any[],
    key: string
  ) => {
    const hours = orderRows
      .map((row) => hourOf(row, key))
      .filter(
        (hour): hour is number =>
          hour !== null
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
      .map((row: any) => row.store_id)
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
        accumulator: Record<string, number>,
        row: any
      ) => {
        const method =
          row.payment_method || 'Unknown';

        accumulator[method] =
          (accumulator[method] || 0) + 1;

        return accumulator;
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
        (row: any) =>
          hourOf(
            row,
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
        accumulator: Record<string, any[]>,
        row: any
      ) => {
        if (!row.order_date) {
          return accumulator;
        }

        const parsedDate = new Date(row.order_date);

        if (!Number.isFinite(parsedDate.getTime())) {
          return accumulator;
        }

        const date = formatISO(
          parsedDate,
          {
            representation: 'date',
          }
        );

        (accumulator[date] ??= []).push(row);

        return accumulator;
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

    const dailyOrderRows =
      dailyBuckets[date] ?? [];

    dailyFinancials.push({
      date,

      sales:
        Math.round(
          sum(
            dailyOrderRows,
            'subtotal'
          ) * 100
        ) / 100,

      commission:
        Math.round(
          sum(
            dailyOrderRows,
            'commission'
          ) * 100
        ) / 100,

      payout:
        Math.round(
          sum(
            dailyOrderRows,
            'payout_amount'
          ) * 100
        ) / 100,
    });

    dailyOrders.push({
      date,
      count: dailyOrderRows.length,
    });
  }

  // ---------------------------------------------------------------------
  // Final Response
  // ---------------------------------------------------------------------

  return NextResponse.json({
    // -------------------------------------------------------------------
    // Main KPIs
    // -------------------------------------------------------------------

    totalStores,

    totalOrders: current.length,

    totalSales:
      Math.round(
        sum(
          current,
          'subtotal'
        ) * 100
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

    /*
     * FIX:
     * orders_dashboard uses payout_after_food_cost
     * instead of Payout_after_Food_Cost.
     */
    payoutAfterFoodCost:
      Math.round(
        sum(
          current,
          'payout_after_food_cost'
        ) * 100
      ) / 100,

    voucherFundedByYou:
      Math.round(
        sum(
          current,
          'voucher_funded_by_you'
        ) * 100
      ) / 100,

    // -------------------------------------------------------------------
    // Time KPIs
    // -------------------------------------------------------------------

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

    // -------------------------------------------------------------------
    // Previous Period
    // -------------------------------------------------------------------

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

    // -------------------------------------------------------------------
    // Charts
    // -------------------------------------------------------------------

    paymentMethodBreakdown,

    hourlyTraffic,

    dailyFinancials,

    dailyOrders,

    // -------------------------------------------------------------------
    // Restaurant Filter
    // -------------------------------------------------------------------

    restaurants: restaurantNames,
  });
}
