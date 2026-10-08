import { DialogType } from "@/models/alert-model";
import { DurationQueryParams } from "@/models/duration-model";
import { create } from "zustand";

interface DurationsState {
  openDuration: DialogType | null;
  setOpenDuration: (dialogType: DialogType | null) => void;
  currentDurationId: number | null;
  setCurrentDurationId: (id: number | null) => void;
  queryParams: DurationQueryParams;
  setQueryParams: (params: Partial<DurationQueryParams>) => void;
}

export const useDurationsStore = create<DurationsState>((set) => ({
  openDuration: null,
  setOpenDuration: (openDuration) => set({ openDuration }),
  currentDurationId: null,
  setCurrentDurationId: (id) => set({ currentDurationId: id }),
  queryParams: {},
  setQueryParams: (params) =>
    set((state) => ({
      queryParams: { ...state.queryParams, ...params },
    })),
}));
