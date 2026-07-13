import { useState, useEffect } from "react"

interface FrontOfficeStatus {
  is_enabled: boolean
  closed_message?: string
  reopening_date?: string
}

export function useFrontOfficeStatus() {
  const [status, setStatus] = useState<FrontOfficeStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch("/api/public/front-office/status")
        if (!res.ok) throw new Error("Failed to fetch front office status")
        const body = await res.json()
        setStatus(body.data ?? body as FrontOfficeStatus)
      } catch {
        setStatus({ is_enabled: true })
      } finally {
        setLoading(false)
      }
    }

    fetchStatus()
    const interval = setInterval(fetchStatus, 300_000)
    return () => clearInterval(interval)
  }, [])

  return { status, loading }
}
