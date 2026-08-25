'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  formatDisplayDate,
  parseISODate,
  rangeDurationDays,
  toISODate,
} from '@/lib/dateRange';

interface Props {
  startDate: string;
  endDate: string;
  startLabel?: string;
  endLabel?: string;
  onChange: (startDate: string, endDate: string) => void;
  onOpen?: () => void;
  closeSignal?: number;
  align?: 'left' | 'right';
  showDuration?: boolean;
  showLabels?: boolean;
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

export default function DateRangePicker({
  startDate: startValue,
  endDate: endValue,
  startLabel = 'Start date',
  endLabel = 'End date',
  onChange,
  onOpen,
  closeSignal,
  align = 'left',
  showDuration = true,
  showLabels = true,
}: Props) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarTarget, setCalendarTarget] =
    useState<CalendarTarget>('start');

  const calendarRef = useRef<HTMLDivElement>(null);

  const [calendarMonth, setCalendarMonth] = useState(() => {
    return (
      parseISODate(startValue) ||
      parseISODate(endValue) ||
      new Date()
    );
  });

  useEffect(() => {
    if (closeSignal === undefined) return;

    setCalendarOpen(false);
  }, [closeSignal]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        calendarRef.current &&
        !calendarRef.current.contains(target)
      ) {
        setCalendarOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const openCalendar = (target: CalendarTarget) => {
    setCalendarTarget(target);

    const selected =
      target === 'start'
        ? parseISODate(startValue)
        : parseISODate(endValue);

    setCalendarMonth(
      selected ||
        parseISODate(startValue) ||
        parseISODate(endValue) ||
        new Date()
    );

    setCalendarOpen(true);
    onOpen?.();
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
      const end = parseISODate(endValue);

      if (end && isAfterDay(date, end)) {
        onChange(value, value);
      } else {
        onChange(value, endValue);
      }

      setCalendarTarget('end');
      setCalendarMonth(date);
      return;
    }

    const start = parseISODate(startValue);

    if (start && isBeforeDay(date, start)) {
      onChange(value, value);
    } else {
      onChange(startValue, value);
    }

    setCalendarOpen(false);
  };

  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const mondayIndex = (firstDay.getDay() + 6) % 7;

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
        date: new Date(year, month + 1, nextDay++),
        currentMonth: false,
      });
    }

    return result;
  }, [calendarMonth]);

  const startDate = parseISODate(startValue);
  const endDate = parseISODate(endValue);
  const duration = rangeDurationDays(startValue, endValue);

  return (
    <div
      ref={calendarRef}
      className="relative flex items-end gap-2"
    >
      {/* START DATE */}
      <div>
        {showLabels && (
          <label className="mb-1.5 block text-2xs font-semibold uppercase tracking-wide text-ink/40">
            {startLabel}
          </label>
        )}

        <button
          type="button"
          onClick={() => openCalendar('start')}
          className={`flex h-[50px] min-w-[145px] items-center justify-between gap-3 rounded-[11px] border border-[#E9E3DF] bg-white px-3.5 text-left transition hover:border-[#DCD3CD] ${
            calendarOpen && calendarTarget === 'start'
              ? 'border-[#F36A21] ring-2 ring-[#F36A21]/10'
              : ''
          }`}
        >
          <span className="text-[13px] font-medium text-[#172033]">
            {formatDisplayDate(startValue)}
          </span>

          <CalendarIcon />
        </button>
      </div>

      {/* DASH */}
      <span
        className={`shrink-0 text-[15px] text-[#AAA39E] ${
          showLabels ? 'pb-3' : ''
        }`}
      >
        –
      </span>

      {/* END DATE */}
      <div>
        {showLabels && (
          <label className="mb-1.5 block text-2xs font-semibold uppercase tracking-wide text-ink/40">
            {endLabel}
          </label>
        )}

        <button
          type="button"
          onClick={() => openCalendar('end')}
          className={`flex h-[50px] min-w-[145px] items-center justify-between gap-3 rounded-[11px] border border-[#E9E3DF] bg-white px-3.5 text-left transition hover:border-[#DCD3CD] ${
            calendarOpen && calendarTarget === 'end'
              ? 'border-[#F36A21] ring-2 ring-[#F36A21]/10'
              : ''
          }`}
        >
          <span className="text-[13px] font-medium text-[#172033]">
            {formatDisplayDate(endValue)}
          </span>

          <CalendarIcon />
        </button>
      </div>

      {/* DURATION */}
      {showDuration && duration > 0 && (
        <span
          className={`shrink-0 rounded-full border border-[#F4DED2] bg-[#FFF7F2] px-2.5 py-1.5 text-[11px] font-semibold tabular-nums text-[#F36A21] ${
            showLabels ? 'mb-1' : ''
          }`}
        >
          {duration}d
        </span>
      )}

      {/* CALENDAR */}
      {calendarOpen && (
        <div
          className={`absolute top-[calc(100%+9px)] z-[200] w-[320px] overflow-hidden rounded-[18px] border border-[#ECE7E3] bg-white shadow-[0_18px_50px_rgba(25,20,15,0.16)] ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {/* MONTH HEADER */}
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

          {/* WEEKDAYS */}
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

          {/* DAYS */}
          <div className="grid grid-cols-7 px-4 pb-4">
            {calendarDays.map(
              ({ date, currentMonth }, index) => {
                const selectedStart = isSameDay(
                  date,
                  startDate
                );

                const selectedEnd = isSameDay(
                  date,
                  endDate
                );

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
                    {rangeMiddle && (
                      <span className="absolute inset-y-1 left-0 right-0 bg-[#FFF1E8]" />
                    )}

                    {selectedStart &&
                      endDate &&
                      !isSameDay(
                        startDate,
                        endDate
                      ) && (
                        <span className="absolute inset-y-1 left-1/2 right-0 bg-[#FFF1E8]" />
                      )}

                    {selectedEnd &&
                      startDate &&
                      !isSameDay(
                        startDate,
                        endDate
                      ) && (
                        <span className="absolute inset-y-1 left-0 right-1/2 bg-[#FFF1E8]" />
                      )}

                    {selectedStart || selectedEnd ? (
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

          {/* FOOTER */}
          <div className="flex items-center justify-between border-t border-[#F0EBE7] bg-[#FCFBFA] px-5 py-3">
            <button
              type="button"
              onClick={() => {
                const today = new Date();
                const value = toISODate(today);

                onChange(value, value);
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
  );
}

function CalendarIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      className="shrink-0 text-[#303030]"
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