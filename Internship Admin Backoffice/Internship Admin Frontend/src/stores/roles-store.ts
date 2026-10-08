import { DialogType } from "@/models/alert-model";
import { ID, RoleQueryParams } from "@/models/role-model";
import { create } from "zustand";

interface RolesState {
  openRole: DialogType | null;
  setOpenRole: (dialogType: DialogType | null) => void;
  currentRoleId: ID;
  setCurrentRoleId: (id: ID) => void;
  queryParams: RoleQueryParams;
  setQueryParams: (params: Partial<RoleQueryParams>) => void;
}

export const useRolesStore = create<RolesState>((set) => ({
  openRole: null,
  setOpenRole: (openRole) => set({ openRole }),
  currentRoleId: null,
  setCurrentRoleId: (id) => set({ currentRoleId: id }),
  queryParams: {},
  setQueryParams: (params) =>
    set((state) => ({
      queryParams: { ...state.queryParams, ...params },
    })),

  resetFilterQueryParams: () =>
    set((state) => ({
      queryParams: {
        search: state.queryParams.search,
      },
    })),
}));
