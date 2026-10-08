export type ID = undefined | null | number

export interface ApiResponse<T> {
  data: T;
  pagination: PaginationMetadata;
  filters?: FiltersMetadata;
  message: string;
  status: number;
}
export interface PaginationMetadata {
  page: number;
  pageSize: number;
  totalRows: number;
  totalPages: number;
  totalEnabled?: number;  
  totalDisabled?: number; 
}

export interface FiltersMetadata {
  modules: string[];
  actions: string[];
}

export interface ApiSearchParams {
  search?: string;
  page?: number;
  pageSize?: number;
  // This allows your other dynamic filters (status, start, end, etc.) 
  // to be passed without TypeScript throwing errors.
  [key: string]: any;
}

