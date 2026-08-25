interface KpiCardProps {
  value: string;
  label: string;
  previousLabel?: string;
  previousValue?: string;
  deltaPct?: number | null;
  vsLabel?: string;
  compact?: boolean;
  highlight?: boolean;
}

export default function KpiCard({
  value,
  label,
  previousLabel,
  previousValue,
  deltaPct,
  vsLabel = 'vs prev',
  compact,
  highlight,
}: KpiCardProps) {
  const hasTrend =
    deltaPct !== null &&
    deltaPct !== undefined &&
    Number.isFinite(deltaPct);

  const trendUp = hasTrend && (deltaPct as number) >= 0;

  return (
    <div
      className={`
        relative overflow-hidden
        rounded-2xl
        border border-[#E9E1DB]
        bg-gradient-to-br
        from-[#FFFDFC]
        via-white
        to-[#FFF5EE]
        px-5 py-4
        min-h-[124px]
        transition-all duration-200
        hover:-translate-y-[1px]
        hover:border-[#E1D5CD]
        hover:shadow-[0_8px_24px_rgba(50,35,25,0.07)]
        ${highlight ? 'ring-1 ring-brand/10' : ''}
      `}
    >
      {/* subtle orange glow */}
      <div
        className="
          pointer-events-none
          absolute
          -right-12
          -bottom-16
          h-32
          w-32
          rounded-full
          bg-[#F28A52]/[0.07]
          blur-2xl
        "
      />

      <div className="relative z-10 flex h-full flex-col">

        {/* LINE 1 — label */}
        <div
          className="
            text-[13px]
            font-medium
            leading-none
            text-[#625A55]
          "
        >
          {label}
        </div>

        {/* LINE 2 — value + comparison */}
        <div className="mt-5 flex items-end justify-between gap-3">

          {/* Value */}
          <div
            className={`
              whitespace-nowrap
              font-semibold
              tracking-[-0.025em]
              leading-none
              text-[#111827]
              tabular-nums
              ${compact ? 'text-[26px]' : 'text-[30px]'}
            `}
          >
            {value}
          </div>

          {/* Trend */}
          {hasTrend && (
            <div className="mb-[1px] flex shrink-0 items-center gap-1.5">
              <span
                className={`
                  text-[12px]
                  font-medium
                  tabular-nums
                  ${
                    trendUp
                      ? 'text-[#168447]'
                      : 'text-[#E05252]'
                  }
                `}
              >
                {trendUp ? '↑' : '↓'}{' '}
                {Math.abs(deltaPct as number).toFixed(1)}%
              </span>

              <span className="text-[11px] text-[#9A928C]">
                {vsLabel}
              </span>
            </div>
          )}
        </div>

        {/* Previous value — only when available */}
        {previousLabel && previousValue !== undefined && (
          <div className="mt-2 text-[10px] text-[#AAA29C]">
            {previousLabel}:{' '}
            <span className="font-medium text-[#817872]">
              {previousValue}
            </span>
          </div>
        )}

      </div>
    </div>
  );
}