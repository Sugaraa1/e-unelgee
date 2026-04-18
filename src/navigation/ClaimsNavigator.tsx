import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ClaimsScreen } from '../screens/claims/ClaimsScreen';
import { CreateClaimScreen } from '../screens/claims/CreateClaimScreen';
import { ClaimDetailScreen } from '../screens/claims/ClaimDetailScreen';
import type { ClaimsStackParamList } from '../types';

const Stack = createNativeStackNavigator<ClaimsStackParamList>();

export const ClaimsNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ClaimsList"   component={ClaimsScreen} />
    <Stack.Screen name="ClaimDetail"  component={ClaimDetailScreen} />
    <Stack.Screen name="NewClaim"     component={CreateClaimScreen} />
  </Stack.Navigator>
);