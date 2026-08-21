import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, fetchAllRows } from '@/lib/supabaseAdmin';
import {
  differenceInCalendarDays,
  subDays,
  formatISO,
} from 'date-fns';

export const runtime = 'nodejs';
export const maxDuration = 60;

type OrderRow = {
  store_id?: string | number | null;
  restaurant_name?: string | null;

  order_date?: string | null;
  accepted_at?: string | null;
  ready_to_pickup_at?: string | null;
  estimated_delivery_at?: string | null;
  delivered_at?: string | null;
  in_delivery_at?: string | null;

  subtotal?: number | string | null;
  payout_amount?: number | string | null;
  commission?: number | string | null;

  marketing_fees?: number | string | null;
  tax_amount?: number | string | null;
  payout_after_food_cost?: number | string | null;
  voucher_funded_by_you?: number | string | null;

  payment_method?: string | null;
};

/**
 * Only fetch fields actually required by this endpoint.
 *
 * This replaces the old:
 *
 *   .select('*')
 *
 * which was transferring every column from orders_dashboard.
 */
const SUMMARY_COLUMNS = [
  'order_id',
  'store_id',
  'restaurant_name',
  'order_date',
  'accepted_at',
  'ready_to_pickup_at',
  'estimated_delivery_at',
  'delivered_at',
  'in_delivery_at',
  'subtotal',
  'commission',
  'payout_amount',
  'marketing_fees',
  'tax_amount',
  'payout_after_food_cost',
  'voucher_funded_by_you',
  'payment_method',
].join(',');

const toNumber = (
  value: unknown,
): number => {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return 0;
  }

  const numberValue = Number(value);

  return Number.isFinite(numberValue)
    ? numberValue
    : 0;
};

const round2 = (
  value: number,
): number => {
  return Math.round(value * 100) / 100;
};

const parseDate = (
  value: unknown,
): Date | null => {
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
};

/**
 * Matches the previous Power BI-style
 * whole-minute calculation.
 */
const minuteDifference = (
  startValue: unknown,
  endValue: unknown,
): number | null => {
  const start =
    parseDate(startValue);

  const end =
    parseDate(endValue);

  if (!start || !end) {
    return null;
  }

  return Math.trunc(
    (
      end.getTime() -
      start.getTime()
    ) / 60000,
  );
};

const getUtcHour = (
  value: unknown,
): number | null => {
  const date =
    parseDate(value);

  if (!date) {
    return null;
  }

  return date.getUTCHours();
};

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
     * ------------------------------------------------------------
     * VALIDATION
     * ------------------------------------------------------------
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
     * Exclusive end boundary.
     *
     * For:
     *
     *   2026-08-01 → 2026-08-21
     *
     * database query becomes:
     *
     *   >= 2026-08-01 00:00
     *   <  2026-08-22 00:00
     */
    const endExclusive =
      new Date(end);

    endExclusive.setUTCDate(
      endExclusive.getUTCDate() +
        1,
    );

    /**
     * Number of days in selected period.
     */
    const spanDays =
      differenceInCalendarDays(
        end,
        start,
      ) + 1;

    /**
     * ------------------------------------------------------------
     * PREVIOUS PERIOD
     * ------------------------------------------------------------
     *
     * Same number of days immediately before
     * the selected period.
     */
    const previousEnd =
      subDays(start, 1);

    const previousStart =
      subDays(
        previousEnd,
        spanDays - 1,
      );

    /**
     * ------------------------------------------------------------
     * DATABASE FETCH
     * ------------------------------------------------------------
     *
     * Important optimization:
     *
     * We no longer use:
     *
     *   .select('*')
     *
     * Only required columns are transferred.
     */
    const fetchOrders = (
      rangeStart: Date,
      rangeEndExclusive: Date,
    ): Promise<OrderRow[]> => {
      const rangeStartDb =
        `${formatISO(
          rangeStart,
          {
            representation:
              'date',
          },
        )} 00:00`;

      const rangeEndDb =
        `${formatISO(
          rangeEndExclusive,
          {
            representation:
              'date',
          },
        )} 00:00`;

      return fetchAllRows<OrderRow>(
        (from, to) => {
          let query =
            supabaseAdmin
              .from(
                'orders_dashboard',
              )
              .select(
                SUMMARY_COLUMNS,
              )
              .gte(
                'order_date',
                rangeStartDb,
              )
              .lt(
                'order_date',
                rangeEndDb,
              )
              /**
               * Stable ordering is important
               * for paginated fetches.
               */
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
    };

    /**
     * ------------------------------------------------------------
     * FETCH CURRENT + PREVIOUS + RESTAURANTS
     * ------------------------------------------------------------
     *
     * All independent requests run concurrently.
     */
    let current: OrderRow[] = [];
    let previous: OrderRow[] = [];
    let restaurantNames: string[] = [];

    try {
      const [
        currentRows,
        previousRows,
        restaurantResult,
      ] = await Promise.all([
        fetchOrders(
          start,
          endExclusive,
        ),

        fetchOrders(
          previousStart,
          start,
        ),

        supabaseAdmin.rpc(
          'distinct_restaurants_dashboard',
        ),
      ]);

      current =
        currentRows;

      previous =
        previousRows;

      if (
        restaurantResult.error
      ) {
        throw new Error(
          restaurantResult.error.message,
        );
      }

      /**
       * Use Set instead of:
       *
       *   names.includes(...)
       *
       * repeatedly.
       */
      const names =
        new Set<string>();

      for (
        const row of
        (restaurantResult.data ??
          []) as Array<{
          restaurant_name?:
            | string
            | null;
        }>
      ) {
        const name =
          String(
            row.restaurant_name ??
              '',
          ).trim();

        if (name) {
          names.add(name);
        }
      }

      restaurantNames =
        Array.from(names).sort(
          (a, b) =>
            a.localeCompare(b),
        );
    } catch (err: any) {
      console.error(
        '[summary] database fetch error:',
        err,
      );

      return NextResponse.json(
        {
          error:
            err?.message ??
            'Failed to load dashboard data.',
        },
        {
          status: 500,
        },
      );
    }

    /**
     * ------------------------------------------------------------
     * CURRENT PERIOD AGGREGATION
     * ------------------------------------------------------------
     *
     * Everything that can be calculated in one pass
     * is calculated in one pass.
     */

    const storeIds =
      new Set<
        string | number
      >();

    const paymentCounts =
      new Map<
        string,
        number
      >();

    /**
     * 24 hourly buckets.
     */
    const hourlyCounts =
      new Array<number>(
        24,
      ).fill(0);

    /**
     * Daily aggregated buckets.
     *
     * Instead of:
     *
     *   dailyBuckets[date] = rows[]
     *
     * we directly store the totals needed
     * by the frontend.
     */
    const dailyBuckets =
      new Map<
        string,
        {
          sales: number;
          commission: number;
          payout: number;
          count: number;
        }
      >();

    let totalSales = 0;
    let totalPayout = 0;
    let totalMarketingFees = 0;
    let totalTax = 0;
    let totalPayoutAfterFoodCost =
      0;
    let totalVoucherFundedByYou =
      0;

    let acceptedHourTotal = 0;
    let acceptedHourCount = 0;

    let prepMinuteTotal = 0;
    let prepMinuteCount = 0;

    let delayMinuteTotal = 0;
    let delayMinuteCount = 0;

    let deliveryMinuteTotal = 0;
    let deliveryMinuteCount = 0;

    /**
     * ONE LOOP THROUGH CURRENT ROWS
     */
    for (const row of current) {
      /**
       * Store count
       */
      if (
        row.store_id !==
          null &&
        row.store_id !==
          undefined
      ) {
        storeIds.add(
          row.store_id,
        );
      }

      /**
       * Financial totals
       */
      const subtotal =
        toNumber(
          row.subtotal,
        );

      const payout =
        toNumber(
          row.payout_amount,
        );

      const marketingFees =
        toNumber(
          row.marketing_fees,
        );

      const tax =
        toNumber(
          row.tax_amount,
        );

      const payoutAfterFoodCost =
        toNumber(
          row.payout_after_food_cost,
        );

      const voucherFundedByYou =
        toNumber(
          row.voucher_funded_by_you,
        );

      totalSales +=
        subtotal;

      totalPayout +=
        payout;

      totalMarketingFees +=
        marketingFees;

      totalTax +=
        tax;

      totalPayoutAfterFoodCost +=
        payoutAfterFoodCost;

      totalVoucherFundedByYou +=
        voucherFundedByYou;

      /**
       * Payment method
       */
      const paymentMethod =
        String(
          row.payment_method ??
            'Unknown',
        ).trim() ||
        'Unknown';

      paymentCounts.set(
        paymentMethod,
        (
          paymentCounts.get(
            paymentMethod,
          ) ?? 0
        ) + 1,
      );

      /**
       * Accepted hour
       *
       * This replaces the old:
       *
       * 24 × current.filter(...)
       *
       * approach.
       */
      const acceptedHour =
        getUtcHour(
          row.accepted_at,
        );

      if (
        acceptedHour !== null
      ) {
        hourlyCounts[
          acceptedHour
        ] += 1;

        acceptedHourTotal +=
          acceptedHour;

        acceptedHourCount +=
          1;
      }

      /**
       * Prep time
       */
      const prepMinutes =
        minuteDifference(
          row.accepted_at,
          row.ready_to_pickup_at,
        );

      if (
        prepMinutes !== null
      ) {
        prepMinuteTotal +=
          prepMinutes;

        prepMinuteCount +=
          1;
      }

      /**
       * Delay vs estimate
       */
      const delayMinutes =
        minuteDifference(
          row.estimated_delivery_at,
          row.delivered_at,
        );

      if (
        delayMinutes !== null
      ) {
        delayMinuteTotal +=
          delayMinutes;

        delayMinuteCount +=
          1;
      }

      /**
       * Delivery time
       */
      const deliveryMinutes =
        minuteDifference(
          row.in_delivery_at,
          row.delivered_at,
        );

      if (
        deliveryMinutes !== null
      ) {
        deliveryMinuteTotal +=
          deliveryMinutes;

        deliveryMinuteCount +=
          1;
      }

      /**
       * Daily aggregation
       */
      if (row.order_date) {
        const parsedDate =
          parseDate(
            row.order_date,
          );

        if (parsedDate) {
          const date =
            formatISO(
              parsedDate,
              {
                representation:
                  'date',
              },
            );

          const existing =
            dailyBuckets.get(
              date,
            ) ?? {
              sales: 0,
              commission: 0,
              payout: 0,
              count: 0,
            };

          existing.sales +=
            subtotal;

          existing.commission +=
            toNumber(
              row.commission,
            );

          existing.payout +=
            payout;

          existing.count +=
            1;

          dailyBuckets.set(
            date,
            existing,
          );
        }
      }
    }

    /**
     * ------------------------------------------------------------
     * PAYMENT METHOD
     * ------------------------------------------------------------
     */
    const paymentMethodBreakdown =
      Array.from(
        paymentCounts.entries(),
      ).map(
        ([method, count]) => ({
          method,
          count,
        }),
      );

    /**
     * ------------------------------------------------------------
     * HOURLY TRAFFIC
     * ------------------------------------------------------------
     */
    const hourlyTraffic =
      hourlyCounts.map(
        (count, hour) => ({
          hour,
          count,
        }),
      );

    /**
     * ------------------------------------------------------------
     * DAILY SERIES
     * ------------------------------------------------------------
     *
     * Always returns every day in the selected range,
     * including days with zero orders.
     */
    const dailyFinancials: Array<{
      date: string;
      sales: number;
      commission: number;
      payout: number;
    }> = [];

    const dailyOrders: Array<{
      date: string;
      count: number;
    }> = [];

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
              i,
          ),
          {
            representation:
              'date',
          },
        );

      const bucket =
        dailyBuckets.get(
          date,
        );

      dailyFinancials.push({
        date,

        sales:
          round2(
            bucket?.sales ??
              0,
          ),

        commission:
          round2(
            bucket?.commission ??
              0,
          ),

        payout:
          round2(
            bucket?.payout ??
              0,
          ),
      });

      dailyOrders.push({
        date,

        count:
          bucket?.count ??
          0,
      });
    }

    /**
     * ------------------------------------------------------------
     * PREVIOUS PERIOD
     * ------------------------------------------------------------
     *
     * Only calculate the totals actually returned
     * by the previous object.
     */
    let previousSales = 0;
    let previousPayout = 0;
    let previousMarketingFees =
      0;
    let previousTax = 0;

    for (
      const row of previous
    ) {
      previousSales +=
        toNumber(
          row.subtotal,
        );

      previousPayout +=
        toNumber(
          row.payout_amount,
        );

      previousMarketingFees +=
        toNumber(
          row.marketing_fees,
        );

      previousTax +=
        toNumber(
          row.tax_amount,
        );
    }

    /**
     * ------------------------------------------------------------
     * FINAL RESPONSE
     * ------------------------------------------------------------
     *
     * Response property names are intentionally
     * identical to your existing summary route.
     */
    return NextResponse.json({
      totalStores:
        storeIds.size,

      totalOrders:
        current.length,

      totalSales:
        round2(
          totalSales,
        ),

      payoutAmount:
        round2(
          totalPayout,
        ),

      totalMarketingFees:
        round2(
          totalMarketingFees,
        ),

      taxAmount:
        round2(
          totalTax,
        ),

      payoutAfterFoodCost:
        round2(
          totalPayoutAfterFoodCost,
        ),

      voucherFundedByYou:
        round2(
          totalVoucherFundedByYou,
        ),

      avgOrderHour:
        acceptedHourCount >
        0
          ? round2(
              acceptedHourTotal /
                acceptedHourCount,
            )
          : null,

      avgPrepTimeMin:
        prepMinuteCount >
        0
          ? round2(
              prepMinuteTotal /
                prepMinuteCount,
            )
          : null,

      avgDelayVsEstimateMin:
        delayMinuteCount >
        0
          ? round2(
              delayMinuteTotal /
                delayMinuteCount,
            )
          : null,

      avgDeliveryTimeMin:
        deliveryMinuteCount >
        0
          ? round2(
              deliveryMinuteTotal /
                deliveryMinuteCount,
            )
          : null,

      previous: {
        totalOrders:
          previous.length,

        totalSales:
          round2(
            previousSales,
          ),

        payoutAmount:
          round2(
            previousPayout,
          ),

        totalMarketingFees:
          round2(
            previousMarketingFees,
          ),

        taxAmount:
          round2(
            previousTax,
          ),
      },

      paymentMethodBreakdown,

      hourlyTraffic,

      dailyFinancials,

      dailyOrders,

      restaurants:
        restaurantNames,
    });
  } catch (err: any) {
    console.error(
      '[summary] unexpected error:',
      err,
    );

    return NextResponse.json(
      {
        error:
          err?.message ??
          'Unexpected error while loading dashboard data.',
      },
      {
        status: 500,
      },
    );
  }
}