import { DialogType } from "@/models/alert-model";
import { ID } from "@/models/api";
import { UserQueryParams } from "@/models/user-model";
import { create } from "zustand";

interface UsersState {
  open: DialogType | null;
  setOpen: (open: DialogType | null) => void;

  currentUserId: ID;
  setCurrentUserId: (id: ID) => void;

  queryParams: UserQueryParams;
  setQueryParams: (params: Partial<UserQueryParams>) => void;

  resetFilterQueryParams: () => void;
}

export const useUsersStore = create<UsersState>((set) => ({
  open: null,
  setOpen: (open) => set({ open }),

  currentUserId: null,
  setCurrentUserId: (id) => set({ currentUserId: id }),
  queryParams: {},
   setQueryParams: (params) =>
    set((state) => ({
      queryParams: { ...state.queryParams, ...params },
    })),

  resetFilterQueryParams: () => set((state) => ({
    queryParams: {
      search: state.queryParams.search,
      page: state.queryParams.page,
      pageSize: state.queryParams.pageSize,
    }
  })),
}));
