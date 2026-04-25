// FIX: retryImageAnalysis now calls the backend retry endpoint
import apiClient from './apiClient';
import type { ApiResponse } from '../types';
import type { AxiosProgressEvent } from 'axios';

export interface UploadedImage {
  id: string;
  claimId: string;
  originalName: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  fileSize: number;
  imageType: string;
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
 */
export const uploadClaimImage = async (
  claimId: string,
  imageUri: string,
  fileName: string = 'photo.jpg',
): Promise<UploadedImage> => {
  const formData = new FormData();

  formData.append('file', {
    uri: imageUri,
    name: fileName,
    type: 'image/jpeg',
  } as any);

  formData.append('claimId', claimId);

  const { data } = await apiClient.post<ApiResponse<UploadedImage>>(
    '/images/upload',
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent: AxiosProgressEvent) => {
        if (progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`Upload: ${percent}%`);
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
 * FIX: POST /images/:id/retry — calls the new backend retry endpoint
 * Previously only reset local state; now triggers server-side re-analysis
 */
export const retryImageAnalysis = async (imageId: string): Promise<{ message: string }> => {
  const { data } = await apiClient.post<ApiResponse<{ message: string }>>(
    `/images/${imageId}/retry`,
  );
  return data.data;
};

/**
 * Helper: construct proper image URL from relative or absolute path
 * FIX: Uses EXPO_PUBLIC_API_URL env var consistently
 */
export const getImageUrl = (fileUrl: string): string => {
  if (!fileUrl) return '';

  if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
    return fileUrl;
  }

  if (fileUrl.startsWith('/uploads/')) {
    const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';
    const baseUrl = apiUrl.replace('/api/v1', '').replace(/\/$/, '');
    return `${baseUrl}${fileUrl}`;
  }

  return fileUrl;
};