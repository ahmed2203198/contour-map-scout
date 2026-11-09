import React, { memo } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import ASSETS from '../assets';
import { THEME } from '../constants/theme';
import type { LegResult } from '../hooks/useLessonFlow';

const MARKERS = ['[A]', '[B]', '[C]', '[D]', '[E]', '[F]', '[G]', '[H]'];

/**
 * The per-leg debrief rows. ASCII bracket markers, never emoji - a set of
 * high-codepoint glyphs collapses to one fallback character on Android.
 */
function CheckpointListBase({ legs }: { legs: LegResult[] }) {
  const rows = legs.slice(0, 4);
  if (rows.length === 0) {
    return null;
  }
  return (
    <View style={styles.list}>
      {rows.map((leg, i) => (
        <View key={`${leg.label}-${i}`} style={styles.row}>
          <Image source={ASSETS.sprite5} style={styles.flag} resizeMode="contain" />
          <Text style={styles.marker}>{MARKERS[i]}</Text>
          <Text style={styles.detail} numberOfLines={1}>
            {leg.detail}
          </Text>
          <Text style={[styles.verdict, { color: leg.ok ? THEME.colors.accent.teal : THEME.colors.accent.terracotta }]}>
            {leg.ok ? 'OK' : '1 ERROR'}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { width: '100%' },
  row: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.line.hairline,
    gap: 8,
  },
  flag: { width: 22, height: 22 },
  marker: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
    lineHeight: 16,
    color: THEME.colors.text.brown,
    width: 30,
  },
  detail: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.8,
    lineHeight: 16,
    color: THEME.colors.text.primary,
  },
  verdict: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    lineHeight: 16,
  },
});

export const CheckpointList = memo(CheckpointListBase);
export default CheckpointList;
