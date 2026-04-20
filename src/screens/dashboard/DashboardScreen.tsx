import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  RefreshControl,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import { getClaims } from '../../services/claimsService';
import { getVehicles } from '../../services/vehiclesService';
import { COLORS, SPACING, RADIUS, FONT_SIZE, STATUS_COLORS } from '../../constants';
import type { Claim, Vehicle } from '../../types';

const { width: SCREEN_W } = Dimensions.get('window');

// ── Status labels ─────────────────────────────────────────────
const STATUS_LABELS: Record<string, string> = {
  draft: 'Ноорог',
  submitted: 'Илгээсэн',
  under_review: 'Хянагдаж байна',
  ai_processing: 'AI боловсруулж байна',
  pending_inspection: 'Шалгалт хүлээж байна',
  approved: 'Зөвшөөрсөн',
  partially_approved: 'Хэсэгчлэн зөвшөөрсөн',
  rejected: 'Татгалзсан',
  closed: 'Хаагдсан',
};

// ── Animated Press button ─────────────────────────────────────
const PressableCard = ({
  children,
  onPress,
  style,
}: {
  children: React.ReactNode;
  onPress: () => void;
  style?: any;
}) => {
  const scale = useRef(new Animated.Value(1)).current;
  const shadow = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 0.965, useNativeDriver: true, speed: 30 }),
      Animated.timing(shadow, { toValue: 0, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  const onPressOut = () => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20 }),
      Animated.timing(shadow, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();
  };

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={1}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
};

// ── Stat Card (3D effect) ─────────────────────────────────────
const StatCard = ({
  icon,
  label,
  value,
  color,
  bgColor,
  onPress,
}: {
  icon: string;
  label: string;
  value: string | number;
  color: string;
  bgColor: string;
  onPress?: () => void;
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () =>
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 40 }).start();
  const handlePressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20 }).start();

  return (
    <Animated.View style={{ transform: [{ scale }], flex: 1 }}>
      <TouchableOpacity
        style={[cs.statCard, { borderTopColor: color }]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        {/* 3D bottom edge */}
        <View style={[cs.statCardEdge, { backgroundColor: color + '40' }]} />
        <View style={[cs.statIconWrap, { backgroundColor: bgColor }]}>
          <Ionicons name={icon as any} size={20} color={color} />
        </View>
        <Text style={cs.statValue}>{value}</Text>
        <Text style={cs.statLabel}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ── Quick Action Button ───────────────────────────────────────
const QuickAction = ({
  icon,
  label,
  color,
  bgColor,
  onPress,
  badge,
}: {
  icon: string;
  label: string;
  color: string;
  bgColor: string;
  onPress: () => void;
  badge?: string;
}) => {
  const scale = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  const onIn = () => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 0.93, useNativeDriver: true, speed: 40 }),
      Animated.spring(translateY, { toValue: 2, useNativeDriver: true, speed: 40 }),
    ]).start();
  };

  const onOut = () => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20 }),
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, speed: 20 }),
    ]).start();
  };

  return (
    <Animated.View
      style={[
        cs.actionWrap,
        { transform: [{ scale }, { translateY }] },
      ]}
    >
      <TouchableOpacity
        style={cs.actionCard}
        onPress={onPress}
        onPressIn={onIn}
        onPressOut={onOut}
        activeOpacity={1}
      >
        {/* 3D bottom shadow layer */}
        <View style={[cs.actionCardShadow, { backgroundColor: color + '30' }]} />
        <View style={[cs.actionIconBox, { backgroundColor: bgColor }]}>
          <Ionicons name={icon as any} size={26} color={color} />
          {badge && (
            <View style={[cs.actionBadge, { backgroundColor: color }]}>
              <Text style={cs.actionBadgeText}>{badge}</Text>
            </View>
          )}
        </View>
        <Text style={cs.actionLabel}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ── Recent Claim Row ──────────────────────────────────────────
const ClaimRow = ({
  claim,
  onPress,
}: {
  claim: Claim;
  onPress: () => void;
}) => {
  const statusColor = STATUS_COLORS[claim.status] ?? { bg: '#F3F4F6', text: '#374151' };
  const date = new Date(claim.accidentDate).toLocaleDateString('mn-MN', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <TouchableOpacity style={cs.claimRow} onPress={onPress} activeOpacity={0.75}>
      <View style={[cs.claimDot, { backgroundColor: statusColor.text }]} />
      <View style={{ flex: 1 }}>
        <Text style={cs.claimNumber}>{claim.claimNumber}</Text>
        <Text style={cs.claimSub} numberOfLines={1}>
          {claim.accidentLocation}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 4 }}>
        <View style={[cs.claimBadge, { backgroundColor: statusColor.bg }]}>
          <Text style={[cs.claimBadgeText, { color: statusColor.text }]}>
            {STATUS_LABELS[claim.status] ?? claim.status}
          </Text>
        </View>
        <Text style={cs.claimDate}>{date}</Text>
      </View>
    </TouchableOpacity>
  );
};

// ════════════════════════════════════════════════════════════════
// MAIN DASHBOARD SCREEN
// ════════════════════════════════════════════════════════════════
export const DashboardScreen = () => {
  const { user } = useAuthStore();
  const navigation = useNavigation<any>();

  const [claims, setClaims] = useState<Claim[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
    fetchData();
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const [claimsData, vehiclesData] = await Promise.all([
        getClaims().catch(() => []),
        getVehicles().catch(() => []),
      ]);
      setClaims(claimsData);
      setVehicles(vehiclesData);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // ── Computed stats ──────────────────────────────────────────
  const totalClaims = claims.length;
  const pendingClaims = claims.filter(
    (c) =>
      c.status === 'submitted' ||
      c.status === 'under_review' ||
      c.status === 'pending_inspection',
  ).length;
  const approvedClaims = claims.filter((c) => c.status === 'approved').length;
  const totalVehicles = vehicles.length;

  const recentClaims = [...claims]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);

  // ── Time-based greeting ─────────────────────────────────────
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Өглөөний мэнд' : hour < 17 ? 'Өдрийн мэнд' : 'Оройн мэнд';

  const headerOpacity = headerAnim;
  const headerTranslateY = headerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-20, 0],
  });

  return (
    <SafeAreaView style={cs.safe}>
      <StatusBar barStyle="dark-content" />

      <ScrollView
        style={cs.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* ── Hero Header ─────────────────────────────────── */}
        <View style={cs.heroSection}>
          <View style={cs.heroBg} />
          <View style={cs.heroBg2} />

          <Animated.View
            style={[
              cs.header,
              { opacity: headerOpacity, transform: [{ translateY: headerTranslateY }] },
            ]}
          >
            <View style={cs.headerLeft}>
              <Text style={cs.greeting}>{greeting},</Text>
              <Text style={cs.userName}>
                {user?.firstName} {user?.lastName}
              </Text>
              {user?.role === 'admin' && (
                <View style={cs.rolePill}>
                  <Ionicons name="shield-checkmark" size={11} color="#fff" />
                  <Text style={cs.rolePillText}>Админ</Text>
                </View>
              )}
            </View>

            {/* Notification Bell — navigates to NotificationsScreen */}
            <TouchableOpacity
              style={cs.notifBtn}
              onPress={() => navigation.navigate('Notifications')}
              activeOpacity={0.8}
            >
              <Ionicons name="notifications-outline" size={22} color={COLORS.text} />
              {pendingClaims > 0 && (
                <View style={cs.notifBadge}>
                  <Text style={cs.notifBadgeText}>
                    {pendingClaims > 9 ? '9+' : pendingClaims}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* ── Stats Row ────────────────────────────────── */}
          <View style={cs.statsRow}>
            <StatCard
              icon="document-text-outline"
              label="Нийт мэдэгдэл"
              value={totalClaims}
              color="#1A56DB"
              bgColor="#EFF6FF"
              onPress={() => navigation.navigate('Claims')}
            />
            <StatCard
              icon="time-outline"
              label="Хянагдаж буй"
              value={pendingClaims}
              color="#FF8A00"
              bgColor="#FFF8EE"
              onPress={() => navigation.navigate('Claims')}
            />
            <StatCard
              icon="checkmark-circle-outline"
              label="Зөвшөөрсөн"
              value={approvedClaims}
              color="#0E9F6E"
              bgColor="#ECFDF5"
              onPress={() => navigation.navigate('Claims')}
            />
            <StatCard
              icon="car-outline"
              label="Машин"
              value={totalVehicles}
              color="#7C3AED"
              bgColor="#F5F3FF"
              onPress={() => navigation.navigate('Vehicles')}
            />
          </View>
        </View>

        {/* ── Quick Actions ──────────────────────────────── */}
        <View style={cs.section}>
          <Text style={cs.sectionTitle}>Хурдан үйлдэл</Text>
          <View style={cs.actionsGrid}>
            <QuickAction
              icon="add-circle"
              label="Мэдэгдэл гаргах"
              color="#1A56DB"
              bgColor="#EFF6FF"
              onPress={() =>
                navigation.navigate('Claims', {
                  screen: 'NewClaim',
                  params: {},
                })
              }
            />
            <QuickAction
              icon="camera"
              label="Зураг оруулах"
              color="#0E9F6E"
              bgColor="#ECFDF5"
              onPress={() =>
                navigation.navigate('Claims', { screen: 'ClaimsList' })
              }
            />
            <QuickAction
              icon="car-sport"
              label="Машин нэмэх"
              color="#7C3AED"
              bgColor="#F5F3FF"
              onPress={() => navigation.navigate('Vehicles')}
            />
            <QuickAction
              icon="search"
              label="Мэдэгдэл хайх"
              color="#FF8A00"
              bgColor="#FFF8EE"
              onPress={() =>
                navigation.navigate('Claims', { screen: 'ClaimsList' })
              }
            />
            {user?.role === 'admin' && (
              <QuickAction
                icon="analytics"
                label="Админ панел"
                color="#E02424"
                bgColor="#FEF2F2"
                onPress={() => navigation.navigate('Admin')}
              />
            )}
            <QuickAction
              icon="notifications-outline"
              label="Мэдэгдлүүд"
              color="#6B7280"
              bgColor="#F9FAFB"
              badge={pendingClaims > 0 ? String(pendingClaims) : undefined}
              onPress={() => navigation.navigate('Notifications')}
            />
          </View>
        </View>

        {/* ── Recent Claims ──────────────────────────────── */}
        <View style={[cs.section, { marginBottom: SPACING.xl }]}>
          <View style={cs.sectionRow}>
            <Text style={cs.sectionTitle}>Сүүлийн мэдэгдлүүд</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Claims')}
              style={cs.seeAllBtn}
              activeOpacity={0.75}
            >
              <Text style={cs.seeAllText}>Бүгдийг харах</Text>
              <Ionicons name="chevron-forward" size={14} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          <View style={cs.claimsCard}>
            {loading ? (
              <View style={cs.emptyBox}>
                <Text style={cs.emptyText}>Ачааллаж байна...</Text>
              </View>
            ) : recentClaims.length === 0 ? (
              <View style={cs.emptyBox}>
                <View style={cs.emptyIconWrap}>
                  <Ionicons name="document-outline" size={32} color={COLORS.textLight} />
                </View>
                <Text style={cs.emptyTitle}>Мэдэгдэл байхгүй байна</Text>
                <Text style={cs.emptySub}>
                  Шинэ мэдэгдэл гаргахын тулд дээрх товчийг дарна уу
                </Text>
                <TouchableOpacity
                  style={cs.emptyBtn}
                  onPress={() =>
                    navigation.navigate('Claims', {
                      screen: 'NewClaim',
                      params: {},
                    })
                  }
                  activeOpacity={0.8}
                >
                  <Ionicons name="add" size={16} color="#fff" />
                  <Text style={cs.emptyBtnText}>Мэдэгдэл гаргах</Text>
                </TouchableOpacity>
              </View>
            ) : (
              recentClaims.map((claim, index) => (
                <View key={claim.id}>
                  <ClaimRow
                    claim={claim}
                    onPress={() =>
                      navigation.navigate('Claims', {
                        screen: 'ClaimDetail',
                        params: { claimId: claim.id },
                      })
                    }
                  />
                  {index < recentClaims.length - 1 && <View style={cs.divider} />}
                </View>
              ))
            )}
          </View>
        </View>

        {/* ── Vehicle Summary ────────────────────────────── */}
        {vehicles.length > 0 && (
          <View style={[cs.section, { marginBottom: SPACING.xl }]}>
            <View style={cs.sectionRow}>
              <Text style={cs.sectionTitle}>Миний машинууд</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Vehicles')}
                style={cs.seeAllBtn}
                activeOpacity={0.75}
              >
                <Text style={cs.seeAllText}>Бүгдийг харах</Text>
                <Ionicons name="chevron-forward" size={14} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginHorizontal: -SPACING.lg }}
            >
              <View style={{ flexDirection: 'row', paddingHorizontal: SPACING.lg, gap: 12 }}>
                {vehicles.slice(0, 5).map((v) => (
                  <TouchableOpacity
                    key={v.id}
                    style={cs.vehicleChip}
                    onPress={() => navigation.navigate('Vehicles')}
                    activeOpacity={0.8}
                  >
                    <View style={cs.vehicleChipIcon}>
                      <Ionicons name="car-sport" size={22} color={COLORS.primary} />
                    </View>
                    <Text style={cs.vehicleChipName}>
                      {v.make} {v.model}
                    </Text>
                    <Text style={cs.vehicleChipPlate}>{v.licensePlate}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={[cs.vehicleChip, cs.vehicleAddChip]}
                  onPress={() => navigation.navigate('Vehicles')}
                  activeOpacity={0.8}
                >
                  <View style={[cs.vehicleChipIcon, { backgroundColor: '#F3F4F6' }]}>
                    <Ionicons name="add" size={22} color={COLORS.textMuted} />
                  </View>
                  <Text style={[cs.vehicleChipName, { color: COLORS.textMuted }]}>
                    Нэмэх
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        )}

        <View style={{ height: SPACING.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
};

// ── Styles ────────────────────────────────────────────────────
const cs = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  scroll: { flex: 1 },

  heroSection: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    ...Platform.select({
      ios: {
        shadowColor: '#1A56DB',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
      },
      android: { elevation: 4 },
    }),
  },
  heroBg: {
    position: 'absolute', top: -40, right: -40,
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: '#EFF6FF', opacity: 0.6,
  },
  heroBg2: {
    position: 'absolute', bottom: -20, left: -20,
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: '#F0FDF4', opacity: 0.5,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  headerLeft: { flex: 1 },
  greeting: { fontSize: FONT_SIZE.sm, color: COLORS.textMuted, marginBottom: 2 },
  userName: {
    fontSize: FONT_SIZE.xl + 2,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  rolePill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.danger, borderRadius: RADIUS.full,
    paddingHorizontal: 8, paddingVertical: 3,
    alignSelf: 'flex-start', marginTop: 6,
  },
  rolePillText: { fontSize: 10, fontWeight: '700', color: '#fff' },

  notifBtn: {
    width: 44, height: 44, borderRadius: RADIUS.md,
    backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#E5E7EB', position: 'relative',
  },
  notifBadge: {
    position: 'absolute', top: 6, right: 6,
    minWidth: 16, height: 16, borderRadius: 8,
    backgroundColor: COLORS.danger, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 3,
  },
  notifBadgeText: { fontSize: 9, color: '#fff', fontWeight: '700' },

  statsRow: {
    flexDirection: 'row', gap: 10, paddingTop: 4, paddingBottom: 4,
  },
  statCard: {
    backgroundColor: '#fff', borderRadius: RADIUS.md, padding: 12, flex: 1,
    borderTopWidth: 3, borderWidth: 1, borderColor: '#F1F5F9',
    position: 'relative', overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 6 },
      android: { elevation: 3 },
    }),
  },
  statCardEdge: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 3,
    borderBottomLeftRadius: RADIUS.md, borderBottomRightRadius: RADIUS.md,
  },
  statIconWrap: {
    width: 34, height: 34, borderRadius: RADIUS.sm,
    justifyContent: 'center', alignItems: 'center', marginBottom: 8,
  },
  statValue: { fontSize: FONT_SIZE.xl, fontWeight: '800', color: COLORS.text },
  statLabel: { fontSize: 10, color: COLORS.textMuted, marginTop: 2 },

  section: { paddingHorizontal: SPACING.lg, marginTop: SPACING.lg },
  sectionTitle: {
    fontSize: FONT_SIZE.md + 1, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.sm,
  },
  sectionRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: SPACING.sm,
  },
  seeAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  seeAllText: { fontSize: FONT_SIZE.sm, color: COLORS.primary, fontWeight: '600' },

  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  actionWrap: { width: (SCREEN_W - SPACING.lg * 2 - 12 * 2) / 3 },
  actionCard: {
    backgroundColor: '#fff', borderRadius: RADIUS.lg, padding: 14, alignItems: 'center',
    borderWidth: 1, borderColor: '#F1F5F9', position: 'relative', overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 8 },
      android: { elevation: 4 },
    }),
  },
  actionCardShadow: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 4,
    borderBottomLeftRadius: RADIUS.lg, borderBottomRightRadius: RADIUS.lg,
  },
  actionIconBox: {
    width: 52, height: 52, borderRadius: RADIUS.md,
    justifyContent: 'center', alignItems: 'center', marginBottom: 8, position: 'relative',
  },
  actionBadge: {
    position: 'absolute', top: -4, right: -4,
    minWidth: 16, height: 16, borderRadius: 8,
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3,
  },
  actionBadgeText: { fontSize: 9, color: '#fff', fontWeight: '700' },
  actionLabel: {
    fontSize: 11, fontWeight: '600', color: COLORS.text, textAlign: 'center', lineHeight: 15,
  },

  claimsCard: {
    backgroundColor: '#fff', borderRadius: RADIUS.lg, borderWidth: 1,
    borderColor: '#F1F5F9', overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  claimRow: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    paddingHorizontal: SPACING.md, paddingVertical: 13,
  },
  claimDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  claimNumber: { fontSize: FONT_SIZE.sm, fontWeight: '700', color: COLORS.text },
  claimSub: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, marginTop: 2 },
  claimBadge: { borderRadius: RADIUS.full, paddingHorizontal: 8, paddingVertical: 3 },
  claimBadgeText: { fontSize: 10, fontWeight: '600' },
  claimDate: { fontSize: 10, color: COLORS.textLight },
  divider: { height: 1, backgroundColor: '#F8FAFC', marginHorizontal: SPACING.md },

  emptyBox: { alignItems: 'center', padding: SPACING.xl, gap: 8 },
  emptyIconWrap: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: '#F3F4F6',
    justifyContent: 'center', alignItems: 'center', marginBottom: 4,
  },
  emptyTitle: { fontSize: FONT_SIZE.sm, fontWeight: '700', color: COLORS.textMuted },
  emptySub: { fontSize: FONT_SIZE.xs, color: COLORS.textLight, textAlign: 'center', lineHeight: 18 },
  emptyText: { fontSize: FONT_SIZE.sm, color: COLORS.textMuted },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.primary, borderRadius: RADIUS.md,
    paddingHorizontal: 16, paddingVertical: 10, marginTop: 4,
  },
  emptyBtnText: { color: '#fff', fontSize: FONT_SIZE.sm, fontWeight: '700' },

  vehicleChip: {
    backgroundColor: '#fff', borderRadius: RADIUS.lg, padding: 14, alignItems: 'center',
    borderWidth: 1, borderColor: '#F1F5F9', width: 110,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6 },
      android: { elevation: 2 },
    }),
  },
  vehicleAddChip: { borderStyle: 'dashed', borderColor: '#D1D5DB' },
  vehicleChipIcon: {
    width: 44, height: 44, borderRadius: RADIUS.sm, backgroundColor: '#EFF6FF',
    justifyContent: 'center', alignItems: 'center', marginBottom: 8,
  },
  vehicleChipName: { fontSize: 11, fontWeight: '700', color: COLORS.text, textAlign: 'center' },
  vehicleChipPlate: { fontSize: 10, color: COLORS.textMuted, marginTop: 2, textAlign: 'center' },
});
