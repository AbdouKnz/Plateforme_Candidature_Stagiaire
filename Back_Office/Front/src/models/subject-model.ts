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
  priority_rank: string;
  status: boolean;
  created_at: string;
  updated_at: string;
}

export interface SubjectQueryParams {
  search?: string;
  status?: boolean;
}

export type SubjectResponse = ApiResponse<Subject>;