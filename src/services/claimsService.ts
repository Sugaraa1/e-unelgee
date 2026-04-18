import apiClient from './apiClient';
import type { ApiResponse, Claim } from '../types';

export interface CreateClaimPayload {
  vehicleId: string;
  description: string;
  accidentDate: string;       // ISO string: "2026-04-18T10:30:00.000Z"
  accidentLocation: string;
  accidentType: string;
  latitude?: number;
  longitude?: number;
  thirdPartyInvolved?: boolean;
  policeReportFiled?: boolean;
}

// ── GET /claims ───────────────────────────────────────────────
export const getClaims = async (): Promise<Claim[]> => {
  const { data } = await apiClient.get<ApiResponse<Claim[]>>('/claims');
  return data.data;
};

// ── GET /claims/:id ───────────────────────────────────────────
export const getClaimById = async (id: string): Promise<Claim> => {
  const { data } = await apiClient.get<ApiResponse<Claim>>(`/claims/${id}`);
  return data.data;
};

// ── POST /claims ──────────────────────────────────────────────
export const createClaim = async (
  payload: CreateClaimPayload,
): Promise<Claim> => {
  const { data } = await apiClient.post<ApiResponse<Claim>>(
    '/claims',
    payload,
  );
  return data.data;
};

// ── PATCH /claims/:id ─────────────────────────────────────────
export const updateClaim = async (
  id: string,
  payload: Partial<CreateClaimPayload & { status: string }>,
): Promise<Claim> => {
  const { data } = await apiClient.patch<ApiResponse<Claim>>(
    `/claims/${id}`,
    payload,
  );
  return data.data;
};

// ── DELETE /claims/:id ────────────────────────────────────────
export const deleteClaim = async (id: string): Promise<void> => {
  await apiClient.delete(`/claims/${id}`);
};