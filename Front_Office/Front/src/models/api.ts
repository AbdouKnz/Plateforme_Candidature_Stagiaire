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

export interface Profile {
  id: number;
  name: string;
}

export interface Subject {
  id: number;
  code: string;
  name: string;
  description: string;
  image_path?: string;
  technologies: Technology[];
  profiles: Profile[];
  duration?: Duration | null;
  period?: string;
}

export interface CandidaturePayload {
  full_name: string;
  first_name?: string;
  last_name?: string;
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