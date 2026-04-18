import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SPACING, RADIUS, FONT_SIZE, STATUS_COLORS } from '../../constants';
import { getClaims } from '../../services/claimsService';
import type { Claim, ClaimsStackParamList } from '../../types';

type Props = {
  navigation: NativeStackNavigationProp<ClaimsStackParamList, 'ClaimsList'>;
};

// ── Status label Монгол ────────────────────────────────────────
const STATUS_LABELS: Record<string, string> = {
  draft:              'Ноорог',
  submitted:          'Илгээсэн',
  under_review:       'Хянагдаж байна',
  ai_processing:      'AI боловсруулж байна',
  pending_inspection: 'Шалгалт хүлээж байна',
  approved:           'Зөвшөөрсөн',
  partially_approved: 'Хэсэгчлэн зөвшөөрсөн',
  rejected:           'Татгалзсан',
  closed:             'Хаагдсан',
};

// ── Accident type Монгол ───────────────────────────────────────
const TYPE_LABELS: Record<string, string> = {
  collision:    'Мөргөлдөөн',
  rear_end:     'Ар талаас',
  side_impact:  'Хажуугийн цохилт',
  rollover:     'Эргэлт',
  hit_and_run:  'Зугтсан',
  weather:      'Цаг агаар',
  vandalism:    'Хулгай/Эвдрэл',
  theft:        'Хулгай',
  fire:         'Түймэр',
  flood:        'Үер',
  other:        'Бусад',
};

// ── StatusBadge ───────────────────────────────────────────────
const StatusBadge = ({ status }: { status: string }) => {
  const colors = STATUS_COLORS[status] ?? { bg: '#F3F4F6', text: '#374151' };
  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <Text style={[styles.badgeText, { color: colors.text }]}>
        {STATUS_LABELS[status] ?? status}
      </Text>
    </View>
  );
};

// ── ClaimCard ─────────────────────────────────────────────────
const ClaimCard = ({
  claim,
  onPress,
}: {
  claim: Claim;
  onPress: () => void;
}) => {
  const date = new Date(claim.accidentDate).toLocaleDateString('mn-MN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {/* Зүүн өнгөт зурвас */}
      <View
        style={[
          styles.cardAccent,
          {
            backgroundColor:
              STATUS_COLORS[claim.status]?.text ?? COLORS.primary,
          },
        ]}
      />

      <View style={styles.cardBody}>
        {/* Header: claim number + status */}
        <View style={styles.cardHeader}>
          <View style={styles.claimNumberRow}>
            <Ionicons
              name="document-text"
              size={16}
              color={COLORS.primary}
            />
            <Text style={styles.claimNumber}>{claim.claimNumber}</Text>
          </View>
          <StatusBadge status={claim.status} />
        </View>

        {/* Accident type */}
        <Text style={styles.accidentType}>
          {TYPE_LABELS[claim.accidentType] ?? claim.accidentType}
        </Text>

        {/* Location */}
        <View style={styles.metaRow}>
          <Ionicons
            name="location-outline"
            size={13}
            color={COLORS.textMuted}
          />
          <Text style={styles.metaText} numberOfLines={1}>
            {claim.accidentLocation}
          </Text>
        </View>

        {/* Date + arrow */}
        <View style={styles.cardFooter}>
          <View style={styles.metaRow}>
            <Ionicons
              name="calendar-outline"
              size={13}
              color={COLORS.textMuted}
            />
            <Text style={styles.metaText}>{date}</Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={COLORS.textLight}
          />
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ── Main Screen ───────────────────────────────────────────────
export const ClaimsScreen = ({ navigation }: Props) => {
  const [claims, setClaims]       = useState<Claim[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchClaims = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await getClaims();
      setClaims(data);
    } catch {
      Alert.alert('Алдаа', 'Мэдэгдлүүдийг ачааллахад алдаа гарлаа');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Screen focus болгонд refresh хийнэ (CreateClaim-с буцахад)
  useFocusEffect(
    useCallback(() => {
      fetchClaims();
    }, [fetchClaims]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchClaims(true);
  };

  const renderEmpty = () => (
    <View style={styles.emptyBox}>
      <View style={styles.emptyIconBox}>
        <Ionicons name="document-outline" size={48} color={COLORS.textLight} />
      </View>
      <Text style={styles.emptyTitle}>Мэдэгдэл байхгүй байна</Text>
      <Text style={styles.emptySub}>
        Ослын мэдэгдэл гаргахын тулд "+" товч дарна уу
      </Text>
      <TouchableOpacity
        style={styles.emptyBtn}
        onPress={() => navigation.navigate('NewClaim', {})}
        activeOpacity={0.85}
      >
        <Ionicons name="add-circle-outline" size={18} color={COLORS.white} />
        <Text style={styles.emptyBtnText}>Мэдэгдэл гаргах</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Мэдэгдлүүд</Text>
          <Text style={styles.headerSub}>
            {claims.length} мэдэгдэл
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('NewClaim', {})}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={22} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Ачааллаж байна...</Text>
        </View>
      ) : (
        <FlatList
          data={claims}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ClaimCard
              claim={item}
              onPress={() =>
                navigation.navigate('ClaimDetail', { claimId: item.id })
              }
            />
          )}
          contentContainerStyle={[
            styles.listContent,
            claims.length === 0 && styles.listEmpty,
          ]}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

// ── Styles ────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  headerTitle: { fontSize: FONT_SIZE.xl, fontWeight: '700', color: COLORS.text },
  headerSub:   { fontSize: FONT_SIZE.sm, color: COLORS.textMuted, marginTop: 2 },
  addBtn: {
    width: 44, height: 44, borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },

  loadingBox:  { flex: 1, justifyContent: 'center', alignItems: 'center', gap: SPACING.sm },
  loadingText: { fontSize: FONT_SIZE.sm, color: COLORS.textMuted },

  listContent: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xl },
  listEmpty:   { flex: 1, justifyContent: 'center' },

  // Card
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.sm,
    borderWidth: 1, borderColor: COLORS.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  cardAccent:  { width: 4 },
  cardBody:    { flex: 1, padding: SPACING.md },
  cardHeader:  {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  claimNumberRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  claimNumber: { fontSize: FONT_SIZE.sm, fontWeight: '700', color: COLORS.primary },
  accidentType: {
    fontSize: FONT_SIZE.md, fontWeight: '600',
    color: COLORS.text, marginBottom: 6,
  },
  metaRow:    { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  metaText:   { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, flex: 1 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 },

  // Badge
  badge: { borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: '600' },

  // Empty
  emptyBox: { alignItems: 'center', paddingVertical: SPACING.xxl, gap: SPACING.sm },
  emptyIconBox: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: COLORS.border,
    justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.sm,
  },
  emptyTitle: { fontSize: FONT_SIZE.lg, fontWeight: '700', color: COLORS.textMuted },
  emptySub:   { fontSize: FONT_SIZE.sm, color: COLORS.textLight, textAlign: 'center', lineHeight: 20 },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: COLORS.primary, borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg, paddingVertical: 12, marginTop: SPACING.sm,
  },
  emptyBtnText: { color: COLORS.white, fontWeight: '700', fontSize: FONT_SIZE.sm },
});