import React, { memo } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { HEADER_TOP, HIT_SLOP, PAGE_PAD } from '../constants/config';
import { THEME } from '../constants/theme';
import { usePressScale } from '../hooks/usePressScale';
import HairlineRule from './HairlineRule';

function BackSquare({ onPress }: { onPress: () => void }) {
  const { scale, onPressIn, onPressOut } = usePressScale(0.94);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="BACK"
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      hitSlop={HIT_SLOP}
      style={styles.square}
    >
      <Animated.View style={[styles.squareInner, { transform: [{ scale }] }]}>
        <ChevronLeft size={22} color={THEME.colors.accent.brown} strokeWidth={2.2} />
      </Animated.View>
    </Pressable>
  );
}

/**
 * The one header every screen below the Loader uses. Screens change the slots,
 * never the markup - inline header markup copied per screen is exactly how the
 * padding and badge styling drift apart.
 */
function StationHeaderBase({
  eyebrow,
  title,
  onBack,
  leftSlot,
  rightSlot,
  align = 'center',
  sideWidth = 104,
}: {
  eyebrow?: string;
  title?: string;
  onBack?: () => void;
  leftSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
  align?: 'center' | 'left';
  /** Matched left/right gutters keep a centred title actually centred. */
  sideWidth?: number;
}) {
  return (
    <View style={styles.root}>
      <View style={styles.row}>
        <View style={[styles.side, { minWidth: sideWidth }]}>
          {onBack ? <BackSquare onPress={onBack} /> : leftSlot}
        </View>

        <View style={[styles.middle, align === 'left' ? styles.middleLeft : null]}>
          {eyebrow ? (
            <Text style={[styles.eyebrow, align === 'left' ? styles.textLeft : null]} numberOfLines={1}>
              {eyebrow}
            </Text>
          ) : null}
          {title ? (
            <Text style={[styles.title, align === 'left' ? styles.textLeft : null]} numberOfLines={1}>
              {title}
            </Text>
          ) : null}
        </View>

        <View style={[styles.side, styles.sideRight, { minWidth: sideWidth }]}>{rightSlot}</View>
      </View>
      <HairlineRule opacity={0.18} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingTop: HEADER_TOP,
    backgroundColor: 'rgba(44,36,22,0.06)',
  },
  row: {
    height: 72,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: PAGE_PAD,
  },
  side: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sideRight: { justifyContent: 'flex-end' },
  middle: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  middleLeft: { alignItems: 'flex-start' },
  textLeft: { textAlign: 'left' },
  eyebrow: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    lineHeight: 14,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.6,
    lineHeight: 20,
    color: THEME.colors.text.primary,
    textAlign: 'center',
  },
  square: { width: 44, height: 44 },
  squareInner: {
    width: 44,
    height: 44,
    borderRadius: THEME.radius.md,
    borderWidth: 1,
    borderColor: THEME.colors.accent.brown + '40',
    backgroundColor: THEME.colors.surface.tintBrown,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export const StationHeader = memo(StationHeaderBase);
export default StationHeader;
