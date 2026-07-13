const API_BASE = "/api/public"

export interface Degree {
  id: number
  name: string
}

export interface Type_ {
  id: number
  name: string
}

export interface Duration {
  id: number
  name: string
}

export interface Technology {
  id: number
  name: string
}

export interface Subject {
  id: number
  code: string
  name: string
  description: string
  priority_rank: string
  technologies: Technology[]
}

export interface CandidaturePayload {
  full_name: string
  email1: string
  gender1: string
  phone1: string
  degree1: string
  university: string
  duration: string
  methode: string
  start_date: string
  subject_name: string
}

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
