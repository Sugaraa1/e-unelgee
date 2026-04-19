import React from 'react';
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

export const MainNavigator = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  return (
    <Tab.Navigator
      screenOptions={({ route }: any) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          paddingBottom: 8,
          paddingTop: 8,
          height: 64,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
        tabBarIcon: ({ color, size }: any) => {
          // ✅ 'shield-account-outline' → 'shield-outline' (Ionicons-д байгаа нэр)
          const icons: Record<string, string> = {
            Dashboard: 'home-outline',
            Claims: 'document-text-outline',
            Vehicles: 'car-outline',
            Admin: 'shield-outline',
            Profile: 'person-outline',
          };
          return (
            <Ionicons
              name={icons[route.name] as any}
              size={size}
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

      {/* ✅ Admin tab — зөвхөн admin role-той хэрэглэгчид харагдана */}
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