import apiClient from './apiClient';

// ── Response types ────────────────────────────────────────────

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

// ── Helper: response-г зөв задлах ────────────────────────────
// TransformInterceptor болон AdminController хоёулаа
// { success, data } гэж wrap хийдэг тул давхар болно:
// axios response.data → { success, data: { success, data: realData } }
// Эсвэл зөвхөн нэг давхар:
// axios response.data → { success, data: realData }
function extractData<T>(responseData: any): T {
  if (!responseData) return responseData as T;

  // Давхар wrap: { success, data: { success, data: real } }
  if (
    responseData.data !== undefined &&
    typeof responseData.data === 'object' &&
    responseData.data !== null &&
    'data' in responseData.data
  ) {
    return responseData.data.data as T;
  }

  // Нэг давхар: { success, data: real }
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

  async refreshDashboardData() {
    return Promise.all([
      this.getDashboardStats(),
      this.getQuickStats(),
      this.getClaimsByStatus(),
      this.getClaimsByDay(7),
      this.getTopDamageTypes(10),
      this.getHighRiskClaims(20),
      this.getFraudAlerts(20),
    ]);
  }
}

export default new AdminService();