import { create } from "zustand";
import type { AuthUser } from "@ttm/shared";

export type AuthStatus = "authenticated" | "unauthenticated" | "loading";

type AuthState = {
  status: AuthStatus;
  user: AuthUser | null;
  setAuthenticated: (user: AuthUser) => void;
  setUnauthenticated: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  status: "loading",
  user: null,
  setAuthenticated: (user) => set({ status: "authenticated", user }),
  setUnauthenticated: () => set({ status: "unauthenticated", user: null }),
}));
