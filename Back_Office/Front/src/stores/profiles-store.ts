import { DialogType } from "@/models/alert-model";
import { ProfileQueryParams } from "@/models/profile-model";
import { create } from "zustand";

interface ProfilesState {
  openProfile: DialogType | null;
  setOpenProfile: (dialogType: DialogType | null) => void;
  currentProfileId: number | null;
  setCurrentProfileId: (id: number | null) => void;
  queryParams: ProfileQueryParams;
  setQueryParams: (params: Partial<ProfileQueryParams>) => void;
}

export const useProfilesStore = create<ProfilesState>((set) => ({
  openProfile: null,
  setOpenProfile: (openProfile) => set({ openProfile }),
  currentProfileId: null,
  setCurrentProfileId: (id) => set({ currentProfileId: id }),
  queryParams: {},
  setQueryParams: (params) =>
    set((state) => ({
      queryParams: { ...state.queryParams, ...params },
    })),
}));
