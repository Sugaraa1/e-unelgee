import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import adminService, {
  DashboardStats,
  QuickStats,
  ClaimsByStatus,
  ClaimsByDay,
  DamageTypeStats,
  HighRiskClaimSummary,
  FraudAlert,
  DisputedClaim,
} from '../../services/adminService';
import {
  StatCard,
  RiskBadge,
  StatusBadgeAdmin,
  InfoRow,
} from '../../components/AdminDashboardComponents';
import { COLORS, SPACING, RADIUS, FONT_SIZE } from '../../constants';

// ── Хялбар Helper ─────────────────────────────────────────────
async function safeCall<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    const result = await fn();
    return result ?? fallback;
  } catch (e: any) {
    console.warn('[Admin] API алдаа:', e?.response?.status, e?.message);
    return fallback;
  }
}

const ACCIDENT_TYPE_MN: Record<string, string> = {
  collision: 'Мөргөлдөөн',
  rear_end: 'Ар талаас',
  side_impact: 'Хажуугийн цохилт',
  rollover: 'Эргэлт',
  hit_and_run: 'Зугтсан',
  weather: 'Цаг агаар',
  vandalism: 'Эвдрэл/Хулгай',
  theft: 'Хулгай',
  fire: 'Түймэр',
  flood: 'Үер',
  other: 'Бусад',
};

// ═══════════════════════════════════════════════════════════════
// DISPUTED CLAIM DETAIL MODAL
// ═══════════════════════════════════════════════════════════════
const DisputedClaimModal = ({
  claim,
  visible,
  onClose,
}: {
  claim: DisputedClaim | null;
  visible: boolean;
  onClose: () => void;
}) => {
  if (!claim) return null;

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('mn-MN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '—';
    return `₮${Number(amount).toLocaleString()}`;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={ms.safe}>
        {/* Header */}
        <View style={ms.header}>
          <TouchableOpacity style={ms.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={22} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={ms.headerTitle}>Санал нийлэхгүй claim</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          contentContainerStyle={ms.body}
          showsVerticalScrollIndicator={false}
        >
          {/* Claim дугаар + статус */}
          <View style={ms.claimHeroCard}>
            <View style={ms.claimHeroTop}>
              <View style={ms.claimHeroIcon}>
                <Ionicons name="document-text" size={22} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={ms.claimHeroNumber}>{claim.claimNumber}</Text>
                <Text style={ms.claimHeroDate}>
                  Шинэчлэгдсэн: {formatDate(claim.updatedAt)}
                </Text>
              </View>
              <View style={ms.disputeBadge}>
                <Ionicons name="close-circle" size={13} color={COLORS.danger} />
                <Text style={ms.disputeBadgeText}>Санал нийлэхгүй</Text>
              </View>
            </View>
          </View>

          {/* ── Хэрэглэгчийн тайлбар — ГОЛ ХЭСЭГ ── */}
          <View style={ms.reasonCard}>
            <View style={ms.reasonHeader}>
              <View style={ms.reasonIconWrap}>
                <Ionicons name="chatbubble-ellipses" size={18} color={COLORS.danger} />
              </View>
              <Text style={ms.reasonTitle}>Хэрэглэгчийн тайлбар</Text>
            </View>
            <View style={ms.reasonBody}>
              <Text style={ms.reasonText}>{claim.disputeReason}</Text>
            </View>
          </View>

          {/* ── AI үнэлгээний мэдээлэл ── */}
          <View style={ms.section}>
            <View style={ms.sectionHeader}>
              <Ionicons name="sparkles" size={15} color="#7C3AED" />
              <Text style={ms.sectionTitle}>AI үнэлгээ</Text>
            </View>
            <View style={ms.infoCard}>
              <View style={ms.infoRow}>
                <Text style={ms.infoLabel}>Тооцоолсон зардал</Text>
                <Text style={[ms.infoValue, { color: '#7C3AED', fontWeight: '800' }]}>
                  {formatCurrency(claim.estimatedRepairCost)}
                </Text>
              </View>
              <View style={[ms.infoRow, { borderBottomWidth: 0 }]}>
                <Text style={ms.infoLabel}>Ослын төрөл</Text>
                <Text style={ms.infoValue}>
                  {ACCIDENT_TYPE_MN[claim.accidentType] ?? claim.accidentType}
                </Text>
              </View>
            </View>
          </View>

          {/* ── Хэрэглэгчийн мэдээлэл ── */}
          {claim.submittedBy && (
            <View style={ms.section}>
              <View style={ms.sectionHeader}>
                <Ionicons name="person-circle-outline" size={15} color={COLORS.primary} />
                <Text style={ms.sectionTitle}>Хэрэглэгч</Text>
              </View>
              <View style={ms.infoCard}>
                <View style={ms.userRow}>
                  <View style={ms.userAvatar}>
                    <Text style={ms.userAvatarText}>
                      {`${claim.submittedBy.firstName?.[0] ?? ''}${claim.submittedBy.lastName?.[0] ?? ''}`.toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={ms.userName}>
                      {claim.submittedBy.firstName} {claim.submittedBy.lastName}
                    </Text>
                    <Text style={ms.userEmail}>{claim.submittedBy.email}</Text>
                  </View>
                </View>
                <View style={ms.infoDivider} />
                <View style={ms.infoRow}>
                  <Text style={ms.infoLabel}>Утас</Text>
                  <Text style={ms.infoValue}>
                    {claim.submittedBy.phoneNumber || '—'}
                  </Text>
                </View>
                <View style={[ms.infoRow, { borderBottomWidth: 0 }]}>
                  <Text style={ms.infoLabel}>Имэйл</Text>
                  <Text style={ms.infoValue}>{claim.submittedBy.email}</Text>
                </View>
              </View>
            </View>
          )}

          {/* ── Ослын мэдээлэл ── */}
          <View style={ms.section}>
            <View style={ms.sectionHeader}>
              <Ionicons name="warning-outline" size={15} color={COLORS.warning} />
              <Text style={ms.sectionTitle}>Ослын мэдээлэл</Text>
            </View>
            <View style={ms.infoCard}>
              <View style={ms.infoRow}>
                <Text style={ms.infoLabel}>Огноо</Text>
                <Text style={ms.infoValue}>{formatDate(claim.accidentDate)}</Text>
              </View>
              <View style={[ms.infoRow, { borderBottomWidth: 0 }]}>
                <Text style={ms.infoLabel}>Байршил</Text>
                <Text style={[ms.infoValue, { flex: 2 }]} numberOfLines={2}>
                  {claim.accidentLocation}
                </Text>
              </View>
            </View>
          </View>

          {/* ── Тээвэр хэрэгсэл ── */}
          <View style={ms.section}>
            <View style={ms.sectionHeader}>
              <Ionicons name="car-outline" size={15} color={COLORS.secondary} />
              <Text style={ms.sectionTitle}>Тээвэр хэрэгсэл</Text>
            </View>
            <View style={ms.vehicleCard}>
              <Ionicons name="car-sport" size={20} color={COLORS.secondary} />
              <Text style={ms.vehicleText}>{claim.vehicleInfo}</Text>
            </View>
          </View>

          {/* ── Санал болгох үйлдлүүд ── */}
          <View style={ms.section}>
            <View style={ms.sectionHeader}>
              <Ionicons name="hammer-outline" size={15} color={COLORS.primary} />
              <Text style={ms.sectionTitle}>Үйлдэл</Text>
            </View>
            <View style={ms.actionsCard}>
              {[
                {
                  icon: 'call-outline',
                  color: COLORS.primary,
                  bg: '#EFF6FF',
                  title: 'Хэрэглэгчтэй холбоо барих',
                  desc: `${claim.submittedBy?.phoneNumber ?? ''} утсаар залгах`,
                },
                {
                  icon: 'checkmark-circle-outline',
                  color: COLORS.secondary,
                  bg: '#ECFDF5',
                  title: 'Үнэлгээг батлах',
                  desc: 'AI үнэлгээ зөв гэж үзвэл баталгаажуулна',
                },
                {
                  icon: 'create-outline',
                  color: COLORS.warning,
                  bg: '#FFF8EE',
                  title: 'Үнэлгээ засах',
                  desc: 'Хэрэглэгчийн санал үнэн бол дүнг өөрчилнэ',
                },
                {
                  icon: 'close-circle-outline',
                  color: COLORS.danger,
                  bg: '#FEF2F2',
                  title: 'Хүсэлтийг татгалзах',
                  desc: 'Хэрэглэгчийн санал үндэслэлгүй бол татгалзана',
                },
              ].map((action, i, arr) => (
                <View
                  key={i}
                  style={[
                    ms.actionRow,
                    i === arr.length - 1 && { borderBottomWidth: 0 },
                  ]}
                >
                  <View style={[ms.actionIcon, { backgroundColor: action.bg }]}>
                    <Ionicons name={action.icon as any} size={18} color={action.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={ms.actionTitle}>{action.title}</Text>
                    <Text style={ms.actionDesc}>{action.desc}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={COLORS.textLight} />
                </View>
              ))}
            </View>
          </View>

          <View style={{ height: SPACING.xl }} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

// ═══════════════════════════════════════════════════════════════
// FRAUD DETAIL MODAL
// ═══════════════════════════════════════════════════════════════
const FraudDetailModal = ({
  alert,
  visible,
  onClose,
}: {
  alert: FraudAlert | null;
  visible: boolean;
  onClose: () => void;
}) => {
  if (!alert) return null;

  const isHigh = alert.suspiciousLevel === 'high';
  const color = isHigh ? '#F44336' : '#FFC107';
  const bgColor = isHigh ? '#FEF2F2' : '#FFFBEB';

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('mn-MN', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch { return dateStr; }
  };

  const ACTION_ITEMS = [
    { icon: 'eye-outline', color: COLORS.primary, bg: '#EFF6FF', title: 'Нарийвчлан шалгах', desc: 'Claim-ийн бүх мэдээллийг дэлгэрэнгүй шалгана уу' },
    { icon: 'call-outline', color: COLORS.secondary, bg: '#ECFDF5', title: 'Хэрэглэгчтэй холбоо барих', desc: 'Нэмэлт мэдээлэл авахын тулд холбоо барина уу' },
    { icon: 'document-text-outline', color: COLORS.warning, bg: '#FFF8EE', title: 'Баримт бичиг шаардах', desc: 'Нэмэлт баримт бичиг, зурагны хүсэлт гаргана уу' },
    { icon: 'ban-outline', color: COLORS.danger, bg: '#FEF2F2', title: 'Татгалзах', desc: 'Сэжигтэй тохиолдолд claim-г татгалзана уу' },
  ];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={ms.safe}>
        <View style={ms.header}>
          <TouchableOpacity style={ms.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={22} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={ms.headerTitle}>Сэжигтэй claim</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView contentContainerStyle={ms.body} showsVerticalScrollIndicator={false}>
          <View style={[ms.claimHeroCard, { backgroundColor: bgColor, borderColor: color + '40', borderWidth: 1.5 }]}>
            <View style={ms.claimHeroTop}>
              <View style={[ms.claimHeroIcon, { backgroundColor: color + '20' }]}>
                <Ionicons name={isHigh ? 'alert-circle' : 'warning'} size={22} color={color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[ms.claimHeroNumber]}>{alert.claimNumber}</Text>
                <Text style={ms.claimHeroDate}>{formatDate(alert.createdAt)}</Text>
              </View>
              <View style={[ms.disputeBadge, { backgroundColor: color + '20', borderColor: color + '40' }]}>
                <Text style={[ms.disputeBadgeText, { color }]}>{isHigh ? 'Өндөр' : 'Дунд'}</Text>
              </View>
            </View>
          </View>

          <View style={ms.section}>
            <View style={ms.sectionHeader}>
              <Ionicons name="flag" size={15} color={COLORS.danger} />
              <Text style={ms.sectionTitle}>Сэжигтэй үзүүлэлт ({alert.flags.length})</Text>
            </View>
            <View style={ms.infoCard}>
              {alert.flags.map((flag, i) => (
                <View key={i} style={[ms.infoRow, i === alert.flags.length - 1 && { borderBottomWidth: 0 }]}>
                  <View style={[ms.flagDot, { backgroundColor: color }]} />
                  <Text style={[ms.infoValue, { flex: 1, textAlign: 'left' }]}>{flag}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={ms.section}>
            <View style={ms.sectionHeader}>
              <Ionicons name="shield-checkmark-outline" size={15} color={COLORS.primary} />
              <Text style={ms.sectionTitle}>Санал болгох үйлдэл</Text>
            </View>
            <View style={ms.actionsCard}>
              {ACTION_ITEMS.map((action, i) => (
                <View key={i} style={[ms.actionRow, i === ACTION_ITEMS.length - 1 && { borderBottomWidth: 0 }]}>
                  <View style={[ms.actionIcon, { backgroundColor: action.bg }]}>
                    <Ionicons name={action.icon as any} size={18} color={action.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={ms.actionTitle}>{action.title}</Text>
                    <Text style={ms.actionDesc}>{action.desc}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={COLORS.textLight} />
                </View>
              ))}
            </View>
          </View>

          <View style={[ms.warningBox, { backgroundColor: color + '10', borderColor: color + '30' }]}>
            <Ionicons name="information-circle-outline" size={16} color={color} />
            <Text style={ms.warningText}>
              {isHigh
                ? 'Энэ claim нь өндөр эрсдэлтэй тул яаралтай шалгалт хийх шаардлагатай.'
                : 'Энэ claim-д сэжигтэй үзүүлэлтүүд илэрсэн. Нэмэлт шалгалт хийхийг зөвлөж байна.'}
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

// ═══════════════════════════════════════════════════════════════
// DISPUTED CLAIM CARD
// ═══════════════════════════════════════════════════════════════
const DisputedClaimCard = ({
  claim,
  onPress,
}: {
  claim: DisputedClaim;
  onPress: (claim: DisputedClaim) => void;
}) => {
  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('mn-MN', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
      });
    } catch { return dateStr; }
  };

  return (
    <TouchableOpacity
      style={styles.disputedCard}
      onPress={() => onPress(claim)}
      activeOpacity={0.75}
    >
      {/* Header */}
      <View style={styles.disputedCardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.disputedClaimNumber}>{claim.claimNumber}</Text>
          <Text style={styles.disputedDate}>{formatDate(claim.updatedAt)}</Text>
        </View>
        <View style={styles.disputedRightRow}>
          <View style={styles.disputedBadge}>
            <Ionicons name="close-circle" size={12} color={COLORS.danger} />
            <Text style={styles.disputedBadgeText}>Санал нийлэхгүй</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={COLORS.textLight} />
        </View>
      </View>

      {/* Хэрэглэгчийн тайлбар */}
      <View style={styles.disputedReasonBox}>
        <Ionicons name="chatbubble-ellipses-outline" size={14} color={COLORS.danger} style={{ marginTop: 1 }} />
        <Text style={styles.disputedReasonText} numberOfLines={2}>
          {claim.disputeReason}
        </Text>
      </View>

      {/* Мэдээлэл мөрүүд */}
      <View style={styles.disputedMetaRow}>
        <View style={styles.disputedMeta}>
          <Ionicons name="person-outline" size={12} color={COLORS.textMuted} />
          <Text style={styles.disputedMetaText}>
            {claim.submittedBy
              ? `${claim.submittedBy.firstName} ${claim.submittedBy.lastName}`
              : '—'}
          </Text>
        </View>
        {claim.estimatedRepairCost && (
          <View style={styles.disputedMeta}>
            <Ionicons name="sparkles" size={12} color="#7C3AED" />
            <Text style={[styles.disputedMetaText, { color: '#7C3AED', fontWeight: '700' }]}>
              ₮{Number(claim.estimatedRepairCost).toLocaleString()}
            </Text>
          </View>
        )}
      </View>

      {/* Tap hint */}
      <View style={styles.disputedTapHint}>
        <Ionicons name="information-circle-outline" size={12} color={COLORS.textLight} />
        <Text style={styles.disputedTapHintText}>Дэлгэрэнгүй харах</Text>
      </View>
    </TouchableOpacity>
  );
};

// ═══════════════════════════════════════════════════════════════
// FRAUD CARD
// ═══════════════════════════════════════════════════════════════
const FraudCard = ({
  alert,
  onPress,
}: {
  alert: FraudAlert;
  onPress: (alert: FraudAlert) => void;
}) => {
  const isHigh = alert.suspiciousLevel === 'high';
  const color = isHigh ? '#F44336' : '#FFC107';

  return (
    <TouchableOpacity
      style={[styles.fraudAlertCard, { borderLeftColor: color }]}
      onPress={() => onPress(alert)}
      activeOpacity={0.75}
    >
      <View style={styles.fraudCardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.fraudClaimNumber}>{alert.claimNumber}</Text>
          <Text style={styles.fraudFlagCount}>{alert.flags.length} сэжигтэй үзүүлэлт</Text>
        </View>
        <View style={styles.fraudRightRow}>
          <View style={[styles.fraudRiskDot, { backgroundColor: color }]} />
          <Ionicons name="chevron-forward" size={16} color={COLORS.textLight} />
        </View>
      </View>

      {Array.isArray(alert.flags) && alert.flags.length > 0 && (
        <View style={styles.fraudFlagsWrap}>
          {alert.flags.slice(0, 2).map((flag, i) => (
            <View key={i} style={styles.fraudFlagChip}>
              <View style={[styles.fraudFlagDot, { backgroundColor: color }]} />
              <Text style={styles.fraudFlagText} numberOfLines={1}>{flag}</Text>
            </View>
          ))}
          {alert.flags.length > 2 && (
            <Text style={[styles.fraudMoreText, { color }]}>
              +{alert.flags.length - 2} дахь...
            </Text>
          )}
        </View>
      )}

      <View style={[styles.fraudTapHint, { borderTopColor: color + '20' }]}>
        <Ionicons name="information-circle-outline" size={12} color={COLORS.textLight} />
        <Text style={styles.fraudTapHintText}>Дэлгэрэнгүй харах</Text>
      </View>
    </TouchableOpacity>
  );
};

// ═══════════════════════════════════════════════════════════════
// MAIN SCREEN
// ═══════════════════════════════════════════════════════════════
export const AdminDashboardScreen: React.FC = () => {
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [quickStats, setQuickStats] = useState<QuickStats | null>(null);
  const [claimsByStatus, setClaimsByStatus] = useState<ClaimsByStatus[]>([]);
  const [claimsByDay, setClaimsByDay] = useState<ClaimsByDay[]>([]);
  const [topDamage, setTopDamage] = useState<DamageTypeStats[]>([]);
  const [highRisk, setHighRisk] = useState<HighRiskClaimSummary[]>([]);
  const [fraudAlerts, setFraudAlerts] = useState<FraudAlert[]>([]);
  const [disputedClaims, setDisputedClaims] = useState<DisputedClaim[]>([]);

  // Modal state
  const [selectedFraud, setSelectedFraud] = useState<FraudAlert | null>(null);
  const [fraudModalVisible, setFraudModalVisible] = useState(false);
  const [selectedDisputed, setSelectedDisputed] = useState<DisputedClaim | null>(null);
  const [disputedModalVisible, setDisputedModalVisible] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    setError(null);
    try {
      const [s, qs, cbs, cbd, td, hr, fa, dc] = await Promise.all([
        safeCall(() => adminService.getDashboardStats(), null),
        safeCall(() => adminService.getQuickStats(), null),
        safeCall(() => adminService.getClaimsByStatus(), []),
        safeCall(() => adminService.getClaimsByDay(7), []),
        safeCall(() => adminService.getTopDamageTypes(10), []),
        safeCall(() => adminService.getHighRiskClaims(15), []),
        safeCall(() => adminService.getFraudAlerts(15), []),
        safeCall(() => adminService.getDisputedClaims(50), []),
      ]);

      setStats(s);
      setQuickStats(qs);
      setClaimsByStatus(Array.isArray(cbs) ? cbs : []);
      setClaimsByDay(Array.isArray(cbd) ? cbd : []);
      setTopDamage(Array.isArray(td) ? td : []);
      setHighRisk(Array.isArray(hr) ? hr : []);
      setFraudAlerts(Array.isArray(fa) ? fa : []);
      setDisputedClaims(Array.isArray(dc) ? dc : []);

      if (!s && !qs) {
        setError('Admin эрх шаардлагатай. Admin role-той хэрэглэгчээр нэвтэрнэ үү.');
      }
    } catch {
      setError('Dashboard ачааллахад алдаа гарлаа. Дахин оролдоно уу.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const formatCurrency = (amount: number): string => {
    const n = Number(amount);
    if (!n || isNaN(n)) return '₮0';
    if (n >= 1_000_000_000) return `₮${(n / 1_000_000_000).toFixed(1)}B`;
    if (n >= 1_000_000) return `₮${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `₮${(n / 1_000).toFixed(0)}K`;
    return `₮${n.toLocaleString()}`;
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Ачааллаж байна...</Text>
      </View>
    );
  }

  if (error && !stats && !quickStats) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchDashboardData}>
          <Text style={styles.retryButtonText}>Дахин оролдох</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const highFraud = fraudAlerts.filter((a) => a.suspiciousLevel === 'high');
  const medFraud = fraudAlerts.filter((a) => a.suspiciousLevel === 'medium');

  return (
    <>
      <ScrollView
        style={[styles.container, { paddingTop: insets.top }]}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#2196F3"
            colors={['#2196F3']}
          />
        }
      >
        {/* ── Үндсэн үзүүлэлтүүд ─────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Үндсэн үзүүлэлтүүд</Text>
          {stats ? (
            <>
              <StatCard label="Нийт claim" value={stats.totalClaims ?? 0} icon="file-document" color="#2196F3" subtext={`${stats.approvedClaims ?? 0} зөвшөөрөгдсөн`} />
              <StatCard label="Зөвшөөрөгдсөн" value={stats.approvedClaims ?? 0} icon="check-circle" color="#4CAF50"
                subtext={`${(stats.totalClaims ?? 0) > 0 ? (((stats.approvedClaims ?? 0) / stats.totalClaims) * 100).toFixed(0) : 0}% зөвшөөрөлт`} />
              <StatCard label="Нийт төлбөр" value={formatCurrency(stats.totalPayoutAmount ?? 0)} icon="cash-multiple" color="#FF9800" subtext={`Дундаж: ${formatCurrency(stats.avgClaimAmount ?? 0)}`} />
              <StatCard label="Хүлээгдэж буй" value={stats.pendingClaims ?? 0} icon="clock" color="#FFC107" subtext="Шалгалт хүлээж байна" />
              <StatCard label="Нийт хэрэглэгч" value={stats.totalUsers ?? 0} icon="account-group" color="#9C27B0" subtext={`${stats.totalVehicles ?? 0} машин бүртгэлтэй`} />
            </>
          ) : (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>Статистик өгөгдөл байхгүй байна</Text>
            </View>
          )}
        </View>

        {/* ── Хурдан тойм ─────────────────────────────────── */}
        {quickStats && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚡ Хурдан тойм</Text>
            <View style={styles.quickStatsGrid}>
              <View style={styles.quickStatCard}>
                <Text style={styles.quickStatLabel}>Өнөөдөр</Text>
                <Text style={styles.quickStatValue}>{quickStats.todayClaims ?? 0}</Text>
                <Text style={styles.quickStatSubtext}>claim</Text>
                <Text style={styles.quickStatPayout}>{formatCurrency(quickStats.todayPayout ?? 0)}</Text>
              </View>
              <View style={styles.quickStatCard}>
                <Text style={styles.quickStatLabel}>7 хоног</Text>
                <Text style={styles.quickStatValue}>{quickStats.weekClaims ?? 0}</Text>
                <Text style={styles.quickStatSubtext}>claim</Text>
              </View>
              <View style={styles.quickStatCard}>
                <Text style={styles.quickStatLabel}>Сар</Text>
                <Text style={styles.quickStatValue}>{quickStats.monthClaims ?? 0}</Text>
                <Text style={styles.quickStatSubtext}>claim</Text>
              </View>
            </View>
          </View>
        )}

        {/* ── Статусаар ────────────────────────────────────── */}
        {claimsByStatus.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📋 Статусаар</Text>
            <View style={styles.card}>
              {claimsByStatus.map((item, idx) => (
                <View key={`status-${idx}`} style={[styles.listItem, idx === claimsByStatus.length - 1 && { borderBottomWidth: 0 }]}>
                  <View style={styles.listItemLeft}>
                    <StatusBadgeAdmin status={item.status} />
                    <Text style={styles.listItemText}>{item.status}</Text>
                  </View>
                  <Text style={styles.listItemCount}>{item.count}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── 7 хоногийн claim ─────────────────────────────── */}
        {claimsByDay.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📅 7 хоногийн дүн</Text>
            <View style={styles.card}>
              {claimsByDay.map((item, idx) => {
                const maxCount = Math.max(...claimsByDay.map((d) => d.count), 1);
                const pct = (item.count / maxCount) * 100;
                return (
                  <View key={`day-${idx}`} style={[styles.dayItem, idx === claimsByDay.length - 1 && { borderBottomWidth: 0 }]}>
                    <Text style={styles.dayLabel}>
                      {new Date(item.date).toLocaleDateString('mn-MN', { month: 'short', day: 'numeric' })}
                    </Text>
                    <View style={styles.progressBar}>
                      <View style={[styles.progressFill, { width: `${pct}%` }]} />
                    </View>
                    <Text style={styles.dayCount}>{item.count}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* ── Гэмтлийн төрлүүд ─────────────────────────────── */}
        {topDamage.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔧 Гэмтлийн төрлүүд</Text>
            <View style={styles.card}>
              {topDamage.map((item, idx) => (
                <View key={`damage-${idx}`} style={[styles.damageTypeItem, idx === topDamage.length - 1 && { borderBottomWidth: 0 }]}>
                  <View style={styles.damageTypeLeft}>
                    <Text style={styles.damageTypeName}>{item.damageType}</Text>
                    <Text style={styles.damageTypeCount}>{item.count} claim</Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${Math.min(item.percentage ?? 0, 100)}%` }]} />
                  </View>
                  <Text style={styles.percentage}>{(item.percentage ?? 0).toFixed(0)}%</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Өндөр эрсдэлтэй claim ────────────────────────── */}
        {highRisk.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚠️ Өндөр эрсдэлтэй claim ({highRisk.length})</Text>
            {highRisk.map((claim, idx) => (
              <View key={claim.id ?? `risk-${idx}`} style={styles.highRiskCard}>
                <View style={styles.highRiskHeader}>
                  <Text style={styles.highRiskClaimNumber}>{claim.claimNumber}</Text>
                  <RiskBadge level={claim.riskLevel ?? 'medium'} size="large" />
                </View>
                <InfoRow label="Тээвэр" value={claim.vehicleInfo ?? 'Мэдээлэл байхгүй'} icon="car" />
                <InfoRow label="Санал болгосон" value={formatCurrency(Number(claim.suggestedPayout ?? 0))} icon="cash" />
                <InfoRow label="Статус" value={claim.status ?? '—'} icon="file" />
              </View>
            ))}
          </View>
        )}

        {/* ══ САНАЛ НИЙЛЭХГҮЙ CLAIM-ҮҮД ══════════════════════ */}
        {disputedClaims.length > 0 && (
          <View style={styles.section}>
            <View style={styles.disputedSectionHeader}>
              <Text style={styles.sectionTitle}>
                💬 Санал нийлэхгүй claim-үүд ({disputedClaims.length})
              </Text>
              <View style={styles.disputedCountBadge}>
                <Text style={styles.disputedCountText}>{disputedClaims.length}</Text>
              </View>
            </View>
            <Text style={styles.disputedSectionDesc}>
              Хэрэглэгч AI үнэлгээтэй санал нийлэхгүй байгаа тул шалгалт хэрэгтэй
            </Text>
            {disputedClaims.map((claim, idx) => (
              <DisputedClaimCard
                key={claim.id ?? `dc-${idx}`}
                claim={claim}
                onPress={(c) => {
                  setSelectedDisputed(c);
                  setDisputedModalVisible(true);
                }}
              />
            ))}
          </View>
        )}

        {/* ── Сэжигтэй claim-үүд ───────────────────────────── */}
        {fraudAlerts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🚨 Сэжигтэй claim-үүд ({fraudAlerts.length})</Text>
            {highFraud.length > 0 && (
              <>
                <View style={styles.fraudSectionHeader}>
                  <View style={[styles.fraudSectionDot, { backgroundColor: '#F44336' }]} />
                  <Text style={styles.fraudSectionLabel}>Өндөр эрсдэл ({highFraud.length})</Text>
                </View>
                {highFraud.map((alert, idx) => (
                  <FraudCard key={alert.id ?? `hf-${idx}`} alert={alert} onPress={(a) => { setSelectedFraud(a); setFraudModalVisible(true); }} />
                ))}
              </>
            )}
            {medFraud.length > 0 && (
              <>
                <View style={styles.fraudSectionHeader}>
                  <View style={[styles.fraudSectionDot, { backgroundColor: '#FFC107' }]} />
                  <Text style={styles.fraudSectionLabel}>Дунд эрсдэл ({medFraud.length})</Text>
                </View>
                {medFraud.map((alert, idx) => (
                  <FraudCard key={alert.id ?? `mf-${idx}`} alert={alert} onPress={(a) => { setSelectedFraud(a); setFraudModalVisible(true); }} />
                ))}
              </>
            )}
          </View>
        )}

        {!stats && !quickStats && claimsByStatus.length === 0 && highRisk.length === 0 && fraudAlerts.length === 0 && disputedClaims.length === 0 && (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>Өгөгдөл байхгүй байна</Text>
            <Text style={styles.emptySubText}>Admin эрхтэй хэрэглэгчээр нэвтэрсэн эсэхийг шалгана уу</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchDashboardData}>
              <Text style={styles.retryButtonText}>Дахин оролдох</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Disputed claim detail modal */}
      <DisputedClaimModal
        claim={selectedDisputed}
        visible={disputedModalVisible}
        onClose={() => { setDisputedModalVisible(false); setSelectedDisputed(null); }}
      />

      {/* Fraud detail modal */}
      <FraudDetailModal
        alert={selectedFraud}
        visible={fraudModalVisible}
        onClose={() => { setFraudModalVisible(false); setSelectedFraud(null); }}
      />
    </>
  );
};

// ── Modal StyleSheet ──────────────────────────────────────────
const ms = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
    ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 }, android: { elevation: 2 } }),
  },
  closeBtn: { width: 36, height: 36, borderRadius: RADIUS.sm, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: FONT_SIZE.lg, fontWeight: '700', color: COLORS.text },
  body: { padding: SPACING.lg, gap: SPACING.md, paddingBottom: SPACING.xxl },

  claimHeroCard: {
    backgroundColor: '#fff', borderRadius: RADIUS.lg, padding: SPACING.md,
    borderWidth: 1, borderColor: '#F1F5F9',
    ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 }, android: { elevation: 2 } }),
  },
  claimHeroTop: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  claimHeroIcon: { width: 44, height: 44, borderRadius: RADIUS.sm, backgroundColor: COLORS.primary + '12', justifyContent: 'center', alignItems: 'center' },
  claimHeroNumber: { fontSize: FONT_SIZE.lg, fontWeight: '800', color: COLORS.text },
  claimHeroDate: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, marginTop: 2 },
  disputeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.danger + '12', borderRadius: RADIUS.full, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: COLORS.danger + '30' },
  disputeBadgeText: { fontSize: 11, fontWeight: '700', color: COLORS.danger },

  reasonCard: { backgroundColor: '#FEF2F2', borderRadius: RADIUS.lg, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.danger + '30' },
  reasonHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: SPACING.md, backgroundColor: COLORS.danger + '08', borderBottomWidth: 1, borderBottomColor: COLORS.danger + '20' },
  reasonIconWrap: { width: 32, height: 32, borderRadius: RADIUS.sm, backgroundColor: COLORS.danger + '15', justifyContent: 'center', alignItems: 'center' },
  reasonTitle: { fontSize: FONT_SIZE.sm, fontWeight: '700', color: COLORS.danger },
  reasonBody: { padding: SPACING.md },
  reasonText: { fontSize: FONT_SIZE.md, color: COLORS.text, lineHeight: 24, fontStyle: 'italic' },

  section: { gap: SPACING.sm },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionTitle: { fontSize: FONT_SIZE.sm, fontWeight: '700', color: COLORS.text },

  infoCard: { backgroundColor: '#fff', borderRadius: RADIUS.lg, borderWidth: 1, borderColor: '#F1F5F9', overflow: 'hidden' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.md, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  infoLabel: { fontSize: FONT_SIZE.sm, color: COLORS.textMuted },
  infoValue: { fontSize: FONT_SIZE.sm, color: COLORS.text, fontWeight: '500', textAlign: 'right', flex: 1 },
  infoDivider: { height: 1, backgroundColor: '#F1F5F9' },

  userRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, padding: SPACING.md },
  userAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary + '20', justifyContent: 'center', alignItems: 'center' },
  userAvatarText: { fontSize: FONT_SIZE.sm, fontWeight: '800', color: COLORS.primary },
  userName: { fontSize: FONT_SIZE.sm, fontWeight: '700', color: COLORS.text },
  userEmail: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, marginTop: 2 },

  vehicleCard: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, backgroundColor: '#fff', borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: '#F1F5F9' },
  vehicleText: { fontSize: FONT_SIZE.sm, color: COLORS.text, fontWeight: '500', flex: 1 },

  actionsCard: { backgroundColor: '#fff', borderRadius: RADIUS.lg, borderWidth: 1, borderColor: '#F1F5F9', overflow: 'hidden' },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, paddingHorizontal: SPACING.md, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  actionIcon: { width: 40, height: 40, borderRadius: RADIUS.sm, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  actionTitle: { fontSize: FONT_SIZE.sm, fontWeight: '600', color: COLORS.text },
  actionDesc: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, marginTop: 2, lineHeight: 16 },

  warningBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth: 1 },
  warningText: { fontSize: FONT_SIZE.xs, color: COLORS.text, flex: 1, lineHeight: 18 },

  flagDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  claimHeroCard2: {},
  heroDivider: { height: 1, backgroundColor: 'rgba(0,0,0,0.08)', marginVertical: SPACING.md },
  heroDateRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroDate: { fontSize: FONT_SIZE.xs, fontWeight: '500' },
});

// ── Main StyleSheet ───────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  centerContent: { justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingText: { marginTop: 12, fontSize: 16, color: '#666' },
  errorText: { fontSize: 15, color: '#F44336', marginBottom: 20, textAlign: 'center', lineHeight: 22 },
  retryButton: { backgroundColor: '#2196F3', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8, marginTop: 8 },
  retryButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },

  section: { marginTop: 20 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#222', marginLeft: 16, marginBottom: 12 },
  card: {
    backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 12, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 4, elevation: 2,
  },

  quickStatsGrid: { flexDirection: 'row', marginHorizontal: 16, gap: 8 },
  quickStatCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 12, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 3, elevation: 2,
  },
  quickStatLabel: { fontSize: 12, color: '#999', marginBottom: 4 },
  quickStatValue: { fontSize: 22, fontWeight: '700', color: '#2196F3' },
  quickStatSubtext: { fontSize: 10, color: '#aaa' },
  quickStatPayout: { fontSize: 12, fontWeight: '600', color: '#4CAF50', marginTop: 4 },

  listItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  listItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  listItemText: { fontSize: 13, color: '#444', textTransform: 'capitalize' },
  listItemCount: { fontSize: 16, fontWeight: '700', color: '#2196F3' },

  dayItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', gap: 10 },
  dayLabel: { fontSize: 12, color: '#666', width: 60 },
  dayCount: { fontSize: 13, fontWeight: '700', color: '#2196F3', width: 28, textAlign: 'right' },

  damageTypeItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', gap: 10 },
  damageTypeLeft: { width: 110 },
  damageTypeName: { fontSize: 13, fontWeight: '600', color: '#333' },
  damageTypeCount: { fontSize: 11, color: '#999', marginTop: 2 },
  progressBar: { flex: 1, height: 6, backgroundColor: '#eee', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#2196F3', borderRadius: 3 },
  percentage: { fontSize: 12, fontWeight: '600', color: '#666', width: 38, textAlign: 'right' },

  highRiskCard: {
    marginHorizontal: 16, marginBottom: 10, backgroundColor: '#fff',
    borderRadius: 12, padding: 16, borderLeftWidth: 4, borderLeftColor: '#F44336',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 3, elevation: 2,
  },
  highRiskHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  highRiskClaimNumber: { fontSize: 15, fontWeight: '700', color: '#222' },

  // ── Disputed section ──────────────────────────────────────
  disputedSectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: 16, marginBottom: 4,
  },
  disputedCountBadge: {
    backgroundColor: COLORS.danger, borderRadius: RADIUS.full,
    minWidth: 22, height: 22, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6,
  },
  disputedCountText: { fontSize: 11, color: '#fff', fontWeight: '800' },
  disputedSectionDesc: {
    fontSize: 12, color: '#999', marginHorizontal: 16, marginBottom: 8, lineHeight: 18,
  },

  // ── Disputed card ─────────────────────────────────────────
  disputedCard: {
    marginHorizontal: 16, marginBottom: 10, backgroundColor: '#fff',
    borderRadius: 12, padding: 14,
    borderLeftWidth: 4, borderLeftColor: COLORS.danger,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 3, elevation: 2,
  },
  disputedCardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  disputedClaimNumber: { fontSize: 15, fontWeight: '700', color: '#222' },
  disputedDate: { fontSize: 12, color: '#999', marginTop: 2 },
  disputedRightRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  disputedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.danger + '12', borderRadius: RADIUS.full,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  disputedBadgeText: { fontSize: 10, fontWeight: '700', color: COLORS.danger },

  disputedReasonBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: '#FEF2F2', borderRadius: 8, padding: 10, marginBottom: 10,
  },
  disputedReasonText: {
    fontSize: 13, color: '#374151', flex: 1, lineHeight: 20, fontStyle: 'italic',
  },

  disputedMetaRow: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  disputedMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  disputedMetaText: { fontSize: 12, color: COLORS.textMuted },

  disputedTapHint: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingTop: 8, borderTopWidth: 1, borderTopColor: COLORS.danger + '15',
  },
  disputedTapHintText: { fontSize: 11, color: '#9CA3AF' },

  // ── Fraud section ─────────────────────────────────────────
  fraudSectionHeader: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 12, marginBottom: 8, gap: 8 },
  fraudSectionDot: { width: 10, height: 10, borderRadius: 5 },
  fraudSectionLabel: { fontSize: 14, fontWeight: '600', color: '#444' },

  fraudAlertCard: {
    marginHorizontal: 16, marginBottom: 10, backgroundColor: '#fff',
    borderRadius: 12, padding: 14, borderLeftWidth: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 3, elevation: 2,
  },
  fraudCardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  fraudClaimNumber: { fontSize: 15, fontWeight: '700', color: '#222' },
  fraudFlagCount: { fontSize: 12, color: '#999', marginTop: 2 },
  fraudRightRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  fraudRiskDot: { width: 10, height: 10, borderRadius: 5 },
  fraudFlagsWrap: { gap: 6, marginBottom: 8 },
  fraudFlagChip: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F9FAFB', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  fraudFlagDot: { width: 6, height: 6, borderRadius: 3, flexShrink: 0 },
  fraudFlagText: { fontSize: 13, color: '#444', flex: 1 },
  fraudMoreText: { fontSize: 12, fontWeight: '600', marginLeft: 4 },
  fraudTapHint: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingTop: 8, borderTopWidth: 1 },
  fraudTapHintText: { fontSize: 11, color: '#9CA3AF' },

  emptyBox: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#999', marginBottom: 8 },
  emptySubText: { fontSize: 13, color: '#bbb', textAlign: 'center', lineHeight: 20, marginBottom: 16 },
});
