import apiClient from './apiClient';

export interface DashboardStats {
  totalUsers: number;
  totalClaims: number;
  totalVehicles: number;
  totalImages: number;
  pendingClaims: number;
  approvedClaims: number;
  rejectedClaims: number;
  totalPayoutAmount: number;
  avgClaimAmount: number;
}

export interface QuickStats {
  todayClaims: number;
  weekClaims: number;
  monthClaims: number;
  todayPayout: number;
}

export interface ClaimsByStatus {
  status: string;
  count: number;
}

export interface ClaimsByDay {
  date: string;
  count: number;
}

export interface DamageTypeStats {
  damageType: string;
  count: number;
  percentage: number;
}

export interface HighRiskClaimSummary {
  id: string;
  claimId?: string;
  claimNumber: string;
  vehicleInfo: string;
  riskLevel: 'low' | 'medium' | 'high';
  suggestedPayout: number;
  status: string;
  createdAt: string;
}

export interface FraudAlert {
  id: string;
  claimId?: string;
  claimNumber: string;
  suspiciousLevel: 'medium' | 'high';
  flags: string[];
  createdAt: string;
}

// ── Шинэ: Санал нийлэхгүй claim ─────────────────────────────
export interface DisputedClaim {
  id: string;
  claimNumber: string;
  status: string;
  disputeReason: string;
  estimatedRepairCost: number | null;
  accidentType: string;
  accidentLocation: string;
  accidentDate: string;
  submittedBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
  } | null;
  vehicleInfo: string;
  createdAt: string;
  updatedAt: string;
}

function extractData<T>(responseData: any): T {
  if (!responseData) return responseData as T;
  if (
    responseData.data !== undefined &&
    typeof responseData.data === 'object' &&
    responseData.data !== null &&
    'data' in responseData.data
  ) {
    return responseData.data.data as T;
  }
  if (responseData.data !== undefined) {
    return responseData.data as T;
  }
  return responseData as T;
}

class AdminService {
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await apiClient.get('/admin/stats');
    return extractData<DashboardStats>(response.data);
  }

  async getQuickStats(): Promise<QuickStats> {
    const response = await apiClient.get('/admin/quick-stats');
    return extractData<QuickStats>(response.data);
  }

  async getClaimsByStatus(): Promise<ClaimsByStatus[]> {
    const response = await apiClient.get('/admin/claims-by-status');
    const data = extractData<ClaimsByStatus[]>(response.data);
    return Array.isArray(data) ? data : [];
  }

  async getClaimsByDay(days: number = 7): Promise<ClaimsByDay[]> {
    const response = await apiClient.get('/admin/claims-by-day', {
      params: { days },
    });
    const data = extractData<ClaimsByDay[]>(response.data);
    return Array.isArray(data) ? data : [];
  }

  async getTopDamageTypes(limit: number = 10): Promise<DamageTypeStats[]> {
    const response = await apiClient.get('/admin/top-damage-types', {
      params: { limit },
    });
    const data = extractData<DamageTypeStats[]>(response.data);
    return Array.isArray(data) ? data : [];
  }

  async getHighRiskClaims(limit: number = 20): Promise<HighRiskClaimSummary[]> {
    const response = await apiClient.get('/admin/high-risk-claims', {
      params: { limit },
    });
    const data = extractData<HighRiskClaimSummary[]>(response.data);
    return Array.isArray(data) ? data : [];
  }

  async getFraudAlerts(limit: number = 20): Promise<FraudAlert[]> {
    const response = await apiClient.get('/admin/fraud-alerts', {
      params: { limit },
    });
    const data = extractData<FraudAlert[]>(response.data);
    return Array.isArray(data) ? data : [];
  }

  // ── Шинэ: Санал нийлэхгүй claim-үүд ─────────────────────
  async getDisputedClaims(limit: number = 50): Promise<DisputedClaim[]> {
    const response = await apiClient.get('/admin/disputed-claims', {
      params: { limit },
    });
    const data = extractData<DisputedClaim[]>(response.data);
    return Array.isArray(data) ? data : [];
  }
}

export default new AdminService();