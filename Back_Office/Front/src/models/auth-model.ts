import { ApiResponse } from "./api";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LogoutPayload {
  first_name: string;
  last_name: string;
}

export interface settings {
  currency: string;
  denominator: string;
}
export interface AuthUser {
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  role_id: number;
  role_name: string;
  token: string;
  refresh_token: string;
  permissions: { [key: string]: string };
  settings: settings;
}

export type LoginResponse = ApiResponse<AuthUser>;
