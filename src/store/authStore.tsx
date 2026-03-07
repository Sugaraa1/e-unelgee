import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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

const AuthContext = createContext<AuthStore>({} as AuthStore);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUserState] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const login = async (email: string, password: string) => {
    const result = await authService.login({ email, password });
    setUserState(result.user);
    setIsAuthenticated(true);
  };

  const register = async (payload: authService.RegisterPayload) => {
    const result = await authService.register(payload);
    setUserState(result.user);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    await authService.logout();
    setUserState(null);
    setIsAuthenticated(false);
  };

  const loadStoredAuth = async () => {
    try {
      const [storedUser, token] = await Promise.all([
        authService.getStoredUser(),
        authService.getStoredToken(),
      ]);
      if (storedUser && token) {
        setUserState(storedUser);
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    } catch {
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{
      user, isAuthenticated, isLoading,
      login, register, logout, loadStoredAuth,
      setUser: setUserState,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthStore = () => useContext(AuthContext);