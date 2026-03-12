import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT_SIZE } from '../../constants';
import type { Vehicle } from '../../types';
import {
  getVehicles,
  createVehicle,
  deleteVehicle,
  CreateVehiclePayload,
} from '../../services/vehiclesService';

// ── Fuel type сонголтууд ──────────────────────────────────────
const FUEL_TYPES = [
  { label: 'Бензин', value: 'petrol' },
  { label: 'Дизель', value: 'diesel' },
  { label: 'Цахилгаан', value: 'electric' },
  { label: 'Гибрид', value: 'hybrid' },
  { label: 'LPG', value: 'lpg' },
];

const FUEL_ICONS: Record<string, string> = {
  petrol: '⛽',
  diesel: '🛢️',
  electric: '⚡',
  hybrid: '🔋',
  lpg: '🔵',
};

// ── Empty form ────────────────────────────────────────────────
const EMPTY_FORM: CreateVehiclePayload = {
  make: '',
  model: '',
  year: new Date().getFullYear(),
  color: '',
  licensePlate: '',
  fuelType: 'petrol',
};

// ── VehicleCard component ─────────────────────────────────────
const VehicleCard = ({
  vehicle,
  onDelete,
}: {
  vehicle: Vehicle;
  onDelete: (id: string) => void;
}) => {
  const fuelEmoji = FUEL_ICONS[vehicle.fuelType ?? 'petrol'] ?? '⛽';

  return (
    <View style={styles.card}>
      {/* Зүүн өнгөт зурвас */}
      <View style={styles.cardAccent} />

      <View style={styles.cardBody}>
        {/* Гарчиг мөр */}
        <View style={styles.cardHeader}>
          <View style={styles.cardIconBox}>
            <Ionicons name="car-sport" size={22} color={COLORS.primary} />
          </View>
          <View style={styles.cardTitles}>
            <Text style={styles.cardTitle}>
              {vehicle.make} {vehicle.model}
            </Text>
            <Text style={styles.cardSub}>{vehicle.year} он</Text>
          </View>
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => onDelete(vehicle.id)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
          </TouchableOpacity>
        </View>

        {/* Мэдээллийн мөрүүд */}
        <View style={styles.cardMeta}>
          <MetaChip icon="card-outline" label={vehicle.licensePlate} />
          <MetaChip icon="color-palette-outline" label={vehicle.color} />
          <MetaChip label={fuelEmoji + ' ' + (vehicle.fuelType ?? 'petrol')} />
        </View>
      </View>
    </View>
  );
};

const MetaChip = ({ icon, label }: { icon?: string; label: string }) => (
  <View style={styles.chip}>
    {icon && (
      <Ionicons name={icon as any} size={12} color={COLORS.textMuted} style={{ marginRight: 3 }} />
    )}
    <Text style={styles.chipText}>{label}</Text>
  </View>
);

// ── Main Screen ───────────────────────────────────────────────
export const VehiclesScreen = () => {
  const [vehicles, setVehicles]       = useState<Vehicle[]>([]);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [form, setForm]               = useState<CreateVehiclePayload>(EMPTY_FORM);
  const [errors, setErrors]           = useState<Partial<Record<keyof CreateVehiclePayload, string>>>({});

  // ── Fetch ───────────────────────────────────────────────────
  const fetchVehicles = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await getVehicles();
      setVehicles(data);
    } catch (err: any) {
      Alert.alert('Алдаа', 'Машины жагсаалт ачааллахад алдаа гарлаа');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchVehicles(); }, [fetchVehicles]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchVehicles(true);
  };

  // ── Validation ──────────────────────────────────────────────
  const validate = (): boolean => {
    const e: typeof errors = {};
    if (!form.make.trim())         e.make         = 'Марк оруулна уу';
    if (!form.model.trim())        e.model        = 'Загвар оруулна уу';
    if (!form.color.trim())        e.color        = 'Өнгө оруулна уу';
    if (!form.licensePlate.trim()) e.licensePlate = 'Улсын дугаар оруулна уу';
    if (!form.year || form.year < 1900 || form.year > new Date().getFullYear() + 1) {
      e.year = 'Буруу он байна';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Submit ──────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const newVehicle = await createVehicle(form);
      setVehicles((prev) => [newVehicle, ...prev]);
      setModalVisible(false);
      setForm(EMPTY_FORM);
      setErrors({});
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Машин нэмэхэд алдаа гарлаа';
      Alert.alert('Алдаа', Array.isArray(msg) ? msg.join('\n') : msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete ──────────────────────────────────────────────────
  const handleDelete = (id: string) => {
    const vehicle = vehicles.find((v) => v.id === id);
    Alert.alert(
      'Устгах уу?',
      `"${vehicle?.make} ${vehicle?.model}" машиныг устгах уу?`,
      [
        { text: 'Болих', style: 'cancel' },
        {
          text: 'Устгах',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteVehicle(id);
              setVehicles((prev) => prev.filter((v) => v.id !== id));
            } catch {
              Alert.alert('Алдаа', 'Устгахад алдаа гарлаа');
            }
          },
        },
      ],
    );
  };

  // ── Form helper ─────────────────────────────────────────────
  const setField = (key: keyof CreateVehiclePayload, value: string) => {
    setForm((f) => ({
      ...f,
      [key]: key === 'year' ? parseInt(value) || 0 : value,
    }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  // ── Empty state ──────────────────────────────────────────────
  const renderEmpty = () => (
    <View style={styles.emptyBox}>
      <View style={styles.emptyIconBox}>
        <Ionicons name="car-outline" size={48} color={COLORS.textLight} />
      </View>
      <Text style={styles.emptyTitle}>Машин бүртгэгдээгүй байна</Text>
      <Text style={styles.emptySub}>
        "+" товч дарж анхны машинаа нэмнэ үү
      </Text>
    </View>
  );

  // ── Render ───────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Миний машинууд</Text>
          <Text style={styles.headerSub}>
            {vehicles.length} машин бүртгэлтэй
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={22} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Ачааллаж байна...</Text>
        </View>
      ) : (
        <FlatList
          data={vehicles}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <VehicleCard vehicle={item} onDelete={handleDelete} />
          )}
          contentContainerStyle={[
            styles.listContent,
            vehicles.length === 0 && styles.listEmpty,
          ]}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Add Vehicle Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalFlex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Машин нэмэх</Text>
            <TouchableOpacity
              onPress={() => {
                setModalVisible(false);
                setForm(EMPTY_FORM);
                setErrors({});
              }}
              style={styles.modalCloseBtn}
            >
              <Ionicons name="close" size={22} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={styles.modalContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Make */}
            <FormField
              label="Марк *"
              placeholder="Toyota, BMW, Hyundai..."
              value={form.make}
              onChangeText={(t) => setField('make', t)}
              error={errors.make}
              icon="business-outline"
            />

            {/* Model */}
            <FormField
              label="Загвар *"
              placeholder="Camry, X5, Tucson..."
              value={form.model}
              onChangeText={(t) => setField('model', t)}
              error={errors.model}
              icon="car-outline"
            />

            {/* Year */}
            <FormField
              label="Үйлдвэрлэсэн он *"
              placeholder="2020"
              value={form.year ? String(form.year) : ''}
              onChangeText={(t) => setField('year', t)}
              error={errors.year}
              icon="calendar-outline"
              keyboardType="number-pad"
              maxLength={4}
            />

            {/* Color */}
            <FormField
              label="Өнгө *"
              placeholder="Цагаан, Хар, Мөнгөлөг..."
              value={form.color}
              onChangeText={(t) => setField('color', t)}
              error={errors.color}
              icon="color-palette-outline"
            />

            {/* License Plate */}
            <FormField
              label="Улсын дугаар *"
              placeholder="1234УБА"
              value={form.licensePlate}
              onChangeText={(t) => setField('licensePlate', t.toUpperCase())}
              error={errors.licensePlate}
              icon="card-outline"
              autoCapitalize="characters"
            />

            {/* Fuel Type */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Түлшний төрөл</Text>
              <View style={styles.fuelRow}>
                {FUEL_TYPES.map((ft) => (
                  <TouchableOpacity
                    key={ft.value}
                    style={[
                      styles.fuelChip,
                      form.fuelType === ft.value && styles.fuelChipActive,
                    ]}
                    onPress={() => setField('fuelType', ft.value)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.fuelChipText,
                        form.fuelType === ft.value && styles.fuelChipTextActive,
                      ]}
                    >
                      {FUEL_ICONS[ft.value]} {ft.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Submit */}
            <TouchableOpacity
              style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
              activeOpacity={0.85}
            >
              {submitting ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.white} />
                  <Text style={styles.submitBtnText}>Хадгалах</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={{ height: SPACING.xl }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

// ── FormField component ───────────────────────────────────────
const FormField = ({
  label, placeholder, value, onChangeText, error,
  icon, keyboardType = 'default', maxLength, autoCapitalize = 'words',
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (t: string) => void;
  error?: string;
  icon?: string;
  keyboardType?: any;
  maxLength?: number;
  autoCapitalize?: any;
}) => (
  <View style={styles.fieldGroup}>
    <Text style={styles.label}>{label}</Text>
    <View style={[styles.inputWrap, error ? styles.inputError : null]}>
      {icon && (
        <Ionicons
          name={icon as any}
          size={16}
          color={COLORS.textMuted}
          style={{ marginRight: SPACING.sm }}
        />
      )}
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textLight}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        maxLength={maxLength}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
      />
    </View>
    {error && <Text style={styles.errorText}>{error}</Text>}
  </View>
);

// ── Styles ────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  headerTitle: { fontSize: FONT_SIZE.xl, fontWeight: '700', color: COLORS.text },
  headerSub:   { fontSize: FONT_SIZE.sm, color: COLORS.textMuted, marginTop: 2 },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },

  // List
  listContent: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xl },
  listEmpty:   { flex: 1, justifyContent: 'center' },

  // Loading
  loadingBox:  { flex: 1, justifyContent: 'center', alignItems: 'center', gap: SPACING.sm },
  loadingText: { fontSize: FONT_SIZE.sm, color: COLORS.textMuted },

  // Empty
  emptyBox: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
    gap: SPACING.sm,
  },
  emptyIconBox: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  emptyTitle: { fontSize: FONT_SIZE.lg, fontWeight: '700', color: COLORS.textMuted },
  emptySub:   { fontSize: FONT_SIZE.sm, color: COLORS.textLight, textAlign: 'center', lineHeight: 20 },

  // Card
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardAccent: { width: 4, backgroundColor: COLORS.primary },
  cardBody:   { flex: 1, padding: SPACING.md },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm },
  cardIconBox: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.primary + '12',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  cardTitles: { flex: 1 },
  cardTitle:  { fontSize: FONT_SIZE.md, fontWeight: '700', color: COLORS.text },
  cardSub:    { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, marginTop: 2 },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.danger + '12',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardMeta:  { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipText: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, fontWeight: '500' },

  // Modal
  modalFlex:    { flex: 1, backgroundColor: COLORS.surface },
  modalHeader:  {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle:   { fontSize: FONT_SIZE.lg, fontWeight: '700', color: COLORS.text },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalScroll:   { flex: 1 },
  modalContent:  { padding: SPACING.lg, gap: SPACING.md },

  // Form
  fieldGroup: { gap: 6 },
  label:      { fontSize: FONT_SIZE.sm, fontWeight: '600', color: COLORS.text },
  inputWrap:  {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    height: 50,
  },
  inputError: { borderColor: COLORS.danger },
  input:      { flex: 1, fontSize: FONT_SIZE.md, color: COLORS.text },
  errorText:  { fontSize: FONT_SIZE.xs, color: COLORS.danger, marginTop: 2 },

  // Fuel
  fuelRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  fuelChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  fuelChipActive:     { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '12' },
  fuelChipText:       { fontSize: FONT_SIZE.sm, color: COLORS.textMuted, fontWeight: '500' },
  fuelChipTextActive: { color: COLORS.primary, fontWeight: '700' },

  // Submit
  submitBtn: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: { color: COLORS.white, fontSize: FONT_SIZE.md, fontWeight: '700' },
});