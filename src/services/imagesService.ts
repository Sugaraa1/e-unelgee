import apiClient from './apiClient';
import type { ApiResponse } from '../types';

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
  // AI Analysis fields (optional)
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
 * multipart/form-data: file + claimId
 */
export const uploadClaimImage = async (
  claimId: string,
  imageUri: string,
  fileName: string = 'photo.jpg',
): Promise<UploadedImage> => {
  const formData = new FormData();

  // React Native-д file object ийм байдлаар FormData-д оруулна
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
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      // Upload явцыг хянах (optional)
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percent = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total,
          );
          console.log(`Upload progress: ${percent}%`);
        }
      },
    },
  );

  return data.data;
};

/**
 * GET /images?claimId=xxx
 * Claim-ийн бүх зургийг авах
 */
export const getClaimImages = async (claimId: string): Promise<UploadedImage[]> => {
  const { data } = await apiClient.get<ApiResponse<UploadedImage[]>>(
    `/images?claimId=${claimId}`,
  );
  return data.data;
};

/**
 * Helper function to construct proper image URL
 * Handles both relative (/uploads/...) and absolute (http://...) URLs
 */
export const getImageUrl = (fileUrl: string): string => {
  if (!fileUrl) return '';
  
  // If it's already an absolute URL, return it
  if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
    return fileUrl;
  }
  
  // If it's a relative path, construct full URL
  if (fileUrl.startsWith('/uploads/')) {
    const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.100:3000/api/v1';
    const baseUrl = API_BASE_URL.replace('/api/v1', '');
    return `${baseUrl}${fileUrl}`;
  }
  
  return fileUrl;
};