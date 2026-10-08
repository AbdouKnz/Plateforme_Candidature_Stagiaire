import { ApiResponse } from "./api";

export type UserStatus = "enabled"|"disabled";

export interface User {
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  password:string
  status?: boolean;
  role_id: number;
  role_name: string;
  created_at: string;
  updated_at: string;
}

export type status = {
  status?: UserStatus;
};

export interface UserFilterParams {
  status?: boolean;
  role_name?: string;
}

export interface UserQueryParams extends UserFilterParams {
  search?: string;
  page?: number;
  pageSize?: number;
}
export interface ChangePasswordPayload {
  old_password: string;
  new_password: string;
}

export enum UserRole {
  SUPER_ADMIN = "super admin",
  ADMIN = "admin",
  MANAGER = "manager",
  CASHIER = "cashier",
  USER = "user",
}

export enum UserStatusTypes {
  ENABLED="enabled",
  DISABLED="disabled"

}

export type UserResponse = ApiResponse<User[]>;
