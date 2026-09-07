

import * as React from "react"
import { ChevronDownIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"
import { useOnClickOutside } from "@/hooks/use-on-click-outside"
import { useTranslation } from "@/context/language-context"

interface SubjectOption {
  id: string
  title: string
  department?: string
  description?: string
}

interface SubjectSelectProps {
  options: readonly SubjectOption[]
  selected: string[]
  onChange: (ids: string[]) => void
  fieldName?: string
  invalid?: boolean
}

export function SubjectSelect({
  options,
  selected,
  onChange,
  fieldName,
  invalid,
}: SubjectSelectProps) {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)
  const t = useTranslation()

  useOnClickOutside(ref, () => setOpen(false))

  const toggle = (id: string) => {
    const next = selected.includes(id) ? [] : [id]
    onChange(next)
    setOpen(false)
  }

  const getTitle = (id: string) => {
    const opt = options.find((o) => o.id === id)
    return opt?.title ?? id
  }

  const label =
    selected.length === 0
      ? t("subjectSelect.placeholder")
      : selected.length === 1
        ? getTitle(selected[0]) || t("subjectSelect.oneSelected")
        : t("subjectSelect.nSelected", { n: selected.length })

  return (
    <div ref={ref} data-field={fieldName} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex min-h-12 w-full items-center justify-between gap-3 rounded-2xl border-2 bg-gradient-to-br from-primary/[0.06] to-primary/[0.02] px-4 py-3 text-sm transition-all",
          "hover:border-primary/60 hover:shadow-md hover:shadow-primary/10 hover:-translate-y-0.5",
          open && "border-primary shadow-md shadow-primary/15 ring-2 ring-primary/20",
          invalid ? "border-destructive/60" : selected.length > 0 ? "border-primary/50 shadow-sm shadow-primary/10" : "border-primary/30 shadow-sm",
        )}
      >
        <span
          className={cn(
            "truncate font-semibold",
            selected.length === 0 ? "text-muted-foreground" : "text-foreground",
          )}
        >
          {label}
        </span>
        <ChevronDownIcon
          className={cn(
            "size-5 shrink-0 text-primary transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-full rounded-2xl border-2 border-primary/20 bg-card p-2 shadow-xl shadow-primary/10 max-h-72 overflow-y-auto">
          {options.map((option) => {
            const isSelected = selected.includes(option.id)
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => toggle(option.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition-all border",
                  "hover:bg-primary/[0.06] hover:border-primary/30",
                  isSelected ? "bg-primary/[0.08] border-primary/40 shadow-sm" : "border-transparent",
                )}
              >
                <Checkbox checked={isSelected} className="pointer-events-none shrink-0" />
                <span className={cn("font-semibold text-[15px] leading-tight flex-1", isSelected ? "text-primary" : "text-foreground")}>
                  {option.title}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
