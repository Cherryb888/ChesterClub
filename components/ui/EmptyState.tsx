import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';

interface EmptyStateProps {
  icon: string;
  title: string;
  message: string;
  buttonLabel?: string;
  buttonIcon?: React.ReactNode;
  onPress?: () => void;
}

export default function EmptyState({ icon, title, message, buttonLabel, buttonIcon, onPress }: EmptyStateProps) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>{icon}</Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyText}>{message}</Text>
      {buttonLabel && onPress && (
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={onPress}
          accessibilityLabel={buttonLabel}
          accessibilityRole="button"
        >
          {buttonIcon}
          <Text style={styles.actionBtnText}>{buttonLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: Spacing.md },
  emptyTitle: {
    fontSize: FontSize.lg, fontWeight: '700', color: Colors.text,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center',
    lineHeight: 22, paddingHorizontal: Spacing.xl, marginBottom: Spacing.lg,
  },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.primary, paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md, borderRadius: BorderRadius.lg,
  },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: FontSize.md },
});
