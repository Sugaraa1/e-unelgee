import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  SafeAreaView,
  ScrollView,
  Switch,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../../src/constants';

interface Props {
  visible: boolean;
  onClose: () => void;
}

interface NotifSetting {
  key: string;
  label: string;
  desc: string;
  icon: string;
  iconColor: string;
  iconBg: string;
  value: boolean;
}

export const NotificationSettingsModal = ({ visible, onClose }: Props) => {
  const [settings, setSettings] = useState<NotifSetting[]>([
    {
      key: 'claim_status',
      label: 'Claim статус өөрчлөлт',
      desc: 'Claim зөвшөөрөгдсөн, татгалзагдсан үед',
      icon: 'document-text',
      iconColor: '#1A56DB',
      iconBg: '#EFF6FF',
      value: true,
    },
    {
      key: 'ai_result',
      label: 'AI шинжилгээний дүн',
      desc: 'Зургийн AI шинжилгээ дуусмагц',
      icon: 'sparkles',
      iconColor: '#7C3AED',
      iconBg: '#F5F3FF',
      value: true,
    },
    {
      key: 'review_needed',
      label: 'Шалгалт шаардлагатай',
      desc: 'Гараар шалгалт хийх шаардлагатай болсон үед',
      icon: 'warning',
      iconColor: '#FF8A00',
      iconBg: '#FFF8EE',
      value: true,
    },
    {
      key: 'approval',
      label: 'Зөвшөөрлийн мэдэгдэл',
      desc: 'Claim зөвшөөрөгдсөн үед мэдэгдэл авах',
      icon: 'checkmark-circle',
      iconColor: '#0E9F6E',
      iconBg: '#ECFDF5',
      value: true,
    },
    {
      key: 'rejection',
      label: 'Татгалзлын мэдэгдэл',
      desc: 'Claim татгалзагдсан үед мэдэгдэл авах',
      icon: 'close-circle',
      iconColor: '#E02424',
      iconBg: '#FEF2F2',
      value: true,
    },
    {
      key: 'promotions',
      label: 'Мэдээлэл & Зөвлөмж',
      desc: 'Системийн шинэчлэл болон зөвлөмжүүд',
      icon: 'information-circle',
      iconColor: '#6B7280',
      iconBg: '#F9FAFB',
      value: false,
    },
  ]);

  const toggle = (key: string) => {
    setSettings((prev) =>
      prev.map((s) => (s.key === key ? { ...s, value: !s.value } : s)),
    );
  };

  const allOn = settings.every((s) => s.value);
  const toggleAll = () => {
    const newVal = !allOn;
    setSettings((prev) => prev.map((s) => ({ ...s, value: newVal })));
  };

  const handleSave = () => {
    // In a real app, save to SecureStore or backend
    Alert.alert('Хадгалагдлаа', 'Мэдэгдлийн тохиргоо хадгалагдлаа', [
      { text: 'OK', onPress: onClose },
    ]);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={s.safe}>
        <View style={s.header}>
          <TouchableOpacity style={s.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={22} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={s.title}>Мэдэгдлийн тохиргоо</Text>
          <TouchableOpacity style={s.saveBtn} onPress={handleSave}>
            <Text style={s.saveBtnText}>Хадгалах</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
          {/* Master toggle */}
          <View style={s.masterCard}>
            <View style={s.masterLeft}>
              <View style={s.bellWrap}>
                <Ionicons
                  name={allOn ? 'notifications' : 'notifications-off'}
                  size={24}
                  color={allOn ? COLORS.primary : COLORS.textMuted}
                />
              </View>
              <View>
                <Text style={s.masterLabel}>Бүх мэдэгдэл</Text>
                <Text style={s.masterDesc}>
                  {allOn ? 'Идэвхжсэн' : 'Унтраасан'}
                </Text>
              </View>
            </View>
            <Switch
              value={allOn}
              onValueChange={toggleAll}
              trackColor={{ false: '#D1D5DB', true: COLORS.primary + '80' }}
              thumbColor={allOn ? COLORS.primary : '#F3F4F6'}
              ios_backgroundColor="#D1D5DB"
            />
          </View>

          <Text style={s.groupTitle}>Дэлгэрэнгүй тохиргоо</Text>

          <View style={s.card}>
            {settings.map((setting, i) => (
              <View key={setting.key}>
                <View style={s.row}>
                  <View style={[s.iconWrap, { backgroundColor: setting.iconBg }]}>
                    <Ionicons name={setting.icon as any} size={18} color={setting.iconColor} />
                  </View>
                  <View style={s.rowContent}>
                    <Text style={s.rowLabel}>{setting.label}</Text>
                    <Text style={s.rowDesc}>{setting.desc}</Text>
                  </View>
                  <Switch
                    value={setting.value}
                    onValueChange={() => toggle(setting.key)}
                    trackColor={{ false: '#D1D5DB', true: setting.iconColor + '80' }}
                    thumbColor={setting.value ? setting.iconColor : '#F3F4F6'}
                    ios_backgroundColor="#D1D5DB"
                  />
                </View>
                {i < settings.length - 1 && <View style={s.divider} />}
              </View>
            ))}
          </View>

          <Text style={s.note}>
            Push мэдэгдэл авахын тулд төхөөрөмжийн тохиргооноос зөвшөөрөл өгсөн байх шаардлагатай.
          </Text>

          <View style={{ height: SPACING.xl }} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  closeBtn: {
    width: 36, height: 36, borderRadius: RADIUS.sm,
    backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center',
  },
  title: { fontSize: FONT_SIZE.lg, fontWeight: '700', color: COLORS.text },
  saveBtn: { paddingHorizontal: SPACING.md, paddingVertical: 8, minWidth: 70, alignItems: 'center' },
  saveBtnText: { fontSize: FONT_SIZE.sm, fontWeight: '700', color: COLORS.primary },

  body: { padding: SPACING.lg, gap: SPACING.md },

  masterCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff', borderRadius: RADIUS.lg, padding: SPACING.md,
    borderWidth: 2, borderColor: COLORS.primary + '30',
  },
  masterLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bellWrap: {
    width: 44, height: 44, borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary + '12',
    justifyContent: 'center', alignItems: 'center',
  },
  masterLabel: { fontSize: FONT_SIZE.md, fontWeight: '700', color: COLORS.text },
  masterDesc: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, marginTop: 2 },

  groupTitle: {
    fontSize: FONT_SIZE.xs, fontWeight: '700', color: COLORS.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },

  card: {
    backgroundColor: '#fff', borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: '#F1F5F9', overflow: 'hidden',
  },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: SPACING.md, paddingVertical: 13,
  },
  iconWrap: {
    width: 38, height: 38, borderRadius: RADIUS.sm,
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  rowContent: { flex: 1 },
  rowLabel: { fontSize: FONT_SIZE.sm, fontWeight: '600', color: COLORS.text },
  rowDesc: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, marginTop: 2, lineHeight: 16 },
  divider: { height: 1, backgroundColor: '#F8FAFC', marginHorizontal: SPACING.md },

  note: {
    fontSize: FONT_SIZE.xs, color: COLORS.textLight,
    lineHeight: 18, textAlign: 'center', paddingHorizontal: SPACING.md,
  },
});