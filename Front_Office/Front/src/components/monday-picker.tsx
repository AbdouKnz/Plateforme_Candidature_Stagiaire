

import * as React from "react"
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { useOnClickOutside } from "@/hooks/use-on-click-outside"
import { useTranslation, useLocale } from "@/context/language-context"

interface MondayPickerProps {
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  min: string
  invalid?: boolean
}

const DAY_KEYS = ["calendar.mo", "calendar.tu", "calendar.we", "calendar.th", "calendar.fr", "calendar.sa", "calendar.su"]

function getNextMonday(minDate: Date): Date {
  const d = new Date(minDate)
  const day = d.getDay()
  const daysUntilMonday = day === 0 ? 1 : day === 1 ? 7 : 8 - day
  d.setDate(d.getDate() + daysUntilMonday)
  return d
}

function isWeekday(date: Date): boolean {
  const day = date.getDay()
  return day >= 1 && day <= 5
}

function formatDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function MondayPicker({
  value,
  onChange,
  onBlur,
  min,
  invalid,
}: MondayPickerProps) {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)
  const t = useTranslation()
  const { locale } = useLocale()
  const lang = locale === "fr" ? "fr-FR" : "en-US"
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const minDate = new Date(min)
  const initialMonday = getNextMonday(today)

  const [viewMonth, setViewMonth] = React.useState(() => initialMonday.getMonth())
  const [viewYear, setViewYear] = React.useState(() => initialMonday.getFullYear())

  useOnClickOutside(ref, () => {
    setOpen(false)
  })

  const selectedDate = value ? new Date(value) : null

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const firstDayOfWeek = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear((y) => y - 1)
    } else {
      setViewMonth((m) => m - 1)
    }
  }

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear((y) => y + 1)
    } else {
      setViewMonth((m) => m + 1)
    }
  }

  const canGoPrev = () => {
    const prevMonthDate = viewMonth === 0
      ? new Date(viewYear - 1, 11, 1)
      : new Date(viewYear, viewMonth - 1, 1)
    const nextMonday = getNextMonday(today)
    return prevMonthDate.getFullYear() > nextMonday.getFullYear() ||
      (prevMonthDate.getFullYear() === nextMonday.getFullYear() &&
        prevMonthDate.getMonth() >= nextMonday.getMonth())
  }

  type DayCell = { day: number; monday: Date; enabled: boolean } | null
  const days: DayCell[] = []
  for (let i = 0; i < firstDayOfWeek; i++) {
    days.push(null)
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(viewYear, viewMonth, d)
    const isMonday = date.getDay() === 1
    const isBeforeMin = date < minDate
    days.push({
      day: d,
      monday: date,
      enabled: isWeekday(date) && !isBeforeMin,
    })
  }

  const displayLabel = selectedDate
    ? selectedDate.toLocaleDateString(lang, {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : ""

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex h-10 w-full items-center gap-2 rounded-xl border bg-card px-3.5 py-2 text-sm transition-all",
          "hover:border-primary/40",
          open && "border-primary ring-1 ring-primary/20",
          invalid ? "border-destructive/60" : "border-border",
        )}
      >
        <CalendarIcon className="size-4 shrink-0 text-muted-foreground" />
        <span
          className={cn(
            "flex-1 text-left",
            !value && "text-muted-foreground",
          )}
        >
          {value ? displayLabel : t("mondayPicker.placeholder")}
        </span>
      </button>

      {open && (
        <div className="absolute z-50 mt-1.5 w-[280px] rounded-xl border border-border bg-card p-4 shadow-lg">
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={prevMonth}
              disabled={!canGoPrev()}
              className="flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted disabled:opacity-30"
            >
              <ChevronLeftIcon className="size-4" />
            </button>
            <span className="text-sm font-semibold text-foreground">
              {new Date(viewYear, viewMonth).toLocaleDateString(lang, {
                month: "long",
                year: "numeric",
              })}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted"
            >
              <ChevronRightIcon className="size-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-0.5 text-center text-xs">
            {DAY_KEYS.map((key) => (
              <div
                key={key}
                className="py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
              >
                {t(key)}
              </div>
            ))}
            {days.map((cell, i) => {
              if (!cell) {
                return <div key={`empty-${i}`} />
              }
              const enabled = cell.enabled
              const isSelected = selectedDate && isSameDay(cell.monday, selectedDate)
              return (
                <button
                  key={cell.day}
                  type="button"
                  disabled={!enabled}
                  onClick={() => {
                    if (enabled) {
                      onChange(formatDate(cell.monday))
                      setOpen(false)
                    }
                  }}
                  className={cn(
                    "flex items-center justify-center rounded-lg py-1.5 text-sm transition-all",
                    enabled
                      ? "cursor-pointer text-foreground hover:bg-primary/[0.08] hover:text-primary"
                      : "cursor-not-allowed text-muted-foreground/30",
                    isSelected && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                  )}
                >
                  {cell.day}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
