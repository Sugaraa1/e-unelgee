import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT_SIZE } from '../constants';
import apiClient from '../services/apiClient';

interface Props {
  claimId: string;
  estimatedRepairCost: number;
  status: string;
  onStatusChange: () => void;
}

export const AIAssessmentCard = ({
  claimId,
  estimatedRepairCost,
  status,
  onStatusChange,
}: Props) => {
  const [approving, setApproving] = useState(false);
  const [disputeModal, setDisputeModal] = useState(false);
  const [reason, setReason] = useState('');
  const [disputing, setDisputing] = useState(false);
  const [reasonError, setReasonError] = useState('');

  const approveScale = useRef(new Animated.Value(1)).current;
  const disputeScale = useRef(new Animated.Value(1)).current;

  const pressIn = (anim: Animated.Value) =>
    Animated.spring(anim, { toValue: 0.96, useNativeDriver: true, speed: 40 }).start();
  const pressOut = (anim: Animated.Value) =>
    Animated.spring(anim, { toValue: 1, useNativeDriver: true, speed: 20 }).start();

  const canAct = status === 'draft' || status === 'submitted';
  if (!canAct || !estimatedRepairCost) return null;

  const handleApprove = () => {
    Alert.alert(
      'AI үнэлгээг зөвшөөрөх үү?',
      `Засварын зардал: ₮${Number(estimatedRepairCost).toLocaleString()}\n\nЭнэ дүнг зөвшөөрч claim-г баталгаажуулах уу?`,
      [
        { text: 'Болих', style: 'cancel' },
        {
          text: 'Зөвшөөрөх',
          onPress: async () => {
            setApproving(true);
            try {
              await apiClient.patch(`/claims/${claimId}/self-approve`);
              Alert.alert(
                '✅ Амжилттай',
                'Таны claim амжилттай баталгаажлаа.',
                [{ text: 'OK', onPress: onStatusChange }],
              );
            } catch (err: any) {
              const msg =
                err?.response?.data?.message ?? 'Алдаа гарлаа. Дахин оролдоно уу.';
              Alert.alert('Алдаа', Array.isArray(msg) ? msg.join('\n') : msg);
            } finally {
              setApproving(false);
            }
          },
        },
      ],
    );
  };

  const handleDisputeSubmit = async () => {
    if (reason.trim().length < 5) {
      setReasonError('Дор хаяж 5 тэмдэгтээр тайлбарлана уу');
      return;
    }
    setDisputing(true);
    try {
      await apiClient.patch(`/claims/${claimId}/dispute`, {
        reason: reason.trim(),
      });
      setDisputeModal(false);
      setReason('');
      setReasonError('');
      Alert.alert(
        '📋 Хүсэлт илгээгдлээ',
        'Таны санал нийлэхгүй байгаа тухай мэдэгдэл бүртгэгдлээ. Мэргэжилтэн шалгаж холбоо барина.',
        [{ text: 'OK', onPress: onStatusChange }],
      );
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ?? 'Алдаа гарлаа. Дахин оролдоно уу.';
      Alert.alert('Алдаа', Array.isArray(msg) ? msg.join('\n') : msg);
    } finally {
      setDisputing(false);
    }
  };

  return (
    <>
      <View style={s.card}>
        {/* Гарчиг */}
        <View style={s.cardHeader}>
          <View style={s.iconWrap}>
            <Ionicons name="sparkles" size={18} color="#7C3AED" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.cardTitle}>AI Үнэлгээ</Text>
            <Text style={s.cardSub}>Зөвшөөрөх эсвэл маргалдах</Text>
          </View>
          <View style={s.aiBadge}>
            <Text style={s.aiBadgeText}>AI</Text>
          </View>
        </View>

        {/* Дүн */}
        <View style={s.amountBox}>
          <Text style={s.amountLabel}>Тооцоолсон засварын зардал</Text>
          <Text style={s.amountValue}>
            ₮{Number(estimatedRepairCost).toLocaleString()}
          </Text>
          <Text style={s.amountNote}>
            Gemini AI-ийн зургийн шинжилгээнд үндэслэн тооцоолсон
          </Text>
        </View>

        <View style={s.divider} />

        <Text style={s.actionTitle}>Энэ үнэлгээтэй санал нийлж байна уу?</Text>

        <View style={s.btnRow}>
          {/* Зөвшөөрөх */}
          <Animated.View style={[{ flex: 1 }, { transform: [{ scale: approveScale }] }]}>
            <TouchableOpacity
              style={[s.approveBtn, approving && s.btnDisabled]}
              onPress={handleApprove}
              onPressIn={() => pressIn(approveScale)}
              onPressOut={() => pressOut(approveScale)}
              disabled={approving}
              activeOpacity={1}
            >
              {approving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={18} color="#fff" />
                  <Text style={s.approveBtnText}>Зөвшөөрөх</Text>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* Санал нийлэхгүй */}
          <Animated.View style={[{ flex: 1 }, { transform: [{ scale: disputeScale }] }]}>
            <TouchableOpacity
              style={s.disputeBtn}
              onPress={() => setDisputeModal(true)}
              onPressIn={() => pressIn(disputeScale)}
              onPressOut={() => pressOut(disputeScale)}
              activeOpacity={1}
            >
              <Ionicons name="close-circle-outline" size={18} color={COLORS.danger} />
              <Text style={s.disputeBtnText}>Санал нийлэхгүй</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>

        <View style={s.infoBox}>
          <Ionicons name="information-circle-outline" size={13} color={COLORS.textLight} />
          <Text style={s.infoText}>
            Зөвшөөрвөл claim баталгаажна. Санал нийлэхгүй бол мэргэжилтэн шалгана.
          </Text>
        </View>
      </View>

      {/* Санал нийлэхгүй Modal */}
      <Modal
        visible={disputeModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setDisputeModal(false);
          setReason('');
          setReasonError('');
        }}
      >
        <View style={s.modalSafe}>
          <View style={s.modalHeader}>
            <TouchableOpacity
              style={s.modalCloseBtn}
              onPress={() => {
                setDisputeModal(false);
                setReason('');
                setReasonError('');
              }}
            >
              <Ionicons name="close" size={22} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={s.modalTitle}>Санал нийлэхгүй байх</Text>
            <View style={{ width: 36 }} />
          </View>

          <View style={s.modalBody}>
            <View style={s.currentAmountBox}>
              <Text style={s.currentAmountLabel}>AI тооцоолсон дүн</Text>
              <Text style={s.currentAmountValue}>
                ₮{Number(estimatedRepairCost).toLocaleString()}
              </Text>
            </View>

            <View style={s.fieldGroup}>
              <Text style={s.fieldLabel}>Санал нийлэхгүй шалтгаан *</Text>
              <Text style={s.fieldHint}>
                Яагаад энэ үнэлгээтэй санал нийлэхгүй байгаагаа тайлбарлана уу
              </Text>
              <TextInput
                style={[s.textArea, reasonError ? s.textAreaError : null]}
                placeholder="Жишээ: Засварын бодит зардал хамаагүй өндөр байна. Хаалганы хугарал оруулагдаагүй..."
                placeholderTextColor={COLORS.textLight}
                value={reason}
                onChangeText={(t) => {
                  setReason(t);
                  if (t.trim().length >= 5) setReasonError('');
                }}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
                autoCapitalize="none"
              />
              {reasonError ? (
                <Text style={s.errorText}>{reasonError}</Text>
              ) : (
                <Text style={s.charCount}>{reason.length} тэмдэгт</Text>
              )}
            </View>

            <View style={s.warningBox}>
              <Ionicons name="warning-outline" size={15} color={COLORS.warning} />
              <Text style={s.warningText}>
                Хүсэлт илгээсний дараа мэргэжилтэн таны claim-г дахин шалгаж
                3-5 ажлын өдрийн дотор холбоо барина.
              </Text>
            </View>

            <TouchableOpacity
              style={[s.submitBtn, disputing && s.btnDisabled]}
              onPress={handleDisputeSubmit}
              disabled={disputing}
              activeOpacity={0.85}
            >
              {disputing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="send-outline" size={18} color="#fff" />
                  <Text style={s.submitBtnText}>Хүсэлт илгээх</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const s = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: '#7C3AED30',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#7C3AED',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
      },
      android: { elevation: 4 },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    backgroundColor: '#7C3AED08',
    borderBottomWidth: 1,
    borderBottomColor: '#7C3AED15',
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    backgroundColor: '#7C3AED15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: COLORS.text,
  },
  cardSub: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  aiBadge: {
    backgroundColor: '#7C3AED',
    borderRadius: RADIUS.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  aiBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 1,
  },
  amountBox: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
    gap: 4,
  },
  amountLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  amountValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#7C3AED',
    letterSpacing: -0.5,
  },
  amountNote: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.md,
  },
  actionTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
    marginTop: SPACING.md,
    marginHorizontal: SPACING.md,
  },
  btnRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    padding: SPACING.md,
    paddingTop: SPACING.sm,
  },
  approveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.secondary,
    borderRadius: RADIUS.md,
    paddingVertical: 13,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.secondary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
    }),
  },
  approveBtnText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    color: '#fff',
  },
  disputeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.danger + '10',
    borderRadius: RADIUS.md,
    paddingVertical: 13,
    borderWidth: 1.5,
    borderColor: COLORS.danger + '40',
  },
  disputeBtnText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    color: COLORS.danger,
  },
  btnDisabled: { opacity: 0.6 },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 5,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
  },
  infoText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textLight,
    flex: 1,
    lineHeight: 17,
  },
  modalSafe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
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
  modalTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  modalBody: {
    flex: 1,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  currentAmountBox: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  currentAmountLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
  },
  currentAmountValue: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '800',
    color: '#7C3AED',
  },
  fieldGroup: { gap: 6 },
  fieldLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    color: COLORS.text,
  },
  fieldHint: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    lineHeight: 17,
  },
  textArea: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    padding: SPACING.md,
    fontSize: FONT_SIZE.sm,
    color: COLORS.text,
    minHeight: 130,
  },
  textAreaError: {
    borderColor: COLORS.danger,
  },
  errorText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.danger,
  },
  charCount: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textLight,
    textAlign: 'right',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: COLORS.warning + '10',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.warning + '30',
  },
  warningText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.text,
    flex: 1,
    lineHeight: 18,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.danger,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    marginTop: SPACING.sm,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.danger,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
    }),
  },
  submitBtnText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: '#fff',
  },
});