import { create } from "zustand"
import type { Subject } from "@/models/api"

const SHORTLIST_STORAGE_KEY = "pfe-book-shortlist"

function readShortlistCodes(): string[] {
  try {
    const raw = localStorage.getItem(SHORTLIST_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((c): c is string => typeof c === "string") : []
  } catch {
    return []
  }
}

function writeShortlistCodes(codes: string[]) {
  try {
    localStorage.setItem(SHORTLIST_STORAGE_KEY, JSON.stringify(codes))
  } catch {
    // storage unavailable — keep in-memory state only
  }
}

interface PreselectionState {
  subject: Subject | null
  shortlistCodes: string[]
  setSubject: (subject: Subject) => void
  clear: () => void
}

export const usePreselectionStore = create<PreselectionState>((set) => ({
  subject: null,
  shortlistCodes: readShortlistCodes(),
  setSubject: (subject) =>
    set(() => {
      const shortlistCodes = subject.code ? [subject.code] : []
      writeShortlistCodes(shortlistCodes)
      return { subject, shortlistCodes }
    }),
  clear: () =>
    set(() => {
      writeShortlistCodes([])
      return { subject: null, shortlistCodes: [] }
    }),
}))

export { SHORTLIST_STORAGE_KEY }
