'use client';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { DashboardFilters } from '@/lib/types';
import { previousPeriodOf } from '@/lib/dateRange';
import DateRangePicker from '@/components/DateRangePicker';
import BrandFilter from '@/components/BrandFilter';

interface Props {
  filters: DashboardFilters;
  restaurants: string[];
  onChange: (filters: DashboardFilters) => void;
  trailing?: ReactNode;
}

export default function Filters({
  filters,
  restaurants,
  onChange,
}: Props) {
  const [restaurantOpen, setRestaurantOpen] =
    useState(false);

  const [search, setSearch] = useState('');
  const [draftRestaurants, setDraftRestaurants] =
    useState<string[]>([]);

  const restaurantRef =
    useRef<HTMLDivElement>(null);

  const [calendarCloseSignal, setCalendarCloseSignal] =
    useState(0);

  /* =====================================================
     RESTAURANTS
     ===================================================== */

  const allRestaurants = useMemo(() => {
    return restaurants
      .map((restaurant) => restaurant.trim())
      .filter(Boolean);
  }, [restaurants]);

  const committedRestaurants = useMemo(() => {
    if (
      !filters.restaurant ||
      filters.restaurant === 'All'
    ) {
      return allRestaurants;
    }

    return filters.restaurant
      .split('|')
      .map((item) => item.trim())
      .filter(Boolean)
      .filter((item) =>
        allRestaurants.includes(item)
      );
  }, [filters.restaurant, allRestaurants]);

  const filteredRestaurants = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return allRestaurants;

    return allRestaurants.filter((restaurant) =>
      restaurant.toLowerCase().includes(query)
    );
  }, [allRestaurants, search]);

  const openRestaurants = () => {
    setDraftRestaurants([
      ...committedRestaurants,
    ]);

    setSearch('');
    setRestaurantOpen(true);

    setCalendarCloseSignal((n) => n + 1);
  };

  const isAllSelected =
    allRestaurants.length > 0 &&
    draftRestaurants.length ===
      allRestaurants.length &&
    allRestaurants.every((restaurant) =>
      draftRestaurants.includes(restaurant)
    );

  const toggleRestaurant = (
    restaurant: string
  ) => {
    setDraftRestaurants((previous) => {
      const exists =
        previous.includes(restaurant);

      if (
        previous.length ===
          allRestaurants.length &&
        allRestaurants.length > 1 &&
        exists
      ) {
        return [restaurant];
      }

      if (exists) {
        return previous.filter(
          (item) => item !== restaurant
        );
      }

      return [...previous, restaurant];
    });
  };

  const toggleAll = () => {
    setDraftRestaurants((previous) => {
      if (isAllSelected) return [];

      return [...allRestaurants];
    });
  };

  const applyRestaurantSelection = () => {
    if (draftRestaurants.length === 0) {
      setRestaurantOpen(false);
      setSearch('');
      return;
    }

    if (
      draftRestaurants.length ===
        allRestaurants.length &&
      allRestaurants.every((restaurant) =>
        draftRestaurants.includes(restaurant)
      )
    ) {
      onChange({
        ...filters,
        restaurant: 'All',
      });
    } else {
      onChange({
        ...filters,
        restaurant:
          draftRestaurants.join('|'),
      });
    }

    setRestaurantOpen(false);
    setSearch('');
  };

  const displayText =
    committedRestaurants.length ===
        allRestaurants.length &&
      allRestaurants.length > 0
      ? 'All restaurants'
      : committedRestaurants.length === 0
        ? 'All restaurants'
        : committedRestaurants.length === 1
          ? committedRestaurants[0]
          : `${committedRestaurants.length} restaurants selected`;

  /* =====================================================
     CLOSE RESTAURANT DROPDOWN
     ===================================================== */

  useEffect(() => {
    const handleClickOutside = (
      event: MouseEvent
    ) => {
      const target = event.target as Node;

      if (
        restaurantRef.current &&
        !restaurantRef.current.contains(target)
      ) {
        setRestaurantOpen(false);
        setSearch('');
      }
    };

    document.addEventListener(
      'mousedown',
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        'mousedown',
        handleClickOutside
      );
    };
  }, []);

  /* =====================================================
     COMPARISON
     ===================================================== */

  const setCompareEnabled = (
    enabled: boolean
  ) => {
    if (!enabled) {
      onChange({
        ...filters,
        compareEnabled: false,
      });

      return;
    }

    const previous = previousPeriodOf(
      filters.startDate,
      filters.endDate
    );

    onChange({
      ...filters,
      compareEnabled: true,
      compareMode:
        filters.compareMode === 'custom'
          ? 'custom'
          : 'previous',
      compareStartDate:
        filters.compareMode === 'custom'
          ? filters.compareStartDate ||
            previous.startDate
          : previous.startDate,
      compareEndDate:
        filters.compareMode === 'custom'
          ? filters.compareEndDate ||
            previous.endDate
          : previous.endDate,
    });
  };

  /* =====================================================
     RENDER
     ===================================================== */

  return (
    <div className="w-full">

      {/* =================================================
          TOP FILTERS
          ================================================= */}

      <div className="flex w-full flex-col gap-5 lg:flex-row lg:items-stretch">

        {/* =================================================
            BRAND
            ================================================= */}

        <div className="min-w-0 flex-1">
          <FilterSectionTitle
            number="01"
            title="Brand"
          />

          <div className="mt-3">
            <BrandFilter
              value={filters.brand}
              onChange={(brand) =>
                onChange({
                  ...filters,
                  brand,
                })
              }
            />
          </div>
        </div>

        {/* DIVIDER */}

        <div className="hidden w-px bg-[#EEE9E6] lg:block" />

        {/* =================================================
            RESTAURANT
            ================================================= */}

        <div
          ref={restaurantRef}
          className="relative min-w-0 flex-1"
        >
          <FilterSectionTitle
            number="02"
            title="Restaurant"
          />

          <button
            type="button"
            onClick={() => {
              if (restaurantOpen) {
                setRestaurantOpen(false);
                setSearch('');
              } else {
                openRestaurants();
              }
            }}
            className="mt-3 flex h-[52px] w-full items-center justify-between rounded-[11px] border border-[#E9E3DF] bg-white px-3.5 text-left transition hover:border-[#DCD3CD]"
          >
            <span className="flex min-w-0 items-center gap-3">
              <RestaurantIcon />

              <span className="truncate text-[14px] font-medium text-[#34363A]">
                {displayText}
              </span>
            </span>

            <ChevronDown
              rotated={restaurantOpen}
            />
          </button>

          {/* RESTAURANT DROPDOWN */}

          {restaurantOpen && (
            <div className="absolute left-0 top-[calc(100%+8px)] z-[300] w-full min-w-[340px] overflow-hidden rounded-[16px] border border-[#E7E2DE] bg-white shadow-[0_18px_50px_rgba(25,20,15,0.16)]">

              {/* SEARCH */}

              <div className="border-b border-[#ECE8E5] p-3">
                <div className="flex h-[42px] items-center gap-2 rounded-[10px] border border-[#E5E0DC] bg-white px-3 transition focus-within:border-[#F36A21] focus-within:ring-2 focus-within:ring-[#F36A21]/10">
                  <SearchIcon />

                  <input
                    type="text"
                    value={search}
                    onChange={(e) =>
                      setSearch(e.target.value)
                    }
                    placeholder="Search vendors..."
                    className="w-full border-0 bg-transparent text-[13px] text-[#172033] outline-none placeholder:text-[#999]"
                  />
                </div>
              </div>

              {/* SELECT ALL */}

              <button
                type="button"
                onClick={toggleAll}
                className="flex w-full items-center gap-3 border-b border-[#ECE8E5] bg-[#FFF9F5] px-4 py-3.5 text-left transition hover:bg-[#FFF3EC]"
              >
                <span
                  className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[7px] border transition ${
                    isAllSelected
                      ? 'border-[#F36A21] bg-[#F36A21]'
                      : 'border-[#BDB8B4] bg-white'
                  }`}
                >
                  {isAllSelected && (
                    <CheckIcon />
                  )}
                </span>

                <span className="text-[14px] font-semibold text-[#171717]">
                  Select all
                </span>

                <span className="ml-auto rounded-full bg-[#FFF0E7] px-2 py-0.5 text-[11px] font-semibold text-[#F36A21]">
                  {draftRestaurants.length}
                </span>
              </button>

              {/* RESTAURANTS */}

              <div className="max-h-[330px] overflow-y-auto">
                {filteredRestaurants.length ===
                0 ? (
                  <div className="px-4 py-8 text-center text-[13px] text-[#999]">
                    No restaurants found
                  </div>
                ) : (
                  filteredRestaurants.map(
                    (restaurant) => {
                      const selected =
                        draftRestaurants.includes(
                          restaurant
                        );

                      return (
                        <button
                          type="button"
                          key={restaurant}
                          onClick={() =>
                            toggleRestaurant(
                              restaurant
                            )
                          }
                          className="flex w-full items-center gap-3 border-b border-[#F0EEEC] px-4 py-3 text-left transition hover:bg-[#FFF9F5]"
                        >
                          <span
                            className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[7px] border transition ${
                              selected
                                ? 'border-[#F36A21] bg-[#F36A21] shadow-[0_2px_6px_rgba(243,106,33,0.22)]'
                                : 'border-[#C8C4C1] bg-white'
                            }`}
                          >
                            {selected && (
                              <CheckIcon />
                            )}
                          </span>

                          <span className="min-w-0 flex-1">
                            <span
                              className={`block truncate text-[13px] ${
                                selected
                                  ? 'font-semibold text-[#171717]'
                                  : 'font-medium text-[#303030]'
                              }`}
                            >
                              {restaurant}
                            </span>
                          </span>

                          {selected && (
                            <span className="h-[7px] w-[7px] shrink-0 rounded-full bg-[#F36A21]" />
                          )}
                        </button>
                      );
                    }
                  )
                )}
              </div>

              {/* FOOTER */}

              <div className="flex items-center justify-between border-t border-[#ECE8E5] bg-[#FCFBFA] px-4 py-3">
                <span className="text-[11px] font-medium text-[#8A8581]">
                  {draftRestaurants.length}{' '}
                  {draftRestaurants.length === 1
                    ? 'restaurant'
                    : 'restaurants'}{' '}
                  selected
                </span>

                <button
                  type="button"
                  onClick={
                    applyRestaurantSelection
                  }
                  disabled={
                    draftRestaurants.length === 0
                  }
                  className="rounded-[8px] bg-[#F36A21] px-4 py-2 text-[12px] font-semibold text-white shadow-[0_3px_8px_rgba(243,106,33,0.20)] transition hover:bg-[#E65D16] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>

        {/* DIVIDER */}

        <div className="hidden w-px bg-[#EEE9E6] lg:block" />

        {/* =================================================
            DATE RANGE
            ================================================= */}

        <div className="min-w-0 flex-[1.35]">
          <FilterSectionTitle
            number="03"
            title="Date range"
          />

          <div className="mt-3">
            <DateRangePicker
              startDate={filters.startDate}
              endDate={filters.endDate}
              showLabels={false}
              showDuration
              onChange={(
                startDate,
                endDate
              ) =>
                onChange({
                  ...filters,
                  startDate,
                  endDate,
                })
              }
              onOpen={() =>
                setRestaurantOpen(false)
              }
              closeSignal={
                calendarCloseSignal
              }
            />
          </div>
        </div>
      </div>

      {/* =================================================
          COMPARISON
          ================================================= */}

      <div className="mt-8 rounded-[14px] border border-[#F3DDD0] bg-gradient-to-r from-[#FFFDFC] via-[#FFFBF9] to-[#FFFDFC] px-5 py-5 shadow-[0_5px_20px_rgba(243,106,33,0.04)]">

        <div className="flex w-full flex-col gap-5 xl:flex-row xl:items-center">

          {/* COMPARE */}

          <div className="flex min-w-[235px] items-center gap-3 xl:border-r xl:border-[#F0E5DF] xl:pr-7">
            <div>
              <div className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-[#85888D]">
                Compare
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={
                  filters.compareEnabled
                }
                onClick={() =>
                  setCompareEnabled(
                    !filters.compareEnabled
                  )
                }
                className={`relative flex h-[30px] w-[50px] items-center rounded-full transition ${
                  filters.compareEnabled
                    ? 'bg-[#F36A21]'
                    : 'bg-[#D9D4D0]'
                }`}
              >
                <span
                  className={`absolute top-[3px] h-[24px] w-[24px] rounded-full bg-white shadow-[0_2px_5px_rgba(0,0,0,0.12)] transition ${
                    filters.compareEnabled
                      ? 'left-[23px]'
                      : 'left-[3px]'
                  }`}
                />
              </button>
            </div>

            <div className="pt-[22px]">
              <div className="text-[13px] font-medium text-[#F36A21]">
                Enable comparison
              </div>

              <div className="mt-0.5 whitespace-nowrap text-[12px] text-[#9A9591]">
                Compare with a previous period
              </div>
            </div>
          </div>

          {/* COMPARISON PERIOD */}

          {filters.compareEnabled && (
            <>
              <div className="min-w-[255px] xl:px-1">
                <div className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-[#85888D]">
                  Comparison period
                </div>

                <div className="flex h-[48px] items-center rounded-[10px] border border-[#E8E0DB] bg-white p-[4px]">

                  <button
                    type="button"
                    onClick={() => {
                      const previous =
                        previousPeriodOf(
                          filters.startDate,
                          filters.endDate
                        );

                      onChange({
                        ...filters,
                        compareMode:
                          'previous',
                        compareStartDate:
                          previous.startDate,
                        compareEndDate:
                          previous.endDate,
                      });
                    }}
                    className={`h-[40px] flex-1 rounded-[8px] px-3 text-[12px] font-medium transition ${
                      filters.compareMode ===
                      'previous'
                        ? 'bg-[#FFF0E8] text-[#E96A2C]'
                        : 'text-[#85888D] hover:text-[#E96A2C]'
                    }`}
                  >
                    Previous period
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      onChange({
                        ...filters,
                        compareMode:
                          'custom',
                      })
                    }
                    className={`h-[40px] flex-1 rounded-[8px] px-3 text-[12px] font-medium transition ${
                      filters.compareMode ===
                      'custom'
                        ? 'bg-[#FFF0E8] text-[#E96A2C]'
                        : 'text-[#85888D] hover:text-[#E96A2C]'
                    }`}
                  >
                    Custom range
                  </button>
                </div>
              </div>

              {/* COMPARE DATES */}

              <div className="min-w-0 flex-1 xl:border-l xl:border-[#F0E5DF] xl:pl-7">
                <div className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-[#85888D]">
                  Compare dates
                </div>

                <DateRangePicker
                  startDate={
                    filters.compareStartDate
                  }
                  endDate={
                    filters.compareEndDate
                  }
                  startLabel="Compare start"
                  endLabel="Compare end"
                  showLabels={false}
                  showDuration
                  align="right"
                  onChange={(
                    compareStartDate,
                    compareEndDate
                  ) =>
                    onChange({
                      ...filters,
                      compareMode:
                        'custom',
                      compareStartDate,
                      compareEndDate,
                    })
                  }
                  onOpen={() =>
                    setRestaurantOpen(
                      false
                    )
                  }
                  closeSignal={
                    calendarCloseSignal
                  }
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* =======================================================
   SECTION TITLE
   ======================================================= */

function FilterSectionTitle({
  number,
  title,
}: {
  number: string;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-[25px] w-[25px] items-center justify-center rounded-[6px] bg-gradient-to-br from-[#F47A35] to-[#F36A21] text-[11px] font-bold text-white shadow-[0_3px_8px_rgba(243,106,33,0.18)]">
        {number}
      </span>

      <span className="text-[13px] font-bold uppercase tracking-[0.01em] text-[#3D4148]">
        {title}
      </span>
    </div>
  );
}

/* =======================================================
   RESTAURANT ICON
   ======================================================= */

function RestaurantIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      className="shrink-0 text-[#F36A21]"
    >
      <path
        d="M4 10.5L5.2 5.8C5.45 4.75 6.4 4 7.48 4H16.52C17.6 4 18.55 4.75 18.8 5.8L20 10.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />

      <path
        d="M3.5 10.5H20.5V12.5C20.5 13.88 19.38 15 18 15H6C4.62 15 3.5 13.88 3.5 12.5V10.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />

      <path
        d="M5 15V20"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />

      <path
        d="M19 15V20"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />

      <path
        d="M8 4V9"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />

      <path
        d="M16 4V9"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* =======================================================
   SEARCH ICON
   ======================================================= */

function SearchIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      className="shrink-0 text-[#666]"
    >
      <circle
        cx="11"
        cy="11"
        r="7"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="M16.5 16.5L21 21"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* =======================================================
   CHECK ICON
   ======================================================= */

function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M5 12L10 17L19 7"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* =======================================================
   CHEVRON DOWN
   ======================================================= */

function ChevronDown({
  rotated = false,
}: {
  rotated?: boolean;
}) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      className={`shrink-0 text-[#555] transition-transform ${
        rotated ? 'rotate-180' : ''
      }`}
    >
      <path
        d="M6 9L12 15L18 9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}