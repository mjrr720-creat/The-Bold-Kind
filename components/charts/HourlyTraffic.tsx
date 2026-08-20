'use client';

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';

export default function HourlyTraffic({
  data,
}: {
  data: { hour: number; count: number }[];
}) {
  const hasData = data?.some((d) => d.count > 0);

  if (!hasData) {
    return (
      <div className="flex h-[260px] items-center justify-center text-sm text-ink/40">
        No data for this range.
      </div>
    );
  }

  const maxPoint = data.reduce(
    (max, item) => (item.count > max.count ? item : max),
    data[0]
  );

  const totalOrders = data.reduce((sum, item) => sum + item.count, 0);

  const avgOrders =
    data.length > 0 ? Math.round(totalOrders / data.length) : 0;

  const formatHour = (hour: number) => {
    const h = hour % 12 || 12;
    const period = hour < 12 ? 'AM' : 'PM';
    return `${h} ${period}`;
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Small Icon */}
          <div className="flex h-[56px] w-[56px] shrink-0 items-center justify-center rounded-[15px] border border-[#FBE5D8] bg-[#FFF5EF]">
            <svg
              width="29"
              height="29"
              viewBox="0 0 32 32"
              fill="none"
            >
              <path
                d="M5 23L12.5 15.5L17 20L27 9"
                stroke="#E96A2C"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              <path
                d="M21 9H27V15"
                stroke="#E96A2C"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <div>
            <h2 className="text-[20px] font-semibold leading-tight tracking-[-0.25px] text-[#172033]">
              Hourly Order Traffic
            </h2>

            <p className="mt-1 text-[12px] leading-4 text-[#747C91]">
              Track orders received throughout the day
            </p>
          </div>
        </div>

        {/* Date Button */}
        <button
          type="button"
          className="flex h-[42px] min-w-[150px] items-center justify-between gap-4 rounded-[11px] border border-[#E7E9ED] bg-white px-3.5 text-[#252D3D] shadow-[0_1px_3px_rgba(0,0,0,0.03)]"
        >
          <div className="flex items-center gap-2.5">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
            >
              <rect
                x="3.5"
                y="5"
                width="17"
                height="15.5"
                rx="2"
                stroke="currentColor"
                strokeWidth="1.7"
              />

              <path
                d="M7 3.5V7"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
              />

              <path
                d="M17 3.5V7"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
              />

              <path
                d="M3.5 9.5H20.5"
                stroke="currentColor"
                strokeWidth="1.7"
              />
            </svg>

            <span className="text-[13px] font-medium">Today</span>
          </div>

          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M6 9L12 15L18 9"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* Chart */}
      <div className="w-full">
        <ResponsiveContainer width="100%" height={270}>
          <ComposedChart
            data={data}
            margin={{
              top: 18,
              right: 16,
              left: -3,
              bottom: 0,
            }}
          >
            <CartesianGrid
              stroke="#E4E7EC"
              strokeDasharray="6 5"
              vertical={false}
            />

            <XAxis
              dataKey="hour"
              axisLine={{
                stroke: '#E5E7EB',
                strokeWidth: 1,
              }}
              tickLine={false}
              tick={{
                fill: '#687086',
                fontSize: 10,
                fontWeight: 400,
              }}
              tickMargin={9}
              interval={1}
              tickFormatter={(hour: number) => formatHour(hour)}
            />

            <YAxis
              domain={[0, 'auto']}
              allowDecimals={false}
              axisLine={false}
              tickLine={false}
              width={38}
              tick={{
                fill: '#687086',
                fontSize: 10,
                fontWeight: 400,
              }}
              tickCount={5}
            />

            <Tooltip
              cursor={{
                stroke: '#F0A57D',
                strokeWidth: 1,
                strokeDasharray: '5 5',
              }}
              contentStyle={{
                background: '#FFFFFF',
                border: '1px solid #F0E5DE',
                borderRadius: '9px',
                boxShadow: '0 8px 20px rgba(20, 25, 35, 0.08)',
                padding: '8px 10px',
              }}
              labelStyle={{
                color: '#303847',
                fontSize: 10,
                fontWeight: 600,
                marginBottom: 3,
              }}
              itemStyle={{
                color: '#E96A2C',
                fontSize: 10,
              }}
              formatter={(value: number) => [
                `${value.toLocaleString()} orders`,
                'Orders',
              ]}
              labelFormatter={(hour) => formatHour(Number(hour))}
            />

            {/* Bars */}
            <Bar
              dataKey="count"
              name="Orders"
              fill="#F7B27F"
              radius={[5, 5, 0, 0]}
              maxBarSize={24}
              animationDuration={600}
            />

            {/* Trend */}
            <Line
              type="monotone"
              dataKey="count"
              name="Orders"
              stroke="#E96A2C"
              strokeWidth={2}
              dot={{
                r: 4,
                fill: '#FFFFFF',
                stroke: '#E96A2C',
                strokeWidth: 2,
              }}
              activeDot={{
                r: 5,
                fill: '#FFFFFF',
                stroke: '#E96A2C',
                strokeWidth: 2,
              }}
              animationDuration={700}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Compact KPI Strip */}
      <div className="mt-3 grid grid-cols-3 overflow-hidden rounded-[14px] border border-[#ECEEF1] bg-white">
        {/* Peak Hour */}
        <div className="flex items-center gap-3 px-4 py-4">
          <div className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-full bg-[#FFF4ED]">
            <svg
              width="23"
              height="23"
              viewBox="0 0 32 32"
              fill="none"
            >
              <path
                d="M5 23L12.5 15.5L17 20L27 9"
                stroke="#E96A2C"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              <path
                d="M21 9H27V15"
                stroke="#E96A2C"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <div className="min-w-0">
            <p className="text-[11px] font-medium leading-4 text-[#737C91]">
              Peak Hour
            </p>

            <p className="mt-0.5 text-[20px] font-semibold leading-6 text-[#E96A2C]">
              {formatHour(maxPoint.hour)}
            </p>
          </div>
        </div>

        {/* Max Orders */}
        <div className="flex items-center gap-3 border-l border-[#ECEEF1] px-4 py-4">
          <div className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-full bg-[#F5EEFF]">
            <svg
              width="22"
              height="22"
              viewBox="0 0 32 32"
              fill="none"
            >
              <path
                d="M7 25V20"
                stroke="#7C3AED"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              <path
                d="M13 25V16"
                stroke="#7C3AED"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              <path
                d="M19 25V12"
                stroke="#7C3AED"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              <path
                d="M25 25V7"
                stroke="#7C3AED"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              <path
                d="M5 27H27"
                stroke="#7C3AED"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <div className="min-w-0">
            <p className="text-[11px] font-medium leading-4 text-[#737C91]">
              Max Orders
            </p>

            <p className="mt-0.5 text-[20px] font-semibold leading-6 text-[#7C3AED]">
              {maxPoint.count.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Average */}
        <div className="flex items-center gap-3 border-l border-[#ECEEF1] px-4 py-4">
          <div className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-full bg-[#EEF9F0]">
            <svg
              width="23"
              height="23"
              viewBox="0 0 32 32"
              fill="none"
            >
              <circle
                cx="16"
                cy="16"
                r="11"
                stroke="#4CAF68"
                strokeWidth="2.3"
              />

              <path
                d="M16 9V16L20.5 19"
                stroke="#4CAF68"
                strokeWidth="2.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <div className="min-w-0">
            <p className="text-[11px] font-medium leading-4 text-[#737C91]">
              Avg Orders / Hour
            </p>

            <p className="mt-0.5 text-[20px] font-semibold leading-6 text-[#4CAF68]">
              {avgOrders.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}