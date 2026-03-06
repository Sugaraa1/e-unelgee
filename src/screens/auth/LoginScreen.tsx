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

type Props = { navigation: NativeStackNavigationProp<AuthStackParamList, 'Login'> };

export const LoginScreen = ({ navigation }: Props) => {
  const { login } = useAuthStore();
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [errors, setErrors]       = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const e: typeof errors = {};
    if (!email.trim()) e.email = 'Имэйл оруулна уу';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Имэйл буруу байна';
    if (!password) e.password = 'Нууц үг оруулна уу';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Нэвтрэх үед алдаа гарлаа';
      Alert.alert('Алдаа', Array.isArray(msg) ? msg.join('\n') : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoBox}>
            <Ionicons name="car-sport" size={36} color={COLORS.white} />
          </View>
          <Text style={styles.title}>Нэвтрэх</Text>
          <Text style={styles.subtitle}>Ослын үнэлгээний систем</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Email */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Имэйл хаяг</Text>
            <View style={[styles.inputWrap, errors.email ? styles.inputError : null]}>
              <Ionicons name="mail-outline" size={18} color={COLORS.textMuted} style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="example@mail.com"
                placeholderTextColor={COLORS.textLight}
                value={email}
                onChangeText={(t) => { setEmail(t); setErrors((e) => ({ ...e, email: undefined })); }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>

          {/* Password */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Нууц үг</Text>
            <View style={[styles.inputWrap, errors.password ? styles.inputError : null]}>
              <Ionicons name="lock-closed-outline" size={18} color={COLORS.textMuted} style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Нууц үгээ оруулна уу"
                placeholderTextColor={COLORS.textLight}
                value={password}
                onChangeText={(t) => { setPassword(t); setErrors((e) => ({ ...e, password: undefined })); }}
                secureTextEntry={!showPass}
              />
              <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
                <Ionicons name={showPass ? 'eye-outline' : 'eye-off-outline'} size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>
            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
          </View>

          {/* Login button */}
          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color={COLORS.white} />
              : <Text style={styles.btnText}>Нэвтрэх</Text>}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.line} />
            <Text style={styles.dividerText}>эсвэл</Text>
            <View style={styles.line} />
          </View>

          {/* Register link */}
          <TouchableOpacity
            style={styles.outlineBtn}
            onPress={() => navigation.navigate('Register')}
            activeOpacity={0.85}
          >
            <Text style={styles.outlineBtnText}>Бүртгүүлэх</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex:         { flex: 1, backgroundColor: COLORS.background },
  container:    { flexGrow: 1, paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxl },
  header:       { alignItems: 'center', paddingTop: 72, paddingBottom: SPACING.xl },
  logoBox:      {
    width: 72, height: 72, borderRadius: RADIUS.xl,
    backgroundColor: COLORS.primary, justifyContent: 'center',
    alignItems: 'center', marginBottom: SPACING.md,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 8,
  },
  title:        { fontSize: FONT_SIZE.xxxl, fontWeight: '700', color: COLORS.text, marginBottom: 6 },
  subtitle:     { fontSize: FONT_SIZE.md, color: COLORS.textMuted },

  form:         { gap: SPACING.md },
  fieldGroup:   { gap: 6 },
  label:        { fontSize: FONT_SIZE.sm, fontWeight: '600', color: COLORS.text },
  inputWrap:    {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surface, borderRadius: RADIUS.md,
    borderWidth: 1.5, borderColor: COLORS.border,
    paddingHorizontal: SPACING.md, height: 52,
  },
  inputError:   { borderColor: COLORS.danger },
  icon:         { marginRight: SPACING.sm },
  input:        { flex: 1, fontSize: FONT_SIZE.md, color: COLORS.text },
  eyeBtn:       { padding: 4 },
  errorText:    { fontSize: FONT_SIZE.xs, color: COLORS.danger, marginTop: 2 },

  btn:          {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.md,
    height: 52, justifyContent: 'center', alignItems: 'center',
    marginTop: SPACING.sm,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  btnDisabled:  { opacity: 0.7 },
  btnText:      { color: COLORS.white, fontSize: FONT_SIZE.md, fontWeight: '700' },

  divider:      { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  line:         { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText:  { fontSize: FONT_SIZE.sm, color: COLORS.textMuted },

  outlineBtn:   {
    borderRadius: RADIUS.md, height: 52,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: COLORS.primary,
  },
  outlineBtnText: { color: COLORS.primary, fontSize: FONT_SIZE.md, fontWeight: '700' },
});