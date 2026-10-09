import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip"
import { cn } from "@/lib/utils"

interface SubjectTechnology {
  id: string | number
  name: string
}

interface SubjectTechBadgesProps {
  technologies: SubjectTechnology[]
  /** How many chips stay visible before collapsing the rest behind +N. */
  visibleCount?: number
  /** Classes for each visible technology chip. */
  chipClassName?: string
  /** Classes for the +N overflow badge (the tooltip trigger). */
  moreClassName?: string
}

/**
 * Technology chips with an overflow badge. Hovering (or keyboard-focusing)
 * the +N badge opens a floating tooltip listing the hidden technologies.
 * The tooltip renders in a portal, so it is never clipped by the scrolling
 * card list / table containers. The trigger stops event propagation so
 * activating it never triggers the parent subject navigation.
 */
export function SubjectTechBadges({
  technologies,
  visibleCount = 5,
  chipClassName,
  moreClassName,
}: SubjectTechBadgesProps) {
  const visible = technologies.slice(0, visibleCount)
  const hidden = technologies.slice(visibleCount)

  return (
    <>
      {visible.map((t) => (
        <span key={t.id} className={chipClassName}>
          {t.name}
        </span>
      ))}
      {hidden.length > 0 && (
        <TooltipPrimitive.Root>
          <TooltipPrimitive.Trigger
            render={
              <span
                className={cn(
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D7CC7]",
                  moreClassName
                )}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") e.stopPropagation()
                }}
              />
            }
          >
            +{hidden.length}
          </TooltipPrimitive.Trigger>
          <TooltipPrimitive.Portal>
            <TooltipPrimitive.Positioner sideOffset={8} className="z-50">
              <TooltipPrimitive.Popup className="max-h-56 min-w-36 max-w-64 overflow-y-auto rounded-xl border border-[#DCE3EA] bg-popover px-1.5 py-1.5 shadow-lg ring-1 ring-foreground/5">
                <ul className="flex flex-col">
                  {hidden.map((t) => (
                    <li
                      key={t.id}
                      className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm font-medium whitespace-nowrap text-popover-foreground"
                    >
                      <span className="size-1.5 shrink-0 rounded-full bg-[#1D7CC7]" />
                      {t.name}
                    </li>
                  ))}
                </ul>
              </TooltipPrimitive.Popup>
            </TooltipPrimitive.Positioner>
          </TooltipPrimitive.Portal>
        </TooltipPrimitive.Root>
      )}
    </>
  )
}
