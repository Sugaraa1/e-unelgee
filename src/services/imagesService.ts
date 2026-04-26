import apiClient from './apiClient';
import type { ApiResponse } from '../types';
import type { AxiosProgressEvent } from 'axios';

export type ImageAngleType =
  | 'front'
  | 'rear'
  | 'left_side'
  | 'right_side'
  | 'front_left'
  | 'front_right'
  | 'rear_left'
  | 'rear_right'
  | 'damage_closeup'
  | 'interior'
  | 'engine'
  | 'other';

export interface UploadedImage {
  id: string;
  claimId: string;
  originalName: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  fileSize: number;
  imageType: ImageAngleType;
  status: 'pending' | 'processing' | 'analyzed' | 'failed';
  createdAt: string;
  aiAnalysisResult?: {
    damagedParts?: Array<{
      partName: string;
      damageType: string;
      severity: string;
      confidence: number;
    }>;
    overallSeverity?: string;
    overallConfidence?: number;
    recommendations?: string[];
    analysisDetails?: string;
  };
  aiConfidenceScore?: number;
  aiErrorMessage?: string;
  analyzedAt?: string;
  aiRetryCount?: number;
}

/**
 * POST /images/upload
 * imageType нэмэгдсэн — аль талаас авсан зургийг тодорхойлно
 */
export const uploadClaimImage = async (
  claimId: string,
  imageUri: string,
  fileName: string = 'photo.jpg',
  imageType: ImageAngleType = 'other',
  onProgress?: (pct: number) => void,
): Promise<UploadedImage> => {
  const formData = new FormData();

  formData.append('file', {
    uri: imageUri,
    name: fileName,
    type: 'image/jpeg',
  } as any);

  formData.append('claimId', claimId);
  formData.append('imageType', imageType);

  const { data } = await apiClient.post<ApiResponse<UploadedImage>>(
    '/images/upload',
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent: AxiosProgressEvent) => {
        if (progressEvent.total && onProgress) {
          const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(pct);
        }
      },
    },
  );

  return data.data;
};

/**
 * GET /images?claimId=xxx
 */
export const getClaimImages = async (claimId: string): Promise<UploadedImage[]> => {
  const { data } = await apiClient.get<ApiResponse<UploadedImage[]>>(
    `/images?claimId=${claimId}`,
  );
  return data.data;
};

/**
 * POST /images/:id/retry
 */
export const retryImageAnalysis = async (imageId: string): Promise<{ message: string }> => {
  const { data } = await apiClient.post<ApiResponse<{ message: string }>>(
    `/images/${imageId}/retry`,
  );
  return data.data;
};

/**
 * DELETE /images/:id
 */
export const deleteImage = async (imageId: string): Promise<void> => {
  await apiClient.delete(`/images/${imageId}`);
};

/**
 * Зургийн public URL авах
 */
export const getImageUrl = (fileUrl: string): string => {
  if (!fileUrl) return '';
  if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) return fileUrl;
  if (fileUrl.startsWith('/uploads/')) {
    const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';
    const baseUrl = apiUrl.replace('/api/v1', '').replace(/\/$/, '');
    return `${baseUrl}${fileUrl}`;
  }
  return fileUrl;
};