import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/store/authStore';
import { RootNavigator } from '@navigation/RootNavigator';

export default function App() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <RootNavigator />
    </AuthProvider>
  );
}
