import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, fetchAllRows } from '@/lib/supabaseAdmin';
import { differenceInCalendarDays, subDays, formatISO } from 'date-fns';

export const runtime = 'nodejs';
export const maxDuration = 60;

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

  const spanDays =
    differenceInCalendarDays(end, start) + 1;

  const prevEnd =
    subDays(start, 1);

  const prevStart =
    subDays(prevEnd, spanDays - 1);

  const fetchOrders = (
  rangeStart: Date,
  rangeEnd: Date
) => {
  const rangeStartDb =
    `${formatISO(rangeStart, {
      representation: 'date'
    })} 00:00`;

  const rangeEndDb =
    `${formatISO(rangeEnd, {
      representation: 'date'
    })} 23:59`;

  return fetchAllRows<any>((from, to) => {
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
      .range(from, to);

    if (restaurant !== 'All') {
      query = query.eq(
        'restaurant_name',
        restaurant
      );
    }

    return query;
  });
};

  let current: any[] = [];
  let previous: any[] = [];
  let restaurantNames: string[] = [];

  try {
    [current, previous] =
      await Promise.all([
        fetchOrders(start, end),
        fetchOrders(prevStart, prevEnd),
      ]);

    /*
     * Restaurant list is built directly from the normalized view.
     * No RPC is required.
     */
    const { data: restaurantRows, error: restaurantErr } =
  await supabaseAdmin.rpc(
    'distinct_restaurants_dashboard'
  );

if (restaurantErr) {
  throw new Error(restaurantErr.message);
}

restaurantNames =
  (restaurantRows ?? [])
    .map((row: any) => row.restaurant_name)
    .filter(
      (name: any) =>
        typeof name === 'string' &&
        name.trim().length > 0
    );

    restaurantNames = Array.from(
  new Set<string>(
    restaurantRows
      .map(
        (row: any) =>
          String(row.restaurant_name ?? '').trim()
      )
      .filter(
        (name: string) =>
          name.length > 0
      )
  )
).sort((a, b) =>
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

  const sum = (
    rows: any[],
    key: string
  ) =>
    rows.reduce(
      (total, row) => {
        const value =
          Number(row[key]);

        return (
          total +
          (Number.isFinite(value)
            ? value
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
    const values: number[] = [];

    for (const row of rows) {
      const startValue =
        row[startKey];

      const endValue =
        row[endKey];

      if (!startValue || !endValue) {
        continue;
      }

      const startTime =
        new Date(
          startValue
        ).getTime();

      const endTime =
        new Date(
          endValue
        ).getTime();

      if (
        !Number.isFinite(startTime) ||
        !Number.isFinite(endTime)
      ) {
        continue;
      }

      values.push(
        (endTime - startTime) /
          60000
      );
    }

    if (values.length === 0) {
      return null;
    }

    return Math.round(
      (
        values.reduce(
          (a, b) => a + b,
          0
        ) / values.length
      ) * 100
    ) / 100;
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
          hourOf(row, key)
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

    return Math.round(
      (
        hours.reduce(
          (a, b) => a + b,
          0
        ) / hours.length
      ) * 100
    ) / 100;
  };

  const totalStores =
    new Set(
      current
        .map(
          (row) =>
            row.store_id
        )
        .filter(
          (id) =>
            id !== null &&
            id !== undefined
        )
    ).size;

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

          accumulator[method] =
            (accumulator[method] ||
              0) + 1;

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

  /*
   * Daily series
   */
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

        const date =
          formatISO(
            new Date(
              row.order_date
            ),
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
          spanDays - 1 - i
        ),
        {
          representation:
            'date',
        }
      );

    const rows =
      dailyBuckets[date] ?? [];

    dailyFinancials.push({
      date,

      sales:
        Math.round(
          sum(
            rows,
            'subtotal'
          ) * 100
        ) / 100,

      commission:
        Math.round(
          sum(
            rows,
            'commission'
          ) * 100
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