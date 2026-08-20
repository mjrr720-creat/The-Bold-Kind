import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, fetchAllRows } from '@/lib/supabaseAdmin';
import { formatISO } from 'date-fns';

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

  let rows: any[];

  try {
    rows = await fetchAllRows<any>((from, to) => {
      let query = supabaseAdmin
        .from('orders_dashboard')
        .select('*')
        .gte(
          'order_date',
          start.toISOString()
        )
        .lte(
          'order_date',
          end.toISOString()
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
  } catch (err: any) {
    return NextResponse.json(
      {
        error:
          err?.message ??
          'Failed to load dashboard insights.',
      },
      { status: 500 }
    );
  }

  // -------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------

  const num = (value: unknown) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  };

  const sum = (
    arr: any[],
    key: string
  ) =>
    arr.reduce(
      (acc, row) =>
        acc + num(row[key]),
      0
    );

  const pct = (
    numerator: number,
    denominator: number
  ) =>
    denominator > 0
      ? Math.round(
          (numerator / denominator) * 10000
        ) / 100
      : null;

  const minutesBetween = (
    row: any,
    startKey: string,
    endKey: string
  ): number | null => {
    const startValue =
      row[startKey];

    const endValue =
      row[endKey];

    if (!startValue || !endValue) {
      return null;
    }

    const startMs =
      new Date(startValue).getTime();

    const endMs =
      new Date(endValue).getTime();

    if (
      !Number.isFinite(startMs) ||
      !Number.isFinite(endMs)
    ) {
      return null;
    }

    return (
      (endMs - startMs) / 60000
    );
  };

  const groupCount = (
    arr: any[],
    keyFn: (
      row: any
    ) => string | null | undefined
  ): Record<string, number> => {
    const result: Record<
      string,
      number
    > = {};

    for (const row of arr) {
      const key = keyFn(row);

      if (
        key === null ||
        key === undefined ||
        key === ''
      ) {
        continue;
      }

      result[key] =
        (result[key] || 0) + 1;
    }

    return result;
  };

  const toSortedLabelValue = (
    map: Record<string, number>,
    topN?: number
  ): {
    label: string;
    value: number;
  }[] => {
    const list =
      Object.entries(map).map(
        ([label, value]) => ({
          label,
          value,
        })
      );

    list.sort(
      (a, b) =>
        b.value - a.value
    );

    return topN
      ? list.slice(0, topN)
      : list;
  };

  const totalOrders =
    rows.length;

  const totalSubtotal =
    sum(rows, 'subtotal');

  // -------------------------------------------------------------------
  // KPIs
  // -------------------------------------------------------------------

  const isCancelled = (
    row: any
  ) =>
    Boolean(row.cancelled_at) ||
    /cancel/i.test(
      String(
        row.order_status ?? ''
      )
    );

  const cancelledCount =
    rows.filter(
      isCancelled
    ).length;

  const withBothDeliveryTimestamps =
    rows.filter(
      (row) =>
        row.delivered_at &&
        row.estimated_delivery_at
    );

  const onTimeCount =
    withBothDeliveryTimestamps.filter(
      (row) =>
        new Date(
          row.delivered_at
        ).getTime() <=
        new Date(
          row.estimated_delivery_at
        ).getTime()
    ).length;

  const complaintCount =
    rows.filter(
      (row) =>
        row.has_complaint === true
    ).length;

  const kpis = {
    avgOrderValue:
      totalOrders > 0
        ? Math.round(
            (
              totalSubtotal /
              totalOrders
            ) * 100
          ) / 100
        : null,

    commissionPct:
      pct(
        sum(
          rows,
          'commission'
        ),
        totalSubtotal
      ),

    payoutPct:
      pct(
        sum(
          rows,
          'payout_amount'
        ),
        totalSubtotal
      ),

    cancellationPct:
      pct(
        cancelledCount,
        totalOrders
      ),

    onTimeDeliveryPct:
      pct(
        onTimeCount,
        withBothDeliveryTimestamps.length
      ),

    complaintPct:
      pct(
        complaintCount,
        totalOrders
      ),

    restaurantDiscount:
      Math.round(
        sum(
          rows,
          'discount_funded_by_you'
        ) * 100
      ) / 100,

    marketingPct:
      pct(
        sum(
          rows,
          'marketing_fees_total'
        ),
        totalSubtotal
      ),
  };

  // -------------------------------------------------------------------
  // 1. Top 10 Restaurants by Sales
  // -------------------------------------------------------------------

  const salesByRestaurant:
    Record<string, number> = {};

  for (const row of rows) {
    const name =
      row.restaurant_name;

    if (!name) {
      continue;
    }

    salesByRestaurant[name] =
      (salesByRestaurant[name] || 0) +
      num(row.subtotal);
  }

  const topRestaurantsBySales =
    Object.entries(
      salesByRestaurant
    )
      .map(
        ([label, value]) => ({
          label,
          value:
            Math.round(
              value * 100
            ) / 100,
        })
      )
      .sort(
        (a, b) =>
          b.value - a.value
      )
      .slice(0, 10);

  // -------------------------------------------------------------------
  // 2. Order Status
  // 3. Cancellation Reasons
  // 4. Cancellation Owner
  // -------------------------------------------------------------------

  const orderStatusBreakdown =
    toSortedLabelValue(
      groupCount(
        rows,
        (row) =>
          row.order_status
      )
    );

  const cancellationReasons =
    toSortedLabelValue(
      groupCount(
        rows,
        (row) =>
          row.cancellation_reason
      ),
      5
    );

  const cancellationOwners =
    toSortedLabelValue(
      groupCount(
        rows,
        (row) =>
          row.cancellation_owner
      )
    );

  // -------------------------------------------------------------------
  // 6. Orders by Weekday
  // -------------------------------------------------------------------

  const WEEKDAY_NAMES = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];

  const weekdayCounts =
    new Array(7).fill(0);

  for (const row of rows) {
    if (!row.order_date) {
      continue;
    }

    const date =
      new Date(
        row.order_date
      );

    if (
      !Number.isFinite(
        date.getTime()
      )
    ) {
      continue;
    }

    weekdayCounts[
      date.getUTCDay()
    ] += 1;
  }

  const MONDAY_FIRST_ORDER = [
    1, 2, 3, 4, 5, 6, 0,
  ];

  const ordersByWeekday =
    MONDAY_FIRST_ORDER.map(
      (index) => ({
        label:
          WEEKDAY_NAMES[index],
        value:
          weekdayCounts[index],
      })
    );

  // -------------------------------------------------------------------
  // 7. Sales by Hour
  // 8. Order Traffic Heatmap
  // -------------------------------------------------------------------

  const salesByHourArr =
    new Array(24).fill(0);

  const countByHourArr =
    new Array(24).fill(0);

  for (const row of rows) {
    if (!row.order_date) {
      continue;
    }

    const date =
      new Date(
        row.order_date
      );

    if (
      !Number.isFinite(
        date.getTime()
      )
    ) {
      continue;
    }

    const hour =
      date.getUTCHours();

    salesByHourArr[hour] +=
      num(row.subtotal);

    countByHourArr[hour] += 1;
  }

  const salesByHour =
    salesByHourArr.map(
      (value, hour) => ({
        label: String(hour),
        value:
          Math.round(
            value * 100
          ) / 100,
      })
    );

  const hourlyOrderCounts =
    countByHourArr.map(
      (value, hour) => ({
        label: String(hour),
        value,
      })
    );

  // -------------------------------------------------------------------
  // 9. Prep Time by Restaurant
  // -------------------------------------------------------------------

  const prepByRestaurant:
    Record<
      string,
      {
        totalMin: number;
        count: number;
        orders: number;
      }
    > = {};

  for (const row of rows) {
    const name =
      row.restaurant_name;

    if (!name) {
      continue;
    }

    if (
      !prepByRestaurant[name]
    ) {
      prepByRestaurant[name] = {
        totalMin: 0,
        count: 0,
        orders: 0,
      };
    }

    prepByRestaurant[name]
      .orders += 1;

    const diff =
      minutesBetween(
        row,
        'accepted_at',
        'ready_to_pickup_at'
      );

    if (diff !== null) {
      prepByRestaurant[name]
        .totalMin += diff;

      prepByRestaurant[name]
        .count += 1;
    }
  }

  const prepTimeByRestaurant =
    Object.entries(
      prepByRestaurant
    )
      .filter(
        ([, value]) =>
          value.count > 0
      )
      .sort(
        (a, b) =>
          b[1].orders -
          a[1].orders
      )
      .slice(0, 15)
      .map(
        ([label, value]) => ({
          label,
          value:
            Math.round(
              (
                value.totalMin /
                value.count
              ) * 100
            ) / 100,
        })
      );

  // -------------------------------------------------------------------
  // 10. Delivery Delay Buckets
  // -------------------------------------------------------------------

  const delayCategory = (
    minutes: number
  ): string => {
    if (minutes < 0) {
      return 'Early';
    }

    if (minutes <= 5) {
      return 'On Time (0-5m)';
    }

    if (minutes <= 15) {
      return 'Slightly Late (5-15m)';
    }

    if (minutes <= 30) {
      return 'Late (15-30m)';
    }

    return 'Very Late (>30m)';
  };

  const delayBucketCounts:
    Record<string, number> = {};

  for (const row of rows) {
    const diff =
      minutesBetween(
        row,
        'estimated_delivery_at',
        'delivered_at'
      );

    if (diff === null) {
      continue;
    }

    const category =
      delayCategory(diff);

    delayBucketCounts[category] =
      (delayBucketCounts[category] || 0) +
      1;
  }

  const DELAY_ORDER = [
    'Early',
    'On Time (0-5m)',
    'Slightly Late (5-15m)',
    'Late (15-30m)',
    'Very Late (>30m)',
  ];

  const deliveryDelayBuckets =
    DELAY_ORDER
      .filter(
        (category) =>
          delayBucketCounts[
            category
          ] > 0
      )
      .map(
        (category) => ({
          label: category,
          value:
            delayBucketCounts[
              category
            ],
        })
      );

  // -------------------------------------------------------------------
  // 11. Discount Funding by Month
  // 12. Marketing Cost by Month
  // -------------------------------------------------------------------

  const monthKeyOf = (
    row: any
  ) => {
    if (row.order_month) {
      return String(
        row.order_month
      ).slice(0, 7);
    }

    if (!row.order_date) {
      return '';
    }

    const date =
      new Date(
        row.order_date
      );

    if (
      !Number.isFinite(
        date.getTime()
      )
    ) {
      return '';
    }

    return formatISO(
      date,
      {
        representation:
          'date',
      }
    ).slice(0, 7);
  };

  const discountByMonth:
    Record<
      string,
      {
        restaurantFunded: number;
        talabatFunded: number;
      }
    > = {};

  const marketingByMonth:
    Record<string, number> = {};

  for (const row of rows) {
    const month =
      monthKeyOf(row);

    if (!month) {
      continue;
    }

    if (
      !discountByMonth[month]
    ) {
      discountByMonth[month] = {
        restaurantFunded: 0,
        talabatFunded: 0,
      };
    }

    discountByMonth[month]
      .restaurantFunded +=
      num(
        row.discount_funded_by_you
      );

    discountByMonth[month]
      .talabatFunded +=
      num(
        row.talabat_funded_discount
      );

    marketingByMonth[month] =
      (marketingByMonth[month] || 0) +
      num(
        row.marketing_fees_total
      );
  }

  const sortedMonths =
    Object.keys(
      discountByMonth
    ).sort(
      (a, b) =>
        a.localeCompare(b)
    );

  const discountFundingByMonth =
    sortedMonths.map(
      (month) => ({
        month,

        restaurantFunded:
          Math.round(
            discountByMonth[month]
              .restaurantFunded *
              100
          ) / 100,

        talabatFunded:
          Math.round(
            discountByMonth[month]
              .talabatFunded *
              100
          ) / 100,
      })
    );

  const marketingCostByMonth =
    sortedMonths.map(
      (month) => ({
        label: month,

        value:
          Math.round(
            (
              marketingByMonth[month] ||
              0
            ) * 100
          ) / 100,
      })
    );

  // -------------------------------------------------------------------
  // 13. Complaints by Reason
  // 14. Subscription Orders
  // 15. Delivery Type
  // -------------------------------------------------------------------

  const complaintsByReason =
    toSortedLabelValue(
      groupCount(
        rows,
        (row) =>
          row.has_complaint
            ? row.complaint_reason
            : null
      )
    );

  const subscriptionBreakdown =
    toSortedLabelValue(
      groupCount(
        rows,
        (row) =>
          row.is_subscription_order
            ? 'Subscription'
            : 'Non-subscription'
      )
    );

  const deliveryTypeBreakdown =
    toSortedLabelValue(
      groupCount(
        rows,
        (row) =>
          row.delivery_type
      )
    );

  // -------------------------------------------------------------------
  // 16. Restaurant Performance
  // -------------------------------------------------------------------

  const restaurantAgg:
    Record<
      string,
      {
        sales: number;
        orders: number;
        commission: number;
        payout: number;
      }
    > = {};

  for (const row of rows) {
    const name =
      row.restaurant_name;

    if (!name) {
      continue;
    }

    if (
      !restaurantAgg[name]
    ) {
      restaurantAgg[name] = {
        sales: 0,
        orders: 0,
        commission: 0,
        payout: 0,
      };
    }

    restaurantAgg[name]
      .sales +=
      num(row.subtotal);

    restaurantAgg[name]
      .orders += 1;

    restaurantAgg[name]
      .commission +=
      num(row.commission);

    restaurantAgg[name]
      .payout +=
      num(row.payout_amount);
  }

  const restaurantPerformance =
    Object.entries(
      restaurantAgg
    )
      .map(
        ([restaurantName, value]) => ({
          restaurantName,

          sales:
            Math.round(
              value.sales * 100
            ) / 100,

          orders:
            value.orders,

          avgOrderValue:
            value.orders > 0
              ? Math.round(
                  (
                    value.sales /
                    value.orders
                  ) * 100
                ) / 100
              : null,

          commission:
            Math.round(
              value.commission *
                100
            ) / 100,

          payout:
            Math.round(
              value.payout *
                100
            ) / 100,
        })
      )
      .sort(
        (a, b) =>
          b.sales - a.sales
      );

  return NextResponse.json({
    kpis,
    topRestaurantsBySales,
    orderStatusBreakdown,
    cancellationReasons,
    cancellationOwners,
    ordersByWeekday,
    salesByHour,
    hourlyOrderCounts,
    prepTimeByRestaurant,
    deliveryDelayBuckets,
    discountFundingByMonth,
    marketingCostByMonth,
    complaintsByReason,
    subscriptionBreakdown,
    deliveryTypeBreakdown,
    restaurantPerformance,
  });
}