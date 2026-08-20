'use client';

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CHART_COLORS, TOOLTIP_CONTENT_STYLE, TOOLTIP_LABEL_STYLE, TOOLTIP_ITEM_STYLE, LEGEND_STYLE } from '@/lib/chartTheme';

export default function CategoryDonutChart({ data }: { data: { label: string; value: number }[] }) {
  const total = data.reduce((a, d) => a + d.value, 0);

  if (!data || data.length === 0 || total === 0) {
    return <div className="text-sm text-ink/40 flex items-center justify-center h-[260px]">No data for this range.</div>;
  }

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={272}>
        <PieChart margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
          <Pie
            data={data}
            dataKey="value"
            nameKey="label"
            innerRadius={56}
            outerRadius={86}
            paddingAngle={2}
            stroke="#FFFFFF"
            strokeWidth={2}
            label={({ percent }) => `${((percent ?? 0) * 100).toFixed(0)}%`}
            labelLine={false}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={TOOLTIP_CONTENT_STYLE}
            labelStyle={TOOLTIP_LABEL_STYLE}
            itemStyle={TOOLTIP_ITEM_STYLE}
            formatter={(value: number, name: string) => [value.toLocaleString(), name]}
          />
          <Legend
            verticalAlign="bottom"
            height={40}
            wrapperStyle={LEGEND_STYLE}
            iconType="circle"
            iconSize={8}
            formatter={(value: string) => {
              const item = data.find((d) => d.label === value);
              return `${value} (${item ? item.value.toLocaleString() : '—'})`;
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      {/* Center total — sum of the values already rendered in the chart */}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center" style={{ paddingBottom: 40 }}>
        <div className="text-lg font-bold text-ink leading-none">{total.toLocaleString()}</div>
        <div className="text-2xs text-ink/40 mt-1">Total</div>
      </div>
    </div>
  );
}
