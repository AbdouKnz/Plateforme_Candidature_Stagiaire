import { ApiResponse } from "./api";

export type ID = undefined | null | number

export interface Role {
  role_id: number;
  role_name: string;
  user_count: number
  role_permissions: Record<string, string>; 
  created_at: string;
  updated_at: string;
}

export interface RoleQueryParams  {
  search?: string;
}
export interface Module  {
  id: number
  module_name: string
  read: number
  add: number
  edit: number
  delete: number
  module_icon:string
  module_icon_color:string
  enabled_permissions: string[];
}

export interface ModuleList  {
  data: Module[];
  message: string;
  status: number;
};

export interface reassigneRole  {
  current_role_id: ID;
  new_role_id: ID;
};
export type RoleResponse = ApiResponse<Role>;
