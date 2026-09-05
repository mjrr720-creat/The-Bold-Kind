'use client';
import type { ReactNode } from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export type DashboardTab = 'orders' | 'performance';

const NAV_ITEMS: {
  id: DashboardTab;
  href: string;
  label: string;
  icon: ReactNode;
}[] = [
  {
    id: 'orders',
    href: '/',
    label: 'Order Analysis',
    icon: (
      <svg
        viewBox="0 0 20 20"
        fill="none"
        className="w-[20px] h-[20px] shrink-0"
      >
        <path
          d="M3.5 5.5A1.5 1.5 0 015 4h10a1.5 1.5 0 011.5 1.5v9A1.5 1.5 0 0115 16H5a1.5 1.5 0 01-1.5-1.5v-9z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="M6.5 8h7M6.5 11h7M6.5 14h4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    id: 'performance',
    href: '/performance',
    label: 'Performance Analysis',
    icon: (
      <svg
        viewBox="0 0 20 20"
        fill="none"
        className="w-[20px] h-[20px] shrink-0"
      >
        <path
          d="M3.5 16.5V3.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M3.5 16.5H16.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M6 13.5V10M9.5 13.5V6.5M13 13.5V9M16.5 13.5V4.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();

  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = async () => {
    setProfileOpen(false);

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Logout failed:', error);
      return;
    }

    router.replace('/login');
    router.refresh();
  };

  return (
    <aside
      className="
        fixed inset-y-0 left-0 z-30
        w-[72px] md:w-[285px]
        flex flex-col
        bg-[#111418]
        text-white
        border-r border-white/[0.07]
        transition-[width] duration-300
        overflow-hidden
      "
    >
      {/* =========================================
          BRAND HEADER
      ========================================= */}
      <div
        className="
          h-[108px]
          shrink-0
          flex items-center
          px-3 md:px-7
          border-b border-white/[0.07]
        "
      >
        <div className="flex items-center gap-3.5 w-full">
          {/* Logo */}
          <div
            className="
              relative
              w-[46px] h-[46px]
              shrink-0
              rounded-[14px]
              flex items-center justify-center
              bg-gradient-to-br from-[#F47A35] to-[#D95720]
              shadow-[0_8px_24px_rgba(233,103,47,0.28)]
            "
          >
            {/* Simple burger mark */}
            <div className="flex flex-col gap-[4px] items-center">
              <span className="block w-[21px] h-[3px] rounded-full bg-white" />
              <span className="block w-[25px] h-[3px] rounded-full bg-white" />
              <span className="block w-[21px] h-[3px] rounded-full bg-white" />
            </div>
          </div>

          {/* Brand */}
          <div className="hidden md:block min-w-0">
            <div className="text-[21px] leading-tight font-bold tracking-[-0.03em] text-white truncate">
              The Bold Kind
            </div>

            <div className="mt-1 text-[11px] text-white/35 tracking-[0.08em] uppercase">
              Analytics
            </div>
          </div>
        </div>

        {/* Collapse button */}
        <button
          type="button"
          className="
            hidden md:flex
            ml-auto
            w-9 h-9
            shrink-0
            items-center justify-center
            rounded-full
            bg-white/[0.05]
            border border-white/[0.06]
            text-white/55
            hover:text-white
            hover:bg-white/[0.09]
            transition-all duration-200
          "
          aria-label="Collapse sidebar"
        >
          <svg
            viewBox="0 0 20 20"
            fill="none"
            className="w-4 h-4"
          >
            <path
              d="M12.5 5L7.5 10L12.5 15"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* =========================================
          NAVIGATION
      ========================================= */}
      <nav className="flex-1 px-2.5 md:px-5 py-8">
        {/* Section title */}
        <div className="hidden md:block px-3 mb-4">
          <span
            className="
              text-[11px]
              font-semibold
              uppercase
              tracking-[0.12em]
              text-white/35
            "
          >
            Talabat
          </span>
        </div>

        <div className="space-y-2">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.id}
                href={item.href}
                title={item.label}
                aria-current={isActive ? 'page' : undefined}
                className={`
                  group
                  relative
                  w-full
                  h-[66px]
                  flex items-center
                  justify-center md:justify-start
                  gap-3.5
                  px-2 md:px-3
                  rounded-[16px]
                  text-[15px]
                  font-semibold
                  transition-all
                  duration-200
                  outline-none

                  ${
                    isActive
                      ? `
                        bg-gradient-to-r
                        from-[#A94F26]
                        to-[#73371F]
                        border border-[#D8672C]/45
                        text-white
                        shadow-[0_10px_30px_rgba(190,76,30,0.20)]
                      `
                      : `
                        text-white/55
                        border border-transparent
                        hover:text-white/90
                        hover:bg-white/[0.045]
                      `
                  }
                `}
              >
                {/* Active left indicator */}
                {isActive && (
                  <span
                    className="
                      absolute
                      left-[-1px]
                      top-1/2
                      -translate-y-1/2
                      w-[4px]
                      h-[38px]
                      rounded-r-full
                      bg-[#F47732]
                      shadow-[0_0_12px_rgba(244,119,50,0.65)]
                    "
                  />
                )}

                {/* Icon container */}
                <span
                  className={`
                    w-[44px] h-[44px]
                    shrink-0
                    rounded-[13px]
                    flex items-center justify-center
                    transition-all duration-200

                    ${
                      isActive
                        ? `
                          bg-white
                          text-[#E9672F]
                          shadow-[0_4px_14px_rgba(0,0,0,0.12)]
                        `
                        : `
                          bg-white/[0.045]
                          border border-white/[0.06]
                          text-white/55
                          group-hover:text-white/80
                          group-hover:bg-white/[0.07]
                        `
                    }
                  `}
                >
                  {item.icon}
                </span>

                {/* Label */}
                <span className="hidden md:block truncate flex-1 text-left">
                  {item.label}
                </span>

                {/* Chevron */}
                <svg
                  viewBox="0 0 20 20"
                  fill="none"
                  className={`
                    hidden md:block
                    w-[18px] h-[18px]
                    shrink-0
                    transition-all duration-200
                    ${
                      isActive
                        ? 'text-white/90 translate-x-0'
                        : 'text-white/30 group-hover:text-white/60 group-hover:translate-x-0.5'
                    }
                  `}
                >
                  <path
                    d="M7.5 4.5L13 10L7.5 15.5"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
            );
          })}
        </div>

        {/* =========================================
            REPORTS
        ========================================= */}
        <div className="hidden md:block mt-10">
          <div className="px-3 mb-4">
            <span
              className="
                text-[11px]
                font-semibold
                uppercase
                tracking-[0.12em]
                text-white/35
              "
            >
              Deliveroo
            </span>
          </div>

          <button
            type="button"
            className="
              group
              w-full
              h-[66px]
              flex items-center
              gap-3.5
              px-3
              rounded-[16px]
              text-white/55
              hover:text-white/90
              hover:bg-white/[0.045]
              transition-all duration-200
            "
          >
            <span
              className="
                w-[44px] h-[44px]
                shrink-0
                rounded-[13px]
                flex items-center justify-center
                bg-white/[0.045]
                border border-white/[0.06]
                text-white/55
                group-hover:text-white/80
              "
            >
              <svg
                viewBox="0 0 20 20"
                fill="none"
                className="w-[20px] h-[20px]"
              >
                <path
                  d="M10 3.5A6.5 6.5 0 1016.5 10H10V3.5z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 3.8A6.5 6.5 0 0116.2 8H12V3.8z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              </svg>
            </span>

            <span className="flex-1 text-left text-[15px] font-semibold">
              Order Analysis
            </span>

            <svg
              viewBox="0 0 20 20"
              fill="none"
              className="w-[18px] h-[18px] text-white/30 group-hover:text-white/60"
            >
              <path
                d="M7.5 4.5L13 10L7.5 15.5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </nav>

      {/* =========================================
          BOTTOM PROFILE + LOGOUT
      ========================================= */}
      <div className="hidden md:block px-5 pb-5 relative">
        {/* Profile Button */}
        <button
          type="button"
          onClick={() => setProfileOpen((open) => !open)}
          className="
            relative
            w-full
            rounded-[17px]
            border border-white/[0.08]
            bg-white/[0.025]
            p-3.5
            flex items-center
            gap-3
            text-left
            hover:bg-white/[0.055]
            transition-colors
            outline-none
          "
        >
          {/* Avatar */}
          <div className="relative shrink-0">
            <div
              className="
                w-[43px] h-[43px]
                rounded-full
                flex items-center justify-center
                border-2 border-[#E9672F]
                bg-[#1B1F24]
                text-white
                text-[17px]
                font-semibold
                shadow-[0_0_16px_rgba(233,103,47,0.20)]
              "
            >
              N
            </div>

            {/* Online dot */}
            <span
              className="
                absolute
                right-[-1px]
                bottom-[-1px]
                w-[12px] h-[12px]
                rounded-full
                bg-[#72C944]
                border-[2px]
                border-[#111418]
              "
            />
          </div>

          {/* User */}
          <div className="min-w-0 flex-1">
            <div className="text-[14px] font-semibold text-white truncate">
              Junaid
            </div>

            <div className="text-[12px] text-white/40 mt-0.5">
              Admin
            </div>
          </div>

          {/* Dropdown Arrow */}
          <svg
            viewBox="0 0 20 20"
            fill="none"
            className={`
              w-[18px] h-[18px] shrink-0
              text-white/35
              transition-transform duration-200
              ${profileOpen ? 'rotate-180' : ''}
            `}
          >
            <path
              d="M5.5 7.5L10 12L14.5 7.5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* Profile Dropdown */}
        {profileOpen && (
          <div
            className="
              absolute
              left-5
              right-5
              bottom-[88px]
              rounded-[15px]
              border border-white/[0.09]
              bg-[#181C21]
              shadow-[0_18px_45px_rgba(0,0,0,0.35)]
              overflow-hidden
              z-50
            "
          >
            {/* User Info */}
            <div className="px-4 py-3 border-b border-white/[0.07]">
              <div className="text-[13px] font-semibold text-white">
                Junaid
              </div>

              <div className="mt-0.5 text-[11px] text-white/40">
                Administrator
              </div>
            </div>

            {/* Logout */}
            <button
              type="button"
              onClick={handleLogout}
              className="
                w-full
                flex items-center
                gap-3
                px-4 py-3
                text-[13px]
                font-medium
                text-white/65
                hover:text-white
                hover:bg-[#E9672F]/10
                transition-colors
              "
            >
              {/* Logout Icon */}
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="w-[18px] h-[18px] text-[#F47732]"
              >
                <path
                  d="M10 17l5-5-5-5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                <path
                  d="M15 12H3"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />

                <path
                  d="M13 4h5a2 2 0 012 2v12a2 2 0 01-2 2h-5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              <span>
                Logout
              </span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}