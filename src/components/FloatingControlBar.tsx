import React, { memo } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { BAR_BOTTOM, SCREEN_W } from '../constants/config';
import { THEME } from '../constants/theme';

/**
 * The G2 floating bar. It never covers the plate - the game area carries a
 * bottom pad the height of this bar plus its offset.
 */
function FloatingControlBarBase({
  eyebrow,
  task,
  shake,
  children,
}: {
  eyebrow: string;
  task: string;
  /** Horizontal nudge for the wrong-answer shake, driven by the screen. */
  shake?: Animated.Value;
  children?: React.ReactNode;
}) {
  return (
    <View style={styles.bar} pointerEvents="box-none">
      <Animated.View
        pointerEvents="box-none"
        style={[styles.strip, shake ? { transform: [{ translateX: shake }] } : null]}
      >
        <Text style={styles.eyebrow} numberOfLines={1}>
          {eyebrow}
        </Text>
        <Text style={styles.task} numberOfLines={1}>
          {task}
        </Text>
      </Animated.View>
      <View style={styles.controls} pointerEvents="box-none">
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: BAR_BOTTOM,
    width: SCREEN_W - 32,
    minHeight: 92,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: THEME.colors.surface.card,
    borderWidth: 1,
    borderColor: THEME.colors.line.hairlineStrong,
    borderRadius: THEME.radius.xl,
    ...THEME.shadows.bar,
  },
  strip: { marginBottom: 8 },
  eyebrow: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    lineHeight: 14,
    color: THEME.colors.text.secondary,
  },
  task: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.6,
    lineHeight: 18,
    color: THEME.colors.text.primary,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});

export const FloatingControlBar = memo(FloatingControlBarBase);
export default FloatingControlBar;
