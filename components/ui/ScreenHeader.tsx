import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Spacing, FontSize } from '../../constants/theme';

interface ScreenHeaderProps {
  title: string;
  rightElement?: React.ReactNode;
}

export default function ScreenHeader({ title, rightElement }: ScreenHeaderProps) {
  const router = useRouter();
  return (
    <View style={styles.headerRow}>
      <TouchableOpacity
        onPress={() => router.back()}
        accessibilityLabel="Go back"
        accessibilityRole="button"
      >
        <Ionicons name="arrow-back" size={24} color={Colors.text} />
      </TouchableOpacity>
      <Text style={styles.header} accessibilityRole="header">{title}</Text>
      {rightElement || <View style={{ width: 24 }} />}
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  header: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.text,
  },
});
