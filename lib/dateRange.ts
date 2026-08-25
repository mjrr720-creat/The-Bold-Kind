import { differenceInCalendarDays, format, subDays } from 'date-fns';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export type CompareMode = 'previous' | 'custom';

export function parseISODate(value: string): Date | null {
  if (!value || !ISO_DATE.test(value)) return null;

  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;

  return new Date(year, month - 1, day);
}

export function toISODate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function rangeDurationDays(start: string, end: string): number {
  const s = parseISODate(start);
  const e = parseISODate(end);
  if (!s || !e) return 0;
  return Math.max(1, differenceInCalendarDays(e, s) + 1);
}

export function previousPeriodOf(
  start: string,
  end: string
): { startDate: string; endDate: string } {
  const s = parseISODate(start);
  const days = rangeDurationDays(start, end);

  if (!s || !days) {
    return { startDate: start, endDate: end };
  }

  const prevEnd = subDays(s, 1);
  const prevStart = subDays(prevEnd, days - 1);

  return {
    startDate: toISODate(prevStart),
    endDate: toISODate(prevEnd),
  };
}

export function formatDisplayDate(value: string): string {
  const date = parseISODate(value);
  if (!date) return '';

  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const pad = (n: number) => String(n).padStart(2, '0');

  return `${pad(date.getDate())}-${months[date.getMonth()]}-${date.getFullYear()}`;
}

export function formatShortRange(start: string, end: string): string {
  const s = parseISODate(start);
  const e = parseISODate(end);
  if (!s || !e) return '';

  const sameYear = s.getFullYear() === e.getFullYear();
  const startFmt = format(s, sameYear ? 'MMM d' : 'MMM d, yyyy');
  const endFmt = format(e, 'MMM d, yyyy');

  return `${startFmt} – ${endFmt}`;
}

export function compareModeLabel(mode: CompareMode): string {
  return mode === 'custom' ? 'Custom period' : 'Previous period';
}
