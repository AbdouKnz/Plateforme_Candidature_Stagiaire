import { DialogType } from "@/models/alert-model";
import { TechnologyQueryParams } from "@/models/technology-model";
import { create } from "zustand";

interface TechnologiesState {
  openTechnology: DialogType | null;
  setOpenTechnology: (dialogType: DialogType | null) => void;
  currentTechnologyId: number | null;
  setCurrentTechnologyId: (id: number | null) => void;
  queryParams: TechnologyQueryParams;
  setQueryParams: (params: Partial<TechnologyQueryParams>) => void;
}

export const useTechnologiesStore = create<TechnologiesState>((set) => ({
  openTechnology: null,
  setOpenTechnology: (openTechnology) => set({ openTechnology }),
  currentTechnologyId: null,
  setCurrentTechnologyId: (id) => set({ currentTechnologyId: id }),
  queryParams: {},
  setQueryParams: (params) =>
    set((state) => ({
      queryParams: { ...state.queryParams, ...params },
    })),
}));
