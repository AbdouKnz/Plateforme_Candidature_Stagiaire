

import * as React from "react"
import { SearchIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import type { Internship } from "@/lib/application-schema"
import { useTranslation } from "@/context/language-context"

interface InternshipCardsProps {
  internships: readonly Internship[]
  selected: string[]
  onChange: (ids: string[]) => void
  invalid?: boolean
}

export function InternshipCards({
  internships,
  selected,
  onChange,
  invalid,
}: InternshipCardsProps) {
  const [search, setSearch] = React.useState("")
  const t = useTranslation()

  const filtered = React.useMemo(
    () =>
      internships.filter(
        (inv) =>
          t(inv.titleKey).toLowerCase().includes(search.toLowerCase()) ||
          t(inv.departmentKey).toLowerCase().includes(search.toLowerCase()) ||
          t(inv.descriptionKey).toLowerCase().includes(search.toLowerCase()),
      ),
    [internships, search, t],
  )

  const toggle = (id: string) => {
    onChange(
      selected.includes(id)
        ? selected.filter((s) => s !== id)
        : [...selected, id],
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={t("internshipCards.search")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-10 pl-9 text-sm"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {filtered.map((internship) => {
          const isSelected = selected.includes(internship.id)
          return (
            <button
              key={internship.id}
              type="button"
              onClick={() => toggle(internship.id)}
              className={cn(
                "group relative flex items-start gap-3 rounded-xl border p-4 text-left transition-all duration-200",
                "hover:border-primary/40 hover:bg-primary/[0.02]",
                isSelected
                  ? "border-primary bg-primary/[0.03] ring-1 ring-primary/20"
                  : "border-border bg-card",
                invalid && !isSelected && "border-destructive/50",
              )}
            >
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => toggle(internship.id)}
                className="mt-0.5"
              />
              <div className="flex flex-col gap-0.5">
                <span
                  className={cn(
                    "text-sm font-semibold transition-colors",
                    isSelected ? "text-primary" : "text-foreground",
                  )}
                >
                  {t(internship.titleKey)}
                </span>
                <span className="text-xs font-medium text-muted-foreground">
                  {t(internship.departmentKey)}
                </span>
                <span className="mt-0.5 text-xs leading-relaxed text-muted-foreground/70">
                  {t(internship.descriptionKey)}
                </span>
              </div>
            </button>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {t("internshipCards.noResults")}
        </p>
      )}
    </div>
  )
}
