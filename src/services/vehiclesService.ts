import apiClient from './apiClient';
import type { ApiResponse, Vehicle } from '../types';

export interface CreateVehiclePayload {
  make: string;
  model: string;
  year: number;
  color: string;
  licensePlate: string;
  fuelType?: string;
}

export const getVehicles = async (): Promise<Vehicle[]> => {
  const { data } = await apiClient.get<ApiResponse<Vehicle[]>>('/vehicles');
  return data.data;
};

export const createVehicle = async (payload: CreateVehiclePayload): Promise<Vehicle> => {
  const { data } = await apiClient.post<ApiResponse<Vehicle>>('/vehicles', payload);
  return data.data;
};

export const updateVehicle = async (id: string, payload: Partial<CreateVehiclePayload>): Promise<Vehicle> => {
  const { data } = await apiClient.patch<ApiResponse<Vehicle>>(`/vehicles/${id}`, payload);
  return data.data;
};

export const deleteVehicle = async (id: string): Promise<void> => {
  await apiClient.delete(`/vehicles/${id}`);
};