import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

interface SectionHeaderProps {
  icon: LucideIcon
  step: string
  title: string
  description: string
  className?: string
}

export function SectionHeader({
  icon: Icon,
  step,
  title,
  description,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">
        {step}
      </span>
      <div className="flex items-center gap-3.5">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/[0.08] text-primary">
          <Icon className="size-5" />
        </div>
        <div>
          <h2 className="text-base font-bold leading-tight text-foreground">
            {title}
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
    </div>
  )
}
