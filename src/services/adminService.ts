import apiClient from './apiClient';

// Response types from backend
export interface DashboardStats {
  totalUsers: number;
  totalClaims: number;
  totalVehicles: number;
  totalImages: number;
  totalPayouts: number;
  averagePayoutAmount: number;
  averageClaimValue: number;
  approvedCount: number;
  pendingCount: number;
}

export interface QuickStats {
  today: {
    claims: number;
    payouts: number;
  };
  thisWeek: {
    claims: number;
    payouts: number;
  };
  thisMonth: {
    claims: number;
    payouts: number;
  };
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
  claimId: string;
  claimNumber: string;
  vehicleInfo: string;
  riskLevel: string;
  suggestedPayout: number;
  status: string;
  createdAt: string;
}

export interface FraudAlertFlag {
  type: string;
  description: string;
}

export interface FraudAlert {
  claimId: string;
  claimNumber: string;
  suspiciousLevel: 'low' | 'medium' | 'high';
  flags: FraudAlertFlag[];
  suggestedPayout: number;
  createdAt: string;
}

export interface AdminDashboardResponse<T> {
  success: boolean;
  data: T;
}

class AdminService {
  /**
   * Get overall dashboard statistics
   */
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await apiClient.get<AdminDashboardResponse<DashboardStats>>(
      '/admin/stats'
    );
    return response.data.data;
  }

  /**
   * Get quick stats for today, this week, and this month
   */
  async getQuickStats(): Promise<QuickStats> {
    const response = await apiClient.get<AdminDashboardResponse<QuickStats>>(
      '/admin/quick-stats'
    );
    return response.data.data;
  }

  /**
   * Get claims grouped by status
   */
  async getClaimsByStatus(): Promise<ClaimsByStatus[]> {
    const response = await apiClient.get<AdminDashboardResponse<ClaimsByStatus[]>>(
      '/admin/claims-by-status'
    );
    return response.data.data;
  }

  /**
   * Get daily claim counts
   * @param days Number of days to retrieve (default: 7)
   */
  async getClaimsByDay(days: number = 7): Promise<ClaimsByDay[]> {
    const response = await apiClient.get<AdminDashboardResponse<ClaimsByDay[]>>(
      '/admin/claims-by-day',
      { params: { days } }
    );
    return response.data.data;
  }

  /**
   * Get top damage types by frequency
   * @param limit Number of types to retrieve (default: 10)
   */
  async getTopDamageTypes(limit: number = 10): Promise<DamageTypeStats[]> {
    const response = await apiClient.get<AdminDashboardResponse<DamageTypeStats[]>>(
      '/admin/top-damage-types',
      { params: { limit } }
    );
    return response.data.data;
  }

  /**
   * Get high-risk claims that need attention
   * @param limit Number of claims to retrieve (default: 20)
   */
  async getHighRiskClaims(limit: number = 20): Promise<HighRiskClaimSummary[]> {
    const response = await apiClient.get<AdminDashboardResponse<HighRiskClaimSummary[]>>(
      '/admin/high-risk-claims',
      { params: { limit } }
    );
    return response.data.data;
  }

  /**
   * Get fraud alerts for suspicious claims
   * @param limit Number of alerts to retrieve (default: 20)
   */
  async getFraudAlerts(limit: number = 20): Promise<FraudAlert[]> {
    const response = await apiClient.get<AdminDashboardResponse<FraudAlert[]>>(
      '/admin/fraud-alerts',
      { params: { limit } }
    );
    return response.data.data;
  }

  /**
   * Refresh all dashboard data
   */
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
