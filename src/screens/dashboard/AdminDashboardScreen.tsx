import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import adminService, {
  DashboardStats,
  QuickStats,
  ClaimsByStatus,
  ClaimsByDay,
  DamageTypeStats,
  HighRiskClaimSummary,
  FraudAlert,
} from '../../services/adminService';
import {
  StatCard,
  RiskBadge,
  StatusBadgeAdmin,
  InfoRow,
} from '../../components/AdminDashboardComponents';

async function safeCall<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (e: any) {
    console.warn('Admin API алдаа:', e?.response?.status, e?.message);
    return fallback;
  }
}

// ── FraudCard: component-ийн ГАДНА тодорхойлно ───────────────
const FraudCard: React.FC<{ alert: FraudAlert }> = ({ alert }) => (
  <View
    style={[
      styles.fraudAlertCard,
      { borderLeftColor: alert.suspiciousLevel === 'high' ? '#F44336' : '#FFC107' },
    ]}
  >
    <View style={styles.fraudAlertHeader}>
      <Text style={styles.claimNumberText}>{alert.claimNumber}</Text>
      <View
        style={[
          styles.riskIndicator,
          { backgroundColor: alert.suspiciousLevel === 'high' ? '#F44336' : '#FFC107' },
        ]}
      />
    </View>
    {Array.isArray(alert.flags) && alert.flags.length > 0 && (
      <View style={styles.flagsContainer}>
        <Text style={styles.flagsTitle}>
          Сэжигтэй үзүүлэлт ({alert.flags.length}):
        </Text>
        {alert.flags.map((flag, i) => (
          <Text key={i} style={styles.flagText}>
            • {flag}
          </Text>
        ))}
      </View>
    )}
  </View>
);

// ── Main Screen ───────────────────────────────────────────────
export const AdminDashboardScreen: React.FC = () => {
  const insets = useSafeAreaInsets();

  const [loading, setLoading]               = useState(true);
  const [refreshing, setRefreshing]         = useState(false);
  const [error, setError]                   = useState<string | null>(null);
  const [stats, setStats]                   = useState<DashboardStats | null>(null);
  const [quickStats, setQuickStats]         = useState<QuickStats | null>(null);
  const [claimsByStatus, setClaimsByStatus] = useState<ClaimsByStatus[]>([]);
  const [claimsByDay, setClaimsByDay]       = useState<ClaimsByDay[]>([]);
  const [topDamage, setTopDamage]           = useState<DamageTypeStats[]>([]);
  const [highRisk, setHighRisk]             = useState<HighRiskClaimSummary[]>([]);
  const [fraudAlerts, setFraudAlerts]       = useState<FraudAlert[]>([]);

  const fetchDashboardData = useCallback(async () => {
    setError(null);
    try {
      const [s, qs, cbs, cbd, td, hr, fa] = await Promise.all([
        safeCall(() => adminService.getDashboardStats(), null),
        safeCall(() => adminService.getQuickStats(), null),
        safeCall(() => adminService.getClaimsByStatus(), []),
        safeCall(() => adminService.getClaimsByDay(7), []),
        safeCall(() => adminService.getTopDamageTypes(10), []),
        safeCall(() => adminService.getHighRiskClaims(15), []),
        safeCall(() => adminService.getFraudAlerts(15), []),
      ]);

      setStats(s);
      setQuickStats(qs);
      setClaimsByStatus(Array.isArray(cbs) ? cbs : []);
      setClaimsByDay(Array.isArray(cbd) ? cbd : []);
      setTopDamage(Array.isArray(td) ? td : []);
      setHighRisk(Array.isArray(hr) ? hr : []);
      setFraudAlerts(Array.isArray(fa) ? fa : []);

      if (!s && !qs && (!cbs || cbs.length === 0)) {
        setError('Admin эрх шаардлагатай. Admin role-той хэрэглэгчээр нэвтэрнэ үү.');
      }
    } catch (err) {
      setError('Dashboard ачааллахад алдаа гарлаа. Дахин оролдоно уу.');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const formatCurrency = (amount: number) =>
    `₮${(amount / 1000).toFixed(0)}K`;

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Ачааллаж байна...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchDashboardData}>
          <Text style={styles.retryButtonText}>Дахин оролдох</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ✅ Null-safe array operations
  const safeFraudAlerts = Array.isArray(fraudAlerts) ? fraudAlerts : [];
  const safeHighRisk    = Array.isArray(highRisk) ? highRisk : [];
  const safeTopDamage   = Array.isArray(topDamage) ? topDamage : [];
  const safeClaimsByStatus = Array.isArray(claimsByStatus) ? claimsByStatus : [];

  const highFraud = safeFraudAlerts.filter((a) => a.suspiciousLevel === 'high');
  const medFraud  = safeFraudAlerts.filter((a) => a.suspiciousLevel === 'medium');

  return (
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
      {/* ── Үндсэн үзүүлэлтүүд ─────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Үндсэн үзүүлэлтүүд</Text>
        <StatCard
          label="Нийт claim"
          value={stats?.totalClaims ?? 0}
          icon="file-document"
          color="#2196F3"
          subtext={`${stats?.approvedClaims ?? 0} зөвшөөрөгдсөн`}
        />
        <StatCard
          label="Зөвшөөрөгдсөн"
          value={stats?.approvedClaims ?? 0}
          icon="check-circle"
          color="#4CAF50"
          subtext={`${(
            ((stats?.approvedClaims ?? 0) /
              Math.max(stats?.totalClaims ?? 1, 1)) *
            100
          ).toFixed(0)}% зөвшөөрөлт`}
        />
        <StatCard
          label="Нийт төлбөр"
          value={formatCurrency(stats?.totalPayoutAmount ?? 0)}
          icon="cash-multiple"
          color="#FF9800"
          subtext={`Дундаж: ${formatCurrency(stats?.avgClaimAmount ?? 0)}`}
        />
        <StatCard
          label="Хүлээгдэж буй"
          value={stats?.pendingClaims ?? 0}
          icon="clock"
          color="#FFC107"
          subtext="Шалгалт хүлээж байна"
        />
      </View>

      {/* ── Хурдан тойм ─────────────────────────────────────── */}
      {quickStats && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚡ Хурдан тойм</Text>
          <View style={styles.quickStatsGrid}>
            <View style={styles.quickStatCard}>
              <Text style={styles.quickStatLabel}>Өнөөдөр</Text>
              <Text style={styles.quickStatValue}>{quickStats.todayClaims}</Text>
              <Text style={styles.quickStatSubtext}>claim</Text>
              <Text style={[styles.quickStatValue, { fontSize: 14, marginTop: 4 }]}>
                {formatCurrency(quickStats.todayPayout)}
              </Text>
            </View>
            <View style={styles.quickStatCard}>
              <Text style={styles.quickStatLabel}>7 хоног</Text>
              <Text style={styles.quickStatValue}>{quickStats.weekClaims}</Text>
              <Text style={styles.quickStatSubtext}>claim</Text>
            </View>
            <View style={styles.quickStatCard}>
              <Text style={styles.quickStatLabel}>Сар</Text>
              <Text style={styles.quickStatValue}>{quickStats.monthClaims}</Text>
              <Text style={styles.quickStatSubtext}>claim</Text>
            </View>
          </View>
        </View>
      )}

      {/* ── Статусаар ────────────────────────────────────────── */}
      {safeClaimsByStatus.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Статусаар</Text>
          <View style={styles.card}>
            {safeClaimsByStatus.map((item, idx) => (
              <View
                key={idx}
                style={[
                  styles.listItem,
                  idx === safeClaimsByStatus.length - 1 && { borderBottomWidth: 0 },
                ]}
              >
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

      {/* ── Гэмтлийн төрлүүд ─────────────────────────────────── */}
      {safeTopDamage.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔧 Гэмтлийн төрлүүд</Text>
          <View style={styles.card}>
            {safeTopDamage.map((item, idx) => (
              <View
                key={idx}
                style={[
                  styles.damageTypeItem,
                  idx === safeTopDamage.length - 1 && { borderBottomWidth: 0 },
                ]}
              >
                <View style={styles.damageTypeLeft}>
                  <Text style={styles.damageTypeName}>{item.damageType}</Text>
                  <Text style={styles.damageTypeCount}>{item.count} claim</Text>
                </View>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${Math.min(item.percentage, 100)}%` },
                    ]}
                  />
                </View>
                <Text style={styles.percentage}>
                  {item.percentage.toFixed(0)}%
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* ── Өндөр эрсдэлтэй claim ────────────────────────────── */}
      {safeHighRisk.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚠️ Өндөр эрсдэлтэй claim</Text>
          {safeHighRisk.map((claim, idx) => (
            <View key={claim.id ?? idx} style={styles.highRiskCard}>
              <View style={styles.highRiskHeader}>
                <Text style={styles.highRiskClaimNumber}>
                  {claim.claimNumber}
                </Text>
                <RiskBadge level={claim.riskLevel} size="large" />
              </View>
              <InfoRow label="Тээвэр"         value={claim.vehicleInfo}                     icon="car"  />
              <InfoRow label="Санал болгосон"  value={formatCurrency(claim.suggestedPayout)} icon="cash" />
              <InfoRow label="Статус"          value={claim.status}                          icon="file" />
            </View>
          ))}
        </View>
      )}

      {/* ── Сэжигтэй claim-үүд ───────────────────────────────── */}
      {safeFraudAlerts.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            🚨 Сэжигтэй claim-үүд ({safeFraudAlerts.length})
          </Text>
          {highFraud.length > 0 && (
            <>
              <View style={styles.fraudSectionHeader}>
                <View style={[styles.fraudSectionDot, { backgroundColor: '#F44336' }]} />
                <Text style={styles.fraudSectionLabel}>
                  Өндөр эрсдэл ({highFraud.length})
                </Text>
              </View>
              {highFraud.map((alert, idx) => (
                <FraudCard key={alert.id ?? idx} alert={alert} />
              ))}
            </>
          )}
          {medFraud.length > 0 && (
            <>
              <View style={styles.fraudSectionHeader}>
                <View style={[styles.fraudSectionDot, { backgroundColor: '#FFC107' }]} />
                <Text style={styles.fraudSectionLabel}>
                  Дунд эрсдэл ({medFraud.length})
                </Text>
              </View>
              {medFraud.map((alert, idx) => (
                <FraudCard key={alert.id ?? idx} alert={alert} />
              ))}
            </>
          )}
        </View>
      )}

      {/* ── Хоосон ───────────────────────────────────────────── */}
      {!stats && !quickStats && safeClaimsByStatus.length === 0 && (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>Өгөгдөл байхгүй байна</Text>
          <Text style={styles.emptySubText}>
            Admin эрхтэй хэрэглэгчээр нэвтэрсэн эсэхийг шалгана уу
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

// ── Styles ────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 15,
    color: '#F44336',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#222',
    marginLeft: 16,
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  quickStatsGrid: {
    flexDirection: 'row',
    marginHorizontal: 16,
    gap: 8,
  },
  quickStatCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
    elevation: 2,
  },
  quickStatLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  quickStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2196F3',
  },
  quickStatSubtext: {
    fontSize: 10,
    color: '#aaa',
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  listItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  listItemText: {
    fontSize: 13,
    color: '#444',
    textTransform: 'capitalize',
  },
  listItemCount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2196F3',
  },
  damageTypeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 10,
  },
  damageTypeLeft: {
    width: 100,
  },
  damageTypeName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  damageTypeCount: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#eee',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2196F3',
    borderRadius: 3,
  },
  percentage: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    width: 38,
    textAlign: 'right',
  },
  highRiskCard: {
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
    elevation: 2,
  },
  highRiskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  highRiskClaimNumber: {
    fontSize: 15,
    fontWeight: '700',
    color: '#222',
  },
  fraudSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    gap: 8,
  },
  fraudSectionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  fraudSectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444',
  },
  fraudAlertCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
    elevation: 2,
  },
  fraudAlertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  claimNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#222',
  },
  riskIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  flagsContainer: {
    gap: 4,
  },
  flagsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 2,
  },
  flagText: {
    fontSize: 12,
    color: '#888',
    lineHeight: 18,
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 13,
    color: '#bbb',
    textAlign: 'center',
    lineHeight: 20,
  },
});