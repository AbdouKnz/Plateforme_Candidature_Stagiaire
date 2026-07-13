export interface ApiResponse<T> {
  data: T;
  message: string;
  status: number;
  error?: string;
}

export interface Degree {
  id: number;
  name: string;
}

export interface Type_ {
  id: number;
  name: string;
}

export interface Duration {
  id: number;
  name: string;
}

export interface Technology {
  id: number;
  name: string;
}

export interface Subject {
  id: number;
  code: string;
  name: string;
  description: string;
  priority_rank: string;
  technologies: Technology[];
}

export interface CandidaturePayload {
  full_name: string;
  email1: string;
  gender1: string;
  phone1: string;
  degree1: string;
  university: string;
  duration: string;
  methode: string;
  start_date: string;
  subject_name: string;
}