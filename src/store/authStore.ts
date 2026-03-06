import { create } from 'zustand';
import type { User, AuthTokens } from '../types';
import * as authService from '../services/authService';

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (payload: authService.RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  loadStoredAuth: () => Promise<void>;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email, password) => {
    const result = await authService.login({ email, password });
    set({ user: result.user, isAuthenticated: true });
  },

  register: async (payload) => {
    const result = await authService.register(payload);
    set({ user: result.user, isAuthenticated: true });
  },

  logout: async () => {
    await authService.logout();
    set({ user: null, isAuthenticated: false });
  },

  loadStoredAuth: async () => {
    try {
      const [user, token] = await Promise.all([
        authService.getStoredUser(),
        authService.getStoredToken(),
      ]);
      if (user && token) {
        set({ user, isAuthenticated: true });
      }
    } finally {
      set({ isLoading: false });
    }
  },

  setUser: (user) => set({ user }),
}));