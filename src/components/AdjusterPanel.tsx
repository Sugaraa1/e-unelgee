// src/components/AdjusterPanel.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT_SIZE } from '../constants';

export interface AdjusterPanelProps {
  claimId: string;
  aiDecision: 'auto_approve' | 'needs_review' | 'total_loss' | null;
  suggestedPayout: number | null;
  riskLevel: 'low' | 'medium' | 'high' | null;
  onApprove: () => Promise<void>;
  onReject: (reason: string) => Promise<void>;
  onAdjust: (newPayout: number, reason: string) => Promise<void>;
  requiresManualReview: boolean;
}

export const AdjusterPanel = ({
  claimId,
  aiDecision,
  suggestedPayout,
  riskLevel,
  onApprove,
  onReject,
  onAdjust,
  requiresManualReview,
}: AdjusterPanelProps) => {
  const [approveLoading, setApproveLoading] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);
  const [adjustModal, setAdjustModal] = useState(false);
  const [adjustPayout, setAdjustPayout] = useState(
    suggestedPayout?.toString() || '',
  );
  const [adjustReason, setAdjustReason] = useState('');
  const [adjusting, setAdjusting] = useState(false);

  const handleApprove = async () => {
    Alert.alert(
      'Зөвшөөрөх эсэхийг баталгаажуулна уу',
      `Claim ${claimId}-г зөвшөөрөхгөөр хүсэж байна?`,
      [
        { text: 'Болих', style: 'cancel' },
        {
          text: 'Зөвшөөрөх',
          style: 'destructive',
          onPress: async () => {
            setApproveLoading(true);
            try {
              await onApprove();
              Alert.alert('Амжилттай', 'Claim зөвшөөрөгдлөө');
            } catch (err: any) {
              Alert.alert('Алдаа', err.message);
            } finally {
              setApproveLoading(false);
            }
          },
        },
      ],
    );
  };

  const handleReject = () => {
    Alert.prompt(
      'Татгалзсан шалтгаан',
      'Яагаад татгалзахаа тайлбарлана уу',
      [
        { text: 'Болих', style: 'cancel' },
        {
          text: 'Татгалзах',
          style: 'destructive',
          onPress: async (reason: string | undefined) => {
            if (!reason || reason.trim().length === 0) {
              Alert.alert('Алдаа', 'Шалтгаан оруулна уу');
              return;
            }
            setRejectLoading(true);
            try {
              await onReject(reason);
              Alert.alert('Амжилттай', 'Claim татгалзагдлаа');
            } catch (err: any) {
              Alert.alert('Алдаа', err.message);
            } finally {
              setRejectLoading(false);
            }
          },
        },
      ],
    );
  };

  const handleAdjust = async () => {
    const payout = parseFloat(adjustPayout);

    if (!payout || payout <= 0) {
      Alert.alert('Алдаа', 'Төлбөрийн дүн 0-ээс их байх ёстой');
      return;
    }

    if (!adjustReason || adjustReason.trim().length === 0) {
      Alert.alert('Алдаа', 'Өөрчлөлтийн шалтгаан оруулна уу');
      return;
    }

    setAdjusting(true);
    try {
      await onAdjust(payout, adjustReason);
      Alert.alert('Амжилттай', 'Төлбөрийн дүн шинэчлэгдлөө');
      setAdjustModal(false);
      setAdjustPayout('');
      setAdjustReason('');
    } catch (err: any) {
      Alert.alert('Алдаа', err.message);
    } finally {
      setAdjusting(false);
    }
  };

  const getRiskColor = (risk: string | null) => {
    switch (risk) {
      case 'low':
        return COLORS.secondary;
      case 'medium':
        return COLORS.warning;
      case 'high':
        return COLORS.danger;
      default:
        return COLORS.textMuted;
    }
  };

  const getRiskLabel = (risk: string | null) => {
    switch (risk) {
      case 'low':
        return 'Сул';
      case 'medium':
        return 'Дунд';
      case 'high':
        return 'Өндөр';
      default:
        return 'Үл мэдэгдэх';
    }
  };

  const getDecisionLabel = (decision: string | null) => {
    switch (decision) {
      case 'auto_approve':
        return '✓ Автоматаар зөвшөөрөх';
      case 'needs_review':
        return '! Шалгалт шаардлагатай';
      case 'total_loss':
        return '✕ Бүрэн гэмтэл';
      default:
        return 'Үнэлгээгүй';
    }
  };

  return (
    <>
      {/* AI Decision Panel */}
      <View style={cs.panel}>
        <View style={cs.panelHeader}>
          <Ionicons name="analytics-outline" size={18} color={COLORS.primary} />
          <Text style={cs.panelTitle}>AI Шийдвэр</Text>
        </View>

        {aiDecision ? (
          <View style={cs.decisionContent}>
            {/* Decision */}
            <View style={cs.decisionRow}>
              <Text style={cs.decisionLabel}>Шийдвэр:</Text>
              <View
                style={[
                  cs.decisionBadge,
                  {
                    backgroundColor:
                      aiDecision === 'auto_approve'
                        ? COLORS.secondary + '20'
                        : aiDecision === 'total_loss'
                          ? COLORS.danger + '20'
                          : COLORS.warning + '20',
                  },
                ]}
              >
                <Text
                  style={[
                    cs.decisionText,
                    {
                      color:
                        aiDecision === 'auto_approve'
                          ? COLORS.secondary
                          : aiDecision === 'total_loss'
                            ? COLORS.danger
                            : COLORS.warning,
                    },
                  ]}
                >
                  {getDecisionLabel(aiDecision)}
                </Text>
              </View>
            </View>

            {/* Risk Level */}
            <View style={cs.decisionRow}>
              <Text style={cs.decisionLabel}>Эрсдэл:</Text>
              <View
                style={[
                  cs.riskBadge,
                  { backgroundColor: getRiskColor(riskLevel) + '25' },
                ]}
              >
                <Ionicons
                  name="warning-outline"
                  size={14}
                  color={getRiskColor(riskLevel)}
                  style={{ marginRight: 4 }}
                />
                <Text
                  style={[cs.riskText, { color: getRiskColor(riskLevel) }]}
                >
                  {getRiskLabel(riskLevel)}
                </Text>
              </View>
            </View>

            {/* Suggested Payout */}
            {suggestedPayout && (
              <View style={cs.payoutBox}>
                <Text style={cs.payoutLabel}>Санал болгосон төлбөр</Text>
                <Text style={cs.payoutValue}>
                  ₮{Math.round(suggestedPayout).toLocaleString()}
                </Text>
              </View>
            )}

            {/* Manual Review Flag */}
            {requiresManualReview && (
              <View style={cs.warningBox}>
                <Ionicons
                  name="alert-circle-outline"
                  size={16}
                  color={COLORS.warning}
                />
                <Text style={cs.warningText}>
                  Энэ claim ручний шалгалт шаардлагатай
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View style={cs.emptyState}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={cs.emptyText}>AI үнэлгээ хөгжүүлж байна...</Text>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      {aiDecision && (
        <View style={cs.actions}>
          {/* Approve Button */}
          <TouchableOpacity
            style={[cs.btn, cs.btnApprove]}
            onPress={handleApprove}
            disabled={approveLoading}
            activeOpacity={0.8}
          >
            {approveLoading ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={16} color={COLORS.white} />
                <Text style={cs.btnText}>Зөвшөөрөх</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Adjust Button */}
          <TouchableOpacity
            style={[cs.btn, cs.btnAdjust]}
            onPress={() => setAdjustModal(true)}
            activeOpacity={0.8}
          >
            <Ionicons
              name="create-outline"
              size={16}
              color={COLORS.primary}
            />
            <Text style={cs.btnTextAdjust}>Дүнгийн өөрчлөлт</Text>
          </TouchableOpacity>

          {/* Reject Button */}
          <TouchableOpacity
            style={[cs.btn, cs.btnReject]}
            onPress={handleReject}
            disabled={rejectLoading}
            activeOpacity={0.8}
          >
            {rejectLoading ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <>
                <Ionicons name="close-circle" size={16} color={COLORS.white} />
                <Text style={cs.btnText}>Татгалзах</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Adjust Modal */}
      <Modal
        visible={adjustModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setAdjustModal(false)}
      >
        <View style={cs.modalContent}>
          <View style={cs.modalHeader}>
            <Text style={cs.modalTitle}>Төлбөрийн дүн өөрчлөх</Text>
            <TouchableOpacity
              onPress={() => setAdjustModal(false)}
              style={cs.modalClose}
            >
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <View style={cs.modalBody}>
            {/* Current Payout */}
            <View style={cs.infoBox}>
              <Text style={cs.infoLabel}>Одоогийн дүн</Text>
              <Text style={cs.infoValue}>
                ₮{suggestedPayout ? Math.round(suggestedPayout).toLocaleString() : 0}
              </Text>
            </View>

            {/* New Payout Input */}
            <View style={cs.inputGroup}>
              <Text style={cs.inputLabel}>Шинэ дүн (₮)</Text>
              <TextInput
                style={cs.input}
                placeholder="Шинэ төлбөрийн дүнг оруулна уу"
                keyboardType="decimal-pad"
                value={adjustPayout}
                onChangeText={setAdjustPayout}
                placeholderTextColor={COLORS.textMuted}
              />
            </View>

            {/* Reason */}
            <View style={cs.inputGroup}>
              <Text style={cs.inputLabel}>Өөрчлөлтийн шалтгаан</Text>
              <TextInput
                style={[cs.input, cs.inputMulti]}
                placeholder="Өөрчлөлтийг тайлбарла уу"
                multiline
                numberOfLines={4}
                value={adjustReason}
                onChangeText={setAdjustReason}
                placeholderTextColor={COLORS.textMuted}
              />
            </View>

            {/* Adjustment Info */}
            {adjustPayout && suggestedPayout && (
              <View
                style={[
                  cs.adjustInfo,
                  {
                    backgroundColor:
                      parseFloat(adjustPayout) > suggestedPayout
                        ? COLORS.warning + '15'
                        : COLORS.secondary + '15',
                  },
                ]}
              >
                <Text
                  style={[
                    cs.adjustInfoText,
                    {
                      color:
                        parseFloat(adjustPayout) > suggestedPayout
                          ? COLORS.warning
                          : COLORS.secondary,
                    },
                  ]}
                >
                  Өөрчлөлт:{' '}
                  {parseFloat(adjustPayout) > suggestedPayout ? '+' : ''}
                  {Math.round(
                    ((parseFloat(adjustPayout) - suggestedPayout) /
                      suggestedPayout) *
                      100,
                  )}
                  %
                </Text>
              </View>
            )}
          </View>

          {/* Modal Actions */}
          <View style={cs.modalActions}>
            <TouchableOpacity
              style={[cs.modalBtn, cs.modalBtnCancel]}
              onPress={() => setAdjustModal(false)}
              disabled={adjusting}
            >
              <Text style={cs.modalBtnText}>Болих</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[cs.modalBtn, cs.modalBtnConfirm]}
              onPress={handleAdjust}
              disabled={adjusting}
            >
              {adjusting ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Text style={[cs.modalBtnText, { color: COLORS.white }]}>
                  Баталгаажуулах
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const cs = StyleSheet.create({
  panel: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  panelTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: COLORS.text,
  },
  decisionContent: { gap: SPACING.sm },
  decisionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background,
  },
  decisionLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  decisionBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
  },
  decisionText: { fontSize: FONT_SIZE.xs, fontWeight: '700' },
  riskBadge: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    alignItems: 'center',
  },
  riskText: { fontSize: FONT_SIZE.xs, fontWeight: '700' },
  payoutBox: {
    backgroundColor: COLORS.primary + '10',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.sm,
  },
  payoutLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  payoutValue: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '800',
    color: COLORS.primary,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.warning + '15',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.sm,
  },
  warningText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.warning,
    fontWeight: '600',
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    gap: SPACING.sm,
  },
  emptyText: { fontSize: FONT_SIZE.sm, color: COLORS.textMuted },
  actions: {
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
  },
  btnApprove: { backgroundColor: COLORS.secondary },
  btnAdjust: {
    backgroundColor: COLORS.background,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  btnReject: { backgroundColor: COLORS.danger },
  btnText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: COLORS.white,
  },
  btnTextAdjust: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: COLORS.primary,
  },
  modalContent: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  modalClose: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBody: {
    flex: 1,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  infoBox: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  infoLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.primary,
  },
  inputGroup: { gap: 8 },
  inputLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.text,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: FONT_SIZE.sm,
    color: COLORS.text,
  },
  inputMulti: { paddingVertical: SPACING.md, textAlignVertical: 'top' },
  adjustInfo: {
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  adjustInfoText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBtnCancel: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalBtnConfirm: { backgroundColor: COLORS.primary },
  modalBtnText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: COLORS.text,
  },
});
