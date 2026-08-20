import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { v4 as uuid } from 'uuid';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';
export const maxDuration = 60;

// Maps the exact header names used in the Talabat-style export to our
// snake_case Supabase columns. Edit this if your export's headers differ.
const HEADER_MAP: Record<string, string> = {
  'Restaurant Name': 'restaurant_name',
  'Order ID': 'order_id',
  'Store ID': 'store_id',
  'Delivery Type': 'delivery_type',
  'Payment type': 'payment_type',
  'Payment method': 'payment_method',
  'Is Subscription Order': 'is_subscription_order',
  'Restaurant Address': 'restaurant_address',
  'Order status': 'order_status',
  'Date': 'order_date',
  'Accepted at': 'accepted_at',
  'Estimated ready to pick up time': 'estimated_ready_at',
  'Ready to pick up at': 'ready_to_pickup_at',
  'Rider near pickup at': 'rider_near_pickup_at',
  'In delivery at': 'in_delivery_at',
  'Estimated delivery time': 'estimated_delivery_at',
  'Delivered at': 'delivered_at',
  'Has Complaint?': 'has_complaint',
  'Complaint Reason': 'complaint_reason',
  'Cancelled at': 'cancelled_at',
  'Cancellation reason': 'cancellation_reason',
  'Cancellation owner': 'cancellation_owner',
  'Subtotal': 'subtotal',
  'Packaging charges': 'packaging_charges',
  'Minimum order value fee': 'min_order_value_fee',
  'Vendor Refunds': 'vendor_refunds',
  'Customer Fee Total': 'customer_fee_total',
  'Tax Charge': 'tax_charge',
  'Online Payment Fee': 'online_payment_fee',
  'Discount Funded by you': 'discount_funded_by_you',
  'Voucher Funded by you': 'voucher_funded_by_you',
  'Commission': 'commission',
  'Operational Charges': 'operational_charges',
  'Ads Fee': 'ads_fee',
  'Wait time fee': 'wait_time_fee',
  'Marketing Fees Total': 'marketing_fees_total',
  'Marketing Fees Reasons': 'marketing_fees_reasons',
  'Marketing Fees': 'marketing_fees',
  'Avoidable cancellation fee': 'avoidable_cancellation_fee',
  'Is Payable': 'is_payable',
  'Estimated earnings': 'estimated_earnings',
  'Cash amount already collected by you': 'cash_already_collected',
  'Amount owed back to Talabat': 'amount_owed_back',
  'Payout Amount': 'payout_amount',
  'Talabat-Funded Discount': 'talabat_funded_discount',
  'Talabat-Funded Voucher': 'talabat_funded_voucher',
  'Total Discount': 'total_discount',
  'Total Voucher': 'total_voucher',
  'Tax Amount': 'tax_amount',
  'Order Items': 'order_items'
};

const BOOLEAN_COLS = new Set(['is_subscription_order', 'has_complaint', 'is_payable']);
const DATE_COLS = new Set([
  'order_date', 'accepted_at', 'estimated_ready_at', 'ready_to_pickup_at',
  'rider_near_pickup_at', 'in_delivery_at', 'estimated_delivery_at',
  'delivered_at', 'cancelled_at'
]);
const NUMERIC_COLS = new Set([
  'store_id', 'order_id', 'subtotal', 'packaging_charges', 'min_order_value_fee',
  'vendor_refunds', 'customer_fee_total', 'tax_charge', 'online_payment_fee',
  'discount_funded_by_you', 'voucher_funded_by_you', 'commission',
  'operational_charges', 'ads_fee', 'wait_time_fee', 'marketing_fees_total',
  'marketing_fees', 'avoidable_cancellation_fee', 'estimated_earnings',
  'cash_already_collected', 'amount_owed_back', 'payout_amount',
  'talabat_funded_discount', 'talabat_funded_voucher', 'total_discount',
  'total_voucher', 'tax_amount'
]);

function excelDateToISO(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'number') {
    // Excel serial date -> JS Date
    const parsed = XLSX.SSF.parse_date_code(value);
    if (!parsed) return null;
    return new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d, parsed.H, parsed.M, Math.floor(parsed.S))).toISOString();
  }
  const asDate = new Date(String(value));
  return isNaN(asDate.getTime()) ? null : asDate.toISOString();
}

function toBoolean(value: unknown): boolean {
  const s = String(value ?? '').trim().toLowerCase();
  return s === 'y' || s === 'yes' || s === 'true' || s === '1';
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded. Attach an .xlsx file under the "file" field.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: false });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, { defval: null, raw: true });

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Sheet is empty.' }, { status: 400 });
    }

    const batchId = uuid();
    const mappedRows = rows.map((row) => {
      const out: Record<string, unknown> = { uploaded_batch_id: batchId };

      for (const [excelHeader, dbCol] of Object.entries(HEADER_MAP)) {
        const raw = row[excelHeader];

        if (DATE_COLS.has(dbCol)) {
          out[dbCol] = excelDateToISO(raw);
        } else if (BOOLEAN_COLS.has(dbCol)) {
          out[dbCol] = toBoolean(raw);
        } else if (NUMERIC_COLS.has(dbCol)) {
          out[dbCol] = raw === null || raw === '' ? 0 : Number(raw);
        } else {
          out[dbCol] = raw === null ? null : String(raw);
        }
      }
      return out;
    });

    // Drop rows with no order_id or order_date — not usable
    const validRows = mappedRows.filter((r) => r.order_id && r.order_date);
    const skipped = mappedRows.length - validRows.length;

    if (validRows.length === 0) {
      return NextResponse.json({ error: 'No valid rows found. Check that "Order ID" and "Date" columns are present.' }, { status: 400 });
    }

    // Upsert in chunks to stay under request size limits, keyed on order_id
    // so re-uploading the same export updates rather than duplicates.
    const CHUNK = 500;
    let inserted = 0;
    for (let i = 0; i < validRows.length; i += CHUNK) {
      const chunk = validRows.slice(i, i + CHUNK);
      const { error } = await supabaseAdmin
        .from('orders')
        .upsert(chunk, { onConflict: 'order_id' });
      if (error) {
        return NextResponse.json({ error: error.message, insertedSoFar: inserted }, { status: 500 });
      }
      inserted += chunk.length;
    }

    return NextResponse.json({
      success: true,
      rowsInProcessedFile: rows.length,
      rowsInserted: inserted,
      rowsSkipped: skipped,
      batchId
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Upload failed' }, { status: 500 });
  }
}
