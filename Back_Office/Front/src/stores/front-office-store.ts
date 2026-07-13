import { create } from "zustand";

interface FrontOfficeState {
  disableDialogOpen: boolean;
  setDisableDialogOpen: (open: boolean) => void;
}

export const useFrontOfficeStore = create<FrontOfficeState>((set) => ({
  disableDialogOpen: false,
  setDisableDialogOpen: (open) => set({ disableDialogOpen: open }),
}));
