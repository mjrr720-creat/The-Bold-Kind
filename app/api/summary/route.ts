import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';
export const maxDuration = 60;

// All aggregation (sums, averages, daily/hourly grouping, previous-period
// comparison) now happens inside Postgres via the get_dashboard_insights
// RPC function. This route no longer downloads raw order rows at all —
// it just forwards the params and returns the small JSON result.
//
// See: dashboard_insights_rpc.sql (run once in Supabase SQL Editor to
// create the function, plus the index note in that file).
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

const restaurant = searchParams.get('restaurant') ?? 'All';
const brand = searchParams.get('brand') ?? 'All';    // <-- YE NAYI LINE ADD KAREIN
const startDate = searchParams.get('startDate');
const endDate = searchParams.get('endDate');

  if (!startDate || !endDate) {
    return NextResponse.json(
      { error: 'startDate and endDate are required (yyyy-MM-dd).' },
      { status: 400 }
    );
  }

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(startDate) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(endDate)
  ) {
    return NextResponse.json(
      { error: 'Invalid startDate or endDate.' },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin.rpc('get_dashboard_insights', {
  p_restaurant: restaurant,
  p_start_date: startDate,
  p_end_date: endDate,
  p_brand: brand,     // <-- YE NAYI LINE ADD KAREIN
});
  if (error) {
    return NextResponse.json(
      { error: error.message ?? 'Failed to load dashboard data.' },
      { status: 500 }
    );
  }

  // distinct_restaurants_dashboard is already cheap (it's just distinct
  // names), so it stays a separate lightweight call.
  const { data: restaurantRows, error: restaurantErr } =
    await supabaseAdmin.rpc('distinct_restaurants_dashboard');

  if (restaurantErr) {
    return NextResponse.json(
      { error: restaurantErr.message },
      { status: 500 }
    );
  }

  const names: string[] = [];
  for (const row of (restaurantRows ?? []) as Array<{
    restaurant_name?: string | null;
  }>) {
    const name = String(row.restaurant_name ?? '').trim();
    if (name && !names.includes(name)) {
      names.push(name);
    }
  }
  names.sort((a, b) => a.localeCompare(b));

  return NextResponse.json({
    ...data,
    restaurants: names,
  });
}
