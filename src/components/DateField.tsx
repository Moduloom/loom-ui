import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { type KeyboardEvent, useEffect, useMemo, useState } from "react";
import { translateUiSource } from "../i18n";
import { cx } from "../utils/cn.js";
import { Button } from "./Button.js";
import { IconButton } from "./IconButton.js";
import { Popover } from "./Popover.js";

export type DateFieldProps = {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  min?: string;
  max?: string;
  disabled?: boolean;
  className?: string;
};

export function DateField({
  label,
  value,
  onValueChange,
  min,
  max,
  disabled,
  className,
}: DateFieldProps) {
  const [open, setOpen] = useState(false);
  const selectedDate = parsePlainDate(value);
  const today = startOfDay(new Date());
  const [visibleMonth, setVisibleMonth] = useState(() => monthStart(selectedDate ?? today));
  const locale = typeof document === "undefined" ? undefined : document.documentElement.lang;

  useEffect(() => {
    if (open) setVisibleMonth(monthStart(parsePlainDate(value) ?? startOfDay(new Date())));
  }, [open, value]);

  const days = useMemo(() => calendarDays(visibleMonth), [visibleMonth]);
  const monthLabel = new Intl.DateTimeFormat(locale, { year: "numeric", month: "long" }).format(
    visibleMonth,
  );
  const formattedValue = selectedDate
    ? new Intl.DateTimeFormat(locale, { year: "numeric", month: "2-digit", day: "2-digit" }).format(
        selectedDate,
      )
    : translateUiSource("选择日期");
  const previousMonth = addMonths(visibleMonth, -1);
  const nextMonth = addMonths(visibleMonth, 1);
  const previousDisabled = Boolean(min && formatPlainDate(monthEnd(previousMonth)) < min);
  const nextDisabled = Boolean(max && formatPlainDate(nextMonth) > max);
  const todayValue = formatPlainDate(today);
  const todayDisabled = Boolean((min && todayValue < min) || (max && todayValue > max));

  const focusDate = (event: KeyboardEvent<HTMLButtonElement>, date: Date) => {
    const keys: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -7,
      ArrowDown: 7,
    };
    const offset = keys[event.key];
    if (!offset) return;
    event.preventDefault();
    const target = addDays(date, offset);
    const targetValue = formatPlainDate(target);
    if ((min && targetValue < min) || (max && targetValue > max)) return;
    setVisibleMonth(monthStart(target));
    requestAnimationFrame(() => {
      const calendar = event.currentTarget.closest(".lui-date-picker");
      calendar?.querySelector<HTMLButtonElement>(`[data-date="${targetValue}"]`)?.focus();
    });
  };

  return (
    <div className={cx("lui-date-field", className)}>
      <span className="lui-date-field__label">{label}</span>
      <Popover
        open={open}
        onOpenChange={setOpen}
        label={label}
        align="end"
        contentSized
        anchorClassName="lui-date-field__anchor"
        className="lui-date-picker"
        trigger={
          <button
            type="button"
            className="lui-date-field__trigger"
            aria-label={label}
            disabled={disabled}
          >
            <span className={!selectedDate ? "is-placeholder" : undefined}>{formattedValue}</span>
            <CalendarDays aria-hidden="true" />
          </button>
        }
      >
        <div className="lui-date-picker__header">
          <IconButton
            label={translateUiSource("上个月")}
            size="small"
            disabled={previousDisabled}
            onClick={() => setVisibleMonth(previousMonth)}
          >
            <ChevronLeft aria-hidden="true" />
          </IconButton>
          <strong>{monthLabel}</strong>
          <IconButton
            label={translateUiSource("下个月")}
            size="small"
            disabled={nextDisabled}
            onClick={() => setVisibleMonth(nextMonth)}
          >
            <ChevronRight aria-hidden="true" />
          </IconButton>
        </div>
        <div className="lui-date-picker__weekdays" aria-hidden="true">
          {weekdayLabels(locale).map((weekday) => (
            <span key={weekday}>{weekday}</span>
          ))}
        </div>
        {/* biome-ignore lint/a11y/useSemanticElements: interactive ARIA grid uses button cells */}
        <div className="lui-date-picker__days" role="grid" aria-label={monthLabel}>
          {days.map((date) => {
            const dateValue = formatPlainDate(date);
            const selected = dateValue === value;
            const isToday = dateValue === todayValue;
            const outsideMonth = date.getMonth() !== visibleMonth.getMonth();
            const unavailable = Boolean((min && dateValue < min) || (max && dateValue > max));
            return (
              // biome-ignore lint/a11y/useSemanticElements: button is the interactive grid cell
              <button
                key={dateValue}
                type="button"
                className={cx(
                  "lui-date-picker__day",
                  outsideMonth && "is-outside",
                  isToday && "is-today",
                  selected && "is-selected",
                )}
                role="gridcell"
                data-date={dateValue}
                data-lui-autofocus={selected || (!value && isToday) || undefined}
                aria-label={new Intl.DateTimeFormat(locale, { dateStyle: "full" }).format(date)}
                aria-selected={selected}
                disabled={unavailable}
                onKeyDown={(event) => focusDate(event, date)}
                onClick={() => {
                  onValueChange(dateValue);
                  setOpen(false);
                }}
              >
                {date.getDate()}
              </button>
            );
          })}
        </div>
        <footer className="lui-date-picker__footer">
          {value ? (
            <Button
              type="button"
              variant="ghost"
              size="small"
              onClick={() => {
                onValueChange("");
                setOpen(false);
              }}
            >
              {translateUiSource("清除日期")}
            </Button>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            size="small"
            disabled={todayDisabled}
            onClick={() => {
              onValueChange(todayValue);
              setOpen(false);
            }}
          >
            {translateUiSource("今天")}
          </Button>
        </footer>
      </Popover>
    </div>
  );
}

function parsePlainDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12);
  return formatPlainDate(date) === value ? date : null;
}

function formatPlainDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
}

function monthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1, 12);
}

function monthEnd(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 12);
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1, 12);
}

function addDays(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount, 12);
}

function calendarDays(month: Date) {
  const mondayOffset = (month.getDay() + 6) % 7;
  const first = addDays(month, -mondayOffset);
  return Array.from({ length: 42 }, (_, index) => addDays(first, index));
}

function weekdayLabels(locale?: string) {
  const monday = new Date(2026, 0, 5, 12);
  const formatter = new Intl.DateTimeFormat(locale, { weekday: "narrow" });
  return Array.from({ length: 7 }, (_, index) => formatter.format(addDays(monday, index)));
}
