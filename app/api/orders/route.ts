import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const restaurant =
    searchParams.get('restaurant') ?? 'All';

  const startDate =
    searchParams.get('startDate');

  const endDate =
    searchParams.get('endDate');

  const page = Math.max(
    Number(searchParams.get('page') ?? '1'),
    1
  );

  const pageSize = Math.min(
    Math.max(
      Number(
        searchParams.get('pageSize') ?? '25'
      ),
      1
    ),
    1000
  );

  if (!startDate || !endDate) {
    return NextResponse.json(
      {
        error:
          'startDate and endDate are required.',
      },
      { status: 400 }
    );
  }

  const from =
    (page - 1) * pageSize;

  const to =
    page * pageSize - 1;

  let query = supabaseAdmin
    .from('orders_dashboard')
    .select(
      `
        order_id,
        restaurant_name,
        order_date,
        order_status,
        payment_method,
        subtotal,
        payout_amount,
        tax_amount,
        order_items
      `,
      { count: 'exact' }
    )
    .gte(
      'order_date',
      `${startDate}T00:00:00Z`
    )
    .lte(
      'order_date',
      `${endDate}T23:59:59Z`
    )
    .order(
      'order_date',
      {
        ascending: false,
      }
    )
    .range(from, to);

  if (restaurant !== 'All') {
    query = query.eq(
      'restaurant_name',
      restaurant
    );
  }

  const {
    data,
    error,
    count,
  } = await query;

  if (error) {
    return NextResponse.json(
      {
        error: error.message,
      },
      { status: 500 }
    );
  }

  const rows = (data ?? []).map(
    (row: any) => ({
      order_id:
        row.order_id ?? 0,

      restaurant_name:
        row.restaurant_name ?? '',

      order_date:
        row.order_date ?? null,

      order_status:
        row.order_status ?? null,

      payment_method:
        row.payment_method ?? null,

      subtotal:
        Number(row.subtotal ?? 0),

      payout_amount:
        Number(
          row.payout_amount ?? 0
        ),

      tax_amount:
        Number(
          row.tax_amount ?? 0
        ),

      order_items:
        row.order_items ?? null,
    })
  );

  return NextResponse.json({
    rows,

    total:
      count ?? 0,

    page,

    pageSize,
  });
}