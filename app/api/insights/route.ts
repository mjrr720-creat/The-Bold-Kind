import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';
export const maxDuration = 60;

// Powers the "Additional Insights" section (kpis, restaurantPerformance,
// cancellation/complaint breakdowns, weekday/hour patterns, etc.) —
// this is the InsightsResponse shape from lib/insightsTypes.ts.
//
// All aggregation happens inside Postgres via get_dashboard_extra_insights.
// See: dashboard_extra_insights_rpc.sql (run once in Supabase SQL Editor).
//
// This is separate from /api/summary, which powers the KPI cards + charts
// at the top of the page (SummaryResponse shape) via get_dashboard_insights.
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

  const { data, error } = await supabaseAdmin.rpc('get_dashboard_extra_insights', {
  p_restaurant: restaurant,
  p_start_date: startDate,
  p_end_date: endDate,
  p_brand: brand,     // <-- YE NAYI LINE ADD KAREIN
});

  if (error) {
    return NextResponse.json(
      { error: error.message ?? 'Failed to load insights.' },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}
