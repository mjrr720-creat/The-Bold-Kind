'use client';

import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
  LabelList,
} from 'recharts';

import {
  GRID_STROKE,
  AXIS_TICK,
  AXIS_LINE,
  TOOLTIP_CONTENT_STYLE,
  TOOLTIP_LABEL_STYLE,
  TOOLTIP_ITEM_STYLE,
  TOOLTIP_CURSOR,
  LEGEND_STYLE,
} from '@/lib/chartTheme';

import { LabelValue } from '@/lib/performanceTypes';

interface Props {
  current: LabelValue[];
  previous?: LabelValue[];
  height?: number;
  valueFormatter?: (v: number) => string;
  seriesLabel?: string;
}

export default function PerformanceTrendChart({
  current,
  previous,
  height = 260,
  valueFormatter,
  seriesLabel = 'Value',
}: Props) {
  if (!current || current.length === 0) {
    return (
      <div
        className="text-sm text-ink/40 flex items-center justify-center"
        style={{ height }}
      >
        No data for this range.
      </div>
    );
  }

  const showCompare = !!previous && previous.length > 0;

  const chartData = current.map((point, i) => ({
    x: point.label,
    current: point.value,
    previous: showCompare
      ? previous?.[i]?.value ?? null
      : undefined,
  }));

  const fmt =
    valueFormatter ??
    ((v: number) => v.toLocaleString());

  const formatDate = (date: string) => {
    if (!date) return '';

    const parts = date.split('-');

    if (parts.length === 3) {
      return `${Number(parts[2])}/${Number(parts[1])}`;
    }

    return date;
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart
        data={chartData}
        margin={{
          top: 28,
          right: 16,
          left: -8,
          bottom: 0,
        }}
      >
        {/* GRADIENT */}
        <defs>
          <linearGradient
            id="ordersGradient"
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop
              offset="0%"
              stopColor="#E0672E"
              stopOpacity={0.22}
            />

            <stop
              offset="55%"
              stopColor="#E0672E"
              stopOpacity={0.08}
            />

            <stop
              offset="100%"
              stopColor="#E0672E"
              stopOpacity={0}
            />
          </linearGradient>
        </defs>

        {/* GRID */}
        <CartesianGrid
          strokeDasharray="3 4"
          stroke={GRID_STROKE}
          vertical={false}
        />

        {/* X AXIS */}
        <XAxis
          dataKey="x"
          tick={AXIS_TICK}
          axisLine={AXIS_LINE}
          tickLine={false}
          tickFormatter={formatDate}
          tickMargin={10}
        />

        {/* Y AXIS */}
        <YAxis
          tick={AXIS_TICK}
          axisLine={false}
          tickLine={false}
          width={44}
          tickCount={5}
          tickFormatter={(v) => fmt(Number(v))}
        />

        {/* TOOLTIP */}
        <Tooltip
          contentStyle={TOOLTIP_CONTENT_STYLE}
          labelStyle={TOOLTIP_LABEL_STYLE}
          itemStyle={TOOLTIP_ITEM_STYLE}
          cursor={TOOLTIP_CURSOR}
          labelFormatter={formatDate}
          formatter={(v: number, name: string) => [
            v === null || v === undefined
              ? '—'
              : fmt(v),
            name,
          ]}
        />

        {/* ORANGE GRADIENT AREA */}
        <Area
          type="monotone"
          dataKey="current"
          stroke="none"
          fill="url(#ordersGradient)"
          fillOpacity={1}
          connectNulls
          isAnimationActive={true}
        />

        {/* PREVIOUS PERIOD */}
        {showCompare && (
          <Line
            type="monotone"
            dataKey="previous"
            name={`${seriesLabel} (previous)`}
            stroke="#B9AFA5"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            activeDot={false}
            connectNulls
          />
        )}

        {/* CURRENT PERIOD */}
        <Line
          type="monotone"
          dataKey="current"
          name={`${seriesLabel} (current)`}
          stroke="#E0672E"
          strokeWidth={2.5}
          connectNulls
          dot={{
            r: 4,
            fill: '#E0672E',
            stroke: '#E0672E',
            strokeWidth: 1,
          }}
          activeDot={{
            r: 6,
            fill: '#E0672E',
            stroke: '#FFFFFF',
            strokeWidth: 2,
          }}
        >
          <LabelList
            dataKey="current"
            position="top"
            offset={8}
            formatter={(value: number) => fmt(Number(value))}
            style={{
              fill: '#9C542F',
              fontSize: 11,
              fontWeight: 600,
            }}
          />
        </Line>

        {/* LEGEND */}
        {showCompare && (
          <Legend
            wrapperStyle={{
              ...LEGEND_STYLE,
              paddingTop: 12,
            }}
          />
        )}
      </ComposedChart>
    </ResponsiveContainer>
  );
}