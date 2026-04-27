import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useChesterReactions } from '../../contexts/ChesterReactionContext';
import ChesterReaction from './ChesterReaction';

/**
 * Renders the currently-active Chester reaction at the top of the screen.
 * Mounted once at the root layout so reactions surface from any screen.
 *
 * Tapping the bubble dismisses it early and advances the queue.
 */
export default function ChesterReactionOverlay() {
  const { current, dismissCurrent } = useChesterReactions();
  const insets = useSafeAreaInsets();

  if (!current) return null;

  return (
    <View
      style={[styles.container, { top: insets.top + 12 }]}
      pointerEvents="box-none"
    >
      <Pressable onPress={dismissCurrent} hitSlop={8}>
        <ChesterReaction
          message={current.message}
          score={current.score}
          visible={true}
          autoDismissMs={current.durationMs ?? 3500}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    alignItems: 'flex-end',
    zIndex: 1000,
    elevation: 1000,
  },
});
