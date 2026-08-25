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

  const isFlat =
    hasTrend && Math.abs(deltaPct as number) < 0.05;

  return (
    <div
      className={`
        relative overflow-hidden
        rounded-[18px]
        border border-[#E7E1DC]
        bg-white
        px-5
        py-5
        shadow-[0_2px_8px_rgba(30,25,20,0.04)]
        transition-all duration-200
        hover:-translate-y-[1px]
        hover:shadow-[0_8px_24px_rgba(30,25,20,0.07)]
        ${compact ? 'min-h-[154px]' : 'min-h-[190px]'}
        ${highlight ? 'ring-1 ring-[#F47A35]/15' : ''}
      `}
    >
      <div className="relative z-10 flex h-full flex-col">

        {/* KPI Label */}
        <div
          className={`
            font-medium
            leading-[1.25]
            text-[#586477]
            ${compact ? 'text-[13px]' : 'text-[14px]'}
          `}
        >
          {label}
        </div>

        {/* Value + Percentage */}
        <div
          className={`
            flex
            items-center
            gap-3
            ${compact ? 'mt-5' : 'mt-6'}
          `}
        >
          <div
            className={`
              whitespace-nowrap
              font-semibold
              tracking-[-0.035em]
              leading-none
              text-[#101828]
              tabular-nums
              ${compact ? 'text-[27px]' : 'text-[34px]'}
            `}
          >
            {value}
          </div>

          {hasTrend && (
            <div
              className={`
                inline-flex
                shrink-0
                items-center
                gap-1
                rounded-full
                border
                px-2.5
                py-[5px]
                text-[11px]
                font-semibold
                leading-none
                tabular-nums

                ${
                  isFlat
                    ? `
                      border-[#DDE1E6]
                      bg-[#F5F6F7]
                      text-[#667085]
                    `
                    : trendUp
                      ? `
                        border-[#D7F0E2]
                        bg-[#F0FAF4]
                        text-[#159447]
                      `
                      : `
                        border-[#FFD9D9]
                        bg-[#FFF2F2]
                        text-[#E53935]
                      `
                }
              `}
            >
              <span className="text-[12px]">
                {isFlat
                  ? '−'
                  : trendUp
                    ? '↗'
                    : '↘'}
              </span>

              <span>
                {Math.abs(deltaPct as number).toFixed(1)}%
              </span>
            </div>
          )}
        </div>

        {/* Previous Value */}
        <div
          className={`
            mt-4
            text-[#737D8D]
            ${compact ? 'text-[12px]' : 'text-[13px]'}
          `}
        >
          {previousLabel && previousValue !== undefined ? (
            <>
              <span className="font-medium">
                {previousLabel}:
              </span>{' '}
              <span className="font-semibold text-[#667085]">
                {previousValue}
              </span>
            </>
          ) : (
            <span className="font-medium">
              {vsLabel}
            </span>
          )}
        </div>

      </div>
    </div>
  );
}