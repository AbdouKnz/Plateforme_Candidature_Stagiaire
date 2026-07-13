import { ApiSearchParams } from "./api";
import { FileType } from "./export-model";

export interface TableSearchProps {
  placeholder?: string;
  setQueryParams?: (params: ApiSearchParams) => void;
}

export interface TableAddProps {
  addButtonLabel?: string;
  addButtonIcon?: React.ComponentType<{ size?: number }>;
  addFunction?: () => void;
}

export interface TableFilterProps {
  setQueryParams: (params: Record<string, any>) => void;
  formDefaultValues?: Record<string, any>;
  resetFilterQueryParams: () => void; 
  formFields: FormField[];
}
export type TableExportFnProps = (params: { fileType: FileType }) => void;

export interface TableExtraActionButton {
  pendingLabel?: string;
  label?: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  onClick: () => void;
  className?:string;
  isPending?: boolean;
  tooltip?: string;
  variant?: "default" | "outline" | "destructive" | "ghost" | "secondary";
}

export interface ToolbarProps {
  tableSearchProps?: TableSearchProps;
  tableAddProps?: TableAddProps;
  tableFilterProps?: TableFilterProps;
  DataTableFilter?: React.ComponentType<{ onClose?: () => void }>;
  exportFunction?: TableExportFnProps;
  extraAction?: TableExtraActionButton;
}

export interface FilterItem {
  label: string;
  value: string;
}

export type FormFieldType = "dropdown" | "date" | "text" | "number";
export interface FormField {
  name: string;
  label: string;
  type: FormFieldType;
  items?: FilterItem[]; 
}



export interface TablePaginationrProps {
  setQueryParams: (params: Record<string, any>) => void;
}


export enum FieldTypeEnum {
  DROPDOWN = "dropdown",
  DATE = "date",
  TEXT = "text",
  NUMBER = "number"
}