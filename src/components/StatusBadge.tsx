// src/components/StatusBadge.tsx
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZE, RADIUS } from '../constants';

export type ImageStatus = 'pending' | 'processing' | 'analyzed' | 'failed' | 'rejected';

interface StatusBadgeProps {
  status: ImageStatus;
  size?: 'sm' | 'md';
}

const CONFIG: Record<
  ImageStatus,
  { bg: string; color: string; label: string; icon?: string }
> = {
  pending:    { bg: '#F3F4F6', color: '#6B7280', label: 'Хүлээж байна',   icon: 'time-outline' },
  processing: { bg: '#EDE9FE', color: '#7C3AED', label: 'Боловсруулж байна' },
  analyzed:   { bg: '#D1FAE5', color: '#065F46', label: 'Дүн гарсан',     icon: 'checkmark-circle' },
  failed:     { bg: '#FEE2E2', color: '#991B1B', label: 'Алдаа',          icon: 'close-circle' },
  rejected:   { bg: '#FEF3C7', color: '#92400E', label: 'Татгалзсан',     icon: 'ban' },
};

export const StatusBadge = ({ status, size = 'sm' }: StatusBadgeProps) => {
  const cfg   = CONFIG[status] ?? CONFIG.pending;
  const isSm  = size === 'sm';
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (status !== 'processing') return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.5, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,   duration: 700, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [status, pulse]);

  return (
    <Animated.View
      style={[
        styles.badge,
        { backgroundColor: cfg.bg, opacity: status === 'processing' ? pulse : 1 },
        isSm ? styles.sm : styles.md,
      ]}
    >
      {status === 'processing' ? (
        <ActivityIndicator size="small" color={cfg.color} style={styles.spinner} />
      ) : cfg.icon ? (
        <Ionicons
          name={cfg.icon as any}
          size={isSm ? 10 : 13}
          color={cfg.color}
          style={styles.icon}
        />
      ) : null}
      <Text style={[styles.label, { color: cfg.color }, isSm ? styles.labelSm : styles.labelMd]}>
        {cfg.label}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  badge:   { flexDirection: 'row', alignItems: 'center', borderRadius: RADIUS.full },
  sm:      { paddingHorizontal: 7, paddingVertical: 3 },
  md:      { paddingHorizontal: 12, paddingVertical: 6 },
  icon:    { marginRight: 3 },
  spinner: { marginRight: 4, transform: [{ scale: 0.65 }] },
  label:   { fontWeight: '700' },
  labelSm: { fontSize: 9 },
  labelMd: { fontSize: FONT_SIZE.xs },
});