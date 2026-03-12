import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { COLORS, SPACING, RADIUS, FONT_SIZE } from '../../constants';
import type { AuthStackParamList } from '../../types';

type Props = { navigation: NativeStackNavigationProp<AuthStackParamList, 'Register'> };

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
}

// ✅ Field компонентыг RegisterScreen-с ГАДНА тодорхойлсон
interface FieldProps {
  label: string;
  field: keyof FormData;
  placeholder: string;
  keyboardType?: any;
  autoCapitalize?: any;
  secure?: boolean;
  value: string;
  error?: string;
  showPass?: boolean;
  onTogglePass?: () => void;
  onChangeText: (val: string) => void;
}

const Field = ({
  label, placeholder, keyboardType = 'default',
  autoCapitalize = 'words', secure = false,
  value, error, showPass, onTogglePass, onChangeText,
}: FieldProps) => (
  <View style={styles.fieldGroup}>
    <Text style={styles.label}>{label}</Text>
    <View style={[styles.inputWrap, error ? styles.inputError : null]}>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textLight}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        secureTextEntry={secure && !showPass}
      />
      {secure && (
        <TouchableOpacity onPress={onTogglePass} style={styles.eyeBtn}>
          <Ionicons name={showPass ? 'eye-outline' : 'eye-off-outline'} size={18} color={COLORS.textMuted} />
        </TouchableOpacity>
      )}
    </View>
    {error && <Text style={styles.errorText}>{error}</Text>}
  </View>
);

export const RegisterScreen = ({ navigation }: Props) => {
  const { register } = useAuthStore();
  const [form, setForm] = useState<FormData>({
    firstName: '', lastName: '', email: '',
    phoneNumber: '', password: '', confirmPassword: '',
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [errors, setErrors]     = useState<Partial<FormData>>({});

  const update = (key: keyof FormData, val: string) => {
    setForm((f) => ({ ...f, [key]: val }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validate = () => {
    const e: Partial<FormData> = {};
    if (!form.firstName.trim()) e.firstName = 'Нэр оруулна уу';
    if (!form.lastName.trim())  e.lastName  = 'Овог оруулна уу';
    if (!form.email.trim())     e.email     = 'Имэйл оруулна уу';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Имэйл буруу байна';
    if (!form.phoneNumber.trim()) e.phoneNumber = 'Утасны дугаар оруулна уу';
    if (!form.password)         e.password  = 'Нууц үг оруулна уу';
    else if (form.password.length < 8) e.password = 'Дор хаяж 8 тэмдэгт байх ёстой';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Нууц үг таарахгүй байна';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await register({
        firstName:   form.firstName.trim(),
        lastName:    form.lastName.trim(),
        email:       form.email.trim().toLowerCase(),
        phoneNumber: form.phoneNumber.trim(),
        password:    form.password,
      });
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Бүртгэх үед алдаа гарлаа';
      Alert.alert('Алдаа', Array.isArray(msg) ? msg.join('\n') : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Бүртгүүлэх</Text>
          <Text style={styles.subtitle}>Шинэ бүртгэл үүсгэх</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Field
                label="Нэр" field="firstName" placeholder="Бат"
                value={form.firstName} error={errors.firstName}
                onChangeText={(t) => update('firstName', t)}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Field
                label="Овог" field="lastName" placeholder="Эрдэнэ"
                value={form.lastName} error={errors.lastName}
                onChangeText={(t) => update('lastName', t)}
              />
            </View>
          </View>

          <Field
            label="Имэйл хаяг" field="email" placeholder="bat@example.com"
            keyboardType="email-address" autoCapitalize="none"
            value={form.email} error={errors.email}
            onChangeText={(t) => update('email', t)}
          />

          <Field
            label="Утасны дугаар" field="phoneNumber" placeholder="+97699001122"
            keyboardType="phone-pad" autoCapitalize="none"
            value={form.phoneNumber} error={errors.phoneNumber}
            onChangeText={(t) => update('phoneNumber', t)}
          />

          <Field
            label="Нууц үг" field="password" placeholder="Дор хаяж 8 тэмдэгт"
            autoCapitalize="none" secure
            value={form.password} error={errors.password}
            showPass={showPass} onTogglePass={() => setShowPass(!showPass)}
            onChangeText={(t) => update('password', t)}
          />

          <Field
            label="Нууц үг давтах" field="confirmPassword" placeholder="Нууц үгийг давтана уу"
            autoCapitalize="none" secure
            value={form.confirmPassword} error={errors.confirmPassword}
            showPass={showPass} onTogglePass={() => setShowPass(!showPass)}
            onChangeText={(t) => update('confirmPassword', t)}
          />

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color={COLORS.white} />
              : <Text style={styles.btnText}>Бүртгүүлэх</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.loginLink}>
            <Text style={styles.loginLinkText}>
              Бүртгэлтэй юу? <Text style={{ color: COLORS.primary, fontWeight: '700' }}>Нэвтрэх</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex:        { flex: 1, backgroundColor: COLORS.background },
  container:   { flexGrow: 1, paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxl },
  header:      { paddingTop: 56, paddingBottom: SPACING.xl },
  backBtn:     {
    width: 40, height: 40, borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface, justifyContent: 'center',
    alignItems: 'center', marginBottom: SPACING.md,
    borderWidth: 1, borderColor: COLORS.border,
  },
  title:       { fontSize: FONT_SIZE.xxxl, fontWeight: '700', color: COLORS.text, marginBottom: 6 },
  subtitle:    { fontSize: FONT_SIZE.md, color: COLORS.textMuted },
  form:        { gap: SPACING.md },
  row:         { flexDirection: 'row', gap: SPACING.sm },
  fieldGroup:  { gap: 6 },
  label:       { fontSize: FONT_SIZE.sm, fontWeight: '600', color: COLORS.text },
  inputWrap:   {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surface, borderRadius: RADIUS.md,
    borderWidth: 1.5, borderColor: COLORS.border,
    paddingHorizontal: SPACING.md, height: 52,
  },
  inputError:  { borderColor: COLORS.danger },
  input:       { flex: 1, fontSize: FONT_SIZE.md, color: COLORS.text },
  eyeBtn:      { padding: 4 },
  errorText:   { fontSize: FONT_SIZE.xs, color: COLORS.danger, marginTop: 2 },
  btn:         {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.md,
    height: 52, justifyContent: 'center', alignItems: 'center',
    marginTop: SPACING.sm,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  btnDisabled: { opacity: 0.7 },
  btnText:     { color: COLORS.white, fontSize: FONT_SIZE.md, fontWeight: '700' },
  loginLink:   { alignItems: 'center', paddingVertical: SPACING.sm },
  loginLinkText: { fontSize: FONT_SIZE.sm, color: COLORS.textMuted },
});