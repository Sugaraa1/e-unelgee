import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getClaims } from '../../services/claimsService';
import { COLORS, SPACING, FONT_SIZE, RADIUS, STATUS_COLORS } from '../../constants';
import type { Claim } from '../../types';

// ── Notification types ────────────────────────────────────────
interface Notification {
  id: string;
  type: 'claim_pending' | 'claim_approved' | 'claim_rejected' | 'ai_done' | 'info';
  title: string;
  body: string;
  claimId?: string;
  claimNumber?: string;
  timestamp: Date;
  read: boolean;
}

const TYPE_CONFIG = {
  claim_pending: { icon: 'time', color: '#FF8A00', bg: '#FFF8EE' },
  claim_approved: { icon: 'checkmark-circle', color: '#0E9F6E', bg: '#ECFDF5' },
  claim_rejected: { icon: 'close-circle', color: '#E02424', bg: '#FEF2F2' },
  ai_done: { icon: 'sparkles', color: '#7C3AED', bg: '#F5F3FF' },
  info: { icon: 'information-circle', color: '#1A56DB', bg: '#EFF6FF' },
};

const STATUS_TYPE_MAP: Record<string, Notification['type']> = {
  submitted: 'claim_pending',
  under_review: 'claim_pending',
  pending_inspection: 'claim_pending',
  approved: 'claim_approved',
  partially_approved: 'claim_approved',
  rejected: 'claim_rejected',
  ai_processing: 'ai_done',
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Ноорог',
  submitted: 'Илгээгдсэн',
  under_review: 'Хянагдаж байна',
  ai_processing: 'AI боловсруулж байна',
  pending_inspection: 'Шалгалт хүлээж байна',
  approved: 'Зөвшөөрөгдсөн',
  partially_approved: 'Хэсэгчлэн зөвшөөрөгдсөн',
  rejected: 'Татгалзсан',
  closed: 'Хаагдсан',
};

const buildNotifications = (claims: Claim[]): Notification[] => {
  const notes: Notification[] = [];

  claims.forEach((claim) => {
    const type = STATUS_TYPE_MAP[claim.status] ?? 'info';
    const label = STATUS_LABELS[claim.status] ?? claim.status;

    const titleMap: Record<string, string> = {
      claim_pending: 'Мэдэгдэл хянагдаж байна',
      claim_approved: 'Мэдэгдэл зөвшөөрөгдлөө! 🎉',
      claim_rejected: 'Мэдэгдэл татгалзагдлаа',
      ai_done: 'AI шинжилгээ дуусдаа',
      info: 'Мэдэгдлийн шинэчлэл',
    };

    const bodyMap: Record<string, string> = {
      claim_pending: `${claim.claimNumber} — "${label}" статустай байна`,
      claim_approved: `${claim.claimNumber} амжилттай зөвшөөрөгдлөө`,
      claim_rejected: `${claim.claimNumber} татгалзагдсан шалтгааныг шалгана уу`,
      ai_done: `${claim.claimNumber}-н AI зургийн шинжилгээ дуусдаа`,
      info: `${claim.claimNumber} — ${label}`,
    };

    notes.push({
      id: `claim-${claim.id}`,
      type,
      title: titleMap[type],
      body: bodyMap[type],
      claimId: claim.id,
      claimNumber: claim.claimNumber,
      timestamp: new Date(claim.updatedAt ?? claim.createdAt),
      read: ['approved', 'rejected', 'closed', 'draft'].includes(claim.status),
    });
  });

  // Sort by timestamp desc
  return notes.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
};

const formatTime = (date: Date): string => {
  const now = new Date();
  const diff = (now.getTime() - date.getTime()) / 1000;
  if (diff < 60) return 'Дөнгөж сая';
  if (diff < 3600) return `${Math.floor(diff / 60)} минутын өмнө`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} цагийн өмнө`;
  if (diff < 172800) return 'Өчигдөр';
  return date.toLocaleDateString('mn-MN', { month: 'short', day: 'numeric' });
};

// ── Notification Row ──────────────────────────────────────────
const NotifRow = ({
  item,
  onPress,
}: {
  item: Notification;
  onPress: (item: Notification) => void;
}) => {
  const scale = useRef(new Animated.Value(1)).current;
  const cfg = TYPE_CONFIG[item.type];

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        style={[cs.row, !item.read && cs.rowUnread]}
        onPress={() => onPress(item)}
        onPressIn={() =>
          Animated.spring(scale, { toValue: 0.98, useNativeDriver: true, speed: 40 }).start()
        }
        onPressOut={() =>
          Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20 }).start()
        }
        activeOpacity={1}
      >
        {!item.read && <View style={cs.unreadDot} />}
        <View style={[cs.iconWrap, { backgroundColor: cfg.bg }]}>
          <Ionicons name={cfg.icon as any} size={22} color={cfg.color} />
        </View>
        <View style={cs.rowContent}>
          <View style={cs.rowTop}>
            <Text style={[cs.rowTitle, !item.read && cs.rowTitleBold]} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={cs.rowTime}>{formatTime(item.timestamp)}</Text>
          </View>
          <Text style={cs.rowBody} numberOfLines={2}>
            {item.body}
          </Text>
          {item.claimNumber && (
            <View style={[cs.claimTag, { backgroundColor: cfg.bg }]}>
              <Text style={[cs.claimTagText, { color: cfg.color }]}>{item.claimNumber}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ════════════════════════════════════════════════════════════════
// MAIN SCREEN
// ════════════════════════════════════════════════════════════════
export const NotificationsScreen = () => {
  const navigation = useNavigation<any>();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const claims = await getClaims();
      setNotifications(buildNotifications(claims));
    } catch {
      Alert.alert('Алдаа', 'Мэдэгдлүүд ачааллахад алдаа гарлаа');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handlePress = (item: Notification) => {
    // Mark as read
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, read: true } : n)),
    );
    // Navigate to claim detail
    if (item.claimId) {
      navigation.navigate('Claims', {
        screen: 'ClaimDetail',
        params: { claimId: item.claimId },
      });
    }
  };

  const renderEmpty = () => (
    <View style={cs.empty}>
      <View style={cs.emptyIcon}>
        <Ionicons name="notifications-off-outline" size={40} color={COLORS.textLight} />
      </View>
      <Text style={cs.emptyTitle}>Мэдэгдэл байхгүй байна</Text>
      <Text style={cs.emptySub}>Claim үүсгэсэн үед энд мэдэгдэл ирнэ</Text>
    </View>
  );

  return (
    <SafeAreaView style={cs.safe}>
      {/* Header */}
      <View style={cs.header}>
        <TouchableOpacity
          style={cs.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <View style={cs.headerCenter}>
          <Text style={cs.headerTitle}>Мэдэгдлүүд</Text>
          {unreadCount > 0 && (
            <View style={cs.headerBadge}>
              <Text style={cs.headerBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity style={cs.markAllBtn} onPress={markAllRead}>
            <Text style={cs.markAllText}>Бүгдийг уншсан</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={cs.loadingBox}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <NotifRow item={item} onPress={handlePress} />
          )}
          ListEmptyComponent={renderEmpty}
          ItemSeparatorComponent={() => <View style={cs.sep} />}
          contentContainerStyle={[
            cs.list,
            notifications.length === 0 && cs.listEmpty,
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load(true); }}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const cs = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    width: 40, height: 40, borderRadius: RADIUS.md,
    backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  headerCenter: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    gap: 8, marginLeft: SPACING.md,
  },
  headerTitle: { fontSize: FONT_SIZE.lg, fontWeight: '700', color: COLORS.text },
  headerBadge: {
    backgroundColor: COLORS.danger, borderRadius: RADIUS.full,
    minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 5,
  },
  headerBadgeText: { fontSize: 11, color: '#fff', fontWeight: '700' },
  markAllBtn: { paddingHorizontal: SPACING.sm },
  markAllText: { fontSize: FONT_SIZE.xs, color: COLORS.primary, fontWeight: '600' },

  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  list: { paddingVertical: SPACING.sm },
  listEmpty: { flex: 1 },

  sep: { height: 1, backgroundColor: '#F8FAFC', marginHorizontal: SPACING.lg },

  row: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
    backgroundColor: '#fff', gap: SPACING.md, position: 'relative',
  },
  rowUnread: { backgroundColor: '#FAFBFF' },
  unreadDot: {
    position: 'absolute', top: 18, left: 10,
    width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.primary,
  },
  iconWrap: {
    width: 46, height: 46, borderRadius: RADIUS.md,
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  rowContent: { flex: 1, gap: 4 },
  rowTop: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
  },
  rowTitle: { fontSize: FONT_SIZE.sm, color: COLORS.text, flex: 1, marginRight: 8 },
  rowTitleBold: { fontWeight: '700' },
  rowTime: { fontSize: 10, color: COLORS.textLight, flexShrink: 0 },
  rowBody: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, lineHeight: 18 },
  claimTag: {
    alignSelf: 'flex-start', borderRadius: RADIUS.full,
    paddingHorizontal: 8, paddingVertical: 3, marginTop: 2,
  },
  claimTagText: { fontSize: 10, fontWeight: '700' },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, padding: SPACING.xl },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#F3F4F6',
    justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.sm,
  },
  emptyTitle: { fontSize: FONT_SIZE.md, fontWeight: '700', color: COLORS.textMuted },
  emptySub: { fontSize: FONT_SIZE.sm, color: COLORS.textLight, textAlign: 'center', lineHeight: 20 },
});