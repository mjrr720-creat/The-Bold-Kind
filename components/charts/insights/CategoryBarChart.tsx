'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, LabelList } from 'recharts';
import { GRID_STROKE, AXIS_TICK, AXIS_LINE, TOOLTIP_CONTENT_STYLE, TOOLTIP_LABEL_STYLE, TOOLTIP_ITEM_STYLE, TOOLTIP_CURSOR, truncateLabel } from '@/lib/chartTheme';

interface Props {
  data: { label: string; value: number }[];
  layout?: 'horizontal' | 'vertical'; // 'vertical' = bars extend horizontally, for long labels
  color?: string;
  valueSuffix?: string;
  height?: number;
}

// Custom Y-axis tick that truncates long category names (e.g. restaurant
// names) with an ellipsis so they never overlap the chart area. The full
// name is still available via the tooltip and a native <title> hover.
function TruncatedYAxisTick({ x, y, payload }: any) {
  const full = String(payload.value ?? '');
  const label = truncateLabel(full, 20);
  return (
    <g transform={`translate(${x},${y})`}>
      <title>{full}</title>
      <text x={0} y={0} dy={4} textAnchor="end" fontSize={11} fill="#211B18" fillOpacity={0.6}>
        {label}
      </text>
    </g>
  );
}

function TruncatedXAxisTick({ x, y, payload }: any) {
  const full = String(payload.value ?? '');
  const label = truncateLabel(full, 12);
  return (
    <g transform={`translate(${x},${y})`}>
      <title>{full}</title>
      <text x={0} y={0} dy={12} textAnchor="middle" fontSize={11} fill="#211B18" fillOpacity={0.6}>
        {label}
      </text>
    </g>
  );
}

export default function CategoryBarChart({ data, layout = 'horizontal', color = '#E0672E', valueSuffix = '', height = 280 }: Props) {
  const hasData = data.some((d) => Number.isFinite(d.value) && d.value !== 0);
  if (!data || data.length === 0 || !hasData) {
    return <div className="text-sm text-ink/40 flex items-center justify-center" style={{ height }}>No data for this range.</div>;
  }

  const isVertical = layout === 'vertical';
  const formatValue = (v: number) =>
    `${v.toLocaleString(undefined, { maximumFractionDigits: 2 })}${valueSuffix}`;

  // Size the label gutter to the longest label (capped) so short label sets
  // stay compact while long restaurant names still get room to breathe.
  const longestLabel = Math.max(0, ...data.map((d) => (d.label ?? '').length));
  const yAxisWidth = isVertical ? Math.min(180, Math.max(96, longestLabel * 6.2)) : undefined;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout={isVertical ? 'vertical' : 'horizontal'}
        margin={{ top: 8, right: isVertical ? 44 : 12, left: isVertical ? 4 : -8, bottom: isVertical ? 0 : data.length > 8 ? 8 : 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} horizontal={!isVertical} vertical={isVertical} />
        {isVertical ? (
          <>
            <XAxis type="number" tick={AXIS_TICK} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="label" width={yAxisWidth} tick={<TruncatedYAxisTick />} axisLine={false} tickLine={false} />
          </>
        ) : (
          <>
            <XAxis
              dataKey="label"
              tick={<TruncatedXAxisTick />}
              axisLine={AXIS_LINE}
              tickLine={false}
              interval={0}
              height={data.length > 8 ? 42 : 28}
            />
            <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} width={40} />
          </>
        )}
        <Tooltip
          contentStyle={TOOLTIP_CONTENT_STYLE}
          labelStyle={TOOLTIP_LABEL_STYLE}
          itemStyle={TOOLTIP_ITEM_STYLE}
          cursor={TOOLTIP_CURSOR}
          formatter={(v: number) => [formatValue(v), 'Value']}
        />
        <Bar dataKey="value" fill={color} radius={isVertical ? [0, 4, 4, 0] : [4, 4, 0, 0]} maxBarSize={isVertical ? 20 : 40}>
          <LabelList
            dataKey="value"
            position={isVertical ? 'right' : 'top'}
            formatter={formatValue}
            style={{ fontSize: 10, fill: '#5C2A0D', fontWeight: 600 }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
