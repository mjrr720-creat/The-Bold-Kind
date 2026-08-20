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
      Number(searchParams.get('pageSize') ?? '25'),
      1
    ),
    1000
  );

  if (!startDate || !endDate) {
    return NextResponse.json(
      {
        error:
          'startDate and endDate are required.'
      },
      { status: 400 }
    );
  }

  let query = supabaseAdmin
    .from('orders')
    .select(
      `
        "Order ID",
        "Restaurant name",
        "Order received at",
        "Order status",
        "Payment method",
        "Subtotal",
        "Payout Amount",
        "Tax Amount",
        "Order Items"
      `,
      { count: 'exact' }
    )
    .gte(
      'Order received at',
      `${startDate}T00:00:00Z`
    )
    .lte(
      'Order received at',
      `${endDate}T23:59:59Z`
    )
    .order(
      'Order received at',
      { ascending: false }
    )
    .range(
      (page - 1) * pageSize,
      page * pageSize - 1
    );

  if (restaurant !== 'All') {
    query = query.eq(
      'Restaurant name',
      restaurant
    );
  }

  const {
    data,
    error,
    count
  } = await query;

  if (error) {
    return NextResponse.json(
      {
        error: error.message
      },
      { status: 500 }
    );
  }

  const rows = (data ?? []).map(
    (row: any) => ({
      order_id: Number(
        row['Order ID'] ?? 0
      ),

      restaurant_name:
        row['Restaurant name'] ??
        '',

      order_date:
        row['Order received at'] ??
        null,

      order_status:
        row['Order status'] ??
        null,

      payment_method:
        row['Payment method'] ??
        null,

      subtotal: Number(
        row['Subtotal'] ?? 0
      ),

      payout_amount: Number(
        row['Payout Amount'] ?? 0
      ),

      tax_amount: Number(
        row['Tax Amount'] ?? 0
      ),

      order_items:
        row['Order Items'] ??
        null
    })
  );

  return NextResponse.json({
    rows,
    total: count ?? 0,
    page,
    pageSize
  });
}