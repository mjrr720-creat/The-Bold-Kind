'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer } from 'recharts';
import { GRID_STROKE, AXIS_TICK, AXIS_LINE, TOOLTIP_CONTENT_STYLE, TOOLTIP_LABEL_STYLE, TOOLTIP_ITEM_STYLE, TOOLTIP_CURSOR, LEGEND_STYLE } from '@/lib/chartTheme';

interface Props {
  data: { month: string; restaurantFunded: number; talabatFunded: number }[];
}

export default function DiscountFundingChart({ data }: Props) {
  if (!data || data.length === 0) {
    return <div className="text-sm text-ink/40 flex items-center justify-center h-[280px]">No data for this range.</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={288}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID_STROKE} />
        <XAxis dataKey="month" tick={AXIS_TICK} axisLine={AXIS_LINE} tickLine={false} tickMargin={8} />
        <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} width={44} />
        <Tooltip
          contentStyle={TOOLTIP_CONTENT_STYLE}
          labelStyle={TOOLTIP_LABEL_STYLE}
          itemStyle={TOOLTIP_ITEM_STYLE}
          cursor={TOOLTIP_CURSOR}
          formatter={(v: number) => v.toLocaleString(undefined, { maximumFractionDigits: 2 })}
        />
        <Legend wrapperStyle={LEGEND_STYLE} iconType="circle" iconSize={8} />
        <Bar dataKey="restaurantFunded" stackId="discount" name="Discount Funded by You" fill="#F2A57C" maxBarSize={38} />
        <Bar dataKey="talabatFunded" stackId="discount" name="Talabat-Funded Discount" fill="#E0672E" radius={[4, 4, 0, 0]} maxBarSize={38} />
      </BarChart>
    </ResponsiveContainer>
  );
}
