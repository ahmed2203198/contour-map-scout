import React, { memo } from 'react';
import { Animated, Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { CONTENT_W, HIT_SLOP } from '../constants/config';
import { THEME } from '../constants/theme';
import { usePressScale } from '../hooks/usePressScale';
import type { IconComponent } from './PrimaryButton';

/**
 * Hairline button on a brown tint. Same icon contract as PrimaryButton -
 * 24x24, lineHeight 24, gap 10 - so the two never drift apart on a screen.
 */
function SecondaryButtonBase({
  label,
  Icon,
  onPress,
  disabled = false,
  width = CONTENT_W,
  height = 48,
  tone = 'brown',
  style,
}: {
  label: string;
  Icon?: IconComponent;
  onPress: () => void;
  disabled?: boolean;
  width?: number;
  height?: number;
  tone?: 'brown' | 'teal';
  style?: StyleProp<ViewStyle>;
}) {
  const { scale, onPressIn, onPressOut } = usePressScale(0.97);
  const colour = tone === 'teal' ? THEME.colors.accent.teal : THEME.colors.accent.brown;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={disabled}
      hitSlop={HIT_SLOP}
      style={[{ width, height, opacity: disabled ? 0.45 : 1 }, style]}
    >
      <Animated.View
        style={[
          styles.shell,
          {
            width,
            height,
            transform: [{ scale }],
            borderColor: colour + '40',
            backgroundColor: tone === 'teal' ? THEME.colors.surface.tintTeal : THEME.colors.surface.tintBrown,
          },
        ]}
      >
        <View style={styles.row}>
          {Icon ? <Icon size={24} color={colour} strokeWidth={2} /> : null}
          <Text style={[styles.label, { color: colour }]} numberOfLines={1}>
            {label}
          </Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  shell: {
    borderRadius: THEME.radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.4,
    lineHeight: 24,
  },
});

export const SecondaryButton = memo(SecondaryButtonBase);
export default SecondaryButton;
