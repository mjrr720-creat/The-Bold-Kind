'use client';

import { useEffect, useState } from 'react';
import { DashboardFilters } from '@/lib/types';
import StatusBadge from '@/components/StatusBadge';

interface Row {
  order_id: number;
  restaurant_name: string | null;
  order_date: string | null;
  order_status: string | null;
  payment_method: string | null;
  subtotal: number | null;
  payout_amount: number | null;
  tax_amount: number | null;
  order_items: string | null;
}

const money = (n: number | null | undefined) => (n === null || n === undefined || !Number.isFinite(Number(n)) ? '—' : Number(n).toFixed(2));
const dateStr = (d: string | null | undefined) => {
  if (!d) return '—';
  const parsed = new Date(d);
  return Number.isFinite(parsed.getTime()) ? parsed.toLocaleString() : '—';
};

export default function OrdersTable({ filters }: { filters: DashboardFilters }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPage(1);
  }, [filters]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({
      restaurant: filters.restaurant,
      startDate: filters.startDate,
      endDate: filters.endDate,
      page: String(page),
      pageSize: String(pageSize)
    });
    fetch(`/api/orders?${params}`)
      .then(async (r) => {
        const json = await r.json();
        if (!r.ok || json?.error) throw new Error(json?.error ?? 'Failed to load orders');
        setRows(json.rows ?? []);
        setTotal(json.total ?? 0);
      })
      .catch((err: Error) => {
        setError(err.message);
        setRows([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [filters, page]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="chart-title">Orders</h3>
        <span className="badge badge-neutral">{total.toLocaleString()} orders</span>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Restaurant</th>
              <th>Date</th>
              <th>Status</th>
              <th>Payment</th>
              <th className="text-right">Subtotal</th>
              <th className="text-right">Payout</th>
              <th>Items</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="py-8 text-center text-ink/35">Loading…</td></tr>
            ) : error ? (
              <tr><td colSpan={8} className="py-8 text-center text-danger">Could not load orders: {error}</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={8} className="py-8 text-center text-ink/35">No orders in this range.</td></tr>
            ) : (
              rows.map((r) => (
                <tr key={r.order_id}>
                  <td className="whitespace-nowrap font-medium text-ink/70 tabular-nums">{r.order_id}</td>
                  <td className="max-w-[160px] truncate" title={r.restaurant_name ?? undefined}>{r.restaurant_name ?? '—'}</td>
                  <td className="whitespace-nowrap text-ink/55">{dateStr(r.order_date)}</td>
                  <td><StatusBadge status={r.order_status} /></td>
                  <td className="text-ink/55">{r.payment_method ?? '—'}</td>
                  <td className="text-right tabular-nums">{money(r.subtotal)}</td>
                  <td className="text-right tabular-nums font-medium">{money(r.payout_amount)}</td>
                  <td className="max-w-[220px] truncate text-ink/55" title={r.order_items ?? ''}>{r.order_items ?? '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-end gap-2 mt-4">
        <button
          disabled={page <= 1}
          onClick={() => setPage((p) => p - 1)}
          className="btn-ghost"
        >
          Prev
        </button>
        <span className="text-xs text-ink/45 px-1">Page {page} of {totalPages}</span>
        <button
          disabled={page >= totalPages}
          onClick={() => setPage((p) => p + 1)}
          className="btn-ghost"
        >
          Next
        </button>
      </div>
    </div>
  );
}
