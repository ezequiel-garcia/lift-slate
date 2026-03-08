import { create } from "zustand";

interface AppState {
  toast: string | null;
  showToast: (msg: string) => void;
  hideToast: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  toast: null,
  showToast: (msg) => set({ toast: msg }),
  hideToast: () => set({ toast: null }),
}));
