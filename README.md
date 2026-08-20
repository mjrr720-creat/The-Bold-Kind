# Orders Analysis Dashboard

Next.js 14 (App Router) + Supabase dashboard that replicates your Power BI
"Orders Analysis" report: KPI cards, payment method breakdown, hourly order
traffic, monthly payout trend, an orders table, and an Excel upload flow that
loads a Talabat-style export straight into Supabase.

## 1. Create the Supabase project & table

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** and run `supabase/schema.sql` from this repo. It creates
   the `orders` table, computed columns (`order_hour`, `prep_time_min`,
   `delay_vs_estimate_min`, `payout_after_food_cost`, `order_month`),
   indexes, and RLS policies.
3. Go to **Project Settings → API** and copy:
   - Project URL
   - `anon` public key
   - `service_role` key (keep secret)

## 2. Configure environment variables

```bash
cp .env.local.example .env.local
# then fill in the three Supabase values
```

## 3. Install & run

```bash
npm install
npm run dev
```

Open http://localhost:3000 — the dashboard loads empty until you upload data.

## 4. Upload your Excel export

Click **Upload Excel** on the dashboard and select your orders export. The
upload API (`app/api/upload/route.ts`) expects the same header names as your
sample `Orders.xlsx`:

`Restaurant Name, Order ID, Store ID, Delivery Type, Payment type, Payment
method, Is Subscription Order, Restaurant Address, Order status, Date,
Accepted at, Estimated ready to pick up time, Ready to pick up at, Rider near
pickup at, In delivery at, Estimated delivery time, Delivered at, Has
Complaint?, Complaint Reason, Cancelled at, Cancellation reason,
Cancellation owner, Subtotal, Packaging charges, Minimum order value fee,
Vendor Refunds, Customer Fee Total, Tax Charge, Online Payment Fee, Discount
Funded by you, Voucher Funded by you, Commission, Operational Charges, Ads
Fee, Wait time fee, Marketing Fees Total, Marketing Fees Reasons, Marketing
Fees, Avoidable cancellation fee, Is Payable, Estimated earnings, Cash amount
already collected by you, Amount owed back to Talabat, Payout Amount,
Talabat-Funded Discount, Talabat-Funded Voucher, Total Discount, Total
Voucher, Tax Amount, Order Items`

If your export uses different header text, edit `HEADER_MAP` at the top of
`app/api/upload/route.ts` — everything downstream (KPIs, charts, generated
columns) keys off the mapped snake_case column names, not the Excel headers.

Re-uploading the same file **updates** existing rows instead of duplicating
them (upsert on `order_id`).

## 5. How the dashboard maps to your Power BI report

| Power BI element | Where it lives here |
|---|---|
| Total Stores / Total Orders / Total Sales / Payout / Marketing Fees / Tax Amount tiles | `GET /api/summary` → `KpiCard` components on the dashboard |
| "Previous Sales / Payout / Fees" comparisons | `summary.previous` block — same filters, shifted one period back |
| Aver. Order Hour / Prep Time / Delay vs Estimate | Postgres **generated columns** (`order_hour`, `prep_time_min`, `delay_vs_estimate_min`) computed at insert time, averaged in `/api/summary` |
| Payment Method donut | `PaymentMethodPie` |
| Hourly Order Traffic bars | `HourlyTraffic` |
| Monthly payout bar (top-left stacked chart) | `MonthlyPayout` |
| Restaurant Name / Date filters | `Filters` component, drives every API call |
| Underlying order-level grid | `OrdersTable`, paginated via `/api/orders` |

## 6. Scaling notes

- `/api/summary` currently aggregates in Node after fetching matching rows.
  That's fine up to tens of thousands of orders per query window. Past that,
  swap it for Postgres `rpc()` functions doing `SUM/COUNT/GROUP BY` server-side
  — the schema and column names are already set up for it.
- The `orders` table upserts on `order_id`, so scheduled re-uploads (e.g. a
  daily export) are safe to run repeatedly.
- Add authentication (Supabase Auth) in front of `/api/upload` before putting
  this in production — right now anyone with the URL can upload data.

## Project structure

```
app/
  page.tsx                 # dashboard UI
  api/upload/route.ts       # Excel -> Supabase ingestion
  api/summary/route.ts      # KPI + chart aggregation
  api/orders/route.ts       # paginated order table
components/
  KpiCard.tsx, Filters.tsx, UploadButton.tsx, OrdersTable.tsx
  charts/PaymentMethodPie.tsx, HourlyTraffic.tsx, MonthlyPayout.tsx
lib/
  supabaseClient.ts   # browser client (anon key)
  supabaseAdmin.ts    # server client (service role key)
  types.ts
supabase/
  schema.sql
```
