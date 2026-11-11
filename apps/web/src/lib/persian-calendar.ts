export type JalaliDate = Readonly<{ year: number; month: number; day: number }>;

const persianDateFormatter = new Intl.DateTimeFormat("en-US-u-ca-persian-nu-latn", {
  year: "numeric",
  month: "numeric",
  day: "numeric",
  timeZone: "UTC",
});
const jalaliYears = new Map<number, Map<string, Readonly<{ year: number; month: number; day: number }>>>();
const persianNumber = new Intl.NumberFormat("fa-IR", { useGrouping: false });
const monthNames = [
  "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند",
];
export const persianWeekdays = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"];

function getPersianParts(date: Date): JalaliDate {
  const parts = persianDateFormatter.formatToParts(date);
  return {
    year: Number(parts.find((part) => part.type === "year")?.value),
    month: Number(parts.find((part) => part.type === "month")?.value),
    day: Number(parts.find((part) => part.type === "day")?.value),
  };
}

function getYearMap(year: number) {
  const cached = jalaliYears.get(year);
  if (cached) return cached;

  const days = new Map<string, Readonly<{ year: number; month: number; day: number }>>();
  const gregorianYear = year + 621;
  const cursor = new Date(Date.UTC(gregorianYear, 0, 1));
  const end = Date.UTC(gregorianYear + 1, 3, 1);
  while (cursor.getTime() < end) {
    const gregorianDate = {
      year: cursor.getUTCFullYear(),
      month: cursor.getUTCMonth() + 1,
      day: cursor.getUTCDate(),
    };
    const jalali = getPersianParts(cursor);
    if (jalali.year === year) days.set(`${jalali.month}-${jalali.day}`, gregorianDate);
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  jalaliYears.set(year, days);
  if (jalaliYears.size > 4) {
    const oldestYear = jalaliYears.keys().next().value;
    if (oldestYear !== undefined) jalaliYears.delete(oldestYear);
  }
  return days;
}

export function jalaliDateFromLocalDate(date: Date): JalaliDate {
  return getPersianParts(new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())));
}

export function jalaliMonthName(month: number): string {
  return monthNames[month - 1] ?? "";
}

export function formatPersianNumber(value: number): string {
  return persianNumber.format(value);
}

export function getJalaliMonthDays(year: number, month: number): number {
  const days = getYearMap(year);
  let count = 0;
  while (days.has(`${month}-${count + 1}`)) count += 1;
  return count;
}

export function getJalaliMonthWeekday(year: number, month: number): number {
  const firstDay = getYearMap(year).get(`${month}-1`);
  if (!firstDay) throw new RangeError("Jalali month is outside the supported calendar range.");
  return (new Date(Date.UTC(firstDay.year, firstDay.month - 1, firstDay.day)).getUTCDay() + 1) % 7;
}

export function jalaliToLocalDate(year: number, month: number, day: number, hour: number, minute: number): Date {
  const gregorianDate = getYearMap(year).get(`${month}-${day}`);
  if (!gregorianDate) throw new RangeError("Jalali date is outside the supported calendar range.");
  return new Date(
    gregorianDate.year,
    gregorianDate.month - 1,
    gregorianDate.day,
    hour,
    minute,
  );
}

export function formatPersianDate(value: string): string {
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    dateStyle: "medium",
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  }).format(new Date(value));
}
