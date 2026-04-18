import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, SPACING, RADIUS, FONT_SIZE } from '../../constants';
import { createClaim, CreateClaimPayload } from '../../services/claimsService';
import { getVehicles } from '../../services/vehiclesService';
import type { Vehicle, ClaimsStackParamList } from '../../types';

type Props = {
  navigation: NativeStackNavigationProp<ClaimsStackParamList, 'NewClaim'>;
};

// ── Accident type сонголтууд ───────────────────────────────────
const ACCIDENT_TYPES = [
  { label: '🚗 Мөргөлдөөн',       value: 'collision' },
  { label: '⬅️ Ар талаас',        value: 'rear_end' },
  { label: '↔️ Хажуугийн цохилт', value: 'side_impact' },
  { label: '🔄 Эргэлт',           value: 'rollover' },
  { label: '🏃 Зугтсан',          value: 'hit_and_run' },
  { label: '🌨️ Цаг агаар',        value: 'weather' },
  { label: '🔨 Эвдрэл',           value: 'vandalism' },
  { label: '🔥 Түймэр',           value: 'fire' },
  { label: '🌊 Үер',              value: 'flood' },
  { label: '📋 Бусад',            value: 'other' },
];

interface FormState {
  vehicleId: string;
  vehicleLabel: string;
  accidentType: string;
  accidentTypeLabel: string;
  description: string;
  accidentLocation: string;
  accidentDate: string;       // "YYYY-MM-DD" format хэрэглэгч оруулна
}

const EMPTY_FORM: FormState = {
  vehicleId: '',
  vehicleLabel: '',
  accidentType: '',
  accidentTypeLabel: '',
  description: '',
  accidentLocation: '',
  accidentDate: new Date().toISOString().split('T')[0],
};

// ── Generic Picker Modal ───────────────────────────────────────
function PickerModal<T extends { label: string; value: string }>({
  visible,
  title,
  items,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  items: T[];
  onSelect: (item: T) => void;
  onClose: () => void;
}) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={pickerStyles.safe}>
        <View style={pickerStyles.header}>
          <Text style={pickerStyles.title}>{title}</Text>
          <TouchableOpacity onPress={onClose} style={pickerStyles.closeBtn}>
            <Ionicons name="close" size={22} color={COLORS.text} />
          </TouchableOpacity>
        </View>
        <FlatList
          data={items}
          keyExtractor={(item) => item.value}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={pickerStyles.item}
              onPress={() => { onSelect(item); onClose(); }}
              activeOpacity={0.7}
            >
              <Text style={pickerStyles.itemText}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.textLight} />
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={pickerStyles.sep} />}
        />
      </SafeAreaView>
    </Modal>
  );
}

// ── Field component ───────────────────────────────────────────
const Field = ({
  label,
  children,
  error,
  required,
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
  required?: boolean;
}) => (
  <View style={styles.fieldGroup}>
    <Text style={styles.label}>
      {label}
      {required && <Text style={{ color: COLORS.danger }}> *</Text>}
    </Text>
    {children}
    {error && <Text style={styles.errorText}>{error}</Text>}
  </View>
);

// ── Main Screen ───────────────────────────────────────────────
export const CreateClaimScreen = ({ navigation }: Props) => {
  const [form, setForm]           = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors]       = useState<Partial<Record<keyof FormState, string>>>({});
  const [vehicles, setVehicles]   = useState<Vehicle[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [loadingVehicles, setLoadingVehicles] = useState(true);

  // Picker modal state
  const [showVehiclePicker, setShowVehiclePicker]   = useState(false);
  const [showTypePicker, setShowTypePicker]         = useState(false);

  // ── Машинуудыг ачаалах ────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const data = await getVehicles();
        setVehicles(data);
      } catch {
        Alert.alert('Алдаа', 'Машины жагсаалт ачааллахад алдаа гарлаа');
      } finally {
        setLoadingVehicles(false);
      }
    })();
  }, []);

  const vehicleItems = vehicles.map((v) => ({
    label: `${v.make} ${v.model} — ${v.licensePlate}`,
    value: v.id,
  }));

  // ── Validation ─────────────────────────────────────────────────
  const validate = (): boolean => {
    const e: typeof errors = {};
    if (!form.vehicleId)          e.vehicleId        = 'Машин сонгоно уу';
    if (!form.accidentType)       e.accidentType     = 'Ослын төрөл сонгоно уу';
    if (!form.accidentLocation.trim())
      e.accidentLocation = 'Ослын байршил оруулна уу';
    if (!form.description.trim()) e.description      = 'Тайлбар оруулна уу';
    else if (form.description.trim().length < 10)
      e.description = 'Дор хаяж 10 тэмдэгт байх ёстой';
    if (!form.accidentDate)       e.accidentDate     = 'Огноо оруулна уу';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Submit ─────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload: CreateClaimPayload = {
        vehicleId:        form.vehicleId,
        accidentType:     form.accidentType,
        accidentLocation: form.accidentLocation.trim(),
        description:      form.description.trim(),
        // "YYYY-MM-DD" → ISO string
        accidentDate:     new Date(form.accidentDate).toISOString(),
      };
      await createClaim(payload);
      Alert.alert('Амжилттай', 'Ослын мэдэгдэл амжилттай илгээгдлээ.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ?? 'Мэдэгдэл илгээхэд алдаа гарлаа';
      Alert.alert('Алдаа', Array.isArray(msg) ? msg.join('\n') : msg);
    } finally {
      setSubmitting(false);
    }
  };

  const setField = (key: keyof FormState, val: string) => {
    setForm((f) => ({ ...f, [key]: val }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
          >
            <Ionicons name="arrow-back" size={22} color={COLORS.text} />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Мэдэгдэл гаргах</Text>
            <Text style={styles.headerSub}>Ослын мэдэгдэл бүртгэх</Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Машин сонгох ───────────────────────────────── */}
          <Field label="Тээвэр хэрэгсэл" error={errors.vehicleId} required>
            <TouchableOpacity
              style={[
                styles.selector,
                errors.vehicleId ? styles.selectorError : null,
              ]}
              onPress={() => setShowVehiclePicker(true)}
              disabled={loadingVehicles}
              activeOpacity={0.75}
            >
              {loadingVehicles ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <>
                  <Ionicons
                    name="car-outline"
                    size={18}
                    color={
                      form.vehicleId ? COLORS.text : COLORS.textLight
                    }
                  />
                  <Text
                    style={[
                      styles.selectorText,
                      !form.vehicleId && styles.selectorPlaceholder,
                    ]}
                    numberOfLines={1}
                  >
                    {form.vehicleLabel || 'Машин сонгоно уу...'}
                  </Text>
                  <Ionicons
                    name="chevron-down"
                    size={16}
                    color={COLORS.textMuted}
                  />
                </>
              )}
            </TouchableOpacity>
          </Field>

          {/* ── Ослын төрөл ────────────────────────────────── */}
          <Field label="Ослын төрөл" error={errors.accidentType} required>
            <TouchableOpacity
              style={[
                styles.selector,
                errors.accidentType ? styles.selectorError : null,
              ]}
              onPress={() => setShowTypePicker(true)}
              activeOpacity={0.75}
            >
              <Ionicons
                name="warning-outline"
                size={18}
                color={form.accidentType ? COLORS.text : COLORS.textLight}
              />
              <Text
                style={[
                  styles.selectorText,
                  !form.accidentType && styles.selectorPlaceholder,
                ]}
              >
                {form.accidentTypeLabel || 'Ослын төрөл сонгоно уу...'}
              </Text>
              <Ionicons
                name="chevron-down"
                size={16}
                color={COLORS.textMuted}
              />
            </TouchableOpacity>
          </Field>

          {/* ── Огноо ──────────────────────────────────────── */}
          <Field label="Ослын огноо" error={errors.accidentDate} required>
            <View
              style={[
                styles.inputWrap,
                errors.accidentDate ? styles.inputError : null,
              ]}
            >
              <Ionicons
                name="calendar-outline"
                size={18}
                color={COLORS.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="ЖЖЖЖ-СС-ӨӨ  (жишэ: 2026-04-18)"
                placeholderTextColor={COLORS.textLight}
                value={form.accidentDate}
                onChangeText={(t) => setField('accidentDate', t)}
                keyboardType="numbers-and-punctuation"
                maxLength={10}
              />
            </View>
          </Field>

          {/* ── Байршил ────────────────────────────────────── */}
          <Field label="Ослын байршил" error={errors.accidentLocation} required>
            <View
              style={[
                styles.inputWrap,
                errors.accidentLocation ? styles.inputError : null,
              ]}
            >
              <Ionicons
                name="location-outline"
                size={18}
                color={COLORS.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Дүүрэг, гудамж, нэр..."
                placeholderTextColor={COLORS.textLight}
                value={form.accidentLocation}
                onChangeText={(t) => setField('accidentLocation', t)}
                autoCapitalize="none"
              />
            </View>
          </Field>

          {/* ── Тайлбар ────────────────────────────────────── */}
          <Field label="Ослын тайлбар" error={errors.description} required>
            <View
              style={[
                styles.textareaWrap,
                errors.description ? styles.inputError : null,
              ]}
            >
              <TextInput
                style={styles.textarea}
                placeholder="Ослын нөхцөл байдлыг дэлгэрэнгүй тайлбарлана уу (дор хаяж 10 тэмдэгт)..."
                placeholderTextColor={COLORS.textLight}
                value={form.description}
                onChangeText={(t) => setField('description', t)}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
                autoCapitalize="none"
              />
              <Text style={styles.charCount}>
                {form.description.length} тэмдэгт
              </Text>
            </View>
          </Field>

          {/* ── Submit ─────────────────────────────────────── */}
          <TouchableOpacity
            style={[styles.submitBtn, submitting && styles.submitDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.85}
          >
            {submitting ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Ionicons
                  name="send-outline"
                  size={20}
                  color={COLORS.white}
                />
                <Text style={styles.submitText}>Мэдэгдэл илгээх</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={{ height: SPACING.xl }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Vehicle picker modal */}
      <PickerModal
        visible={showVehiclePicker}
        title="Машин сонгох"
        items={vehicleItems}
        onSelect={(item) => {
          setField('vehicleId', item.value);
          setField('vehicleLabel', item.label);
        }}
        onClose={() => setShowVehiclePicker(false)}
      />

      {/* Accident type picker modal */}
      <PickerModal
        visible={showTypePicker}
        title="Ослын төрөл сонгох"
        items={ACCIDENT_TYPES}
        onSelect={(item) => {
          setField('accidentType', item.value);
          setField('accidentTypeLabel', item.label);
        }}
        onClose={() => setShowTypePicker(false)}
      />
    </SafeAreaView>
  );
};

// ── Picker styles ─────────────────────────────────────────────
const pickerStyles = StyleSheet.create({
  safe:     { flex: 1, backgroundColor: COLORS.surface },
  header:   {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  title:    { fontSize: FONT_SIZE.lg, fontWeight: '700', color: COLORS.text },
  closeBtn: {
    width: 36, height: 36, borderRadius: RADIUS.sm,
    backgroundColor: COLORS.background, justifyContent: 'center',
    alignItems: 'center', borderWidth: 1, borderColor: COLORS.border,
  },
  item: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  itemText: { fontSize: FONT_SIZE.md, color: COLORS.text },
  sep:      { height: 1, backgroundColor: COLORS.border },
});

// ── Screen styles ─────────────────────────────────────────────
const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: COLORS.background },
  header:  {
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

  content:   { padding: SPACING.lg, gap: SPACING.md },

  fieldGroup: { gap: 6 },
  label:      { fontSize: FONT_SIZE.sm, fontWeight: '600', color: COLORS.text },
  errorText:  { fontSize: FONT_SIZE.xs, color: COLORS.danger, marginTop: 2 },

  // Selector (dropdown-style button)
  selector: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: COLORS.surface, borderRadius: RADIUS.md,
    borderWidth: 1.5, borderColor: COLORS.border,
    paddingHorizontal: SPACING.md, height: 52,
  },
  selectorError:       { borderColor: COLORS.danger },
  selectorText:        { flex: 1, fontSize: FONT_SIZE.md, color: COLORS.text },
  selectorPlaceholder: { color: COLORS.textLight },

  // Input
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surface, borderRadius: RADIUS.md,
    borderWidth: 1.5, borderColor: COLORS.border,
    paddingHorizontal: SPACING.md, height: 52,
  },
  inputError: { borderColor: COLORS.danger },
  inputIcon:  { marginRight: SPACING.sm },
  input:      { flex: 1, fontSize: FONT_SIZE.md, color: COLORS.text },

  // Textarea
  textareaWrap: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.md,
    borderWidth: 1.5, borderColor: COLORS.border,
    padding: SPACING.md, minHeight: 130,
  },
  textarea:   { flex: 1, fontSize: FONT_SIZE.md, color: COLORS.text, minHeight: 100 },
  charCount:  { fontSize: FONT_SIZE.xs, color: COLORS.textLight, textAlign: 'right', marginTop: 4 },

  // Submit
  submitBtn: {
    flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', gap: SPACING.sm,
    backgroundColor: COLORS.primary, borderRadius: RADIUS.md,
    height: 54, marginTop: SPACING.sm,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  submitDisabled: { opacity: 0.7 },
  submitText:     { color: COLORS.white, fontSize: FONT_SIZE.md, fontWeight: '700' },
});