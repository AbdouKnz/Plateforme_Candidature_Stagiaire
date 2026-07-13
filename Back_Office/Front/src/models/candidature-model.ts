import type { ApiResponse } from "./api";

export interface Candidature {
  id: number;
  full_name: string;
  email1: string;
  gender1: string;
  phone1: string;
  degree1: string;
  full_name2: string;
  email2: string;
  gender2: string;
  phone2: string;
  degree2: string;
  duration: string;
  methode: string;
  start_date: string;
  subject_name: string;
  university: string;
  university2: string;
  date_application: string;
  path_cv: string;
  path_lettre_motivation: string;
  path_cv2: string;
  path_lettre_motivation2: string;
  status?: string;
  created_at: string;
  updated_at: string;
}

export interface CandidatureQueryParams {
  search?: string;
  status?: string;
}

export type CandidatureResponse = ApiResponse<Candidature>;
