import React, { memo } from 'react';
import { Animated, Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import type { LucideIcon } from 'lucide-react-native';
import { CONTENT_W, HIT_SLOP } from '../constants/config';
import { THEME } from '../constants/theme';
import { usePressScale } from '../hooks/usePressScale';

/** Every icon in this app comes from the one library, so this is its type. */
export type IconComponent = LucideIcon;

/**
 * The brown gradient CTA. The Pressable is the PARENT and carries an explicit
 * width AND height; the Animated.View it scales is a CHILD, so the press never
 * gets eaten by an animated wrapper on Android release.
 *
 * Icon geometry is fixed by contract: 24x24, lineHeight 24 on the label,
 * gap 10, centred row, never absolutely positioned.
 */
function PrimaryButtonBase({
  label,
  Icon,
  onPress,
  disabled = false,
  width = CONTENT_W,
  height = 60,
  style,
}: {
  label: string;
  Icon?: IconComponent;
  onPress: () => void;
  disabled?: boolean;
  width?: number;
  height?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const { scale, onPressIn, onPressOut } = usePressScale(0.97);

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
      <Animated.View style={[styles.shell, { width, height, transform: [{ scale }] }, THEME.shadows.cta]}>
        <LinearGradient
          colors={THEME.gradients.button}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.fill, { width, height }]}
        >
          <View style={styles.row}>
            {Icon ? <Icon size={24} color={THEME.colors.text.onDark} strokeWidth={2} /> : null}
            <Text style={styles.label} numberOfLines={1}>
              {label}
            </Text>
          </View>
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  shell: {
    borderRadius: THEME.radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(44,36,22,0.35)',
  },
  fill: {
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
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 2,
    lineHeight: 24,
    color: THEME.colors.text.onDark,
  },
});

export const PrimaryButton = memo(PrimaryButtonBase);
export default PrimaryButton;
