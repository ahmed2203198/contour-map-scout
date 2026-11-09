import React, { memo } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { HIT_SLOP } from '../constants/config';
import { THEME } from '../constants/theme';
import { usePressScale } from '../hooks/usePressScale';

/** One hairline settings card: label on the left, control on the right. */
function SettingRowBase({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.textCol}>
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
        {hint ? (
          <Text style={styles.hint} numberOfLines={1}>
            {hint}
          </Text>
        ) : null}
      </View>
      <View style={styles.control}>{children}</View>
    </View>
  );
}

/** A segmented chip used inside a SettingRow. */
function SegmentChipBase({
  label,
  active,
  onPress,
  width = 54,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  width?: number;
}) {
  const { scale, onPressIn, onPressOut } = usePressScale(0.95);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      hitSlop={HIT_SLOP}
      style={{ width, height: 34 }}
    >
      <Animated.View
        style={[
          styles.chip,
          {
            width,
            transform: [{ scale }],
            borderColor: active ? THEME.colors.accent.teal : THEME.colors.accent.brown + '38',
            backgroundColor: active ? THEME.colors.surface.tintTeal : 'transparent',
          },
        ]}
      >
        <Text
          style={[styles.chipText, { color: active ? THEME.colors.accent.teal : THEME.colors.text.secondary }]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    marginBottom: 10,
    backgroundColor: THEME.colors.surface.card,
    borderWidth: 1,
    borderColor: THEME.colors.line.hairline,
    borderRadius: THEME.radius.md,
  },
  textCol: { flexShrink: 1, paddingRight: 10 },
  label: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.2,
    lineHeight: 18,
    color: THEME.colors.text.primary,
  },
  hint: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
    lineHeight: 14,
    color: THEME.colors.text.secondary,
    marginTop: 2,
  },
  control: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  chip: {
    height: 34,
    borderRadius: THEME.radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    lineHeight: 15,
  },
});

export const SettingRow = memo(SettingRowBase);
export const SegmentChip = memo(SegmentChipBase);
export default SettingRow;
