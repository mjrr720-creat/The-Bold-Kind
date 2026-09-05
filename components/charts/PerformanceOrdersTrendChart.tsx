'use client';

import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import { GRID_STROKE, AXIS_TICK, AXIS_LINE, TOOLTIP_CONTENT_STYLE, TOOLTIP_LABEL_STYLE, TOOLTIP_ITEM_STYLE, TOOLTIP_CURSOR } from '@/lib/chartTheme';
import { LabelValue } from '@/lib/performanceTypes';

export default function PerformanceOrdersTrendChart({ data, height = 300 }: { data: LabelValue[]; height?: number }) {
  if (!data || data.length === 0) {
    return (
      <div className="text-sm text-ink/40 flex items-center justify-center" style={{ height }}>
        No data for this range.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: -8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
        <XAxis dataKey="label" tick={AXIS_TICK} axisLine={AXIS_LINE} tickLine={false} />
        <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} width={40} />
        <Tooltip
          contentStyle={TOOLTIP_CONTENT_STYLE}
          labelStyle={TOOLTIP_LABEL_STYLE}
          itemStyle={TOOLTIP_ITEM_STYLE}
          cursor={TOOLTIP_CURSOR}
          formatter={(v: number) => [v.toLocaleString(), 'Orders']}
        />
        <Line type="monotone" dataKey="value" name="Orders" stroke="#E0672E" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
