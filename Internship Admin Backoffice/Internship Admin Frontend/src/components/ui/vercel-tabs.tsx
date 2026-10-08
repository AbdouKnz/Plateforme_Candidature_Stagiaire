"use client"

import * as React from "react"
import { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"

interface Tab {
  id: string
  label: string
  icon?: React.ReactNode
  badge?: React.ReactNode
}

interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  tabs: Tab[]
  activeTab?: string
  onTabChange?: (tabId: string) => void
  /** Stretch tabs to fill the full row width. */
  fill?: boolean
  /** Slightly larger tabs. */
  large?: boolean
}

const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(
  ({ className, tabs, activeTab, onTabChange, fill, large, ...props }, ref) => {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
    const [activeIndex, setActiveIndex] = useState(() => {
      if (activeTab === undefined) return 0
      const idx = tabs.findIndex((tab) => tab.id === activeTab)
      return idx >= 0 ? idx : 0
    })
    const [hoverStyle, setHoverStyle] = useState<React.CSSProperties>({})
    const [activeStyle, setActiveStyle] = useState<React.CSSProperties>({ left: "0px", width: "0px" })
    const tabRefs = useRef<(HTMLDivElement | null)[]>([])

    // Keep the indicator in sync when the parent controls the active tab
    // (e.g. route changes or translated labels changing widths).
    useEffect(() => {
      if (activeTab === undefined) return
      const idx = tabs.findIndex((tab) => tab.id === activeTab)
      if (idx >= 0) setActiveIndex(idx)
    }, [activeTab, tabs])

    useEffect(() => {
      if (hoveredIndex !== null) {
        const hoveredElement = tabRefs.current[hoveredIndex]
        if (hoveredElement) {
          const { offsetLeft, offsetWidth } = hoveredElement
          setHoverStyle({
            left: `${offsetLeft}px`,
            width: `${offsetWidth}px`,
          })
        }
      }
    }, [hoveredIndex])

    useEffect(() => {
      const update = () => {
        const activeElement = tabRefs.current[activeIndex]
        if (activeElement) {
          const { offsetLeft, offsetWidth } = activeElement
          setActiveStyle({
            left: `${offsetLeft}px`,
            width: `${offsetWidth}px`,
          })
        }
      }
      const raf = requestAnimationFrame(update)
      window.addEventListener("resize", update)
      return () => {
        cancelAnimationFrame(raf)
        window.removeEventListener("resize", update)
      }
    }, [activeIndex, tabs])

    return (
      <div
        ref={ref}
        className={cn("relative", className)}
        {...props}
      >
        <div className="relative">
          {/* Hover Highlight */}
          <div
            className={cn(
              "absolute transition-all duration-300 ease-out bg-[#0e0f1114] dark:bg-[#ffffff1a] rounded-[6px] flex items-center",
              large ? "h-10" : "h-[30px]"
            )}
            style={{
              ...hoverStyle,
              opacity: hoveredIndex !== null ? 1 : 0,
            }}
          />

          {/* Active Indicator */}
          <div
            className="absolute bottom-[-6px] h-[2px] bg-[#0e0f11] dark:bg-white transition-all duration-300 ease-out"
            style={activeStyle}
          />

          {/* Tabs */}
          <div className={cn("relative flex items-center gap-[6px]", fill && "w-full")}>
            {tabs.map((tab, index) => (
              <div
                key={tab.id}
                ref={(el) => {
                  tabRefs.current[index] = el
                }}
                className={cn(
                  "cursor-pointer transition-colors duration-300",
                  large ? "h-10 px-4" : "h-[30px] px-3",
                  fill && "flex-1",
                  index === activeIndex
                    ? "text-[#0e0e10] dark:text-white"
                    : "text-[#0e0f1199] dark:text-[#ffffff99]"
                )}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => {
                  setActiveIndex(index)
                  onTabChange?.(tab.id)
                }}
              >
                <div className={cn("font-medium leading-5 whitespace-nowrap flex items-center justify-center gap-1.5 h-full", large ? "text-[15px]" : "text-sm")}>
                  {tab.icon}
                  {tab.label}
                  {tab.badge}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }
)
Tabs.displayName = "Tabs"

export { Tabs }
export type { Tab as VercelTab }
