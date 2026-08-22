```tsx
'use client';

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

import {
  TOOLTIP_CONTENT_STYLE,
  TOOLTIP_LABEL_STYLE,
  TOOLTIP_ITEM_STYLE,
  TOOLTIP_CURSOR,
} from '@/lib/chartTheme';

interface Item {
  label: string;
  value: number;
}

interface Props {
  reasons?: Item[];
  owners?: Item[];
  type?: 'reasons' | 'owners';
  height?: number;
}

const ORANGE = '#E0672E';

const OWNER_COLORS = [
  '#E0672E',
  '#F28A4B',
  '#F6A66C',
  '#F8C98E',
  '#FBE1BD',
];

function formatNumber(value: number) {
  return value.toLocaleString(undefined, {
    maximumFractionDigits: 0,
  });
}

function truncate(value: string, max = 30) {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1)}…`;
}

function getTotal(data: Item[]) {
  return data.reduce((sum, item) => sum + Number(item.value || 0), 0);
}

/* -------------------------------------------------------
   CANCELLATION REASONS
------------------------------------------------------- */

function CancellationReasons({
  data,
  height,
}: {
  data: Item[];
  height: number;
}) {
  /*
   * Sort ALL valid cancellation reasons first.
   * We keep the full list because % Total must be calculated
   * against ALL cancellations, not just the Top 5.
   */
  const sorted = [...data]
    .filter(
      (item) =>
        Number.isFinite(Number(item.value)) &&
        Number(item.value) > 0
    )
    .sort((a, b) => Number(b.value) - Number(a.value));

  if (!sorted.length) {
    return (
      <div
        className="flex items-center justify-center text-sm text-ink/40"
        style={{ height }}
      >
        No data for this range.
      </div>
    );
  }

  /*
   * Total = ALL cancellation reasons.
   *
   * Example:
   * 38 / 117 = 32.5%
   *
   * NOT:
   * 38 / Top-5-total
   */
  const total = getTotal(sorted);

  /*
   * Only display the five highest cancellation reasons.
   */
  const top5 = sorted.slice(0, 5);

  /*
   * The longest visible bar is always the #1 reason.
   */
  const maxValue = Number(top5[0]?.value || 1);

  return (
    <div className="w-full">
      {/* Header */}
      <div className="grid grid-cols-[minmax(150px,1fr)_70px_72px] gap-3 px-1 pb-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-ink/45">
        <span>Reason</span>
        <span className="text-right">Orders</span>
        <span className="text-right">% Total</span>
      </div>

      {/* Top 5 Rows */}
      <div className="divide-y divide-black/[0.045]">
        {top5.map((item, index) => {
          const value = Number(item.value);

          const percentage = total
            ? (value / total) * 100
            : 0;

          const width = maxValue
            ? (value / maxValue) * 100
            : 0;

          return (
            <div
              key={`${item.label}-${index}`}
              className="grid grid-cols-[minmax(150px,1fr)_70px_72px] items-center gap-3 py-2.5"
            >
              {/* Reason + bar */}
              <div className="min-w-0">
                <div
                  className="mb-1.5 truncate text-xs font-medium text-ink/75"
                  title={item.label}
                >
                  {truncate(item.label)}
                </div>

                <div className="h-2 w-full overflow-hidden rounded-full bg-[#F5F1EE]">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${width}%`,
                      background:
                        index === 0
                          ? ORANGE
                          : 'linear-gradient(90deg, #E0672E, #F4A06D)',
                    }}
                  />
                </div>
              </div>

              {/* Orders */}
              <div className="text-right text-xs font-semibold tabular-nums text-ink/80">
                {formatNumber(value)}
              </div>

              {/* Percentage */}
              <div className="flex justify-end">
                <span
                  className="rounded-full px-2 py-1 text-[10px] font-semibold tabular-nums"
                  style={{
                    color: '#C75A27',
                    background: '#FFF1E8',
                  }}
                >
                  {percentage.toFixed(1)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Insight */}
      {top5.length > 0 && (
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-[#F3DED1] bg-[#FFF7F2] px-4 py-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-lg shadow-sm">
            💡
          </div>

          <div className="text-xs leading-5 text-ink/65">
            <span className="font-semibold text-brand">
              {top5[0].label}
            </span>{' '}
            is the leading cancellation reason with{' '}
            <span className="font-semibold text-ink/80">
              {formatNumber(Number(top5[0].value))} orders
            </span>
            .
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------
   CANCELLATION OWNER
------------------------------------------------------- */

function CancellationOwners({
  data,
  height,
}: {
  data: Item[];
  height: number;
}) {
  const sorted = [...data]
    .filter(
      (item) =>
        Number.isFinite(Number(item.value)) &&
        Number(item.value) > 0
    )
    .sort((a, b) => Number(b.value) - Number(a.value));

  if (!sorted.length) {
    return (
      <div
        className="flex items-center justify-center text-sm text-ink/40"
        style={{ height }}
      >
        No data for this range.
      </div>
    );
  }

  const total = getTotal(sorted);

  const chartData = sorted.map((item) => ({
    ...item,
    value: Number(item.value),
    percentage: total
      ? (Number(item.value) / total) * 100
      : 0,
  }));

  return (
    <div
      className="grid grid-cols-1 xl:grid-cols-[1.05fr_0.95fr] items-center gap-3"
      style={{ minHeight: height }}
    >
      {/* Donut */}
      <div className="relative h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="label"
              cx="50%"
              cy="50%"
              innerRadius={62}
              outerRadius={94}
              paddingAngle={2}
              stroke="#FFFFFF"
              strokeWidth={2}
            >
              {chartData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    OWNER_COLORS[
                      index % OWNER_COLORS.length
                    ]
                  }
                />
              ))}
            </Pie>

            <Tooltip
              contentStyle={TOOLTIP_CONTENT_STYLE}
              labelStyle={TOOLTIP_LABEL_STYLE}
              itemStyle={TOOLTIP_ITEM_STYLE}
              cursor={TOOLTIP_CURSOR}
              formatter={(
                value: number,
                _: string,
                props: any
              ) => [
                `${formatNumber(Number(value))} orders`,
                props?.payload?.label ?? 'Owner',
              ]}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Center text */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-2xl font-extrabold leading-none tabular-nums text-ink">
            {formatNumber(total)}
          </div>

          <div className="mt-1 text-[10px] font-medium text-ink/45">
            Total Cancellations
          </div>
        </div>
      </div>

      {/* Owner cards */}
      <div className="space-y-2">
        {chartData.map((item, index) => (
          <div
            key={item.label}
            className="flex items-center justify-between rounded-xl border border-black/[0.055] bg-white px-3 py-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{
                  backgroundColor:
                    OWNER_COLORS[
                      index % OWNER_COLORS.length
                    ],
                }}
              />

              <span className="truncate text-xs font-medium text-ink/75">
                {item.label}
              </span>
            </div>

            <div className="ml-3 flex shrink-0 items-center gap-2.5">
              <span className="text-xs font-semibold tabular-nums text-ink/80">
                {formatNumber(Number(item.value))}
              </span>

              <span className="rounded-full bg-[#FFF3E9] px-2 py-1 text-[10px] font-semibold tabular-nums text-brand">
                {item.percentage.toFixed(1)}%
              </span>
            </div>
          </div>
        ))}

        {/* Insight */}
        {chartData[0] && (
          <div className="mt-3 rounded-xl border border-[#DCEFE2] bg-[#F1FAF4] px-3 py-2.5 text-xs leading-5 text-ink/65">
            <span className="font-semibold text-[#269653]">
              {chartData[0].label}
            </span>{' '}
            accounts for{' '}
            <span className="font-semibold text-[#269653]">
              {chartData[0].percentage.toFixed(1)}%
            </span>{' '}
            of cancellations.
          </div>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------
   MAIN COMPONENT
------------------------------------------------------- */

export default function CancellationBarChart({
  reasons = [],
  owners = [],
  type = 'reasons',
  height = 280,
}: Props) {
  if (type === 'owners') {
    return (
      <CancellationOwners
        data={owners}
        height={height}
      />
    );
  }

  return (
    <CancellationReasons
      data={reasons}
      height={height}
    />
  );
}
```
