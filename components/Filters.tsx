'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { DashboardFilters } from '@/lib/types';
import { previousPeriodOf } from '@/lib/dateRange';
import DateRangePicker from '@/components/DateRangePicker';

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
  trailing,
}: Props) {
  const [restaurantOpen, setRestaurantOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [draftRestaurants, setDraftRestaurants] = useState<string[]>([]);
  const restaurantRef = useRef<HTMLDivElement>(null);
  const [calendarCloseSignal, setCalendarCloseSignal] = useState(0);

  const allRestaurants = useMemo(() => {
    return restaurants
      .map((restaurant) => restaurant.trim())
      .filter(Boolean);
  }, [restaurants]);

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

  const filteredRestaurants = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return allRestaurants;
    return allRestaurants.filter((restaurant) =>
      restaurant.toLowerCase().includes(query)
    );
  }, [allRestaurants, search]);

  const openRestaurants = () => {
    setDraftRestaurants([...committedRestaurants]);
    setSearch('');
    setRestaurantOpen(true);
    setCalendarCloseSignal((n) => n + 1);
  };

  const isAllSelected =
    allRestaurants.length > 0 &&
    draftRestaurants.length === allRestaurants.length &&
    allRestaurants.every((restaurant) =>
      draftRestaurants.includes(restaurant)
    );

  const toggleRestaurant = (restaurant: string) => {
    setDraftRestaurants((previous) => {
      const exists = previous.includes(restaurant);

      if (
        previous.length === allRestaurants.length &&
        allRestaurants.length > 1 &&
        exists
      ) {
        return [restaurant];
      }

      if (exists) {
        return previous.filter((item) => item !== restaurant);
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
      onChange({
        ...filters,
        restaurant: draftRestaurants.join('|'),
      });
    }

    setRestaurantOpen(false);
    setSearch('');
  };

  const displayText =
    committedRestaurants.length === allRestaurants.length &&
    allRestaurants.length > 0
      ? 'All restaurants'
      : committedRestaurants.length === 0
        ? 'All restaurants'
        : committedRestaurants.length === 1
          ? committedRestaurants[0]
          : `${committedRestaurants.length} restaurants selected`;

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
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const setCompareEnabled = (enabled: boolean) => {
    if (!enabled) {
      onChange({ ...filters, compareEnabled: false });
      return;
    }

    const previous = previousPeriodOf(filters.startDate, filters.endDate);
    onChange({
      ...filters,
      compareEnabled: true,
      compareMode:
        filters.compareMode === 'custom' ? 'custom' : 'previous',
      compareStartDate:
        filters.compareMode === 'custom'
          ? filters.compareStartDate || previous.startDate
          : previous.startDate,
      compareEndDate:
        filters.compareMode === 'custom'
          ? filters.compareEndDate || previous.endDate
          : previous.endDate,
    });
  };

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
        <div
          ref={restaurantRef}
          className="relative min-w-[280px] flex-1 sm:flex-none"
        >
          <label className="mb-1.5 block text-2xs font-semibold uppercase tracking-wide text-ink/40">
            Restaurant
          </label>

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

          {restaurantOpen && (
            <div className="absolute left-0 top-[calc(100%+8px)] z-[300] w-full min-w-[380px] overflow-hidden rounded-[16px] border border-[#E7E2DE] bg-white shadow-[0_18px_50px_rgba(25,20,15,0.16)]">
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
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search vendors..."
                    className="w-full border-0 bg-transparent text-[13px] text-[#172033] outline-none placeholder:text-[#999]"
                  />
                </div>
              </div>

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
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
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

              <div className="max-h-[330px] overflow-y-auto">
                {filteredRestaurants.length === 0 ? (
                  <div className="px-4 py-8 text-center text-[13px] text-[#999]">
                    No restaurants found
                  </div>
                ) : (
                  filteredRestaurants.map((restaurant) => {
                    const selected = draftRestaurants.includes(restaurant);

                    return (
                      <button
                        type="button"
                        key={restaurant}
                        onClick={() => toggleRestaurant(restaurant)}
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

        <DateRangePicker
          startDate={filters.startDate}
          endDate={filters.endDate}
          onChange={(startDate, endDate) =>
            onChange({ ...filters, startDate, endDate })
          }
          onOpen={() => setRestaurantOpen(false)}
          closeSignal={calendarCloseSignal}
        />

        {trailing}
      </div>

      <div className="flex flex-wrap items-end gap-x-4 gap-y-3 border-t border-[#F0EBE7] pt-3">
        <div>
          <label className="mb-1.5 block text-2xs font-semibold uppercase tracking-wide text-ink/40">
            Compare
          </label>
          <button
            type="button"
            role="switch"
            aria-checked={filters.compareEnabled}
            onClick={() => setCompareEnabled(!filters.compareEnabled)}
            className={`relative h-[32px] w-[56px] rounded-full transition ${
              filters.compareEnabled ? 'bg-[#F36A21]' : 'bg-[#E4DFDB]'
            }`}
          >
            <span
              className={`absolute top-[3px] h-[26px] w-[26px] rounded-full bg-white shadow-sm transition ${
                filters.compareEnabled ? 'left-[27px]' : 'left-[3px]'
              }`}
            />
          </button>
        </div>

        {filters.compareEnabled && (
          <>
            <div>
              <label className="mb-1.5 block text-2xs font-semibold uppercase tracking-wide text-ink/40">
                Comparison period
              </label>
              <div className="flex h-[38px] items-center rounded-[10px] border border-[#E7E2DE] bg-white p-[3px]">
                <button
                  type="button"
                  onClick={() => {
                    const previous = previousPeriodOf(
                      filters.startDate,
                      filters.endDate
                    );
                    onChange({
                      ...filters,
                      compareMode: 'previous',
                      compareStartDate: previous.startDate,
                      compareEndDate: previous.endDate,
                    });
                  }}
                  className={`h-[32px] rounded-[7px] px-3 text-[12px] font-medium transition ${
                    filters.compareMode === 'previous'
                      ? 'bg-[#FFF4EE] text-[#E96A2C]'
                      : 'text-[#85888D] hover:text-[#E96A2C]'
                  }`}
                >
                  Previous period
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onChange({ ...filters, compareMode: 'custom' })
                  }
                  className={`h-[32px] rounded-[7px] px-3 text-[12px] font-medium transition ${
                    filters.compareMode === 'custom'
                      ? 'bg-[#FFF4EE] text-[#E96A2C]'
                      : 'text-[#85888D] hover:text-[#E96A2C]'
                  }`}
                >
                  Custom range
                </button>
              </div>
            </div>

            <span className="hidden pb-2.5 text-[12px] font-semibold uppercase tracking-wide text-ink/30 sm:inline">
              vs
            </span>

            <DateRangePicker
              startDate={filters.compareStartDate}
              endDate={filters.compareEndDate}
              startLabel="Compare start"
              endLabel="Compare end"
              align="left"
              onChange={(compareStartDate, compareEndDate) =>
                onChange({
                  ...filters,
                  compareMode: 'custom',
                  compareStartDate,
                  compareEndDate,
                })
              }
              onOpen={() => setRestaurantOpen(false)}
              closeSignal={calendarCloseSignal}
            />
          </>
        )}
      </div>
    </div>
  );
}
