import React, { memo, useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';
import { HIT_SLOP } from '../constants/config';
import { THEME } from '../constants/theme';

const W = 52;
const H = 30;
const KNOB = 24;

/**
 * The haptics switch. The Pressable is the parent and the knob's Animated.View
 * is its child, so the track can animate without swallowing the tap.
 */
function ToggleSwitchBase({
  value,
  onChange,
  label,
}: {
  value: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  const pos = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(pos, {
      toValue: value ? 1 : 0,
      tension: 160,
      friction: 12,
      useNativeDriver: true,
    }).start();
  }, [value, pos]);

  const translateX = pos.interpolate({
    inputRange: [0, 1],
    outputRange: [3, W - KNOB - 3],
  });

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      onPress={() => onChange(!value)}
      hitSlop={HIT_SLOP}
      style={[
        styles.track,
        {
          backgroundColor: value ? THEME.colors.accent.teal : THEME.colors.surface.sheet,
          borderColor: value ? THEME.colors.accent.teal : THEME.colors.line.border,
        },
      ]}
    >
      <Animated.View style={[styles.knob, { transform: [{ translateX }] }]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: W,
    height: H,
    borderRadius: H / 2,
    borderWidth: 1,
    justifyContent: 'center',
  },
  knob: {
    width: KNOB,
    height: KNOB,
    borderRadius: KNOB / 2,
    backgroundColor: THEME.colors.surface.card,
  },
});

export const ToggleSwitch = memo(ToggleSwitchBase);
export default ToggleSwitch;
