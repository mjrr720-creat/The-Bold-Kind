interface Props {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  variant?: 'default' | 'hero';
}

export default function SectionHeader({
  eyebrow,
  title,
  subtitle,
  action,
  variant = 'default',
}: Props) {
  if (variant === 'hero') {
    return (
      <section className="relative overflow-hidden rounded-[24px] border border-black/[0.06] bg-white shadow-[0_8px_30px_rgba(20,20,20,0.06)] mb-6">
        {/* Orange decorative waves */}
        <div className="pointer-events-none absolute right-[-30px] bottom-[-90px] w-[560px] h-[300px] opacity-60">
          <svg
            viewBox="0 0 600 300"
            fill="none"
            className="w-full h-full"
          >
            <path
              d="M40 250 C140 180 180 40 300 100 C400 150 420 260 560 180"
              stroke="#F97316"
              strokeWidth="1.2"
              opacity="0.16"
            />
            <path
              d="M40 265 C150 190 185 55 305 115 C405 165 425 275 570 195"
              stroke="#F97316"
              strokeWidth="1.2"
              opacity="0.13"
            />
            <path
              d="M40 280 C155 200 190 70 310 130 C410 180 430 290 580 210"
              stroke="#F97316"
              strokeWidth="1.2"
              opacity="0.10"
            />
            <path
              d="M40 295 C160 210 195 85 315 145 C415 195 435 305 590 225"
              stroke="#F97316"
              strokeWidth="1.2"
              opacity="0.08"
            />
          </svg>
        </div>

        <div className="relative z-10 px-8 md:px-12 pt-8 pb-7">

          {/* Main heading */}
          <div className="flex items-start justify-between gap-6">

            <div className="flex items-center gap-5">

              {/* Analytics icon */}
              <div className="flex h-[82px] w-[82px] shrink-0 items-center justify-center rounded-[24px] bg-gradient-to-br from-orange-50 to-orange-100 shadow-sm">
                <svg
                  viewBox="0 0 32 32"
                  fill="none"
                  className="h-11 w-11 text-brand"
                >
                  <path
                    d="M5 26V16"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M13 26V11"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M21 26V17"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M29 26V7"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M4 13L11 7L18 12L28 4"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M24 4H28V8"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <div>
                {eyebrow && (
                  <div className="text-[11px] uppercase tracking-[0.16em] font-bold text-brand mb-2">
                    {eyebrow}
                  </div>
                )}

                <h2 className="text-[32px] md:text-[42px] leading-[1.05] font-extrabold tracking-[-0.035em] text-ink">
                  {title}
                </h2>

                {subtitle && (
                  <p className="mt-2 text-[15px] md:text-[17px] text-ink/55">
                    {subtitle}
                  </p>
                )}
              </div>

            </div>

            {/* Action */}
            {action && (
              <div className="relative z-20 shrink-0">
                {action}
              </div>
            )}

          </div>

          {/* Breadcrumb */}
          <div className="mt-8 flex items-center gap-3">

            <div className="flex h-12 w-12 items-center justify-center rounded-[14px] border border-black/[0.06] bg-white shadow-sm">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-5 w-5 text-ink/65"
              >
                <path
                  d="M3 10.5L12 3L21 10.5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M5 9.5V20H19V9.5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
                <path
                  d="M9 20V14H15V20"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <span className="text-[16px] font-medium text-ink/55">
              Dashboard
            </span>

            <svg
              viewBox="0 0 20 20"
              fill="none"
              className="h-5 w-5 text-ink/25"
            >
              <path
                d="M7 4L13 10L7 16"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            <span className="text-[16px] font-medium text-ink/55">
              Analytics
            </span>

            <svg
              viewBox="0 0 20 20"
              fill="none"
              className="h-5 w-5 text-ink/25"
            >
              <path
                d="M7 4L13 10L7 16"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            <span className="text-[16px] font-bold text-brand">
              {title}
            </span>

          </div>
        </div>
      </section>
    );
  }

  // Existing/default header
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
      <div>
        {eyebrow && (
          <div className="section-eyebrow mb-1">
            {eyebrow}
          </div>
        )}

        <h2 className="section-title text-lg">
          {title}
        </h2>

        {subtitle && (
          <p className="text-xs text-ink/45 mt-0.5">
            {subtitle}
          </p>
        )}
      </div>

      {action && (
        <div className="shrink-0">
          {action}
        </div>
      )}
    </div>
  );
}