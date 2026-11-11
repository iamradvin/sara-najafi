"use client";

import { useId, useRef, useState } from "react";
import {
  formatPersianNumber,
  getJalaliMonthDays,
  getJalaliMonthWeekday,
  jalaliDateFromLocalDate,
  jalaliMonthName,
  jalaliToLocalDate,
  persianWeekdays,
} from "@/lib/persian-calendar";

type Props = Readonly<{
  value: string;
  onChange: (value: string) => void;
}>;

function getMonthAfter(year: number, month: number, delta: number) {
  let nextYear = year;
  let nextMonth = month + delta;
  while (nextMonth < 1) {
    nextYear -= 1;
    nextMonth += 12;
  }
  while (nextMonth > 12) {
    nextYear += 1;
    nextMonth -= 12;
  }
  return { year: nextYear, month: nextMonth };
}

function selectedDateParts(value: string) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return { ...jalaliDateFromLocalDate(date), hour: date.getHours(), minute: date.getMinutes() };
}

export function PersianDateTimePicker({ value, onChange }: Props) {
  const pickerId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const selected = selectedDateParts(value);
  const today = jalaliDateFromLocalDate(new Date());
  const [open, setOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState({ year: today.year, month: today.month });

  function showCalendar() {
    setVisibleMonth(selected ?? today);
    setOpen(true);
  }

  function selectDate(year: number, month: number, day: number) {
    const date = jalaliToLocalDate(year, month, day, selected?.hour ?? 23, selected?.minute ?? 59);
    onChange(date.toISOString());
  }

  function changeMonth(delta: number) {
    const next = getMonthAfter(visibleMonth.year, visibleMonth.month, delta);
    setVisibleMonth({ year: next.year, month: next.month });
  }

  function clearDate() {
    onChange("");
    setOpen(false);
    triggerRef.current?.focus();
  }

  const leadingDays = getJalaliMonthWeekday(visibleMonth.year, visibleMonth.month);
  const daysInMonth = getJalaliMonthDays(visibleMonth.year, visibleMonth.month);

  return (
    <div className="persian-date-picker">
      <div className="persian-date-picker__fields">
        <button
          aria-controls={pickerId}
          aria-expanded={open}
          aria-haspopup="dialog"
          className="persian-date-picker__trigger"
          onClick={showCalendar}
          ref={triggerRef}
          type="button"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M16 3v4M8 3v4M3 10h18" />
          </svg>
          <span>{selected ? `${formatPersianNumber(selected.day)} ${jalaliMonthName(selected.month)} ${formatPersianNumber(selected.year)}` : "انتخاب تاریخ شمسی"}</span>
        </button>
        <input
          aria-label="ساعت انقضای دسترسی"
          className="persian-date-picker__time"
          disabled={!selected}
          dir="ltr"
          onChange={(event) => {
            if (!selected || !event.target.value) return;
            const [hour, minute] = event.target.value.split(":").map(Number);
            onChange(jalaliToLocalDate(selected.year, selected.month, selected.day, hour, minute).toISOString());
          }}
          type="time"
          value={selected ? `${String(selected.hour).padStart(2, "0")}:${String(selected.minute).padStart(2, "0")}` : ""}
        />
      </div>
      {selected && <small className="persian-date-picker__hint">زمان به وقت محلی · پیش‌فرض پایان روز</small>}
      {open && (
        <div
          aria-label="انتخاب تاریخ شمسی"
          className="persian-calendar"
          id={pickerId}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setOpen(false);
              triggerRef.current?.focus();
            }
          }}
          role="dialog"
        >
          <div className="persian-calendar__header">
            <button aria-label="ماه قبل" className="persian-calendar__nav" onClick={() => changeMonth(-1)} type="button">←</button>
            <strong>{jalaliMonthName(visibleMonth.month)} {formatPersianNumber(visibleMonth.year)}</strong>
            <button aria-label="ماه بعد" className="persian-calendar__nav" onClick={() => changeMonth(1)} type="button">→</button>
          </div>
          <div className="persian-calendar__grid" aria-label={`${jalaliMonthName(visibleMonth.month)} ${formatPersianNumber(visibleMonth.year)}`}>
            {persianWeekdays.map((weekday) => (
              <span aria-label={weekday} className="persian-calendar__weekday" key={weekday}>{weekday.slice(0, 1)}</span>
            ))}
            {Array.from({ length: leadingDays }, (_, index) => (
              <span aria-hidden="true" className="persian-calendar__blank" key={`blank-${index}`} />
            ))}
            {Array.from({ length: daysInMonth }, (_, index) => {
              const day = index + 1;
              const isSelected = selected?.year === visibleMonth.year
                && selected.month === visibleMonth.month
                && selected.day === day;
              const isToday = today.year === visibleMonth.year
                && today.month === visibleMonth.month
                && today.day === day;
              return (
                <button
                  aria-current={isToday ? "date" : undefined}
                  aria-label={`${formatPersianNumber(day)} ${jalaliMonthName(visibleMonth.month)} ${formatPersianNumber(visibleMonth.year)}`}
                  aria-pressed={isSelected}
                  className={`persian-calendar__day${isSelected ? " is-selected" : ""}${isToday ? " is-today" : ""}`}
                  key={day}
                  onClick={() => selectDate(visibleMonth.year, visibleMonth.month, day)}
                  type="button"
                >
                  {formatPersianNumber(day)}
                </button>
              );
            })}
          </div>
          <div className="persian-calendar__footer">
            <button className="text-link" onClick={() => selectDate(today.year, today.month, today.day)} type="button">امروز</button>
            <button className="text-link" onClick={clearDate} type="button">پاک‌کردن تاریخ</button>
            <button className="text-link" onClick={() => { setOpen(false); triggerRef.current?.focus(); }} type="button">بستن</button>
          </div>
        </div>
      )}
    </div>
  );
}
