import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, fetchAllRows } from '@/lib/supabaseAdmin';
import { formatISO } from 'date-fns';

export const runtime = 'nodejs';
export const maxDuration = 60;

function normalizeOrder(row: any) {
  return {
    restaurant_name:
      row['Restaurant name'] ??
      row['restaurant_name'] ??
      '',

    order_id: Number(
      row['Order ID'] ??
      row['order_id'] ??
      0
    ),

    store_id:
      row['Store ID'] === null ||
      row['Store ID'] === undefined ||
      row['Store ID'] === ''
        ? null
        : Number(row['Store ID']),

    delivery_type:
      row['Delivery Type'] ??
      row['delivery_type'] ??
      null,

    payment_type:
      row['Payment type'] ??
      row['payment_type'] ??
      null,

    payment_method:
      row['Payment method'] ??
      row['payment_method'] ??
      null,

    is_subscription_order:
      Boolean(
        row['Is Subscription Order'] ??
        row['is_subscription_order'] ??
        false
      ),

    order_status:
      row['Order status'] ??
      row['order_status'] ??
      null,

    order_date:
      row['Order received at'] ??
      row['order_date'] ??
      null,

    accepted_at:
      row['Accepted at'] ??
      row['accepted_at'] ??
      null,

    estimated_ready_at:
      row['Estimated ready to pick up time'] ??
      row['estimated_ready_at'] ??
      null,

    ready_to_pickup_at:
      row['Ready to pick up at'] ??
      row['ready_to_pickup_at'] ??
      null,

    rider_near_pickup_at:
      row['Rider near pickup at'] ??
      row['rider_near_pickup_at'] ??
      null,

    in_delivery_at:
      row['In delivery at'] ??
      row['in_delivery_at'] ??
      null,

    estimated_delivery_at:
      row['Estimated delivery time'] ??
      row['estimated_delivery_at'] ??
      null,

    delivered_at:
      row['Delivered at'] ??
      row['delivered_at'] ??
      null,

    has_complaint:
      Boolean(
        row['Has Complaint?'] ??
        row['has_complaint'] ??
        false
      ),

    complaint_reason:
      row['Complaint Reason'] ??
      row['complaint_reason'] ??
      null,

    cancelled_at:
      row['Cancelled at'] ??
      row['cancelled_at'] ??
      null,

    cancellation_reason:
      row['Cancellation reason'] ??
      row['cancellation_reason'] ??
      null,

    cancellation_owner:
      row['Cancellation owner'] ??
      row['cancellation_owner'] ??
      null,

    subtotal: Number(
      row['Subtotal'] ??
      row['subtotal'] ??
      0
    ),

    discount_funded_by_you: Number(
      row['Discount Funded by you'] ??
      row['discount_funded_by_you'] ??
      0
    ),

    voucher_funded_by_you: Number(
      row['Voucher Funded by you'] ??
      row['voucher_funded_by_you'] ??
      0
    ),

    commission: Number(
      row['Commission'] ??
      row['commission'] ??
      0
    ),

    payout_amount: Number(
      row['Payout Amount'] ??
      row['payout_amount'] ??
      0
    ),

    marketing_fees_total: Number(
      row['Marketing Fees Total'] ??
      row['marketing_fees_total'] ??
      0
    ),

    marketing_fees: Number(
      row['Marketing Fees'] ??
      row['marketing_fees'] ??
      0
    ),

    talabat_funded_discount: Number(
      row['Talabat-Funded Discount'] ??
      row['talabat_funded_discount'] ??
      0
    ),

    tax_amount: Number(
      row['Tax Amount'] ??
      row['tax_amount'] ??
      0
    ),

    order_items:
      row['Order Items'] ??
      row['order_items'] ??
      null,

    order_month:
      row['order_month'] ??
      null
  };
}

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
          'startDate and endDate are required (yyyy-MM-dd).'
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
    const rawRows =
      await fetchAllRows<any>((from, to) => {
        let q = supabaseAdmin
          .from('orders')
          .select('*')
          .gte(
            'Order received at',
            start.toISOString()
          )
          .lte(
            'Order received at',
            end.toISOString()
          )
          .range(from, to);

        if (restaurant !== 'All') {
          q = q.eq(
            'Restaurant name',
            restaurant
          );
        }

        return q;
      });

    rows =
      rawRows.map(normalizeOrder);
  } catch (err: any) {
    return NextResponse.json(
      {
        error:
          err?.message ??
          'Failed to load orders'
      },
      { status: 500 }
    );
  }

  // -------------------------------------------------------------------
  // Null-safe helpers
  // -------------------------------------------------------------------

  const num = (v: unknown) => {
    const n = Number(v);
    return Number.isFinite(n)
      ? n
      : 0;
  };

  const sum = (
    arr: any[],
    key: string
  ) =>
    arr.reduce(
      (acc, r) =>
        acc + num(r[key]),
      0
    );

  const pct = (
    numerator: number,
    denominator: number
  ) =>
    denominator > 0
      ? Math.round(
          (numerator /
            denominator) *
            10000
        ) / 100
      : null;

  const minutesBetween = (
    r: any,
    startKey: string,
    endKey: string
  ): number | null => {
    const a = r[startKey];
    const b = r[endKey];

    if (!a || !b) {
      return null;
    }

    const sMs =
      new Date(a).getTime();

    const eMs =
      new Date(b).getTime();

    if (
      !Number.isFinite(sMs) ||
      !Number.isFinite(eMs)
    ) {
      return null;
    }

    return (
      (eMs - sMs) /
      60000
    );
  };

  const groupCount = (
    arr: any[],
    keyFn: (
      r: any
    ) => string | null | undefined
  ): Record<string, number> => {
    const acc: Record<
      string,
      number
    > = {};

    for (const r of arr) {
      const key =
        keyFn(r);

      if (
        key === null ||
        key === undefined ||
        key === ''
      ) {
        continue;
      }

      acc[key] =
        (acc[key] || 0) + 1;
    }

    return acc;
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
          value
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
    sum(
      rows,
      'subtotal'
    );

  // -------------------------------------------------------------------
  // KPIs
  // -------------------------------------------------------------------

  const isCancelled =
    (r: any) =>
      Boolean(r.cancelled_at) ||
      /cancel/i.test(
        String(
          r.order_status ?? ''
        )
      );

  const cancelledCount =
    rows.filter(
      isCancelled
    ).length;

  const withBothDeliveryTimestamps =
    rows.filter(
      (r) =>
        r.delivered_at &&
        r.estimated_delivery_at
    );

  const onTimeCount =
    withBothDeliveryTimestamps.filter(
      (r) =>
        new Date(
          r.delivered_at
        ).getTime() <=
        new Date(
          r.estimated_delivery_at
        ).getTime()
    ).length;

  const complaintCount =
    rows.filter(
      (r) =>
        r.has_complaint === true
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
      )
  };

  // -------------------------------------------------------------------
  // 1. Top 10 Restaurants by Sales
  // -------------------------------------------------------------------

  const salesByRestaurant:
    Record<string, number> = {};

  for (const r of rows) {
    const name =
      r.restaurant_name;

    if (!name) {
      continue;
    }

    salesByRestaurant[name] =
      (salesByRestaurant[name] ||
        0) +
      num(r.subtotal);
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
            ) / 100
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
        (r) =>
          r.order_status
      )
    );

  const cancellationReasons =
    toSortedLabelValue(
      groupCount(
        rows,
        (r) =>
          r.cancellation_reason
      ),
      5
    );

  const cancellationOwners =
    toSortedLabelValue(
      groupCount(
        rows,
        (r) =>
          r.cancellation_owner
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
    'Saturday'
  ];

  const weekdayCounts =
    new Array(7).fill(0);

  for (const r of rows) {
    if (!r.order_date) {
      continue;
    }

    const d =
      new Date(
        r.order_date
      );

    if (
      !Number.isFinite(
        d.getTime()
      )
    ) {
      continue;
    }

    weekdayCounts[
      d.getUTCDay()
    ] += 1;
  }

  const MONDAY_FIRST_ORDER = [
    1, 2, 3, 4, 5, 6, 0
  ];

  const ordersByWeekday =
    MONDAY_FIRST_ORDER.map(
      (i) => ({
        label:
          WEEKDAY_NAMES[i],
        value:
          weekdayCounts[i]
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

  for (const r of rows) {
    if (!r.order_date) {
      continue;
    }

    const d =
      new Date(
        r.order_date
      );

    if (
      !Number.isFinite(
        d.getTime()
      )
    ) {
      continue;
    }

    const h =
      d.getUTCHours();

    salesByHourArr[h] +=
      num(r.subtotal);

    countByHourArr[h] += 1;
  }

  const salesByHour =
    salesByHourArr.map(
      (value, hour) => ({
        label: String(hour),
        value:
          Math.round(
            value * 100
          ) / 100
      })
    );

  const hourlyOrderCounts =
    countByHourArr.map(
      (value, hour) => ({
        label: String(hour),
        value
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

  for (const r of rows) {
    const name =
      r.restaurant_name;

    if (!name) {
      continue;
    }

    if (
      !prepByRestaurant[name]
    ) {
      prepByRestaurant[name] = {
        totalMin: 0,
        count: 0,
        orders: 0
      };
    }

    prepByRestaurant[
      name
    ].orders += 1;

    const diff =
      minutesBetween(
        r,
        'accepted_at',
        'ready_to_pickup_at'
      );

    if (diff !== null) {
      prepByRestaurant[
        name
      ].totalMin += diff;

      prepByRestaurant[
        name
      ].count += 1;
    }
  }

  const prepTimeByRestaurant =
    Object.entries(
      prepByRestaurant
    )
      .filter(
        ([, v]) =>
          v.count > 0
      )
      .sort(
        (a, b) =>
          b[1].orders -
          a[1].orders
      )
      .slice(0, 15)
      .map(
        ([label, v]) => ({
          label,

          value:
            Math.round(
              (
                v.totalMin /
                v.count
              ) * 100
            ) / 100
        })
      );

  // -------------------------------------------------------------------
  // 10. Delivery Delay buckets
  // -------------------------------------------------------------------

  const delayCategory = (
    min: number
  ): string => {
    if (min < 0) {
      return 'Early';
    }

    if (min <= 5) {
      return 'On Time (0-5m)';
    }

    if (min <= 15) {
      return 'Slightly Late (5-15m)';
    }

    if (min <= 30) {
      return 'Late (15-30m)';
    }

    return 'Very Late (>30m)';
  };

  const delayBucketCounts:
    Record<string, number> =
    {};

  for (const r of rows) {
    const diff =
      minutesBetween(
        r,
        'estimated_delivery_at',
        'delivered_at'
      );

    if (diff === null) {
      continue;
    }

    const cat =
      delayCategory(diff);

    delayBucketCounts[cat] =
      (delayBucketCounts[cat] ||
        0) + 1;
  }

  const DELAY_ORDER = [
    'Early',
    'On Time (0-5m)',
    'Slightly Late (5-15m)',
    'Late (15-30m)',
    'Very Late (>30m)'
  ];

  const deliveryDelayBuckets =
    DELAY_ORDER
      .filter(
        (cat) =>
          delayBucketCounts[
            cat
          ] > 0
      )
      .map(
        (cat) => ({
          label: cat,
          value:
            delayBucketCounts[
              cat
            ]
        })
      );

  // -------------------------------------------------------------------
  // 11. Discount Funding by Month
  // 12. Marketing Cost by Month
  // -------------------------------------------------------------------

  const monthKeyOf = (
    r: any
  ) => {
    if (r.order_month) {
      return String(
        r.order_month
      ).slice(0, 7);
    }

    if (!r.order_date) {
      return '';
    }

    const d =
      new Date(
        r.order_date
      );

    if (
      !Number.isFinite(
        d.getTime()
      )
    ) {
      return '';
    }

    return formatISO(
      d,
      {
        representation:
          'date'
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
    Record<
      string,
      number
    > = {};

  for (const r of rows) {
    const month =
      monthKeyOf(r);

    if (!month) {
      continue;
    }

    if (
      !discountByMonth[
        month
      ]
    ) {
      discountByMonth[month] = {
        restaurantFunded: 0,
        talabatFunded: 0
      };
    }

    discountByMonth[
      month
    ].restaurantFunded +=
      num(
        r.discount_funded_by_you
      );

    discountByMonth[
      month
    ].talabatFunded +=
      num(
        r.talabat_funded_discount
      );

    marketingByMonth[
      month
    ] =
      (marketingByMonth[month] ||
        0) +
      num(
        r.marketing_fees_total
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
            discountByMonth[
              month
            ].restaurantFunded *
              100
          ) / 100,

        talabatFunded:
          Math.round(
            discountByMonth[
              month
            ].talabatFunded *
              100
          ) / 100
      })
    );

  const marketingCostByMonth =
    sortedMonths.map(
      (month) => ({
        label: month,

        value:
          Math.round(
            (
              marketingByMonth[
                month
              ] || 0
            ) * 100
          ) / 100
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
        (r) =>
          r.has_complaint
            ? r.complaint_reason
            : null
      )
    );

  const subscriptionBreakdown =
    toSortedLabelValue(
      groupCount(
        rows,
        (r) =>
          r.is_subscription_order
            ? 'Subscription'
            : 'Non-subscription'
      )
    );

  const deliveryTypeBreakdown =
    toSortedLabelValue(
      groupCount(
        rows,
        (r) =>
          r.delivery_type
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

  for (const r of rows) {
    const name =
      r.restaurant_name;

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
        payout: 0
      };
    }

    restaurantAgg[name]
      .sales +=
      num(r.subtotal);

    restaurantAgg[name]
      .orders += 1;

    restaurantAgg[name]
      .commission +=
      num(r.commission);

    restaurantAgg[name]
      .payout +=
      num(r.payout_amount);
  }

  const restaurantPerformance =
    Object.entries(
      restaurantAgg
    )
      .map(
        ([restaurantName, v]) => ({
          restaurantName,

          sales:
            Math.round(
              v.sales * 100
            ) / 100,

          orders:
            v.orders,

          avgOrderValue:
            v.orders > 0
              ? Math.round(
                  (
                    v.sales /
                    v.orders
                  ) * 100
                ) / 100
              : null,

          commission:
            Math.round(
              v.commission *
                100
            ) / 100,

          payout:
            Math.round(
              v.payout *
                100
            ) / 100
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
    restaurantPerformance
  });
}