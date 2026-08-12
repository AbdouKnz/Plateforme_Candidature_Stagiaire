import type { ReactNode } from "react"

interface AuroraBackgroundProps {
  children: ReactNode
  className?: string
}

export function AuroraBackground({ children, className = "" }: AuroraBackgroundProps) {
  return (
    <div className={`relative min-h-screen overflow-hidden w-full bg-[#FAF9FF] dark:bg-black ${className}`}>
      <div className="absolute inset-0">
        <div className="absolute inset-0 opacity-80 dark:opacity-70">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-300/60 via-purple-200/50 to-indigo-300/55 dark:from-blue-900/40 dark:via-purple-900/30 dark:to-indigo-900/40" />
        </div>

        <div className="absolute inset-0">
          <div className="absolute inset-0 opacity-75 dark:opacity-60 animate-aurora-1 aurora-wave-1" />
          <div className="absolute inset-0 opacity-65 dark:opacity-50 animate-aurora-2 aurora-wave-2" />
          <div className="absolute inset-0 opacity-55 dark:opacity-40 animate-aurora-3 aurora-wave-3" />
          <div className="absolute inset-0 opacity-45 dark:opacity-30 animate-aurora-4 aurora-wave-4" />
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-purple-100/25 via-transparent to-white/10 dark:from-black/20 dark:via-transparent dark:to-black/10" />
      </div>

      <div className="relative z-10">{children}</div>
    </div>
  )
}

export default AuroraBackground
