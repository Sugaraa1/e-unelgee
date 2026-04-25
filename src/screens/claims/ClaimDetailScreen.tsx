// src/screens/claims/ClaimDetailScreen.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
  Alert, SafeAreaView, TouchableOpacity, Platform, Image,
  Modal, Dimensions, Animated, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';

import { COLORS, SPACING, RADIUS, FONT_SIZE, STATUS_COLORS } from '../../constants';
import { getClaimById } from '../../services/claimsService';
import { uploadClaimImage, getImageUrl, UploadedImage } from '../../services/imagesService';
import { usePollingImages } from '../../hooks/usePollingImages';
import { StatusBadge } from '../../components/StatusBadge';
import type { Claim, ClaimsStackParamList } from '../../types';
import { retryImageAnalysis } from '../../services/imagesService';

type Props = {
  navigation: NativeStackNavigationProp<ClaimsStackParamList, 'ClaimDetail'>;
  route:      RouteProp<ClaimsStackParamList, 'ClaimDetail'>;
};

const { width: SCREEN_W } = Dimensions.get('window');
const IMG_SIZE = (SCREEN_W - SPACING.lg * 2 - SPACING.sm * 2) / 3;

// ── Label maps ────────────────────────────────────────────────
const STATUS_LABELS: Record<string, string> = {
  draft: 'Ноорог', submitted: 'Илгээсэн', under_review: 'Хянагдаж байна',
  ai_processing: 'AI боловсруулж байна', pending_inspection: 'Шалгалт хүлээж байна',
  approved: 'Зөвшөөрсөн', partially_approved: 'Хэсэгчлэн зөвшөөрсөн',
  rejected: 'Татгалзсан', closed: 'Хаагдсан',
};
const TYPE_LABELS: Record<string, string> = {
  collision: 'Мөргөлдөөн', rear_end: 'Ар талаас', side_impact: 'Хажуугийн цохилт',
  rollover: 'Эргэлт', hit_and_run: 'Зугтсан', weather: 'Цаг агаар',
  vandalism: 'Эвдрэл/Хулгай', theft: 'Хулгай', fire: 'Түймэр', flood: 'Үер', other: 'Бусад',
};
const SEV_COLORS: Record<string, string> = {
  minor: COLORS.secondary, moderate: COLORS.warning, severe: COLORS.danger, total_loss: '#7C3AED',
};
const SEV_LABELS: Record<string, string> = {
  minor: 'Бага', moderate: 'Дунд', severe: 'Хүнд', total_loss: 'Бүрэн гэмтэл', none: 'Гэмтэлгүй',
};
const DAMAGE_MN: Record<string, string> = {
  scratch: 'Үрчлэх', dent: 'Зан', crack: 'Хагарал',
  broken: 'Хугарал', paint_damage: 'Будаг эвдрэл', glass_damage: 'Шил эвдрэл',
};

// ════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ════════════════════════════════════════════════════════════════

const Skeleton = ({ width, height, radius = 8, style }: any) => {
  const anim = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(anim, { toValue: 1,   duration: 800, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [anim]);
  return <Animated.View style={[{ width, height, borderRadius: radius, backgroundColor: COLORS.border, opacity: anim }, style]} />;
};

const ClaimStatusBadge = ({ status }: { status: string }) => {
  const c = STATUS_COLORS[status] ?? { bg: '#F3F4F6', text: '#374151' };
  return (
    <View style={[cs.badge, { backgroundColor: c.bg }]}>
      <View style={[cs.dot, { backgroundColor: c.text }]} />
      <Text style={[cs.badgeText, { color: c.text }]}>{STATUS_LABELS[status] ?? status}</Text>
    </View>
  );
};

const InfoRow = ({ label, value, mono }: { label: string; value: string; mono?: boolean }) => (
  <View style={cs.infoRow}>
    <Text style={cs.infoLabel}>{label}</Text>
    <Text style={[cs.infoValue, mono && cs.mono]}>{value}</Text>
  </View>
);

const SectionTitle = ({ icon, title }: { icon: string; title: string }) => (
  <View style={cs.sectionHeader}>
    <Ionicons name={icon as any} size={15} color={COLORS.primary} />
    <Text style={cs.sectionTitle}>{title}</Text>
  </View>
);

const AIProcessingBanner = ({ count }: { count: number }) => {
  const slide = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(slide, { toValue: 1, duration: 1200, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 1200, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [slide]);
  const tx = slide.interpolate({ inputRange: [0, 1], outputRange: [-SCREEN_W, SCREEN_W] });
  return (
    <View style={cs.aiBanner}>
      <Animated.View style={[cs.aiBannerShimmer, { transform: [{ translateX: tx }] }]} />
      <View style={cs.aiBannerContent}>
        <ActivityIndicator size="small" color={COLORS.white} style={{ marginRight: 8 }} />
        <Text style={cs.aiBannerText}>AI үнэлгээ хийж байна... ({count} зураг)</Text>
      </View>
    </View>
  );
};

// ── AI Result Modal ───────────────────────────────────────────
const AIResultModal = ({
  image, visible, onClose, onRetry,
}: {
  image: UploadedImage | null; visible: boolean;
  onClose: () => void; onRetry: (id: string) => void;
}) => {
  if (!image) return null;
  const result     = image.aiAnalysisResult || {};
  const isFailed   = image.status === 'failed';
  const isAnalyzed = image.status === 'analyzed';

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={cs.modalSafe}>
        <View style={cs.modalHeader}>
          <View style={{ flex: 1 }}>
            <Text style={cs.modalTitle}>
              {isFailed ? '❌ Шинжилгээ амжилтгүй' : isAnalyzed ? '🤖 AI Шинжилгээний дүн' : '⏳ Боловсруулж байна'}
            </Text>
            <Text style={cs.modalSub} numberOfLines={1}>{image.originalName}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={cs.modalCloseBtn}>
            <Ionicons name="close" size={20} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={cs.modalContent} showsVerticalScrollIndicator={false}>
          <Image source={{ uri: getImageUrl(image.fileUrl) }} style={cs.modalThumb} resizeMode="cover" />

          {/* Failed */}
          {isFailed && (
            <View style={cs.failedBox}>
              <Ionicons name="warning-outline" size={32} color={COLORS.danger} />
              <Text style={cs.failedTitle}>AI шинжилгээ амжилтгүй боллоо</Text>
              <Text style={cs.failedDesc}>{image.aiErrorMessage || 'Сервертэй холбогдоход алдаа гарлаа.'}</Text>
              <TouchableOpacity style={cs.retryBtn} onPress={() => { onClose(); onRetry(image.id); }}>
                <Ionicons name="refresh" size={16} color={COLORS.white} />
                <Text style={cs.retryBtnText}>Дахин оролдох</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Processing */}
          {(image.status === 'processing' || image.status === 'pending') && (
            <View style={cs.processingBox}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={cs.processingText}>AI шинжилгээ явж байна...</Text>
              <Text style={cs.processingSubText}>Та хэдэн секунд хүлээнэ үү</Text>
            </View>
          )}

          {/* Analyzed */}
          {isAnalyzed && result && (
            <>
              {/* Summary */}
              <View style={cs.summaryCard}>
                <View style={cs.summaryRow}>
                  <View style={{ flex: 1, gap: 6 }}>
                    <Text style={cs.summaryLabel}>Нийт ноцтой байдал</Text>
                    <View style={[cs.sevChip, { backgroundColor: (SEV_COLORS[result.overallSeverity ?? ''] ?? '#999') + '20' }]}>
                      <Text style={[cs.sevChipText, { color: SEV_COLORS[result.overallSeverity ?? ''] ?? '#999' }]}>
                        {SEV_LABELS[result.overallSeverity ?? ''] ?? result.overallSeverity}
                      </Text>
                    </View>
                  </View>
                  <View style={{ flex: 1, gap: 6, alignItems: 'flex-end' }}>
                    <Text style={cs.summaryLabel}>AI итгэл</Text>
                    <View style={[cs.confBar, { width: '100%' }]}>
                      <View style={[cs.confFill, {
                        width: `${Math.round((result.overallConfidence ?? 0) * 100)}%`,
                        backgroundColor: (result.overallConfidence ?? 0) >= 0.7 ? COLORS.secondary : COLORS.warning,
                      }]} />
                    </View>
                    <Text style={cs.confText}>{Math.round((result.overallConfidence ?? 0) * 100)}%</Text>
                  </View>
                </View>
              </View>

              {/* Parts */}
              {Array.isArray(result.damagedParts) && result.damagedParts.length > 0 && (
                <View style={{ gap: SPACING.sm }}>
                  <Text style={cs.partsSectionTitle}>🔍 Илэрсэн гэмтэл ({result.damagedParts.length} хэсэг)</Text>
                  {result.damagedParts.map((part: any, i: number) => (
                    <View key={i} style={cs.partCard}>
                      <View style={cs.partHeader}>
                        <Text style={cs.partName}>{part.partName}</Text>
                        <View style={[cs.sevTag, { backgroundColor: (SEV_COLORS[part.severity] ?? '#999') + '15' }]}>
                          <Text style={[cs.sevTagText, { color: SEV_COLORS[part.severity] ?? '#999' }]}>
                            {SEV_LABELS[part.severity] ?? part.severity}
                          </Text>
                        </View>
                      </View>
                      <Text style={cs.partType}>{DAMAGE_MN[part.damageType] ?? part.damageType}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                        <Text style={cs.partConfLabel}>Итгэл:</Text>
                        <View style={[cs.confBar, { flex: 1, marginHorizontal: 8 }]}>
                          <View style={[cs.confFill, {
                            width: `${Math.round((part.confidence ?? 0) * 100)}%`,
                            backgroundColor: COLORS.primary,
                          }]} />
                        </View>
                        <Text style={cs.partConfValue}>{Math.round((part.confidence ?? 0) * 100)}%</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Recommendations */}
              {Array.isArray(result.recommendations) && result.recommendations.length > 0 && (
                <View style={cs.recommendBox}>
                  <Text style={cs.recommendTitle}>💡 Зөвлөмж</Text>
                  {result.recommendations.map((r: string, i: number) => (
                    <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                      <Ionicons name="checkmark-circle-outline" size={13} color={COLORS.secondary} style={{ marginRight: 5, marginTop: 2 }} />
                      <Text style={cs.recommendText}>{r}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Analysis details */}
              {!!result.analysisDetails && (
                <View style={cs.detailBox}>
                  <Text style={cs.detailTitle}>📋 Дэлгэрэнгүй</Text>
                  <Text style={cs.detailText}>{result.analysisDetails}</Text>
                </View>
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

// ════════════════════════════════════════════════════════════════
// MAIN SCREEN
// ════════════════════════════════════════════════════════════════
export const ClaimDetailScreen = ({ navigation, route }: Props) => {
  const { claimId } = route.params;

  const [claim, setClaim]             = useState<Claim | null>(null);
  const [claimLoading, setClaimLoading] = useState(true);
  const [uploading, setUploading]     = useState(false);
  const [refreshing, setRefreshing]   = useState(false);
  const [selectedImage, setSelectedImage] = useState<UploadedImage | null>(null);
  const [aiModalVisible, setAiModalVisible] = useState(false);

  const { images, isPolling, isLoading: imagesLoading, allAnalyzed, refresh, setImages } =
    usePollingImages(claimId);

  const fetchClaim = useCallback(async () => {
    try {
      const data = await getClaimById(claimId);
      setClaim(data);
    } catch {
      Alert.alert('Алдаа', 'Claim ачааллахад алдаа гарлаа', [
        { text: 'Буцах', onPress: () => navigation.goBack() },
      ]);
    } finally {
      setClaimLoading(false);
    }
  }, [claimId]);

  useEffect(() => { fetchClaim(); }, [fetchClaim]);

  // AI дуусмагц claim-ийн зардлыг refresh хийнэ
  useEffect(() => {
    if (allAnalyzed) fetchClaim();
  }, [allAnalyzed]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchClaim(), refresh()]);
    setRefreshing(false);
  }, [fetchClaim, refresh]);

  // ── Upload ──────────────────────────────────────────────────
  const handleUpload = async (uri: string) => {
    if (!claim) return;
    setUploading(true);
    try {
      const fileName = `claim_${claim.claimNumber}_${Date.now()}.jpg`;
      const uploaded = await uploadClaimImage(claimId, uri, fileName);
      setImages((prev) => [uploaded, ...prev]);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Upload алдаа';
      Alert.alert('Алдаа', Array.isArray(msg) ? msg.join('\n') : msg);
    } finally {
      setUploading(false);
    }
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Камер зөвшөөрөл шаардлагатай'); return; }
    const r = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 0.7, aspect: [4, 3], exif: false,
    });
    if (!r.canceled && r.assets[0]) await handleUpload(r.assets[0].uri);
  };

  const handlePickGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Галерей зөвшөөрөл шаардлагатай'); return; }
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 0.7, aspect: [4, 3], exif: false,
    });
    if (!r.canceled && r.assets[0]) await handleUpload(r.assets[0].uri);
  };

  const handleAddPhoto = () => Alert.alert('Зураг нэмэх', '', [
    { text: '📷 Камераар авах',   onPress: handleTakePhoto },
    { text: '🖼️ Галлерейгаас',    onPress: handlePickGallery },
    { text: 'Болих', style: 'cancel' },
  ]);

  const handleRetry = async (id: string) => {
  try {
    await retryImageAnalysis(id);
    await refresh();
    Alert.alert('Амжилттай', 'AI шинжилгээ дахин эхэллээ');
  } catch (err: any) {
    const msg = err?.response?.data?.message ?? 'Retry амжилтгүй болсон';
    Alert.alert('Алдаа', Array.isArray(msg) ? msg.join('\n') : msg);
  }
};
  const processingCount = images.filter((i) => i.status === 'pending' || i.status === 'processing').length;
  const analyzedCount   = images.filter((i) => i.status === 'analyzed').length;
  const progressPct     = images.length > 0 ? Math.round((analyzedCount / images.length) * 100) : 0;

  // ── Loading ─────────────────────────────────────────────────
  if (claimLoading) {
    return (
      <SafeAreaView style={cs.safe}>
        <View style={cs.loadingBox}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={cs.loadingText}>Ачааллаж байна...</Text>
        </View>
      </SafeAreaView>
    );
  }
  if (!claim) return null;

  const accidentDate = new Date(claim.accidentDate).toLocaleDateString('mn-MN', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
  const createdDate = new Date(claim.createdAt).toLocaleDateString('mn-MN', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  return (
    <SafeAreaView style={cs.safe}>
      {/* Header */}
      <View style={cs.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={cs.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={cs.headerTitle} numberOfLines={1}>{claim.claimNumber}</Text>
          <Text style={cs.headerSub}>Мэдэгдлийн дэлгэрэнгүй</Text>
        </View>
      </View>

      {/* AI Banner */}
      {isPolling && processingCount > 0 && <AIProcessingBanner count={processingCount} />}

      <ScrollView
        contentContainerStyle={cs.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} tintColor={COLORS.primary} />
        }
      >
        {/* Hero */}
        <View style={cs.heroCard}>
          <View style={cs.heroTop}>
            <View style={cs.heroIcon}>
              <Ionicons name="document-text" size={26} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={cs.heroNumber}>{claim.claimNumber}</Text>
              <Text style={cs.heroDate}>Үүссэн: {createdDate}</Text>
            </View>
          </View>
          <View style={cs.heroBottom}>
            <ClaimStatusBadge status={claim.status} />
            {claim.severity && (
              <View style={[cs.sevPill, { backgroundColor: (SEV_COLORS[claim.severity] ?? '#999') + '18' }]}>
                <Text style={[cs.sevPillText, { color: SEV_COLORS[claim.severity] ?? '#999' }]}>
                  {SEV_LABELS[claim.severity]}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Cost card */}
        {claimLoading ? (
          <Skeleton width="100%" height={80} radius={RADIUS.lg} />
        ) : claim.estimatedRepairCost != null ? (
          <View style={cs.costCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
              <Ionicons name="cash-outline" size={18} color={COLORS.secondary} />
              <Text style={cs.costLabel}>AI тооцоолсон засварын зардал</Text>
            </View>
            <Text style={cs.costValue}>₮{Number(claim.estimatedRepairCost).toLocaleString()}</Text>
          </View>
        ) : isPolling ? (
          <View style={cs.costPending}>
            <ActivityIndicator size="small" color={COLORS.primary} style={{ marginRight: 8 }} />
            <Text style={cs.costPendingText}>Зардлыг тооцоолж байна...</Text>
          </View>
        ) : null}

        {/* Photos */}
        <View style={cs.card}>
          <View style={cs.photoHeader}>
            <SectionTitle icon="images-outline" title={`Зургууд (${images.length})`} />
            <TouchableOpacity
              style={[cs.addPhotoBtn, uploading && { opacity: 0.6 }]}
              onPress={handleAddPhoto} disabled={uploading} activeOpacity={0.8}
            >
              {uploading
                ? <ActivityIndicator size="small" color={COLORS.white} />
                : <><Ionicons name="camera" size={13} color={COLORS.white} /><Text style={cs.addPhotoBtnText}>Нэмэх</Text></>}
            </TouchableOpacity>
          </View>

          {/* Progress */}
          {images.length > 0 && (
            <View style={{ gap: 4 }}>
              <View style={cs.progressBg}>
                <View style={[cs.progressFill, { width: `${progressPct}%` }]} />
              </View>
              <Text style={cs.progressText}>{analyzedCount}/{images.length} боловсруулагдсан</Text>
            </View>
          )}

          {/* Upload indicator */}
          {uploading && (
            <View style={cs.uploadRow}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={cs.uploadText}>Upload хийж байна...</Text>
            </View>
          )}

          {/* Grid */}
          {imagesLoading ? (
            <View style={cs.grid}>
              {[1, 2, 3].map((i) => <Skeleton key={i} width={IMG_SIZE} height={IMG_SIZE} radius={RADIUS.sm} />)}
            </View>
          ) : images.length > 0 ? (
            <View style={cs.grid}>
              {images.map((img) => (
                <TouchableOpacity
                  key={img.id} style={cs.imgThumb}
                  onPress={() => { setSelectedImage(img); setAiModalVisible(true); }}
                  activeOpacity={0.85}
                >
                  <Image source={{ uri: getImageUrl(img.fileUrl) }} style={cs.imgThumbImg} resizeMode="cover" />
                  <View style={cs.imgBadge}>
                    <StatusBadge status={img.status as any} size="sm" />
                  </View>
                  {(img.status === 'pending' || img.status === 'processing') && (
                    <View style={cs.imgDim}>
                      <ActivityIndicator size="small" color={COLORS.white} />
                    </View>
                  )}
                  {img.status === 'failed' && (
                    <View style={[cs.imgDim, { backgroundColor: 'rgba(220,38,38,0.45)' }]}>
                      <Ionicons name="refresh" size={18} color={COLORS.white} />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={cs.addMoreTile} onPress={handleAddPhoto} disabled={uploading} activeOpacity={0.75}>
                <Ionicons name="add" size={26} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={cs.photoEmpty}>
              <View style={cs.photoEmptyIcon}>
                <Ionicons name="camera-outline" size={28} color={COLORS.textLight} />
              </View>
              <Text style={cs.photoEmptyTitle}>Зураг байхгүй</Text>
              <Text style={cs.photoEmptySub}>Ослын зургийг нэмж AI үнэлгээ авна уу</Text>
              <View style={{ flexDirection: 'row', gap: SPACING.sm, marginTop: 4 }}>
                <TouchableOpacity style={cs.cameraBtn} onPress={handleTakePhoto} activeOpacity={0.85}>
                  <Ionicons name="camera-outline" size={15} color={COLORS.white} />
                  <Text style={cs.cameraBtnText}>Камер</Text>
                </TouchableOpacity>
                <TouchableOpacity style={cs.galleryBtn} onPress={handlePickGallery} activeOpacity={0.85}>
                  <Ionicons name="images-outline" size={15} color={COLORS.primary} />
                  <Text style={cs.galleryBtnText}>Галлерей</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Accident info */}
        <View style={cs.card}>
          <SectionTitle icon="warning-outline" title="Ослын мэдээлэл" />
          <InfoRow label="Ослын төрөл" value={TYPE_LABELS[claim.accidentType] ?? claim.accidentType} />
          <InfoRow label="Ослын огноо" value={accidentDate} />
          <InfoRow label="Байршил"     value={claim.accidentLocation} />
          {claim.latitude && claim.longitude && (
            <InfoRow label="GPS" value={`${Number(claim.latitude).toFixed(6)}, ${Number(claim.longitude).toFixed(6)}`} mono />
          )}
        </View>

        {/* Description */}
        <View style={cs.card}>
          <SectionTitle icon="reader-outline" title="Тайлбар" />
          <Text style={cs.description}>{claim.description}</Text>
        </View>

        {/* Vehicle */}
        {claim.vehicle && (
          <View style={cs.card}>
            <SectionTitle icon="car-outline" title="Тээвэр хэрэгсэл" />
            <View style={cs.vehicleBox}>
              <View style={cs.vehicleIcon}>
                <Ionicons name="car-sport" size={22} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={cs.vehicleName}>{claim.vehicle.make} {claim.vehicle.model}</Text>
                <Text style={cs.vehicleSub}>{claim.vehicle.year} он • {claim.vehicle.color}</Text>
                <View style={cs.plateBox}>
                  <Text style={cs.plateText}>{claim.vehicle.licensePlate}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Third party */}
        {claim.thirdPartyInvolved && (
          <View style={cs.card}>
            <SectionTitle icon="people-outline" title="Гуравдагч тал" />
            {claim.thirdPartyName          && <InfoRow label="Нэр"          value={claim.thirdPartyName} />}
            {claim.thirdPartyLicensePlate  && <InfoRow label="Улсын дугаар" value={claim.thirdPartyLicensePlate} />}
            {claim.thirdPartyInsurance     && <InfoRow label="Даатгал"      value={claim.thirdPartyInsurance} />}
          </View>
        )}

        {/* Police */}
        <View style={cs.card}>
          <SectionTitle icon="shield-outline" title="Цагдаагийн тайлан" />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
            <Ionicons
              name={claim.policeReportFiled ? 'checkmark-circle' : 'close-circle'}
              size={18}
              color={claim.policeReportFiled ? COLORS.secondary : COLORS.textLight}
            />
            <Text style={[cs.boolText, { color: claim.policeReportFiled ? COLORS.secondary : COLORS.textMuted }]}>
              {claim.policeReportFiled ? 'Цагдаагийн тайлан бичигдсэн' : 'Тайлан бичигдээгүй'}
            </Text>
          </View>
          {claim.policeReportNumber && <InfoRow label="Тайлангийн №" value={claim.policeReportNumber} mono />}
        </View>

        <View style={{ height: SPACING.xl }} />
      </ScrollView>

      {/* AI Modal */}
      <AIResultModal
        image={selectedImage}
        visible={aiModalVisible}
        onClose={() => { setAiModalVisible(false); setSelectedImage(null); }}
        onRetry={handleRetry}
      />
    </SafeAreaView>
  );
};

// ════════════════════════════════════════════════════════════════
// STYLES
// ════════════════════════════════════════════════════════════════
const cs = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: COLORS.background },
  loadingBox:  { flex: 1, justifyContent: 'center', alignItems: 'center', gap: SPACING.sm },
  loadingText: { fontSize: FONT_SIZE.sm, color: COLORS.textMuted },

  header:      {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg, paddingBottom: SPACING.md,
    borderBottomWidth: 1, borderBottomColor: COLORS.border, backgroundColor: COLORS.surface,
  },
  backBtn:     {
    width: 40, height: 40, borderRadius: RADIUS.md, backgroundColor: COLORS.background,
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border,
  },
  headerTitle: { fontSize: FONT_SIZE.lg, fontWeight: '700', color: COLORS.text },
  headerSub:   { fontSize: FONT_SIZE.xs, color: COLORS.textMuted },

  aiBanner:        {
    backgroundColor: COLORS.primary, paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg, overflow: 'hidden',
  },
  aiBannerShimmer: {
    position: 'absolute', top: 0, bottom: 0, width: 80,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  aiBannerContent: { flexDirection: 'row', alignItems: 'center' },
  aiBannerText:    { color: COLORS.white, fontWeight: '600', fontSize: FONT_SIZE.sm },

  content: { padding: SPACING.lg, gap: SPACING.md },

  heroCard:  {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.lg,
    borderWidth: 1, borderColor: COLORS.border,
  },
  heroTop:   { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.sm },
  heroIcon:  {
    width: 48, height: 48, borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary + '12', justifyContent: 'center', alignItems: 'center',
  },
  heroNumber: { fontSize: FONT_SIZE.xl, fontWeight: '800', color: COLORS.text },
  heroDate:   { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, marginTop: 2 },
  heroBottom: { flexDirection: 'row', gap: SPACING.sm, flexWrap: 'wrap' },

  badge:     { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 4 },
  dot:       { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 11, fontWeight: '700' },

  sevPill:     { borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 4 },
  sevPillText: { fontSize: 11, fontWeight: '700' },

  costCard: {
    backgroundColor: COLORS.secondary + '10', borderRadius: RADIUS.lg, padding: SPACING.md,
    borderWidth: 1.5, borderColor: COLORS.secondary + '40',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  costLabel:   { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, flex: 1 },
  costValue:   { fontSize: FONT_SIZE.xl, fontWeight: '800', color: COLORS.secondary },
  costPending: {
    backgroundColor: COLORS.primary + '08', borderRadius: RADIUS.lg, padding: SPACING.md,
    borderWidth: 1, borderColor: COLORS.border, flexDirection: 'row', alignItems: 'center',
  },
  costPendingText: { fontSize: FONT_SIZE.sm, color: COLORS.textMuted },

  card:         {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.md,
    borderWidth: 1, borderColor: COLORS.border, gap: SPACING.sm,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  sectionTitle:  { fontSize: FONT_SIZE.sm, fontWeight: '700', color: COLORS.text },

  photoHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  addPhotoBtn:   {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.primary, borderRadius: RADIUS.sm, paddingHorizontal: 10, paddingVertical: 6,
  },
  addPhotoBtnText: { color: COLORS.white, fontSize: FONT_SIZE.xs, fontWeight: '700' },

  progressBg:   { height: 5, backgroundColor: COLORS.border, borderRadius: RADIUS.full, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COLORS.secondary, borderRadius: RADIUS.full },
  progressText: { fontSize: 10, color: COLORS.textMuted, textAlign: 'right' },

  uploadRow:  {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: COLORS.primary + '10', borderRadius: RADIUS.sm, padding: SPACING.sm,
  },
  uploadText: { fontSize: FONT_SIZE.sm, color: COLORS.primary, fontWeight: '500' },

  grid:       { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  imgThumb:   { width: IMG_SIZE, height: IMG_SIZE, borderRadius: RADIUS.sm, overflow: 'hidden', backgroundColor: COLORS.border },
  imgThumbImg: { width: '100%', height: '100%' },
  imgBadge:   { position: 'absolute', bottom: 4, left: 4 },
  imgDim:     {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center',
  },
  addMoreTile: {
    width: IMG_SIZE, height: IMG_SIZE, borderRadius: RADIUS.sm,
    backgroundColor: COLORS.primary + '0C', borderWidth: 1.5,
    borderColor: COLORS.primary + '40', borderStyle: 'dashed',
    justifyContent: 'center', alignItems: 'center',
  },

  photoEmpty:     { alignItems: 'center', paddingVertical: SPACING.lg, gap: SPACING.sm },
  photoEmptyIcon: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.background,
    borderWidth: 1, borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center',
  },
  photoEmptyTitle: { fontSize: FONT_SIZE.sm, fontWeight: '700', color: COLORS.textMuted },
  photoEmptySub:   { fontSize: FONT_SIZE.xs, color: COLORS.textLight, textAlign: 'center', lineHeight: 18 },
  cameraBtn:  {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: COLORS.primary, borderRadius: RADIUS.sm, paddingHorizontal: 14, paddingVertical: 9,
  },
  cameraBtnText: { color: COLORS.white, fontWeight: '700', fontSize: FONT_SIZE.xs },
  galleryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: RADIUS.sm, paddingHorizontal: 14, paddingVertical: 9,
    borderWidth: 1.5, borderColor: COLORS.primary, backgroundColor: COLORS.surface,
  },
  galleryBtnText: { color: COLORS.primary, fontWeight: '700', fontSize: FONT_SIZE.xs },

  infoRow:   {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: COLORS.background,
  },
  infoLabel: { fontSize: FONT_SIZE.sm, color: COLORS.textMuted, flex: 1 },
  infoValue: { fontSize: FONT_SIZE.sm, color: COLORS.text, fontWeight: '500', flex: 2, textAlign: 'right' },
  mono:      { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  description: { fontSize: FONT_SIZE.sm, color: COLORS.text, lineHeight: 22, paddingTop: 2 },

  vehicleBox:  {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    backgroundColor: COLORS.background, borderRadius: RADIUS.md, padding: SPACING.md,
  },
  vehicleIcon: {
    width: 44, height: 44, borderRadius: RADIUS.sm,
    backgroundColor: COLORS.primary + '12', justifyContent: 'center', alignItems: 'center',
  },
  vehicleName: { fontSize: FONT_SIZE.md, fontWeight: '700', color: COLORS.text },
  vehicleSub:  { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, marginTop: 2 },
  plateBox:    {
    marginTop: 5, backgroundColor: COLORS.surface, borderRadius: RADIUS.sm,
    paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start',
    borderWidth: 1, borderColor: COLORS.border,
  },
  plateText:   { fontSize: FONT_SIZE.xs, fontWeight: '700', color: COLORS.text, letterSpacing: 1 },
  boolText:    { fontSize: FONT_SIZE.sm, fontWeight: '500' },

  // Modal
  modalSafe:    { flex: 1, backgroundColor: COLORS.surface },
  modalHeader:  {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  modalTitle:   { fontSize: FONT_SIZE.lg, fontWeight: '700', color: COLORS.text },
  modalSub:     { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, marginTop: 2 },
  modalCloseBtn: {
    width: 34, height: 34, borderRadius: RADIUS.sm,
    backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  modalContent: { padding: SPACING.lg, gap: SPACING.md, paddingBottom: SPACING.xxl },
  modalThumb:   { width: '100%', height: 200, borderRadius: RADIUS.md, backgroundColor: COLORS.border },

  failedBox:   { alignItems: 'center', padding: SPACING.xl, gap: SPACING.sm, backgroundColor: '#FEF2F2', borderRadius: RADIUS.lg },
  failedTitle: { fontSize: FONT_SIZE.md, fontWeight: '700', color: COLORS.danger },
  failedDesc:  { fontSize: FONT_SIZE.sm, color: COLORS.textMuted, textAlign: 'center', lineHeight: 20 },
  retryBtn:    {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: COLORS.danger, borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg, paddingVertical: 10, marginTop: 4,
  },
  retryBtnText: { color: COLORS.white, fontWeight: '700', fontSize: FONT_SIZE.sm },

  processingBox:     { alignItems: 'center', padding: SPACING.xl, gap: SPACING.sm },
  processingText:    { fontSize: FONT_SIZE.md, fontWeight: '700', color: COLORS.text },
  processingSubText: { fontSize: FONT_SIZE.sm, color: COLORS.textMuted },

  summaryCard:  { backgroundColor: COLORS.background, borderRadius: RADIUS.lg, padding: SPACING.md },
  summaryRow:   { flexDirection: 'row', gap: SPACING.md },
  summaryLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, fontWeight: '600' },

  sevChip:     { borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
  sevChipText: { fontSize: FONT_SIZE.xs, fontWeight: '700' },

  confBar:  { height: 6, backgroundColor: COLORS.border, borderRadius: RADIUS.full, overflow: 'hidden' },
  confFill: { height: '100%', borderRadius: RADIUS.full },
  confText: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted },

  partsSectionTitle: { fontSize: FONT_SIZE.sm, fontWeight: '700', color: COLORS.text },
  partCard:          {
    backgroundColor: COLORS.background, borderRadius: RADIUS.md, padding: SPACING.md,
    gap: 6, borderWidth: 1, borderColor: COLORS.border,
  },
  partHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  partName:     { fontSize: FONT_SIZE.sm, fontWeight: '700', color: COLORS.text, flex: 1 },
  sevTag:       { borderRadius: RADIUS.full, paddingHorizontal: 8, paddingVertical: 2 },
  sevTagText:   { fontSize: 10, fontWeight: '700' },
  partType:     { fontSize: FONT_SIZE.xs, color: COLORS.textMuted },
  partConfLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, width: 36 },
  partConfValue: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, width: 30, textAlign: 'right' },

  recommendBox:   { backgroundColor: COLORS.secondary + '08', borderRadius: RADIUS.lg, padding: SPACING.md, gap: 7 },
  recommendTitle: { fontSize: FONT_SIZE.sm, fontWeight: '700', color: COLORS.text },
  recommendText:  { fontSize: FONT_SIZE.xs, color: COLORS.text, flex: 1, lineHeight: 18 },

  detailBox:   { backgroundColor: COLORS.background, borderRadius: RADIUS.md, padding: SPACING.md, gap: 5 },
  detailTitle: { fontSize: FONT_SIZE.sm, fontWeight: '700', color: COLORS.text },
  detailText:  { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, lineHeight: 18 },
});