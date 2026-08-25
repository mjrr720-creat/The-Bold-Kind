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

type IconName =
  | 'store'
  | 'orders'
  | 'sales'
  | 'payout'
  | 'marketing'
  | 'tax'
  | 'hour'
  | 'prep'
  | 'delay'
  | 'delivery'
  | 'voucher'
  | 'food'
  | 'fc';

function getIconName(label: string): IconName {
  const name = label.toLowerCase();

  if (name.includes('store')) return 'store';
  if (name.includes('order')) return 'orders';
  if (name.includes('sales')) return 'sales';
  if (name.includes('marketing')) return 'marketing';
  if (name.includes('tax')) return 'tax';
  if (name.includes('prep')) return 'prep';
  if (name.includes('delay')) return 'delay';
  if (name.includes('delivery')) return 'delivery';
  if (name.includes('voucher')) return 'voucher';
  if (name.includes('food cost')) return 'food';
  if (name.includes('payout after fc')) return 'fc';
  if (name.includes('payout')) return 'payout';
  if (name.includes('order hour')) return 'hour';

  return 'sales';
}

function KpiIcon({ name }: { name: IconName }) {
  const common =
    'h-[20px] w-[20px] stroke-[1.8] fill="none" stroke="currentColor"';

  switch (name) {
    case 'store':
      return (
        <svg viewBox="0 0 24 24" className={common}>
          <path d="M4 10v9h16v-9" />
          <path d="M3 10 5 4h14l2 6" />
          <path d="M3 10c1.7 1.4 3.3 1.4 5 0 1.7 1.4 3.3 1.4 5 0 1.7 1.4 3.3 1.4 5 0 1.7 1.4 3.3 1.4 5 0" />
          <path d="M9 19v-5h6v5" />
        </svg>
      );

    case 'orders':
      return (
        <svg viewBox="0 0 24 24" className={common}>
          <path d="M6 7h12l1 13H5L6 7Z" />
          <path d="M9 7V5a3 3 0 0 1 6 0v2" />
          <path d="M9 12h6" />
        </svg>
      );

    case 'sales':
      return (
        <svg viewBox="0 0 24 24" className={common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M14.5 8.5c-.6-.6-1.5-1-2.5-1-1.4 0-2.5.7-2.5 1.8 0 2.8 5 1.4 5 4.1 0 1.1-1.1 1.8-2.5 1.8-1 0-1.9-.4-2.5-1" />
          <path d="M12 6v12" />
        </svg>
      );

    case 'payout':
      return (
        <svg viewBox="0 0 24 24" className={common}>
          <rect x="3" y="6" width="18" height="13" rx="2" />
          <path d="M3 9h18" />
          <path d="M16 14h3" />
        </svg>
      );

    case 'marketing':
      return (
        <svg viewBox="0 0 24 24" className={common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 12 12 7" />
          <path d="M12 12 16 14" />
          <path d="M12 12h7" />
        </svg>
      );

    case 'tax':
      return (
        <svg viewBox="0 0 24 24" className={common}>
          <path d="M6 3h12v18H6z" />
          <path d="M9 7h6" />
          <path d="M9 11h6" />
          <path d="M9 15h2" />
          <path d="M13 15h2" />
        </svg>
      );

    case 'hour':
      return (
        <svg viewBox="0 0 24 24" className={common}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 7v5l3 2" />
        </svg>
      );

    case 'prep':
      return (
        <svg viewBox="0 0 24 24" className={common}>
          <circle cx="12" cy="13" r="7" />
          <path d="M9 3h6" />
          <path d="M12 3v3" />
          <path d="M12 10v3l2 1" />
        </svg>
      );

    case 'delay':
      return (
        <svg viewBox="0 0 24 24" className={common}>
          <path d="M8 3h8" />
          <path d="M8 21h8" />
          <path d="M8 3c0 4 4 4 4 6s-4 2-4 6c0 2 2 4 4 4s4-2 4-4c0-4-4-4-4-6s4-2 4-6" />
        </svg>
      );

    case 'delivery':
      return (
        <svg viewBox="0 0 24 24" className={common}>
          <path d="M3 6h11v11H3z" />
          <path d="M14 10h4l3 3v4h-7z" />
          <circle cx="7" cy="19" r="2" />
          <circle cx="18" cy="19" r="2" />
        </svg>
      );

    case 'voucher':
      return (
        <svg viewBox="0 0 24 24" className={common}>
          <path d="M4 7h16v4a2 2 0 0 0 0 4v4H4v-4a2 2 0 0 0 0-4V7Z" />
          <path d="M12 9v2" />
          <path d="M12 13v2" />
        </svg>
      );

    case 'food':
      return (
        <svg viewBox="0 0 24 24" className={common}>
          <path d="M4 18 10 12l4 4 6-7" />
          <path d="M15 9h5v5" />
        </svg>
      );

    case 'fc':
      return (
        <svg viewBox="0 0 24 24" className={common}>
          <path d="M6 3v7" />
          <path d="M4 3v4a2 2 0 0 0 4 0V3" />
          <path d="M6 10v11" />
          <path d="M15 3v18" />
          <path d="M15 3c3 1 4 3 4 5 0 2-1 3-4 3" />
        </svg>
      );
  }
}

function Sparkline({
  trendUp,
  flat = false,
}: {
  trendUp: boolean;
  flat?: boolean;
}) {
  if (flat) {
    return (
      <svg
        viewBox="0 0 240 58"
        preserveAspectRatio="none"
        className="h-[52px] w-full"
      >
        <defs>
          <linearGradient id="flatFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#94A3B8" stopOpacity="0.14" />
            <stop offset="100%" stopColor="#94A3B8" stopOpacity="0" />
          </linearGradient>
        </defs>

        <path
          d="M0 35 L240 35 L240 58 L0 58 Z"
          fill="url(#flatFill)"
        />

        <path
          d="M0 35 L240 35"
          fill="none"
          stroke="#64748B"
          strokeWidth="1.8"
          strokeLinecap="round"
        />

        <circle cx="240" cy="35" r="4" fill="#64748B" />
      </svg>
    );
  }

  const stroke = trendUp ? '#18A566' : '#F04444';
  const fillId = trendUp ? 'greenFill' : 'redFill';

  return (
    <svg
      viewBox="0 0 240 58"
      preserveAspectRatio="none"
      className="h-[58px] w-full"
    >
      <defs>
        <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.15" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>

      <path
        d={
          trendUp
            ? 'M0 39 C15 29 23 37 37 35 C52 33 57 25 71 31 C85 38 93 43 108 36 C122 28 132 38 145 35 C159 31 169 38 182 30 C196 22 205 27 216 23 C227 19 233 18 240 12 L240 58 L0 58 Z'
            : 'M0 38 C15 26 25 38 40 32 C54 26 62 34 75 29 C90 24 98 42 112 39 C127 36 134 26 148 34 C161 42 171 28 185 32 C199 37 205 28 216 31 C228 34 235 25 240 15 L240 58 L0 58 Z'
        }
        fill={`url(#${fillId})`}
      />

      <path
        d={
          trendUp
            ? 'M0 39 C15 29 23 37 37 35 C52 33 57 25 71 31 C85 38 93 43 108 36 C122 28 132 38 145 35 C159 31 169 38 182 30 C196 22 205 27 216 23 C227 19 233 18 240 12'
            : 'M0 38 C15 26 25 38 40 32 C54 26 62 34 75 29 C90 24 98 42 112 39 C127 36 134 26 148 34 C161 42 171 28 185 32 C199 37 205 28 216 31 C228 34 235 25 240 15'
        }
        fill="none"
        stroke={stroke}
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <circle cx="240" cy={trendUp ? '12' : '15'} r="4" fill={stroke} />
    </svg>
  );
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

  const isPayoutAfterFc = label.toLowerCase().includes('payout after fc');

  const icon = getIconName(label);

  return (
    <div
      className={`
        group relative overflow-hidden
        rounded-[18px]
        border border-[#E8E3DF]
        bg-white
        shadow-[0_2px_8px_rgba(20,20,20,0.035)]
        transition-all duration-200
        hover:-translate-y-[1px]
        hover:shadow-[0_8px_25px_rgba(20,20,20,0.08)]
        ${compact ? 'min-h-[207px] px-5 py-4' : 'min-h-[273px] px-6 py-6'}
        ${highlight ? 'ring-1 ring-[#F47A35]/15' : ''}
      `}
    >
      {/* Soft orange background glow */}
      <div
        className="
          pointer-events-none
          absolute
          left-[22px]
          top-[22px]
          h-[48px]
          w-[48px]
          rounded-[14px]
          bg-[#FFF4EC]
        "
      />

      <div className="relative z-10 flex h-full flex-col">
        {/* Icon + Label */}
        <div className="flex items-center gap-4">
          <div
            className="
              relative
              flex
              h-[48px]
              w-[48px]
              shrink-0
              items-center
              justify-center
              rounded-[14px]
              bg-[#FFF4EC]
              text-[#F36F21]
            "
          >
            <KpiIcon name={icon} />
          </div>

          <div
            className={`
              font-medium
              text-[#5F6877]
              ${compact ? 'text-[13px]' : 'text-[14px]'}
            `}
          >
            {label}
          </div>
        </div>

        {/* Value + Trend */}
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
              text-[#111827]
              tabular-nums
              ${compact ? 'text-[25px]' : 'text-[36px]'}
            `}
          >
            {value}
          </div>

          {hasTrend && (
            <div
              className={`
                flex
                shrink-0
                items-center
                rounded-full
                px-2.5
                py-1.5
                text-[12px]
                font-semibold
                tabular-nums
                ${
                  isFlat
                    ? 'bg-[#F1F3F5] text-[#5F6877]'
                    : trendUp
                      ? 'bg-[#EAF8F0] text-[#159447]'
                      : 'bg-[#FFF0F0] text-[#EF3F3F]'
                }
              `}
            >
              <span className="mr-1">
                {isFlat ? '−' : trendUp ? '↗' : '↘'}
              </span>

              {Math.abs(deltaPct as number).toFixed(1)}%
            </div>
          )}
        </div>

        {/* Previous / Comparison */}
        <div
          className={`
            text-[13px]
            font-medium
            text-[#667085]
            ${compact ? 'mt-3' : 'mt-4'}
          `}
        >
          {previousLabel && previousValue !== undefined ? (
            <>
              {previousLabel}:{' '}
              <span className="font-semibold text-[#667085]">
                {previousValue}
              </span>
            </>
          ) : (
            <>
              {vsLabel}
            </>
          )}
        </div>

        {/* Sparkline */}
        <div
          className={`
            mt-auto
            w-full
            ${compact ? 'pt-3' : 'pt-4'}
          `}
        >
          <Sparkline
            trendUp={trendUp}
            flat={isPayoutAfterFc || isFlat}
          />
        </div>
      </div>
    </div>
  );
}