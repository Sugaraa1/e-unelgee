/**
 * ADJUSTER SERVICE - Mobile Integration
 * 
 * Adjuster-ийн claim үнэлгээ, зөвшөөрөл, төлбөрийн дүн өөрчлөх үйлдлүүд
 */

import apiClient from './apiClient';
import type { ApiResponse } from '../types';

export interface ClaimDecision {
  claimId: string;
  decision: 'auto_approve' | 'needs_review' | 'total_loss';
  suggestedPayout: number;
  riskLevel: 'low' | 'medium' | 'high';
  requiresManualReview: boolean;
  reason: string;
  confidence: number;
  createdAt: string;
}

export interface AdjustmentResult {
  claimId: string;
  newPayout: number;
  adjustmentReason: string;
  adjustedBy: string;
  adjustmentPercentage: number;
}

export interface FraudCheckResult {
  isSuspicious: boolean;
  flags: string[];
}

/**
 * Claim-г AI үнэлгээнээс автоматаар үнэлэх
 * POST /claims/:id/evaluate
 */
export const evaluateClaim = async (
  claimId: string,
): Promise<ClaimDecision> => {
  const { data } = await apiClient.post<ApiResponse<ClaimDecision>>(
    `/claims/${claimId}/evaluate`,
  );
  return data.data;
};

/**
 * Шалгалт хэрэгтэй claim-ийн жагсаалт авах
 * GET /claims/review
 */
export const getClaimsRequiringReview = async (): Promise<any[]> => {
  const { data } = await apiClient.get<ApiResponse<any[]>>(`/claims/review`);
  return data.data;
};

/**
 * Claim-г зөвшөөрөх
 * POST /claims/:id/approve
 */
export const approveClaim = async (claimId: string): Promise<any> => {
  const { data } = await apiClient.post<ApiResponse<any>>(
    `/claims/${claimId}/approve`,
  );
  return data.data;
};

/**
 * Claim-г татгалзах
 * POST /claims/:id/reject
 */
export const rejectClaim = async (
  claimId: string,
  reason: string,
): Promise<any> => {
  const { data } = await apiClient.post<ApiResponse<any>>(
    `/claims/${claimId}/reject`,
    { reason },
  );
  return data.data;
};

/**
 * Claim-ийн төлбөрийн дүнг өөрчлөх
 * PATCH /claims/:id/adjust
 */
export const adjustClaimPayout = async (
  claimId: string,
  newPayout: number,
  reason: string,
): Promise<AdjustmentResult> => {
  const { data } = await apiClient.patch<ApiResponse<AdjustmentResult>>(
    `/claims/${claimId}/adjust`,
    { newPayout, reason },
  );
  return data.data;
};

/**
 * Claim-ийг хууль бус байдлыг шалгах
 * GET /claims/:id/fraud-check
 */
export const checkClaimFraud = async (
  claimId: string,
): Promise<FraudCheckResult> => {
  const { data } = await apiClient.get<ApiResponse<FraudCheckResult>>(
    `/claims/${claimId}/fraud-check`,
  );
  return data.data;
};
