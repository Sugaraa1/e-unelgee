import React from 'react';
import { View, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { ClaimsNavigator } from './ClaimsNavigator';
import { VehiclesScreen } from '../screens/vehicles/VehiclesScreen';
import { ProfileScreen } from '../screens/dashboard/ProfileScreen';
import { AdminDashboardScreen } from '../screens/dashboard/AdminDashboardScreen';
import { useAuthStore } from '../store/authStore';
import type { MainTabParamList } from '../types';
import { COLORS } from '../constants';

const Tab = createBottomTabNavigator<MainTabParamList>();

// ── Custom Tab Bar Icon with 3D active indicator ──────────────
const TabIcon = ({
  name,
  focused,
  color,
}: {
  name: string;
  focused: boolean;
  color: string;
}) => (
  <View
    style={{
      alignItems: 'center',
      justifyContent: 'center',
      width: 48,
      height: 36,
      borderRadius: 18,
      backgroundColor: focused ? COLORS.primary + '15' : 'transparent',
    }}
  >
    <Ionicons name={name as any} size={22} color={color} />
  </View>
);

export const MainNavigator = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const isAdjuster = user?.role === 'adjuster' || user?.role === 'admin';

  const ICON_MAP: Record<string, { active: string; inactive: string }> = {
    Dashboard: { active: 'home', inactive: 'home-outline' },
    Claims: { active: 'document-text', inactive: 'document-text-outline' },
    Vehicles: { active: 'car-sport', inactive: 'car-outline' },
    Admin: { active: 'shield-checkmark', inactive: 'shield-outline' },
    Profile: { active: 'person-circle', inactive: 'person-circle-outline' },
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 0,
          height: Platform.OS === 'ios' ? 84 : 68,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          paddingTop: 8,
          // 3D tab bar shadow
          ...Platform.select({
            ios: {
              shadowColor: '#1A56DB',
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.08,
              shadowRadius: 16,
            },
            android: { elevation: 16 },
          }),
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarIcon: ({ focused, color }) => {
          const icons = ICON_MAP[route.name] ?? { active: 'ellipse', inactive: 'ellipse-outline' };
          return (
            <TabIcon
              name={focused ? icons.active : icons.inactive}
              focused={focused}
              color={color}
            />
          );
        },
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: 'Нүүр' }}
      />
      <Tab.Screen
        name="Claims"
        component={ClaimsNavigator}
        options={{ title: 'Мэдэгдлүүд' }}
      />
      <Tab.Screen
        name="Vehicles"
        component={VehiclesScreen}
        options={{ title: 'Машинууд' }}
      />
      {isAdmin && (
        <Tab.Screen
          name="Admin"
          component={AdminDashboardScreen}
          options={{ title: 'Админ' }}
        />
      )}
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Профайл' }}
      />
    </Tab.Navigator>
  );
};