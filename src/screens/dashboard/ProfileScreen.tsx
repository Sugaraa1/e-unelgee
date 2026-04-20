import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../../constants';
import { EditProfileModal } from '../../components/EditProfileModal';
import { ChangePasswordModal } from '../../components/ChangePasswordModal';
import { NotificationSettingsModal } from '../../components/NotificationSettingsModal';
import type { User } from '../../types';

// ── Menu Row ──────────────────────────────────────────────────
const MenuRow = ({
  icon,
  label,
  sublabel,
  iconColor,
  iconBg,
  onPress,
  danger,
  badge,
}: {
  icon: string;
  label: string;
  sublabel?: string;
  iconColor: string;
  iconBg: string;
  onPress: () => void;
  danger?: boolean;
  badge?: string;
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        style={cs.menuRow}
        onPress={onPress}
        onPressIn={() =>
          Animated.spring(scale, { toValue: 0.98, useNativeDriver: true, speed: 40 }).start()
        }
        onPressOut={() =>
          Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20 }).start()
        }
        activeOpacity={1}
      >
        <View style={[cs.menuIcon, { backgroundColor: iconBg }]}>
          <Ionicons name={icon as any} size={19} color={iconColor} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[cs.menuLabel, danger && { color: COLORS.danger }]}>{label}</Text>
          {sublabel && <Text style={cs.menuSublabel}>{sublabel}</Text>}
        </View>
        {badge && (
          <View style={cs.rowBadge}>
            <Text style={cs.rowBadgeText}>{badge}</Text>
          </View>
        )}
        <Ionicons
          name="chevron-forward"
          size={16}
          color={danger ? COLORS.danger + '80' : COLORS.textLight}
        />
      </TouchableOpacity>
    </Animated.View>
  );
};

export const ProfileScreen = () => {
  const { user, logout, setUser } = useAuthStore();

  const [editVisible, setEditVisible] = useState(false);
  const [pwVisible, setPwVisible] = useState(false);
  const [notifVisible, setNotifVisible] = useState(false);

  const handleLogout = () => {
    Alert.alert('Гарах', 'Системээс гарахдаа итгэлтэй байна уу?', [
      { text: 'Болих', style: 'cancel' },
      { text: 'Гарах', style: 'destructive', onPress: () => logout() },
    ]);
  };

  const handleUserSaved = (updated: User) => {
    setUser(updated);
  };

  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase();

  const ROLE_LABEL: Record<string, string> = {
    user: 'Хэрэглэгч',
    adjuster: 'Шинжилгээч',
    admin: 'Системийн Админ',
  };

  const ROLE_COLOR: Record<string, string> = {
    user: '#1A56DB',
    adjuster: '#7C3AED',
    admin: '#E02424',
  };

  const roleColor = ROLE_COLOR[user?.role ?? 'user'] ?? '#1A56DB';

  return (
    <SafeAreaView style={cs.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ── Hero ─────────────────────────────────────── */}
        <View style={cs.hero}>
          <View style={cs.heroBg} />
          <View style={cs.heroContent}>
            <TouchableOpacity
              style={[cs.avatar, { backgroundColor: roleColor + '20', borderColor: roleColor + '40' }]}
              onPress={() => setEditVisible(true)}
              activeOpacity={0.85}
            >
              <Text style={[cs.avatarText, { color: roleColor }]}>{initials}</Text>
              <View style={cs.avatarEditDot}>
                <Ionicons name="pencil" size={10} color="#fff" />
              </View>
            </TouchableOpacity>
            <Text style={cs.heroName}>{user?.firstName} {user?.lastName}</Text>
            <Text style={cs.heroEmail}>{user?.email}</Text>
            <View style={[cs.roleBadge, { backgroundColor: roleColor + '15', borderColor: roleColor + '30' }]}>
              <Ionicons
                name={
                  user?.role === 'admin'
                    ? 'shield-checkmark'
                    : user?.role === 'adjuster'
                    ? 'briefcase'
                    : 'person'
                }
                size={12}
                color={roleColor}
              />
              <Text style={[cs.roleText, { color: roleColor }]}>
                {ROLE_LABEL[user?.role ?? 'user']}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Info Card ─────────────────────────────────── */}
        {(user?.phoneNumber || user?.insuranceProvider) && (
          <View style={cs.infoCard}>
            {user?.phoneNumber && (
              <View style={cs.infoRow}>
                <Ionicons name="call-outline" size={16} color={COLORS.textMuted} />
                <Text style={cs.infoText}>{user.phoneNumber}</Text>
              </View>
            )}
            {user?.insuranceProvider && (
              <View style={cs.infoRow}>
                <Ionicons name="shield-outline" size={16} color={COLORS.textMuted} />
                <Text style={cs.infoText}>{user.insuranceProvider}</Text>
              </View>
            )}
            {user?.insurancePolicyNumber && (
              <View style={cs.infoRow}>
                <Ionicons name="card-outline" size={16} color={COLORS.textMuted} />
                <Text style={cs.infoText}>{user.insurancePolicyNumber}</Text>
              </View>
            )}
          </View>
        )}

        {/* ── Menu Groups ────────────────────────────────── */}
        <View style={cs.menuGroup}>
          <Text style={cs.menuGroupTitle}>Дансны тохиргоо</Text>
          <View style={cs.menuCard}>
            <MenuRow
              icon="person-outline"
              label="Профайл засах"
              sublabel="Нэр, холбоо барих мэдээлэл"
              iconColor="#1A56DB"
              iconBg="#EFF6FF"
              onPress={() => setEditVisible(true)}
            />
            <View style={cs.menuDivider} />
            <MenuRow
              icon="lock-closed-outline"
              label="Нууц үг солих"
              sublabel="Аюулгүй байдлын тохиргоо"
              iconColor="#7C3AED"
              iconBg="#F5F3FF"
              onPress={() => setPwVisible(true)}
            />
            <View style={cs.menuDivider} />
            <MenuRow
              icon="notifications-outline"
              label="Мэдэгдлийн тохиргоо"
              sublabel="Push мэдэгдэл хянах"
              iconColor="#FF8A00"
              iconBg="#FFF8EE"
              onPress={() => setNotifVisible(true)}
            />
          </View>
        </View>

        <View style={cs.menuGroup}>
          <Text style={cs.menuGroupTitle}>Дэмжлэг</Text>
          <View style={cs.menuCard}>
            <MenuRow
              icon="help-circle-outline"
              label="Тусламж & Дэмжлэг"
              iconColor="#0E9F6E"
              iconBg="#ECFDF5"
              onPress={() =>
                Alert.alert('Холбоо барих', 'support@accident-app.mn\n+976 7700-0000', [
                  { text: 'Хаах' },
                ])
              }
            />
            <View style={cs.menuDivider} />
            <MenuRow
              icon="document-text-outline"
              label="Нууцлалын бодлого"
              iconColor="#6B7280"
              iconBg="#F9FAFB"
              onPress={() =>
                Alert.alert('Нууцлалын бодлого', 'Таны мэдээлэл аюулгүй хадгалагдана. Гуравдагч этгээдэд дамжуулахгүй.', [
                  { text: 'Хаах' },
                ])
              }
            />
          </View>
        </View>

        <View style={[cs.menuGroup, { marginBottom: SPACING.xxl }]}>
          <View style={cs.menuCard}>
            <MenuRow
              icon="log-out-outline"
              label="Системээс гарах"
              iconColor={COLORS.danger}
              iconBg="#FEF2F2"
              onPress={handleLogout}
              danger
            />
          </View>
        </View>

        {/* ── App version ──────────────────────────────── */}
        <Text style={cs.version}>v1.0.0 · Accident Assessment App</Text>
        <View style={{ height: SPACING.xl }} />
      </ScrollView>

      {/* ── Modals ──────────────────────────────────────── */}
      {user && (
        <EditProfileModal
          visible={editVisible}
          user={user}
          onClose={() => setEditVisible(false)}
          onSave={handleUserSaved}
        />
      )}
      <ChangePasswordModal
        visible={pwVisible}
        onClose={() => setPwVisible(false)}
      />
      <NotificationSettingsModal
        visible={notifVisible}
        onClose={() => setNotifVisible(false)}
      />
    </SafeAreaView>
  );
};

const cs = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },

  hero: {
    backgroundColor: '#fff',
    paddingBottom: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    position: 'relative',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#1A56DB',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.07,
        shadowRadius: 16,
      },
      android: { elevation: 4 },
    }),
  },
  heroBg: {
    position: 'absolute', top: -60, right: -60,
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: '#EFF6FF', opacity: 0.5,
  },
  heroContent: { alignItems: 'center', paddingTop: SPACING.xl },
  avatar: {
    width: 86, height: 86, borderRadius: 43,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, marginBottom: 12, position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#1A56DB',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.18,
        shadowRadius: 12,
      },
      android: { elevation: 8 },
    }),
  },
  avatarText: { fontSize: 30, fontWeight: '800' },
  avatarEditDot: {
    position: 'absolute', bottom: 2, right: 2,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#fff',
  },
  heroName: { fontSize: FONT_SIZE.xl, fontWeight: '800', color: COLORS.text, letterSpacing: -0.3 },
  heroEmail: { fontSize: FONT_SIZE.sm, color: COLORS.textMuted, marginTop: 4 },
  roleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: RADIUS.full, paddingHorizontal: 12, paddingVertical: 5,
    marginTop: 10, borderWidth: 1,
  },
  roleText: { fontSize: FONT_SIZE.xs, fontWeight: '700' },

  infoCard: {
    backgroundColor: '#fff', marginHorizontal: SPACING.lg, marginTop: SPACING.lg,
    borderRadius: RADIUS.lg, borderWidth: 1, borderColor: '#F1F5F9',
    padding: SPACING.md, gap: 10,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoText: { fontSize: FONT_SIZE.sm, color: COLORS.text },

  menuGroup: { paddingHorizontal: SPACING.lg, marginTop: SPACING.lg },
  menuGroupTitle: {
    fontSize: FONT_SIZE.xs, fontWeight: '700', color: COLORS.textMuted,
    marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  menuCard: {
    backgroundColor: '#fff', borderRadius: RADIUS.lg, borderWidth: 1,
    borderColor: '#F1F5F9', overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  menuRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: SPACING.md, paddingVertical: 14,
  },
  menuIcon: {
    width: 38, height: 38, borderRadius: RADIUS.sm,
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  menuLabel: { fontSize: FONT_SIZE.sm, fontWeight: '600', color: COLORS.text },
  menuSublabel: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, marginTop: 1 },
  menuDivider: { height: 1, backgroundColor: '#F8FAFC', marginLeft: 62 },
  rowBadge: {
    backgroundColor: COLORS.primary + '15', borderRadius: RADIUS.full,
    paddingHorizontal: 7, paddingVertical: 3, marginRight: 4,
  },
  rowBadgeText: { fontSize: 10, color: COLORS.primary, fontWeight: '700' },

  version: {
    textAlign: 'center', fontSize: FONT_SIZE.xs, color: COLORS.textLight, marginTop: SPACING.md,
  },
});