// ── Auth ──────────────────────────────────────────────────────
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  role: 'user' | 'adjuster' | 'admin';
  status: 'active' | 'inactive' | 'suspended';
  avatarUrl?: string;
  insurancePolicyNumber?: string;
  insuranceProvider?: string;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// ── API ───────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

export interface ApiError {
  success: false;
  statusCode: number;
  message: string | string[];
  error?: string;
}

// ── Vehicle ───────────────────────────────────────────────────
export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  color: string;
  licensePlate: string;
  vin?: string;
  fuelType: 'petrol' | 'diesel' | 'electric' | 'hybrid' | 'lpg';
  mileage?: number;
  estimatedValue?: number;
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  insuranceExpiryDate?: string;
  ownerId: string;
  createdAt: string;
}

// ── Claim ─────────────────────────────────────────────────────
export type ClaimStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'ai_processing'
  | 'pending_inspection'
  | 'approved'
  | 'partially_approved'
  | 'rejected'
  | 'closed';

export type AccidentType =
  | 'collision'
  | 'rear_end'
  | 'side_impact'
  | 'rollover'
  | 'hit_and_run'
  | 'weather'
  | 'vandalism'
  | 'theft'
  | 'fire'
  | 'flood'
  | 'other';

export type AccidentSeverity = 'minor' | 'moderate' | 'severe' | 'total_loss';

export interface Claim {
  id: string;
  claimNumber: string;
  status: ClaimStatus;

  // ── Accident details ───────────────────────────────────────
  accidentDate: string;
  accidentLocation: string;
  accidentType: AccidentType;
  severity?: AccidentSeverity;
  description: string;
  latitude?: number;
  longitude?: number;

  // ── Third party ────────────────────────────────────────────
  thirdPartyInvolved: boolean;
  thirdPartyName?: string;
  thirdPartyLicensePlate?: string;
  thirdPartyInsurance?: string;
  thirdPartyPolicyNumber?: string;

  // ── Police report ──────────────────────────────────────────
  policeReportFiled: boolean;
  policeReportNumber?: string;

  // ── Financial ──────────────────────────────────────────────
  estimatedRepairCost?: number;
  approvedAmount?: number;
  deductibleAmount?: number;

  // ── Relations ──────────────────────────────────────────────
  vehicleId: string;
  vehicle?: Vehicle;
  submittedById?: string;

  // ── Timestamps ─────────────────────────────────────────────
  createdAt: string;
  updatedAt?: string;
}

// ── Navigation ────────────────────────────────────────────────
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Claims: undefined;
  Vehicles: undefined;
  Profile: undefined;
};

export type ClaimsStackParamList = {
  ClaimsList: undefined;
  ClaimDetail: { claimId: string };
  NewClaim: { vehicleId?: string };
  UploadImages: { claimId: string };
};