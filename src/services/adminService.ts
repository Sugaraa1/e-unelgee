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

// ✅ Backend-ийн getQuickStats()-тай таарсан interface
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
  // ✅ backend AdminService-с ирэх field нэрс
  id: string;
  claimId?: string;          // backward compat
  claimNumber: string;
  vehicleInfo: string;
  riskLevel: 'low' | 'medium' | 'high';
  suggestedPayout: number;
  status: string;
  createdAt: string;
}

// ✅ flags нь string[] — object биш
export interface FraudAlert {
  id: string;
  claimId?: string;         // backward compat
  claimNumber: string;
  suspiciousLevel: 'medium' | 'high';
  flags: string[];
  createdAt: string;
}

export interface AdminDashboardResponse<T> {
  success: boolean;
  data: T;
}

class AdminService {
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await apiClient.get<AdminDashboardResponse<DashboardStats>>(
      '/admin/stats',
    );
    return response.data.data;
  }

  async getQuickStats(): Promise<QuickStats> {
    const response = await apiClient.get<AdminDashboardResponse<QuickStats>>(
      '/admin/quick-stats',
    );
    return response.data.data;
  }

  async getClaimsByStatus(): Promise<ClaimsByStatus[]> {
    const response = await apiClient.get<AdminDashboardResponse<ClaimsByStatus[]>>(
      '/admin/claims-by-status',
    );
    return response.data.data;
  }

  async getClaimsByDay(days: number = 7): Promise<ClaimsByDay[]> {
    const response = await apiClient.get<AdminDashboardResponse<ClaimsByDay[]>>(
      '/admin/claims-by-day',
      { params: { days } },
    );
    return response.data.data;
  }

  async getTopDamageTypes(limit: number = 10): Promise<DamageTypeStats[]> {
    const response = await apiClient.get<AdminDashboardResponse<DamageTypeStats[]>>(
      '/admin/top-damage-types',
      { params: { limit } },
    );
    return response.data.data;
  }

  async getHighRiskClaims(
    limit: number = 20,
  ): Promise<HighRiskClaimSummary[]> {
    const response = await apiClient.get<AdminDashboardResponse<HighRiskClaimSummary[]>>(
      '/admin/high-risk-claims',
      { params: { limit } },
    );
    return response.data.data;
  }

  async getFraudAlerts(limit: number = 20): Promise<FraudAlert[]> {
    const response = await apiClient.get<AdminDashboardResponse<FraudAlert[]>>(
      '/admin/fraud-alerts',
      { params: { limit } },
    );
    return response.data.data;
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