// ── Colors ────────────────────────────────────────────────────
export const COLORS = {
  primary:    '#1A56DB',
  primaryDark:'#1344b8',
  secondary:  '#0E9F6E',
  danger:     '#E02424',
  warning:    '#FF8A00',
  info:       '#3F83F8',

  background: '#F9FAFB',
  surface:    '#FFFFFF',
  border:     '#E5E7EB',

  text:       '#111928',
  textMuted:  '#6B7280',
  textLight:  '#9CA3AF',

  white:      '#FFFFFF',
  black:      '#000000',
} as const;

// ── Claim status colors ───────────────────────────────────────
export const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  draft:               { bg: '#F3F4F6', text: '#374151' },
  submitted:           { bg: '#EFF6FF', text: '#1D4ED8' },
  under_review:        { bg: '#FEF3C7', text: '#92400E' },
  ai_processing:       { bg: '#EDE9FE', text: '#5B21B6' },
  pending_inspection:  { bg: '#FEF3C7', text: '#92400E' },
  approved:            { bg: '#D1FAE5', text: '#065F46' },
  partially_approved:  { bg: '#D1FAE5', text: '#065F46' },
  rejected:            { bg: '#FEE2E2', text: '#991B1B' },
  closed:              { bg: '#F3F4F6', text: '#374151' },
};

// ── Spacing ───────────────────────────────────────────────────
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

// ── Border radius ─────────────────────────────────────────────
export const RADIUS = {
  sm: 6,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

// ── Font sizes ────────────────────────────────────────────────
export const FONT_SIZE = {
  xs:   11,
  sm:   13,
  md:   15,
  lg:   17,
  xl:   20,
  xxl:  24,
  xxxl: 30,
} as const;

// ── API Endpoints ─────────────────────────────────────────────
export const ENDPOINTS = {
  AUTH: {
    REGISTER:  '/auth/register',
    LOGIN:     '/auth/login',
    LOGOUT:    '/auth/logout',
    REFRESH:   '/auth/refresh',
    ME:        '/auth/me',
  },
  VEHICLES: {
    BASE:   '/vehicles',
    BY_ID:  (id: string) => `/vehicles/${id}`,
  },
  CLAIMS: {
    BASE:   '/claims',
    BY_ID:  (id: string) => `/claims/${id}`,
    IMAGES: (id: string) => `/claims/${id}/images`,
  },
} as const;

// ── Storage keys ──────────────────────────────────────────────
export const STORAGE_KEYS = {
  ACCESS_TOKEN:  'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER:          'user_data',
} as const;