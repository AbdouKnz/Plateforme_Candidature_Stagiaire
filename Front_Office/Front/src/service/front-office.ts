const API_BASE = "/api/public"

import type { Degree, Type_, Duration, Subject, CandidaturePayload } from "@/models/api"

export async function fetchDegrees(): Promise<Degree[]> {
  const res = await fetch(`${API_BASE}/degrees`)
  if (!res.ok) throw new Error("Failed to fetch degrees")
  const body = await res.json()
  return body.data ?? []
}

export async function fetchTypes(): Promise<Type_[]> {
  const res = await fetch(`${API_BASE}/types`)
  if (!res.ok) throw new Error("Failed to fetch types")
  const body = await res.json()
  return body.data ?? []
}

export async function fetchDurations(): Promise<Duration[]> {
  const res = await fetch(`${API_BASE}/durations`)
  if (!res.ok) throw new Error("Failed to fetch durations")
  const body = await res.json()
  return body.data ?? []
}

export async function fetchSubjects(): Promise<Subject[]> {
  const res = await fetch(`${API_BASE}/subjects`)
  if (!res.ok) throw new Error("Failed to fetch subjects")
  const body = await res.json()
  return body.data ?? []
}

export async function submitCandidature(formData: FormData): Promise<{ id: number }> {
  const res = await fetch(`${API_BASE}/candidatures`, {
    method: "POST",
    body: formData,
  })
  if (!res.ok) {
    const body = await res.json()
    throw new Error(body.error ?? "Failed to submit candidature")
  }
  const body = await res.json()
  return body.data ?? { id: 0 }
}

export async function subscribeWaitlist(email: string): Promise<void> {
  const res = await fetch(`${API_BASE}/waitlist`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  })
  const body = await res.json()
  if (!res.ok) {
    throw new Error(body.message ?? body.error ?? "Failed to subscribe to waitlist")
  }
  if (body.data?.already) {
    throw new Error("already subscribed")
  }
}

// Re-export types for convenience
export type { Degree, Type_, Duration, Subject, CandidaturePayload }
