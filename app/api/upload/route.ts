import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { v4 as uuid } from 'uuid';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * This upload route supports the NEW Supabase schema.
 *
 * The Excel file can use the new Talabat-style headers:
 *   Restaurant name
 *   Order ID
 *   Store ID
 *   Order received at
 *   Payout Amount
 *   etc.
 *
 * It also supports a few legacy header variants such as:
 *   Restaurant Name
 *   Date
 *
 * The data is converted to the exact column names used by the NEW
 * Supabase "orders" table.
 */

const HEADER_MAP: Record<string, string[]> = {
  'Restaurant name': ['Restaurant name', 'Restaurant Name'],
  'Order ID': ['Order ID'],
  'Store ID': ['Store ID'],
  'Delivery Type': ['Delivery Type'],
  'Payment type': ['Payment type'],
  'Payment method': ['Payment method'],
  'Is Subscription Order': ['Is Subscription Order'],
  'Restaurant Address': ['Restaurant Address'],
  'Order status': ['Order status'],
  'Order received at': ['Order received at', 'Date'],
  'Accepted at': ['Accepted at'],
  'Estimated ready to pick up time': [
    'Estimated ready to pick up time'
  ],
  'Ready to pick up at': ['Ready to pick up at'],
  'Rider near pickup at': ['Rider near pickup at'],
  'In delivery at': ['In delivery at'],
  'Estimated delivery time': ['Estimated delivery time'],
  'Delivered at': ['Delivered at'],
  'Has Complaint?': ['Has Complaint?'],
  'Complaint Reason': ['Complaint Reason'],
  'Cancelled at': ['Cancelled at'],
  'Cancellation reason': ['Cancellation reason'],
  'Cancellation owner': ['Cancellation owner'],
  'Subtotal': ['Subtotal'],
  'Packaging charges': ['Packaging charges'],
  'Minimum order value fee': ['Minimum order value fee'],
  'Vendor Refunds': ['Vendor Refunds'],
  'Customer Fee Total': ['Customer Fee Total'],
  'Tax Charge': ['Tax Charge'],
  'Online Payment Fee': ['Online Payment Fee'],
  'Discount Funded by you': ['Discount Funded by you'],
  'Voucher Funded by you': ['Voucher Funded by you'],
  'Commission': ['Commission'],
  'Operational Charges': ['Operational Charges'],
  'Ads Fee': ['Ads Fee'],
  'Wait time fee': ['Wait time fee'],
  'Marketing Fees Total': ['Marketing Fees Total'],
  'Marketing Fees Reasons': ['Marketing Fees Reasons'],
  'Marketing Fees': ['Marketing Fees'],
  'Avoidable cancellation fee': [
    'Avoidable cancellation fee'
  ],
  'Is Payable': ['Is Payable'],
  'Estimated earnings': ['Estimated earnings'],
  'Cash amount already collected by you': [
    'Cash amount already collected by you'
  ],
  'Amount owed back to Talabat': [
    'Amount owed back to Talabat'
  ],
  'Payout Amount': ['Payout Amount'],
  'Talabat-Funded Discount': [
    'Talabat-Funded Discount'
  ],
  'Talabat-Funded Voucher': [
    'Talabat-Funded Voucher'
  ],
  'Total Discount': ['Total Discount'],
  'Total Voucher': ['Total Voucher'],
  'Tax Amount': ['Tax Amount'],
  'Order Items': ['Order Items']
};

const BOOLEAN_COLUMNS = new Set([
  'Is Subscription Order',
  'Has Complaint?',
  'Is Payable'
]);

const DATE_COLUMNS = new Set([
  'Order received at',
  'Accepted at',
  'Estimated ready to pick up time',
  'Ready to pick up at',
  'Rider near pickup at',
  'In delivery at',
  'Estimated delivery time',
  'Delivered at',
  'Cancelled at'
]);

const NUMERIC_COLUMNS = new Set([
  'Store ID',
  'Order ID',
  'Subtotal',
  'Packaging charges',
  'Minimum order value fee',
  'Vendor Refunds',
  'Customer Fee Total',
  'Tax Charge',
  'Online Payment Fee',
  'Discount Funded by you',
  'Voucher Funded by you',
  'Commission',
  'Operational Charges',
  'Ads Fee',
  'Wait time fee',
  'Marketing Fees Total',
  'Marketing Fees',
  'Avoidable cancellation fee',
  'Estimated earnings',
  'Cash amount already collected by you',
  'Amount owed back to Talabat',
  'Payout Amount',
  'Talabat-Funded Discount',
  'Talabat-Funded Voucher',
  'Total Discount',
  'Total Voucher',
  'Tax Amount'
]);

function excelDateToISO(
  value: unknown
): string | null {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === 'number') {
    const parsed =
      XLSX.SSF.parse_date_code(value);

    if (!parsed) {
      return null;
    }

    return new Date(
      Date.UTC(
        parsed.y,
        parsed.m - 1,
        parsed.d,
        parsed.H,
        parsed.M,
        Math.floor(parsed.S)
      )
    ).toISOString();
  }

  const stringValue =
    String(value).trim();

  const parsedDate =
    new Date(stringValue);

  return Number.isNaN(
    parsedDate.getTime()
  )
    ? null
    : parsedDate.toISOString();
}

function toBoolean(
  value: unknown
): boolean {
  const s =
    String(value ?? '')
      .trim()
      .toLowerCase();

  return (
    s === 'y' ||
    s === 'yes' ||
    s === 'true' ||
    s === '1'
  );
}

function findHeaderValue(
  row: Record<string, unknown>,
  possibleHeaders: string[]
): unknown {
  for (const header of possibleHeaders) {
    if (
      Object.prototype.hasOwnProperty.call(
        row,
        header
      )
    ) {
      return row[header];
    }
  }

  return null;
}

function convertValue(
  column: string,
  value: unknown
): unknown {
  if (
    DATE_COLUMNS.has(column)
  ) {
    return excelDateToISO(value);
  }

  if (
    BOOLEAN_COLUMNS.has(column)
  ) {
    return toBoolean(value);
  }

  if (
    NUMERIC_COLUMNS.has(column)
  ) {
    if (
      value === null ||
      value === undefined ||
      value === ''
    ) {
      return 0;
    }

    const numberValue =
      Number(value);

    return Number.isFinite(
      numberValue
    )
      ? numberValue
      : 0;
  }

  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return null;
  }

  return String(value);
}

export async function POST(
  req: NextRequest
) {
  try {
    const formData =
      await req.formData();

    const file =
      formData.get('file') as
        | File
        | null;

    if (!file) {
      return NextResponse.json(
        {
          error:
            'No file uploaded. Attach an .xlsx file under the "file" field.'
        },
        { status: 400 }
      );
    }

    const fileName =
      file.name.toLowerCase();

    if (
      !fileName.endsWith('.xlsx') &&
      !fileName.endsWith('.xls')
    ) {
      return NextResponse.json(
        {
          error:
            'Please upload an Excel .xlsx or .xls file.'
        },
        { status: 400 }
      );
    }

    const buffer =
      Buffer.from(
        await file.arrayBuffer()
      );

    const workbook =
      XLSX.read(buffer, {
        type: 'buffer',
        cellDates: false
      });

    const firstSheetName =
      workbook.SheetNames[0];

    if (!firstSheetName) {
      return NextResponse.json(
        {
          error:
            'Workbook does not contain a sheet.'
        },
        { status: 400 }
      );
    }

    const sheet =
      workbook.Sheets[
        firstSheetName
      ];

    const rows =
      XLSX.utils.sheet_to_json<
        Record<string, unknown>
      >(sheet, {
        defval: null,
        raw: true
      });

    if (
      rows.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            'Sheet is empty.'
        },
        { status: 400 }
      );
    }

    // ---------------------------------------------------------------
    // Convert Excel rows to NEW Supabase column names.
    // ---------------------------------------------------------------

    const mappedRows =
      rows.map((row) => {
        const output: Record<
          string,
          unknown
        > = {};

        for (const [
          dbColumn,
          possibleHeaders
        ] of Object.entries(
          HEADER_MAP
        )) {
          const rawValue =
            findHeaderValue(
              row,
              possibleHeaders
            );

          output[dbColumn] =
            convertValue(
              dbColumn,
              rawValue
            );
        }

        return output;
      });

    // ---------------------------------------------------------------
    // Validate required fields.
    // ---------------------------------------------------------------

    const validRows =
      mappedRows.filter(
        (row) => {
          const orderId =
            row['Order ID'];

          const orderDate =
            row[
              'Order received at'
            ];

          return (
            orderId !== null &&
            orderId !== undefined &&
            orderId !== 0 &&
            orderId !== '' &&
            orderDate !== null &&
            orderDate !== undefined &&
            orderDate !== ''
          );
        }
      );

    const skipped =
      mappedRows.length -
      validRows.length;

    if (
      validRows.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            'No valid rows found. Check that "Order ID" and "Order received at" columns are present.',
          rowsInProcessedFile:
            rows.length,
          rowsSkipped: skipped
        },
        { status: 400 }
      );
    }

    // ---------------------------------------------------------------
    // Upload in chunks.
    //
    // IMPORTANT:
    // This uses Order ID as the conflict key because your previous
    // workflow was based on updating an existing order when the same
    // order_id is uploaded again.
    //
    // The NEW Supabase table must have a UNIQUE constraint/index on
    // "Order ID" for this upsert to work.
    // ---------------------------------------------------------------

    const CHUNK = 500;

    let inserted = 0;

    for (
      let i = 0;
      i < validRows.length;
      i += CHUNK
    ) {
      const chunk =
        validRows.slice(
          i,
          i + CHUNK
        );

      const {
        error
      } =
        await supabaseAdmin
          .from('orders')
          .upsert(
            chunk,
            {
              onConflict:
                'Order ID'
            }
          );

      if (error) {
        return NextResponse.json(
          {
            error:
              error.message,
            insertedSoFar:
              inserted
          },
          { status: 500 }
        );
      }

      inserted +=
        chunk.length;
    }

    const batchId =
      uuid();

    return NextResponse.json({
      success: true,
      rowsInProcessedFile:
        rows.length,
      rowsInserted:
        inserted,
      rowsSkipped:
        skipped,
      batchId
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        error:
          err?.message ??
          'Upload failed'
      },
      { status: 500 }
    );
  }
}