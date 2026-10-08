import * as React from "react"
import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react"

import { useTheme } from "@/context/theme-context"
import { Button } from "@/components/ui/button"

const THEME_CYCLE = ["light", "dark", "system"] as const

export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const cycleTheme = () => {
    const next = THEME_CYCLE[(THEME_CYCLE.indexOf(theme) + 1) % THEME_CYCLE.length]
    setTheme(next)
  }

  const isDark = resolvedTheme === "dark"

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      aria-label={`Color theme: ${theme}. Activate to switch theme.`}
      title={`Theme: ${theme}`}
      onClick={cycleTheme}
    >
      {!mounted ? (
        <SunIcon />
      ) : theme === "system" ? (
        <MonitorIcon />
      ) : isDark ? (
        <MoonIcon />
      ) : (
        <SunIcon />
      )}
    </Button>
  )
}
