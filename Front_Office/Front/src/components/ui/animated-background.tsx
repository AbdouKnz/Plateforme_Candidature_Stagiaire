import type { ReactNode } from "react"
import { useTheme } from "@/context/theme-context"
import MoltenMetal from "./molten-metal"

interface AuroraBackgroundProps {
  children: ReactNode
  className?: string
}

export function AuroraBackground({ children, className = "" }: AuroraBackgroundProps) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

  return (
    <div className={`relative min-h-screen overflow-hidden w-full bg-background ${className}`}>
      <div className="absolute inset-0">
        <MoltenMetal
          color1={isDark ? "#0F5C9E" : "#1D7CC7"}
          color2={isDark ? "#1D7CC7" : "#12B9DA"}
          color3={isDark ? "#B3E8F2" : "#12B9DA"}
          speed={0.35}
          scale={4}
          detail={3}
          glow={1.6}
          coreSize={0.1}
          swirl={1}
          fold={-0.2}
          blackPoint={isDark ? 0.1 : 0.14}
          brightness={isDark ? 1.35 : 1.28}
          colorMode="molten"
          grain
          grainIntensity={0.04}
          mouseInteraction
          mouseStrength={0.3}
          opacity={isDark ? 0.68 : 0.58}
        />
      </div>

      <div className={`relative z-10 flex min-h-svh flex-col ${className}`}>{children}</div>
    </div>
  )
}

export default AuroraBackground
