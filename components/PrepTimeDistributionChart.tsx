'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  LabelList,
} from 'recharts';
import { useMemo, useState } from 'react';

interface PrepTimeBucket {
  label: string;
  value: number;
}

interface Props {
  data: PrepTimeBucket[];
  compareData?: PrepTimeBucket[];
  compareLabel?: string | null;
  height?: number;
}

const BUCKET_ORDER = ['< 5 min', '5 – 10 min', '> 10 min'];

function normalizeLabel(label: string) {
  const value = String(label ?? '').toLowerCase().trim();

  if (
    value.includes('< 5') ||
    value.includes('bucket1') ||
    value.includes('less than 5')
  ) {
    return '< 5 min';
  }

  if (
    value.includes('5') &&
    value.includes('10') &&
    !value.includes('>= 10')
  ) {
    return '5 – 10 min';
  }

  if (
    value.includes('>= 10') ||
    value.includes('> 10') ||
    value.includes('bucket3') ||
    value.includes('10 mins')
  ) {
    return '> 10 min';
  }

  return label;
}

function formatNumber(value: number) {
  return value.toLocaleString(undefined, {
    maximumFractionDigits: 0,
  });
}

function formatYAxis(value: number) {
  return value.toLocaleString(undefined, {
    maximumFractionDigits: 0,
  });
}

/* ---------------- CUSTOM X AXIS ---------------- */

function CustomXAxisTick(props: any) {
  const { x, y, payload } = props;

  return (
    <g transform={`translate(${x},${y})`}>
      {/* Clock Icon */}
      <circle
        cx="0"
        cy="7"
        r="8"
        fill="none"
        stroke="#8C8A87"
        strokeWidth="1.5"
      />

      <path
        d="M0 3V7L3 9"
        fill="none"
        stroke="#8C8A87"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <text
        x="20"
        y="11"
        textAnchor="start"
        fill="#6B6B6B"
        fontSize="13"
        fontWeight="500"
      >
        {payload.value}
      </text>
    </g>
  );
}

/* ---------------- CUSTOM TOOLTIP ---------------- */

function CustomTooltip({
  active,
  payload,
  label,
  total,
  compareTotal,
}: any) {
  if (!active || !payload?.length) return null;

  return (
    <div
      className="
        min-w-[190px]
        rounded-xl
        border border-[#E8E4E0]
        bg-white
        px-4 py-3
        shadow-[0_10px_30px_rgba(35,25,18,0.10)]
      "
    >
      <p className="mb-3 text-[13px] font-semibold text-[#292524]">
        {label}
      </p>

      {payload.map((item: any) => {
        const isCompare = item.dataKey === 'compareValue';

        const denominator = isCompare ? compareTotal : total;

        const percentage =
          denominator > 0
            ? ((Number(item.value) / denominator) * 100).toFixed(1)
            : '0.0';

        return (
          <div
            key={item.dataKey}
            className="mb-2 flex items-center justify-between gap-5 last:mb-0"
          >
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{
                  background:
                    item.dataKey === 'compareValue'
                      ? '#C9C4BE'
                      : '#FF5A12',
                }}
              />

              <span className="text-xs text-[#77716C]">
                {item.name}
              </span>
            </div>

            <span className="text-xs font-semibold text-[#302B28]">
              {formatNumber(Number(item.value))} ({percentage}%)
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function PrepTimeDistributionChart({
  data,
  compareData = [],
  compareLabel,
  height = 300,
}: Props) {
  const [showCompare, setShowCompare] = useState(true);

  const hasCompare = Boolean(compareLabel);

  const comparing = hasCompare && showCompare;

  /* ---------------- NORMALIZE DATA ---------------- */

  const safeData = useMemo(() => {
    return Array.isArray(data)
      ? data.map((item) => ({
          label: normalizeLabel(item.label),
          value: Number(item.value) || 0,
        }))
      : [];
  }, [data]);

  const safeCompareData = useMemo(() => {
    return Array.isArray(compareData)
      ? compareData.map((item) => ({
          label: normalizeLabel(item.label),
          value: Number(item.value) || 0,
        }))
      : [];
  }, [compareData]);

  /* ---------------- CURRENT DATA ---------------- */

  const chartData = useMemo(() => {
    return BUCKET_ORDER.map((bucket) => {
      const current = safeData.find(
        (item) => item.label === bucket
      );

      const previous = safeCompareData.find(
        (item) => item.label === bucket
      );

      return {
        label: bucket,
        value: current?.value ?? 0,
        compareValue: previous?.value ?? 0,
      };
    });
  }, [safeData, safeCompareData]);

  const total = chartData.reduce(
    (sum, item) => sum + item.value,
    0
  );

  const compareTotal = chartData.reduce(
    (sum, item) => sum + item.compareValue,
    0
  );

  /* ---------------- EMPTY STATE ---------------- */

  if (!chartData.length || total === 0) {
    return (
      <div
        className="flex items-center justify-center text-sm text-[#9A928B]"
        style={{ height }}
      >
        No data for this range.
      </div>
    );
  }

  /* ---------------- PERCENTAGE ---------------- */

  const getPercentage = (value: number) => {
    if (!total) return 0;

    return (value / total) * 100;
  };

  /* ---------------- TOP BUCKET INSIGHT ---------------- */

  const topBucket = [...chartData].sort(
    (a, b) => b.value - a.value
  )[0];

  const topPercentage = getPercentage(topBucket.value);

  const insightText = (() => {
    if (topBucket.label === '< 5 min') {
      return `${topPercentage.toFixed(
        1
      )}% of orders are prepared in under 5 minutes`;
    }

    if (topBucket.label === '5 – 10 min') {
      return `${topPercentage.toFixed(
        1
      )}% of orders are prepared between 5–10 minutes`;
    }

    return `${topPercentage.toFixed(
      1
    )}% of orders take more than 10 minutes`;
  })();

  /* ---------------- BAR LABEL ---------------- */

  const renderCurrentLabel = (props: any) => {
    const { x, y, width, value } = props;

    if (!value || value <= 0) return null;

    const centerX = x + width / 2;

    const percentage = getPercentage(Number(value));

    return (
      <g pointerEvents="none">
        <text
          x={centerX}
          y={y - 38}
          textAnchor="middle"
          fill="#D94B13"
          fontSize={16}
          fontWeight={700}
        >
          {formatNumber(Number(value))}
        </text>

        <text
          x={centerX}
          y={y - 17}
          textAnchor="middle"
          fill="#4F4A46"
          fontSize={12}
          fontWeight={500}
        >
          ({percentage.toFixed(1)}%)
        </text>
      </g>
    );
  };

  return (
    <div className="w-full">

      {/* ================= TOP AREA ================= */}

      <div className="mb-5 flex items-center justify-between px-2">

        {/* Legend */}

        <div className="flex items-center gap-7">

          <div className="flex items-center gap-2.5">
            <span
              className="
                h-3 w-3
                rounded-full
                bg-[#FF5A12]
                shadow-[0_0_8px_rgba(255,90,18,0.35)]
              "
            />

            <span className="text-[14px] font-medium text-[#55504C]">
              Current
            </span>
          </div>

          {comparing && (
            <div className="flex items-center gap-2.5">
              <span className="h-3 w-3 rounded-full bg-[#B9B4AE]" />

              <span className="text-[14px] font-medium text-[#55504C]">
                Compare
              </span>
            </div>
          )}

        </div>


        {/* Compare Toggle */}

        {hasCompare && (
          <div className="flex items-center gap-3">

            <span className="hidden max-w-[260px] truncate text-[13px] font-medium text-[#716B66] md:block">
              Compare: {compareLabel}
            </span>

            <button
              type="button"
              role="switch"
              aria-checked={showCompare}
              onClick={() => setShowCompare((v) => !v)}
              className={`
                relative
                h-[38px]
                w-[66px]
                rounded-full
                transition-all
                duration-300
                ${
                  showCompare
                    ? 'bg-[#FF4F0B] shadow-[0_4px_14px_rgba(255,79,11,0.28)]'
                    : 'bg-[#D8D3CE]'
                }
              `}
            >
              <span
                className={`
                  absolute
                  top-[4px]
                  h-[30px]
                  w-[30px]
                  rounded-full
                  bg-white
                  shadow-md
                  transition-all
                  duration-300
                  ${
                    showCompare
                      ? 'left-[32px]'
                      : 'left-[4px]'
                  }
                `}
              />
            </button>

          </div>
        )}

      </div>


      {/* ================= CHART AREA ================= */}

      <div className="relative">

        {/* Insight Card */}

        <div
          className="
            absolute
            right-4
            top-3
            z-10
            hidden
            w-[265px]
            rounded-2xl
            border border-[#E8E3DE]
            bg-white/95
            px-5 py-4
            shadow-[0_8px_24px_rgba(42,32,24,0.08)]
            backdrop-blur-sm
            lg:block
          "
        >
          <div className="mb-2 flex items-center gap-2">

            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M4 16L9 11L13 15L20 7"
                stroke="#F05A1A"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              <path
                d="M16 7H20V11"
                stroke="#F05A1A"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            <span className="text-[15px] font-semibold text-[#D94B13]">
              Insight
            </span>

          </div>

          <p className="text-[14px] leading-6 text-[#5D5752]">
            {insightText}
          </p>
        </div>


        <ResponsiveContainer width="100%" height={height}>

          <BarChart
  data={chartData}
  margin={{
    top: 28,
    right: 30,
    left: 8,
    bottom: 0,
  }}
            barCategoryGap="28%"
            barGap={12}
          >

            {/* Gradient */}

            <defs>

              <linearGradient
                id="currentBarGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor="#FF7A16"
                />

                <stop
                  offset="45%"
                  stopColor="#FF6410"
                />

                <stop
                  offset="100%"
                  stopColor="#FF4F0B"
                />
              </linearGradient>


              <linearGradient
                id="compareBarGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor="#CFCAC4"
                />

                <stop
                  offset="100%"
                  stopColor="#BDB7B1"
                />
              </linearGradient>

            </defs>


            {/* Grid */}

            <CartesianGrid
              vertical={false}
              stroke="#E8E3DE"
              strokeDasharray="3 5"
            />


            {/* X Axis */}

            <XAxis
              dataKey="label"
              axisLine={{
                stroke: '#D8D2CC',
              }}
              tickLine={false}
              height={60}
              tick={<CustomXAxisTick />}
              interval={0}
              label={{
                value: 'Preparation Time (Minutes)',
                position: 'insideBottom',
                offset: -42,
                fill: '#4F4A46',
                fontSize: 14,
                fontWeight: 500,
              }}
            />


            {/* Y Axis */}

            <YAxis
              axisLine={false}
              tickLine={false}
              width={75}
              tick={{
                fontSize: 13,
                fill: '#756E68',
              }}
              tickFormatter={formatYAxis}
              domain={[0, 'auto']}
              allowDecimals={false}
              label={{
                value: 'Orders',
                angle: -90,
                position: 'insideLeft',
                offset: 5,
                fill: '#514B47',
                fontSize: 14,
                fontWeight: 500,
              }}
            />


            {/* Tooltip */}

            <Tooltip
              cursor={{
                fill: 'rgba(255,90,18,0.025)',
              }}
              content={
                <CustomTooltip
                  total={total}
                  compareTotal={compareTotal}
                />
              }
            />


            {/* Compare Bar */}

            {comparing && (
              <Bar
  dataKey="compareValue"
  name="Compare"
  fill="url(#compareBarGradient)"
  radius={[10, 10, 0, 0]}
  maxBarSize={110}
  minPointSize={2}
  animationDuration={800}
/>
            )}


            {/* Current Bar */}
<Bar
  dataKey="value"
  name="Current"
  fill="url(#currentBarGradient)"
  radius={[10, 10, 0, 0]}
  maxBarSize={110}
  minPointSize={2}
  animationDuration={800}
>

              <LabelList
                dataKey="value"
                content={renderCurrentLabel}
              />

            </Bar>

          </BarChart>

        </ResponsiveContainer>

      </div>


      {/* ================= MOBILE INSIGHT ================= */}

      <div
        className="
          mb-5
          block
          rounded-xl
          border border-[#E8E3DE]
          bg-[#FFFDFC]
          px-4 py-4
          lg:hidden
        "
      >
        <div className="mb-1 flex items-center gap-2">

          <span className="text-sm font-semibold text-[#D94B13]">
            ↗ Insight
          </span>

        </div>

        <p className="text-sm leading-6 text-[#625C57]">
          {insightText}
        </p>

      </div>


      {/* ================= BOTTOM INFO ================= */}

      <div className="px-4 pb-2 -mt-1">

        <div
          className="
            flex
            flex-wrap
            items-center
            gap-x-3
            gap-y-2
            rounded-xl
            border border-[#F0E8E2]
            bg-[#FFFCFA]
            px-6 py-4
            text-[13px]
            text-[#746D67]
          "
        >

          {/* Info Icon */}

          <span
            className="
              flex
              h-6
              w-6
              shrink-0
              items-center
              justify-center
              rounded-full
              border border-[#CFC8C1]
              text-[13px]
              font-semibold
              text-[#7A736D]
            "
          >
            i
          </span>


          <span>
            Buckets:
          </span>

          <span className="font-medium text-[#5F5954]">
            &lt; 5 min,
          </span>

          <span className="font-medium text-[#5F5954]">
            5 – 10 min,
          </span>

          <span className="font-medium text-[#5F5954]">
            &gt; 10 min
          </span>

          <span className="mx-1 text-[#C3BBB4]">
            •
          </span>

          <span>
            Based on successful orders only
          </span>

        </div>

      </div>

    </div>
  );
}