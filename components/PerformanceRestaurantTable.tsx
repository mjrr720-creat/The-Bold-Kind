'use client';

import { RestaurantPerformanceRow } from '@/lib/performanceTypes';

const money = (n: number | null | undefined) =>
  n === null || n === undefined || !Number.isFinite(Number(n))
    ? '—'
    : Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const pct = (n: number | null | undefined) =>
  n === null || n === undefined || !Number.isFinite(Number(n)) ? '—' : `${Number(n).toFixed(2)}%`;

const mins = (n: number | null | undefined) =>
  n === null || n === undefined || !Number.isFinite(Number(n)) ? '—' : `${Number(n).toFixed(1)} min`;

export default function PerformanceRestaurantTable({ data }: { data: RestaurantPerformanceRow[] }) {
  if (!data || data.length === 0) {
    return <div className="text-sm text-ink/40 py-8 text-center">No data for this range.</div>;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-black/[0.07] bg-white">
      <div className="table-wrap max-h-[420px] overflow-y-auto">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-10">
            <tr className="bg-[#F7F4F1] border-b border-black/[0.08]">
              <th className="px-4 py-3.5 text-left text-[12px] font-semibold uppercase tracking-[0.08em] text-ink/55 whitespace-nowrap">
                Outlet
              </th>
              <th className="px-4 py-3.5 text-center text-[12px] font-semibold uppercase tracking-[0.08em] text-ink/55 whitespace-nowrap">
                Gross Sales
              </th>
              <th className="px-4 py-3.5 text-center text-[12px] font-semibold uppercase tracking-[0.08em] text-ink/55 whitespace-nowrap">
                Orders
              </th>
              <th className="px-4 py-3.5 text-center text-[12px] font-semibold uppercase tracking-[0.08em] text-ink/55 whitespace-nowrap">
                Avg. Order Value
              </th>
              <th className="px-4 py-3.5 text-center text-[12px] font-semibold uppercase tracking-[0.08em] text-ink/55 whitespace-nowrap">
                Avg. Prep Time
              </th>
              <th className="px-4 py-3.5 text-center text-[12px] font-semibold uppercase tracking-[0.08em] text-ink/55 whitespace-nowrap">
                Cancellation %
              </th>
              <th className="px-4 py-3.5 text-center text-[12px] font-semibold uppercase tracking-[0.08em] text-ink/55 whitespace-nowrap">
                Complaint %
              </th>
            </tr>
          </thead>

          <tbody>
            {data.map((r, index) => (
              <tr
                key={r.outletName}
                className={`border-b border-black/[0.055] transition-colors duration-150 hover:bg-[#FFF8F3] ${
                  index % 2 === 1 ? 'bg-[#FCFBFA]' : 'bg-white'
                }`}
              >
                <td className="px-4 py-3.5 text-left text-[13px] font-medium text-ink whitespace-nowrap" title={r.outletName}>
                  <div className="max-w-[300px] truncate">{r.outletName}</div>
                </td>
                <td className="px-4 py-3.5 text-center text-[13px] tabular-nums font-medium text-ink">
                  {money(r.grossSales)}
                </td>
                <td className="px-4 py-3.5 text-center text-[13px] tabular-nums text-ink/70">
                  {r.orders.toLocaleString()}
                </td>
                <td className="px-4 py-3.5 text-center text-[13px] tabular-nums text-ink">{money(r.avgOrderValue)}</td>
                <td className="px-4 py-3.5 text-center text-[13px] tabular-nums text-ink/65">{mins(r.avgPrepTimeMin)}</td>
                <td className="px-4 py-3.5 text-center text-[13px] tabular-nums text-ink/65">{pct(r.cancellationPct)}</td>
                <td className="px-4 py-3.5 text-center text-[13px] tabular-nums font-semibold text-ink">
                  {pct(r.complaintPct)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
