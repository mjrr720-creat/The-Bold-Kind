'use client';

import {
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  LabelList,
  ComposedChart,
} from 'recharts';

interface Props {
  data: { label: string; value: number }[];
  height?: number;
}

const formatValue = (value: number) =>
  Number(value).toLocaleString(undefined, {
    maximumFractionDigits: 0,
  });

export default function OrdersByWeekdayChart({
  data,
  height = 240,
}: Props) {
  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-xl border border-[#EEE8E3] bg-white text-sm text-[#A9A19C]"
        style={{ height }}
      >
        No data for this range.
      </div>
    );
  }

  const totalOrders = data.reduce(
    (sum, item) => sum + Number(item.value || 0),
    0
  );

  const highestDay = data.reduce((highest, item) =>
    Number(item.value) > Number(highest.value) ? item : highest
  );

  const highestPercentage =
    totalOrders > 0
      ? ((highestDay.value / totalOrders) * 100).toFixed(1)
      : '0.0';

  return (
    <div className="w-full overflow-hidden rounded-[16px] border border-[#EDE8E4] bg-white shadow-[0_2px_10px_rgba(30,20,15,0.035)]">

      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-[#F0EBE7] px-5 py-4">

        <div className="flex items-center gap-3">

          {/* Icon */}
          <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[14px] bg-[#FFF7F2]">
            <svg
              width="25"
              height="25"
              viewBox="0 0 34 34"
              fill="none"
            >
              <rect
                x="5"
                y="17"
                width="5"
                height="12"
                rx="2"
                fill="#E9672F"
              />
              <rect
                x="14.5"
                y="9"
                width="5"
                height="20"
                rx="2"
                fill="#E9672F"
              />
              <rect
                x="24"
                y="4"
                width="5"
                height="25"
                rx="2"
                fill="#E9672F"
              />
            </svg>
          </div>

          <div>
            <div className="mb-0.5 text-[11px] font-semibold tracking-[0.08em] text-[#E9672F]">
              PATTERNS
            </div>

            <h3 className="text-[20px] font-semibold leading-tight tracking-[-0.02em] text-[#211B18]">
              Orders by Weekday
            </h3>

            <p className="mt-0.5 text-[12px] text-[#8E8782]">
              Number of orders received on each day of the week
            </p>
          </div>

        </div>

        {/* TOTAL ORDERS */}
        <div className="min-w-[105px] rounded-[12px] bg-[#FFF8F4] px-4 py-2.5 text-right">
          <div className="text-[11px] font-medium text-[#3F3935]">
            Total Orders
          </div>

          <div className="mt-0.5 text-[22px] font-bold leading-none tracking-[-0.02em] text-[#E9672F]">
            {formatValue(totalOrders)}
          </div>
        </div>

      </div>

      {/* CHART */}
      <div className="px-5 pt-3 pb-1">

        {/* Legend */}
        <div className="mb-[-24px] flex justify-end">
          <div className="flex items-center gap-3 rounded-lg border border-[#ECE7E3] bg-white px-3 py-1.5 text-[11px] text-[#5D5652] shadow-sm">

            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#E9672F]" />
              Orders
            </div>

            <div className="flex items-center gap-1.5">
              <span className="h-[2px] w-4 rounded-full bg-[#FF5A00]" />
              Trend
            </div>

          </div>
        </div>

        <ResponsiveContainer width="100%" height={height}>
          <ComposedChart
            data={data}
            margin={{
              top: 34,
              right: 8,
              left: 0,
              bottom: 2,
            }}
            barCategoryGap="25%"
          >

            {/* BAR GRADIENT */}
            <defs>
              <linearGradient
                id="weekdayBarGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor="#FF7A3D"
                />
                <stop
                  offset="55%"
                  stopColor="#F86A2D"
                />
                <stop
                  offset="100%"
                  stopColor="#E95720"
                />
              </linearGradient>

              {/* LINE GRADIENT */}
              <linearGradient
                id="weekdayLineGradient"
                x1="0"
                y1="0"
                x2="1"
                y2="0"
              >
                <stop
                  offset="0%"
                  stopColor="#E95720"
                />
                <stop
                  offset="50%"
                  stopColor="#FF6B25"
                />
                <stop
                  offset="100%"
                  stopColor="#FF8A4C"
                />
              </linearGradient>
            </defs>

            <CartesianGrid
              stroke="#EEE9E5"
              strokeDasharray="3 4"
              vertical={false}
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              width={42}
              tick={{
                fill: '#99918C',
                fontSize: 10,
                fontWeight: 500,
              }}
              tickFormatter={formatValue}
            />

            <XAxis
              dataKey="label"
              axisLine={{
                stroke: '#E9E3DE',
              }}
              tickLine={false}
              interval={0}
              height={30}
              tickMargin={9}
              tick={{
                fill: '#6F6863',
                fontSize: 11,
                fontWeight: 500,
              }}
            />

            <Tooltip
              cursor={{
                fill: 'rgba(233, 103, 47, 0.035)',
              }}
              contentStyle={{
                background: '#FFFFFF',
                border: '1px solid #ECE5E0',
                borderRadius: '10px',
                boxShadow: '0 8px 22px rgba(30, 20, 15, 0.08)',
                padding: '8px 10px',
                fontSize: '11px',
              }}
              labelStyle={{
                color: '#211B18',
                fontWeight: 600,
                marginBottom: 3,
                fontSize: 11,
              }}
              itemStyle={{
                color: '#E9672F',
                fontWeight: 700,
                fontSize: 11,
              }}
              formatter={(value: number) => [
                formatValue(value),
                'Orders',
              ]}
            />

            {/* BARS */}
            <Bar
              dataKey="value"
              name="Orders"
              fill="url(#weekdayBarGradient)"
              radius={[7, 7, 0, 0]}
              maxBarSize={62}
            >
              <LabelList
                dataKey="value"
                position="top"
                formatter={formatValue}
                offset={7}
                style={{
                  fill: '#D9551C',
                  fontSize: 12,
                  fontWeight: 800,
                }}
              />
            </Bar>

            {/* TREND LINE */}
            <Line
              type="monotone"
              dataKey="value"
              name="Trend"
              stroke="url(#weekdayLineGradient)"
              strokeWidth={3}
              dot={{
                r: 4.5,
                fill: '#FFFFFF',
                stroke: '#F56525',
                strokeWidth: 2.5,
              }}
              activeDot={{
                r: 6,
                fill: '#FFFFFF',
                stroke: '#E95720',
                strokeWidth: 3,
              }}
              connectNulls
            />

          </ComposedChart>
        </ResponsiveContainer>

      </div>

      {/* INSIGHT */}
      <div className="mx-5 mb-4 flex items-center gap-3 rounded-[12px] border border-[#F4DED2] bg-[#FFFCFA] px-3.5 py-2.5">

        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FFF1E9]">
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M5 17L10 12L13 15L20 7"
              stroke="#E9672F"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            <path
              d="M15 7H20V12"
              stroke="#E9672F"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <p className="text-[12px] leading-5 text-[#403934]">
          <span className="font-bold text-[#E9672F]">
            {highestDay.label}
          </span>{' '}
          has the highest order volume with{' '}
          <span className="font-bold text-[#E9672F]">
            {formatValue(highestDay.value)} orders
          </span>{' '}
          ({highestPercentage}% of total).
        </p>

      </div>

    </div>
  );
}