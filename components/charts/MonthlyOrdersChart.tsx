'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
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
} from '@/lib/chartTheme';

interface DailyOrderPoint {
  date: string;
  count: number;
}

const formatDate = (value: string) => {
  if (!value) return '';

  const parts = value.split('-');

  // yyyy-mm-dd → d/m
  if (parts.length === 3) {
    return `${Number(parts[2])}/${Number(parts[1])}`;
  }

  return value;
};

const formatOrders = (value: number) => {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}K`;
  }

  return value.toLocaleString();
};

export default function MonthlyOrdersChart({
  data,
}: {
  data: DailyOrderPoint[];
}) {
  if (
    !data ||
    data.length === 0 ||
    !data.some((d) => d.count > 0)
  ) {
    return (
      <div className="text-sm text-ink/40 flex items-center justify-center h-[280px]">
        No data for this range.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={288}>
      <AreaChart
        data={data}
        margin={{
          top: 30,
          right: 12,
          left: 4,
          bottom: 12,
        }}
      >
        <defs>
          <linearGradient
            id="ordersAreaFill"
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop
              offset="0%"
              stopColor="#E0672E"
              stopOpacity={0.20}
            />
            <stop
              offset="100%"
              stopColor="#E0672E"
              stopOpacity={0.02}
            />
          </linearGradient>
        </defs>

        <CartesianGrid
          strokeDasharray="3 3"
          vertical={false}
          stroke={GRID_STROKE}
        />

        <XAxis
          dataKey="date"
          tick={AXIS_TICK}
          axisLine={AXIS_LINE}
          tickLine={false}
          tickMargin={10}
          tickFormatter={formatDate}
          minTickGap={20}
        />

        <YAxis
          tick={AXIS_TICK}
          axisLine={false}
          tickLine={false}
          width={42}
          allowDecimals={false}
          tickFormatter={formatOrders}
        />

        <Tooltip
          contentStyle={TOOLTIP_CONTENT_STYLE}
          labelStyle={TOOLTIP_LABEL_STYLE}
          itemStyle={TOOLTIP_ITEM_STYLE}
          cursor={TOOLTIP_CURSOR}
          labelFormatter={(value) =>
            `Date: ${formatDate(String(value))}`
          }
          formatter={(value: number) => [
            `${value.toLocaleString()} orders`,
            'Orders',
          ]}
        />

        <Area
          type="monotone"
          dataKey="count"
          name="Orders"
          stroke="#E0672E"
          strokeWidth={2.5}
          fill="url(#ordersAreaFill)"
          fillOpacity={1}
          dot={{
            r: 3.5,
            strokeWidth: 0,
            fill: '#E0672E',
          }}
          activeDot={{
            r: 5,
          }}
        >
          <LabelList
            dataKey="count"
            position="top"
            offset={8}
            formatter={(value: number) =>
              value.toLocaleString()
            }
            style={{
              fontSize: 10,
              fill: '#7A3413',
              fontWeight: 600,
            }}
          />
        </Area>
      </AreaChart>
    </ResponsiveContainer>
  );
}