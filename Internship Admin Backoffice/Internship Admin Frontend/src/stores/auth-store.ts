import { AuthUser, LoginResponse } from "@/models/auth-model";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  refreshToken: string | null;
  setAuth: (data: LoginResponse | undefined) => void;
  updateTokens: (accessToken: string, refreshToken: string) => void; 
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      setAuth: (data) => {
        set({
          user: data?.data ?? null,
          token: data?.data?.token ?? null,
          refreshToken: data?.data?.refresh_token ?? null,
        });
      },
      updateTokens: (accessToken, refreshToken) => {
        set((state) => ({
          token: accessToken,
          refreshToken: refreshToken,
          user: state.user
            ? {
                ...state.user,
                token: accessToken,
                refresh_token: refreshToken,
              }
            : null,
        }));
      },
      clearAuth: () => {
        set({
          user: null,
          token: null,
          refreshToken: null,
        });
      },
    }),
    {
      name: "auth-storage",
    }
  )
);