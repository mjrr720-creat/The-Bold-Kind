'use client';

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
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

interface DailyFinancial {
  date: string;
  sales: number;
  commission: number;
  payout: number;
}

const formatDate = (date: string) => {
  const d = new Date(`${date}T00:00:00`);
  return `${d.getDate()}/${d.getMonth() + 1}`;
};

export default function MonthlyComboChart({
  data,
}: {
  data: DailyFinancial[];
}) {
  if (!data || data.length === 0) {
    return (
      <div className="text-sm text-ink/40 flex items-center justify-center h-[280px]">
        No data for this range.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={288}>
      <ComposedChart
        data={data}
        margin={{ top: 8, right: 8, left: -8, bottom: 0 }}
      >
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
          tickMargin={8}
          tickFormatter={formatDate}
          interval="preserveStartEnd"
        />

        <YAxis
          tick={AXIS_TICK}
          axisLine={false}
          tickLine={false}
          width={44}
        />

        <Tooltip
          contentStyle={TOOLTIP_CONTENT_STYLE}
          labelStyle={TOOLTIP_LABEL_STYLE}
          itemStyle={TOOLTIP_ITEM_STYLE}
          cursor={TOOLTIP_CURSOR}
          labelFormatter={(date) => formatDate(String(date))}
          formatter={(v: number) =>
            v.toLocaleString(undefined, {
              maximumFractionDigits: 2,
            })
          }
        />

        <Legend
          wrapperStyle={LEGEND_STYLE}
          iconType="circle"
          iconSize={8}
        />

        <Bar
          dataKey="sales"
          name="Sales"
          fill="#F2A57C"
          maxBarSize={38}
        />

        <Bar
          dataKey="commission"
          name="Commission"
          fill="#B84E1F"
          radius={[4, 4, 0, 0]}
          maxBarSize={38}
        />

        <Line
          dataKey="payout"
          name="Payout Amount"
          stroke="#E0672E"
          strokeWidth={2.25}
          dot={{ r: 3, strokeWidth: 0, fill: '#E0672E' }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}