import { DialogType } from "@/models/alert-model";
import { DegreeQueryParams } from "@/models/degree-model";
import { create } from "zustand";

interface DegreesState {
  openDegree: DialogType | null;
  setOpenDegree: (dialogType: DialogType | null) => void;
  currentDegreeId: number | null;
  setCurrentDegreeId: (id: number | null) => void;
  queryParams: DegreeQueryParams;
  setQueryParams: (params: Partial<DegreeQueryParams>) => void;
}

export const useDegreesStore = create<DegreesState>((set) => ({
  openDegree: null,
  setOpenDegree: (openDegree) => set({ openDegree }),
  currentDegreeId: null,
  setCurrentDegreeId: (id) => set({ currentDegreeId: id }),
  queryParams: {},
  setQueryParams: (params) =>
    set((state) => ({
      queryParams: { ...state.queryParams, ...params },
    })),
}));
