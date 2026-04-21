import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../../src/constants';
import apiClient from '../../src/services/apiClient';
import type { User } from '../../src/types';

interface Props {
  visible: boolean;
  user: User;
  onClose: () => void;
  onSave: (updated: User) => void;
}

const Field = ({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  autoCapitalize = 'words',
  icon,
  error,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
  keyboardType?: any;
  autoCapitalize?: any;
  icon: string;
  error?: string;
}) => (
  <View style={s.field}>
    <Text style={s.label}>{label}</Text>
    <View style={[s.inputRow, error ? s.inputErr : null]}>
      <Ionicons name={icon as any} size={16} color={COLORS.textMuted} style={s.inputIcon} />
      <TextInput
        style={s.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textLight}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
      />
    </View>
    {error ? <Text style={s.errText}>{error}</Text> : null}
  </View>
);

export const EditProfileModal = ({ visible, user, onClose, onSave }: Props) => {
  const [form, setForm] = useState({
    firstName: user.firstName ?? '',
    lastName: user.lastName ?? '',
    phoneNumber: user.phoneNumber ?? '',
    insuranceProvider: user.insuranceProvider ?? '',
    insurancePolicyNumber: user.insurancePolicyNumber ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (key: string, val: string) => {
    setForm((f) => ({ ...f, [key]: val }));
    setErrors((e) => ({ ...e, [key]: '' }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.firstName.trim()) e.firstName = 'Нэр оруулна уу';
    if (!form.lastName.trim()) e.lastName = 'Овог оруулна уу';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phoneNumber: form.phoneNumber.trim() || undefined,
        insuranceProvider: form.insuranceProvider.trim() || undefined,
        insurancePolicyNumber: form.insurancePolicyNumber.trim() || undefined,
      };

      const response = await apiClient.patch('/users/me', payload);
      // Backend TransformInterceptor-оос { success, data, timestamp } буцаана
      const updatedUser: User = response.data?.data ?? response.data;

      onSave({ ...user, ...updatedUser });
      Alert.alert('Амжилттай', 'Профайл шинэчлэгдлээ');
      onClose();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ?? 'Профайл хадгалахад алдаа гарлаа';
      const errorMsg = Array.isArray(msg) ? msg.join('\n') : msg;

      // Утасны дугаар давхардсан үед
      if (err?.response?.status === 409) {
        setErrors({ phoneNumber: errorMsg });
      } else {
        Alert.alert('Алдаа', errorMsg);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <SafeAreaView style={s.safe}>
          {/* Header */}
          <View style={s.header}>
            <TouchableOpacity style={s.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={22} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={s.title}>Профайл засах</Text>
            <TouchableOpacity
              style={s.saveBtn}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <Text style={s.saveBtnText}>Хадгалах</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={s.body}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Avatar */}
            <View style={s.avatarSection}>
              <View style={s.avatar}>
                <Text style={s.avatarText}>
                  {`${form.firstName[0] ?? ''}${form.lastName[0] ?? ''}`.toUpperCase()}
                </Text>
              </View>
              <Text style={s.avatarHint}>Профайл зураг удахгүй нэмэгдэнэ</Text>
            </View>

            {/* Хувийн мэдээлэл */}
            <View style={s.section}>
              <Text style={s.sectionTitle}>Хувийн мэдээлэл</Text>
              <View style={s.card}>
                <Field
                  label="Нэр"
                  value={form.firstName}
                  onChangeText={(t) => set('firstName', t)}
                  placeholder="Бат"
                  icon="person-outline"
                  error={errors.firstName}
                />
                <View style={s.divider} />
                <Field
                  label="Овог"
                  value={form.lastName}
                  onChangeText={(t) => set('lastName', t)}
                  placeholder="Эрдэнэ"
                  icon="person-outline"
                  error={errors.lastName}
                />
                <View style={s.divider} />
                <Field
                  label="Утасны дугаар"
                  value={form.phoneNumber}
                  onChangeText={(t) => set('phoneNumber', t)}
                  placeholder="+97699001122"
                  icon="call-outline"
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                  error={errors.phoneNumber}
                />
              </View>
            </View>

            {/* Даатгалын мэдээлэл */}
            <View style={s.section}>
              <Text style={s.sectionTitle}>Даатгалын мэдээлэл</Text>
              <View style={s.card}>
                <Field
                  label="Даатгалын компани"
                  value={form.insuranceProvider}
                  onChangeText={(t) => set('insuranceProvider', t)}
                  placeholder="Монгол Даатгал"
                  icon="shield-outline"
                  autoCapitalize="none"
                />
                <View style={s.divider} />
                <Field
                  label="Полисийн дугаар"
                  value={form.insurancePolicyNumber}
                  onChangeText={(t) => set('insurancePolicyNumber', t)}
                  placeholder="МД-2025-001234"
                  icon="card-outline"
                  autoCapitalize="characters"
                />
              </View>
            </View>

            {/* Email (read-only) */}
            <View style={s.section}>
              <Text style={s.sectionTitle}>Бүртгэлийн мэдээлэл</Text>
              <View style={s.card}>
                <View style={s.readOnlyRow}>
                  <Ionicons
                    name="mail-outline"
                    size={16}
                    color={COLORS.textMuted}
                    style={s.inputIcon}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={s.readOnlyLabel}>Имэйл хаяг</Text>
                    <Text style={s.readOnlyValue}>{user.email}</Text>
                  </View>
                  <View style={s.lockedBadge}>
                    <Ionicons name="lock-closed" size={11} color={COLORS.textMuted} />
                  </View>
                </View>
              </View>
              <Text style={s.hint}>Имэйл хаяг өөрчилж болохгүй</Text>
            </View>

            <View style={{ height: SPACING.xl }} />
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: { fontSize: FONT_SIZE.lg, fontWeight: '700', color: COLORS.text },
  saveBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    minWidth: 70,
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    color: COLORS.primary,
  },
  body: { padding: SPACING.lg, gap: SPACING.md },
  avatarSection: { alignItems: 'center', paddingVertical: SPACING.md, gap: 8 },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary + '40',
  },
  avatarText: { fontSize: 26, fontWeight: '800', color: COLORS.primary },
  avatarHint: { fontSize: FONT_SIZE.xs, color: COLORS.textLight },
  section: { gap: 6 },
  sectionTitle: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    overflow: 'hidden',
  },
  field: { paddingHorizontal: SPACING.md, paddingVertical: 12, gap: 4 },
  label: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: SPACING.sm,
    height: 44,
  },
  inputErr: { borderColor: COLORS.danger },
  inputIcon: { marginRight: SPACING.sm },
  input: { flex: 1, fontSize: FONT_SIZE.sm, color: COLORS.text },
  errText: { fontSize: FONT_SIZE.xs, color: COLORS.danger },
  divider: {
    height: 1,
    backgroundColor: '#F8FAFC',
    marginHorizontal: SPACING.md,
  },
  readOnlyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  readOnlyLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted },
  readOnlyValue: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text,
    fontWeight: '500',
    marginTop: 1,
  },
  lockedBadge: {
    width: 24,
    height: 24,
    borderRadius: RADIUS.sm,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hint: { fontSize: FONT_SIZE.xs, color: COLORS.textLight, marginLeft: 4 },
});