import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';
export const maxDuration = 60;

type DashboardRpcResult = Record<string, any>;

const isISODate = (value: string | null): value is string =>
  !!value && /^\d{4}-\d{2}-\d{2}$/.test(value);

async function callDashboardRpc({
  restaurant,
  brand,
  startDate,
  endDate,
}: {
  restaurant: string;
  brand: string;
  startDate: string;
  endDate: string;
}): Promise<DashboardRpcResult> {
  const { data, error } = await supabaseAdmin.rpc(
    'get_dashboard_insights',
    {
      p_restaurant: restaurant,
      p_start_date: startDate,
      p_end_date: endDate,
      p_brand: brand,
    }
  );

  if (error) {
    throw new Error(
      error.message ?? 'Failed to load dashboard data.'
    );
  }

  if (!data || typeof data !== 'object') {
    throw new Error('Dashboard RPC returned an invalid response.');
  }

  return data as DashboardRpcResult;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const restaurant = searchParams.get('restaurant') ?? 'All';
  const brand = searchParams.get('brand') ?? 'All';

  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  const comparisonEnabled =
    searchParams.get('comparisonEnabled') === 'true';

  const compareStartDate = searchParams.get('compareStartDate');
  const compareEndDate = searchParams.get('compareEndDate');

  if (!isISODate(startDate) || !isISODate(endDate)) {
    return NextResponse.json(
      {
        error:
          'startDate and endDate are required and must use yyyy-MM-dd.',
      },
      { status: 400 }
    );
  }

  if (comparisonEnabled) {
    if (
      !isISODate(compareStartDate) ||
      !isISODate(compareEndDate)
    ) {
      return NextResponse.json(
        {
          error:
            'compareStartDate and compareEndDate are required when comparison is enabled.',
        },
        { status: 400 }
      );
    }
  }

  try {
    /*
     * Current period is always the primary dashboard response.
     *
     * When custom comparison is enabled we deliberately make a
     * second RPC call for the user-selected comparison dates.
     *
     * This means the existing Supabase RPC does NOT need to be
     * rewritten. Its existing aggregation logic is reused for both
     * periods.
     */
    const currentPromise = callDashboardRpc({
      restaurant,
      brand,
      startDate,
      endDate,
    });

    const comparisonPromise = comparisonEnabled
      ? callDashboardRpc({
          restaurant,
          brand,
          startDate: compareStartDate!,
          endDate: compareEndDate!,
        })
      : Promise.resolve(null);

    const [currentData, comparisonData] = await Promise.all([
      currentPromise,
      comparisonPromise,
    ]);

    /*
     * Keep the existing `previous` property so the current KpiCard
     * code continues to work without breaking the rest of the app.
     *
     * When comparison is ON:
     *   previous = the user's custom comparison period.
     *
     * When comparison is OFF:
     *   previous = whatever the existing RPC calculated.
     */
    const response: DashboardRpcResult = {
      ...currentData,
      previous: comparisonEnabled
        ? comparisonData
        : currentData.previous,
      comparison: comparisonEnabled
        ? {
            enabled: true,
            startDate: compareStartDate,
            endDate: compareEndDate,
          }
        : {
            enabled: false,
            startDate: null,
            endDate: null,
          },
    };

    /*
     * distinct_restaurants_dashboard remains a separate lightweight
     * call because the existing Filters component needs the full list.
     */
    const {
      data: restaurantRows,
      error: restaurantErr,
    } = await supabaseAdmin.rpc(
      'distinct_restaurants_dashboard'
    );

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
      ...response,
      restaurants: names,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to load dashboard data.',
      },
      { status: 500 }
    );
  }
}
