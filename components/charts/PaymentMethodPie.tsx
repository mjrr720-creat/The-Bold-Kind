'use client';

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

type PaymentData = {
  method: string;
  count: number;
};

const PAYOUT_COLORS = [
  '#FF5A00',
  '#A83200',
  '#F77B45',
  '#FFB38F',
];

const formatAmount = (value: number) => {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M`;
  }

  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }

  return value.toLocaleString();
};

export default function PaymentMethodPie({
  data,
}: {
  data: PaymentData[];
}) {
  const total = data.reduce((sum, item) => sum + item.count, 0);

  if (total === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-sm text-ink/40">
        No data for this range.
      </div>
    );
  }

  const chartData = data.map((item) => ({
    ...item,
    percentage: (item.count / total) * 100,
  }));

  /*
   * Keep all labels INSIDE the card.
   * The donut stays centered.
   */
  const getCalloutPosition = (index: number) => {
    const positions = [
      {
        className: 'left-[4%] top-[17%]',
        line: 'right-[-28px] top-[24px] w-[28px]',
      },
      {
        className: 'right-[4%] top-[40%]',
        line: 'left-[-28px] top-[24px] w-[28px]',
      },
      {
        className: 'left-[8%] bottom-[16%]',
        line: 'right-[-28px] top-[24px] w-[28px]',
      },
      {
        className: 'right-[10%] bottom-[5%]',
        line: 'left-[-28px] top-[24px] w-[28px]',
      },
    ];

    return positions[index % positions.length];
  };

  return (
    <div className="w-full">
      {/* =====================================================
          HEADER
      ===================================================== */}
      <div className="mb-1 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Icon */}
          <div className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[13px] border border-[#FBE2D5] bg-[#FFF3EC]">
            <svg
              width="23"
              height="23"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M4 7.5C4 6.67 4.67 6 5.5 6H18.5C19.33 6 20 6.67 20 7.5V17.5C20 18.33 19.33 19 18.5 19H5.5C4.67 19 4 18.33 4 17.5V7.5Z"
                stroke="#E96A2C"
                strokeWidth="1.8"
              />

              <path
                d="M4 9H20"
                stroke="#E96A2C"
                strokeWidth="1.8"
              />

              <path
                d="M15.5 13H18"
                stroke="#E96A2C"
                strokeWidth="1.8"
                strokeLinecap="round"
              />

              <circle
                cx="15"
                cy="14"
                r="1.5"
                fill="#E96A2C"
              />
            </svg>
          </div>

          <div>
            <h2 className="text-[19px] font-semibold leading-tight tracking-[-0.2px] text-[#172033]">
              Payment Method
            </h2>

            <p className="mt-1 text-[11px] leading-4 text-[#747C91]">
              Distribution of payouts across payment sources
            </p>
          </div>
        </div>

        {/* Date Selector */}
        <button
          type="button"
          className="flex h-[38px] min-w-[138px] items-center justify-between gap-3 rounded-[10px] border border-[#E6E8EC] bg-white px-3 text-[#252D3D] shadow-[0_1px_3px_rgba(0,0,0,0.03)]"
        >
          <div className="flex items-center gap-2">
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
            >
              <rect
                x="3.5"
                y="5"
                width="17"
                height="15"
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

            <span className="text-[12px] font-medium">
              This Month
            </span>
          </div>

          <svg
            width="13"
            height="13"
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

      {/* =====================================================
          DONUT AREA
      ===================================================== */}
      <div className="relative h-[270px] w-full overflow-hidden">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="count"
              nameKey="method"
              cx="50%"
              cy="50%"
              innerRadius={61}
              outerRadius={94}
              paddingAngle={1}
              stroke="#FFFFFF"
              strokeWidth={2}
              startAngle={90}
              endAngle={-270}
              isAnimationActive
              animationDuration={700}
            >
              {chartData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    PAYOUT_COLORS[index % PAYOUT_COLORS.length]
                  }
                />
              ))}
            </Pie>

            <Tooltip
              contentStyle={{
                background: '#FFFFFF',
                border: '1px solid #F0E4DD',
                borderRadius: '9px',
                boxShadow:
                  '0 8px 20px rgba(20, 25, 35, 0.08)',
                padding: '8px 10px',
              }}
              labelStyle={{
                color: '#303847',
                fontSize: 10,
                fontWeight: 600,
              }}
              itemStyle={{
                color: '#E96A2C',
                fontSize: 10,
              }}
              formatter={(value: number, name: string) => [
                value.toLocaleString(),
                name,
              ]}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* ===================================================
            CENTER CONTENT
        =================================================== */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 flex w-[125px] -translate-x-1/2 -translate-y-1/2 flex-col items-center text-center">
          <span className="text-[10px] font-medium text-[#737C91]">
            Total Payouts
          </span>

          {/* PKR REMOVED */}
          <span className="mt-1 text-[20px] font-bold leading-6 text-[#172033]">
            {formatAmount(total)}
          </span>

          <span className="mt-1 rounded-full bg-[#EAF8EE] px-2 py-0.5 text-[10px] font-semibold text-[#3A9A59]">
            ↗ 12.4%
          </span>

          <span className="mt-0.5 text-[9px] text-[#737C91]">
            vs last month
          </span>
        </div>

        {/* ===================================================
            OUTSIDE CALLOUTS
        =================================================== */}
        {chartData.slice(0, 4).map((item, index) => {
          const position = getCalloutPosition(index);

          const color =
            PAYOUT_COLORS[index % PAYOUT_COLORS.length];

          return (
            <div
              key={item.method}
              className={`absolute ${position.className} z-10`}
            >
              {/* connector */}
              <div
                className={`absolute ${position.line} h-px bg-[#E96A2C]`}
              />

              <div className="min-w-[76px] rounded-[9px] border border-[#F0E8E3] bg-white px-2.5 py-2 shadow-[0_4px_14px_rgba(25,25,25,0.06)]">
                <div className="flex items-center gap-1">
                  <span
                    className="h-[7px] w-[7px] shrink-0 rounded-full"
                    style={{
                      backgroundColor: color,
                    }}
                  />

                  <span className="text-[13px] font-bold text-[#252A35]">
                    {Math.round(item.percentage)}%
                  </span>
                </div>

                <p className="mt-0.5 whitespace-nowrap text-[9px] font-medium text-[#333943]">
                  {item.method}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* =====================================================
          BOTTOM LEGEND
      ===================================================== */}
      <div className="mx-auto mt-1 flex min-h-[48px] w-[96%] items-center justify-center gap-6 rounded-[11px] border border-[#ECEEF1] bg-[#FAFBFC] px-4">
        {chartData.map((item, index) => {
          const color =
            PAYOUT_COLORS[index % PAYOUT_COLORS.length];

          return (
            <div
              key={item.method}
              className="flex items-center gap-2 whitespace-nowrap"
            >
              <span
                className="h-[9px] w-[9px] shrink-0 rounded-full"
                style={{
                  backgroundColor: color,
                }}
              />

              {/* Bigger payment method text */}
              <span className="text-[11px] font-semibold text-[#475064]">
                {item.method}
              </span>

              {/* Bigger percentage */}
              <span className="rounded-full bg-white px-2 py-1 text-[10px] font-semibold text-[#475064] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                {Math.round(item.percentage)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}