import { DialogType } from "@/models/alert-model";
import { TypeQueryParams } from "@/models/type-model";
import { create } from "zustand";

interface TypesState {
  openType: DialogType | null;
  setOpenType: (dialogType: DialogType | null) => void;
  currentTypeId: number | null;
  setCurrentTypeId: (id: number | null) => void;
  queryParams: TypeQueryParams;
  setQueryParams: (params: Partial<TypeQueryParams>) => void;
}

export const useTypesStore = create<TypesState>((set) => ({
  openType: null,
  setOpenType: (openType) => set({ openType }),
  currentTypeId: null,
  setCurrentTypeId: (id) => set({ currentTypeId: id }),
  queryParams: {},
  setQueryParams: (params) =>
    set((state) => ({
      queryParams: { ...state.queryParams, ...params },
    })),
}));
