import { DropdownMenuTrigger } from '@radix-ui/react-dropdown-menu';
import { PasswordInput } from '@/components/password-input';
import { ApiResponse } from "./api";

export interface Setting {
  group_order: number;
  group: string;
  key: string;
  value: string;
  type: string;
  description: string;
  possible_values: string[];
  icon: string

}

export enum SettingType {
  TEXT = "text",
  TEXTAREA = "textarea",
  BOOLEAN = "boolean",
  NUMBER = "number",
  PASSWORD = "password",
  DROPDOWN = "dropdown",
  MULTISELECT = "multiselect"
}


export type Group = { group: string; order: number; icon: string };

export type SettingResponse = ApiResponse<Setting>;