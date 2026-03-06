import React from 'react';
import { View, Text, SafeAreaView } from 'react-native';
import { COLORS, SPACING, FONT_SIZE } from '../../constants';

export const VehiclesScreen = () => (
  <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
    <View style={{ flex: 1, padding: SPACING.lg }}>
      <Text style={{ fontSize: FONT_SIZE.xxl, fontWeight: '700', color: COLORS.text }}>
        Тээврийн хэрэгсэл
      </Text>
    </View>
  </SafeAreaView>
);