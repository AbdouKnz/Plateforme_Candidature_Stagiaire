import type { ApiResponse } from "./api";

export interface Candidature {
  id: number;
  first_name?: string;
  last_name?: string;
  full_name: string;
  email1: string;
  gender1: string;
  phone1: string;
  degree1: string;
  first_name2?: string;
  last_name2?: string;
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
  step?: string;
  current_step?: number;
  step1_status?: string | null;
  step2_status?: string | null;
  step3_status?: string | null;
  step4_status?: string | null;
  step5_status?: string | null;
  score_cv_screening?: number;
  score_online_quiz?: number;
  score_online_meeting?: number;
  score_f2f_meeting?: number;
  score_final_decision?: number;
  notes?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface CandidatureQueryParams {
  search?: string;
  status?: string;
  full_name?: string;
  candidature_type?: string;
  gender?: string;
  degree?: string;
  subject_name?: string;
  score_sort?: string;
  score_sort_step?: string;
  score_sort_direction?: string;
}

export interface RejectionReason {
  key: string;
  fr: string;
  en: string;
}

export type CandidatureResponse = ApiResponse<Candidature>;

