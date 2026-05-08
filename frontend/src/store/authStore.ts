import { create } from 'zustand';
import type { User } from '../types/api.types';

interface AuthState {
  user: User | null;
  accessToken: string | null; // MEMORY ONLY — never localStorage
  isLoading: boolean;
  isAuthenticated: boolean;
  setAccessToken: (token: string) => void;
  setUser: (user: User) => void;
  setAuth: (user: User, token: string) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isLoading: true,
  isAuthenticated: false,

  setAccessToken: (token: string) =>
    set({ accessToken: token }),

  setUser: (user: User) =>
    set({ user, isAuthenticated: true }),

  setAuth: (user: User, token: string) =>
    set({ user, accessToken: token, isAuthenticated: true, isLoading: false }),

  setLoading: (isLoading: boolean) =>
    set({ isLoading }),

  logout: () =>
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
    }),
}));
