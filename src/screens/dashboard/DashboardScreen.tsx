import React from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { COLORS, SPACING, RADIUS, FONT_SIZE, STATUS_COLORS } from '../../constants';

const StatCard = ({ icon, label, value, color }: {
  icon: string; label: string; value: string; color: string;
}) => (
  <View style={[styles.statCard, { borderLeftColor: color }]}>
    <View style={[styles.statIcon, { backgroundColor: color + '18' }]}>
      <Ionicons name={icon as any} size={20} color={color} />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const QuickAction = ({ icon, label, color, onPress }: {
  icon: string; label: string; color: string; onPress: () => void;
}) => (
  <TouchableOpacity style={styles.actionCard} onPress={onPress} activeOpacity={0.8}>
    <View style={[styles.actionIcon, { backgroundColor: color + '15' }]}>
      <Ionicons name={icon as any} size={24} color={color} />
    </View>
    <Text style={styles.actionLabel}>{label}</Text>
  </TouchableOpacity>
);

export const DashboardScreen = () => {
  const { user } = useAuthStore();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Сайн байна уу,</Text>
            <Text style={styles.userName}>{user?.firstName} 👋</Text>
          </View>
          <TouchableOpacity style={styles.notifBtn}>
            <Ionicons name="notifications-outline" size={22} color={COLORS.text} />
            <View style={styles.notifDot} />
          </TouchableOpacity>
        </View>

        {/* DEBUG: Show user role */}
        <View style={styles.debugBox}>
          <Text style={styles.debugLabel}>User Role:</Text>
          <Text style={styles.debugValue}>{user?.role || 'unknown'}</Text>
          {user?.role !== 'admin' && (
            <Text style={styles.debugHint}>
              💡 To see Admin Dashboard, your role must be "admin"
            </Text>
          )}
        </View>

        {/* Stats */}
        <Text style={styles.sectionTitle}>Тойм</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsRow}>
          <StatCard icon="document-text-outline" label="Нийт мэдэгдэл" value="0" color={COLORS.primary} />
          <StatCard icon="time-outline"          label="Хянагдаж байна" value="0" color={COLORS.warning} />
          <StatCard icon="checkmark-circle-outline" label="Зөвшөөрсөн" value="0" color={COLORS.secondary} />
          <StatCard icon="car-outline"           label="Тээвэр хэрэгсэл" value="0" color={COLORS.info} />
        </ScrollView>

        {/* Quick actions */}
        <Text style={styles.sectionTitle}>Хурдан үйлдэл</Text>
        <View style={styles.actionsGrid}>
          <QuickAction icon="add-circle-outline"      label="Мэдэгдэл гаргах" color={COLORS.primary}   onPress={() => {}} />
          <QuickAction icon="camera-outline"           label="Зураг оруулах"   color={COLORS.secondary} onPress={() => {}} />
          <QuickAction icon="car-outline"              label="Машин нэмэх"     color={COLORS.info}      onPress={() => {}} />
          <QuickAction icon="search-outline"           label="Хайх"            color={COLORS.warning}   onPress={() => {}} />
        </View>

        {/* Recent */}
        <Text style={styles.sectionTitle}>Сүүлийн мэдэгдлүүд</Text>
        <View style={styles.emptyBox}>
          <Ionicons name="document-outline" size={40} color={COLORS.textLight} />
          <Text style={styles.emptyText}>Мэдэгдэл байхгүй байна</Text>
          <Text style={styles.emptySubtext}>Шинэ мэдэгдэл гаргахын тулд дээрх товчийг дарна уу</Text>
        </View>

        <View style={{ height: SPACING.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: COLORS.background },
  scroll:       { flex: 1, paddingHorizontal: SPACING.lg },

  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: SPACING.lg, paddingBottom: SPACING.md },
  greeting:     { fontSize: FONT_SIZE.sm, color: COLORS.textMuted },
  userName:     { fontSize: FONT_SIZE.xl, fontWeight: '700', color: COLORS.text },
  notifBtn:     { width: 42, height: 42, borderRadius: RADIUS.md, backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  notifDot:     { position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.danger },

  sectionTitle: { fontSize: FONT_SIZE.lg, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.sm, marginTop: SPACING.lg },

  statsRow:     { marginHorizontal: -SPACING.lg, paddingHorizontal: SPACING.lg },
  statCard:     { backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: SPACING.md, marginRight: SPACING.sm, width: 130, borderLeftWidth: 3, borderWidth: 1, borderColor: COLORS.border },
  statIcon:     { width: 36, height: 36, borderRadius: RADIUS.sm, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.sm },
  statValue:    { fontSize: FONT_SIZE.xxl, fontWeight: '800', color: COLORS.text },
  statLabel:    { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, marginTop: 2 },

  actionsGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  actionCard:   { backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: SPACING.md, width: '47.5%', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  actionIcon:   { width: 48, height: 48, borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.sm },
  actionLabel:  { fontSize: FONT_SIZE.sm, fontWeight: '600', color: COLORS.text, textAlign: 'center' },

  emptyBox:     { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.xl, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  emptyText:    { fontSize: FONT_SIZE.md, fontWeight: '600', color: COLORS.textMuted, marginTop: SPACING.sm },
  emptySubtext: { fontSize: FONT_SIZE.sm, color: COLORS.textLight, textAlign: 'center', marginTop: SPACING.xs, lineHeight: 20 },

  // Debug styles
  debugBox:     { backgroundColor: '#FFF3CD', borderRadius: RADIUS.md, padding: SPACING.md, marginVertical: SPACING.md, borderLeftWidth: 4, borderLeftColor: '#FFC107' },
  debugLabel:   { fontSize: FONT_SIZE.sm, fontWeight: '600', color: '#856404' },
  debugValue:   { fontSize: FONT_SIZE.md, fontWeight: '700', color: '#2C3E50', marginTop: 4 },
  debugHint:    { fontSize: FONT_SIZE.xs, color: '#856404', marginTop: 8, fontStyle: 'italic' },
});