'use client';

import { useCallback, useEffect, useState } from 'react';
import { format, subDays } from 'date-fns';
import { DashboardFilters, SummaryResponse } from '@/lib/types';
import { InsightsResponse } from '@/lib/insightsTypes';
import {
  compareModeLabel,
  formatShortRange,
  previousPeriodOf,
} from '@/lib/dateRange';
import KpiCard from '@/components/KpiCard';
import Filters from '@/components/Filters';
import UploadButton from '@/components/UploadButton';
import Sidebar, { DashboardTab } from '@/components/Sidebar';
import SectionHeader from '@/components/SectionHeader';
import PaymentMethodPie from '@/components/charts/PaymentMethodPie';
import HourlyTraffic from '@/components/charts/HourlyTraffic';
import MonthlyComboChart from '@/components/charts/MonthlyComboChart';
import MonthlyOrdersChart from '@/components/charts/MonthlyOrdersChart';
import SalesOrdersOverviewChart from '@/components/charts/SalesOrdersOverviewChart';
import OrdersTable from '@/components/OrdersTable';
import CategoryBarChart from '@/components/charts/insights/CategoryBarChart';
import CategoryDonutChart from '@/components/charts/insights/CategoryDonutChart';
import DiscountFundingChart from '@/components/charts/insights/DiscountFundingChart';
import HourHeatmap from '@/components/charts/insights/HourHeatmap';
import DeliveryPerformanceCard from '@/components/DeliveryPerformanceCard';
import RestaurantPerformanceTable from '@/components/RestaurantPerformanceTable';
import CancellationBarChart from '@/components/CancellationBarChart';
import OrdersByWeekdayChart from '@/components/charts/insights/OrdersByWeekdayChart';
import QualitySubscriptionsSection from "@/components/QualitySubscriptionsSection";
import BrandFilter from '@/components/BrandFilter';

function pctChange(current: number, previous: number): number | null {
  if (!previous) return null;
  return ((current - previous) / previous) * 100;
}

const todayISO = format(new Date(), 'yyyy-MM-dd');
const tenDaysAgoISO = format(subDays(new Date(), 9), 'yyyy-MM-dd');
const defaultCompare = previousPeriodOf(tenDaysAgoISO, todayISO);

function applyFilterDefaults(next: DashboardFilters): DashboardFilters {
  if (next.compareEnabled && next.compareMode === 'previous') {
    const previous = previousPeriodOf(next.startDate, next.endDate);
    return {
      ...next,
      compareStartDate: previous.startDate,
      compareEndDate: previous.endDate,
    };
  }
  return next;
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<DashboardTab>('orders');

  const [filters, setFilters] = useState<DashboardFilters>({
    restaurant: 'All',
    brand: 'All',
    startDate: tenDaysAgoISO,
    endDate: todayISO,
    compareEnabled: true,
    compareMode: 'previous',
    compareStartDate: defaultCompare.startDate,
    compareEndDate: defaultCompare.endDate,
  });
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [compareSummary, setCompareSummary] = useState<SummaryResponse | null>(
    null
  );

  // Separate state/fetch for the additional insights section — kept fully
  // independent from `summary` so a problem here can never affect the
  // existing KPIs/charts above.
  const [insights, setInsights] = useState<InsightsResponse | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(true);
  const [insightsError, setInsightsError] = useState<string | null>(null);
  const [compareInsights, setCompareInsights] =
    useState<InsightsResponse | null>(null);

  const handleFiltersChange = useCallback((next: DashboardFilters) => {
    setFilters(applyFilterDefaults(next));
  }, []);

  const loadInsights = useCallback(() => {
    setInsightsLoading(true);
    setInsightsError(null);
    const params = new URLSearchParams({
      restaurant: filters.restaurant,
      brand: filters.brand,
      startDate: filters.startDate,
      endDate: filters.endDate
    });
    fetch(`/api/insights?${params}`)
      .then(async (r) => {
        const json = await r.json();
        if (!r.ok || json?.error) throw new Error(json?.error ?? 'Failed to load insights');
        setInsights(json);
      })
      .catch((err: Error) => setInsightsError(err.message))
      .finally(() => setInsightsLoading(false));
  }, [filters]);

  useEffect(() => {
    loadInsights();
  }, [loadInsights]);

  const loadCompareInsights = useCallback(() => {
    if (!filters.compareEnabled) {
      setCompareInsights(null);
      return;
    }

    const params = new URLSearchParams({
      restaurant: filters.restaurant,
      brand: filters.brand,
      startDate: filters.compareStartDate,
      endDate: filters.compareEndDate,
    });

    fetch(`/api/insights?${params}`)
      .then(async (r) => {
        const json = await r.json();
        if (!r.ok || json?.error) throw new Error(json?.error ?? 'Failed to load insights');
        setCompareInsights(json);
      })
      .catch(() => setCompareInsights(null));
  }, [filters]);

  useEffect(() => {
    loadCompareInsights();
  }, [loadCompareInsights]);

  const loadSummary = useCallback(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({
      restaurant: filters.restaurant,
      brand: filters.brand,
      startDate: filters.startDate,
      endDate: filters.endDate
    });
    fetch(`/api/summary?${params}`)
      .then(async (r) => {
        const json = await r.json();
        if (!r.ok || json?.error) throw new Error(json?.error ?? 'Failed to load dashboard data');
        setSummary(json);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [filters]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const loadCompareSummary = useCallback(() => {
    if (!filters.compareEnabled) {
      setCompareSummary(null);
      return;
    }

    const params = new URLSearchParams({
      restaurant: filters.restaurant,
      brand: filters.brand,
      startDate: filters.compareStartDate,
      endDate: filters.compareEndDate,
    });

    fetch(`/api/summary?${params}`)
      .then(async (r) => {
        const json = await r.json();
        if (!r.ok || json?.error) throw new Error(json?.error ?? 'Failed to load comparison');
        setCompareSummary(json);
      })
      .catch(() => setCompareSummary(null));
  }, [filters]);

  useEffect(() => {
    loadCompareSummary();
  }, [loadCompareSummary]);

  const fmt = (n: number | null | undefined) =>
    n === null || n === undefined || !Number.isFinite(n) ? '—' : n.toLocaleString(undefined, { maximumFractionDigits: 2 });
  const fmtK = (n: number | null | undefined) => {
    if (n === null || n === undefined || !Number.isFinite(n)) return '—';
    return n >= 1000 ? `${(n / 1000).toFixed(2)}K` : fmt(n);
  };
  const fmtMin = (n: number | null | undefined) => (n === null || n === undefined ? '—' : n.toFixed(2));
  const fmtPct = (n: number | null | undefined) =>
    n === null || n === undefined || !Number.isFinite(n) ? '—' : `${n.toFixed(2)}%`;

  const compareOn = filters.compareEnabled;
  const vsLabel = filters.compareMode === 'custom' ? 'vs custom' : 'vs prev';
  const compareRangeLabel = compareOn
    ? formatShortRange(filters.compareStartDate, filters.compareEndDate)
    : '';
  const compareChartLabel =
    compareOn && compareSummary
      ? `${compareModeLabel(filters.compareMode)} (${compareRangeLabel})`
      : null;

  const prevTotals = compareOn
    ? {
        totalOrders:
          compareSummary?.totalOrders ??
          (filters.compareMode === 'previous'
            ? summary?.previous.totalOrders
            : undefined),
        totalSales:
          compareSummary?.totalSales ??
          (filters.compareMode === 'previous'
            ? summary?.previous.totalSales
            : undefined),
        payoutAmount:
          compareSummary?.payoutAmount ??
          (filters.compareMode === 'previous'
            ? summary?.previous.payoutAmount
            : undefined),
        totalMarketingFees:
          compareSummary?.totalMarketingFees ??
          (filters.compareMode === 'previous'
            ? summary?.previous.totalMarketingFees
            : undefined),
        taxAmount:
          compareSummary?.taxAmount ??
          (filters.compareMode === 'previous'
            ? summary?.previous.taxAmount
            : undefined),
        avgOrderHour: compareSummary?.avgOrderHour ?? null,
        avgPrepTimeMin: compareSummary?.avgPrepTimeMin ?? null,
        avgDelayVsEstimateMin: compareSummary?.avgDelayVsEstimateMin ?? null,
        avgDeliveryTimeMin: compareSummary?.avgDeliveryTimeMin ?? null,
        voucherFundedByYou: compareSummary?.voucherFundedByYou,
        payoutAfterFoodCost: compareSummary?.payoutAfterFoodCost,
      }
    : null;

  const compareOverview = compareSummary
    ? compareSummary.dailyFinancials.map((d) => ({
        date: d.date,
        sales: d.sales,
        orders:
          compareSummary.dailyOrders.find((o) => o.date === d.date)?.count ?? 0,
      }))
    : [];

  const salesOrdersOverview = summary
    ? summary.dailyFinancials.map((d, i) => ({
        date: d.date,
        sales: d.sales,
        orders: summary.dailyOrders.find((o) => o.date === d.date)?.count ?? 0,
        prevSales: compareOn && compareSummary ? compareOverview[i]?.sales ?? 0 : undefined,
        prevOrders: compareOn && compareSummary ? compareOverview[i]?.orders ?? 0 : undefined,
        compareDate: compareOn && compareSummary ? compareOverview[i]?.date : undefined,
      }))
    : [];

  const dailyOrdersChart = summary
    ? summary.dailyOrders.map((d, i) => ({
        date: d.date,
        count: d.count,
        prevCount:
          compareOn && compareSummary
            ? compareSummary.dailyOrders[i]?.count ?? 0
            : undefined,
        compareDate:
          compareOn && compareSummary
            ? compareSummary.dailyOrders[i]?.date
            : undefined,
      }))
    : [];

  return (
    <div className="min-h-screen bg-surface-sunken">
      <Sidebar active={activeTab} onChange={setActiveTab} />

      <main className="pl-16 md:pl-[320px] transition-[padding]">
        <div className="px-4 sm:px-6 py-6 space-y-8 max-w-[1400px] mx-auto">
          {activeTab === 'performance' ? (
          <div className="card text-center text-ink/40 py-24">
            Performance Analysis is coming soon.
          </div>
        ) : (
          <>
           {/* Premium Page Header */}
<section className="relative overflow-hidden rounded-[24px] border border-black/[0.06] bg-white shadow-[0_8px_30px_rgba(20,20,20,0.06)] mb-6">

  {/* Decorative orange waves */}
  <div className="pointer-events-none absolute right-[-30px] bottom-[-90px] w-[560px] h-[300px] opacity-60">
    <svg
      viewBox="0 0 600 300"
      fill="none"
      className="w-full h-full"
    >
      <path
        d="M40 250 C140 180 180 40 300 100 C400 150 420 260 560 180"
        stroke="#F97316"
        strokeWidth="1.2"
        opacity="0.16"
      />
      <path
        d="M40 265 C150 190 185 55 305 115 C405 165 425 275 570 195"
        stroke="#F97316"
        strokeWidth="1.2"
        opacity="0.13"
      />
      <path
        d="M40 280 C155 200 190 70 310 130 C410 180 430 290 580 210"
        stroke="#F97316"
        strokeWidth="1.2"
        opacity="0.10"
      />
      <path
        d="M40 295 C160 210 195 85 315 145 C415 195 435 305 590 225"
        stroke="#F97316"
        strokeWidth="1.2"
        opacity="0.08"
      />
    </svg>
  </div>

  <div className="relative z-10 px-8 md:px-10 pt-7 pb-6">

    {/* Top row */}
    <div className="flex items-center justify-between gap-6">

      {/* Title */}
      <div className="flex items-center gap-5">

        {/* Analytics icon */}
        <div className="flex h-[76px] w-[76px] shrink-0 items-center justify-center rounded-[22px] bg-gradient-to-br from-orange-50 to-orange-100 shadow-sm">
          <svg
            viewBox="0 0 32 32"
            fill="none"
            className="h-10 w-10 text-brand"
          >
            <path
              d="M5 26V16"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d="M13 26V11"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d="M21 26V17"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d="M29 26V7"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            />

            <path
              d="M4 13L11 7L18 12L28 4"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            <path
              d="M24 4H28V8"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <div>
          <div className="text-[11px] uppercase tracking-[0.16em] font-bold text-brand mb-1.5">
            ANALYTICS
          </div>

          <h1 className="text-[32px] md:text-[40px] leading-none font-extrabold tracking-[-0.035em] text-ink">
            Order Analysis
          </h1>

          <p className="mt-2 text-[14px] md:text-[16px] text-ink/50">
            Restaurant order performance, payouts &amp; delivery metrics
          </p>
        </div>

      </div>

    </div>

    {/* Breadcrumb */}
    <div className="mt-7 flex items-center gap-3">

      {/* Home icon */}
      <div className="flex h-11 w-11 items-center justify-center rounded-[13px] border border-black/[0.06] bg-white shadow-sm">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="h-5 w-5 text-ink/60"
        >
          <path
            d="M3 10.5L12 3L21 10.5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M5 9.5V20H19V9.5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M9 20V14H15V20"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <span className="text-[15px] font-medium text-ink/45">
        Dashboard
      </span>

      <svg
        viewBox="0 0 20 20"
        fill="none"
        className="h-4 w-4 text-ink/20"
      >
        <path
          d="M7 4L13 10L7 16"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      <span className="text-[15px] font-medium text-ink/45">
        Analytics
      </span>

      <svg
        viewBox="0 0 20 20"
        fill="none"
        className="h-4 w-4 text-ink/20"
      >
        <path
          d="M7 4L13 10L7 16"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      <span className="text-[15px] font-bold text-brand">
        Order Analysis
      </span>

    </div>

  </div>
</section>

{/* Filters */}
<div className="card-tight">
  <Filters
    filters={filters}
    restaurants={summary?.restaurants ?? []}
    onChange={handleFiltersChange}
    trailing={
      <BrandFilter
        value={filters.brand}
        onChange={(brand) => handleFiltersChange({ ...filters, brand })}
      />
    }
  />
</div>

{/* Loading / Error */}
{loading && !summary ? (
  <div className="text-ink/40 text-sm py-6">
    Loading dashboard…
  </div>
) : error ? (
  <div className="card text-sm text-danger">
    Could not load dashboard data: {error}
    <button
      onClick={loadSummary}
      className="ml-3 underline font-medium"
    >
      Retry
    </button>
  </div>
            ) : summary ? (
              <>
                {/* ===================== Overview ===================== */}
                <section>
  <SectionHeader eyebrow="Overview" title="Key metrics" />

  {compareOn && (
    <div className="mb-4 flex flex-wrap items-center gap-2 rounded-[14px] border border-[#F0E5DE] bg-[#FFF8F4] px-4 py-2.5 text-[13px] text-ink/70">
      <span className="font-semibold text-[#E96A2C]">Comparing</span>
      <span>
        {formatShortRange(filters.startDate, filters.endDate)}
      </span>
      <span className="text-[11px] font-semibold uppercase tracking-wide text-ink/30">
        vs
      </span>
      <span>
        {compareModeLabel(filters.compareMode)} ({compareRangeLabel})
      </span>
    </div>
  )}

  <div className="space-y-4">

    {/* Main KPIs */}
<div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">

  <KpiCard
    value={String(summary.totalStores)}
    label="Total Stores"
  />

  <KpiCard
    value={fmtK(summary.totalOrders)}
    label="Total Orders"
    previousLabel={
      compareOn && prevTotals?.totalOrders !== undefined
        ? 'Prev. Orders'
        : undefined
    }
    previousValue={
      compareOn && prevTotals?.totalOrders !== undefined
        ? fmtK(prevTotals.totalOrders)
        : undefined
    }
    deltaPct={
      compareOn && prevTotals?.totalOrders !== undefined
        ? pctChange(summary.totalOrders, prevTotals.totalOrders)
        : undefined
    }
    vsLabel={vsLabel}
  />

  <KpiCard
    value={fmtK(summary.totalSales)}
    label="Total Sales"
    previousLabel={
      compareOn && prevTotals?.totalSales !== undefined
        ? 'Prev. Sales'
        : undefined
    }
    previousValue={
      compareOn && prevTotals?.totalSales !== undefined
        ? fmtK(prevTotals.totalSales)
        : undefined
    }
    deltaPct={
      compareOn && prevTotals?.totalSales !== undefined
        ? pctChange(summary.totalSales, prevTotals.totalSales)
        : undefined
    }
    vsLabel={vsLabel}
  />

  <KpiCard
    value={fmtK(summary.payoutAmount)}
    label="Payout Amount"
    previousLabel={
      compareOn && prevTotals?.payoutAmount !== undefined
        ? 'Prev. Payout'
        : undefined
    }
    previousValue={
      compareOn && prevTotals?.payoutAmount !== undefined
        ? fmtK(prevTotals.payoutAmount)
        : undefined
    }
    deltaPct={
      compareOn && prevTotals?.payoutAmount !== undefined
        ? pctChange(summary.payoutAmount, prevTotals.payoutAmount)
        : undefined
    }
    vsLabel={vsLabel}
  />

  <KpiCard
    value={fmtK(summary.totalMarketingFees)}
    label="Marketing Fees"
    previousLabel={
      compareOn && prevTotals?.totalMarketingFees !== undefined
        ? 'Prev. Marketing Fees'
        : undefined
    }
    previousValue={
      compareOn && prevTotals?.totalMarketingFees !== undefined
        ? fmtK(prevTotals.totalMarketingFees)
        : undefined
    }
    deltaPct={
      compareOn && prevTotals?.totalMarketingFees !== undefined
        ? pctChange(
            summary.totalMarketingFees,
            prevTotals.totalMarketingFees
          )
        : undefined
    }
    vsLabel={vsLabel}
  />

</div>


{/* Secondary KPIs */}
<div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">

  <KpiCard
    value={fmtK(summary.taxAmount)}
    label="Tax Amount"
    compact
    previousLabel={compareOn ? 'Prev. Tax' : undefined}
    previousValue={compareOn ? fmtK(prevTotals?.taxAmount) : undefined}
    deltaPct={
      compareOn
        ? pctChange(summary.taxAmount, prevTotals?.taxAmount ?? 0)
        : undefined
    }
    vsLabel={vsLabel}
  />

  <KpiCard
    value={fmtMin(summary.avgOrderHour)}
    label="Avg. Order Hour"
    compact
    previousLabel={compareOn ? 'Prev. Hour' : undefined}
    previousValue={
      compareOn ? fmtMin(prevTotals?.avgOrderHour) : undefined
    }
    deltaPct={
      compareOn && prevTotals?.avgOrderHour
        ? pctChange(summary.avgOrderHour ?? 0, prevTotals.avgOrderHour)
        : undefined
    }
    vsLabel={vsLabel}
  />

  <KpiCard
    value={fmtMin(summary.avgPrepTimeMin)}
    label="Avg. Prep Time"
    compact
    previousLabel={compareOn ? 'Prev. Prep' : undefined}
    previousValue={
      compareOn ? fmtMin(prevTotals?.avgPrepTimeMin) : undefined
    }
    deltaPct={
      compareOn && prevTotals?.avgPrepTimeMin
        ? pctChange(summary.avgPrepTimeMin ?? 0, prevTotals.avgPrepTimeMin)
        : undefined
    }
    vsLabel={vsLabel}
  />

  <KpiCard
    value={fmtMin(summary.avgDelayVsEstimateMin)}
    label="Avg. Delay vs Estimate"
    compact
    previousLabel={compareOn ? 'Prev. Delay' : undefined}
    previousValue={
      compareOn ? fmtMin(prevTotals?.avgDelayVsEstimateMin) : undefined
    }
    deltaPct={
      compareOn && prevTotals?.avgDelayVsEstimateMin
        ? pctChange(
            summary.avgDelayVsEstimateMin ?? 0,
            prevTotals.avgDelayVsEstimateMin
          )
        : undefined
    }
    vsLabel={vsLabel}
  />

  <KpiCard
    value={fmtMin(summary.avgDeliveryTimeMin)}
    label="Avg. Delivery Time"
    compact
    previousLabel={compareOn ? 'Prev. Delivery' : undefined}
    previousValue={
      compareOn ? fmtMin(prevTotals?.avgDeliveryTimeMin) : undefined
    }
    deltaPct={
      compareOn && prevTotals?.avgDeliveryTimeMin
        ? pctChange(
            summary.avgDeliveryTimeMin ?? 0,
            prevTotals.avgDeliveryTimeMin
          )
        : undefined
    }
    vsLabel={vsLabel}
  />

  <KpiCard
    value={fmtK(summary.voucherFundedByYou)}
    label="Voucher Funded"
    compact
    previousLabel={compareOn ? 'Prev. Voucher' : undefined}
    previousValue={
      compareOn ? fmtK(prevTotals?.voucherFundedByYou) : undefined
    }
    deltaPct={
      compareOn && prevTotals?.voucherFundedByYou !== undefined
        ? pctChange(
            summary.voucherFundedByYou,
            prevTotals.voucherFundedByYou
          )
        : undefined
    }
    vsLabel={vsLabel}
  />

  <KpiCard
    value={fmtK(summary.payoutAfterFoodCost)}
    label="Payout after FC"
    highlight
    compact
    previousLabel={compareOn ? 'Prev. Payout FC' : undefined}
    previousValue={
      compareOn ? fmtK(prevTotals?.payoutAfterFoodCost) : undefined
    }
    deltaPct={
      compareOn && prevTotals?.payoutAfterFoodCost !== undefined
        ? pctChange(
            summary.payoutAfterFoodCost,
            prevTotals.payoutAfterFoodCost
          )
        : undefined
    }
    vsLabel={vsLabel}
  />

</div>

  </div>
</section>

                {/* ===================== Sales & Orders Overview ===================== */}
                <section>
                  <SectionHeader eyebrow="Trends" title="Sales &amp; Orders Overview" />
                  <div className="card">
                    <SalesOrdersOverviewChart
                      data={salesOrdersOverview}
                      compareLabel={compareChartLabel}
                    />
                  </div>
                </section>

                {/* ===================== Charts ===================== */}
                <section>
                  <SectionHeader eyebrow="Breakdown" title="Payments &amp; traffic" />
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="card">
                      <h3 className="chart-title mb-3">Payment Methods</h3>
                      <PaymentMethodPie data={summary.paymentMethodBreakdown} />
                    </div>
                    <div className="card">
                      <h3 className="chart-title mb-3">Hourly Order Traffic</h3>
                      <HourlyTraffic data={summary.hourlyTraffic} />
                    </div>
                  </div>
                </section>

                <section>
                  <SectionHeader eyebrow="Financials" title="Daily performance" />

<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
  <div className="card">
    <h3 className="chart-title mb-3">
      Sales, Commission &amp; Payout by Date
    </h3>

    <MonthlyComboChart data={summary.dailyFinancials} />
  </div>

  <div className="card">
    <h3 className="chart-title mb-1">
      Orders by Date
    </h3>
    {compareChartLabel && (
      <p className="chart-subtitle mb-3">
        Comparing vs {compareChartLabel}
      </p>
    )}

    <MonthlyOrdersChart
      data={dailyOrdersChart}
      compareLabel={compareChartLabel}
    />
  </div>
</div>
                </section>
                
                {/* ================================================================ */}
                {/* Additional Insights — new section, does not alter anything above */}
                {/* ================================================================ */}
                <section className="pt-2 border-t border-surface-border">
                  <div className="pt-6">
                    <h2 className="page-title mb-1">Additional Insights</h2>
                    <p className="page-subtitle mb-6">Deeper performance, delivery &amp; restaurant-level detail</p>

                    {insightsLoading && !insights ? (
                      <div className="text-ink/40 text-sm py-6">Loading additional insights…</div>
                    ) : insightsError ? (
                      <div className="card text-sm text-danger">
                        Could not load additional insights: {insightsError}
                        <button onClick={loadInsights} className="ml-3 underline font-medium">Retry</button>
                      </div>
                    ) : insights ? (
                      <div className="space-y-8">
                        {/* New KPIs */}
                        <section>
                          <SectionHeader eyebrow="Rates" title="Efficiency &amp; quality" />
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <KpiCard
                                value={fmt(insights.kpis.avgOrderValue)}
                                label="Average Order Value"
                                compact
                                previousLabel={compareOn ? 'Prev. AOV' : undefined}
                                previousValue={
                                  compareOn
                                    ? fmt(compareInsights?.kpis.avgOrderValue)
                                    : undefined
                                }
                                deltaPct={
                                  compareOn && compareInsights?.kpis.avgOrderValue
                                    ? pctChange(
                                        insights.kpis.avgOrderValue ?? 0,
                                        compareInsights.kpis.avgOrderValue
                                      )
                                    : undefined
                                }
                                vsLabel={vsLabel}
                              />
                              <KpiCard
                                value={insights.kpis.commissionPct !== null ? `${insights.kpis.commissionPct.toFixed(2)}%` : '—'}
                                label="Commission %"
                                compact
                                previousLabel={compareOn ? 'Prev. Commission' : undefined}
                                previousValue={
                                  compareOn
                                    ? fmtPct(compareInsights?.kpis.commissionPct)
                                    : undefined
                                }
                                deltaPct={
                                  compareOn && compareInsights?.kpis.commissionPct
                                    ? pctChange(
                                        insights.kpis.commissionPct ?? 0,
                                        compareInsights.kpis.commissionPct
                                      )
                                    : undefined
                                }
                                vsLabel={vsLabel}
                              />
                              <KpiCard
                                value={insights.kpis.payoutPct !== null ? `${insights.kpis.payoutPct.toFixed(2)}%` : '—'}
                                label="Payout %"
                                compact
                                previousLabel={compareOn ? 'Prev. Payout %' : undefined}
                                previousValue={
                                  compareOn
                                    ? fmtPct(compareInsights?.kpis.payoutPct)
                                    : undefined
                                }
                                deltaPct={
                                  compareOn && compareInsights?.kpis.payoutPct
                                    ? pctChange(
                                        insights.kpis.payoutPct ?? 0,
                                        compareInsights.kpis.payoutPct
                                      )
                                    : undefined
                                }
                                vsLabel={vsLabel}
                              />
                              <KpiCard
                                value={insights.kpis.cancellationPct !== null ? `${insights.kpis.cancellationPct.toFixed(2)}%` : '—'}
                                label="Cancellation %"
                                compact
                                previousLabel={compareOn ? 'Prev. Cancel %' : undefined}
                                previousValue={
                                  compareOn
                                    ? fmtPct(compareInsights?.kpis.cancellationPct)
                                    : undefined
                                }
                                deltaPct={
                                  compareOn && compareInsights?.kpis.cancellationPct
                                    ? pctChange(
                                        insights.kpis.cancellationPct ?? 0,
                                        compareInsights.kpis.cancellationPct
                                      )
                                    : undefined
                                }
                                vsLabel={vsLabel}
                              />
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <KpiCard
                                value={insights.kpis.onTimeDeliveryPct !== null ? `${insights.kpis.onTimeDeliveryPct.toFixed(2)}%` : '—'}
                                label="On-Time Delivery %"
                                compact
                                previousLabel={compareOn ? 'Prev. On-time' : undefined}
                                previousValue={
                                  compareOn
                                    ? fmtPct(compareInsights?.kpis.onTimeDeliveryPct)
                                    : undefined
                                }
                                deltaPct={
                                  compareOn && compareInsights?.kpis.onTimeDeliveryPct
                                    ? pctChange(
                                        insights.kpis.onTimeDeliveryPct ?? 0,
                                        compareInsights.kpis.onTimeDeliveryPct
                                      )
                                    : undefined
                                }
                                vsLabel={vsLabel}
                              />
                              <KpiCard
                                value={insights.kpis.complaintPct !== null ? `${insights.kpis.complaintPct.toFixed(2)}%` : '—'}
                                label="Complaint %"
                                compact
                                previousLabel={compareOn ? 'Prev. Complaint %' : undefined}
                                previousValue={
                                  compareOn
                                    ? fmtPct(compareInsights?.kpis.complaintPct)
                                    : undefined
                                }
                                deltaPct={
                                  compareOn && compareInsights?.kpis.complaintPct
                                    ? pctChange(
                                        insights.kpis.complaintPct ?? 0,
                                        compareInsights.kpis.complaintPct
                                      )
                                    : undefined
                                }
                                vsLabel={vsLabel}
                              />
                              <KpiCard
                                value={fmtK(insights.kpis.restaurantDiscount)}
                                label="Restaurant Discount"
                                compact
                                previousLabel={compareOn ? 'Prev. Discount' : undefined}
                                previousValue={
                                  compareOn
                                    ? fmtK(compareInsights?.kpis.restaurantDiscount)
                                    : undefined
                                }
                                deltaPct={
                                  compareOn &&
                                  compareInsights?.kpis.restaurantDiscount !== undefined
                                    ? pctChange(
                                        insights.kpis.restaurantDiscount,
                                        compareInsights.kpis.restaurantDiscount
                                      )
                                    : undefined
                                }
                                vsLabel={vsLabel}
                              />
                              <KpiCard
                                value={insights.kpis.marketingPct !== null ? `${insights.kpis.marketingPct.toFixed(2)}%` : '—'}
                                label="Marketing %"
                                compact
                                previousLabel={compareOn ? 'Prev. Marketing %' : undefined}
                                previousValue={
                                  compareOn
                                    ? fmtPct(compareInsights?.kpis.marketingPct)
                                    : undefined
                                }
                                deltaPct={
                                  compareOn && compareInsights?.kpis.marketingPct
                                    ? pctChange(
                                        insights.kpis.marketingPct ?? 0,
                                        compareInsights.kpis.marketingPct
                                      )
                                    : undefined
                                }
                                vsLabel={vsLabel}
                              />
                            </div>
                          </div>
                        </section>

                        {/* Delivery Performance */}
                        <section>
                          <SectionHeader eyebrow="Fulfillment" title="Delivery Performance" />
                          <DeliveryPerformanceCard
                            onTimeDeliveryPct={insights.kpis.onTimeDeliveryPct}
                            deliveryDelayBuckets={insights.deliveryDelayBuckets}
                            deliveryTypeBreakdown={insights.deliveryTypeBreakdown}
                          />
                        </section>
                       
                        {/* Restaurant Performance table */}
                        <section>
                          <SectionHeader eyebrow="Details" title="Restaurant Performance" />
                          <div className="card">
                            <RestaurantPerformanceTable data={insights.restaurantPerformance} />
                          </div>
                        </section>

                        {/* Row: Cancellation reasons / owner */}
                        <section>
  <SectionHeader
    eyebrow="Cancellations"
    title="Reasons & ownership"
  />

  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
    {/* Cancellation Reasons */}
    <div className="card overflow-hidden">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="chart-title">
            Cancellation Reasons
          </h3>

          <p className="mt-1 text-xs text-ink/45">
            Breakdown of orders by cancellation reason
          </p>
        </div>

        <div className="rounded-xl border border-[#F0E5DE] bg-[#FFF8F4] px-3 py-2 text-right">
          <div className="text-[9px] font-semibold uppercase tracking-wider text-ink/40">
            Total
          </div>

          <div className="text-lg font-extrabold leading-tight text-brand">
            {insights.cancellationReasons
              ?.reduce((sum, item) => sum + item.value, 0)
              .toLocaleString() || 0}
          </div>
        </div>
      </div>

      <CancellationBarChart
        type="reasons"
        reasons={insights.cancellationReasons}
        height={320}
      />
    </div>

    {/* Cancellation Owner */}
    <div className="card overflow-hidden">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="chart-title">
            Cancellation Owner
          </h3>

          <p className="mt-1 text-xs text-ink/45">
            Who is primarily responsible for cancellations
          </p>
        </div>

        <div className="rounded-xl border border-[#F0E5DE] bg-[#FFF8F4] px-3 py-2 text-right">
          <div className="text-[9px] font-semibold uppercase tracking-wider text-ink/40">
            Total
          </div>

          <div className="text-lg font-extrabold leading-tight text-brand">
            {insights.cancellationOwners
              ?.reduce((sum, item) => sum + item.value, 0)
              .toLocaleString() || 0}
          </div>
        </div>
      </div>

      <CancellationBarChart
        type="owners"
        owners={insights.cancellationOwners}
        height={320}
      />
    </div>
  </div>
</section>
                       
                        {/* Orders by Weekday (Sales by Hour removed) */}
                        <section>
  <SectionHeader
    eyebrow="Patterns"
    title="Orders by Weekday"
  />

  <div className="card overflow-hidden">
    <OrdersByWeekdayChart
      data={insights.ordersByWeekday}
      height={350}
    />
  </div>
</section>
                                               
                        {/* Row: Complaints / Subscription orders */}
<QualitySubscriptionsSection
  complaintsByReason={insights.complaintsByReason}
  subscriptionBreakdown={insights.subscriptionBreakdown}
/>

                        {/* ===================== Orders table ===================== */}
                <section>
                  <SectionHeader eyebrow="Details" title="Orders" />
                  <OrdersTable filters={filters} />
                </section>
                        
                      </div>
                    ) : null}
                  </div>
                </section>
              </>
            ) : (
              <div className="text-danger text-sm">Could not load dashboard data.</div>
            )}
          </>
        )}
        </div>
      </main>
    </div>
  );
}
