import { useState, useEffect, useCallback } from "react"

const STORAGE_KEY = "fo_admin_preview"

/**
 * Tab-scoped admin preview flag. Unlocking bypasses the public
 * open/closed check so admins can view the front office while it is
 * closed. The flag lives in sessionStorage: it dies with the tab and is
 * never persisted across sessions.
 */
export function useAdminPreview() {
  const [unlocked, setUnlocked] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(STORAGE_KEY) === "1"
    } catch {
      return false
    }
  })

  useEffect(() => {
    function handleStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY) {
        setUnlocked(e.newValue === "1")
      }
    }
    window.addEventListener("storage", handleStorage)
    return () => window.removeEventListener("storage", handleStorage)
  }, [])

  const unlock = useCallback(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, "1")
    } catch {
      // storage unavailable (private mode) — keep in-memory only
    }
    setUnlocked(true)
  }, [])

  const lock = useCallback(() => {
    try {
      sessionStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore
    }
    setUnlocked(false)
  }, [])

  return { unlocked, unlock, lock }
}
