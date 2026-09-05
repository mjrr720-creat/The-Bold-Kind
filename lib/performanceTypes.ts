// Types for the Performance Analysis module ONLY.
// This is intentionally separate from lib/types.ts and lib/insightsTypes.ts
// (which belong to Order Analysis) so the two modules never share type
// definitions that could couple their logic together.

export interface PerformanceFilters {
  restaurant: string; // 'All' or pipe-separated outlet names, e.g. 'Taco Loco|BASKD'
  startDate: string;
  endDate: string;
  compareEnabled: boolean;
  compareMode: 'previous' | 'custom';
  compareStartDate: string;
  compareEndDate: string;
}

export interface LabelValue {
  label: string;
  value: number;
}

// One row per calendar day in the selected range (continuous — zero-filled
// for days with no rows) so current vs. previous-period comparisons can be
// aligned by relative day number rather than by calendar date.
export interface DailyMetric {
  date: string; // yyyy-MM-dd
  orders: number; // SUM(Orders count)
  grossSales: number; // SUM(Gross Sales)
  cancellationPct: number | null; // Cancelled Orders / Orders count * 100
  complaintPct: number | null; // Total customer complaints received / Orders count * 100
  avgPrepTimeMin: number | null; // weighted AVG(Average preparation time (minutes)), invalid values ignored
}

export interface RestaurantPerformanceRow {
  outletName: string;
  orders: number; // SUM(Orders count)
  successfulOrders: number; // SUM(Successful Orders)
  grossSales: number; // SUM(Gross Sales)
  avgOrderValue: number | null; // grossSales / orders
  avgPrepTimeMin: number | null; // weighted AVG(Average preparation time (minutes))
  cancellationPct: number | null; // Cancelled Orders / Orders * 100
  complaintPct: number | null; // Total customer complaints received / Orders * 100
}

export interface PerformanceKpis {
  totalStores: number; // DISTINCT COUNT of Restaurant ID
  totalOrders: number; // SUM(Orders count)
  totalGrossSales: number; // SUM(Gross Sales)
  totalProRevenue: number; // SUM(Pro Revenue)
  totalMenuViews: number; // SUM(Viewed your menu)
  totalImpressions: number; // SUM(Impressions)
  addedToCart: number; // SUM(Added items to cart)
  cancelledOrders: number; // SUM(Cancelled Orders)
  newCustomerOrders: number; // SUM(Orders from new customers)
  salesLoss: number; // SUM(Sales loss)
}

export interface PerformanceResponse {
  kpis: PerformanceKpis;

  dailyMetrics: DailyMetric[]; // continuous day-by-day series for the selected range

  prepTimeBuckets: LabelValue[]; // Bucket1 / Bucket2 / Bucket3 order counts, straight from source columns
  cancellationReasons: LabelValue[]; // COUNT by "Avoidable Cancellation Reason" (only reason field the source has)
  complaintReasons: LabelValue[]; // COUNT by "Customer Complaint Reason"
  newVsReturning: LabelValue[]; // Orders from new customers vs returning
  funnel: LabelValue[]; // Impressions -> Viewed -> Added to cart -> Placed order

  restaurantPerformance: RestaurantPerformanceRow[]; // per outlet, sorted by Gross Sales desc

  restaurants: string[]; // distinct outlet names for the filter dropdown
  availableDateRange: { min: string | null; max: string | null }; // actual min/max Date present in the table (unfiltered)
}
