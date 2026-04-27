import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  RefreshControl,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT_SIZE } from '../../constants';
import type { Vehicle } from '../../types';
import {
  getVehicles,
  createVehicle,
  deleteVehicle,
} from '../../services/vehiclesService';
import { VehicleSelector, type VehicleSelection } from '../../components/VehicleSelector';

// ── Fuel types ────────────────────────────────────────────────
const FUEL_TYPES = [
  { label: '⛽ Бензин',     value: 'petrol' },
  { label: '🛢️ Дизель',    value: 'diesel' },
  { label: '⚡ Цахилгаан',  value: 'electric' },
  { label: '🔋 Гибрид',    value: 'hybrid' },
  { label: '🔵 LPG',       value: 'lpg' },
];

// ── VehicleCard ───────────────────────────────────────────────
const VehicleCard = ({
  vehicle,
  onDelete,
}: {
  vehicle: Vehicle;
  onDelete: (id: string) => void;
}) => {
  const fuelMap: Record<string, string> = {
    petrol: '⛽ Бензин', diesel: '🛢️ Дизель',
    electric: '⚡ Цахилгаан', hybrid: '🔋 Гибрид', lpg: '🔵 LPG',
  };

  return (
    <View style={s.card}>
      <View style={s.cardAccent} />
      <View style={s.cardBody}>
        <View style={s.cardHeader}>
          <View style={s.cardIconBox}>
            <Ionicons name="car-sport" size={22} color={COLORS.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.cardMake}>
              {vehicle.make} {vehicle.model}
            </Text>
            <Text style={s.cardYear}>{vehicle.year} он</Text>
          </View>
          <TouchableOpacity
            style={s.deleteBtn}
            onPress={() => onDelete(vehicle.id)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
          </TouchableOpacity>
        </View>

        <View style={s.cardChips}>
          <Chip icon="card-outline"          label={vehicle.licensePlate} />
          <Chip icon="color-palette-outline" label={vehicle.color} />
          <Chip label={fuelMap[vehicle.fuelType ?? 'petrol'] ?? vehicle.fuelType} />
          {vehicle.insuranceProvider && (
            <Chip icon="shield-outline" label={vehicle.insuranceProvider} />
          )}
        </View>
      </View>
    </View>
  );
};

const Chip = ({ icon, label }: { icon?: string; label: string }) => (
  <View style={s.chip}>
    {icon && (
      <Ionicons name={icon as any} size={11} color={COLORS.textMuted} style={{ marginRight: 3 }} />
    )}
    <Text style={s.chipText}>{label}</Text>
  </View>
);

// ── Plate input ───────────────────────────────────────────────
const PlateInput = ({
  value,
  onChangeText,
  error,
}: {
  value: string;
  onChangeText: (t: string) => void;
  error?: string;
}) => (
  <View style={s.fieldGroup}>
    <Text style={s.fieldLabel}>
      Улсын дугаар <Text style={{ color: COLORS.danger }}>*</Text>
    </Text>
    <View style={[s.inputWrap, error ? s.inputError : null]}>
      <Ionicons name="card-outline" size={16} color={COLORS.textMuted} style={{ marginRight: 8 }} />
      <TextInput
        style={s.input}
        placeholder="1234УБА"
        placeholderTextColor={COLORS.textLight}
        value={value}
        onChangeText={(t) => onChangeText(t.toUpperCase())}
        autoCapitalize="characters"
        autoCorrect={false}
        maxLength={10}
      />
    </View>
    {error && <Text style={s.errorText}>{error}</Text>}
  </View>
);

// ════════════════════════════════════════════════════════════════
// MAIN SCREEN
// ════════════════════════════════════════════════════════════════
export const VehiclesScreen = () => {
  const [vehicles,     setVehicles]     = useState<Vehicle[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting,   setSubmitting]   = useState(false);

  // Form state
  const [vehicleData,  setVehicleData]  = useState<Partial<VehicleSelection>>({});
  const [licensePlate, setLicensePlate] = useState('');
  const [fuelType,     setFuelType]     = useState('petrol');
  const [errors,       setErrors]       = useState<Record<string, string>>({});

  // ── Fetch ────────────────────────────────────────────────────
  const fetchVehicles = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await getVehicles();
      setVehicles(data);
    } catch {
      Alert.alert('Алдаа', 'Машины жагсаалт ачааллахад алдаа гарлаа');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchVehicles(); }, []);

  const onRefresh = () => { setRefreshing(true); fetchVehicles(true); };

  // ── Validation ───────────────────────────────────────────────
  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!vehicleData.brand)           e.brand        = 'Брэнд сонгоно уу';
    if (!vehicleData.model)           e.model        = 'Загвар сонгоно уу';
    if (!vehicleData.manufactureYear) e.year         = 'Үйлдвэрлэсэн он сонгоно уу';
    if (!vehicleData.color)           e.color        = 'Өнгө сонгоно уу';
    if (!licensePlate.trim())         e.licensePlate = 'Улсын дугаар оруулна уу';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Submit ───────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload = {
        make:         vehicleData.brand!,
        model:        vehicleData.model!,
        // Backend-д manufactureYear → year болгоно
        year:         vehicleData.manufactureYear!,
        color:        vehicleData.color!,
        licensePlate: licensePlate.trim(),
        fuelType,
        // importYear-ийг notes эсвэл тусгай талбар болгон дамжуулж болно
        // (backend-д importYear талбар нэмэгдсэн тохиолдолд):
        // importYear: vehicleData.importYear || undefined,
      };
      const newVehicle = await createVehicle(payload);
      setVehicles((prev) => [newVehicle, ...prev]);
      closeModal();

      // Хэрэв орж ирсэн он оруулсан бол мэдэгдэл харуулна
      if (vehicleData.importYear) {
        Alert.alert(
          '✅ Машин нэмэгдлээ',
          `Үйлдвэрлэсэн он: ${vehicleData.manufactureYear}\nОрж ирсэн он: ${vehicleData.importYear}\n\nЭнэ мэдээлэл AI үнэлгээний нарийвчлалыг нэмэгдүүлэхэд ашиглагдана.`,
        );
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Машин нэмэхэд алдаа гарлаа';
      Alert.alert('Алдаа', Array.isArray(msg) ? msg.join('\n') : msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete ───────────────────────────────────────────────────
  const handleDelete = (id: string) => {
    const v = vehicles.find((x) => x.id === id);
    Alert.alert(
      'Устгах уу?',
      `"${v?.make} ${v?.model}" машиныг устгах уу?`,
      [
        { text: 'Болих', style: 'cancel' },
        {
          text: 'Устгах', style: 'destructive',
          onPress: async () => {
            try {
              await deleteVehicle(id);
              setVehicles((prev) => prev.filter((x) => x.id !== id));
            } catch {
              Alert.alert('Алдаа', 'Устгахад алдаа гарлаа');
            }
          },
        },
      ],
    );
  };

  const closeModal = () => {
    setModalVisible(false);
    setVehicleData({});
    setLicensePlate('');
    setFuelType('petrol');
    setErrors({});
  };

  // ── Empty ────────────────────────────────────────────────────
  const renderEmpty = () => (
    <View style={s.emptyBox}>
      <View style={s.emptyIconBox}>
        <Ionicons name="car-outline" size={48} color={COLORS.textLight} />
      </View>
      <Text style={s.emptyTitle}>Машин бүртгэгдээгүй байна</Text>
      <Text style={s.emptySub}>"+" товч дарж машинаа нэмнэ үү</Text>
    </View>
  );

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>Миний машинууд</Text>
          <Text style={s.headerSub}>{vehicles.length} машин бүртгэлтэй</Text>
        </View>
        <TouchableOpacity
          style={s.addBtn}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* List */}
      {loading ? (
        <View style={s.loadingBox}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={s.loadingText}>Ачааллаж байна...</Text>
        </View>
      ) : (
        <FlatList
          data={vehicles}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <VehicleCard vehicle={item} onDelete={handleDelete} />
          )}
          contentContainerStyle={[
            s.listContent,
            vehicles.length === 0 && s.listEmpty,
          ]}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl
              refreshing={refreshing} onRefresh={onRefresh}
              colors={[COLORS.primary]} tintColor={COLORS.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* ── Add Vehicle Modal ── */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
            {/* Modal header */}
            <View style={s.modalHeader}>
              <TouchableOpacity style={s.modalCloseBtn} onPress={closeModal}>
                <Ionicons name="close" size={22} color={COLORS.text} />
              </TouchableOpacity>
              <Text style={s.modalTitle}>Машин нэмэх</Text>
              <View style={{ width: 36 }} />
            </View>

            <ScrollView
              contentContainerStyle={s.modalContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* ── VehicleSelector ─────────────────────── */}
              <View style={s.section}>
                <Text style={s.sectionTitle}>Машины мэдээлэл</Text>
                <VehicleSelector
                  value={vehicleData}
                  onChange={(data: VehicleSelection) => {
                    setVehicleData(data);
                    setErrors((prev) => ({
                      ...prev, brand: '', model: '', year: '', color: '',
                    }));
                  }}
                />
                {/* Validation errors */}
                {(errors.brand || errors.model || errors.year || errors.color) && (
                  <View style={s.selectorError}>
                    <Ionicons name="warning-outline" size={14} color={COLORS.danger} />
                    <Text style={s.selectorErrorText}>
                      {errors.brand || errors.model || errors.year || errors.color}
                    </Text>
                  </View>
                )}
              </View>

              {/* ── Улсын дугаар ── */}
              <View style={s.section}>
                <Text style={s.sectionTitle}>Бүртгэлийн мэдээлэл</Text>
                <PlateInput
                  value={licensePlate}
                  onChangeText={(t) => {
                    setLicensePlate(t);
                    setErrors((prev) => ({ ...prev, licensePlate: '' }));
                  }}
                  error={errors.licensePlate}
                />
              </View>

              {/* ── Түлшний төрөл ── */}
              <View style={s.section}>
                <Text style={s.sectionTitle}>Түлшний төрөл</Text>
                <View style={s.fuelRow}>
                  {FUEL_TYPES.map((ft) => (
                    <TouchableOpacity
                      key={ft.value}
                      style={[s.fuelChip, fuelType === ft.value && s.fuelChipActive]}
                      onPress={() => setFuelType(ft.value)}
                      activeOpacity={0.7}
                    >
                      <Text style={[s.fuelChipText, fuelType === ft.value && s.fuelChipTextActive]}>
                        {ft.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* ── Submit ── */}
              <TouchableOpacity
                style={[s.submitBtn, submitting && s.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={submitting}
                activeOpacity={0.85}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                    <Text style={s.submitBtnText}>Хадгалах</Text>
                  </>
                )}
              </TouchableOpacity>

              <View style={{ height: SPACING.xxl }} />
            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

// ── Styles ────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: COLORS.background },
  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg, paddingBottom: SPACING.md },
  headerTitle: { fontSize: FONT_SIZE.xl, fontWeight: '700', color: COLORS.text },
  headerSub:   { fontSize: FONT_SIZE.sm, color: COLORS.textMuted, marginTop: 2 },
  addBtn:      { width: 44, height: 44, borderRadius: RADIUS.md, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', ...Platform.select({ ios: { shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 }, android: { elevation: 4 } }) },
  listContent: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xl },
  listEmpty:   { flex: 1, justifyContent: 'center' },
  loadingBox:  { flex: 1, justifyContent: 'center', alignItems: 'center', gap: SPACING.sm },
  loadingText: { fontSize: FONT_SIZE.sm, color: COLORS.textMuted },
  emptyBox:    { alignItems: 'center', paddingVertical: SPACING.xxl, gap: SPACING.sm },
  emptyIconBox: { width: 96, height: 96, borderRadius: 48, backgroundColor: COLORS.border, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.sm },
  emptyTitle:  { fontSize: FONT_SIZE.lg, fontWeight: '700', color: COLORS.textMuted },
  emptySub:    { fontSize: FONT_SIZE.sm, color: COLORS.textLight, textAlign: 'center' },
  card:        { flexDirection: 'row', backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, marginBottom: SPACING.sm, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden', ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6 }, android: { elevation: 2 } }) },
  cardAccent:  { width: 4, backgroundColor: COLORS.primary },
  cardBody:    { flex: 1, padding: SPACING.md },
  cardHeader:  { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm },
  cardIconBox: { width: 40, height: 40, borderRadius: RADIUS.sm, backgroundColor: COLORS.primary + '12', justifyContent: 'center', alignItems: 'center', marginRight: SPACING.sm },
  cardMake:    { fontSize: FONT_SIZE.md, fontWeight: '700', color: COLORS.text },
  cardYear:    { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, marginTop: 2 },
  deleteBtn:   { width: 32, height: 32, borderRadius: RADIUS.sm, backgroundColor: COLORS.danger + '12', justifyContent: 'center', alignItems: 'center' },
  cardChips:   { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip:        { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background, borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: COLORS.border },
  chipText:    { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, fontWeight: '500' },
  modalHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: COLORS.border },
  modalTitle:    { fontSize: FONT_SIZE.lg, fontWeight: '700', color: COLORS.text },
  modalCloseBtn: { width: 36, height: 36, borderRadius: RADIUS.sm, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  modalContent:  { padding: SPACING.lg, gap: SPACING.md },
  section:       { gap: SPACING.sm },
  sectionTitle:  { fontSize: FONT_SIZE.xs, fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  selectorError: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FEF2F2', borderRadius: RADIUS.sm, padding: 8, borderWidth: 0.5, borderColor: '#FCA5A5' },
  selectorErrorText: { fontSize: FONT_SIZE.xs, color: COLORS.danger },
  fieldGroup:  { gap: 6 },
  fieldLabel:  { fontSize: FONT_SIZE.sm, fontWeight: '600', color: COLORS.text },
  inputWrap:   { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: COLORS.border, paddingHorizontal: SPACING.md, height: 50 },
  inputError:  { borderColor: COLORS.danger },
  input:       { flex: 1, fontSize: FONT_SIZE.md, color: COLORS.text },
  errorText:   { fontSize: FONT_SIZE.xs, color: COLORS.danger, marginTop: 2 },
  fuelRow:         { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  fuelChip:        { paddingHorizontal: 12, paddingVertical: 8, borderRadius: RADIUS.full, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.background },
  fuelChipActive:  { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '12' },
  fuelChipText:    { fontSize: FONT_SIZE.sm, color: COLORS.textMuted, fontWeight: '500' },
  fuelChipTextActive: { color: COLORS.primary, fontWeight: '700' },
  submitBtn:        { flexDirection: 'row', backgroundColor: COLORS.primary, borderRadius: RADIUS.md, height: 52, justifyContent: 'center', alignItems: 'center', gap: SPACING.sm, marginTop: SPACING.sm, ...Platform.select({ ios: { shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 }, android: { elevation: 4 } }) },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText:    { color: '#fff', fontSize: FONT_SIZE.md, fontWeight: '700' },
});