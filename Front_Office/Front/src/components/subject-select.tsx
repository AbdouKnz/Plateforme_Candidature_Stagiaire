

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
  invalid?: boolean
}

export function SubjectSelect({
  options,
  selected,
  onChange,
  invalid,
}: SubjectSelectProps) {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)
  const t = useTranslation()

  useOnClickOutside(ref, () => setOpen(false))

  const toggle = (id: string) => {
    const next = selected.includes(id)
      ? selected.filter((s) => s !== id)
      : [...selected, id]
    onChange(next)
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
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-xl border bg-card px-3.5 py-2 text-sm transition-all",
          "hover:border-primary/40",
          open && "border-primary ring-1 ring-primary/20",
          invalid ? "border-destructive/60" : "border-border",
        )}
      >
        <span
          className={cn(
            selected.length === 0 ? "text-muted-foreground" : "text-foreground",
          )}
        >
          {label}
        </span>
        <ChevronDownIcon
          className={cn(
            "size-4 text-muted-foreground transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="absolute z-50 mt-1.5 w-full rounded-xl border border-border bg-card p-1.5 shadow-lg max-h-72 overflow-y-auto">
          {options.map((option) => {
            const isSelected = selected.includes(option.id)
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => toggle(option.id)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                  "hover:bg-primary/[0.04]",
                  isSelected && "bg-primary/[0.04]",
                )}
              >
                <Checkbox checked={isSelected} className="pointer-events-none shrink-0 mt-0.5" />
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="font-medium text-foreground text-sm leading-tight">
                    {option.title}
                  </span>
                  {option.description && (
                    <span className="line-clamp-2 text-xs text-muted-foreground leading-tight">
                      {option.description}
                    </span>
                  )}
                  {option.department && (
                    <span className="text-[11px] text-muted-foreground/70 leading-tight">
                      {option.department}
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
