import { useState, useEffect } from "react"

interface FrontOfficeStatus {
  is_enabled: boolean
  closed_message?: string
  reopening_date?: string
  year?: string
  internship_title?: string
}

export function useFrontOfficeStatus() {
  const [status, setStatus] = useState<FrontOfficeStatus | null>(null)
  const [loading, setLoading] = useState(true)

  // Short cadence (same as form options) + refetch when the tab regains
  // focus, so back-office changes (title, year, open/closed) apply without
  // a manual reload.
  const STATUS_REFRESH_MS = 15000

  useEffect(() => {
    let cancelled = false

    async function fetchStatus(initial: boolean) {
      try {
        const res = await fetch("/api/public/front-office/status")
        if (!res.ok) throw new Error("Failed to fetch front office status")
        const body = await res.json()
        if (!cancelled) setStatus(body.data ?? body as FrontOfficeStatus)
      } catch {
        if (!cancelled && initial) setStatus({ is_enabled: true })
      } finally {
        if (!cancelled && initial) setLoading(false)
      }
    }

    fetchStatus(true)
    const refreshSilently = () => fetchStatus(false)
    const interval = setInterval(refreshSilently, STATUS_REFRESH_MS)
    const handleFocus = () => refreshSilently()
    const handleVisibility = () => {
      if (document.visibilityState === "visible") refreshSilently()
    }
    window.addEventListener("focus", handleFocus)
    document.addEventListener("visibilitychange", handleVisibility)
    return () => {
      cancelled = true
      clearInterval(interval)
      window.removeEventListener("focus", handleFocus)
      document.removeEventListener("visibilitychange", handleVisibility)
    }
  }, [])

  return { status, loading }
}
