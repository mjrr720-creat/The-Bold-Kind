export interface LabelValue {
  label: string;
  value: number;
}

export interface MonthSeriesPoint {
  month: string;
  restaurantFunded: number;
  talabatFunded: number;
}

export interface RestaurantPerformanceRow {
  restaurantName: string;
  sales: number; // SUM(Subtotal)
  orders: number; // COUNT(Order ID)
  avgOrderValue: number | null; // sales / orders
  commission: number; // SUM(Commission)
  payout: number; // SUM(Payout Amount)
}

export interface InsightsResponse {
  kpis: {
    avgOrderValue: number | null; // SUM(Subtotal) / COUNT(Order ID)
    commissionPct: number | null; // SUM(Commission) / SUM(Subtotal) * 100
    payoutPct: number | null; // SUM(Payout Amount) / SUM(Subtotal) * 100
    cancellationPct: number | null; // Cancelled orders / Total orders * 100
    onTimeDeliveryPct: number | null; // Delivered <= Estimated delivery time, over orders with both timestamps
    complaintPct: number | null; // Has Complaint = Yes / Total orders * 100
    restaurantDiscount: number; // SUM(Discount Funded by you)
    marketingPct: number | null; // SUM(Marketing Fees Total) / SUM(Subtotal) * 100
  };
  topRestaurantsBySales: LabelValue[]; // top 10, SUM(Subtotal)
  orderStatusBreakdown: LabelValue[]; // COUNT(Order ID) by Order status
  cancellationReasons: LabelValue[]; // COUNT(Order ID) by Cancellation reason
  cancellationOwners: LabelValue[]; // COUNT(Order ID) by Cancellation owner
  ordersByWeekday: LabelValue[]; // COUNT(Order ID) by day of week, Monday first
  salesByHour: LabelValue[]; // SUM(Subtotal) by Hour(Date), 0-23
  hourlyOrderCounts: LabelValue[]; // COUNT(Order ID) by Hour, 0-23 — heatmap source
  prepTimeByRestaurant: LabelValue[]; // top 15 by volume, AVG(Ready - Accepted) minutes
  deliveryDelayBuckets: LabelValue[]; // COUNT(Order ID) by delay category
  discountFundingByMonth: MonthSeriesPoint[]; // Discount Funded by you vs Talabat-Funded Discount
  marketingCostByMonth: LabelValue[]; // SUM(Marketing Fees Total) by Month (label = month)
  complaintsByReason: LabelValue[]; // COUNT(Order ID) by Complaint Reason
  subscriptionBreakdown: LabelValue[]; // COUNT(Order ID) by subscription Yes/No
  deliveryTypeBreakdown: LabelValue[]; // COUNT(Order ID) by Delivery Type
  restaurantPerformance: RestaurantPerformanceRow[]; // per-restaurant Sales/Orders/AOV/Commission/Payout, sorted by Sales desc
}
