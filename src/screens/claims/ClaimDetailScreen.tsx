import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  TouchableOpacity,
  Platform,
  Image,
  FlatList,
  Modal,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, SPACING, RADIUS, FONT_SIZE, STATUS_COLORS } from '../../constants';
import { getClaimById } from '../../services/claimsService';
import { uploadClaimImage, getClaimImages, UploadedImage } from '../../services/imagesService';
import type { Claim, ClaimsStackParamList } from '../../types';

type Props = {
  navigation: NativeStackNavigationProp<ClaimsStackParamList, 'ClaimDetail'>;
  route: RouteProp<ClaimsStackParamList, 'ClaimDetail'>;
};

const { width: SCREEN_W } = Dimensions.get('window');
const IMAGE_SIZE = (SCREEN_W - SPACING.lg * 2 - SPACING.sm * 2) / 3;

// ── Labels ────────────────────────────────────────────────────
const STATUS_LABELS: Record<string, string> = {
  draft: 'Ноорог',
  submitted: 'Илгээсэн',
  under_review: 'Хянагдаж байна',
  ai_processing: 'AI боловсруулж байна',
  pending_inspection: 'Шалгалт хүлээж байна',
  approved: 'Зөвшөөрсөн',
  partially_approved: 'Хэсэгчлэн зөвшөөрсөн',
  rejected: 'Татгалзсан',
  closed: 'Хаагдсан',
};

const TYPE_LABELS: Record<string, string> = {
  collision: 'Мөргөлдөөн',
  rear_end: 'Ар талаас',
  side_impact: 'Хажуугийн цохилт',
  rollover: 'Эргэлт',
  hit_and_run: 'Зугтсан',
  weather: 'Цаг агаар',
  vandalism: 'Эвдрэл/Хулгай',
  theft: 'Хулгай',
  fire: 'Түймэр',
  flood: 'Үер',
  other: 'Бусад',
};

const SEVERITY_LABELS: Record<string, string> = {
  minor: 'Бага',
  moderate: 'Дунд',
  severe: 'Хүнд',
  total_loss: 'Бүрэн гэмтэл',
};

const SEVERITY_COLORS: Record<string, string> = {
  minor: COLORS.secondary,
  moderate: COLORS.warning,
  severe: COLORS.danger,
  total_loss: '#7C3AED',
};

// ── Sub-components ────────────────────────────────────────────
const SectionTitle = ({ icon, title }: { icon: string; title: string }) => (
  <View style={styles.sectionHeader}>
    <Ionicons name={icon as any} size={16} color={COLORS.primary} />
    <Text style={styles.sectionTitle}>{title}</Text>
  </View>
);

const InfoRow = ({ label, value, mono }: { label: string; value: string; mono?: boolean }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={[styles.infoValue, mono && styles.monoValue]}>{value}</Text>
  </View>
);

const StatusBadge = ({ status }: { status: string }) => {
  const colors = STATUS_COLORS[status] ?? { bg: '#F3F4F6', text: '#374151' };
  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <View style={[styles.badgeDot, { backgroundColor: colors.text }]} />
      <Text style={[styles.badgeText, { color: colors.text }]}>
        {STATUS_LABELS[status] ?? status}
      </Text>
    </View>
  );
};

// ── Image Preview Modal ───────────────────────────────────────
const ImagePreviewModal = ({
  uri,
  visible,
  onClose,
}: {
  uri: string | null;
  visible: boolean;
  onClose: () => void;
}) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <View style={styles.previewOverlay}>
      <TouchableOpacity style={styles.previewClose} onPress={onClose} activeOpacity={0.8}>
        <Ionicons name="close-circle" size={36} color={COLORS.white} />
      </TouchableOpacity>
      {uri && (
        <Image
          source={{ uri }}
          style={styles.previewImage}
          resizeMode="contain"
        />
      )}
    </View>
  </Modal>
);

// ── Main Screen ───────────────────────────────────────────────
export const ClaimDetailScreen = ({ navigation, route }: Props) => {
  const { claimId } = route.params;

  const [claim, setClaim] = useState<Claim | null>(null);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Preview modal
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [previewVisible, setPreviewVisible] = useState(false);

  // ── Data fetching ─────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      const [claimData, imagesData] = await Promise.allSettled([
        getClaimById(claimId),
        getClaimImages(claimId),
      ]);

      if (claimData.status === 'fulfilled') setClaim(claimData.value);
      if (imagesData.status === 'fulfilled') setImages(imagesData.value);
    } catch {
      Alert.alert('Алдаа', 'Мэдэгдлийн мэдээлэл ачааллахад алдаа гарлаа', [
        { text: 'Буцах', onPress: () => navigation.goBack() },
      ]);
    } finally {
      setLoading(false);
    }
  }, [claimId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Permission helper ─────────────────────────────────────────
  const requestCameraPermission = async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Зөвшөөрөл шаардлагатай',
        'Камер ашиглахын тулд зөвшөөрөл өгнө үү. Тохиргоо руу очно уу.',
        [{ text: 'OK' }],
      );
      return false;
    }
    return true;
  };

  const requestMediaPermission = async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Зөвшөөрөл шаардлагатай',
        'Галерей ашиглахын тулд зөвшөөрөл өгнө үү.',
        [{ text: 'OK' }],
      );
      return false;
    }
    return true;
  };

  // ── Upload logic ──────────────────────────────────────────────
  const handleUpload = async (uri: string) => {
    if (!claim) return;
    setUploading(true);
    try {
      // Файлын нэрийг timestamp-аар үүсгэнэ
      const fileName = `claim_${claim.claimNumber}_${Date.now()}.jpg`;
      const uploaded = await uploadClaimImage(claimId, uri, fileName);
      setImages((prev) => [uploaded, ...prev]);
      Alert.alert('Амжилттай', 'Зураг амжилттай upload хийгдлээ ✅');
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Зураг upload хийхэд алдаа гарлаа';
      Alert.alert('Upload алдаа', Array.isArray(msg) ? msg.join('\n') : msg);
    } finally {
      setUploading(false);
    }
  };

  // ── Camera ────────────────────────────────────────────────────
  const handleTakePhoto = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,           // compression
      aspect: [4, 3],
      exif: false,
    });

    if (!result.canceled && result.assets[0]) {
      await handleUpload(result.assets[0].uri);
    }
  };

  // ── Gallery ───────────────────────────────────────────────────
  const handlePickFromGallery = async () => {
    const hasPermission = await requestMediaPermission();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
      aspect: [4, 3],
      exif: false,
    });

    if (!result.canceled && result.assets[0]) {
      await handleUpload(result.assets[0].uri);
    }
  };

  // ── Photo action sheet ────────────────────────────────────────
  const handleAddPhoto = () => {
    Alert.alert(
      'Зураг нэмэх',
      'Зургийг хаанаас нэмэх вэ?',
      [
        { text: 'Камераар авах 📷', onPress: handleTakePhoto },
        { text: 'Галлерейгаас сонгох 🖼️', onPress: handlePickFromGallery },
        { text: 'Болих', style: 'cancel' },
      ],
    );
  };

  // ── Loading ───────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Ачааллаж байна...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!claim) return null;

  const accidentDate = new Date(claim.accidentDate).toLocaleDateString('mn-MN', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  const createdDate = new Date(claim.createdAt).toLocaleDateString('mn-MN', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  // ── Render ────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {claim.claimNumber}
          </Text>
          <Text style={styles.headerSub}>Мэдэгдлийн дэлгэрэнгүй</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero Card ────────────────────────────────────── */}
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={styles.heroIcon}>
              <Ionicons name="document-text" size={28} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroClaimNumber}>{claim.claimNumber}</Text>
              <Text style={styles.heroDate}>Үүссэн: {createdDate}</Text>
            </View>
          </View>
          <View style={styles.heroBottom}>
            <StatusBadge status={claim.status} />
            {claim.severity && (
              <View
                style={[
                  styles.severityBadge,
                  { backgroundColor: (SEVERITY_COLORS[claim.severity] ?? COLORS.warning) + '18' },
                ]}
              >
                <Text
                  style={[
                    styles.severityText,
                    { color: SEVERITY_COLORS[claim.severity] ?? COLORS.warning },
                  ]}
                >
                  {SEVERITY_LABELS[claim.severity] ?? claim.severity}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Photos Section ───────────────────────────────── */}
        <View style={styles.card}>
          <View style={styles.photoSectionHeader}>
            <SectionTitle icon="images-outline" title="Зургууд" />
            <TouchableOpacity
              style={[styles.addPhotoBtn, uploading && styles.addPhotoBtnDisabled]}
              onPress={handleAddPhoto}
              disabled={uploading}
              activeOpacity={0.8}
            >
              {uploading ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <>
                  <Ionicons name="camera" size={14} color={COLORS.white} />
                  <Text style={styles.addPhotoBtnText}>Зураг нэмэх</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Upload progress indicator */}
          {uploading && (
            <View style={styles.uploadingBar}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.uploadingText}>Upload хийж байна...</Text>
            </View>
          )}

          {/* Images grid */}
          {images.length > 0 ? (
            <View style={styles.imagesGrid}>
              {images.map((img) => (
                <TouchableOpacity
                  key={img.id}
                  style={styles.imageThumbnail}
                  onPress={() => {
                    setPreviewUri(img.fileUrl);
                    setPreviewVisible(true);
                  }}
                  activeOpacity={0.85}
                >
                  <Image
                    source={{ uri: img.fileUrl }}
                    style={styles.thumbnailImg}
                    resizeMode="cover"
                  />
                  {/* Status overlay */}
                  {img.status === 'analyzed' && (
                    <View style={styles.analyzedBadge}>
                      <Ionicons name="checkmark-circle" size={14} color={COLORS.white} />
                    </View>
                  )}
                  {img.status === 'processing' && (
                    <View style={[styles.analyzedBadge, { backgroundColor: COLORS.warning }]}>
                      <ActivityIndicator size="small" color={COLORS.white} />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
              {/* Add more button in grid */}
              <TouchableOpacity
                style={styles.addMoreBtn}
                onPress={handleAddPhoto}
                disabled={uploading}
                activeOpacity={0.75}
              >
                <Ionicons name="add" size={28} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          ) : (
            /* Empty state */
            <View style={styles.photoEmpty}>
              <View style={styles.photoEmptyIcon}>
                <Ionicons name="camera-outline" size={32} color={COLORS.textLight} />
              </View>
              <Text style={styles.photoEmptyTitle}>Зураг байхгүй байна</Text>
              <Text style={styles.photoEmptySubtitle}>
                Ослын зургийг нэмж, AI үнэлгээ авна уу
              </Text>
              <View style={styles.photoButtons}>
                <TouchableOpacity
                  style={styles.cameraBtn}
                  onPress={handleTakePhoto}
                  disabled={uploading}
                  activeOpacity={0.85}
                >
                  <Ionicons name="camera-outline" size={18} color={COLORS.white} />
                  <Text style={styles.cameraBtnText}>Камераар авах</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.galleryBtn}
                  onPress={handlePickFromGallery}
                  disabled={uploading}
                  activeOpacity={0.85}
                >
                  <Ionicons name="images-outline" size={18} color={COLORS.primary} />
                  <Text style={styles.galleryBtnText}>Галлерей</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Image count */}
          {images.length > 0 && (
            <Text style={styles.imageCount}>{images.length} зураг нэмэгдсэн</Text>
          )}
        </View>

        {/* ── Ослын мэдээлэл ───────────────────────────────── */}
        <View style={styles.card}>
          <SectionTitle icon="warning-outline" title="Ослын мэдээлэл" />
          <InfoRow label="Ослын төрөл" value={TYPE_LABELS[claim.accidentType] ?? claim.accidentType} />
          <InfoRow label="Ослын огноо" value={accidentDate} />
          <InfoRow label="Байршил" value={claim.accidentLocation} />
          {claim.latitude && claim.longitude && (
            <InfoRow
              label="GPS"
              value={`${claim.latitude.toFixed(6)}, ${claim.longitude.toFixed(6)}`}
              mono
            />
          )}
        </View>

        {/* ── Тайлбар ──────────────────────────────────────── */}
        <View style={styles.card}>
          <SectionTitle icon="reader-outline" title="Тайлбар" />
          <Text style={styles.description}>{claim.description}</Text>
        </View>

        {/* ── Машины мэдээлэл ──────────────────────────────── */}
        {claim.vehicle && (
          <View style={styles.card}>
            <SectionTitle icon="car-outline" title="Тээвэр хэрэгсэл" />
            <View style={styles.vehicleBox}>
              <View style={styles.vehicleIcon}>
                <Ionicons name="car-sport" size={24} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.vehicleName}>
                  {claim.vehicle.make} {claim.vehicle.model}
                </Text>
                <Text style={styles.vehicleSub}>
                  {claim.vehicle.year} он • {claim.vehicle.color}
                </Text>
                <View style={styles.plateBox}>
                  <Text style={styles.plateText}>{claim.vehicle.licensePlate}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ── Гуравдагч тал ────────────────────────────────── */}
        {claim.thirdPartyInvolved && (
          <View style={styles.card}>
            <SectionTitle icon="people-outline" title="Гуравдагч тал" />
            {claim.thirdPartyName && <InfoRow label="Нэр" value={claim.thirdPartyName} />}
            {claim.thirdPartyLicensePlate && <InfoRow label="Улсын дугаар" value={claim.thirdPartyLicensePlate} />}
            {claim.thirdPartyInsurance && <InfoRow label="Даатгал" value={claim.thirdPartyInsurance} />}
            {claim.thirdPartyPolicyNumber && <InfoRow label="Гэрээний №" value={claim.thirdPartyPolicyNumber} mono />}
          </View>
        )}

        {/* ── Цагдаагийн тайлан ────────────────────────────── */}
        <View style={styles.card}>
          <SectionTitle icon="shield-outline" title="Цагдаагийн тайлан" />
          <View style={styles.boolRow}>
            <Ionicons
              name={claim.policeReportFiled ? 'checkmark-circle' : 'close-circle'}
              size={20}
              color={claim.policeReportFiled ? COLORS.secondary : COLORS.textLight}
            />
            <Text
              style={[
                styles.boolText,
                { color: claim.policeReportFiled ? COLORS.secondary : COLORS.textMuted },
              ]}
            >
              {claim.policeReportFiled
                ? 'Цагдаагийн тайлан бичигдсэн'
                : 'Цагдаагийн тайлан бичигдээгүй'}
            </Text>
          </View>
          {claim.policeReportNumber && (
            <InfoRow label="Тайлангийн №" value={claim.policeReportNumber} mono />
          )}
        </View>

        {/* ── Санхүүгийн мэдээлэл ──────────────────────────── */}
        {claim.estimatedRepairCost != null && (
          <View style={[styles.card, styles.financialCard]}>
            <SectionTitle icon="cash-outline" title="Санхүүгийн үнэлгээ" />
            <View style={styles.costBox}>
              <Text style={styles.costLabel}>Тооцоолсон засварын зардал</Text>
              <Text style={styles.costValue}>
                ₮{Number(claim.estimatedRepairCost).toLocaleString()}
              </Text>
            </View>
          </View>
        )}

        <View style={{ height: SPACING.xl }} />
      </ScrollView>

      {/* Image preview modal */}
      <ImagePreviewModal
        uri={previewUri}
        visible={previewVisible}
        onClose={() => {
          setPreviewVisible(false);
          setPreviewUri(null);
        }}
      />
    </SafeAreaView>
  );
};

// ── Styles ────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: SPACING.sm },
  loadingText: { fontSize: FONT_SIZE.sm, color: COLORS.textMuted },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg, paddingBottom: SPACING.md,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: RADIUS.md,
    backgroundColor: COLORS.background, justifyContent: 'center',
    alignItems: 'center', borderWidth: 1, borderColor: COLORS.border,
  },
  headerTitle: { fontSize: FONT_SIZE.lg, fontWeight: '700', color: COLORS.text },
  headerSub: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted },

  content: { padding: SPACING.lg, gap: SPACING.md },

  // Hero card
  heroCard: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg,
    padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.md },
  heroIcon: {
    width: 52, height: 52, borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary + '12',
    justifyContent: 'center', alignItems: 'center',
  },
  heroClaimNumber: { fontSize: FONT_SIZE.xl, fontWeight: '800', color: COLORS.text },
  heroDate: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, marginTop: 2 },
  heroBottom: { flexDirection: 'row', gap: SPACING.sm, flexWrap: 'wrap' },

  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: RADIUS.full, paddingHorizontal: 12, paddingVertical: 5,
  },
  badgeDot: { width: 7, height: 7, borderRadius: 4 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  severityBadge: { borderRadius: RADIUS.full, paddingHorizontal: 12, paddingVertical: 5 },
  severityText: { fontSize: 12, fontWeight: '700' },

  // Card
  card: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg,
    padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border,
    gap: SPACING.sm,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  financialCard: { borderColor: COLORS.secondary + '40' },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  sectionTitle: { fontSize: FONT_SIZE.sm, fontWeight: '700', color: COLORS.text },

  // Info row
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: COLORS.background,
  },
  infoLabel: { fontSize: FONT_SIZE.sm, color: COLORS.textMuted, flex: 1 },
  infoValue: { fontSize: FONT_SIZE.sm, color: COLORS.text, fontWeight: '500', flex: 2, textAlign: 'right' },
  monoValue: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  description: { fontSize: FONT_SIZE.sm, color: COLORS.text, lineHeight: 22, paddingTop: 4 },

  // Vehicle
  vehicleBox: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    backgroundColor: COLORS.background, borderRadius: RADIUS.md, padding: SPACING.md,
  },
  vehicleIcon: {
    width: 48, height: 48, borderRadius: RADIUS.sm,
    backgroundColor: COLORS.primary + '12', justifyContent: 'center', alignItems: 'center',
  },
  vehicleName: { fontSize: FONT_SIZE.md, fontWeight: '700', color: COLORS.text },
  vehicleSub: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, marginTop: 2 },
  plateBox: {
    marginTop: 6, backgroundColor: COLORS.surface, borderRadius: RADIUS.sm,
    paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start',
    borderWidth: 1, borderColor: COLORS.border,
  },
  plateText: { fontSize: FONT_SIZE.sm, fontWeight: '700', color: COLORS.text, letterSpacing: 1 },

  boolRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  boolText: { fontSize: FONT_SIZE.sm, fontWeight: '500' },

  costBox: { backgroundColor: COLORS.background, borderRadius: RADIUS.md, padding: SPACING.md, alignItems: 'center' },
  costLabel: { fontSize: FONT_SIZE.sm, color: COLORS.textMuted },
  costValue: { fontSize: FONT_SIZE.xxl, fontWeight: '800', color: COLORS.secondary, marginTop: 4 },

  // ── Photos section ────────────────────────────────────────────
  photoSectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  addPhotoBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: COLORS.primary, borderRadius: RADIUS.sm,
    paddingHorizontal: 12, paddingVertical: 7,
  },
  addPhotoBtnDisabled: { opacity: 0.6 },
  addPhotoBtnText: { color: COLORS.white, fontSize: FONT_SIZE.xs, fontWeight: '700' },

  uploadingBar: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: COLORS.primary + '10', borderRadius: RADIUS.sm,
    padding: SPACING.sm,
  },
  uploadingText: { fontSize: FONT_SIZE.sm, color: COLORS.primary, fontWeight: '500' },

  // Images grid
  imagesGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm,
  },
  imageThumbnail: {
    width: IMAGE_SIZE, height: IMAGE_SIZE,
    borderRadius: RADIUS.sm, overflow: 'hidden',
    backgroundColor: COLORS.border,
  },
  thumbnailImg: { width: '100%', height: '100%' },
  analyzedBadge: {
    position: 'absolute', top: 4, right: 4,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center', alignItems: 'center',
  },
  addMoreBtn: {
    width: IMAGE_SIZE, height: IMAGE_SIZE,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.primary + '10',
    borderWidth: 2, borderColor: COLORS.primary + '40',
    borderStyle: 'dashed',
    justifyContent: 'center', alignItems: 'center',
  },
  imageCount: {
    fontSize: FONT_SIZE.xs, color: COLORS.textMuted,
    textAlign: 'right', marginTop: 4,
  },

  // Photo empty state
  photoEmpty: {
    alignItems: 'center', paddingVertical: SPACING.lg, gap: SPACING.sm,
  },
  photoEmptyIcon: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border,
    justifyContent: 'center', alignItems: 'center',
  },
  photoEmptyTitle: { fontSize: FONT_SIZE.sm, fontWeight: '700', color: COLORS.textMuted },
  photoEmptySubtitle: {
    fontSize: FONT_SIZE.xs, color: COLORS.textLight,
    textAlign: 'center', lineHeight: 18,
  },
  photoButtons: { flexDirection: 'row', gap: SPACING.sm, marginTop: 4 },
  cameraBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.primary, borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.md, paddingVertical: 10,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25, shadowRadius: 6, elevation: 3,
  },
  cameraBtnText: { color: COLORS.white, fontWeight: '700', fontSize: FONT_SIZE.sm },
  galleryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: RADIUS.sm, paddingHorizontal: SPACING.md, paddingVertical: 10,
    borderWidth: 1.5, borderColor: COLORS.primary,
    backgroundColor: COLORS.surface,
  },
  galleryBtnText: { color: COLORS.primary, fontWeight: '700', fontSize: FONT_SIZE.sm },

  // Preview modal
  previewOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center', alignItems: 'center',
  },
  previewClose: {
    position: 'absolute', top: 50, right: 20, zIndex: 10,
  },
  previewImage: {
    width: SCREEN_W, height: SCREEN_W * 0.85,
  },
});