import { ApiResponse } from "./api";

export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "logged in"
  | "logged out"
  | "export";

export type Audit = {
  audit_id?: number;
  actor_id?: number;
  actor_name?: string;
  module?: string;
  action: AuditAction;
  change?: ChangeDetail;
  icon?:string
  date?: string;
};

export type FieldChange = {
  created_values?: any;
  deleted_values?: any;
  logged_in_values?: any;
  logged_out_values?: any;
  old_values?: any;
  new_values?: any;
  changed: boolean;
};

export type ChangeDetail = {
  type: string; 
  fields: Record<string, FieldChange>;
  description?: string; 
};
export interface AuditQueryParams {
  action?: string;
  module?: string;
  start?: string;
  end?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export enum ChangeType {
  CREATE = "create",
  UPDATE = "update",
  UPDATE_STATUS = "update status",
  DELETE = "delete",
  LOGIN = "login",
  LOGOUT = "logout",
}

export enum ActionType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LOGIN = "logged in",
  LOGOUT = "logged out",
  EXPORT = "export"
}

export type AuditResponse = ApiResponse<Audit[]>;
