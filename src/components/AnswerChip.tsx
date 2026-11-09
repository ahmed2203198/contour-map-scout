import React, { memo } from 'react';
import { Animated, Pressable, StyleSheet, Text } from 'react-native';
import { HIT_SLOP } from '../constants/config';
import { THEME } from '../constants/theme';
import { usePressScale } from '../hooks/usePressScale';

/**
 * One answer chip on the floating bar. Teal means "this is right" everywhere in
 * this app, so an active chip is the only teal thing on the control row.
 */
function AnswerChipBase({
  label,
  active,
  onPress,
  width,
  disabled = false,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  width: number;
  disabled?: boolean;
}) {
  const { scale, onPressIn, onPressOut } = usePressScale(0.96);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={disabled}
      hitSlop={HIT_SLOP}
      style={{ width, height: 40, opacity: disabled ? 0.5 : 1 }}
    >
      <Animated.View
        style={[
          styles.chip,
          {
            width,
            transform: [{ scale }],
            borderColor: active ? THEME.colors.accent.teal : THEME.colors.accent.brown + '40',
            backgroundColor: active ? THEME.colors.surface.tintTeal : THEME.colors.surface.tintBrown,
          },
        ]}
      >
        <Text
          style={[
            styles.label,
            { color: active ? THEME.colors.accent.teal : THEME.colors.text.brown },
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    height: 40,
    borderRadius: THEME.radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    lineHeight: 16,
  },
});

export const AnswerChip = memo(AnswerChipBase);
export default AnswerChip;
