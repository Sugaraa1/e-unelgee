import React, { createContext, useContext, useState, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import type { User } from '../types';
import * as authService from '../services/authService';
import { STORAGE_KEYS } from '../constants';

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: authService.RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  loadStoredAuth: () => Promise<void>;
  setUser: (user: User) => Promise<void>;
}

const AuthContext = createContext<AuthStore>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  loadStoredAuth: async () => {},
  setUser: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUserState] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const login = async (email: string, password: string): Promise<void> => {
    const result = await authService.login({ email, password });
    setUserState(result.user);
    setIsAuthenticated(true);
  };

  const register = async (payload: authService.RegisterPayload): Promise<void> => {
    const result = await authService.register(payload);
    setUserState(result.user);
    setIsAuthenticated(true);
  };

  const logout = async (): Promise<void> => {
    await authService.logout();
    setUserState(null);
    setIsAuthenticated(false);
  };

  const loadStoredAuth = async (): Promise<void> => {
    try {
      const storedUser = await authService.getStoredUser();
      const token = await authService.getStoredToken();
      if (storedUser !== null && token !== null) {
        setUserState(storedUser);
        setIsAuthenticated(true);
      } else {
        setUserState(null);
        setIsAuthenticated(false);
      }
    } catch {
      setUserState(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ setUser — state + SecureStore-ийг аль алинд нь хадгална
  // Ингэснээр app restart хийсэн ч шинэчилсэн өгөгдөл хадгалагдана
  const setUser = async (updatedUser: User): Promise<void> => {
    setUserState(updatedUser);
    try {
      await SecureStore.setItemAsync(
        STORAGE_KEYS.USER,
        JSON.stringify(updatedUser),
      );
    } catch (err) {
      console.warn('[authStore] SecureStore save failed:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        register,
        logout,
        loadStoredAuth,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthStore = () => useContext(AuthContext);