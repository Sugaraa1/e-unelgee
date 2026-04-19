import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  SectionList,
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

export const AdminDashboardScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [quickStats, setQuickStats] = useState<QuickStats | null>(null);
  const [claimsByStatus, setClaimsByStatus] = useState<ClaimsByStatus[]>([]);
  const [claimsByDay, setClaimsByDay] = useState<ClaimsByDay[]>([]);
  const [topDamage, setTopDamage] = useState<DamageTypeStats[]>([]);
  const [highRisk, setHighRisk] = useState<HighRiskClaimSummary[]>([]);
  const [fraudAlerts, setFraudAlerts] = useState<FraudAlert[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setError(null);
      const [s, qs, cbs, cbd, td, hr, fa] = await Promise.all([
        adminService.getDashboardStats(),
        adminService.getQuickStats(),
        adminService.getClaimsByStatus(),
        adminService.getClaimsByDay(7),
        adminService.getTopDamageTypes(10),
        adminService.getHighRiskClaims(15),
        adminService.getFraudAlerts(15),
      ]);

      setStats(s);
      setQuickStats(qs);
      setClaimsByStatus(cbs);
      setClaimsByDay(cbd);
      setTopDamage(td);
      setHighRisk(hr);
      setFraudAlerts(fa);
    } catch (err) {
      setError('Dashboard ачааллахад алдаа гарлаа. Дахин оролдоно уу.');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
  };

  if (loading && !stats) {
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
        <View style={styles.retryButton}>
          <Text
            style={styles.retryButtonText}
            onPress={fetchDashboardData}
          >
            Дахин оролдох
          </Text>
        </View>
      </View>
    );
  }

  const formatCurrency = (amount: number) => {
    return `₮${(amount / 1000).toFixed(0)}K`;
  };

  // ✅ FraudAlert.flags нь string[] тул шууд string-г харуулна
  const fraudAlertSections = [
    {
      title: 'Өндөр эрсдэл',
      data: fraudAlerts.filter((a) => a.suspiciousLevel === 'high'),
      color: '#F44336',
    },
    {
      title: 'Дунд эрсдэл',
      data: fraudAlerts.filter((a) => a.suspiciousLevel === 'medium'),
      color: '#FFC107',
    },
  ];

  return (
    <SectionList
      sections={fraudAlertSections}
      keyExtractor={(item, index) => (item.claimId || item.id || String(index)) + index}
      renderItem={({ item: fraudAlert }) => (
        <View style={styles.fraudAlertCard}>
          <View style={styles.fraudAlertHeader}>
            <Text style={styles.claimNumberText}>
              {fraudAlert.claimNumber}
            </Text>
            <View
              style={[
                styles.riskIndicator,
                {
                  backgroundColor:
                    fraudAlert.suspiciousLevel === 'high'
                      ? '#F44336'
                      : '#FFC107',
                },
              ]}
            />
          </View>

          <View style={styles.fraudAlertContent}>
            {/* ✅ flags нь string[] — шууд string-г харуулна */}
            {fraudAlert.flags.length > 0 && (
              <View style={styles.flagsContainer}>
                <Text style={styles.flagsTitle}>
                  Сэжигтэй үзүүлэлт ({fraudAlert.flags.length}):
                </Text>
                {fraudAlert.flags.map((flag: string, idx: number) => (
                  <Text key={idx} style={styles.flagText}>
                    • {flag}
                  </Text>
                ))}
              </View>
            )}
          </View>
        </View>
      )}
      renderSectionHeader={({ section: { title, color, data } }) =>
        data.length > 0 ? (
          <View style={styles.sectionHeader}>
            <View
              style={[styles.sectionIndicator, { backgroundColor: color }]}
            />
            <Text style={styles.sectionTitle}>
              {title} ({data.length})
            </Text>
          </View>
        ) : null
      }
      ListHeaderComponent={
        <ScrollView
          scrollEnabled={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#2196F3"
            />
          }
        >
          {/* Key Metrics */}
          <View style={styles.section}>
            <Text style={styles.sectionTitleMain}>Үндсэн үзүүлэлтүүд</Text>
            <StatCard
              label="Нийт claim"
              value={stats?.totalClaims || 0}
              icon="file-document"
              color="#2196F3"
              subtext={`${stats?.approvedClaims || 0} зөвшөөрөгдсөн`}
            />
            <StatCard
              label="Зөвшөөрөгдсөн"
              value={stats?.approvedClaims || 0}
              icon="check-circle"
              color="#4CAF50"
              subtext={`${(
                ((stats?.approvedClaims || 0) /
                  Math.max(stats?.totalClaims || 1, 1)) *
                100
              ).toFixed(0)}% зөвшөөрөлт`}
            />
            <StatCard
              label="Нийт төлбөр"
              value={formatCurrency(stats?.totalPayoutAmount || 0)}
              icon="cash-multiple"
              color="#FF9800"
              subtext={`Дундаж: ${formatCurrency(stats?.avgClaimAmount || 0)}`}
            />
            <StatCard
              label="Хүлээгдэж буй"
              value={stats?.pendingClaims || 0}
              icon="clock"
              color="#FFC107"
              subtext="Шалгалт хүлээж байна"
            />
          </View>

          {/* Quick Stats */}
          {quickStats && (
            <View style={styles.section}>
              <Text style={styles.sectionTitleMain}>Хурдан тойм</Text>
              <View style={styles.quickStatsGrid}>
                <View style={styles.quickStatCard}>
                  <Text style={styles.quickStatLabel}>Өнөөдөр</Text>
                  <Text style={styles.quickStatValue}>
                    {quickStats.todayClaims}
                  </Text>
                  <Text style={styles.quickStatSubtext}>claim</Text>
                  <Text style={styles.quickStatValue}>
                    {formatCurrency(quickStats.todayPayout)}
                  </Text>
                </View>
                <View style={styles.quickStatCard}>
                  <Text style={styles.quickStatLabel}>7 хоног</Text>
                  <Text style={styles.quickStatValue}>
                    {quickStats.weekClaims}
                  </Text>
                  <Text style={styles.quickStatSubtext}>claim</Text>
                </View>
                <View style={styles.quickStatCard}>
                  <Text style={styles.quickStatLabel}>Сар</Text>
                  <Text style={styles.quickStatValue}>
                    {quickStats.monthClaims}
                  </Text>
                  <Text style={styles.quickStatSubtext}>claim</Text>
                </View>
              </View>
            </View>
          )}

          {/* Claims by Status */}
          {claimsByStatus.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitleMain}>Статусаар</Text>
              {claimsByStatus.map((item, idx) => (
                <View key={idx} style={styles.listItem}>
                  <View style={styles.listItemLeft}>
                    <StatusBadgeAdmin status={item.status} />
                    <Text style={styles.listItemText}>{item.status}</Text>
                  </View>
                  <Text style={styles.listItemCount}>{item.count}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Top Damage Types */}
          {topDamage.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitleMain}>Гэмтлийн төрлүүд</Text>
              {topDamage.map((item, idx) => (
                <View key={idx} style={styles.damageTypeItem}>
                  <View style={styles.damageTypeLeft}>
                    <Text style={styles.damageTypeName}>
                      {item.damageType}
                    </Text>
                    <Text style={styles.damageTypeCount}>
                      {item.count} claim
                    </Text>
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
          )}

          {/* High Risk Claims */}
          {highRisk.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitleMain}>
                ⚠️ Өндөр эрсдэлтэй claim
              </Text>
              {highRisk.map((claim) => (
                <View key={claim.claimId} style={styles.highRiskCard}>
                  <View style={styles.highRiskHeader}>
                    <Text style={styles.highRiskClaimNumber}>
                      {claim.claimNumber}
                    </Text>
                    <RiskBadge
                      level={claim.riskLevel as 'low' | 'medium' | 'high'}
                      size="large"
                    />
                  </View>
                  <View style={styles.highRiskContent}>
                    <InfoRow
                      label="Тээвэр"
                      value={claim.vehicleInfo}
                      icon="car"
                    />
                    <InfoRow
                      label="Санал болгосон"
                      value={formatCurrency(claim.suggestedPayout)}
                      icon="cash"
                    />
                    <InfoRow
                      label="Статус"
                      value={claim.status}
                      icon="file"
                    />
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Fraud Alerts header */}
          {fraudAlerts.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitleMain}>
                🚨 Сэжигтэй claim-үүд
              </Text>
              <Text style={styles.fraudAlertsSubtext}>
                {fraudAlerts.length} сэжигтэй claim илэрсэн
              </Text>
            </View>
          )}
        </ScrollView>
      }
      ListFooterComponent={<View style={{ height: 40 }} />}
      scrollEnabled={false}
      nestedScrollEnabled={true}
      contentContainerStyle={{
        paddingTop: insets.top,
        paddingBottom: insets.bottom + 20,
      }}
      style={styles.container}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#F44336',
    marginBottom: 20,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  retryButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginTop: 16,
  },
  sectionTitleMain: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginLeft: 16,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#f0f0f0',
  },
  sectionIndicator: {
    width: 4,
    height: 20,
    borderRadius: 2,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  quickStatsGrid: {
    flexDirection: 'row',
    marginHorizontal: 16,
    justifyContent: 'space-between',
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
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  quickStatLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  quickStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  quickStatSubtext: {
    fontSize: 10,
    color: '#999',
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  listItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  listItemText: {
    fontSize: 14,
    color: '#333',
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
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 12,
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
  },
  percentage: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    width: 40,
    textAlign: 'right',
  },
  highRiskCard: {
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  highRiskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  highRiskClaimNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  highRiskContent: {},
  fraudAlertCard: {
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  fraudAlertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  claimNumberText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  riskIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  fraudAlertContent: {},
  // ✅ flags нь string[] — шууд харуулах style
  flagsContainer: {
    gap: 4,
  },
  flagsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  flagText: {
    fontSize: 12,
    color: '#888',
    lineHeight: 18,
  },
  fraudAlertsSubtext: {
    fontSize: 12,
    color: '#999',
    marginLeft: 16,
    marginBottom: 12,
  },
});