import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, SPACING, RADIUS, FONT_SIZE } from '../constants';
import apiClient from '../services/apiClient';

// ── Types ─────────────────────────────────────────────────────
export interface VehicleColor {
  name: string;
  nameEn: string;
  hex: string;
  darkText: boolean;
}

export interface VehicleSelection {
  brand: string;
  model: string;
  year: number;
  color: string;
  colorHex: string;
}

interface CatalogCache {
  brands: Array<{ name: string; country: string; popularInMongolia: boolean }>;
  modelsByBrand: Record<string, string[]>;
  years: number[];
  colors: VehicleColor[];
  cachedAt: number;
}

const CACHE_KEY  = 'vehicle_catalog_v2';
const CACHE_TTL  = 24 * 60 * 60 * 1000; // 24h

// ── Props ─────────────────────────────────────────────────────
interface VehicleSelectorProps {
  value?: Partial<VehicleSelection>;
  onChange: (data: VehicleSelection) => void;
  disabled?: boolean;
}

// ════════════════════════════════════════════════════════════════
// PICKER MODAL — reusable generic list picker
// ════════════════════════════════════════════════════════════════
interface PickerItem {
  id: string;
  label: string;
  sub?: string;
  badge?: string;
  hex?: string;
  darkText?: boolean;
}

interface PickerModalProps {
  visible: boolean;
  title: string;
  items: PickerItem[];
  selectedId?: string;
  onSelect: (item: PickerItem) => void;
  onClose: () => void;
  searchable?: boolean;
  searchPlaceholder?: string;
  colorMode?: boolean;
}

const PickerModal: React.FC<PickerModalProps> = ({
  visible, title, items, selectedId,
  onSelect, onClose, searchable = true,
  searchPlaceholder = 'Хайх...', colorMode = false,
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [visible]);

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        (item.sub?.toLowerCase().includes(q) ?? false),
    );
  }, [query, items]);

  const renderItem = ({ item }: { item: PickerItem }) => {
    const isSelected = item.id === selectedId;

    if (colorMode && item.hex) {
      return (
        <TouchableOpacity
          style={[pm.colorRow, isSelected && pm.colorRowSelected]}
          onPress={() => { onSelect(item); onClose(); }}
          activeOpacity={0.7}
        >
          <View style={[pm.colorSwatch, { backgroundColor: item.hex }]}>
            {isSelected && (
              <Ionicons
                name="checkmark"
                size={14}
                color={item.darkText ? '#fff' : '#1a1a1a'}
              />
            )}
          </View>
          <Text style={[pm.colorLabel, isSelected && pm.selectedLabel]}>
            {item.label}
          </Text>
          {isSelected && (
            <Ionicons name="checkmark-circle" size={18} color={COLORS.secondary} />
          )}
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        style={[pm.item, isSelected && pm.itemSelected]}
        onPress={() => { onSelect(item); onClose(); }}
        activeOpacity={0.7}
      >
        <View style={pm.itemLeft}>
          <Text style={[pm.itemLabel, isSelected && pm.selectedLabel]}>
            {item.label}
          </Text>
          {item.sub && (
            <Text style={pm.itemSub}>{item.sub}</Text>
          )}
        </View>
        <View style={pm.itemRight}>
          {item.badge && (
            <View style={pm.popularBadge}>
              <Text style={pm.popularBadgeText}>{item.badge}</Text>
            </View>
          )}
          {isSelected && (
            <Ionicons name="checkmark-circle" size={18} color={COLORS.secondary} />
          )}
        </View>
      </TouchableOpacity>
    );
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
        <SafeAreaView style={pm.safe}>
          {/* Header */}
          <View style={pm.header}>
            <TouchableOpacity style={pm.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={22} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={pm.title}>{title}</Text>
            <View style={{ width: 36 }} />
          </View>

          {/* Search */}
          {searchable && (
            <View style={pm.searchWrap}>
              <Ionicons name="search-outline" size={16} color={COLORS.textMuted} style={{ marginRight: 8 }} />
              <TextInput
                ref={inputRef}
                style={pm.searchInput}
                placeholder={searchPlaceholder}
                placeholderTextColor={COLORS.textLight}
                value={query}
                onChangeText={setQuery}
                clearButtonMode="while-editing"
                autoCorrect={false}
              />
              {query.length > 0 && Platform.OS !== 'ios' && (
                <TouchableOpacity onPress={() => setQuery('')}>
                  <Ionicons name="close-circle" size={16} color={COLORS.textMuted} />
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Count */}
          <Text style={pm.countLabel}>{filtered.length} үр дүн</Text>

          {/* List */}
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={pm.sep} />}
            ListEmptyComponent={() => (
              <View style={pm.emptyBox}>
                <Ionicons name="search-outline" size={32} color={COLORS.textLight} />
                <Text style={pm.emptyText}>"{query}" олдсонгүй</Text>
              </View>
            )}
            contentContainerStyle={{ paddingBottom: 40 }}
          />
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ════════════════════════════════════════════════════════════════
// STEP INDICATOR
// ════════════════════════════════════════════════════════════════
const STEPS = ['Брэнд', 'Загвар', 'Он', 'Өнгө'];

const StepIndicator: React.FC<{ currentStep: number; completedSteps: number }> = ({
  currentStep, completedSteps,
}) => (
  <View style={si.wrap}>
    {STEPS.map((label, i) => {
      const done    = i < completedSteps;
      const active  = i === currentStep;
      return (
        <React.Fragment key={label}>
          <View style={si.step}>
            <View style={[si.circle, done && si.circleDone, active && si.circleActive]}>
              {done ? (
                <Ionicons name="checkmark" size={12} color="#fff" />
              ) : (
                <Text style={[si.circleNum, active && si.circleNumActive]}>{i + 1}</Text>
              )}
            </View>
            <Text style={[si.label, (done || active) && si.labelActive]}>{label}</Text>
          </View>
          {i < STEPS.length - 1 && (
            <View style={[si.line, i < completedSteps && si.lineDone]} />
          )}
        </React.Fragment>
      );
    })}
  </View>
);

// ════════════════════════════════════════════════════════════════
// FIELD ROW — tap to open picker
// ════════════════════════════════════════════════════════════════
interface FieldRowProps {
  step: number;
  label: string;
  value?: string;
  placeholder: string;
  disabled?: boolean;
  onPress: () => void;
  colorHex?: string;
  icon: string;
}

const FieldRow: React.FC<FieldRowProps> = ({
  step, label, value, placeholder, disabled, onPress, colorHex, icon,
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = () =>
    Animated.spring(scale, { toValue: 0.98, useNativeDriver: true, speed: 40 }).start();
  const pressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20 }).start();

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        style={[fr.row, disabled && fr.rowDisabled, value && fr.rowFilled]}
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        disabled={disabled}
        activeOpacity={1}
      >
        {/* Step number */}
        <View style={[fr.stepBubble, value && fr.stepBubbleDone]}>
          {value ? (
            <Ionicons name="checkmark" size={11} color="#fff" />
          ) : (
            <Text style={[fr.stepNum, disabled && fr.stepNumDisabled]}>{step}</Text>
          )}
        </View>

        {/* Icon */}
        {colorHex ? (
          <View style={[fr.colorPreview, { backgroundColor: colorHex }]} />
        ) : (
          <Ionicons
            name={icon as any}
            size={18}
            color={disabled ? COLORS.textLight : value ? COLORS.primary : COLORS.textMuted}
            style={{ marginHorizontal: 8 }}
          />
        )}

        {/* Text */}
        <View style={{ flex: 1 }}>
          <Text style={fr.fieldLabel}>{label}</Text>
          <Text style={[fr.fieldValue, !value && fr.fieldPlaceholder]} numberOfLines={1}>
            {value ?? placeholder}
          </Text>
        </View>

        {/* Chevron */}
        <Ionicons
          name="chevron-forward"
          size={16}
          color={disabled ? COLORS.border : COLORS.textMuted}
        />
      </TouchableOpacity>
    </Animated.View>
  );
};

// ════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════
export const VehicleSelector: React.FC<VehicleSelectorProps> = ({
  value, onChange, disabled = false,
}) => {
  // ── Selection state ────────────────────────────────────────
  const [brand,    setBrand]    = useState(value?.brand   ?? '');
  const [model,    setModel]    = useState(value?.model   ?? '');
  const [year,     setYear]     = useState(value?.year    ?? 0);
  const [color,    setColor]    = useState(value?.color   ?? '');
  const [colorHex, setColorHex] = useState(value?.colorHex ?? '');

  // ── Catalog state ──────────────────────────────────────────
  const [catalog, setCatalog]  = useState<CatalogCache | null>(null);
  const [loading, setLoading]  = useState(true);

  // ── Modal state ────────────────────────────────────────────
  const [openPicker, setOpenPicker] = useState<
    'brand' | 'model' | 'year' | 'color' | null
  >(null);

  // ── Load catalog (cache first) ─────────────────────────────
  useEffect(() => {
    loadCatalog();
  }, []);

  const loadCatalog = async () => {
    try {
      // Try cache first
      const raw = await AsyncStorage.getItem(CACHE_KEY);
      if (raw) {
        const cached: CatalogCache = JSON.parse(raw);
        if (Date.now() - cached.cachedAt < CACHE_TTL) {
          setCatalog(cached);
          setLoading(false);
          return;
        }
      }
      // Fetch from API
      await fetchAndCacheCatalog();
    } catch {
      // Fallback: try API without cache
      await fetchAndCacheCatalog();
    }
  };

  const fetchAndCacheCatalog = async () => {
    try {
      const { data } = await apiClient.get('/vehicles/catalog/all');
      const catalog: CatalogCache = {
        ...data.data,
        cachedAt: Date.now(),
      };
      setCatalog(catalog);
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(catalog));
    } catch (err) {
      Alert.alert('Каталог ачааллахад алдаа гарлаа', 'Интернэт холболтоо шалгана уу.');
    } finally {
      setLoading(false);
    }
  };

  // ── Computed picker items ──────────────────────────────────
  const brandItems = useMemo((): PickerItem[] => {
    if (!catalog) return [];
    return catalog.brands.map((b) => ({
      id: b.name,
      label: b.name,
      sub: b.country,
      badge: b.popularInMongolia ? '🇲🇳 Түгээмэл' : undefined,
    }));
  }, [catalog]);

  const modelItems = useMemo((): PickerItem[] => {
    if (!catalog || !brand) return [];
    const models = catalog.modelsByBrand[brand] ?? [];
    return models.map((m) => ({ id: m, label: m }));
  }, [catalog, brand]);

  const yearItems = useMemo((): PickerItem[] => {
    if (!catalog) return [];
    return catalog.years.map((y) => ({
      id: String(y),
      label: `${y} он`,
    }));
  }, [catalog]);

  const colorItems = useMemo((): PickerItem[] => {
    if (!catalog) return [];
    return catalog.colors.map((c) => ({
      id: c.name,
      label: c.name,
      sub: c.nameEn,
      hex: c.hex,
      darkText: c.darkText,
    }));
  }, [catalog]);

  // ── Selection handlers ─────────────────────────────────────
  const handleBrandSelect = useCallback(
    (item: PickerItem) => {
      setBrand(item.id);
      setModel('');     // reset dependent fields
      setYear(0);
      setColor('');
      setColorHex('');
    },
    [],
  );

  const handleModelSelect = useCallback((item: PickerItem) => {
    setModel(item.id);
    setYear(0);
    setColor('');
    setColorHex('');
  }, []);

  const handleYearSelect = useCallback((item: PickerItem) => {
    setYear(Number(item.id));
    setColor('');
    setColorHex('');
  }, []);

  const handleColorSelect = useCallback(
    (item: PickerItem) => {
      setColor(item.id);
      setColorHex(item.hex ?? '');
      // Notify parent
      if (brand && model && year) {
        onChange({
          brand,
          model,
          year,
          color: item.id,
          colorHex: item.hex ?? '',
        });
      }
    },
    [brand, model, year, onChange],
  );

  // ── Step completion ────────────────────────────────────────
  const completedSteps =
    (brand ? 1 : 0) + (model ? 1 : 0) + (year ? 1 : 0) + (color ? 1 : 0);

  const currentStep =
    !brand ? 0 : !model ? 1 : !year ? 2 : !color ? 3 : 3;

  const allDone = !!(brand && model && year && color);

  // ── Summary card ───────────────────────────────────────────
  if (loading) {
    return (
      <View style={vs.loadingBox}>
        <ActivityIndicator size="small" color={COLORS.primary} />
        <Text style={vs.loadingText}>Каталог ачааллаж байна...</Text>
      </View>
    );
  }

  return (
    <View style={vs.container}>
      {/* Step indicator */}
      <StepIndicator currentStep={currentStep} completedSteps={completedSteps} />

      {/* Fields */}
      <View style={vs.fields}>
        <FieldRow
          step={1}
          label="Брэнд"
          value={brand}
          placeholder="Toyota, Hyundai, BMW..."
          icon="business-outline"
          onPress={() => !disabled && setOpenPicker('brand')}
          disabled={disabled}
        />

        <FieldRow
          step={2}
          label="Загвар"
          value={model}
          placeholder={brand ? 'Загвар сонгоно уу' : 'Эхлээд брэнд сонгоно уу'}
          icon="car-outline"
          onPress={() => !disabled && brand && setOpenPicker('model')}
          disabled={disabled || !brand}
        />

        <FieldRow
          step={3}
          label="Он жил"
          value={year ? `${year} он` : undefined}
          placeholder={model ? 'Он жил сонгоно уу' : 'Эхлээд загвар сонгоно уу'}
          icon="calendar-outline"
          onPress={() => !disabled && model && setOpenPicker('year')}
          disabled={disabled || !model}
        />

        <FieldRow
          step={4}
          label="Өнгө"
          value={color}
          colorHex={colorHex || undefined}
          placeholder={year ? 'Өнгө сонгоно уу' : 'Эхлээд он жил сонгоно уу'}
          icon="color-palette-outline"
          onPress={() => !disabled && year && setOpenPicker('color')}
          disabled={disabled || !year}
        />
      </View>

      {/* Summary — бүгд сонгогдсон үед */}
      {allDone && (
        <View style={vs.summaryCard}>
          <View style={[vs.colorDot, { backgroundColor: colorHex }]} />
          <View style={{ flex: 1 }}>
            <Text style={vs.summaryMain}>
              {brand} {model}
            </Text>
            <Text style={vs.summarySub}>
              {year} он • {color}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              setBrand(''); setModel(''); setYear(0); setColor(''); setColorHex('');
            }}
            style={vs.resetBtn}
          >
            <Ionicons name="refresh" size={14} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>
      )}

      {/* Hint */}
      {!allDone && (
        <View style={vs.hint}>
          <Ionicons name="information-circle-outline" size={13} color={COLORS.primary} />
          <Text style={vs.hintText}>
            Машины мэдээллийг нарийвчлан оруулснаар AI шинжилгээний нарийвчлал нэмэгдэнэ.
          </Text>
        </View>
      )}

      {/* Modals */}
      <PickerModal
        visible={openPicker === 'brand'}
        title="Брэнд сонгох"
        items={brandItems}
        selectedId={brand}
        onSelect={handleBrandSelect}
        onClose={() => setOpenPicker(null)}
        searchPlaceholder="Toyota, Hyundai, BMW..."
      />

      <PickerModal
        visible={openPicker === 'model'}
        title={`${brand} — Загвар сонгох`}
        items={modelItems}
        selectedId={model}
        onSelect={handleModelSelect}
        onClose={() => setOpenPicker(null)}
        searchPlaceholder="Загварын нэр хайх..."
      />

      <PickerModal
        visible={openPicker === 'year'}
        title="Он жил сонгох"
        items={yearItems}
        selectedId={year ? String(year) : undefined}
        onSelect={handleYearSelect}
        onClose={() => setOpenPicker(null)}
        searchPlaceholder="Он жил хайх..."
      />

      <PickerModal
        visible={openPicker === 'color'}
        title="Өнгө сонгох"
        items={colorItems}
        selectedId={color}
        onSelect={handleColorSelect}
        onClose={() => setOpenPicker(null)}
        colorMode
        searchPlaceholder="Өнгөний нэр хайх..."
      />
    </View>
  );
};

// ════════════════════════════════════════════════════════════════
// STYLES
// ════════════════════════════════════════════════════════════════

// Picker Modal
const pm = StyleSheet.create({
  safe:     { flex: 1, backgroundColor: '#F8FAFC' },
  header:   {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  closeBtn: {
    width: 36, height: 36, borderRadius: RADIUS.sm, backgroundColor: '#F3F4F6',
    justifyContent: 'center', alignItems: 'center',
  },
  title:    { fontSize: FONT_SIZE.lg, fontWeight: '700', color: '#111928' },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', margin: SPACING.md,
    borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: '#E5E7EB',
    paddingHorizontal: SPACING.md, height: 44,
  },
  searchInput: { flex: 1, fontSize: FONT_SIZE.md, color: '#111928' },

  countLabel: {
    fontSize: FONT_SIZE.xs, color: '#6B7280', paddingHorizontal: SPACING.lg,
    marginBottom: 4, marginTop: -4,
  },

  item:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingVertical: 14, backgroundColor: '#fff' },
  itemSelected: { backgroundColor: '#EFF6FF' },
  itemLeft:     { flex: 1 },
  itemRight:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  itemLabel:    { fontSize: FONT_SIZE.md, color: '#111928' },
  itemSub:      { fontSize: FONT_SIZE.xs, color: '#6B7280', marginTop: 2 },
  selectedLabel: { fontWeight: '700', color: '#1A56DB' },
  popularBadge: {
    backgroundColor: '#ECFDF5', borderRadius: RADIUS.full,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  popularBadgeText: { fontSize: 10, color: '#065F46', fontWeight: '600' },

  sep:     { height: 1, backgroundColor: '#F8FAFC' },

  colorRow:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingVertical: 12, backgroundColor: '#fff', gap: SPACING.md },
  colorRowSelected: { backgroundColor: '#EFF6FF' },
  colorSwatch:  { width: 36, height: 36, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center' },
  colorLabel:   { flex: 1, fontSize: FONT_SIZE.md, color: '#111928' },

  emptyBox: { alignItems: 'center', paddingVertical: SPACING.xxl, gap: SPACING.sm },
  emptyText: { fontSize: FONT_SIZE.sm, color: '#6B7280' },
});

// Step indicator
const si = StyleSheet.create({
  wrap:    { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md },
  step:    { alignItems: 'center', gap: 4 },
  line:    { flex: 1, height: 1.5, backgroundColor: '#E5E7EB', marginBottom: 16 },
  lineDone: { backgroundColor: '#0E9F6E' },

  circle:         { width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: '#D1D5DB', backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  circleDone:     { backgroundColor: '#0E9F6E', borderColor: '#0E9F6E' },
  circleActive:   { borderColor: '#1A56DB', backgroundColor: '#EFF6FF' },
  circleNum:      { fontSize: 11, fontWeight: '700', color: '#9CA3AF' },
  circleNumActive: { color: '#1A56DB' },

  label:       { fontSize: 9, color: '#9CA3AF', fontWeight: '500' },
  labelActive: { color: '#111928', fontWeight: '700' },
});

// Field row
const fr = StyleSheet.create({
  row:          {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: RADIUS.md, padding: SPACING.md,
    borderWidth: 1.5, borderColor: '#E5E7EB', gap: 6,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 },
      android: { elevation: 1 },
    }),
  },
  rowDisabled:  { backgroundColor: '#F9FAFB', borderColor: '#F3F4F6', opacity: 0.6 },
  rowFilled:    { borderColor: '#93C5FD', backgroundColor: '#EFF6FF' },
  stepBubble:   { width: 22, height: 22, borderRadius: 11, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  stepBubbleDone: { backgroundColor: '#0E9F6E' },
  stepNum:      { fontSize: 11, fontWeight: '800', color: '#6B7280' },
  stepNumDisabled: { color: '#D1D5DB' },
  fieldLabel:   { fontSize: 10, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.3 },
  fieldValue:   { fontSize: FONT_SIZE.sm, fontWeight: '600', color: '#111928', marginTop: 1 },
  fieldPlaceholder: { color: '#9CA3AF', fontWeight: '400' },
  colorPreview: { width: 24, height: 24, borderRadius: 6, borderWidth: 1, borderColor: '#E5E7EB', marginHorizontal: 8 },
});

// Main
const vs = StyleSheet.create({
  container:    { gap: SPACING.sm },
  loadingBox:   { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, padding: SPACING.md },
  loadingText:  { fontSize: FONT_SIZE.sm, color: '#6B7280' },
  fields:       { gap: 8 },
  summaryCard:  {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#ECFDF5', borderRadius: RADIUS.md, padding: SPACING.md,
    borderWidth: 1, borderColor: '#6EE7B7', gap: SPACING.sm,
  },
  colorDot:     { width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, borderColor: '#E5E7EB' },
  summaryMain:  { fontSize: FONT_SIZE.md, fontWeight: '700', color: '#111928' },
  summarySub:   { fontSize: FONT_SIZE.xs, color: '#6B7280', marginTop: 2 },
  resetBtn:     { padding: 4 },
  hint:         {
    flexDirection: 'row', alignItems: 'flex-start', gap: 6,
    backgroundColor: '#EFF6FF', borderRadius: RADIUS.sm, padding: SPACING.sm,
    borderWidth: 0.5, borderColor: '#93C5FD',
  },
  hintText:     { fontSize: FONT_SIZE.xs, color: '#1D4ED8', flex: 1, lineHeight: 18 },
});