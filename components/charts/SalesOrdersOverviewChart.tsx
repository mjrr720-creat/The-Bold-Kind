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
  LabelList,
} from 'recharts';
import { useState } from 'react';

export interface SalesOrdersPoint {
  date: string;
  sales: number;
  orders: number;
}

const fmtSales = (v: number) => {
  if (!v) return '';
  return v >= 1000
    ? `${(v / 1000).toFixed(1)}K`
    : v.toLocaleString(undefined, {
        maximumFractionDigits: 0,
      });
};

const formatDate = (value: string) => {
  const d = new Date(value);

  if (Number.isNaN(d.getTime())) {
    return value;
  }

  return `${d.getUTCDate()}/${d.getUTCMonth() + 1}`;
};

export default function SalesOrdersOverviewChart({
  data,
}: {
  data: SalesOrdersPoint[];
}) {
  const [period, setPeriod] = useState<'Daily' | 'Weekly' | 'Monthly'>(
    'Daily'
  );

  if (
    !data ||
    data.length === 0 ||
    !data.some((d) => d.sales !== 0 || d.orders !== 0)
  ) {
    return (
      <div className="flex h-[300px] items-center justify-center text-sm text-ink/40">
        No data for this range.
      </div>
    );
  }

  const downloadCSV = () => {
    const header = ['Date', 'Sales', 'Orders'];

    const rows = data.map((item) => [
      formatDate(item.date),
      item.sales,
      item.orders,
    ]);

    const csv = [header, ...rows]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csv], {
      type: 'text/csv;charset=utf-8;',
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `sales-orders-${period.toLowerCase()}.csv`;
    link.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full">
      {/* Chart Header */}
      <div className="mb-3 flex items-center justify-between">
        {/* Legend */}
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2">
            <span className="h-[10px] w-[10px] rounded-full bg-[#E96A2C]" />
            <span className="text-[12px] font-medium text-[#5F6268]">
              Sales (K)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="h-[10px] w-[10px] rounded-full bg-[#F7D2C0]" />
            <span className="text-[12px] font-medium text-[#5F6268]">
              Orders
            </span>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-3">
          {/* Period Switch */}
          <div className="flex h-[32px] items-center rounded-[8px] border border-[#F0F0F0] bg-white p-[2px]">
            {(['Daily', 'Weekly', 'Monthly'] as const).map((item) => {
              const active = period === item;

              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setPeriod(item)}
                  className={`h-[26px] rounded-[7px] px-4 text-[11px] font-medium transition-all ${
                    active
                      ? 'bg-[#FFF4EE] text-[#E96A2C]'
                      : 'text-[#85888D] hover:text-[#E96A2C]'
                  }`}
                >
                  {item}
                </button>
              );
            })}
          </div>

          {/* Download */}
          <button
            type="button"
            onClick={downloadCSV}
            title="Download CSV"
            className="flex h-[32px] w-[32px] items-center justify-center rounded-[8px] border border-[#F0F0F0] bg-white text-[#666A70] transition hover:border-[#F3D5C6] hover:bg-[#FFF8F4] hover:text-[#E96A2C]"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 3V15"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
              />
              <path
                d="M7.5 10.5L12 15L16.5 10.5"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M4 19.5H20"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="w-full">
        <ResponsiveContainer width="100%" height={270}>
          <ComposedChart
            data={data}
            margin={{
              top: 28,
              right: 38,
              left: 2,
              bottom: 4,
            }}
          >
            {/* Gradient for Sales Bars */}
            <defs>
              <linearGradient
                id="salesBarGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor="#F9C5AC"
                  stopOpacity={0.9}
                />
                <stop
                  offset="100%"
                  stopColor="#F7B999"
                  stopOpacity={0.55}
                />
              </linearGradient>
            </defs>

            {/* Grid */}
            <CartesianGrid
              stroke="#ECECEC"
              strokeDasharray="2 3"
              vertical={false}
            />

            {/* X Axis */}
            <XAxis
              dataKey="date"
              axisLine={{
                stroke: '#E7E7E7',
                strokeWidth: 1,
              }}
              tickLine={false}
              tick={{
                fill: '#96999E',
                fontSize: 11,
                fontWeight: 400,
              }}
              tickMargin={9}
              tickFormatter={formatDate}
              interval="preserveStartEnd"
            />

            {/* Sales Axis */}
            <YAxis
              yAxisId="sales"
              orientation="left"
              domain={[0, 'auto']}
              tick={{
                fill: '#5F6268',
                fontSize: 11,
                fontWeight: 400,
              }}
              axisLine={false}
              tickLine={false}
              width={42}
              tickFormatter={fmtSales}
              tickCount={6}
            />

            {/* Orders Axis */}
            <YAxis
              yAxisId="orders"
              orientation="right"
              domain={[0, 'auto']}
              allowDecimals={false}
              tick={{
                fill: '#E96A2C',
                fontSize: 11,
                fontWeight: 400,
              }}
              axisLine={false}
              tickLine={false}
              width={28}
              tickCount={6}
            />

            {/* Tooltip */}
            <Tooltip
              cursor={{
                stroke: '#F2B99C',
                strokeDasharray: '4 4',
              }}
              contentStyle={{
                background: '#FFFFFF',
                border: '1px solid #F0E5DF',
                borderRadius: '10px',
                boxShadow: '0 8px 25px rgba(0,0,0,0.08)',
                padding: '10px 12px',
              }}
              labelStyle={{
                color: '#55585D',
                fontSize: 11,
                fontWeight: 600,
                marginBottom: 5,
              }}
              itemStyle={{
                fontSize: 11,
                padding: '2px 0',
              }}
              formatter={(value: number, name: string) => {
                if (name === 'Sales') {
                  return [
                    value.toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    }),
                    'Sales',
                  ];
                }

                return [
                  value.toLocaleString(),
                  'Orders',
                ];
              }}
              labelFormatter={(label) => formatDate(label)}
            />

            {/* Sales Bars */}
            <Bar
              yAxisId="sales"
              dataKey="sales"
              name="Sales"
              fill="url(#salesBarGradient)"
              radius={[5, 5, 0, 0]}
              maxBarSize={35}
              animationDuration={700}
            >
              <LabelList
                dataKey="sales"
                position="top"
                formatter={fmtSales}
                style={{
                  fontSize: 10,
                  fill: '#E96A2C',
                  fontWeight: 500,
                }}
              />
            </Bar>

            {/* Orders Line */}
            <Line
              yAxisId="orders"
              type="monotone"
              dataKey="orders"
              name="Orders"
              stroke="#E96A2C"
              strokeWidth={2}
              dot={{
                r: 4,
                stroke: '#FFFFFF',
                strokeWidth: 2,
                fill: '#E96A2C',
              }}
              activeDot={{
                r: 5,
                stroke: '#FFFFFF',
                strokeWidth: 2,
                fill: '#E96A2C',
              }}
              connectNulls
              animationDuration={700}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}