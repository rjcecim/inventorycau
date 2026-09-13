export type CalendarDate = { y: number; m: number; d: number };

function isLeap(y: number) {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

function daysInMonth(y: number, m: number) {
  return [31, isLeap(y) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1]!;
}

export function makeCalendarDate(y: number, m: number, d: number): CalendarDate | null {
  if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) return null;
  if (m < 1 || m > 12 || d < 1 || d > daysInMonth(y, m)) return null;
  return { y, m, d };
}

export function parseIsoDate(value: string | null | undefined): CalendarDate | null {
  if (!value?.trim()) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  return makeCalendarDate(Number(match[1]), Number(match[2]), Number(match[3]));
}

/** DATE do Postgres / Date JS / CalendarDate → calendário via UTC, sem deslocar o dia. */
export function toCalendarDate(
  value: Date | string | CalendarDate | null | undefined,
): CalendarDate | null {
  if (value == null) return null;
  if (typeof value === "string") return parseIsoDate(value.slice(0, 10));
  if (typeof value === "object" && "y" in value && "m" in value && "d" in value) {
    return makeCalendarDate(value.y, value.m, value.d);
  }
  return makeCalendarDate(value.getUTCFullYear(), value.getUTCMonth() + 1, value.getUTCDate());
}

export function calendarToDbDate(date: CalendarDate): Date {
  return new Date(Date.UTC(date.y, date.m - 1, date.d));
}

export function calendarToIso(date: CalendarDate): string {
  return `${String(date.y).padStart(4, "0")}-${String(date.m).padStart(2, "0")}-${String(date.d).padStart(2, "0")}`;
}

export function formatCalendarDate(date: CalendarDate | null | undefined): string {
  if (!date) return "—";
  return `${String(date.d).padStart(2, "0")}/${String(date.m).padStart(2, "0")}/${date.y}`;
}

export function formatDbDate(value: Date | string | null | undefined): string {
  return formatCalendarDate(toCalendarDate(value));
}

export function todayCalendar(now = new Date()): CalendarDate {
  return { y: now.getFullYear(), m: now.getMonth() + 1, d: now.getDate() };
}

export function compareCalendar(a: CalendarDate, b: CalendarDate): number {
  if (a.y !== b.y) return a.y - b.y;
  if (a.m !== b.m) return a.m - b.m;
  return a.d - b.d;
}

export function addCalendarYears(date: CalendarDate, years: number): CalendarDate {
  const y = date.y + years;
  return { y, m: date.m, d: Math.min(date.d, daysInMonth(y, date.m)) };
}

export function toInputDate(value: Date | string | null | undefined): string {
  const date = toCalendarDate(value);
  return date ? calendarToIso(date) : "";
}

/** Diferença em dias de calendário (b - a). */
export function diffCalendarDays(a: CalendarDate, b: CalendarDate): number {
  const utcA = Date.UTC(a.y, a.m - 1, a.d);
  const utcB = Date.UTC(b.y, b.m - 1, b.d);
  return Math.round((utcB - utcA) / 86_400_000);
}

export function formatDaysLabel(days: number): string {
  const abs = Math.abs(days);
  const unit = abs === 1 ? "dia" : "dias";
  if (days > 0) return `${abs} ${unit} restantes`;
  if (days < 0) return `${abs} ${unit} desde o vencimento`;
  return "Vence hoje";
}

export function formatDaysModernization(days: number): string {
  const abs = Math.abs(days);
  const unit = abs === 1 ? "dia" : "dias";
  if (days > 0) return `${abs} ${unit} restantes`;
  if (days < 0) return `${abs} ${unit} excedidos`;
  return "Limite hoje";
}
