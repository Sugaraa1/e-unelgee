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

interface Props {
  visible: boolean;
  onClose: () => void;
}

export const ChangePasswordModal = ({ visible, onClose }: Props) => {
  const [form, setForm] = useState({ current: '', newPass: '', confirm: '' });
  const [show, setShow] = useState({ current: false, newPass: false, confirm: false });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const set = (key: string, val: string) => {
    setForm((f) => ({ ...f, [key]: val }));
    setErrors((e) => ({ ...e, [key]: '' }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.current) e.current = 'Одоогийн нууц үгээ оруулна уу';
    if (!form.newPass) e.newPass = 'Шинэ нууц үг оруулна уу';
    else if (form.newPass.length < 8) e.newPass = 'Дор хаяж 8 тэмдэгт байх ёстой';
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.newPass))
      e.newPass = 'Том, жижиг үсэг болон тоо агуулсан байх ёстой';
    if (form.newPass !== form.confirm) e.confirm = 'Нууц үг таарахгүй байна';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await apiClient.patch('/auth/change-password', {
        currentPassword: form.current,
        newPassword: form.newPass,
      });
      Alert.alert('Амжилттай', 'Нууц үг амжилттай солигдлоо', [
        { text: 'OK', onPress: () => { setForm({ current: '', newPass: '', confirm: '' }); onClose(); } },
      ]);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Нууц үг солиход алдаа гарлаа';
      if (err?.response?.status === 401) {
        setErrors({ current: 'Одоогийн нууц үг буруу байна' });
      } else {
        Alert.alert('Алдаа', Array.isArray(msg) ? msg.join('\n') : msg);
      }
    } finally {
      setSaving(false);
    }
  };

  const PasswordField = ({
    field, label, placeholder,
  }: { field: 'current' | 'newPass' | 'confirm'; label: string; placeholder: string }) => (
    <View style={s.field}>
      <Text style={s.label}>{label}</Text>
      <View style={[s.row, errors[field] ? s.rowErr : null]}>
        <Ionicons name="lock-closed-outline" size={16} color={COLORS.textMuted} style={{ marginRight: 8 }} />
        <TextInput
          style={s.input}
          value={form[field]}
          onChangeText={(t) => set(field, t)}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textLight}
          secureTextEntry={!show[field]}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity onPress={() => setShow((p) => ({ ...p, [field]: !p[field] }))}>
          <Ionicons
            name={show[field] ? 'eye-outline' : 'eye-off-outline'}
            size={18}
            color={COLORS.textMuted}
          />
        </TouchableOpacity>
      </View>
      {errors[field] ? <Text style={s.errText}>{errors[field]}</Text> : null}
    </View>
  );

  const strength = (() => {
    const p = form.newPass;
    if (!p) return null;
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    return score;
  })();

  const strengthLabel = ['', 'Маш сул', 'Сул', 'Дунд', 'Хүчтэй'];
  const strengthColor = ['', COLORS.danger, '#FF8A00', '#FBBF24', COLORS.secondary];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <SafeAreaView style={s.safe}>
          <View style={s.header}>
            <TouchableOpacity style={s.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={22} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={s.title}>Нууц үг солих</Text>
            <TouchableOpacity style={s.saveBtn} onPress={handleSave} disabled={saving}>
              {saving
                ? <ActivityIndicator size="small" color={COLORS.primary} />
                : <Text style={s.saveBtnText}>Хадгалах</Text>}
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {/* Security icon */}
            <View style={s.iconSection}>
              <View style={s.lockIcon}>
                <Ionicons name="shield-checkmark" size={32} color={COLORS.primary} />
              </View>
              <Text style={s.iconTitle}>Нууц үг шинэчлэх</Text>
              <Text style={s.iconSub}>Аюулгүй байдлын үүднээс тогтмол солихыг зөвлөж байна</Text>
            </View>

            <PasswordField field="current" label="Одоогийн нууц үг" placeholder="Одоогийн нууц үгээ оруулна уу" />
            <PasswordField field="newPass" label="Шинэ нууц үг" placeholder="Шинэ нууц үгийг оруулна уу" />

            {/* Strength indicator */}
            {strength !== null && (
              <View style={s.strength}>
                <View style={s.strengthBars}>
                  {[1, 2, 3, 4].map((i) => (
                    <View
                      key={i}
                      style={[
                        s.strengthBar,
                        i <= (strength ?? 0)
                          ? { backgroundColor: strengthColor[strength ?? 0] }
                          : { backgroundColor: '#E5E7EB' },
                      ]}
                    />
                  ))}
                </View>
                <Text style={[s.strengthText, { color: strengthColor[strength ?? 0] }]}>
                  {strengthLabel[strength ?? 0]}
                </Text>
              </View>
            )}

            <PasswordField field="confirm" label="Нууц үг давтах" placeholder="Шинэ нууц үгийг давтана уу" />

            {/* Requirements */}
            <View style={s.reqs}>
              <Text style={s.reqsTitle}>Шаардлага:</Text>
              {[
                { label: 'Дор хаяж 8 тэмдэгт', ok: form.newPass.length >= 8 },
                { label: 'Том үсэг агуулсан (A-Z)', ok: /[A-Z]/.test(form.newPass) },
                { label: 'Жижиг үсэг агуулсан (a-z)', ok: /[a-z]/.test(form.newPass) },
                { label: 'Тоо агуулсан (0-9)', ok: /[0-9]/.test(form.newPass) },
              ].map((req, i) => (
                <View key={i} style={s.reqRow}>
                  <Ionicons
                    name={req.ok ? 'checkmark-circle' : 'ellipse-outline'}
                    size={14}
                    color={req.ok ? COLORS.secondary : COLORS.textLight}
                  />
                  <Text style={[s.reqText, req.ok && { color: COLORS.secondary }]}>{req.label}</Text>
                </View>
              ))}
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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  closeBtn: {
    width: 36, height: 36, borderRadius: RADIUS.sm,
    backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center',
  },
  title: { fontSize: FONT_SIZE.lg, fontWeight: '700', color: COLORS.text },
  saveBtn: { paddingHorizontal: SPACING.md, paddingVertical: 8, minWidth: 70, alignItems: 'center' },
  saveBtnText: { fontSize: FONT_SIZE.sm, fontWeight: '700', color: COLORS.primary },

  body: { padding: SPACING.lg, gap: SPACING.md },

  iconSection: { alignItems: 'center', paddingVertical: SPACING.md, gap: 8 },
  lockIcon: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: COLORS.primary + '12',
    justifyContent: 'center', alignItems: 'center',
  },
  iconTitle: { fontSize: FONT_SIZE.lg, fontWeight: '700', color: COLORS.text },
  iconSub: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, textAlign: 'center', lineHeight: 18 },

  field: { gap: 6 },
  label: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 },
  row: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: RADIUS.md,
    borderWidth: 1.5, borderColor: '#E5E7EB',
    paddingHorizontal: SPACING.md, height: 52,
  },
  rowErr: { borderColor: COLORS.danger },
  input: { flex: 1, fontSize: FONT_SIZE.md, color: COLORS.text },
  errText: { fontSize: FONT_SIZE.xs, color: COLORS.danger },

  strength: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  strengthBars: { flexDirection: 'row', gap: 4, flex: 1 },
  strengthBar: { flex: 1, height: 4, borderRadius: 2 },
  strengthText: { fontSize: FONT_SIZE.xs, fontWeight: '600', width: 50, textAlign: 'right' },

  reqs: {
    backgroundColor: '#fff', borderRadius: RADIUS.lg,
    padding: SPACING.md, gap: 8,
    borderWidth: 1, borderColor: '#F1F5F9',
  },
  reqsTitle: { fontSize: FONT_SIZE.xs, fontWeight: '700', color: COLORS.textMuted, marginBottom: 2 },
  reqRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  reqText: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted },
});
