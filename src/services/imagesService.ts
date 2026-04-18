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
  status: string;
  createdAt: string;
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