export interface OrderRow {
  id: number;
  restaurant_name: string;
  order_id: number;
  store_id: number | null;
  delivery_type: string | null;
  payment_type: string | null;
  payment_method: string | null;
  is_subscription_order: boolean;
  order_status: string | null;
  order_date: string;
  accepted_at: string | null;
  estimated_ready_at: string | null;
  ready_to_pickup_at: string | null;
  estimated_delivery_at: string | null;
  delivered_at: string | null;
  has_complaint: boolean;
  cancelled_at: string | null;
  subtotal: number;
  tax_charge: number;
  tax_amount: number;
  commission: number;
  marketing_fees_total: number;
  voucher_funded_by_you: number;
  payout_amount: number;
  payout_after_food_cost: number;
  order_hour: number | null;
  prep_time_min: number | null;
  delay_vs_estimate_min: number | null;
  order_month: string | null;
  order_items: string | null;
}

export type CompareMode = 'previous' | 'custom';

export interface DashboardFilters {
  restaurant: string;
  brand: string;
  startDate: string;
  endDate: string;
  compareEnabled: boolean;
  compareMode: CompareMode;
  compareStartDate: string;
  compareEndDate: string;
}

export interface SummaryResponse {
  totalStores: number;
  totalOrders: number;
  totalSales: number;
  payoutAmount: number;
  totalMarketingFees: number;
  taxAmount: number;
  payoutAfterFoodCost: number;
  voucherFundedByYou: number;
  avgOrderHour: number | null;
  avgPrepTimeMin: number | null;
  avgDelayVsEstimateMin: number | null;
  avgDeliveryTimeMin: number | null;

  previous: {
    totalOrders: number;
    totalSales: number;
    payoutAmount: number;
    totalMarketingFees: number;
    taxAmount: number;
  };

  paymentMethodBreakdown: {
    method: string;
    count: number;
  }[];

  hourlyTraffic: {
    hour: number;
    count: number;
  }[];

  dailyFinancials: {
    date: string;
    sales: number;
    commission: number;
    payout: number;
  }[];

  dailyOrders: {
    date: string;
    count: number;
  }[];

  monthlyFinancials: {
    month: string;
    subtotal: number;
    commission: number;
    payout: number;
  }[];

  monthlyOrders: {
    month: string;
    count: number;
  }[];

  restaurants: string[];
}