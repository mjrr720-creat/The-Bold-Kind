import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const restaurant = searchParams.get('restaurant') ?? 'All';
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const page = Number(searchParams.get('page') ?? '1');
  // Clamped to PostgREST's per-response row cap (1000) so a future UI
  // change requesting a larger page can't silently get truncated data.
  const pageSize = Math.min(Number(searchParams.get('pageSize') ?? '25'), 1000);

  if (!startDate || !endDate) {
    return NextResponse.json({ error: 'startDate and endDate are required.' }, { status: 400 });
  }

  let query = supabaseAdmin
    .from('orders')
    .select(
      'order_id, restaurant_name, order_date, order_status, payment_method, subtotal, payout_amount, tax_amount, order_items',
      { count: 'exact' }
    )
    .gte('order_date', `${startDate}T00:00:00Z`)
    .lte('order_date', `${endDate}T23:59:59Z`)
    .order('order_date', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (restaurant !== 'All') query = query.eq('restaurant_name', restaurant);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ rows: data, total: count, page, pageSize });
}
