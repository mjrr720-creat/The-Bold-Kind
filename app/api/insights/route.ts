import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, fetchAllRows } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';
export const maxDuration = 60;

type OrderRow = {
  order_id?: string | number | null;
  restaurant_name?: string | null;

  order_date?: string | null;
  order_month?: string | null;

  subtotal?: number | string | null;
  commission?: number | string | null;
  payout_amount?: number | string | null;

  order_status?: string | null;

  cancelled_at?: string | null;
  cancellation_reason?: string | null;
  cancellation_owner?: string | null;

  has_complaint?: boolean | string | number | null;
  complaint_reason?: string | null;

  is_subscription_order?:
    | boolean
    | string
    | number
    | null;

  delivery_type?: string | null;

  accepted_at?: string | null;
  ready_to_pickup_at?: string | null;

  estimated_delivery_at?: string | null;
  delivered_at?: string | null;

  discount_funded_by_you?:
    | number
    | string
    | null;

  talabat_funded_discount?:
    | number
    | string
    | null;

  marketing_fees_total?:
    | number
    | string
    | null;
};

/**
 * IMPORTANT:
 *
 * Do NOT use select('*').
 *
 * These are the only fields required by the insights
 * calculations.
 */
const INSIGHTS_COLUMNS = [
  'order_id',
  'restaurant_name',
  'order_date',
  'order_month',
  'subtotal',
  'commission',
  'payout_amount',
  'order_status',
  'cancelled_at',
  'cancellation_reason',
  'cancellation_owner',
  'has_complaint',
  'complaint_reason',
  'is_subscription_order',
  'delivery_type',
  'accepted_at',
  'ready_to_pickup_at',
  'estimated_delivery_at',
  'delivered_at',
  'discount_funded_by_you',
  'talabat_funded_discount',
  'marketing_fees_total',
].join(',');

/**
 * ------------------------------------------------------------
 * HELPERS
 * ------------------------------------------------------------
 */

function toNumber(
  value: unknown,
): number {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return 0;
  }

  const n = Number(value);

  return Number.isFinite(n)
    ? n
    : 0;
}

function round2(
  value: number,
): number {
  return Math.round(
    value * 100,
  ) / 100;
}

function parseDate(
  value: unknown,
): Date | null {
  if (!value) {
    return null;
  }

  const date = new Date(
    String(value),
  );

  if (
    !Number.isFinite(
      date.getTime(),
    )
  ) {
    return null;
  }

  return date;
}

function minutesBetween(
  startValue: unknown,
  endValue: unknown,
): number | null {
  const start =
    parseDate(startValue);

  const end =
    parseDate(endValue);

  if (!start || !end) {
    return null;
  }

  return (
    (end.getTime() -
      start.getTime()) /
    60000
  );
}

function getHour(
  value: unknown,
): number | null {
  const date =
    parseDate(value);

  if (!date) {
    return null;
  }

  return date.getUTCHours();
}

function getMonthKey(
  row: OrderRow,
): string {
  if (row.order_month) {
    return String(
      row.order_month,
    ).slice(0, 7);
  }

  if (!row.order_date) {
    return '';
  }

  const date =
    parseDate(
      row.order_date,
    );

  if (!date) {
    return '';
  }

  return date
    .toISOString()
    .slice(0, 7);
}

function addToMap(
  map: Map<string, number>,
  value: unknown,
): void {
  if (
    value === null ||
    value === undefined
  ) {
    return;
  }

  const key =
    String(value).trim();

  if (!key) {
    return;
  }

  map.set(
    key,
    (map.get(key) ?? 0) + 1,
  );
}

function mapToArray(
  map: Map<string, number>,
): Array<{
  label: string;
  value: number;
}> {
  return Array.from(
    map.entries(),
  )
    .map(
      ([label, value]) => ({
        label,
        value,
      }),
    )
    .sort(
      (a, b) =>
        b.value - a.value,
    );
}

function percentage(
  value: number,
  total: number,
): number {
  if (total <= 0) {
    return 0;
  }

  return round2(
    (value / total) * 100,
  );
}

function isTruthyBoolean(
  value: unknown,
): boolean {
  if (value === true) {
    return true;
  }

  if (
    typeof value === 'number'
  ) {
    return value !== 0;
  }

  if (
    typeof value === 'string'
  ) {
    const normalized =
      value
        .trim()
        .toLowerCase();

    return (
      normalized === 'true' ||
      normalized === '1' ||
      normalized === 'yes'
    );
  }

  return false;
}

function isCancelled(
  row: OrderRow,
): boolean {
  if (row.cancelled_at) {
    return true;
  }

  const status =
    String(
      row.order_status ?? '',
    )
      .trim()
      .toLowerCase();

  return (
    status.includes(
      'cancel',
    ) ||
    status === 'cancelled'
  );
}

function delayBucket(
  minutes: number,
): string {
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
}

/**
 * ------------------------------------------------------------
 * GET
 * ------------------------------------------------------------
 */

export async function GET(
  req: NextRequest,
) {
  try {
    const { searchParams } =
      new URL(req.url);

    const restaurant =
      searchParams.get(
        'restaurant',
      ) ?? 'All';

    const startDate =
      searchParams.get(
        'startDate',
      );

    const endDate =
      searchParams.get(
        'endDate',
      );

    /**
     * ----------------------------------------------------------
     * VALIDATION
     * ----------------------------------------------------------
     */

    if (
      !startDate ||
      !endDate
    ) {
      return NextResponse.json(
        {
          error:
            'startDate and endDate are required (yyyy-MM-dd).',
        },
        {
          status: 400,
        },
      );
    }

    const datePattern =
      /^\d{4}-\d{2}-\d{2}$/;

    if (
      !datePattern.test(
        startDate,
      ) ||
      !datePattern.test(
        endDate,
      )
    ) {
      return NextResponse.json(
        {
          error:
            'Invalid startDate or endDate. Expected yyyy-MM-dd.',
        },
        {
          status: 400,
        },
      );
    }

    const start =
      new Date(
        `${startDate}T00:00:00Z`,
      );

    const end =
      new Date(
        `${endDate}T00:00:00Z`,
      );

    if (
      !Number.isFinite(
        start.getTime(),
      ) ||
      !Number.isFinite(
        end.getTime(),
      )
    ) {
      return NextResponse.json(
        {
          error:
            'Invalid startDate or endDate.',
        },
        {
          status: 400,
        },
      );
    }

    if (
      end.getTime() <
      start.getTime()
    ) {
      return NextResponse.json(
        {
          error:
            'endDate cannot be earlier than startDate.',
        },
        {
          status: 400,
        },
      );
    }

    /**
     * End date is EXCLUSIVE in database query.
     *
     * Example:
     *
     * startDate = 2026-08-01
     * endDate   = 2026-08-21
     *
     * Query:
     *
     * >= 2026-08-01 00:00
     * <  2026-08-22 00:00
     */
    const endExclusive =
      new Date(end);

    endExclusive.setUTCDate(
      endExclusive.getUTCDate() +
        1,
    );

    const endExclusiveString =
      endExclusive
        .toISOString()
        .slice(0, 10);

    /**
     * ----------------------------------------------------------
     * FETCH DATA
     * ----------------------------------------------------------
     *
     * Biggest optimization:
     *
     * Old:
     *
     *   .select('*')
     *
     * New:
     *
     *   .select(INSIGHTS_COLUMNS)
     *
     * This reduces Supabase payload + JSON parsing.
     */
    let rows: OrderRow[] = [];

    try {
      rows =
        await fetchAllRows<OrderRow>(
          (from, to) => {
            let query =
              supabaseAdmin
                .from(
                  'orders_dashboard',
                )
                .select(
                  INSIGHTS_COLUMNS,
                )
                .gte(
                  'order_date',
                  `${startDate} 00:00`,
                )
                .lt(
                  'order_date',
                  `${endExclusiveString} 00:00`,
                )
                .order(
                  'order_id',
                  {
                    ascending: true,
                  },
                )
                .range(
                  from,
                  to,
                );

            /**
             * Restaurant filter stays
             * database-side.
             */
            if (
              restaurant !== 'All'
            ) {
              query =
                query.eq(
                  'restaurant_name',
                  restaurant,
                );
            }

            return query;
          },
        );
    } catch (error: any) {
      console.error(
        '[insights] fetch error:',
        error,
      );

      return NextResponse.json(
        {
          error:
            error?.message ??
            'Failed to load dashboard insights.',
        },
        {
          status: 500,
        },
      );
    }

    /**
     * ----------------------------------------------------------
     * AGGREGATION STRUCTURES
     * ----------------------------------------------------------
     *
     * Everything below is populated during ONE main pass.
     */

    const restaurantSales =
      new Map<
        string,
        number
      >();

    const restaurantPerformance =
      new Map<
        string,
        {
          sales: number;
          orders: number;
          commission: number;
          payout: number;
        }
      >();

    const orderStatus =
      new Map<
        string,
        number
      >();

    const cancellationReasons =
      new Map<
        string,
        number
      >();

    const cancellationOwners =
      new Map<
        string,
        number
      >();

    const complaintReasons =
      new Map<
        string,
        number
      >();

    const subscription =
      new Map<
        string,
        number
      >();

    const deliveryType =
      new Map<
        string,
        number
      >();

    const prepTime =
      new Map<
        string,
        {
          total: number;
          count: number;
          orders: number;
        }
      >();

    const delayBuckets =
      new Map<
        string,
        number
      >();

    const discountMonths =
      new Map<
        string,
        {
          restaurantFunded: number;
          talabatFunded: number;
        }
      >();

    const marketingMonths =
      new Map<
        string,
        number
      >();

    /**
     * 24 hourly buckets.
     */
    const salesByHour =
      new Array<number>(
        24,
      ).fill(0);

    const ordersByHour =
      new Array<number>(
        24,
      ).fill(0);

    /**
     * Sunday = 0
     * Monday = 1
     * ...
     * Saturday = 6
     */
    const weekdayCounts =
      new Array<number>(
        7,
      ).fill(0);

    /**
     * ----------------------------------------------------------
     * KPI TOTALS
     * ----------------------------------------------------------
     */

    let totalSales = 0;
    let totalCommission = 0;
    let totalPayout = 0;

    let totalRestaurantDiscount =
      0;

    let totalMarketingFees =
      0;

    let totalOrders = 0;

    let cancelledOrders = 0;

    let complaintOrders = 0;

    let onTimeOrders = 0;

    let deliveryEstimateCount =
      0;

    let totalPrepMinutes = 0;
    let prepMinutesCount = 0;

    let totalDelayMinutes = 0;
    let delayMinutesCount = 0;

    /**
     * ----------------------------------------------------------
     * ONE MAIN LOOP
     * ----------------------------------------------------------
     */

    for (const row of rows) {
      totalOrders += 1;

      /**
       * Financial values
       */
      const sales =
        toNumber(
          row.subtotal,
        );

      const commission =
        toNumber(
          row.commission,
        );

      const payout =
        toNumber(
          row.payout_amount,
        );

      const restaurantDiscount =
        toNumber(
          row.discount_funded_by_you,
        );

      const marketingFee =
        toNumber(
          row.marketing_fees_total,
        );

      totalSales += sales;

      totalCommission +=
        commission;

      totalPayout +=
        payout;

      totalRestaurantDiscount +=
        restaurantDiscount;

      totalMarketingFees +=
        marketingFee;

      /**
       * --------------------------------------------------------
       * RESTAURANT
       * --------------------------------------------------------
       */

      const restaurantName =
        String(
          row.restaurant_name ??
            '',
        ).trim();

      if (
        restaurantName
      ) {
        restaurantSales.set(
          restaurantName,
          (
            restaurantSales.get(
              restaurantName,
            ) ?? 0
          ) + sales,
        );

        const existing =
          restaurantPerformance.get(
            restaurantName,
          ) ?? {
            sales: 0,
            orders: 0,
            commission: 0,
            payout: 0,
          };

        existing.sales +=
          sales;

        existing.orders +=
          1;

        existing.commission +=
          commission;

        existing.payout +=
          payout;

        restaurantPerformance.set(
          restaurantName,
          existing,
        );

        /**
         * Prep time per restaurant.
         */
        const prep =
          minutesBetween(
            row.accepted_at,
            row.ready_to_pickup_at,
          );

        const prepEntry =
          prepTime.get(
            restaurantName,
          ) ?? {
            total: 0,
            count: 0,
            orders: 0,
          };

        prepEntry.orders += 1;

        if (
          prep !== null
        ) {
          prepEntry.total +=
            prep;

          prepEntry.count +=
            1;

          totalPrepMinutes +=
            prep;

          prepMinutesCount +=
            1;
        }

        prepTime.set(
          restaurantName,
          prepEntry,
        );
      }

      /**
       * --------------------------------------------------------
       * STATUS
       * --------------------------------------------------------
       */

      addToMap(
        orderStatus,
        row.order_status ??
          'Unknown',
      );

      /**
       * --------------------------------------------------------
       * CANCELLATION
       * --------------------------------------------------------
       */

      if (
        isCancelled(row)
      ) {
        cancelledOrders +=
          1;

        addToMap(
          cancellationReasons,
          row.cancellation_reason ??
            'Unknown',
        );

        addToMap(
          cancellationOwners,
          row.cancellation_owner ??
            'Unknown',
        );
      }

      /**
       * --------------------------------------------------------
       * COMPLAINT
       * --------------------------------------------------------
       */

      if (
        isTruthyBoolean(
          row.has_complaint,
        )
      ) {
        complaintOrders +=
          1;

        addToMap(
          complaintReasons,
          row.complaint_reason ??
            'Unknown',
        );
      }

      /**
       * --------------------------------------------------------
       * SUBSCRIPTION
       * --------------------------------------------------------
       */

      const subscriptionLabel =
        isTruthyBoolean(
          row.is_subscription_order,
        )
          ? 'Subscription'
          : 'Non-subscription';

      subscription.set(
        subscriptionLabel,
        (
          subscription.get(
            subscriptionLabel,
          ) ?? 0
        ) + 1,
      );

      /**
       * --------------------------------------------------------
       * DELIVERY TYPE
       * --------------------------------------------------------
       */

      addToMap(
        deliveryType,
        row.delivery_type ??
          'Unknown',
      );

      /**
       * --------------------------------------------------------
       * HOURLY + WEEKDAY
       * --------------------------------------------------------
       *
       * Based on order_date.
       */
      const orderDate =
        parseDate(
          row.order_date,
        );

      if (orderDate) {
        const hour =
          orderDate.getUTCHours();

        salesByHour[hour] +=
          sales;

        ordersByHour[hour] +=
          1;

        const weekday =
          orderDate.getUTCDay();

        weekdayCounts[
          weekday
        ] += 1;
      }

      /**
       * --------------------------------------------------------
       * PREP TIME
       * --------------------------------------------------------
       *
       * Overall prep KPI.
       */
      const prepOverall =
        minutesBetween(
          row.accepted_at,
          row.ready_to_pickup_at,
        );

      if (
        prepOverall !== null
      ) {
        /**
         * Already added to totals above
         * when restaurantName exists.
         *
         * If restaurantName is missing,
         * add it here.
         */
        if (
          !restaurantName
        ) {
          totalPrepMinutes +=
            prepOverall;

          prepMinutesCount +=
            1;
        }
      }

      /**
       * --------------------------------------------------------
       * DELIVERY DELAY
       * --------------------------------------------------------
       */
      const delay =
        minutesBetween(
          row.estimated_delivery_at,
          row.delivered_at,
        );

      if (
        delay !== null
      ) {
        totalDelayMinutes +=
          delay;

        delayMinutesCount +=
          1;

        const bucket =
          delayBucket(delay);

        delayBuckets.set(
          bucket,
          (
            delayBuckets.get(
              bucket,
            ) ?? 0
          ) + 1,
        );
      }

      /**
       * --------------------------------------------------------
       * ON-TIME DELIVERY
       * --------------------------------------------------------
       */
      const estimated =
        parseDate(
          row.estimated_delivery_at,
        );

      const delivered =
        parseDate(
          row.delivered_at,
        );

      if (
        estimated &&
        delivered
      ) {
        deliveryEstimateCount +=
          1;

        if (
          delivered.getTime() <=
          estimated.getTime()
        ) {
          onTimeOrders +=
            1;
        }
      }

      /**
       * --------------------------------------------------------
       * MONTHLY DISCOUNTS / MARKETING
       * --------------------------------------------------------
       */
      const month =
        getMonthKey(row);

      if (month) {
        const discount =
          discountMonths.get(
            month,
          ) ?? {
            restaurantFunded: 0,
            talabatFunded: 0,
          };

        discount.restaurantFunded +=
          restaurantDiscount;

        discount.talabatFunded +=
          toNumber(
            row.talabat_funded_discount,
          );

        discountMonths.set(
          month,
          discount,
        );

        marketingMonths.set(
          month,
          (
            marketingMonths.get(
              month,
            ) ?? 0
          ) + marketingFee,
        );
      }
    }

    /**
     * ----------------------------------------------------------
     * TOP RESTAURANTS
     * ----------------------------------------------------------
     */

    const topRestaurantsBySales =
      Array.from(
        restaurantSales.entries(),
      )
        .sort(
          (a, b) =>
            b[1] - a[1],
        )
        .slice(0, 10)
        .map(
          ([label, value]) => ({
            label,
            value: round2(value),
          }),
        );

    /**
     * ----------------------------------------------------------
     * ORDER STATUS
     * ----------------------------------------------------------
     */

    const orderStatusBreakdown =
      mapToArray(
        orderStatus,
      );

    /**
     * ----------------------------------------------------------
     * CANCELLATIONS
     * ----------------------------------------------------------
     */

    const cancellationReasonsResult =
      mapToArray(
        cancellationReasons,
      )
        .slice(0, 10);

    const cancellationOwnersResult =
      mapToArray(
        cancellationOwners,
      );

    /**
     * ----------------------------------------------------------
     * WEEKDAY
     * ----------------------------------------------------------
     *
     * Monday first because that is generally
     * how dashboard charts display weekdays.
     */
    const weekdayNames = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];

    const mondayFirst =
      [
        1,
        2,
        3,
        4,
        5,
        6,
        0,
      ];

    const ordersByWeekday =
      mondayFirst.map(
        (index) => ({
          label:
            weekdayNames[index],
          value:
            weekdayCounts[index],
        }),
      );

    /**
     * ----------------------------------------------------------
     * SALES BY HOUR
     * ----------------------------------------------------------
     */

    const salesByHourResult =
      salesByHour.map(
        (value, hour) => ({
          label:
            String(hour),
          value:
            round2(value),
        }),
      );

    /**
     * ----------------------------------------------------------
     * HOURLY ORDER COUNTS
     * ----------------------------------------------------------
     */

    const hourlyOrderCounts =
      ordersByHour.map(
        (value, hour) => ({
          label:
            String(hour),
          value,
        }),
      );

    /**
     * ----------------------------------------------------------
     * PREP TIME BY RESTAURANT
     * ----------------------------------------------------------
     */

    const prepTimeByRestaurant =
      Array.from(
        prepTime.entries(),
      )
        .filter(
          ([, value]) =>
            value.count > 0,
        )
        .sort(
          (a, b) =>
            b[1].orders -
            a[1].orders,
        )
        .map(
          ([
            label,
            value,
          ]) => ({
            label,

            value:
              round2(
                value.total /
                  value.count,
              ),
          }),
        );

    /**
     * ----------------------------------------------------------
     * DELIVERY DELAY BUCKETS
     * ----------------------------------------------------------
     */

    const delayOrder = [
      'Early',
      'On Time (0-5m)',
      'Slightly Late (5-15m)',
      'Late (15-30m)',
      'Very Late (>30m)',
    ];

    const deliveryDelayBuckets =
      delayOrder
        .map(
          (label) => ({
            label,
            value:
              delayBuckets.get(
                label,
              ) ?? 0,
          }),
        )
        .filter(
          (item) =>
            item.value > 0,
        );

    /**
     * ----------------------------------------------------------
     * MONTHLY DATA
     * ----------------------------------------------------------
     */

    const months = Array.from(
      new Set([
        ...discountMonths.keys(),
        ...marketingMonths.keys(),
      ]),
    ).sort();

    const discountFundingByMonth =
      months.map(
        (month) => {
          const value =
            discountMonths.get(
              month,
            ) ?? {
              restaurantFunded: 0,
              talabatFunded: 0,
            };

          return {
            month,

            restaurantFunded:
              round2(
                value.restaurantFunded,
              ),

            talabatFunded:
              round2(
                value.talabatFunded,
              ),
          };
        },
      );

    const marketingCostByMonth =
      months.map(
        (month) => ({
          label:
            month,

          value:
            round2(
              marketingMonths.get(
                month,
              ) ?? 0,
            ),
        }),
      );

    /**
     * ----------------------------------------------------------
     * COMPLAINTS
     * ----------------------------------------------------------
     */

    const complaintsByReason =
      mapToArray(
        complaintReasons,
      );

    /**
     * ----------------------------------------------------------
     * SUBSCRIPTIONS
     * ----------------------------------------------------------
     */

    const subscriptionBreakdown =
      mapToArray(
        subscription,
      );

    /**
     * ----------------------------------------------------------
     * DELIVERY TYPE
     * ----------------------------------------------------------
     */

    const deliveryTypeBreakdown =
      mapToArray(
        deliveryType,
      );

    /**
     * ----------------------------------------------------------
     * RESTAURANT PERFORMANCE
     * ----------------------------------------------------------
     */

    const restaurantPerformanceResult =
      Array.from(
        restaurantPerformance.entries(),
      )
        .map(
          ([
            restaurantName,
            value,
          ]) => ({
            restaurantName,

            sales:
              round2(
                value.sales,
              ),

            orders:
              value.orders,

            avgOrderValue:
              value.orders > 0
                ? round2(
                    value.sales /
                      value.orders,
                  )
                : 0,

            commission:
              round2(
                value.commission,
              ),

            payout:
              round2(
                value.payout,
              ),
          }),
        )
        .sort(
          (a, b) =>
            b.sales - a.sales,
        );

    /**
     * ----------------------------------------------------------
     * KPIs
     * ----------------------------------------------------------
     */

    const avgOrderValue =
      totalOrders > 0
        ? round2(
            totalSales /
              totalOrders,
          )
        : 0;

    const commissionPct =
      percentage(
        totalCommission,
        totalSales,
      );

    const payoutPct =
      percentage(
        totalPayout,
        totalSales,
      );

    const cancellationPct =
      percentage(
        cancelledOrders,
        totalOrders,
      );

    const complaintPct =
      percentage(
        complaintOrders,
        totalOrders,
      );

    const onTimeDeliveryPct =
      percentage(
        onTimeOrders,
        deliveryEstimateCount,
      );

    const avgPrepTimeMin =
      prepMinutesCount > 0
        ? round2(
            totalPrepMinutes /
              prepMinutesCount,
          )
        : 0;

    const avgDelayVsEstimateMin =
      delayMinutesCount > 0
        ? round2(
            totalDelayMinutes /
              delayMinutesCount,
          )
        : 0;

    const marketingPct =
      percentage(
        totalMarketingFees,
        totalSales,
      );

    /**
     * ----------------------------------------------------------
     * FINAL RESPONSE
     * ----------------------------------------------------------
     *
     * Keep these property names stable so existing
     * frontend components don't need changes.
     */
    return NextResponse.json({
      kpis: {
        avgOrderValue,

        commissionPct,

        payoutPct,

        cancellationPct,

        onTimeDeliveryPct,

        complaintPct,

        restaurantDiscount:
          round2(
            totalRestaurantDiscount,
          ),

        marketingPct,

        avgPrepTimeMin,

        avgDelayVsEstimateMin,

        totalOrders,

        totalSales:
          round2(
            totalSales,
          ),

        totalCommission:
          round2(
            totalCommission,
          ),

        totalPayout:
          round2(
            totalPayout,
          ),

        cancelledOrders,

        complaintOrders,
      },

      topRestaurantsBySales,

      orderStatusBreakdown,

      cancellationReasons:
        cancellationReasonsResult,

      cancellationOwners:
        cancellationOwnersResult,

      ordersByWeekday,

      salesByHour:
        salesByHourResult,

      hourlyOrderCounts,

      prepTimeByRestaurant,

      deliveryDelayBuckets,

      discountFundingByMonth,

      marketingCostByMonth,

      complaintsByReason,

      subscriptionBreakdown,

      deliveryTypeBreakdown,

      restaurantPerformance:
        restaurantPerformanceResult,
    });
  } catch (error: any) {
    console.error(
      '[insights] unexpected error:',
      error,
    );

    return NextResponse.json(
      {
        error:
          error?.message ??
          'Unexpected error while loading dashboard insights.',
      },
      {
        status: 500,
      },
    );
  }
}