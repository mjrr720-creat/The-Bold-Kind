-- ============================================================================
-- Orders Analysis Dashboard — Supabase schema
-- Run this once in the Supabase SQL editor (or via `supabase db push`).
-- ============================================================================

create table if not exists public.orders (
  id                          bigserial primary key,

  -- Identity / routing
  restaurant_name             text not null,
  order_id                    bigint not null unique,
  store_id                    bigint,
  restaurant_address          text,

  -- Order meta
  delivery_type               text,
  payment_type                text,
  payment_method               text,
  is_subscription_order       boolean default false,
  order_status                text,

  -- Timestamps (drive prep time / delay / hourly traffic)
  order_date                  timestamptz not null,
  accepted_at                 timestamptz,
  estimated_ready_at          timestamptz,
  ready_to_pickup_at          timestamptz,
  rider_near_pickup_at        timestamptz,
  in_delivery_at              timestamptz,
  estimated_delivery_at       timestamptz,
  delivered_at                timestamptz,

  -- Complaints / cancellations
  has_complaint                boolean default false,
  complaint_reason             text,
  cancelled_at                 timestamptz,
  cancellation_reason          text,
  cancellation_owner           text,

  -- Money
  subtotal                     numeric(12,2) default 0,
  packaging_charges            numeric(12,2) default 0,
  min_order_value_fee          numeric(12,2) default 0,
  vendor_refunds                numeric(12,2) default 0,
  customer_fee_total            numeric(12,2) default 0,
  tax_charge                    numeric(12,2) default 0,
  online_payment_fee             numeric(12,2) default 0,
  discount_funded_by_you        numeric(12,2) default 0,
  voucher_funded_by_you         numeric(12,2) default 0,
  commission                    numeric(12,2) default 0,
  operational_charges           numeric(12,2) default 0,
  ads_fee                       numeric(12,2) default 0,
  wait_time_fee                 numeric(12,2) default 0,
  marketing_fees_total          numeric(12,2) default 0,
  marketing_fees_reasons        text,
  marketing_fees                numeric(12,2) default 0,
  avoidable_cancellation_fee    numeric(12,2) default 0,
  is_payable                    boolean default true,
  estimated_earnings            numeric(12,2) default 0,
  cash_already_collected        numeric(12,2) default 0,
  amount_owed_back               numeric(12,2) default 0,
  payout_amount                  numeric(12,2) default 0,
  talabat_funded_discount         numeric(12,2) default 0,
  talabat_funded_voucher          numeric(12,2) default 0,
  total_discount                  numeric(12,2) default 0,
  total_voucher                   numeric(12,2) default 0,
  tax_amount                      numeric(12,2) default 0,

  order_items                     text,

  -- Bookkeeping
  uploaded_batch_id                uuid,
  created_at                       timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- Generated columns — computed once on write, indexed, no client-side math
-- ---------------------------------------------------------------------------
alter table public.orders
  add column if not exists order_hour int
    generated always as (extract(hour from order_date)::int) stored;

alter table public.orders
  add column if not exists prep_time_min numeric
    generated always as (
      case when ready_to_pickup_at is not null and accepted_at is not null
        then round(extract(epoch from (ready_to_pickup_at - accepted_at)) / 60.0, 1)
      end
    ) stored;

alter table public.orders
  add column if not exists delay_vs_estimate_min numeric
    generated always as (
      case when delivered_at is not null and estimated_delivery_at is not null
        then round(extract(epoch from (delivered_at - estimated_delivery_at)) / 60.0, 1)
      end
    ) stored;

alter table public.orders
  add column if not exists payout_after_food_cost numeric
    generated always as (round(coalesce(payout_amount,0) - coalesce(subtotal,0), 2)) stored;

alter table public.orders
  add column if not exists order_month date
    generated always as (date_trunc('month', order_date)::date) stored;

-- ---------------------------------------------------------------------------
-- Indexes for the filters/aggregations the dashboard runs constantly
-- ---------------------------------------------------------------------------
create index if not exists idx_orders_date on public.orders (order_date);
create index if not exists idx_orders_restaurant on public.orders (restaurant_name);
create index if not exists idx_orders_status on public.orders (order_status);
create index if not exists idx_orders_hour on public.orders (order_hour);

-- ---------------------------------------------------------------------------
-- RLS: open read for the dashboard, writes only via service-role (upload API)
-- ---------------------------------------------------------------------------
alter table public.orders enable row level security;

create policy "Public read access"
  on public.orders for select
  using (true);

-- No insert/update/delete policy for anon/authenticated: uploads happen
-- through the API route using the service-role key, which bypasses RLS.
