import type { ApiResponse } from "./api";

export interface Profile {
  id: number;
  name: string;
  status: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProfileQueryParams {
  search?: string;
  status?: boolean;
}

export type ProfileResponse = ApiResponse<Profile>;