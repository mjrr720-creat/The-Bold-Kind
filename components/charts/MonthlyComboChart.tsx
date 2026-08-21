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

/* ---------------------------------------
   Date formatter
--------------------------------------- */
const formatDate = (date: string) => {
  const d = new Date(`${date}T00:00:00`);

  if (Number.isNaN(d.getTime())) {
    return date;
  }

  return `${d.getDate()}/${d.getMonth() + 1}`;
};

/* ---------------------------------------
   Y-axis formatter
   1,000  -> 1K
   5,000  -> 5K
   10,000 -> 10K
   25,000 -> 25K
--------------------------------------- */
const formatThousands = (value: number) => {
  if (value === 0) {
    return '0';
  }

  if (Math.abs(value) >= 1000) {
    const thousands = value / 1000;

    return `${thousands.toLocaleString(undefined, {
      maximumFractionDigits: 1,
    })}K`;
  }

  return value.toLocaleString(undefined, {
    maximumFractionDigits: 0,
  });
};

/* ---------------------------------------
   Tooltip number formatter
   Keeps full number in tooltip
--------------------------------------- */
const formatTooltipValue = (value: number) => {
  return value.toLocaleString(undefined, {
    maximumFractionDigits: 2,
  });
};

export default function MonthlyComboChart({
  data,
}: {
  data: DailyFinancial[];
}) {
  if (
    !data ||
    data.length === 0 ||
    !data.some(
      (item) =>
        item.sales !== 0 ||
        item.commission !== 0 ||
        item.payout !== 0
    )
  ) {
    return (
      <div className="flex h-[288px] items-center justify-center text-sm text-ink/40">
        No data for this range.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={288}>
      <ComposedChart
        data={data}
        margin={{
          top: 10,
          right: 12,
          left: 8,
          bottom: 4,
        }}
      >
        {/* ---------------------------------------
            Grid
        --------------------------------------- */}
        <CartesianGrid
          strokeDasharray="3 3"
          vertical={false}
          stroke={GRID_STROKE}
        />

        {/* ---------------------------------------
            X Axis
        --------------------------------------- */}
        <XAxis
          dataKey="date"
          tick={AXIS_TICK}
          axisLine={AXIS_LINE}
          tickLine={false}
          tickMargin={8}
          tickFormatter={formatDate}
          interval="preserveStartEnd"
        />

        {/* ---------------------------------------
            Y Axis
            Thousands format: 0 / 10K / 20K...
        --------------------------------------- */}
        <YAxis
          tick={AXIS_TICK}
          axisLine={false}
          tickLine={false}
          width={58}
          domain={[0, 'auto']}
          tickFormatter={formatThousands}
          tickCount={6}
          allowDecimals={false}
        />

        {/* ---------------------------------------
            Tooltip
        --------------------------------------- */}
        <Tooltip
          contentStyle={TOOLTIP_CONTENT_STYLE}
          labelStyle={TOOLTIP_LABEL_STYLE}
          itemStyle={TOOLTIP_ITEM_STYLE}
          cursor={TOOLTIP_CURSOR}
          labelFormatter={(date) => formatDate(String(date))}
          formatter={(value: number) => formatTooltipValue(value)}
        />

        {/* ---------------------------------------
            Legend
        --------------------------------------- */}
        <Legend
          wrapperStyle={LEGEND_STYLE}
          iconType="circle"
          iconSize={8}
        />

        {/* ---------------------------------------
            Sales
        --------------------------------------- */}
        <Bar
          dataKey="sales"
          name="Sales"
          fill="#F2A57C"
          radius={[3, 3, 0, 0]}
          maxBarSize={38}
          animationDuration={700}
        />

        {/* ---------------------------------------
            Commission
        --------------------------------------- */}
        <Bar
          dataKey="commission"
          name="Commission"
          fill="#B84E1F"
          radius={[4, 4, 0, 0]}
          maxBarSize={38}
          animationDuration={700}
        />

        {/* ---------------------------------------
            Payout Amount
        --------------------------------------- */}
        <Line
          dataKey="payout"
          name="Payout Amount"
          type="monotone"
          stroke="#E0672E"
          strokeWidth={2.25}
          dot={{
            r: 3,
            strokeWidth: 0,
            fill: '#E0672E',
          }}
          activeDot={{
            r: 5,
            strokeWidth: 0,
            fill: '#E0672E',
          }}
          animationDuration={700}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}