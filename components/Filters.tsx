'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { DashboardFilters } from '@/lib/types';

interface Props {
  filters: DashboardFilters;
  restaurants: string[];
  onChange: (filters: DashboardFilters) => void;
}

type CalendarTarget = 'start' | 'end';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const pad = (value: number) => String(value).padStart(2, '0');

const parseDate = (value: string) => {
  if (!value) return null;

  const [year, month, day] = value.split('-').map(Number);

  if (!year || !month || !day) return null;

  return new Date(year, month - 1, day);
};

const toISODate = (date: Date) => {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}`;
};

const formatDisplayDate = (value: string) => {
  const date = parseDate(value);

  if (!date) return '';

  return `${pad(date.getDate())}-${MONTHS[date.getMonth()].slice(
    0,
    3
  )}-${date.getFullYear()}`;
};

const isSameDay = (a: Date | null, b: Date | null) => {
  if (!a || !b) return false;

  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
};

const isBeforeDay = (a: Date, b: Date) => {
  const aa = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  const bb = new Date(b.getFullYear(), b.getMonth(), b.getDate());

  return aa.getTime() < bb.getTime();
};

const isAfterDay = (a: Date, b: Date) => {
  const aa = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  const bb = new Date(b.getFullYear(), b.getMonth(), b.getDate());

  return aa.getTime() > bb.getTime();
};

export default function Filters({
  filters,
  restaurants,
  onChange,
}: Props) {
  /* ============================================================
     RESTAURANT
  ============================================================ */

  const [restaurantOpen, setRestaurantOpen] = useState(false);
  const [search, setSearch] = useState('');

  const [draftRestaurants, setDraftRestaurants] = useState<string[]>(
    []
  );

  const restaurantRef = useRef<HTMLDivElement>(null);

  /* ============================================================
     CALENDAR
  ============================================================ */

  const [calendarOpen, setCalendarOpen] = useState(false);

  const [calendarTarget, setCalendarTarget] =
    useState<CalendarTarget>('start');

  const calendarRef = useRef<HTMLDivElement>(null);

  const [calendarMonth, setCalendarMonth] = useState(() => {
    return (
      parseDate(filters.startDate) ||
      parseDate(filters.endDate) ||
      new Date()
    );
  });

  /* ============================================================
     NORMALIZED RESTAURANT LIST
  ============================================================ */

  const allRestaurants = useMemo(() => {
    return restaurants
      .map((restaurant) => restaurant.trim())
      .filter(Boolean);
  }, [restaurants]);

  /* ============================================================
     COMMITTED RESTAURANTS
  ============================================================ */

  const committedRestaurants = useMemo(() => {
    if (!filters.restaurant || filters.restaurant === 'All') {
      return allRestaurants;
    }

    return filters.restaurant
  .split('|')
      .map((item) => item.trim())
      .filter(Boolean)
      .filter((item) => allRestaurants.includes(item));
  }, [filters.restaurant, allRestaurants]);

  /* ============================================================
     RESTAURANT SEARCH
  ============================================================ */

  const filteredRestaurants = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return allRestaurants;
    }

    return allRestaurants.filter((restaurant) =>
      restaurant.toLowerCase().includes(query)
    );
  }, [allRestaurants, search]);

  /* ============================================================
     OPEN RESTAURANT
  ============================================================ */

  const openRestaurants = () => {
    setDraftRestaurants([...committedRestaurants]);
    setSearch('');
    setRestaurantOpen(true);
    setCalendarOpen(false);
  };

  /* ============================================================
     RESTAURANT SELECTION
  ============================================================ */

  const isAllSelected =
    allRestaurants.length > 0 &&
    draftRestaurants.length === allRestaurants.length &&
    allRestaurants.every((restaurant) =>
      draftRestaurants.includes(restaurant)
    );

  const toggleRestaurant = (restaurant: string) => {
    setDraftRestaurants((previous) => {
      const exists = previous.includes(restaurant);

      /*
       * IMPORTANT:
       * If everything is currently selected and the user clicks
       * one restaurant, make that restaurant the ONLY selection.
       *
       * Example:
       * 205 selected -> click Restaurant A -> 1 selected
       */
      if (
        previous.length === allRestaurants.length &&
        allRestaurants.length > 1 &&
        exists
      ) {
        return [restaurant];
      }

      /*
       * Normal deselection.
       *
       * Example:
       * 4 selected -> click one -> 3 selected
       * 2 selected -> click one -> 1 selected
       */
      if (exists) {
        return previous.filter((item) => item !== restaurant);
      }

      /*
       * Add restaurant.
       *
       * Example:
       * 1 selected -> click another -> 2 selected
       */
      return [...previous, restaurant];
    });
  };

  const toggleAll = () => {
    setDraftRestaurants((previous) => {
      /*
       * If ALL are selected:
       * deselect EVERYTHING.
       */
      if (isAllSelected) {
        return [];
      }

      /*
       * Otherwise select EVERYTHING.
       */
      return [...allRestaurants];
    });
  };

  /* ============================================================
     APPLY RESTAURANT SELECTION
  ============================================================ */

  const applyRestaurantSelection = () => {
    /*
     * If nothing is selected, don't change the committed
     * dashboard filter. User can still select something again.
     */
    if (draftRestaurants.length === 0) {
      setRestaurantOpen(false);
      setSearch('');
      return;
    }

    /*
     * All restaurants selected.
     */
    if (
      draftRestaurants.length === allRestaurants.length &&
      allRestaurants.every((restaurant) =>
        draftRestaurants.includes(restaurant)
      )
    ) {
      onChange({
        ...filters,
        restaurant: 'All',
      });
    } else {
      /*
       * Multiple / single restaurants.
       */
      onChange({
        ...filters,
        restaurant: draftRestaurants.join('|'),
      });
    }

    setRestaurantOpen(false);
    setSearch('');
  };

  /* ============================================================
     DISPLAY TEXT
  ============================================================ */

  const displayText =
    committedRestaurants.length === allRestaurants.length &&
    allRestaurants.length > 0
      ? 'All restaurants'
      : committedRestaurants.length === 0
        ? 'All restaurants'
        : committedRestaurants.length === 1
          ? committedRestaurants[0]
          : `${committedRestaurants.length} restaurants selected`;

  /* ============================================================
     OUTSIDE CLICK
  ============================================================ */

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        restaurantRef.current &&
        !restaurantRef.current.contains(target)
      ) {
        setRestaurantOpen(false);
        setSearch('');
      }

      if (
        calendarRef.current &&
        !calendarRef.current.contains(target)
      ) {
        setCalendarOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener(
        'mousedown',
        handleClickOutside
      );
    };
  }, []);

  /* ============================================================
     CALENDAR
  ============================================================ */

  const openCalendar = (target: CalendarTarget) => {
    setCalendarTarget(target);

    const selected =
      target === 'start'
        ? parseDate(filters.startDate)
        : parseDate(filters.endDate);

    setCalendarMonth(
      selected ||
        parseDate(filters.startDate) ||
        parseDate(filters.endDate) ||
        new Date()
    );

    setCalendarOpen(true);
    setRestaurantOpen(false);
  };

  const previousMonth = () => {
    setCalendarMonth(
      new Date(
        calendarMonth.getFullYear(),
        calendarMonth.getMonth() - 1,
        1
      )
    );
  };

  const nextMonth = () => {
    setCalendarMonth(
      new Date(
        calendarMonth.getFullYear(),
        calendarMonth.getMonth() + 1,
        1
      )
    );
  };

  const selectDate = (date: Date) => {
    const value = toISODate(date);

    if (calendarTarget === 'start') {
      const end = parseDate(filters.endDate);

      if (end && isAfterDay(date, end)) {
        onChange({
          ...filters,
          startDate: value,
          endDate: value,
        });
      } else {
        onChange({
          ...filters,
          startDate: value,
        });
      }

      setCalendarTarget('end');
      setCalendarMonth(date);
      return;
    }

    const start = parseDate(filters.startDate);

    if (start && isBeforeDay(date, start)) {
      onChange({
        ...filters,
        startDate: value,
        endDate: value,
      });
    } else {
      onChange({
        ...filters,
        endDate: value,
      });
    }

    setCalendarOpen(false);
  };

  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();

    const firstDay = new Date(year, month, 1);

    const mondayIndex =
      (firstDay.getDay() + 6) % 7;

    const daysInMonth = new Date(
      year,
      month + 1,
      0
    ).getDate();

    const previousMonthDays = new Date(
      year,
      month,
      0
    ).getDate();

    const result: {
      date: Date;
      currentMonth: boolean;
    }[] = [];

    for (let i = mondayIndex - 1; i >= 0; i--) {
      result.push({
        date: new Date(
          year,
          month - 1,
          previousMonthDays - i
        ),
        currentMonth: false,
      });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      result.push({
        date: new Date(year, month, day),
        currentMonth: true,
      });
    }

    let nextDay = 1;

    while (result.length < 42) {
      result.push({
        date: new Date(
          year,
          month + 1,
          nextDay++
        ),
        currentMonth: false,
      });
    }

    return result;
  }, [calendarMonth]);

  const startDate = parseDate(filters.startDate);
  const endDate = parseDate(filters.endDate);

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <div className="flex flex-wrap items-end gap-x-6 gap-y-3">

      {/* ========================================================
          RESTAURANT
      ======================================================== */}

      <div
        ref={restaurantRef}
        className="relative min-w-[280px] flex-1 sm:flex-none"
      >
        <label className="mb-1.5 block text-2xs font-semibold uppercase tracking-wide text-ink/40">
          Restaurant
        </label>

        {/* Trigger */}

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
          className="control flex w-full items-center justify-between gap-3 bg-white text-left sm:min-w-[280px]"
        >
          <span className="truncate text-[13px] text-[#172033]">
            {displayText}
          </span>

          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            className={`shrink-0 text-[#555] transition-transform ${
              restaurantOpen ? 'rotate-180' : ''
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
        </button>

        {/* Dropdown */}

        {restaurantOpen && (
          <div className="absolute left-0 top-[calc(100%+8px)] z-[300] w-full min-w-[380px] overflow-hidden rounded-[16px] border border-[#E7E2DE] bg-white shadow-[0_18px_50px_rgba(25,20,15,0.16)]">

            {/* Search */}

            <div className="border-b border-[#ECE8E5] p-3">
              <div className="flex h-[42px] items-center gap-2 rounded-[10px] border border-[#E5E0DC] bg-white px-3 transition focus-within:border-[#F36A21] focus-within:ring-2 focus-within:ring-[#F36A21]/10">

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

            {/* Select All */}

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
                )}
              </span>

              <span className="text-[14px] font-semibold text-[#171717]">
                Select all
              </span>

              <span className="ml-auto rounded-full bg-[#FFF0E7] px-2 py-0.5 text-[11px] font-semibold text-[#F36A21]">
                {draftRestaurants.length}
              </span>
            </button>

            {/* Restaurant List */}

            <div className="max-h-[330px] overflow-y-auto">
              {filteredRestaurants.length === 0 ? (
                <div className="px-4 py-8 text-center text-[13px] text-[#999]">
                  No restaurants found
                </div>
              ) : (
                filteredRestaurants.map((restaurant) => {
                  const selected =
                    draftRestaurants.includes(restaurant);

                  return (
                    <button
                      type="button"
                      key={restaurant}
                      onClick={() =>
                        toggleRestaurant(restaurant)
                      }
                      className="flex w-full items-center gap-3 border-b border-[#F0EEEC] px-4 py-3 text-left transition hover:bg-[#FFF9F5]"
                    >

                      {/* Checkbox */}

                      <span
                        className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[7px] border transition ${
                          selected
                            ? 'border-[#F36A21] bg-[#F36A21] shadow-[0_2px_6px_rgba(243,106,33,0.22)]'
                            : 'border-[#C8C4C1] bg-white'
                        }`}
                      >
                        {selected && (
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
                        )}
                      </span>

                      {/* Restaurant */}

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
                })
              )}
            </div>

            {/* Footer */}

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
                onClick={applyRestaurantSelection}
                disabled={draftRestaurants.length === 0}
                className="rounded-[8px] bg-[#F36A21] px-4 py-2 text-[12px] font-semibold text-white shadow-[0_3px_8px_rgba(243,106,33,0.20)] transition hover:bg-[#E65D16] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================
          DATE RANGE
      ======================================================== */}

      <div
        ref={calendarRef}
        className="relative flex items-end gap-2"
      >

        {/* START DATE */}

        <div>
          <label className="mb-1.5 block text-2xs font-semibold uppercase tracking-wide text-ink/40">
            Start date
          </label>

          <button
            type="button"
            onClick={() => openCalendar('start')}
            className={`control flex min-w-[145px] items-center justify-between gap-3 bg-white text-left ${
              calendarOpen &&
              calendarTarget === 'start'
                ? 'border-[#F36A21] ring-2 ring-[#F36A21]/10'
                : ''
            }`}
          >
            <span className="text-[13px] text-[#172033]">
              {formatDisplayDate(filters.startDate)}
            </span>

            <CalendarIcon />
          </button>
        </div>

        <span className="pb-2.5 text-sm text-ink/25">
          –
        </span>

        {/* END DATE */}

        <div>
          <label className="mb-1.5 block text-2xs font-semibold uppercase tracking-wide text-ink/40">
            End date
          </label>

          <button
            type="button"
            onClick={() => openCalendar('end')}
            className={`control flex min-w-[145px] items-center justify-between gap-3 bg-white text-left ${
              calendarOpen &&
              calendarTarget === 'end'
                ? 'border-[#F36A21] ring-2 ring-[#F36A21]/10'
                : ''
            }`}
          >
            <span className="text-[13px] text-[#172033]">
              {formatDisplayDate(filters.endDate)}
            </span>

            <CalendarIcon />
          </button>
        </div>

        {/* ======================================================
            PREMIUM CALENDAR
        ====================================================== */}

        {calendarOpen && (
          <div className="absolute left-0 top-[calc(100%+9px)] z-[200] w-[320px] overflow-hidden rounded-[18px] border border-[#ECE7E3] bg-white shadow-[0_18px_50px_rgba(25,20,15,0.16)]">

            {/* Header */}

            <div className="flex items-center justify-between border-b border-[#F0EBE7] px-5 py-4">

              <button
                type="button"
                onClick={previousMonth}
                className="flex h-8 w-8 items-center justify-center rounded-full text-[#24201D] transition hover:bg-[#FFF3EC]"
              >
                <ChevronLeft />
              </button>

              <div className="text-[16px] font-semibold text-[#171717]">
                {MONTHS[calendarMonth.getMonth()]}{' '}
                {calendarMonth.getFullYear()}
              </div>

              <button
                type="button"
                onClick={nextMonth}
                className="flex h-8 w-8 items-center justify-center rounded-full text-[#24201D] transition hover:bg-[#FFF3EC]"
              >
                <ChevronRight />
              </button>

            </div>

            {/* Weekdays */}

            <div className="grid grid-cols-7 px-4 pt-4">
              {WEEKDAYS.map((day, index) => (
                <div
                  key={`${day}-${index}`}
                  className="flex h-8 items-center justify-center text-[11px] font-semibold text-[#8B8580]"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Days */}

            <div className="grid grid-cols-7 px-4 pb-4">
              {calendarDays.map(
                ({ date, currentMonth }, index) => {
                  const selectedStart =
                    isSameDay(date, startDate);

                  const selectedEnd =
                    isSameDay(date, endDate);

                  const inRange =
                    startDate &&
                    endDate &&
                    !isBeforeDay(date, startDate) &&
                    !isAfterDay(date, endDate);

                  const rangeMiddle =
                    inRange &&
                    !selectedStart &&
                    !selectedEnd;

                  const disabled =
                    calendarTarget === 'end' &&
                    !!startDate &&
                    isBeforeDay(date, startDate);

                  return (
                    <button
                      key={`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${index}`}
                      type="button"
                      disabled={disabled}
                      onClick={() => selectDate(date)}
                      className="relative flex h-[40px] items-center justify-center"
                    >

                      {/* Range */}

                      {rangeMiddle && (
                        <span className="absolute inset-y-1 left-0 right-0 bg-[#FFF1E8]" />
                      )}

                      {selectedStart &&
                        endDate &&
                        !isSameDay(startDate, endDate) && (
                          <span className="absolute inset-y-1 left-1/2 right-0 bg-[#FFF1E8]" />
                        )}

                      {selectedEnd &&
                        startDate &&
                        !isSameDay(startDate, endDate) && (
                          <span className="absolute inset-y-1 left-0 right-1/2 bg-[#FFF1E8]" />
                        )}

                      {/* Selected */}

                      {(selectedStart || selectedEnd) ? (
                        <span className="relative z-10 flex h-[32px] w-[32px] items-center justify-center rounded-full bg-[#F36A21] text-[12px] font-semibold text-white shadow-[0_3px_8px_rgba(243,106,33,0.25)]">
                          {date.getDate()}
                        </span>
                      ) : (
                        <span
                          className={`relative z-10 flex h-[32px] w-[32px] items-center justify-center rounded-full text-[12px] font-medium transition ${
                            disabled
                              ? 'cursor-not-allowed text-[#D8D4D1]'
                              : currentMonth
                                ? 'text-[#25211F] hover:bg-[#FFF1E8]'
                                : 'text-[#BDB8B4]'
                          }`}
                        >
                          {date.getDate()}
                        </span>
                      )}
                    </button>
                  );
                }
              )}
            </div>

            {/* Footer */}

            <div className="flex items-center justify-between border-t border-[#F0EBE7] bg-[#FCFBFA] px-5 py-3">

              <button
                type="button"
                onClick={() => {
                  const today = new Date();
                  const value = toISODate(today);

                  onChange({
                    ...filters,
                    startDate: value,
                    endDate: value,
                  });

                  setCalendarMonth(today);
                }}
                className="text-[12px] font-medium text-[#7C7672] hover:text-[#F36A21]"
              >
                Today
              </button>

              <button
                type="button"
                onClick={() => setCalendarOpen(false)}
                className="text-[12px] font-semibold text-[#F36A21] hover:text-[#D95413]"
              >
                Done
              </button>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ================================================================
   ICONS
================================================================ */

function CalendarIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      className="text-[#303030]"
    >
      <rect
        x="3.5"
        y="5"
        width="17"
        height="15"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M7 3.5V7"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />

      <path
        d="M17 3.5V7"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />

      <path
        d="M3.5 9.5H20.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function ChevronLeft() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M15 18L9 12L15 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M9 18L15 12L9 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
