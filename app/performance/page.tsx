'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { format, subDays } from 'date-fns';
import { PerformanceFilters as PerformanceFiltersType, PerformanceResponse, LabelValue } from '@/lib/performanceTypes';
import { formatShortRange, parseISODate, previousPeriodOf, toISODate } from '@/lib/dateRange';
import DashboardShell from '@/components/DashboardShell';
import SectionHeader from '@/components/SectionHeader';
import KpiCard from '@/components/KpiCard';
import PerformanceFilters from '@/components/PerformanceFilters';
import PerformanceRestaurantTable from '@/components/PerformanceRestaurantTable';
import PerformanceTrendChart from '@/components/charts/PerformanceTrendChart';
import RestaurantRankingChart from '@/components/charts/RestaurantRankingChart';
import CategoryBarChart from '@/components/charts/insights/CategoryBarChart';
import CategoryDonutChart from '@/components/charts/insights/CategoryDonutChart';
import PrepTimeDistributionChart from '@/components/PrepTimeDistributionChart';

function pctChange(current: number, previous: number): number | null {
  if (!previous) return null;
  return ((current - previous) / previous) * 100;
}

const todayISO = format(new Date(), 'yyyy-MM-dd');
const tenDaysAgoISO = format(subDays(new Date(), 9), 'yyyy-MM-dd');
const defaultCompare = previousPeriodOf(tenDaysAgoISO, todayISO);

function applyFilterDefaults(next: PerformanceFiltersType): PerformanceFiltersType {
  if (next.compareEnabled && next.compareMode === 'previous') {
    const previous = previousPeriodOf(next.startDate, next.endDate);
    return { ...next, compareStartDate: previous.startDate, compareEndDate: previous.endDate };
  }
  return next;
}

const fmtNum = (n: number | null | undefined) =>
  n === null || n === undefined || !Number.isFinite(n) ? '—' : n.toLocaleString(undefined, { maximumFractionDigits: 0 });
const fmtMoney = (n: number | null | undefined) =>
  n === null || n === undefined || !Number.isFinite(n) ? '—' : n.toLocaleString(undefined, { maximumFractionDigits: 2 });
const fmtK = (n: number | null | undefined) => {
  if (n === null || n === undefined || !Number.isFinite(n)) return '—';
  return n >= 1000 ? `${(n / 1000).toFixed(2)}K` : fmtMoney(n);
};
const fmtPct = (n: number) => `${n.toFixed(1)}%`;
const fmtMin = (n: number) => `${n.toFixed(1)} min`;

export default function PerformanceAnalysisPage() {
  const [filters, setFilters] = useState<PerformanceFiltersType>({
    restaurant: 'All',
    startDate: tenDaysAgoISO,
    endDate: todayISO,
    compareEnabled: true,
    compareMode: 'previous',
    compareStartDate: defaultCompare.startDate,
    compareEndDate: defaultCompare.endDate,
  });

  const [data, setData] = useState<PerformanceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [compareData, setCompareData] = useState<PerformanceResponse | null>(null);

  // Snap the default "last 10 days from today" range to the table's real
  // data window ONCE, on first load, if there's zero overlap. Never
  // touches the range again after that (or after the user changes it).
  const hasAutoAdjustedRef = useRef(false);

  const handleFiltersChange = useCallback((next: PerformanceFiltersType) => {
    hasAutoAdjustedRef.current = true;
    setFilters(applyFilterDefaults(next));
  }, []);

  const loadData = useCallback(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({
      restaurant: filters.restaurant,
      startDate: filters.startDate,
      endDate: filters.endDate,
    });
    fetch(`/api/performance?${params}`)
      .then(async (r) => {
        const json: PerformanceResponse = await r.json();
        if (!r.ok || (json as any)?.error) throw new Error((json as any)?.error ?? 'Failed to load performance data');
        setData(json);

        if (!hasAutoAdjustedRef.current) {
          hasAutoAdjustedRef.current = true;
          const { min, max } = json.availableDateRange ?? { min: null, max: null };
          if (min && max) {
            const noOverlap = filters.endDate < min || filters.startDate > max;
            if (noOverlap) {
              const maxDateObj = parseISODate(max);
              const minDateObj = parseISODate(min);
              if (maxDateObj && minDateObj) {
                const windowStartObj = subDays(maxDateObj, 9);
                const clampedStartObj = windowStartObj < minDateObj ? minDateObj : windowStartObj;
                const newStart = toISODate(clampedStartObj);
                setFilters((prev) => applyFilterDefaults({ ...prev, startDate: newStart, endDate: max }));
              }
            }
          }
        }
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const loadCompareData = useCallback(() => {
    if (!filters.compareEnabled) {
      setCompareData(null);
      return;
    }
    const params = new URLSearchParams({
      restaurant: filters.restaurant,
      startDate: filters.compareStartDate,
      endDate: filters.compareEndDate,
    });
    fetch(`/api/performance?${params}`)
      .then(async (r) => {
        const json = await r.json();
        if (!r.ok || json?.error) throw new Error(json?.error ?? 'Failed to load comparison');
        setCompareData(json);
      })
      .catch(() => setCompareData(null));
  }, [filters]);

  useEffect(() => {
    loadCompareData();
  }, [loadCompareData]);

  const compareOn = filters.compareEnabled && !!compareData;

  // Trend series, extracted from the continuous daily metrics. Aligned by
  // array index (relative day number) between current and previous —
  // never by calendar date.
  const ordersCurrent: LabelValue[] = data?.dailyMetrics.map((d) => ({ label: d.date, value: d.orders })) ?? [];
  const ordersPrevious: LabelValue[] | undefined = compareOn
    ? compareData!.dailyMetrics.map((d) => ({ label: d.date, value: d.orders }))
    : undefined;

  const salesCurrent: LabelValue[] = data?.dailyMetrics.map((d) => ({ label: d.date, value: d.grossSales })) ?? [];
  const salesPrevious: LabelValue[] | undefined = compareOn
    ? compareData!.dailyMetrics.map((d) => ({ label: d.date, value: d.grossSales }))
    : undefined;

  const cancellationCurrent: LabelValue[] = data?.dailyMetrics.map((d) => ({ label: d.date, value: d.cancellationPct ?? 0 })) ?? [];
  const cancellationPrevious: LabelValue[] | undefined = compareOn
    ? compareData!.dailyMetrics.map((d) => ({ label: d.date, value: d.cancellationPct ?? 0 }))
    : undefined;

  const complaintCurrent: LabelValue[] = data?.dailyMetrics.map((d) => ({ label: d.date, value: d.complaintPct ?? 0 })) ?? [];
  const complaintPrevious: LabelValue[] | undefined = compareOn
    ? compareData!.dailyMetrics.map((d) => ({ label: d.date, value: d.complaintPct ?? 0 }))
    : undefined;

  const prepCurrent: LabelValue[] = data?.dailyMetrics.map((d) => ({ label: d.date, value: d.avgPrepTimeMin ?? 0 })) ?? [];
  const prepPrevious: LabelValue[] | undefined = compareOn
    ? compareData!.dailyMetrics.map((d) => ({ label: d.date, value: d.avgPrepTimeMin ?? 0 }))
    : undefined;

  return (
    <DashboardShell>
      <>
        <SectionHeader variant="hero" eyebrow="ANALYTICS" title="Performance Analysis" subtitle="Restaurant fulfillment & customer experience metrics" />

        {/* Filters */}
        <div className="card-tight">
          <PerformanceFilters filters={filters} restaurants={data?.restaurants ?? []} onChange={handleFiltersChange} />
        </div>

        {loading && !data ? (
          <div className="text-ink/40 text-sm py-6">Loading performance data…</div>
        ) : error ? (
          <div className="card text-sm text-danger">
            Could not load performance data: {error}
            <button onClick={loadData} className="ml-3 underline font-medium">
              Retry
            </button>
          </div>
        ) : data ? (
          <>
{/* KPI Cards */}
<section>
  <SectionHeader eyebrow="Overview" title="Key metrics" />

  {compareOn && (
    <div className="mb-4 flex flex-wrap items-center gap-2 rounded-[14px] border border-[#F0E5DE] bg-[#FFF8F4] px-4 py-2.5 text-[13px] text-ink/70">
      <span className="font-semibold text-[#E96A2C]">Comparing</span>
      <span>{formatShortRange(filters.startDate, filters.endDate)}</span>
      <span className="text-[11px] font-semibold uppercase tracking-wide text-ink/30">
        vs
      </span>
      <span>
        {formatShortRange(
          filters.compareStartDate,
          filters.compareEndDate
        )}
      </span>
    </div>
  )}

  <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">

    <KpiCard
      value={String(data.kpis.totalStores)}
      label="Total Stores"
    />

    <KpiCard
      value={fmtK(data.kpis.totalOrders)}
      label="Total Orders"
      compact
      previousLabel={compareOn ? "vs Orders" : undefined}
      previousValue={
        compareOn
          ? fmtK(compareData!.kpis.totalOrders)
          : undefined
      }
      deltaPct={
        compareOn
          ? pctChange(
              data.kpis.totalOrders,
              compareData!.kpis.totalOrders
            )
          : undefined
      }
    />

    <KpiCard
      value={fmtK(data.kpis.totalGrossSales)}
      label="Total Gross Sales"
      compact
      previousLabel={compareOn ? "vs Sales" : undefined}
      previousValue={
        compareOn
          ? fmtK(compareData!.kpis.totalGrossSales)
          : undefined
      }
      deltaPct={
        compareOn
          ? pctChange(
              data.kpis.totalGrossSales,
              compareData!.kpis.totalGrossSales
            )
          : undefined
      }
    />

    <KpiCard
      value={fmtK(data.kpis.totalProRevenue)}
      label="Total Pro Revenue"
      compact
      previousLabel={compareOn ? "vs Revenue" : undefined}
      previousValue={
        compareOn
          ? fmtK(compareData!.kpis.totalProRevenue)
          : undefined
      }
      deltaPct={
        compareOn
          ? pctChange(
              data.kpis.totalProRevenue,
              compareData!.kpis.totalProRevenue
            )
          : undefined
      }
    />

    <KpiCard
      value={fmtK(data.kpis.totalMenuViews)}
      label="Total Menu Views"
      compact
      previousLabel={compareOn ? "vs Menu Views" : undefined}
      previousValue={
        compareOn
          ? fmtK(compareData!.kpis.totalMenuViews)
          : undefined
      }
      deltaPct={
        compareOn
          ? pctChange(
              data.kpis.totalMenuViews,
              compareData!.kpis.totalMenuViews
            )
          : undefined
      }
    />

    <KpiCard
      value={fmtK(data.kpis.totalImpressions)}
      label="Total Impressions"
      compact
      previousLabel={compareOn ? "vs Impressions" : undefined}
      previousValue={
        compareOn
          ? fmtK(compareData!.kpis.totalImpressions)
          : undefined
      }
      deltaPct={
        compareOn
          ? pctChange(
              data.kpis.totalImpressions,
              compareData!.kpis.totalImpressions
            )
          : undefined
      }
    />

    <KpiCard
      value={fmtK(data.kpis.addedToCart)}
      label="Added to Cart"
      compact
      previousLabel={compareOn ? "vs Added to Cart" : undefined}
      previousValue={
        compareOn
          ? fmtK(compareData!.kpis.addedToCart)
          : undefined
      }
      deltaPct={
        compareOn
          ? pctChange(
              data.kpis.addedToCart,
              compareData!.kpis.addedToCart
            )
          : undefined
      }
    />

    <KpiCard
      value={fmtK(data.kpis.cancelledOrders)}
      label="Cancelled Orders"
      compact
      previousLabel={compareOn ? "vs Cancelled" : undefined}
      previousValue={
        compareOn
          ? fmtK(compareData!.kpis.cancelledOrders)
          : undefined
      }
      deltaPct={
        compareOn
          ? pctChange(
              data.kpis.cancelledOrders,
              compareData!.kpis.cancelledOrders
            )
          : undefined
      }
    />

    <KpiCard
      value={fmtK(data.kpis.newCustomerOrders)}
      label="New Customer Orders"
      compact
      previousLabel={compareOn ? "vs New Customers" : undefined}
      previousValue={
        compareOn
          ? fmtK(compareData!.kpis.newCustomerOrders)
          : undefined
      }
      deltaPct={
        compareOn
          ? pctChange(
              data.kpis.newCustomerOrders,
              compareData!.kpis.newCustomerOrders
            )
          : undefined
      }
    />

    <KpiCard
      value={fmtK(data.kpis.salesLoss)}
      label="Sales Loss"
      compact
      previousLabel={compareOn ? "vs Sales Loss" : undefined}
      previousValue={
        compareOn
          ? fmtK(compareData!.kpis.salesLoss)
          : undefined
      }
      deltaPct={
        compareOn
          ? pctChange(
              data.kpis.salesLoss,
              compareData!.kpis.salesLoss
            )
          : undefined
      }
    />

  </div>
</section>

            {/* Orders Trend + Gross Sales Trend */}
            <section>
              <SectionHeader eyebrow="Trend" title="Orders & Sales" />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="card overflow-hidden">
                  <h3 className="chart-title">Orders Trend</h3>
                  <PerformanceTrendChart current={ordersCurrent} previous={ordersPrevious} seriesLabel="Orders" valueFormatter={fmtNum} />
                </div>
                <div className="card overflow-hidden">
                  <h3 className="chart-title">Gross Sales Trend</h3>
                  <PerformanceTrendChart current={salesCurrent} previous={salesPrevious} seriesLabel="Gross Sales" valueFormatter={fmtMoney} />
                </div>
              </div>
            </section>
            
            {/* Prep Time Distribution */}
            <section>
  <SectionHeader
    eyebrow="Fulfillment"
    title="Prep Time Distribution"
  />

  <div className="card overflow-hidden">
    <PrepTimeDistributionChart
  data={data.prepTimeBuckets}
  compareData={compareOn ? compareData!.prepTimeBuckets : undefined}
  compareLabel={
    compareOn
      ? formatShortRange(
          filters.compareStartDate,
          filters.compareEndDate
        )
      : undefined
  }
  height={360}
/>
  </div>
</section>

            {/* Cancellation / Complaint / Prep Time trends */}
            <section>
              <SectionHeader eyebrow="Rates" title="Cancellation, Complaint & Prep Time" />
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="card overflow-hidden">
                  <h3 className="chart-title">Cancellation Rate</h3>
                  <PerformanceTrendChart current={cancellationCurrent} previous={cancellationPrevious} seriesLabel="Cancellation %" valueFormatter={fmtPct} height={230} />
                </div>
                <div className="card overflow-hidden">
                  <h3 className="chart-title">Complaint Rate</h3>
                  <PerformanceTrendChart current={complaintCurrent} previous={complaintPrevious} seriesLabel="Complaint %" valueFormatter={fmtPct} height={230} />
                </div>
                <div className="card overflow-hidden">
                  <h3 className="chart-title">Avg. Prep Time</h3>
                  <PerformanceTrendChart current={prepCurrent} previous={prepPrevious} seriesLabel="Prep Time" valueFormatter={fmtMin} height={230} />
                </div>
              </div>
            </section>
            
            {/* Restaurant ranking */}
            <section>
              <SectionHeader eyebrow="Ranking" title="Restaurant Performance" />
              <div className="card overflow-hidden">
                <RestaurantRankingChart data={data.restaurantPerformance} />
              </div>
            </section>

            
            {/* Menu funnel + new vs returning */}
            {(data.funnel.some((f) => f.value > 0) || data.newVsReturning.some((f) => f.value > 0)) && (
              <section>

                {/* Restaurant table */}
            <section>
              <SectionHeader eyebrow="Details" title="Restaurant Performance Table" />
              <div className="card">
                <PerformanceRestaurantTable data={data.restaurantPerformance} />
              </div>
            </section>
                <SectionHeader eyebrow="Conversion" title="Menu Funnel & Customers" />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {data.funnel.some((f) => f.value > 0) && (
                    <div className="card overflow-hidden">
                      <h3 className="chart-title">Menu Funnel</h3>
                      <CategoryBarChart data={data.funnel} height={260} />
                    </div>
                  )}
                  {data.newVsReturning.some((f) => f.value > 0) && (
                    <div className="card overflow-hidden">
                      <h3 className="chart-title">New vs Returning Customers</h3>
                      <CategoryDonutChart data={data.newVsReturning} />
                    </div>
                  )}
                </div>
              </section>
            )}
          </>
        ) : null}
      </>
    </DashboardShell>
  );
}
