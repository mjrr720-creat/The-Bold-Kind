import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, fetchAllRows } from '@/lib/supabaseAdmin';
import {
  differenceInCalendarDays,
  subDays,
  formatISO,
} from 'date-fns';

export const runtime = 'nodejs';
export const maxDuration = 60;

// Fetch current period + equivalent previous period,
// then aggregate the normalized orders_dashboard view.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const restaurant =
    searchParams.get('restaurant') ?? 'All';

  const startDate =
    searchParams.get('startDate');

  const endDate =
    searchParams.get('endDate');

  if (!startDate || !endDate) {
    return NextResponse.json(
      {
        error:
          'startDate and endDate are required (yyyy-MM-dd).',
      },
      { status: 400 }
    );
  }

  const start =
    new Date(`${startDate}T00:00:00Z`);

  const end =
    new Date(`${endDate}T23:59:59Z`);

  if (
    !Number.isFinite(start.getTime()) ||
    !Number.isFinite(end.getTime())
  ) {
    return NextResponse.json(
      {
        error:
          'Invalid startDate or endDate.',
      },
      { status: 400 }
    );
  }

  const spanDays =
    differenceInCalendarDays(
      end,
      start
    ) + 1;

  const prevEnd =
    subDays(start, 1);

  const prevStart =
    subDays(
      prevEnd,
      spanDays - 1
    );

  /*
   * orders_dashboard exposes normalized snake_case fields.
   *
   * order_date is text in the source/view, so the date boundaries
   * are kept in the same sortable "YYYY-MM-DD HH:mm" style.
   *
   * IMPORTANT:
   * We also apply a deterministic ORDER BY before pagination.
   * Without a stable ordering, PostgREST pagination can return
   * overlapping/missing rows across multiple .range() requests.
   */
  const fetchOrders = (
    rangeStart: Date,
    rangeEnd: Date
  ) => {
    const rangeStartDb =
      `${formatISO(rangeStart, {
        representation: 'date',
      })} 00:00`;

    const rangeEndDb =
      `${formatISO(rangeEnd, {
        representation: 'date',
      })} 23:59`;

    return fetchAllRows<any>(
      (from, to) => {
        let query = supabaseAdmin
          .from('orders_dashboard')
          .select('*')
          .gte(
            'order_date',
            rangeStartDb
          )
          .lte(
            'order_date',
            rangeEndDb
          )
          // Stable pagination order.
          .order(
            'order_id',
            {
              ascending: true,
            }
          )
          .order(
            'restaurant_name',
            {
              ascending: true,
            }
          )
          .range(
            from,
            to
          );

        if (
          restaurant !== 'All'
        ) {
          query = query.eq(
            'restaurant_name',
            restaurant
          );
        }

        return query;
      }
    );
  };

  let current: any[] = [];
  let previous: any[] = [];
  let restaurantNames: string[] = [];

  try {
    [current, previous] =
      await Promise.all([
        fetchOrders(
          start,
          end
        ),
        fetchOrders(
          prevStart,
          prevEnd
        ),
      ]);

    /*
     * Get all restaurant names from the lightweight RPC.
     */
    const {
      data: restaurantRows,
      error: restaurantErr,
    } =
      await supabaseAdmin.rpc(
        'distinct_restaurants_dashboard'
      );

    if (restaurantErr) {
      throw new Error(
        restaurantErr.message
      );
    }

    const names: string[] =
      [];

    for (
      const row of
      (restaurantRows ?? []) as Array<{
        restaurant_name?:
          | string
          | null;
      }>
    ) {
      const name =
        String(
          row.restaurant_name ??
            ''
        ).trim();

      if (
        name &&
        !names.includes(name)
      ) {
        names.push(name);
      }
    }

    restaurantNames =
      names.sort(
        (a, b) =>
          a.localeCompare(b)
      );
  } catch (err: any) {
    return NextResponse.json(
      {
        error:
          err?.message ??
          'Failed to load dashboard data.',
      },
      { status: 500 }
    );
  }

  // -------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------

  const sum = (
    rows: any[],
    key: string
  ) =>
    rows.reduce(
      (total, row) => {
        const numberValue =
          Number(row[key]);

        return (
          total +
          (Number.isFinite(
            numberValue
          )
            ? numberValue
            : 0)
        );
      },
      0
    );

  const avgMinutesDiff = (
  rows: any[],
  startKey: string,
  endKey: string
) => {
  const differences: number[] = [];

  for (const row of rows) {
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

    /*
     * Match Power BI DATEDIFF(..., MINUTE):
     * count whole minute intervals and keep BOTH
     * positive (late) and negative (early) values.
     */
    differences.push(
      Math.trunc(
        (endTime - startTime) / 60000
      )
    );
  }

  if (differences.length === 0) {
    return null;
  }

  return (
    Math.round(
      (
        differences.reduce(
          (a, b) => a + b,
          0
        ) / differences.length
      ) * 100
    ) / 100
  );
};

  const hourOf = (
    row: any,
    key: string
  ): number | null => {
    const value =
      row[key];

    if (!value) {
      return null;
    }

    const date =
      new Date(value);

    return Number.isFinite(
      date.getTime()
    )
      ? date.getUTCHours()
      : null;
  };

  const avgHourOf = (
    rows: any[],
    key: string
  ) => {
    const hours =
      rows
        .map((row) =>
          hourOf(
            row,
            key
          )
        )
        .filter(
          (
            hour
          ): hour is number =>
            hour !== null
        );

    if (hours.length === 0) {
      return null;
    }

    return (
      Math.round(
        (
          hours.reduce(
            (a, b) => a + b,
            0
          ) /
          hours.length
        ) * 100
      ) / 100
    );
  };

  // -------------------------------------------------------------------
  // Total Stores
  // -------------------------------------------------------------------

  const totalStores =
    new Set(
      current
        .map(
          (row: any) =>
            row.store_id
        )
        .filter(
          (id) =>
            id !== null &&
            id !== undefined
        )
    ).size;

  // -------------------------------------------------------------------
  // Payment Method Breakdown
  // -------------------------------------------------------------------

  const paymentMethodBreakdown =
    Object.entries(
      current.reduce(
        (
          accumulator: Record<
            string,
            number
          >,
          row: any
        ) => {
          const method =
            row.payment_method ||
            'Unknown';

          accumulator[
            method
          ] =
            (accumulator[
              method
            ] || 0) + 1;

          return accumulator;
        },
        {}
      )
    ).map(
      ([method, count]) => ({
        method,
        count:
          count as number,
      })
    );

  // -------------------------------------------------------------------
  // Hourly Traffic
  // -------------------------------------------------------------------

  const hourlyTraffic =
    Array.from(
      { length: 24 },
      (_, hour) => ({
        hour,

        count:
          current.filter(
            (row: any) =>
              hourOf(
                row,
                'accepted_at'
              ) === hour
          ).length,
      })
    );

  // -------------------------------------------------------------------
  // Daily Series
  // -------------------------------------------------------------------

  const dailyBuckets =
    current.reduce(
      (
        accumulator: Record<
          string,
          any[]
        >,
        row: any
      ) => {
        if (!row.order_date) {
          return accumulator;
        }

        const parsedDate =
          new Date(
            row.order_date
          );

        if (
          !Number.isFinite(
            parsedDate.getTime()
          )
        ) {
          return accumulator;
        }

        const date =
          formatISO(
            parsedDate,
            {
              representation:
                'date',
            }
          );

        (
          accumulator[date] ??
          (accumulator[date] = [])
        ).push(row);

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

  for (
    let i = 0;
    i < spanDays;
    i++
  ) {
    const date =
      formatISO(
        subDays(
          end,
          spanDays -
            1 -
            i
        ),
        {
          representation:
            'date',
        }
      );

    const dailyOrderRows =
      dailyBuckets[
        date
      ] ?? [];

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
      count:
        dailyOrderRows.length,
    });
  }

  // -------------------------------------------------------------------
  // Final Response
  // -------------------------------------------------------------------

  return NextResponse.json({
    totalStores,

    totalOrders:
      current.length,

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

    paymentMethodBreakdown,

    hourlyTraffic,

    dailyFinancials,

    dailyOrders,

    restaurants:
      restaurantNames,
  });
}