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
  /** Үйлдвэрлэсэн он */
  manufactureYear: number;
  /** Монголд орж ирсэн он (заавал биш) */
  importYear?: number;
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

const CACHE_KEY = 'vehicle_catalog_v3';
const CACHE_TTL = 24 * 60 * 60 * 1000;

// ── Props ─────────────────────────────────────────────────────
interface VehicleSelectorProps {
  value?: Partial<VehicleSelection>;
  onChange: (data: VehicleSelection) => void;
  disabled?: boolean;
}

// ── Catalog unwrap helper ─────────────────────────────────────
function unwrapCatalog(raw: any): any {
  if (!raw) return null;
  const candidates = [raw, raw?.data, raw?.data?.data, raw?.data?.data?.data];
  for (const c of candidates) {
    if (c && Array.isArray(c?.brands) && c.brands.length > 0) return c;
  }
  return raw?.data?.data ?? raw?.data ?? raw;
}

// ════════════════════════════════════════════════════════════════
// PICKER MODAL
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
          style={[pm.colorRow, isSelected ? pm.colorRowSelected : undefined]}
          onPress={() => { onSelect(item); onClose(); }}
          activeOpacity={0.7}
        >
          <View style={[pm.colorSwatch, { backgroundColor: item.hex }]}>
            {isSelected && (
              <Ionicons name="checkmark" size={14} color={item.darkText ? '#fff' : '#1a1a1a'} />
            )}
          </View>
          <Text style={[pm.colorLabel, isSelected ? pm.selectedLabel : undefined]}>{item.label}</Text>
          {isSelected && <Ionicons name="checkmark-circle" size={18} color={COLORS.secondary} />}
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        style={[pm.item, isSelected ? pm.itemSelected : undefined]}
        onPress={() => { onSelect(item); onClose(); }}
        activeOpacity={0.7}
      >
        <View style={pm.itemLeft}>
          <Text style={[pm.itemLabel, isSelected ? pm.selectedLabel : undefined]}>{item.label}</Text>
          {item.sub && <Text style={pm.itemSub}>{item.sub}</Text>}
        </View>
        <View style={pm.itemRight}>
          {item.badge && (
            <View style={pm.popularBadge}>
              <Text style={pm.popularBadgeText}>{item.badge}</Text>
            </View>
          )}
          {isSelected && <Ionicons name="checkmark-circle" size={18} color={COLORS.secondary} />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <SafeAreaView style={pm.safe}>
          <View style={pm.header}>
            <TouchableOpacity style={pm.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={22} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={pm.title}>{title}</Text>
            <View style={{ width: 36 }} />
          </View>

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

          <Text style={pm.countLabel}>{filtered.length} үр дүн</Text>

          <FlatList
            data={filtered}
            keyExtractor={(item) => `${title}__${item.id}`}
            renderItem={renderItem}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={pm.sep} />}
            ListEmptyComponent={() => (
              <View style={pm.emptyBox}>
                <Ionicons name="search-outline" size={32} color={COLORS.textLight} />
                <Text style={pm.emptyText}>
                  {query ? `"${query}" олдсонгүй` : 'Өгөгдөл байхгүй байна'}
                </Text>
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
// STEP INDICATOR — Брэнд / Загвар / Он / Өнгө (4 алхам)
// ════════════════════════════════════════════════════════════════
const STEPS = ['Брэнд', 'Загвар', 'Он', 'Өнгө'];

const StepIndicator: React.FC<{ currentStep: number; completedSteps: number }> = ({
  currentStep, completedSteps,
}) => (
  <View style={si.wrap}>
    {STEPS.map((label, i) => {
      const done   = i < completedSteps;
      const active = i === currentStep;
      return (
        <React.Fragment key={label}>
          <View style={si.step}>
            <View style={[si.circle, done ? si.circleDone : undefined, active ? si.circleActive : undefined]}>
              {done
                ? <Ionicons name="checkmark" size={12} color="#fff" />
                : <Text style={[si.circleNum, active ? si.circleNumActive : undefined]}>{i + 1}</Text>}
            </View>
            <Text style={[si.label, (done || active) ? si.labelActive : undefined]}>{label}</Text>
          </View>
          {i < STEPS.length - 1 && (
            <View style={[si.line, i < completedSteps ? si.lineDone : undefined]} />
          )}
        </React.Fragment>
      );
    })}
  </View>
);

// ════════════════════════════════════════════════════════════════
// FIELD ROW — нийтлэг товч мөр
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
  /** Дэд тайлбар — жишэ: "Үйлдвэрлэсэн он" */
  sublabel?: string;
  /** Заавал биш гэдгийг харуулах */
  optional?: boolean;
}

const FieldRow: React.FC<FieldRowProps> = ({
  step, label, value, placeholder, disabled, onPress,
  colorHex, icon, sublabel, optional,
}) => {
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn  = () => Animated.spring(scale, { toValue: 0.98, useNativeDriver: true, speed: 40 }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, speed: 20 }).start();

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        style={[fr.row, disabled ? fr.rowDisabled : undefined, !!value ? fr.rowFilled : undefined]}
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        disabled={disabled}
        activeOpacity={1}
      >
        <View style={[fr.stepBubble, !!value ? fr.stepBubbleDone : undefined]}>
          {value
            ? <Ionicons name="checkmark" size={11} color="#fff" />
            : <Text style={[fr.stepNum, disabled ? fr.stepNumDisabled : undefined]}>{step}</Text>}
        </View>

        {colorHex
          ? <View style={[fr.colorPreview, { backgroundColor: colorHex }]} />
          : <Ionicons
              name={icon as any}
              size={18}
              color={disabled ? COLORS.textLight : value ? COLORS.primary : COLORS.textMuted}
              style={{ marginHorizontal: 8 }}
            />}

        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={fr.fieldLabel}>{label}</Text>
            {optional && (
              <View style={fr.optionalTag}>
                <Text style={fr.optionalText}>Заавал биш</Text>
              </View>
            )}
          </View>
          <Text style={[fr.fieldValue, !value ? fr.fieldPlaceholder : undefined]} numberOfLines={1}>
            {value ?? placeholder}
          </Text>
          {sublabel && !value && (
            <Text style={fr.fieldSublabel}>{sublabel}</Text>
          )}
        </View>

        <Ionicons name="chevron-forward" size={16} color={disabled ? COLORS.border : COLORS.textMuted} />
      </TouchableOpacity>
    </Animated.View>
  );
};

// ════════════════════════════════════════════════════════════════
// ОН ЖИЛИЙН ХЭСЭГ — 2 талбар нэгтгэсэн card
// ════════════════════════════════════════════════════════════════
interface YearSectionProps {
  manufactureYear: number;
  importYear?: number;
  disabled: boolean;
  onOpenManufacture: () => void;
  onOpenImport: () => void;
  onClearImport: () => void;
}

const YearSection: React.FC<YearSectionProps> = ({
  manufactureYear, importYear, disabled,
  onOpenManufacture, onOpenImport, onClearImport,
}) => {
  const ageDiff =
    manufactureYear && importYear && importYear > manufactureYear
      ? importYear - manufactureYear
      : null;

  return (
    <View style={ys.wrapper}>
      {/* Гарчиг мөр */}
      <View style={ys.header}>
        <View style={[ys.stepBubble, !!manufactureYear ? ys.stepBubbleDone : undefined]}>
          {manufactureYear
            ? <Ionicons name="checkmark" size={11} color="#fff" />
            : <Text style={ys.stepNum}>3</Text>}
        </View>
        <Ionicons name="calendar-outline" size={18} color={manufactureYear ? COLORS.primary : COLORS.textMuted} style={{ marginHorizontal: 8 }} />
        <View style={{ flex: 1 }}>
          <Text style={ys.sectionLabel}>ОН ЖИЛ</Text>
          <Text style={ys.sectionSub}>Монгол дахь үнэлгээг нарийвчлуулна</Text>
        </View>
      </View>

      {/* 2 товч хэвтээ */}
      <View style={ys.row}>
        {/* Үйлдвэрлэсэн он */}
        <TouchableOpacity
          style={[
            ys.yearBtn,
            !!manufactureYear && ys.yearBtnFilled,
            disabled ? ys.yearBtnDisabled : undefined,
          ]}
          onPress={onOpenManufacture}
          disabled={disabled}
          activeOpacity={0.8}
        >
          <View style={[ys.yearIconWrap, { backgroundColor: manufactureYear ? COLORS.primary + '15' : '#F3F4F6' }]}>
            <Ionicons name="construct-outline" size={15} color={manufactureYear ? COLORS.primary : COLORS.textMuted} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={ys.yearTypeLabel}>Үйлдвэрлэсэн он</Text>
            <Text style={[ys.yearValue, !manufactureYear ? ys.yearPlaceholder : undefined]}>
              {manufactureYear ? `${manufactureYear} он` : 'Сонгоно уу'}
            </Text>
          </View>
          {manufactureYear
            ? <View style={ys.checkDot}><Ionicons name="checkmark" size={11} color="#fff" /></View>
            : <Ionicons name="chevron-forward" size={14} color={COLORS.textLight} />}
        </TouchableOpacity>

        {/* Орж ирсэн он */}
        <TouchableOpacity
          style={[
            ys.yearBtn,
            !!importYear && ys.yearBtnFilledImport,
            (!manufactureYear || disabled) ? ys.yearBtnDisabled : undefined,
          ]}
          onPress={onOpenImport}
          disabled={!manufactureYear || disabled}
          activeOpacity={0.8}
        >
          <View style={[ys.yearIconWrap, { backgroundColor: importYear ? 'rgba(14,159,110,0.08)' : '#F3F4F6' }]}>
            <Ionicons name="boat-outline" size={15} color={importYear ? COLORS.secondary : COLORS.textMuted} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={ys.yearTypeLabel}>Орж ирсэн он</Text>
              <View style={ys.optTag}>
                <Text style={ys.optTagText}>Заавал биш</Text>
              </View>
            </View>
            <Text style={[ys.yearValue, !importYear ? ys.yearPlaceholder : undefined, importYear ? { color: COLORS.secondary } : undefined]}>
              {importYear ? `${importYear} он` : 'Сонгоно уу'}
            </Text>
          </View>
          {importYear ? (
            <TouchableOpacity
              onPress={onClearImport}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={ys.clearBtn}
            >
              <Ionicons name="close-circle" size={16} color={COLORS.textLight} />
            </TouchableOpacity>
          ) : (
            <Ionicons name="chevron-forward" size={14} color={!manufactureYear ? COLORS.border : COLORS.textLight} />
          )}
        </TouchableOpacity>
      </View>

      {/* Хоорондын зай тооцоолол */}
      {ageDiff !== null && (
        <View style={ys.diffBox}>
          <Ionicons name="information-circle-outline" size={13} color={COLORS.primary} />
          <Text style={ys.diffText}>
            Үйлдвэрлэгдсэнээс хойш{' '}
            <Text style={{ fontWeight: '700', color: COLORS.primary }}>{ageDiff} жил</Text>
            -ийн дараа Монголд орж ирсэн
            {ageDiff >= 5 ? ' — насжилтын үнэлгээнд анхааралтай байна уу.' : '.'}
          </Text>
        </View>
      )}

      {/* Зөвлөмж — зөвхөн үйлдвэрлэсэн он сонгосон үед */}
      {manufactureYear && !importYear && (
        <View style={ys.tipBox}>
          <Ionicons name="bulb-outline" size={13} color={COLORS.warning} />
          <Text style={ys.tipText}>
            Орж ирсэн оныг оруулбал Монгол дахь насжилт, элэгдлийн үнэлгээ илүү нарийвчлалтай гарна.
          </Text>
        </View>
      )}
    </View>
  );
};

// ════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════
export const VehicleSelector: React.FC<VehicleSelectorProps> = ({
  value, onChange, disabled = false,
}) => {
  const [brand,           setBrand]           = useState(value?.brand            ?? '');
  const [model,           setModel]           = useState(value?.model            ?? '');
  const [manufactureYear, setManufactureYear] = useState(value?.manufactureYear  ?? 0);
  const [importYear,      setImportYear]      = useState(value?.importYear       ?? 0);
  const [color,           setColor]           = useState(value?.color            ?? '');
  const [colorHex,        setColorHex]        = useState(value?.colorHex         ?? '');

  const [catalog,    setCatalog]    = useState<CatalogCache | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [fetchError, setFetchError] = useState(false);

  const [openPicker, setOpenPicker] = useState<
    'brand' | 'model' | 'manufactureYear' | 'importYear' | 'color' | null
  >(null);

  useEffect(() => { loadCatalog(); }, []);

  const loadCatalog = async () => {
    setFetchError(false);
    try {
      const raw = await AsyncStorage.getItem(CACHE_KEY);
      if (raw) {
        const cached: CatalogCache = JSON.parse(raw);
        if (
          Date.now() - cached.cachedAt < CACHE_TTL &&
          Array.isArray(cached.brands) && cached.brands.length > 0 &&
          Array.isArray(cached.years)  && cached.years.length  > 0
        ) {
          setCatalog(cached);
          setLoading(false);
          return;
        }
      }
    } catch { /* cache алдаа — API-с шинэчилнэ */ }
    await fetchAndCacheCatalog();
  };

  const fetchAndCacheCatalog = async () => {
    try {
      const { data: axiosData } = await apiClient.get('/vehicles/catalog/all');
      const payload = unwrapCatalog(axiosData);

      const newCatalog: CatalogCache = {
        brands:        Array.isArray(payload?.brands)        ? payload.brands        : [],
        modelsByBrand: payload?.modelsByBrand && typeof payload.modelsByBrand === 'object'
                         ? payload.modelsByBrand : {},
        years:         Array.isArray(payload?.years)         ? payload.years         : [],
        colors:        Array.isArray(payload?.colors)        ? payload.colors        : [],
        cachedAt: Date.now(),
      };

      setCatalog(newCatalog);
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(newCatalog));
    } catch (err) {
      console.error('[VehicleSelector] fetch error:', err);
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  };

  // ── Picker items ─────────────────────────────────────────────
  const brandItems = useMemo((): PickerItem[] => {
    if (!catalog || !Array.isArray(catalog.brands)) return [];
    return catalog.brands.map((b) => ({
      id: b.name, label: b.name, sub: b.country,
      badge: b.popularInMongolia ? '🇲🇳 Түгээмэл' : undefined,
    }));
  }, [catalog]);

  const modelItems = useMemo((): PickerItem[] => {
    if (!catalog || !brand) return [];
    const raw = Array.isArray(catalog.modelsByBrand?.[brand])
      ? catalog.modelsByBrand[brand] : [];
    // FIX: Set ашиглан давхардлыг арилгана (Honda-д 'Passport' x2 байсан)
    const seen = new Set<string>();
    return raw
      .filter((m) => { if (seen.has(m)) return false; seen.add(m); return true; })
      .map((m, i) => ({ id: `model-${i}-${m}`, label: m }));
  }, [catalog, brand]);

  /** Үйлдвэрлэсэн он — бүх жил */
  const manufactureYearItems = useMemo((): PickerItem[] => {
    if (!catalog || !Array.isArray(catalog.years)) return [];
    return catalog.years.map((y) => ({ id: String(y), label: `${y} он` }));
  }, [catalog]);

  /** Орж ирсэн он — үйлдвэрлэсэн оноос хойш, одоо хүртэл
   *  id-г "import-YYYY" болгосноор manufactureYearItems-тай key давхцахаас сэргийлнэ */
  const importYearItems = useMemo((): PickerItem[] => {
    if (!catalog || !Array.isArray(catalog.years) || !manufactureYear) return [];
    const currentYear = new Date().getFullYear();
    return catalog.years
      .filter((y) => y >= manufactureYear && y <= currentYear)
      .map((y) => ({
        id: `import-${y}`,          // ← давхцахаас сэргийлэх prefix
        label: `${y} он`,
        sub: y === manufactureYear
          ? 'Үйлдвэрлэсэн жилдээ орж ирсэн'
          : `Үйлдвэрлэгдсэнээс ${y - manufactureYear} жилийн дараа`,
      }));
  }, [catalog, manufactureYear]);

  const colorItems = useMemo((): PickerItem[] => {
    if (!catalog || !Array.isArray(catalog.colors)) return [];
    return catalog.colors.map((c) => ({
      id: c.name, label: c.name, sub: c.nameEn, hex: c.hex, darkText: c.darkText,
    }));
  }, [catalog]);

  // ── Handlers ─────────────────────────────────────────────────
  const handleBrandSelect = useCallback((item: PickerItem) => {
    setBrand(item.id); setModel('');
    setManufactureYear(0); setImportYear(0);
    setColor(''); setColorHex('');
  }, []);

  const handleModelSelect = useCallback((item: PickerItem) => {
    // id нь 'model-{i}-{modelName}' format — label ашиглана
    setModel(item.label);
    setManufactureYear(0); setImportYear(0);
    setColor(''); setColorHex('');
  }, []);

  const handleManufactureYearSelect = useCallback((item: PickerItem) => {
    // id нь plain "YYYY" format
    const y = Number(item.id);
    setManufactureYear(y);
    // Орж ирсэн он үйлдвэрлэсэн оноос өмнө байвал цэвэрлэнэ
    if (importYear && importYear < y) setImportYear(0);
    setColor(''); setColorHex('');
  }, [importYear]);

  const handleImportYearSelect = useCallback((item: PickerItem) => {
    // id нь "import-YYYY" format — prefix хасаж тоо авна
    const y = Number(item.id.replace('import-', ''));
    setImportYear(y);
  }, []);

  const handleColorSelect = useCallback((item: PickerItem) => {
    setColor(item.id);
    setColorHex(item.hex ?? '');
    if (brand && model && manufactureYear) {
      onChange({
        brand, model,
        manufactureYear,
        importYear: importYear || undefined,
        color: item.id,
        colorHex: item.hex ?? '',
      });
    }
  }, [brand, model, manufactureYear, importYear, onChange]);

  // Орж ирсэн оны "x" товч
  const handleClearImportYear = useCallback(() => {
    setImportYear(0);
  }, []);

  // ── Алхам тооцоолол ──────────────────────────────────────────
  // Он алхам: manufactureYear сонгосон бол дууссан гэж үзнэ (importYear заавал биш)
  const yearStepDone  = !!manufactureYear;
  const completedSteps =
    (brand ? 1 : 0) +
    (model ? 1 : 0) +
    (yearStepDone ? 1 : 0) +
    (color ? 1 : 0);

  const currentStep = !brand ? 0 : !model ? 1 : !yearStepDone ? 2 : 3;
  const allDone = !!(brand && model && manufactureYear && color);

  // ── Loading / Error ──────────────────────────────────────────
  if (loading) {
    return (
      <View style={vs.loadingBox}>
        <ActivityIndicator size="small" color={COLORS.primary} />
        <Text style={vs.loadingText}>Каталог ачааллаж байна...</Text>
      </View>
    );
  }

  if (fetchError || !catalog || catalog.brands.length === 0) {
    return (
      <View style={vs.errorBox}>
        <Ionicons name="cloud-offline-outline" size={32} color={COLORS.textLight} />
        <Text style={vs.errorText}>Каталог ачааллахад алдаа гарлаа</Text>
        <TouchableOpacity
          style={vs.retryBtn}
          onPress={() => { setLoading(true); fetchAndCacheCatalog(); }}
        >
          <Ionicons name="refresh" size={15} color="#fff" />
          <Text style={vs.retryBtnText}>Дахин оролдох</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={vs.container}>
      <StepIndicator currentStep={currentStep} completedSteps={completedSteps} />

      <View style={vs.fields}>
        {/* Брэнд */}
        <FieldRow
          step={1} label="БРЭНД" value={brand}
          placeholder="Toyota, Hyundai, BMW..." icon="business-outline"
          onPress={() => !disabled && setOpenPicker('brand')}
          disabled={disabled}
        />

        {/* Загвар */}
        <FieldRow
          step={2} label="ЗАГВАР" value={model}
          placeholder={brand ? 'Загвар сонгоно уу' : 'Эхлээд брэнд сонгоно уу'}
          icon="car-outline"
          onPress={() => !disabled && brand && setOpenPicker('model')}
          disabled={disabled || !brand}
        />

        {/* Он жилийн хэсэг — 2 талбартай card */}
        <YearSection
          manufactureYear={manufactureYear}
          importYear={importYear || undefined}
          disabled={disabled || !model}
          onOpenManufacture={() => !disabled && model && setOpenPicker('manufactureYear')}
          onOpenImport={() => !disabled && !!manufactureYear && setOpenPicker('importYear')}
          onClearImport={handleClearImportYear}
        />

        {/* Өнгө */}
        <FieldRow
          step={4} label="ӨНГӨ" value={color}
          colorHex={colorHex || undefined}
          placeholder={yearStepDone ? 'Өнгө сонгоно уу' : 'Эхлээд он жил сонгоно уу'}
          icon="color-palette-outline"
          onPress={() => !disabled && yearStepDone && setOpenPicker('color')}
          disabled={disabled || !yearStepDone}
        />
      </View>

      {/* Дүгнэлтийн card */}
      {allDone && (
        <View style={vs.summaryCard}>
          <View style={[vs.colorDot, { backgroundColor: colorHex }]} />
          <View style={{ flex: 1 }}>
            <Text style={vs.summaryMain}>{brand} {model}</Text>
            <Text style={vs.summarySub}>
              {manufactureYear} он
              {importYear ? ` → ${importYear} он (орж ирсэн)` : ''}
              {' • '}{color}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              setBrand(''); setModel('');
              setManufactureYear(0); setImportYear(0);
              setColor(''); setColorHex('');
            }}
            style={vs.resetBtn}
          >
            <Ionicons name="refresh" size={14} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>
      )}

      {!allDone && (
        <View style={vs.hint}>
          <Ionicons name="information-circle-outline" size={13} color={COLORS.primary} />
          <Text style={vs.hintText}>
            Машины мэдээллийг нарийвчлан оруулснаар AI шинжилгээний нарийвчлал нэмэгдэнэ.
          </Text>
        </View>
      )}

      {/* Picker modals */}
      <PickerModal
        visible={openPicker === 'brand'} title="Брэнд сонгох"
        items={brandItems} selectedId={brand}
        onSelect={handleBrandSelect} onClose={() => setOpenPicker(null)}
        searchPlaceholder="Toyota, Hyundai, BMW..."
      />
      <PickerModal
        visible={openPicker === 'model'} title={`${brand} — Загвар сонгох`}
        items={modelItems} selectedId={modelItems.find(i => i.label === model)?.id}
        onSelect={handleModelSelect} onClose={() => setOpenPicker(null)}
        searchPlaceholder="Загварын нэр хайх..."
      />
      <PickerModal
        visible={openPicker === 'manufactureYear'} title="Үйлдвэрлэсэн он сонгох"
        items={manufactureYearItems} selectedId={manufactureYear ? String(manufactureYear) : undefined}
        onSelect={handleManufactureYearSelect} onClose={() => setOpenPicker(null)}
        searchPlaceholder="Он хайх..."
      />
      <PickerModal
        visible={openPicker === 'importYear'} title="Монголд орж ирсэн он"
        items={importYearItems} selectedId={importYear ? `import-${importYear}` : undefined}
        onSelect={handleImportYearSelect} onClose={() => setOpenPicker(null)}
        searchPlaceholder="Он хайх..."
      />
      <PickerModal
        visible={openPicker === 'color'} title="Өнгө сонгох"
        items={colorItems} selectedId={color}
        onSelect={handleColorSelect} onClose={() => setOpenPicker(null)}
        colorMode searchPlaceholder="Өнгөний нэр хайх..."
      />
    </View>
  );
};

// ════════════════════════════════════════════════════════════════
// STYLES
// ════════════════════════════════════════════════════════════════

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
  title:            { fontSize: FONT_SIZE.lg, fontWeight: '700', color: '#111928' },
  searchWrap:       {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    margin: SPACING.md, borderRadius: RADIUS.md, borderWidth: 1.5,
    borderColor: '#E5E7EB', paddingHorizontal: SPACING.md, height: 44,
  },
  searchInput:      { flex: 1, fontSize: FONT_SIZE.md, color: '#111928' },
  countLabel:       {
    fontSize: FONT_SIZE.xs, color: '#6B7280',
    paddingHorizontal: SPACING.lg, marginBottom: 4, marginTop: -4,
  },
  item:             { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingVertical: 14, backgroundColor: '#fff' },
  itemSelected:     { backgroundColor: '#EFF6FF' },
  itemLeft:         { flex: 1 },
  itemRight:        { flexDirection: 'row', alignItems: 'center', gap: 6 },
  itemLabel:        { fontSize: FONT_SIZE.md, color: '#111928' },
  itemSub:          { fontSize: FONT_SIZE.xs, color: '#6B7280', marginTop: 2 },
  selectedLabel:    { fontWeight: '700', color: '#1A56DB' },
  popularBadge:     { backgroundColor: '#ECFDF5', borderRadius: RADIUS.full, paddingHorizontal: 6, paddingVertical: 2 },
  popularBadgeText: { fontSize: 10, color: '#065F46', fontWeight: '600' },
  sep:              { height: 1, backgroundColor: '#F8FAFC' },
  colorRow:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingVertical: 12, backgroundColor: '#fff', gap: SPACING.md },
  colorRowSelected: { backgroundColor: '#EFF6FF' },
  colorSwatch:      { width: 36, height: 36, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center' },
  colorLabel:       { flex: 1, fontSize: FONT_SIZE.md, color: '#111928' },
  emptyBox:         { alignItems: 'center', paddingVertical: SPACING.xxl, gap: SPACING.sm },
  emptyText:        { fontSize: FONT_SIZE.sm, color: '#6B7280' },
});

const si = StyleSheet.create({
  wrap:            { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md },
  step:            { alignItems: 'center', gap: 4 },
  line:            { flex: 1, height: 1.5, backgroundColor: '#E5E7EB', marginBottom: 16 },
  lineDone:        { backgroundColor: '#0E9F6E' },
  circle:          { width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: '#D1D5DB', backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  circleDone:      { backgroundColor: '#0E9F6E', borderColor: '#0E9F6E' },
  circleActive:    { borderColor: '#1A56DB', backgroundColor: '#EFF6FF' },
  circleNum:       { fontSize: 11, fontWeight: '700', color: '#9CA3AF' },
  circleNumActive: { color: '#1A56DB' },
  label:           { fontSize: 9, color: '#9CA3AF', fontWeight: '500' },
  labelActive:     { color: '#111928', fontWeight: '700' },
});

const fr = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: RADIUS.md, padding: SPACING.md, borderWidth: 1.5,
    borderColor: '#E5E7EB', gap: 6,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 },
      android: { elevation: 1 },
    }),
  },
  rowDisabled:      { backgroundColor: '#F9FAFB', borderColor: '#F3F4F6', opacity: 0.6 },
  rowFilled:        { borderColor: '#93C5FD', backgroundColor: '#EFF6FF' },
  stepBubble:       { width: 22, height: 22, borderRadius: 11, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  stepBubbleDone:   { backgroundColor: '#0E9F6E' },
  stepNum:          { fontSize: 11, fontWeight: '800', color: '#6B7280' },
  stepNumDisabled:  { color: '#D1D5DB' },
  fieldLabel:       { fontSize: 10, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.3 },
  fieldValue:       { fontSize: FONT_SIZE.sm, fontWeight: '600', color: '#111928', marginTop: 1 },
  fieldPlaceholder: { color: '#9CA3AF', fontWeight: '400' },
  fieldSublabel:    { fontSize: 10, color: '#9CA3AF', marginTop: 1 },
  colorPreview:     { width: 24, height: 24, borderRadius: 6, borderWidth: 1, borderColor: '#E5E7EB', marginHorizontal: 8 },
  optionalTag:      { backgroundColor: '#F3F4F6', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 },
  optionalText:     { fontSize: 9, color: '#9CA3AF', fontWeight: '600' },
});

// ── YearSection styles ────────────────────────────────────────
const ys = StyleSheet.create({
  wrapper: {
    backgroundColor: '#fff', borderRadius: RADIUS.md,
    borderWidth: 1.5, borderColor: '#E5E7EB',
    padding: SPACING.md, gap: SPACING.sm,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 },
      android: { elevation: 1 },
    }),
  },
  header:       { flexDirection: 'row', alignItems: 'center' },
  stepBubble:   { width: 22, height: 22, borderRadius: 11, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  stepBubbleDone: { backgroundColor: '#0E9F6E' },
  stepNum:      { fontSize: 11, fontWeight: '800', color: '#6B7280' },
  sectionLabel: { fontSize: 10, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.3 },
  sectionSub:   { fontSize: 10, color: '#9CA3AF', marginTop: 1 },

  row:          { flexDirection: 'row', gap: 8 },

  yearBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: RADIUS.sm, borderWidth: 1.5, borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB', padding: 10,
  },
  yearBtnFilled:       { borderColor: '#93C5FD', backgroundColor: '#EFF6FF' },
  yearBtnFilledImport: { borderColor: '#6EE7B7', backgroundColor: '#F0FDF4' },
  yearBtnDisabled:     { opacity: 0.5 },

  yearIconWrap: {
    width: 30, height: 30, borderRadius: RADIUS.sm,
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  yearTypeLabel: { fontSize: 10, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.2 },
  yearValue:     { fontSize: FONT_SIZE.sm, fontWeight: '600', color: '#111928', marginTop: 2 },
  yearPlaceholder: { color: '#9CA3AF', fontWeight: '400' },

  checkDot: {
    width: 18, height: 18, borderRadius: 9, backgroundColor: '#0E9F6E',
    justifyContent: 'center', alignItems: 'center',
  },
  clearBtn:     { padding: 2 },
  optTag:       { backgroundColor: '#FFF8EE', borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1 },
  optTagText:   { fontSize: 8, color: '#FF8A00', fontWeight: '700' },

  diffBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 6,
    backgroundColor: '#EFF6FF', borderRadius: RADIUS.sm,
    padding: 8, borderWidth: 0.5, borderColor: '#93C5FD',
  },
  diffText:     { fontSize: FONT_SIZE.xs, color: '#1D4ED8', flex: 1, lineHeight: 17 },

  tipBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 6,
    backgroundColor: '#FFF8EE', borderRadius: RADIUS.sm,
    padding: 8, borderWidth: 0.5, borderColor: '#FCD34D',
  },
  tipText:      { fontSize: FONT_SIZE.xs, color: '#92400E', flex: 1, lineHeight: 17 },
});

const vs = StyleSheet.create({
  container:    { gap: SPACING.sm },
  loadingBox:   { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, padding: SPACING.md },
  loadingText:  { fontSize: FONT_SIZE.sm, color: '#6B7280' },
  errorBox:     { alignItems: 'center', padding: SPACING.xl, gap: SPACING.sm },
  errorText:    { fontSize: FONT_SIZE.sm, color: COLORS.textMuted, textAlign: 'center' },
  retryBtn:     { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingHorizontal: 16, paddingVertical: 10 },
  retryBtnText: { color: '#fff', fontWeight: '700', fontSize: FONT_SIZE.sm },
  fields:       { gap: 8 },

  summaryCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#ECFDF5',
    borderRadius: RADIUS.md, padding: SPACING.md,
    borderWidth: 1, borderColor: '#6EE7B7', gap: SPACING.sm,
  },
  colorDot:     { width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, borderColor: '#E5E7EB' },
  summaryMain:  { fontSize: FONT_SIZE.md, fontWeight: '700', color: '#111928' },
  summarySub:   { fontSize: FONT_SIZE.xs, color: '#6B7280', marginTop: 2 },
  resetBtn:     { padding: 4 },

  hint: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 6,
    backgroundColor: '#EFF6FF', borderRadius: RADIUS.sm, padding: SPACING.sm,
    borderWidth: 0.5, borderColor: '#93C5FD',
  },
  hintText: { fontSize: FONT_SIZE.xs, color: '#1D4ED8', flex: 1, lineHeight: 18 },
});
