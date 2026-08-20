'use client';

import { RestaurantPerformanceRow } from '@/lib/insightsTypes';

const money = (n: number | null | undefined) =>
  n === null || n === undefined || !Number.isFinite(Number(n))
    ? '—'
    : Number(n).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

export default function RestaurantPerformanceTable({
  data,
}: {
  data: RestaurantPerformanceRow[];
}) {
  if (!data || data.length === 0) {
    return (
      <div className="text-sm text-ink/40 py-8 text-center">
        No data for this range.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-black/[0.07] bg-white">
      <div className="table-wrap max-h-[420px] overflow-y-auto">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-10">
            <tr className="bg-[#F7F4F1] border-b border-black/[0.08]">
              {/* Restaurant Name */}
              <th className="px-4 py-3.5 text-left text-[12px] font-semibold uppercase tracking-[0.08em] text-ink/55 whitespace-nowrap">
                Restaurant Name
              </th>

              {/* Sales */}
              <th className="px-4 py-3.5 text-center text-[12px] font-semibold uppercase tracking-[0.08em] text-ink/55 whitespace-nowrap">
                Sales
              </th>

              {/* Orders */}
              <th className="px-4 py-3.5 text-center text-[12px] font-semibold uppercase tracking-[0.08em] text-ink/55 whitespace-nowrap">
                Orders
              </th>

              {/* Avg Order Value */}
              <th className="px-4 py-3.5 text-center text-[12px] font-semibold uppercase tracking-[0.08em] text-ink/55 whitespace-nowrap">
                Avg. Order Value
              </th>

              {/* Commission */}
              <th className="px-4 py-3.5 text-center text-[12px] font-semibold uppercase tracking-[0.08em] text-ink/55 whitespace-nowrap">
                Commission
              </th>

              {/* Payout */}
              <th className="px-4 py-3.5 text-center text-[12px] font-semibold uppercase tracking-[0.08em] text-ink/55 whitespace-nowrap">
                Payout
              </th>
            </tr>
          </thead>

          <tbody>
            {data.map((r, index) => (
              <tr
                key={r.restaurantName}
                className={`
                  border-b border-black/[0.055]
                  transition-colors duration-150
                  hover:bg-[#FFF8F3]
                  ${index % 2 === 1 ? 'bg-[#FCFBFA]' : 'bg-white'}
                `}
              >
                {/* Restaurant Name — LEFT */}
                <td
                  className="px-4 py-3.5 text-left text-[13px] font-medium text-ink whitespace-nowrap"
                  title={r.restaurantName}
                >
                  <div className="max-w-[300px] truncate">
                    {r.restaurantName}
                  </div>
                </td>

                {/* Sales — CENTER */}
                <td className="px-4 py-3.5 text-center text-[13px] tabular-nums font-medium text-ink">
                  {money(r.sales)}
                </td>

                {/* Orders — CENTER */}
                <td className="px-4 py-3.5 text-center text-[13px] tabular-nums text-ink/70">
                  {r.orders.toLocaleString()}
                </td>

                {/* Avg Order Value — CENTER */}
                <td className="px-4 py-3.5 text-center text-[13px] tabular-nums text-ink">
                  {money(r.avgOrderValue)}
                </td>

                {/* Commission — CENTER */}
                <td className="px-4 py-3.5 text-center text-[13px] tabular-nums text-ink/65">
                  {money(r.commission)}
                </td>

                {/* Payout — CENTER */}
                <td className="px-4 py-3.5 text-center text-[13px] tabular-nums font-semibold text-ink">
                  {money(r.payout)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}