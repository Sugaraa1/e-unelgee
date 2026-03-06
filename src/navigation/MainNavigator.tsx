import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { ClaimsScreen } from '../screens/claims/ClaimsScreen';
import { VehiclesScreen } from '../screens/vehicles/VehiclesScreen';
import { ProfileScreen } from '../screens/dashboard/ProfileScreen';
import type { MainTabParamList } from '../types';
import { COLORS } from '../constants';

const Tab = createBottomTabNavigator<MainTabParamList>();

export const MainNavigator = () => (
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
          Claims: 'document-text-outline',
          Vehicles: 'car-outline',
          Profile: 'person-outline',
        };
        return <Ionicons name={icons[route.name] as any} size={size} color={color} />;
      },
    })}
  >
    <Tab.Screen name="Dashboard" component={DashboardScreen} />
    <Tab.Screen name="Claims" component={ClaimsScreen} />
    <Tab.Screen name="Vehicles" component={VehiclesScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);