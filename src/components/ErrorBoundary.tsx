import React, { Component, ErrorInfo, ReactNode } from 'react';
  import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
  import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../constants';

  interface Props { children: ReactNode; }
  interface State { hasError: boolean; error?: Error; }

  export class ErrorBoundary extends Component<Props, State> {
    state: State = { hasError: false };

    static getDerivedStateFromError(error: Error): State {
      return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
      console.error('[ErrorBoundary]', error, info.componentStack);
    }

    render() {
      if (this.state.hasError) {
        return (
          <View style={s.container}>
            <Text style={s.title}>Алдаа гарлаа</Text>
            <Text style={s.msg}>{this.state.error?.message ?? 'Тодорхойгүй алдаа'}</Text>
            <TouchableOpacity
              style={s.btn}
              onPress={() => this.setState({ hasError: false })}
            >
              <Text style={s.btnText}>Дахин оролдох</Text>
            </TouchableOpacity>
          </View>
        );
      }
      return this.props.children;
    }
  }

  const s = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.lg },
    title: { fontSize: FONT_SIZE.xl, fontWeight: '700', color: COLORS.danger, marginBottom: SPACING.sm },
    msg: { fontSize: FONT_SIZE.sm, color: COLORS.textMuted, textAlign: 'center', marginBottom: SPACING.lg },
    btn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingHorizontal: SPACING.lg, paddingVertical: 12 },
    btnText: { color: '#fff', fontWeight: '700', fontSize: FONT_SIZE.sm },
  });