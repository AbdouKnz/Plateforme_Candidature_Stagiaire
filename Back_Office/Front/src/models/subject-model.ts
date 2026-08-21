import type { ApiResponse } from "./api";

export interface Subject {
  id: number;
  code: string;
  name: string;
  technology_ids: number[];
  technology_names: string[];
  profile_ids: number[];
  profile_names: string[];
  description: string;
  status: boolean;
  online_quiz_link: string;
  online_meeting_link: string;
  f2f_meeting_link: string;
  duration_id: number | null;
  duration?: {
    id: number;
    name: string;
  };
  created_at: string;
  updated_at: string;
}

export interface SubjectQueryParams {
  search?: string;
  status?: boolean;
}

export type SubjectResponse = ApiResponse<Subject>;