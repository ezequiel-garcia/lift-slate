import { create } from "zustand";

interface AppState {
  toast: string | null;
  showToast: (msg: string) => void;
  hideToast: () => void;
  pendingGymDate: Date | null;
  setPendingGymDate: (date: Date) => void;
  clearPendingGymDate: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  toast: null,
  showToast: (msg) => set({ toast: msg }),
  hideToast: () => set({ toast: null }),
  pendingGymDate: null,
  setPendingGymDate: (date) => set({ pendingGymDate: date }),
  clearPendingGymDate: () => set({ pendingGymDate: null }),
}));
