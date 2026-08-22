'use client';

import { useCallback, useEffect, useState } from 'react';
import { format, subDays } from 'date-fns';
import { DashboardFilters, SummaryResponse } from '@/lib/types';
import { InsightsResponse } from '@/lib/insightsTypes';
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

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<DashboardTab>('orders');

  const [filters, setFilters] = useState<DashboardFilters>({
  restaurant: 'All',
  brand: 'All',        // <-- YE NAYI LINE ADD KAREIN
  startDate: tenDaysAgoISO,
  endDate: todayISO
});
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Separate state/fetch for the additional insights section — kept fully
  // independent from `summary` so a problem here can never affect the
  // existing KPIs/charts above.
  const [insights, setInsights] = useState<InsightsResponse | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(true);
  const [insightsError, setInsightsError] = useState<string | null>(null);

  const loadInsights = useCallback(() => {
    setInsightsLoading(true);
    setInsightsError(null);
    const params = new URLSearchParams({
  restaurant: filters.restaurant,
  brand: filters.brand,     // <-- YE NAYI LINE ADD KAREIN
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

  const loadSummary = useCallback(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({
  restaurant: filters.restaurant,
  brand: filters.brand,     // <-- YE NAYI LINE ADD KAREIN
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

  const fmt = (n: number | null | undefined) =>
    n === null || n === undefined || !Number.isFinite(n) ? '—' : n.toLocaleString(undefined, { maximumFractionDigits: 2 });
  const fmtK = (n: number | null | undefined) => {
    if (n === null || n === undefined || !Number.isFinite(n)) return '—';
    return n >= 1000 ? `${(n / 1000).toFixed(2)}K` : fmt(n);
  };
  const fmtMin = (n: number | null | undefined) => (n === null || n === undefined ? '—' : n.toFixed(2));

  // Sales & Orders Overview — merges the existing monthlyFinancials (Sales)
  // and monthlyOrders (Orders) series from /api/summary, which are already
  // scoped to the selected restaurant + date filters. No new data source.
const salesOrdersOverview = summary
  ? summary.dailyFinancials.map((d) => ({
      date: d.date,
      sales: d.sales,
      orders: summary.dailyOrders.find((o) => o.date === d.date)?.count ?? 0
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
    onChange={setFilters}
  />
</div>

<div className="card-tight flex gap-4">
  <Filters
    filters={filters}
    restaurants={summary?.restaurants ?? []}
    onChange={setFilters}
  />
  <BrandFilter
    value={filters.brand}
    onChange={(brand) => setFilters({ ...filters, brand })}
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
    previousLabel="Prev. Orders"
    previousValue={fmtK(summary.previous.totalOrders)}
    deltaPct={pctChange(
      summary.totalOrders,
      summary.previous.totalOrders
    )}
  />

  <KpiCard
    value={fmtK(summary.totalSales)}
    label="Total Sales"
    previousLabel="Prev. Sales"
    previousValue={fmtK(summary.previous.totalSales)}
    deltaPct={pctChange(
      summary.totalSales,
      summary.previous.totalSales
    )}
  />

  <KpiCard
    value={fmtK(summary.payoutAmount)}
    label="Payout Amount"
    previousLabel="Prev. Payout"
    previousValue={fmtK(summary.previous.payoutAmount)}
    deltaPct={pctChange(
      summary.payoutAmount,
      summary.previous.payoutAmount
    )}
  />

  <KpiCard
    value={fmtK(summary.totalMarketingFees)}
    label="Marketing Fees"
    previousLabel="Prev. Marketing Fees"
    previousValue={fmtK(summary.previous.totalMarketingFees)}
    deltaPct={pctChange(
      summary.totalMarketingFees,
      summary.previous.totalMarketingFees
    )}
  />

</div>


{/* Secondary KPIs */}
<div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">

  <KpiCard
    value={fmtK(summary.taxAmount)}
    label="Tax Amount"
    compact
  />

  <KpiCard
    value={fmtMin(summary.avgOrderHour)}
    label="Avg. Order Hour"
    compact
  />

  <KpiCard
    value={fmtMin(summary.avgPrepTimeMin)}
    label="Avg. Prep Time"
    compact
  />

  <KpiCard
    value={fmtMin(summary.avgDelayVsEstimateMin)}
    label="Avg. Delay vs Estimate"
    compact
  />

  <KpiCard
    value={fmtMin(summary.avgDeliveryTimeMin)}
    label="Avg. Delivery Time"
    compact
  />

  <KpiCard
    value={fmtK(summary.voucherFundedByYou)}
    label="Voucher Funded"
    compact
  />

  <KpiCard
    value={fmtK(summary.payoutAfterFoodCost)}
    label="Payout after FC"
    highlight
    compact
  />

</div>

  </div>
</section>

                {/* ===================== Sales & Orders Overview ===================== */}
                <section>
                  <SectionHeader eyebrow="Trends" title="Sales &amp; Orders Overview" />
                  <div className="card">
                    <SalesOrdersOverviewChart data={salesOrdersOverview} />
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
    <h3 className="chart-title mb-3">
      Orders by Date
    </h3>

    <MonthlyOrdersChart data={summary.dailyOrders} />
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
                              <KpiCard value={fmt(insights.kpis.avgOrderValue)} label="Average Order Value" compact />
                              <KpiCard value={insights.kpis.commissionPct !== null ? `${insights.kpis.commissionPct.toFixed(2)}%` : '—'} label="Commission %" compact />
                              <KpiCard value={insights.kpis.payoutPct !== null ? `${insights.kpis.payoutPct.toFixed(2)}%` : '—'} label="Payout %" compact />
                              <KpiCard value={insights.kpis.cancellationPct !== null ? `${insights.kpis.cancellationPct.toFixed(2)}%` : '—'} label="Cancellation %" compact />
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <KpiCard value={insights.kpis.onTimeDeliveryPct !== null ? `${insights.kpis.onTimeDeliveryPct.toFixed(2)}%` : '—'} label="On-Time Delivery %" compact />
                              <KpiCard value={insights.kpis.complaintPct !== null ? `${insights.kpis.complaintPct.toFixed(2)}%` : '—'} label="Complaint %" compact />
                              <KpiCard value={fmtK(insights.kpis.restaurantDiscount)} label="Restaurant Discount" compact />
                              <KpiCard value={insights.kpis.marketingPct !== null ? `${insights.kpis.marketingPct.toFixed(2)}%` : '—'} label="Marketing %" compact />
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
