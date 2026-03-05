import { create } from "zustand";

interface AppState {
  // UI-only state (server state lives in React Query)
}

export const useAppStore = create<AppState>(() => ({}));
