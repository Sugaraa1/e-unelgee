import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { User } from '../types';
import * as authService from '../services/authService';

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: authService.RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  loadStoredAuth: () => Promise<void>;
  setUser: (user: User) => void;
}

// ✅ Default утгуудыг зөв boolean-оор тодорхойлсон
const AuthContext = createContext<AuthStore>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  loadStoredAuth: async () => {},
  setUser: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const login = async (email: string, password: string): Promise<void> => {
    const result = await authService.login({ email, password });
    setUser(result.user);
    setIsAuthenticated(true);
  };

  const register = async (payload: authService.RegisterPayload): Promise<void> => {
    const result = await authService.register(payload);
    setUser(result.user);
    setIsAuthenticated(true);
  };

  const logout = async (): Promise<void> => {
    await authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  const loadStoredAuth = async (): Promise<void> => {
    try {
      const storedUser = await authService.getStoredUser();
      const token = await authService.getStoredToken();
      if (storedUser !== null && token !== null) {
        setUser(storedUser);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch {
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
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