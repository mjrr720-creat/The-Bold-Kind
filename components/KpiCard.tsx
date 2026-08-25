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
  | 'fc'
  | 'aov'
  | 'commission'
  | 'cancellation'
  | 'ontime'
  | 'complaint'
  | 'discount';

function getIconName(label: string): IconName {
  const name = label.toLowerCase();

  if (name.includes('store')) return 'store';
  if (name.includes('order') && name.includes('hour')) return 'hour';
  if (name.includes('order')) return 'orders';
  if (name.includes('sales')) return 'sales';
  if (name.includes('marketing fees')) return 'marketing';
  if (name === 'marketing %' || name.includes('marketing %')) return 'marketing';
  if (name.includes('tax')) return 'tax';
  if (name.includes('prep')) return 'prep';
  if (name.includes('delay')) return 'delay';
  if (name.includes('delivery')) return 'delivery';
  if (name.includes('voucher')) return 'voucher';
  if (name.includes('food cost')) return 'food';
  if (name.includes('payout after fc')) return 'fc';
  if (name === 'payout %' || name.includes('payout %')) return 'payout';
  if (name.includes('average order value')) return 'aov';
  if (name.includes('commission')) return 'commission';
  if (name.includes('cancellation')) return 'cancellation';
  if (name.includes('on-time')) return 'ontime';
  if (name.includes('complaint')) return 'complaint';
  if (name.includes('discount')) return 'discount';
  if (name.includes('payout')) return 'payout';

  return 'sales';
}

function KpiIcon({ name }: { name: IconName }) {
  const common =
    'h-[20px] w-[20px] fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"';

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
          <path d="M12 12V7" />
          <path d="M12 12l4 2" />
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

    case 'aov':
      return (
        <svg viewBox="0 0 24 24" className={common}>
          <path d="M4 17 9 12l4 3 7-8" />
          <path d="M15 7h5v5" />
        </svg>
      );

    case 'commission':
      return (
        <svg viewBox="0 0 24 24" className={common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M8 16 16 8" />
          <circle cx="8.5" cy="8.5" r="1" />
          <circle cx="15.5" cy="15.5" r="1" />
        </svg>
      );

    case 'cancellation':
      return (
        <svg viewBox="0 0 24 24" className={common}>
          <circle cx="12" cy="12" r="9" />
          <path d="m9 9 6 6" />
          <path d="m15 9-6 6" />
        </svg>
      );

    case 'ontime':
      return (
        <svg viewBox="0 0 24 24" className={common}>
          <circle cx="12" cy="12" r="9" />
          <path d="m8 12 2.5 2.5L16 9" />
        </svg>
      );

    case 'complaint':
      return (
        <svg viewBox="0 0 24 24" className={common}>
          <path d="M5 6h14v10H9l-4 4V6Z" />
          <path d="M9 10h.01" />
          <path d="M12 10h.01" />
          <path d="M15 10h.01" />
        </svg>
      );

    case 'discount':
      return (
        <svg viewBox="0 0 24 24" className={common}>
          <path d="m4 12 8-8h6l2 2v6l-8 8-8-8Z" />
          <circle cx="15" cy="7" r="1" />
        </svg>
      );

    default:
      return (
        <svg viewBox="0 0 24 24" className={common}>
          <circle cx="12" cy="12" r="9" />
        </svg>
      );
  }
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

  const icon = getIconName(label);

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

        {/* Icon + Label */}
        <div className="flex items-center gap-4">
          <div
            className="
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
              leading-[1.25]
              text-[#586477]
              ${compact ? 'text-[13px]' : 'text-[14px]'}
            `}
          >
            {label}
          </div>
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
                {isFlat ? '−' : trendUp ? '↗' : '↘'}
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