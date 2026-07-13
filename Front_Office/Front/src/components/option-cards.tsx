

import * as React from "react"

import { cn } from "@/lib/utils"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

export interface Option {
  value: string
  title: string
  description?: string
}

interface OptionCardsProps {
  name: string
  value?: string
  onValueChange: (value: string) => void
  onBlur?: () => void
  options: Option[]
  invalid?: boolean
  columns?: 1 | 2 | 3
  ariaLabel?: string
}

export function OptionCards({
  name,
  value,
  onValueChange,
  onBlur,
  options,
  invalid,
  columns = 1,
  ariaLabel,
}: OptionCardsProps) {
  return (
    <RadioGroup
      aria-label={ariaLabel}
      value={value || undefined}
      onValueChange={(v) => onValueChange(v as string)}
      onBlur={onBlur}
      className={cn(
        "grid gap-3",
        columns === 2 && "sm:grid-cols-2",
        columns === 3 && "sm:grid-cols-3",
      )}
    >
      {options.map((option) => {
        const id = `${name}-${option.value}`
        const isSelected = value === option.value
        return (
          <label
            key={option.value}
            htmlFor={id}
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3.5 transition-all duration-200",
              "hover:border-primary/40 hover:bg-primary/[0.02]",
              isSelected
                ? "border-primary bg-primary/[0.03] ring-1 ring-primary/20"
                : "border-border bg-card",
              invalid && "border-destructive/50",
            )}
          >
            <RadioGroupItem
              value={option.value}
              id={id}
              aria-invalid={invalid}
            />
            <div className="flex flex-col gap-0.5">
              <span
                className={cn(
                  "text-sm font-semibold transition-colors",
                  isSelected ? "text-primary" : "text-foreground",
                )}
              >
                {option.title}
              </span>
              {option.description ? (
                <span className="text-xs text-muted-foreground">
                  {option.description}
                </span>
              ) : null}
            </div>
          </label>
        )
      })}
    </RadioGroup>
  )
}
