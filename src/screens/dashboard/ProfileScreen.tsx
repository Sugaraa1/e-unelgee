import React from 'react';
import { View, Text, SafeAreaView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../../constants';

export const ProfileScreen = () => {
  const { user, logout } = useAuthStore();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <View style={{ flex: 1, padding: SPACING.lg }}>
        <Text style={{ fontSize: FONT_SIZE.xxl, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.lg }}>
          Профайл
        </Text>
        <View style={{ backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.xl, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border }}>
          <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.md }}>
            <Ionicons name="person" size={32} color={COLORS.white} />
          </View>
          <Text style={{ fontSize: FONT_SIZE.lg, fontWeight: '700', color: COLORS.text }}>
            {user?.firstName} {user?.lastName}
          </Text>
          <Text style={{ fontSize: FONT_SIZE.sm, color: COLORS.textMuted, marginTop: 4 }}>
            {user?.email}
          </Text>
        </View>
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginTop: SPACING.xl, padding: SPACING.md, backgroundColor: '#FEE2E2', borderRadius: RADIUS.md }}
          onPress={logout}
        >
          <Ionicons name="log-out-outline" size={20} color={COLORS.danger} />
          <Text style={{ color: COLORS.danger, fontWeight: '600', fontSize: FONT_SIZE.md }}>Гарах</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};