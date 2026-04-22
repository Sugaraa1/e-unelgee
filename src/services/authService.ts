import apiClient from './apiClient';
import * as SecureStore from 'expo-secure-store';
import { ENDPOINTS, STORAGE_KEYS } from '../constants';
import type { ApiResponse, AuthTokens, User } from '../types';

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
  insurancePolicyNumber?: string;
  insuranceProvider?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResult {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

// ── Register ──────────────────────────────────────────────────
export const register = async (payload: RegisterPayload): Promise<AuthResult> => {
  const { data } = await apiClient.post<ApiResponse<AuthResult>>(
    ENDPOINTS.AUTH.REGISTER,
    payload,
  );
 
  const result = data.data;
 
  await Promise.all([
    SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, result.accessToken),
    SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, result.refreshToken),
  ]);

  try {
    const { data: meData } = await apiClient.get<ApiResponse<User>>(ENDPOINTS.AUTH.ME);
    result.user = meData.data;
  } catch {}

  await SecureStore.setItemAsync(STORAGE_KEYS.USER, JSON.stringify(result.user));
  return result;
};

// ── Login ─────────────────────────────────────────────────────
export const login = async (payload: LoginPayload): Promise<AuthResult> => {
  const { data } = await apiClient.post<ApiResponse<AuthResult>>(
    ENDPOINTS.AUTH.LOGIN,
    payload,
  );
 
  const result = data.data;
 
  // ✅ Эхлээд token-ийг хадгалж, дараа бүтэн user-г fetch хийнэ
  await Promise.all([
    SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, result.accessToken),
    SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, result.refreshToken),
  ]);

  // ✅ Token хадгалсны дараа бүтэн profile татна
  try {
    const { data: meData } = await apiClient.get<ApiResponse<User>>(ENDPOINTS.AUTH.ME);
    result.user = meData.data;
  } catch {
    // fallback: login response-ийн user ашиглана
  }

  await SecureStore.setItemAsync(STORAGE_KEYS.USER, JSON.stringify(result.user));
  return result;
};

// ── Logout ────────────────────────────────────────────────────
export const logout = async (): Promise<void> => {
  try {
    await apiClient.post(ENDPOINTS.AUTH.LOGOUT);
  } finally {
    await clearAuthData();
  }
};

// ── Get current user ──────────────────────────────────────────
export const getMe = async (): Promise<User> => {
  const { data } = await apiClient.get<ApiResponse<User>>(ENDPOINTS.AUTH.ME);
  return data.data;
};

// ── Helpers ───────────────────────────────────────────────────
const saveAuthData = async (result: AuthResult): Promise<void> => {
  await Promise.all([
    SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, result.accessToken),
    SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, result.refreshToken),
    SecureStore.setItemAsync(STORAGE_KEYS.USER, JSON.stringify(result.user)),
  ]);
};

const clearAuthData = async (): Promise<void> => {
  await Promise.all([
    SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN),
    SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN),
    SecureStore.deleteItemAsync(STORAGE_KEYS.USER),
  ]);
};

export const getStoredUser = async (): Promise<User | null> => {
  const raw = await SecureStore.getItemAsync(STORAGE_KEYS.USER);
  return raw ? JSON.parse(raw) : null;
};

export const getStoredToken = async (): Promise<string | null> => {
  return SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
};