import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/store/authStore';
import { RootNavigator } from '@navigation/RootNavigator';
import { ErrorBoundary } from './src/components/ErrorBoundary';

 export default function App() {
    return (
      <ErrorBoundary>
        <SafeAreaProvider>
          <AuthProvider>
            <StatusBar style="dark" />
            <RootNavigator />
          </AuthProvider>
        </SafeAreaProvider>
      </ErrorBoundary>
    );
  }

  export {}; 