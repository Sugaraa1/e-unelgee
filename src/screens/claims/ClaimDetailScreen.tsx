import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { COLORS, SPACING, RADIUS, FONT_SIZE, STATUS_COLORS } from '../../constants';
import { getClaimById } from '../../services/claimsService';
import type { Claim, ClaimsStackParamList } from '../../types';

type Props = {
  navigation: NativeStackNavigationProp<ClaimsStackParamList, 'ClaimDetail'>;
  route: RouteProp<ClaimsStackParamList, 'ClaimDetail'>;
};

// ── Labels ────────────────────────────────────────────────────
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

const TYPE_LABELS: Record<string, string> = {
  collision:    'Мөргөлдөөн',
  rear_end:     'Ар талаас',
  side_impact:  'Хажуугийн цохилт',
  rollover:     'Эргэлт',
  hit_and_run:  'Зугтсан',
  weather:      'Цаг агаар',
  vandalism:    'Эвдрэл/Хулгай',
  theft:        'Хулгай',
  fire:         'Түймэр',
  flood:        'Үер',
  other:        'Бусад',
};

const SEVERITY_LABELS: Record<string, string> = {
  minor:      'Бага',
  moderate:   'Дунд',
  severe:     'Хүнд',
  total_loss: 'Бүрэн гэмтэл',
};

const SEVERITY_COLORS: Record<string, string> = {
  minor:      COLORS.secondary,
  moderate:   COLORS.warning,
  severe:     COLORS.danger,
  total_loss: '#7C3AED',
};

// ── Reusable sub-components ───────────────────────────────────

/** Хэсгийн гарчиг */
const SectionTitle = ({ icon, title }: { icon: string; title: string }) => (
  <View style={styles.sectionHeader}>
    <Ionicons name={icon as any} size={16} color={COLORS.primary} />
    <Text style={styles.sectionTitle}>{title}</Text>
  </View>
);

/** Мэдээллийн мөр */
const InfoRow = ({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={[styles.infoValue, mono && styles.monoValue]}>{value}</Text>
  </View>
);

/** Status badge */
const StatusBadge = ({ status }: { status: string }) => {
  const colors = STATUS_COLORS[status] ?? { bg: '#F3F4F6', text: '#374151' };
  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <View
        style={[styles.badgeDot, { backgroundColor: colors.text }]}
      />
      <Text style={[styles.badgeText, { color: colors.text }]}>
        {STATUS_LABELS[status] ?? status}
      </Text>
    </View>
  );
};

// ── Main Screen ───────────────────────────────────────────────
export const ClaimDetailScreen = ({ navigation, route }: Props) => {
  const { claimId } = route.params;
  const [claim, setClaim]   = useState<Claim | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await getClaimById(claimId);
        setClaim(data);
      } catch {
        Alert.alert('Алдаа', 'Мэдэгдлийн мэдээлэл ачааллахад алдаа гарлаа', [
          { text: 'Буцах', onPress: () => navigation.goBack() },
        ]);
      } finally {
        setLoading(false);
      }
    })();
  }, [claimId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Ачааллаж байна...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!claim) return null;

  const accidentDate = new Date(claim.accidentDate).toLocaleDateString('mn-MN', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  const createdDate = new Date(claim.createdAt).toLocaleDateString('mn-MN', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {claim.claimNumber}
          </Text>
          <Text style={styles.headerSub}>Мэдэгдлийн дэлгэрэнгүй</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero Card: status + claim number ─────────────── */}
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={styles.heroIcon}>
              <Ionicons name="document-text" size={28} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroClaimNumber}>{claim.claimNumber}</Text>
              <Text style={styles.heroDate}>Үүссэн: {createdDate}</Text>
            </View>
          </View>

          <View style={styles.heroBottom}>
            <StatusBadge status={claim.status} />
            {claim.severity && (
              <View
                style={[
                  styles.severityBadge,
                  {
                    backgroundColor:
                      (SEVERITY_COLORS[claim.severity] ?? COLORS.warning) + '18',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.severityText,
                    { color: SEVERITY_COLORS[claim.severity] ?? COLORS.warning },
                  ]}
                >
                  {SEVERITY_LABELS[claim.severity] ?? claim.severity}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Ослын мэдээлэл ───────────────────────────────── */}
        <View style={styles.card}>
          <SectionTitle icon="warning-outline" title="Ослын мэдээлэл" />
          <InfoRow label="Ослын төрөл"  value={TYPE_LABELS[claim.accidentType] ?? claim.accidentType} />
          <InfoRow label="Ослын огноо"  value={accidentDate} />
          <InfoRow label="Байршил"      value={claim.accidentLocation} />
          {claim.latitude && claim.longitude && (
            <InfoRow
              label="GPS"
              value={`${claim.latitude.toFixed(6)}, ${claim.longitude.toFixed(6)}`}
              mono
            />
          )}
        </View>

        {/* ── Тайлбар ──────────────────────────────────────── */}
        <View style={styles.card}>
          <SectionTitle icon="reader-outline" title="Тайлбар" />
          <Text style={styles.description}>{claim.description}</Text>
        </View>

        {/* ── Машины мэдээлэл ──────────────────────────────── */}
        {claim.vehicle && (
          <View style={styles.card}>
            <SectionTitle icon="car-outline" title="Тээвэр хэрэгсэл" />
            <View style={styles.vehicleBox}>
              <View style={styles.vehicleIcon}>
                <Ionicons name="car-sport" size={24} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.vehicleName}>
                  {claim.vehicle.make} {claim.vehicle.model}
                </Text>
                <Text style={styles.vehicleSub}>
                  {claim.vehicle.year} он • {claim.vehicle.color}
                </Text>
                <View style={styles.plateBox}>
                  <Text style={styles.plateText}>
                    {claim.vehicle.licensePlate}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ── Гуравдагч тал ────────────────────────────────── */}
        {claim.thirdPartyInvolved && (
          <View style={styles.card}>
            <SectionTitle icon="people-outline" title="Гуравдагч тал" />
            {claim.thirdPartyName && (
              <InfoRow label="Нэр"         value={claim.thirdPartyName} />
            )}
            {claim.thirdPartyLicensePlate && (
              <InfoRow label="Улсын дугаар" value={claim.thirdPartyLicensePlate} />
            )}
            {claim.thirdPartyInsurance && (
              <InfoRow label="Даатгал"     value={claim.thirdPartyInsurance} />
            )}
            {claim.thirdPartyPolicyNumber && (
              <InfoRow label="Гэрээний №"  value={claim.thirdPartyPolicyNumber} mono />
            )}
          </View>
        )}

        {/* ── Цагдаагийн тайлан ────────────────────────────── */}
        <View style={styles.card}>
          <SectionTitle icon="shield-outline" title="Цагдаагийн тайлан" />
          <View style={styles.boolRow}>
            <Ionicons
              name={
                claim.policeReportFiled
                  ? 'checkmark-circle'
                  : 'close-circle'
              }
              size={20}
              color={
                claim.policeReportFiled ? COLORS.secondary : COLORS.textLight
              }
            />
            <Text
              style={[
                styles.boolText,
                {
                  color: claim.policeReportFiled
                    ? COLORS.secondary
                    : COLORS.textMuted,
                },
              ]}
            >
              {claim.policeReportFiled
                ? 'Цагдаагийн тайлан бичигдсэн'
                : 'Цагдаагийн тайлан бичигдээгүй'}
            </Text>
          </View>
          {claim.policeReportNumber && (
            <InfoRow label="Тайлангийн №" value={claim.policeReportNumber} mono />
          )}
        </View>

        {/* ── Санхүүгийн мэдээлэл ──────────────────────────── */}
        {claim.estimatedRepairCost != null && (
          <View style={[styles.card, styles.financialCard]}>
            <SectionTitle icon="cash-outline" title="Санхүүгийн үнэлгээ" />
            <View style={styles.costBox}>
              <Text style={styles.costLabel}>Тооцоолсон засварын зардал</Text>
              <Text style={styles.costValue}>
                ₮{Number(claim.estimatedRepairCost).toLocaleString()}
              </Text>
            </View>
          </View>
        )}

        <View style={{ height: SPACING.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
};

// ── Styles ────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: COLORS.background },
  loadingBox:  { flex: 1, justifyContent: 'center', alignItems: 'center', gap: SPACING.sm },
  loadingText: { fontSize: FONT_SIZE.sm, color: COLORS.textMuted },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: RADIUS.md,
    backgroundColor: COLORS.background, justifyContent: 'center',
    alignItems: 'center', borderWidth: 1, borderColor: COLORS.border,
  },
  headerTitle: { fontSize: FONT_SIZE.lg, fontWeight: '700', color: COLORS.text },
  headerSub:   { fontSize: FONT_SIZE.xs, color: COLORS.textMuted },

  content: { padding: SPACING.lg, gap: SPACING.md },

  // Hero card
  heroCard: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg,
    padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.md },
  heroIcon: {
    width: 52, height: 52, borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary + '12',
    justifyContent: 'center', alignItems: 'center',
  },
  heroClaimNumber: { fontSize: FONT_SIZE.xl, fontWeight: '800', color: COLORS.text },
  heroDate:        { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, marginTop: 2 },
  heroBottom:      { flexDirection: 'row', gap: SPACING.sm, flexWrap: 'wrap' },

  // Status badge
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: RADIUS.full, paddingHorizontal: 12, paddingVertical: 5,
  },
  badgeDot:  { width: 7, height: 7, borderRadius: 4 },
  badgeText: { fontSize: 12, fontWeight: '700' },

  // Severity badge
  severityBadge: { borderRadius: RADIUS.full, paddingHorizontal: 12, paddingVertical: 5 },
  severityText:  { fontSize: 12, fontWeight: '700' },

  // Section card
  card: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg,
    padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border,
    gap: SPACING.sm,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  financialCard: { borderColor: COLORS.secondary + '40' },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  sectionTitle:  { fontSize: FONT_SIZE.sm, fontWeight: '700', color: COLORS.text },

  // Info row
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', paddingVertical: 4,
    borderBottomWidth: 1, borderBottomColor: COLORS.background,
  },
  infoLabel: { fontSize: FONT_SIZE.sm, color: COLORS.textMuted, flex: 1 },
  infoValue: { fontSize: FONT_SIZE.sm, color: COLORS.text, fontWeight: '500', flex: 2, textAlign: 'right' },
  monoValue: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },

  // Description
  description: {
    fontSize: FONT_SIZE.sm, color: COLORS.text,
    lineHeight: 22, paddingTop: 4,
  },

  // Vehicle box
  vehicleBox: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    backgroundColor: COLORS.background, borderRadius: RADIUS.md, padding: SPACING.md,
  },
  vehicleIcon: {
    width: 48, height: 48, borderRadius: RADIUS.sm,
    backgroundColor: COLORS.primary + '12',
    justifyContent: 'center', alignItems: 'center',
  },
  vehicleName: { fontSize: FONT_SIZE.md, fontWeight: '700', color: COLORS.text },
  vehicleSub:  { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, marginTop: 2 },
  plateBox:    {
    marginTop: 6, backgroundColor: COLORS.surface, borderRadius: RADIUS.sm,
    paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start',
    borderWidth: 1, borderColor: COLORS.border,
  },
  plateText: { fontSize: FONT_SIZE.sm, fontWeight: '700', color: COLORS.text, letterSpacing: 1 },

  // Bool row
  boolRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  boolText: { fontSize: FONT_SIZE.sm, fontWeight: '500' },

  // Financial
  costBox:   { backgroundColor: COLORS.background, borderRadius: RADIUS.md, padding: SPACING.md, alignItems: 'center' },
  costLabel: { fontSize: FONT_SIZE.sm, color: COLORS.textMuted },
  costValue: { fontSize: FONT_SIZE.xxl, fontWeight: '800', color: COLORS.secondary, marginTop: 4 },
});

// Platform import (monoValue style-д ашиглана)
//import { Platform } from 'react-native';