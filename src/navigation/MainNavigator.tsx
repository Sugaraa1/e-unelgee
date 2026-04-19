import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { ClaimsNavigator } from './ClaimsNavigator';   // ← Stack navigator
import { VehiclesScreen } from '../screens/vehicles/VehiclesScreen';
import { ProfileScreen } from '../screens/dashboard/ProfileScreen';
import { AdminDashboardScreen } from '../screens/dashboard/AdminDashboardScreen';
import { useAuthStore } from '../store/authStore';
import type { MainTabParamList } from '../types';
import { COLORS } from '../constants';

const Tab = createBottomTabNavigator<MainTabParamList>();

export const MainNavigator = () => {
  const { user } = useAuthStore();
  // DEBUG: Force admin for testing (remove this in production)
  const isAdmin = user?.role === 'admin' || user?.email === 'test@example.com';

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
          const icons: Record<string, string> = {
            Dashboard: 'home-outline',
            Claims:    'document-text-outline',
            Vehicles:  'car-outline',
            Admin:     'shield-account-outline',
            Profile:   'person-outline',
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
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      {/* Claims tab нь Stack navigator ашигладаг */}
      <Tab.Screen
        name="Claims"
        component={ClaimsNavigator}
        options={{ title: 'Мэдэгдлүүд' }}
      />
      <Tab.Screen name="Vehicles" component={VehiclesScreen} />
      
      {/* Admin tab - зөвхөн admin эрхтэй хэрэглэгчид харагдана */}
      {isAdmin && (
        <Tab.Screen
          name="Admin"
          component={AdminDashboardScreen}
          options={{ title: 'Админ' }}
        />
      )}
      
      <Tab.Screen name="Profile"  component={ProfileScreen} />
    </Tab.Navigator>
  );
};