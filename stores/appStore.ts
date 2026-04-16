import { create } from "zustand";

interface AppState {
  toast: string | null;
  toastType: "success" | "error";
  showToast: (msg: string, type?: "success" | "error") => void;
  hideToast: () => void;
  pendingGymDate: Date | null;
  setPendingGymDate: (date: Date) => void;
  clearPendingGymDate: () => void;
  pendingInviteToken: string | null;
  setPendingInviteToken: (token: string) => void;
  clearPendingInviteToken: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  toast: null,
  toastType: "success",
  showToast: (msg, type = "success") => set({ toast: msg, toastType: type }),
  hideToast: () => set({ toast: null }),
  pendingGymDate: null,
  setPendingGymDate: (date) => set({ pendingGymDate: date }),
  clearPendingGymDate: () => set({ pendingGymDate: null }),
  pendingInviteToken: null,
  setPendingInviteToken: (token) => set({ pendingInviteToken: token }),
  clearPendingInviteToken: () => set({ pendingInviteToken: null }),
}));
