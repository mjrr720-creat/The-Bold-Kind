import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, fetchAllRows } from '@/lib/supabaseAdmin';
import { differenceInCalendarDays, subDays, formatISO } from 'date-fns';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * New Supabase column mapping
 *
 * The dashboard internally uses the old normalized names:
 * restaurant_name, order_id, store_id, order_date, etc.
 *
 * The new Supabase table uses human-readable column names:
 * "Restaurant name", "Order ID", "Store ID", "Order received at", etc.
 *
 * We normalize the rows here so the rest of the dashboard does not need
 * to be rewritten.
 */

function normalizeOrder(row: any) {
  return {
    // Basic order information
    id: Number(row['ID'] ?? row['id'] ?? 0),

    restaurant_name:
      row['Restaurant name'] ??
      row['restaurant_name'] ??
      '',

    order_id:
      Number(
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

    restaurant_address:
      row['Restaurant Address'] ??
      row['restaurant_address'] ??
      null,

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

    // IMPORTANT:
    // New "Order received at" maps to old "order_date"
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

    // Complaints
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

    // Cancellation
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

    // Financials
    subtotal: Number(
      row['Subtotal'] ??
      row['subtotal'] ??
      0
    ),

    packaging_charges: Number(
      row['Packaging charges'] ??
      row['packaging_charges'] ??
      0
    ),

    min_order_value_fee: Number(
      row['Minimum order value fee'] ??
      row['min_order_value_fee'] ??
      0
    ),

    vendor_refunds: Number(
      row['Vendor Refunds'] ??
      row['vendor_refunds'] ??
      0
    ),

    customer_fee_total: Number(
      row['Customer Fee Total'] ??
      row['customer_fee_total'] ??
      0
    ),

    tax_charge: Number(
      row['Tax Charge'] ??
      row['tax_charge'] ??
      0
    ),

    online_payment_fee: Number(
      row['Online Payment Fee'] ??
      row['online_payment_fee'] ??
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

    operational_charges: Number(
      row['Operational Charges'] ??
      row['operational_charges'] ??
      0
    ),

    ads_fee: Number(
      row['Ads Fee'] ??
      row['ads_fee'] ??
      0
    ),

    wait_time_fee: Number(
      row['Wait time fee'] ??
      row['wait_time_fee'] ??
      0
    ),

    marketing_fees_total: Number(
      row['Marketing Fees Total'] ??
      row['marketing_fees_total'] ??
      0
    ),

    marketing_fees_reasons:
      row['Marketing Fees Reasons'] ??
      row['marketing_fees_reasons'] ??
      null,

    marketing_fees: Number(
      row['Marketing Fees'] ??
      row['marketing_fees'] ??
      0
    ),

    avoidable_cancellation_fee: Number(
      row['Avoidable cancellation fee'] ??
      row['avoidable_cancellation_fee'] ??
      0
    ),

    is_payable:
      row['Is Payable'] ??
      row['is_payable'] ??
      null,

    estimated_earnings: Number(
      row['Estimated earnings'] ??
      row['estimated_earnings'] ??
      0
    ),

    cash_already_collected: Number(
      row['Cash amount already collected by you'] ??
      row['cash_already_collected'] ??
      0
    ),

    amount_owed_back: Number(
      row['Amount owed back to Talabat'] ??
      row['amount_owed_back'] ??
      0
    ),

    payout_amount: Number(
      row['Payout Amount'] ??
      row['payout_amount'] ??
      0
    ),

    talabat_funded_discount: Number(
      row['Talabat-Funded Discount'] ??
      row['talabat_funded_discount'] ??
      0
    ),

    talabat_funded_voucher: Number(
      row['Talabat-Funded Voucher'] ??
      row['talabat_funded_voucher'] ??
      0
    ),

    total_discount: Number(
      row['Total Discount'] ??
      row['total_discount'] ??
      0
    ),

    total_voucher: Number(
      row['Total Voucher'] ??
      row['total_voucher'] ??
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

    // These fields are not present in the new source.
    // Keep them for dashboard compatibility.
    payout_after_food_cost:
      row['Payout_after_Food_Cost'] ??
      row['Payout after Food Cost'] ??
      row['payout_after_food_cost'] ??
      0,

    order_hour:
      row['order_hour'] !== undefined &&
      row['order_hour'] !== null
        ? Number(row['order_hour'])
        : null,

    prep_time_min:
      row['prep_time_min'] !== undefined &&
      row['prep_time_min'] !== null
        ? Number(row['prep_time_min'])
        : null,

    delay_vs_estimate_min:
      row['delay_vs_estimate_min'] !== undefined &&
      row['delay_vs_estimate_min'] !== null
        ? Number(row['delay_vs_estimate_min'])
        : null,

    order_month:
      row['order_month'] ??
      row['order_month'] ??
      null,
  };
}

// ---------------------------------------------------------------------
// GET /api/summary
// ---------------------------------------------------------------------

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

  const spanDays =
    differenceInCalendarDays(end, start) + 1;

  const prevEnd =
    subDays(start, 1);

  const prevStart =
    subDays(prevEnd, spanDays - 1);

  // -------------------------------------------------------------------
  // Fetch orders from NEW Supabase column names
  // -------------------------------------------------------------------

  const fetchOrders = (
    rangeStart: Date,
    rangeEnd: Date
  ) =>
    fetchAllRows<any>((from, to) => {
      let q = supabaseAdmin
        .from('orders')
        .select('*')
        .gte(
          'Order received at',
          rangeStart.toISOString()
        )
        .lte(
          'Order received at',
          rangeEnd.toISOString()
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

  let current: any[];
  let previous: any[];
  let restaurantNames: string[];

  try {
    const [
      currentRaw,
      previousRaw
    ] = await Promise.all([
      fetchOrders(start, end),
      fetchOrders(prevStart, prevEnd)
    ]);

    // Normalize new Supabase rows into the existing dashboard format.
    current =
      currentRaw.map(normalizeOrder);

    previous =
      previousRaw.map(normalizeOrder);

    // -----------------------------------------------------------------
    // Restaurant list
    //
    // We no longer depend on the old distinct_restaurants RPC because
    // the new Supabase project may not contain that function.
    // -----------------------------------------------------------------

    const restaurantRows =
      await fetchAllRows<any>((from, to) =>
        supabaseAdmin
          .from('orders')
          .select('Restaurant name')
          .range(from, to)
      );

    restaurantNames = Array.from(
      new Set(
        restaurantRows
          .map(
            (r: any) =>
              r['Restaurant name']
          )
          .filter(
            (name: any) =>
              typeof name === 'string' &&
              name.trim().length > 0
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
          'Failed to load orders'
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
    rows.reduce((acc, r) => {
      const n = Number(r[key]);

      return (
        acc +
        (Number.isFinite(n)
          ? n
          : 0)
      );
    }, 0);

  const avg = (
    rows: any[],
    key: string
  ) => {
    const vals = rows
      .map((r) => Number(r[key]))
      .filter((v) =>
        Number.isFinite(v)
      );

    if (vals.length === 0) {
      return null;
    }

    return Math.round(
      (
        vals.reduce(
          (a, b) => a + b,
          0
        ) /
        vals.length
      ) * 100
    ) / 100;
  };

  const avgMinutesDiff = (
    rows: any[],
    startKey: string,
    endKey: string
  ) => {
    const diffs: number[] = [];

    for (const r of rows) {
      const startVal =
        r[startKey];

      const endVal =
        r[endKey];

      if (!startVal || !endVal) {
        continue;
      }

      const start =
        new Date(startVal).getTime();

      const end =
        new Date(endVal).getTime();

      if (
        !Number.isFinite(start) ||
        !Number.isFinite(end)
      ) {
        continue;
      }

      diffs.push(
        (end - start) / 60000
      );
    }

    if (diffs.length === 0) {
      return null;
    }

    return Math.round(
      (
        diffs.reduce(
          (a, b) => a + b,
          0
        ) /
        diffs.length
      ) * 100
    ) / 100;
  };

  const hourOf = (
    row: any,
    key: string
  ): number | null => {
    const val =
      row[key];

    if (!val) {
      return null;
    }

    const d =
      new Date(val);

    return Number.isFinite(
      d.getTime()
    )
      ? d.getUTCHours()
      : null;
  };

  const avgHourOf = (
    rows: any[],
    key: string
  ) => {
    const hours = rows
      .map((r) =>
        hourOf(r, key)
      )
      .filter(
        (h): h is number =>
          h !== null
      );

    if (hours.length === 0) {
      return null;
    }

    return Math.round(
      (
        hours.reduce(
          (a, b) => a + b,
          0
        ) /
        hours.length
      ) * 100
    ) / 100;
  };

  // -------------------------------------------------------------------
  // Total Stores
  // -------------------------------------------------------------------

  const totalStores =
    new Set(
      current
        .map(
          (r: any) =>
            r.store_id
        )
        .filter(
          (id) =>
            id !== null &&
            id !== undefined
        )
    ).size;

  // -------------------------------------------------------------------
  // Payment Method
  // -------------------------------------------------------------------

  const paymentMethodBreakdown =
    Object.entries(
      current.reduce(
        (
          acc: Record<
            string,
            number
          >,
          r: any
        ) => {
          const method =
            r.payment_method ||
            'Unknown';

          acc[method] =
            (acc[method] || 0) +
            1;

          return acc;
        },
        {}
      )
    ).map(
      ([method, count]) => ({
        method,
        count:
          count as number
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
            (r: any) =>
              hourOf(
                r,
                'accepted_at'
              ) === hour
          ).length
      })
    );

  // -------------------------------------------------------------------
  // Daily Series
  // -------------------------------------------------------------------

  const dailyBuckets =
    current.reduce(
      (
        acc: Record<
          string,
          any[]
        >,
        r: any
      ) => {
        if (!r.order_date) {
          return acc;
        }

        const date =
          formatISO(
            new Date(
              r.order_date
            ),
            {
              representation:
                'date'
            }
          );

        (
          acc[date] ??
          (acc[date] = [])
        ).push(r);

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
            'date'
        }
      );

    const rows =
      dailyBuckets[date] ??
      [];

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
        ) / 100
    });

    dailyOrders.push({
      date,
      count:
        rows.length
    });
  }

  // -------------------------------------------------------------------
  // Response
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

    // New Supabase does not have Payout_after_Food_Cost.
    // This is kept for dashboard compatibility.
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
        ) / 100
    },

    paymentMethodBreakdown,

    hourlyTraffic,

    dailyFinancials,

    dailyOrders,

    restaurants:
      restaurantNames
  });
}