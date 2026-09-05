'use client';

import { useMemo, useState } from 'react';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts';

import { RestaurantPerformanceRow } from '@/lib/performanceTypes';


const money = (n: number | null | undefined) =>
  n === null || n === undefined || !Number.isFinite(Number(n))
    ? '—'
    : Number(n).toLocaleString(undefined, {
        maximumFractionDigits: 0,
      });


/* ================= TOOLTIP ================= */

function RankingTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;

  const row: RestaurantPerformanceRow = payload[0].payload.__row;

  return (
    <div className="min-w-[220px] rounded-xl border border-[#E9E3DD] bg-white p-4 shadow-[0_12px_30px_rgba(33,27,24,0.14)]">

      <div className="mb-3 border-b border-[#F0EBE6] pb-3">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-[#A19A94]">
          Restaurant
        </div>

        <div className="mt-1 text-[13px] font-semibold text-[#211B18]">
          {row.outletName}
        </div>
      </div>

      <div className="space-y-2 text-xs">

        <div className="flex justify-between gap-6">
          <span className="text-[#827A74]">Orders</span>
          <span className="font-semibold text-[#302A26]">
            {row.orders.toLocaleString()}
          </span>
        </div>

        <div className="flex justify-between gap-6">
          <span className="text-[#827A74]">Successful</span>
          <span className="font-semibold text-[#302A26]">
            {row.successfulOrders.toLocaleString()}
          </span>
        </div>

        <div className="flex justify-between gap-6">
          <span className="text-[#827A74]">Gross Sales</span>
          <span className="font-bold text-[#E05A20]">
            {money(row.grossSales)}
          </span>
        </div>

        <div className="flex justify-between gap-6">
          <span className="text-[#827A74]">AOV</span>
          <span className="font-semibold text-[#302A26]">
            {money(row.avgOrderValue)}
          </span>
        </div>

      </div>
    </div>
  );
}


/* ================= CUSTOM Y AXIS ================= */

function CustomYAxisTick(props: any) {
  const { x, y, payload, index } = props;

  const rank = (index ?? 0) + 1;
  const name = String(payload?.value ?? '');

  return (
    <g>
      {/* Rank */}
      <text
        x={x - 245}
        y={y + 4}
        textAnchor="start"
        fontSize={11}
        fontWeight={600}
        fill={rank === 1 ? '#E05A20' : '#9B938D'}
      >
        #{rank}
      </text>

      {/* Restaurant Name */}
      <text
        x={x - 210}
        y={y + 4}
        textAnchor="start"
        fontSize={12}
        fontWeight={rank <= 3 ? 600 : 500}
        fill="#4D4742"
      >
        {name}
      </text>
    </g>
  );
}


/* ================= VALUE LABEL ================= */

function CustomValueLabel(props: any) {
  const { x, y, width, height, value } = props;

  if (!value || width < 1) return null;

  return (
    <text
      x={x + width + 10}
      y={y + height / 2 + 4}
      fill="#625B56"
      fontSize={11}
      fontWeight={600}
    >
      {money(Number(value))}
    </text>
  );
}


/* ================= COMPONENT ================= */

export default function RestaurantRankingChart({
  data,
}: {
  data: RestaurantPerformanceRow[];
}) {

  const [showAll, setShowAll] = useState(false);


  /* Fixed visible data */

  const visibleData = useMemo(() => {
    return showAll ? data : data.slice(0, 10);
  }, [data, showAll]);


  /* Don't truncate too aggressively */

  const chartData = useMemo(
    () =>
      visibleData.map((r, index) => ({

        name:
          r.outletName.length > 28
            ? `${r.outletName.slice(0, 28)}…`
            : r.outletName,

        grossSales: Number(r.grossSales) || 0,

        rank: index + 1,

        __row: r,

      })),
    [visibleData]
  );


  /* ================= EMPTY ================= */

  if (!data?.length) {
    return (
      <div className="flex h-[300px] items-center justify-center text-sm text-[#9A928B]">
        No restaurant performance data available.
      </div>
    );
  }


  const topRestaurant = data[0];


  /*
    IMPORTANT:

    Each row = 48px
    When showAll = true,
    chart gets scrollable but outer page
    does NOT become extremely tall.
  */

  const ROW_HEIGHT = 48;

  const chartHeight = Math.max(
    300,
    chartData.length * ROW_HEIGHT
  );

  const containerHeight = 520;


  return (
    <div className="w-full">


      {/* ================= HEADER ================= */}

      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">


        <div>

          <div className="mb-2 flex items-center gap-2">

            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FFF1EA]">
              <span className="text-[14px]">▥</span>
            </div>

            <span className="text-[11px] font-bold tracking-[0.14em] text-[#E05A20]">
              PERFORMANCE
            </span>

          </div>


          <h3 className="text-[18px] font-semibold text-[#211B18]">
            Restaurant Ranking
          </h3>


          <p className="mt-1 text-[13px] text-[#817973]">
            Restaurants ranked by gross sales performance.
          </p>

        </div>


        {/* STATS */}

        <div className="flex gap-2">

          <div className="rounded-xl border border-[#EAE4DF] bg-[#FFFCFA] px-4 py-2">

            <div className="text-[9px] font-bold tracking-wider text-[#9B938D]">
              RESTAURANTS
            </div>

            <div className="mt-1 text-[16px] font-bold text-[#302A26]">
              {data.length}
            </div>

          </div>


          <div className="rounded-xl border border-[#F0D9CD] bg-[#FFF9F6] px-4 py-2">

            <div className="text-[9px] font-bold tracking-wider text-[#B9785A]">
              TOP SALES
            </div>

            <div className="mt-1 text-[16px] font-bold text-[#E05A20]">
              {money(topRestaurant?.grossSales)}
            </div>

          </div>

        </div>

      </div>


      {/* ================= INSIGHT ================= */}

      {topRestaurant && (

        <div className="mb-4 flex items-center gap-3 rounded-xl border border-[#EDE3DD] bg-[#FFFCFA] px-4 py-3">

          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FFF0E8] text-lg">
            🏆
          </div>


          <div>

            <div className="text-[11px] font-semibold text-[#D85A23]">
              Top Performer
            </div>

            <div className="mt-0.5 text-[12px] text-[#706862]">

              <span className="font-semibold text-[#302A26]">
                {topRestaurant.outletName}
              </span>

              {' '}is currently leading the restaurant ranking.

            </div>

          </div>

        </div>

      )}


      {/* ================= CHART WRAPPER ================= */}

      <div className="rounded-2xl border border-[#E9E3DE] bg-white p-4">


        {/* Scroll Container */}

        <div
          className="overflow-y-auto overflow-x-hidden pr-2"
          style={{
            height: containerHeight,
          }}
        >

          <div
            style={{
              height: chartHeight,
              minWidth: 850,
            }}
          >

            <ResponsiveContainer
              width="100%"
              height="100%"
            >

              <BarChart
                data={chartData}
                layout="vertical"
                margin={{
  top: 10,
  right: 90,
  left: 10,
  bottom: 10,
}}
                barCategoryGap="28%"
              >


                {/* Gradients */}

                <defs>

                  <linearGradient
                    id="topBarGradient"
                    x1="0"
                    y1="0"
                    x2="1"
                    y2="0"
                  >

                    <stop
                      offset="0%"
                      stopColor="#FF7A18"
                    />

                    <stop
                      offset="100%"
                      stopColor="#FF4F12"
                    />

                  </linearGradient>


                  <linearGradient
                    id="secondBarGradient"
                    x1="0"
                    y1="0"
                    x2="1"
                    y2="0"
                  >

                    <stop
                      offset="0%"
                      stopColor="#FFB17D"
                    />

                    <stop
                      offset="100%"
                      stopColor="#FF7132"
                    />

                  </linearGradient>

                </defs>


                {/* GRID */}

                <CartesianGrid
                  horizontal={false}
                  vertical
                  stroke="#EEE9E4"
                  strokeDasharray="3 5"
                />


                {/* X AXIS */}

                <XAxis
                  type="number"
                  axisLine={{
                    stroke: '#DDD6D0',
                  }}
                  tickLine={false}
                  tick={{
                    fontSize: 11,
                    fill: '#8B837D',
                  }}
                  tickFormatter={(v) =>
                    money(Number(v))
                  }
                />


                {/* Y AXIS */}

                <YAxis
                  type="category"
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  width={280}
                  tick={<CustomYAxisTick />}
                />


                {/* TOOLTIP */}

                <Tooltip
                  content={<RankingTooltip />}
                  cursor={{
                    fill: 'rgba(224,90,32,0.04)',
                  }}
                />


                {/* BARS */}

                <Bar
                  dataKey="grossSales"
                  radius={[0, 9, 9, 0]}
                  maxBarSize={28}
                  animationDuration={700}
                >

                  {chartData.map((_, index) => {

                    let fill = '#E6CBBB';

                    if (index === 0) {
                      fill = 'url(#topBarGradient)';
                    }

                    if (index === 1) {
                      fill = 'url(#secondBarGradient)';
                    }

                    return (
                      <Cell
                        key={`ranking-${index}`}
                        fill={fill}
                      />
                    );
                  })}


                  <LabelList
                    dataKey="grossSales"
                    content={CustomValueLabel}
                  />

                </Bar>

              </BarChart>

            </ResponsiveContainer>

          </div>

        </div>

      </div>


      {/* ================= SHOW ALL ================= */}

      {data.length > 10 && (

        <div className="mt-4 flex justify-center">

          <button
            type="button"
            onClick={() =>
              setShowAll((v) => !v)
            }
            className="
              inline-flex items-center gap-2
              rounded-lg
              border border-[#EBCFC0]
              bg-[#FFFCFA]
              px-4 py-2
              text-[12px]
              font-semibold
              text-[#D85A23]
              transition
              hover:bg-[#FFF3EC]
            "
          >

            {showAll
              ? 'Show Top 10'
              : 'View All Restaurants'
            }

            {!showAll && (
              <span className="rounded-md bg-[#FDE8DD] px-1.5 py-0.5 text-[10px]">
                {data.length}
              </span>
            )}

          </button>

        </div>

      )}


      {/* ================= FOOTER ================= */}

      <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-[#EEE6E0] bg-[#FFFCFA] px-5 py-3 text-[12px] text-[#746D67]">

        <span className="flex h-5 w-5 items-center justify-center rounded-full border border-[#D5CCC5] text-[10px] font-semibold">
          i
        </span>

        <span>
          Ranking is based on
        </span>

        <span className="font-semibold text-[#514A45]">
          Gross Sales
        </span>

        <span className="text-[#B8AFA8]">
          •
        </span>

        <span>
          Total restaurants: {data.length}
        </span>

      </div>

    </div>
  );
} 