'use client';

interface LabelValue {
  label: string;
  value: number;
}

interface Props {
  onTimeDeliveryPct: number | null;
  deliveryDelayBuckets: LabelValue[];
  deliveryTypeBreakdown: LabelValue[];
}

function MiniBarList({
  items,
}: {
  items: LabelValue[];
}) {
  if (!items || items.length === 0) {
    return (
      <div className="flex min-h-[120px] items-center justify-center text-sm text-ink/40">
        No data for this range.
      </div>
    );
  }

  const max = Math.max(1, ...items.map((i) => Number(i.value) || 0));
  const total = items.reduce(
    (sum, item) => sum + (Number(item.value) || 0),
    0
  );

  return (
    <div className="space-y-5">
      {items.map((item) => {
        const percentage = total > 0 ? (item.value / total) * 100 : 0;
        const barWidth = max > 0 ? (item.value / max) * 100 : 0;

        return (
          <div key={item.label} className="min-w-0">
            {/* Label + Value */}
            <div className="mb-2 flex items-center justify-between gap-4">
              <span
                className="min-w-0 truncate text-[13px] font-medium leading-5 text-ink"
                title={item.label}
              >
                {item.label}
              </span>

              <div className="flex shrink-0 items-center gap-3">
                <span className="text-[11px] font-medium tabular-nums text-ink/35">
                  {percentage.toFixed(0)}%
                </span>

                <span className="min-w-[42px] text-right text-[13px] font-bold tabular-nums text-ink">
                  {item.value.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Progress */}
            <div className="h-[7px] w-full overflow-hidden rounded-full bg-[#F1EEEB]">
              <div
                className="h-full rounded-full bg-brand transition-all duration-500"
                style={{
                  width: `${Math.max(barWidth, item.value > 0 ? 1.5 : 0)}%`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StatusBadge({ percentage }: { percentage: number }) {
  const isGood = percentage >= 70;

  return (
    <div
      className={[
        'inline-flex items-center gap-2 rounded-full border px-3 py-1.5',
        isGood
          ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
          : 'border-brand/10 bg-brand/5 text-brand',
      ].join(' ')}
    >
      <span
        className={[
          'h-1.5 w-1.5 rounded-full',
          isGood ? 'bg-emerald-500' : 'bg-brand',
        ].join(' ')}
      />

      <span className="text-[11px] font-semibold whitespace-nowrap">
        {isGood ? 'Good Performance' : 'Needs Improvement'}
      </span>
    </div>
  );
}

function InsightBox({
  type,
  title,
  description,
}: {
  type: 'delivery' | 'type';
  title: string;
  description: string;
}) {
  return (
    <div
      className={[
        'mt-6 flex items-center gap-3 rounded-2xl border px-4 py-4',
        type === 'delivery'
          ? 'border-brand/5 bg-[#FFF9F5]'
          : 'border-violet-100 bg-[#FAF8FF]',
      ].join(' ')}
    >
      <div
        className={[
          'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
          type === 'delivery'
            ? 'bg-brand/10 text-brand'
            : 'bg-violet-100 text-violet-600',
        ].join(' ')}
      >
        {type === 'delivery' ? (
          <svg
            width="19"
            height="19"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path d="M3 12l4 4 8-8" />
            <path d="M14 8h5v5" />
          </svg>
        ) : (
          <svg
            width="19"
            height="19"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" />
            <path d="M4 7.5l8 4.5 8-4.5" />
            <path d="M12 12v9" />
          </svg>
        )}
      </div>

      <div className="min-w-0">
        <div className="truncate text-[12px] font-bold leading-5 text-ink">
          {title}
        </div>

        <div className="mt-0.5 line-clamp-2 text-[11px] leading-[17px] text-ink/45">
          {description}
        </div>
      </div>
    </div>
  );
}

export default function DeliveryPerformanceCard({
  onTimeDeliveryPct,
  deliveryDelayBuckets,
  deliveryTypeBreakdown,
}: Props) {
  const percentage =
    onTimeDeliveryPct !== null && onTimeDeliveryPct !== undefined
      ? Number(onTimeDeliveryPct)
      : null;

  const delayTotal = deliveryDelayBuckets.reduce(
    (sum, item) => sum + Number(item.value || 0),
    0
  );

  const typeTotal = deliveryTypeBreakdown.reduce(
    (sum, item) => sum + Number(item.value || 0),
    0
  );

  const topDeliveryType =
    deliveryTypeBreakdown.length > 0
      ? deliveryTypeBreakdown.reduce((a, b) =>
          Number(b.value) > Number(a.value) ? b : a
        )
      : null;

  return (
    <section className="card overflow-hidden">
      {/* ================= HEADER ================= */}
      <div className="border-b border-ink/5 px-6 py-5 md:px-7 md:py-6">
        <div className="flex items-center gap-4">
          {/* Icon */}
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand text-white shadow-[0_8px_20px_rgba(233,103,47,0.18)]">
            <svg
              width="25"
              height="25"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="M3 6h11v11H3z" />
              <path d="M14 10h4l3 3v4h-7z" />
              <circle cx="7" cy="18" r="1.7" />
              <circle cx="18" cy="18" r="1.7" />
            </svg>
          </div>

          <div className="min-w-0">
            <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.18em] text-brand">
              Delivery
            </div>

            <h3 className="text-[22px] font-bold leading-tight tracking-[-0.02em] text-ink md:text-[24px]">
              Delivery Performance
            </h3>

            <p className="mt-1 text-[12px] leading-5 text-ink/45 md:text-[13px]">
              Track and analyze your delivery performance in real-time.
            </p>
          </div>
        </div>
      </div>

      {/* ================= CONTENT ================= */}
      <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-3 md:p-6">
        {/* ================= ON TIME ================= */}
        <div className="relative min-h-[455px] overflow-hidden rounded-[20px] border border-brand/15 bg-gradient-to-br from-[#FFFDFC] via-[#FFF8F3] to-[#FFF0E5]">
          {/* Decorative circles */}
          <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-brand/5" />
          <div className="absolute -left-16 -bottom-16 h-44 w-44 rounded-full bg-brand/5" />

          <div className="relative flex h-full flex-col items-center px-5 py-8">
            {/* Ring */}
            <div className="relative flex h-[275px] w-[275px] items-center justify-center">
              <svg
                className="absolute inset-0 h-full w-full -rotate-90"
                viewBox="0 0 100 100"
              >
                {/* Background */}
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="#FCE9DC"
                  strokeWidth="5"
                />

                {/* Progress */}
                {percentage !== null && (
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="#E9672F"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeDasharray={`${Math.min(
                      Math.max(percentage, 0),
                      100
                    ) * 2.639} 264`}
                  />
                )}
              </svg>

              <div className="relative flex flex-col items-center text-center">
                <div className="text-[46px] font-extrabold leading-none tracking-[-0.04em] text-brand md:text-[50px]">
                  {percentage !== null ? `${percentage.toFixed(1)}%` : '—'}
                </div>

                <div className="mt-2 text-[13px] font-semibold text-ink">
                  On-Time Delivery
                </div>

                {percentage !== null && (
                  <div className="mt-3">
                    <StatusBadge percentage={percentage} />
                  </div>
                )}
              </div>
            </div>

            {/* Bottom insight */}
            <div className="mt-auto w-full rounded-2xl border border-white/80 bg-white/75 p-4 shadow-sm backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path d="M12 3l8 4v5c0 4.5-3 7.5-8 9-5-1.5-8-4.5-8-9V7l8-4z" />
                    <path d="M9 12l2 2 4-4" />
                  </svg>
                </div>

                <div className="min-w-0">
                  <div className="text-[12px] font-bold leading-5 text-ink">
                    {percentage !== null && percentage >= 70
                      ? "You're doing great!"
                      : 'Delivery needs attention'}
                  </div>

                  <div className="mt-1 text-[11px] leading-[17px] text-ink/50">
                    {percentage !== null && percentage >= 70
                      ? 'Keep up the consistent efforts to improve delivery reliability.'
                      : 'Keep improving delivery reliability and reduce late orders.'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================= DELIVERY DELAY ================= */}
        <div className="min-h-[455px] rounded-[20px] border border-ink/5 bg-white p-5 md:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <circle cx="12" cy="12" r="8.5" />
                <path d="M12 7v5l3 2" />
              </svg>
            </div>

            <div className="min-w-0">
              <h4 className="text-[15px] font-bold leading-5 text-ink">
                Delivery Delay
              </h4>

              <p className="mt-0.5 text-[11px] leading-4 text-ink/40">
                Orders by delivery timing
              </p>
            </div>
          </div>

          <div className="mt-7">
            <MiniBarList items={deliveryDelayBuckets} />
          </div>

          <InsightBox
            type="delivery"
            title="Most deliveries are on track."
            description={`${delayTotal.toLocaleString()} deliveries analyzed for timing performance.`}
          />
        </div>

        {/* ================= DELIVERY TYPE ================= */}
        <div className="min-h-[455px] rounded-[20px] border border-ink/5 bg-white p-5 md:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" />
                <path d="M4 7.5l8 4.5 8-4.5" />
                <path d="M12 12v9" />
              </svg>
            </div>

            <div className="min-w-0">
              <h4 className="text-[15px] font-bold leading-5 text-ink">
                Delivery Type
              </h4>

              <p className="mt-0.5 text-[11px] leading-4 text-ink/40">
                Orders by fulfillment type
              </p>
            </div>
          </div>

          <div className="mt-7">
            <MiniBarList items={deliveryTypeBreakdown} />
          </div>

          <InsightBox
            type="type"
            title={
              topDeliveryType
                ? `${topDeliveryType.label} is the top choice`
                : 'Delivery type overview'
            }
            description={
              topDeliveryType && typeTotal > 0
                ? `${Math.round(
                    (topDeliveryType.value / typeTotal) * 100
                  )}% of delivery orders use this fulfillment type.`
                : 'Delivery fulfillment type breakdown.'
            }
          />
        </div>
      </div>

      {/* ================= FOOTER ================= */}
      <div className="flex items-center justify-center border-t border-ink/5 px-5 py-4">
        <div className="flex items-center gap-2 text-[11px] text-ink/40">
          <span className="flex h-5 w-5 items-center justify-center rounded-full border border-ink/10">
            i
          </span>
          <span>
            Delivery metrics are calculated from the selected date range.
          </span>
        </div>
      </div>
    </section>
  );
}