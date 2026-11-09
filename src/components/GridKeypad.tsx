import React, { memo, useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Delete } from 'lucide-react-native';
import { HIT_SLOP, SCREEN_W, SHEET_SLIDE_MS } from '../constants/config';
import { THEME } from '../constants/theme';
import { usePressScale } from '../hooks/usePressScale';
import HairlineRule from './HairlineRule';
import PrimaryButton from './PrimaryButton';

const SHEET_W = SCREEN_W;
const PAD = 16;
const KEY_GAP = 8;
const KEY_W = Math.floor((SHEET_W - PAD * 2 - KEY_GAP * 2) / 3);
const KEY_H = 46;

function Key({ label, onPress }: { label: string; onPress: () => void }) {
  const { scale, onPressIn, onPressOut } = usePressScale(0.95);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      hitSlop={HIT_SLOP}
      style={{ width: KEY_W, height: KEY_H }}
    >
      <Animated.View style={[styles.key, { transform: [{ scale }] }]}>
        <Text style={styles.keyText}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

function DeleteKey({ onPress }: { onPress: () => void }) {
  const { scale, onPressIn, onPressOut } = usePressScale(0.95);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="DELETE"
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      hitSlop={HIT_SLOP}
      style={{ width: KEY_W, height: KEY_H }}
    >
      <Animated.View style={[styles.key, { transform: [{ scale }] }]}>
        <View style={styles.keyRow}>
          <Delete size={24} color={THEME.colors.text.brown} strokeWidth={2} />
        </View>
      </Animated.View>
    </Pressable>
  );
}

/**
 * The six-figure entry sheet. Easting first, then northing - the slot group
 * makes the reading order visible, which is the whole point of the lesson.
 */
function GridKeypadBase({
  visible,
  digits,
  hint,
  onDigit,
  onBackspace,
  onSubmit,
  onClose,
}: {
  visible: boolean;
  digits: string;
  hint?: string;
  onDigit: (d: string) => void;
  onBackspace: () => void;
  onSubmit: () => void;
  onClose: () => void;
}) {
  const slide = useRef(new Animated.Value(260)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slide, {
        toValue: visible ? 0 : 260,
        duration: SHEET_SLIDE_MS,
        useNativeDriver: true,
      }),
      Animated.timing(fade, {
        toValue: visible ? 1 : 0,
        duration: SHEET_SLIDE_MS,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible, slide, fade]);

  if (!visible) {
    return null;
  }

  const slots = (digits + '      ').slice(0, 6).split('');

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: fade }]} pointerEvents="box-none">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="CLOSE KEYPAD"
          onPress={onClose}
          style={[StyleSheet.absoluteFill, styles.backdrop]}
        />
      </Animated.View>

      <Animated.View
        pointerEvents="box-none"
        style={[styles.sheet, { transform: [{ translateY: slide }] }]}
      >
        <View style={styles.handleRow}>
          <Text style={styles.eyebrow}>SIX FIGURE REFERENCE</Text>
          <Text style={styles.order}>EASTING THEN NORTHING</Text>
        </View>
        <HairlineRule opacity={0.18} />

        <View style={styles.slotRow}>
          {slots.map((d, i) => (
            <View
              key={`slot-${i}`}
              style={[
                styles.slot,
                i === 3 ? styles.slotGap : null,
                d.trim() !== '' ? styles.slotFilled : null,
              ]}
            >
              <Text style={styles.slotText}>{d.trim() === '' ? '-' : d}</Text>
            </View>
          ))}
        </View>

        {hint ? <Text style={styles.hint}>{hint}</Text> : null}

        <View style={styles.pad}>
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(k => (
            <Key key={k} label={k} onPress={() => onDigit(k)} />
          ))}
          <DeleteKey onPress={onBackspace} />
          <Key label="0" onPress={() => onDigit('0')} />
          <View style={{ width: KEY_W, height: KEY_H }} />
        </View>

        <PrimaryButton
          label="CHECK REFERENCE"
          onPress={onSubmit}
          width={SHEET_W - PAD * 2}
          height={52}
          style={styles.cta}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: THEME.colors.surface.scrim },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: PAD,
    paddingTop: 12,
    paddingBottom: 22,
    backgroundColor: THEME.colors.surface.card,
    borderTopLeftRadius: THEME.radius.xl,
    borderTopRightRadius: THEME.radius.xl,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.line.hairlineStrong,
  },
  handleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    color: THEME.colors.text.secondary,
  },
  order: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: THEME.colors.accent.teal,
  },
  slotRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 14,
    marginBottom: 6,
    gap: 6,
  },
  slot: {
    width: 36,
    height: 44,
    borderRadius: THEME.radius.sm,
    borderWidth: 1,
    borderColor: THEME.colors.accent.brown + '40',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.surface.tintBrown,
  },
  slotGap: { marginLeft: 14 },
  slotFilled: {
    borderColor: THEME.colors.accent.teal,
    backgroundColor: THEME.colors.surface.tintTeal,
  },
  slotText: {
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 24,
    color: THEME.colors.text.primary,
  },
  hint: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    lineHeight: 16,
    color: THEME.colors.accent.terracotta,
    textAlign: 'center',
    marginTop: 4,
  },
  pad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: KEY_GAP,
    marginTop: 12,
  },
  key: {
    width: KEY_W,
    height: KEY_H,
    borderRadius: THEME.radius.md,
    borderWidth: 1,
    borderColor: THEME.colors.accent.brown + '33',
    backgroundColor: THEME.colors.surface.tintBrown,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  keyText: {
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 24,
    color: THEME.colors.text.primary,
  },
  cta: { marginTop: 14, alignSelf: 'center' },
});

export const GridKeypad = memo(GridKeypadBase);
export default GridKeypad;
