import React, { memo, useCallback } from 'react';
import { FlatList, Image, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import ASSETS from '../assets';
import PaperBackground from '../components/PaperBackground';
import SecondaryButton from '../components/SecondaryButton';
import StationHeader from '../components/StationHeader';
import { CONTENT_W, PAGE_PAD } from '../constants/config';
import { THEME } from '../constants/theme';

const BROWN = THEME.colors.accent.brown;
const TEAL = THEME.colors.accent.teal;
const INK = THEME.colors.text.primary;
const ROW_H = 64;

type GlyphKind =
  | 'index'
  | 'intermediate'
  | 'spot'
  | 'ridge'
  | 'spur'
  | 'reentrant'
  | 'saddle'
  | 'river'
  | 'ford'
  | 'footpath'
  | 'checkpoint'
  | 'north';

type Entry = { kind: GlyphKind; term: string; definition: string };

const ENTRIES: Entry[] = [
  { kind: 'index', term: 'INDEX CONTOUR', definition: 'Heavier line, labelled with its height in metres' },
  { kind: 'intermediate', term: 'CONTOUR', definition: 'Every 10 m of height between index lines' },
  { kind: 'spot', term: 'SPOT HEIGHT', definition: 'A surveyed point with its exact height' },
  { kind: 'ridge', term: 'RIDGE', definition: 'High ground running on, contours bending downhill' },
  { kind: 'spur', term: 'SPUR', definition: 'A short finger of high ground off a ridge' },
  { kind: 'reentrant', term: 'RE-ENTRANT', definition: 'A narrow fold cut into the slope, often wet' },
  { kind: 'saddle', term: 'SADDLE', definition: 'The low neck of ground between two tops' },
  { kind: 'river', term: 'RIVER', definition: 'Water always runs along the lowest line' },
  { kind: 'ford', term: 'FORD', definition: 'The one safe crossing on this sheet' },
  { kind: 'footpath', term: 'FOOTPATH', definition: 'Dashed - the only broken brown line here' },
  { kind: 'checkpoint', term: 'CHECKPOINT', definition: 'A mission waypoint you must quote and walk to' },
  { kind: 'north', term: 'GRID NORTH', definition: 'Up the sheet. Bearings are taken from it' },
];

function GlyphBase({ kind }: { kind: GlyphKind }) {
  return (
    <Svg width={28} height={28} viewBox="0 0 28 28">
      {kind === 'index' ? <Path d="M2 20 Q 9 8 14 14 T 26 10" stroke={BROWN} strokeWidth={2.6} fill="none" /> : null}
      {kind === 'intermediate' ? <Path d="M2 20 Q 9 8 14 14 T 26 10" stroke={BROWN} strokeWidth={1.2} fill="none" /> : null}
      {kind === 'spot' ? (
        <>
          <Circle cx={10} cy={16} r={2.6} fill={INK} />
          <Rect x={15} y={11} width={10} height={2} fill={INK} opacity={0.5} />
        </>
      ) : null}
      {kind === 'ridge' ? (
        <>
          <Path d="M3 22 Q 14 4 25 22" stroke={BROWN} strokeWidth={1.4} fill="none" />
          <Path d="M6 24 Q 14 10 22 24" stroke={BROWN} strokeWidth={1.4} fill="none" />
        </>
      ) : null}
      {kind === 'spur' ? (
        <>
          <Path d="M3 10 Q 14 14 25 10" stroke={BROWN} strokeWidth={1.4} fill="none" />
          <Path d="M3 18 Q 14 24 25 18" stroke={BROWN} strokeWidth={1.4} fill="none" />
        </>
      ) : null}
      {kind === 'reentrant' ? (
        <>
          <Path d="M3 8 L 14 18 L 25 8" stroke={BROWN} strokeWidth={1.4} fill="none" />
          <Path d="M3 16 L 14 25 L 25 16" stroke={BROWN} strokeWidth={1.4} fill="none" />
        </>
      ) : null}
      {kind === 'saddle' ? (
        <>
          <Circle cx={8} cy={14} r={5} stroke={BROWN} strokeWidth={1.4} fill="none" />
          <Circle cx={20} cy={14} r={5} stroke={BROWN} strokeWidth={1.4} fill="none" />
        </>
      ) : null}
      {kind === 'river' ? <Path d="M2 8 Q 10 16 14 14 T 26 22" stroke={TEAL} strokeWidth={3} strokeLinecap="round" fill="none" /> : null}
      {kind === 'ford' ? (
        <>
          <Path d="M2 14 L 26 14" stroke={TEAL} strokeWidth={3} strokeLinecap="round" fill="none" />
          <Rect x={11} y={11} width={6} height={6} fill={THEME.colors.bg.paper} />
        </>
      ) : null}
      {kind === 'footpath' ? <Line x1={2} y1={14} x2={26} y2={14} stroke={BROWN} strokeWidth={2} strokeDasharray="5,4" /> : null}
      {kind === 'checkpoint' ? <Circle cx={14} cy={14} r={7} fill={THEME.colors.bg.paper} stroke={TEAL} strokeWidth={2} /> : null}
      {kind === 'north' ? (
        <>
          <Line x1={14} y1={24} x2={14} y2={8} stroke={TEAL} strokeWidth={2} strokeLinecap="round" />
          <Path d="M9 12 L 14 4 L 19 12 Z" fill={TEAL} />
        </>
      ) : null}
    </Svg>
  );
}
const Glyph = memo(GlyphBase);

function RowBase({ entry }: { entry: Entry }) {
  return (
    <View style={styles.row}>
      <View style={styles.glyphWrap}>
        <Glyph kind={entry.kind} />
      </View>
      <View style={styles.rowText}>
        <Text style={styles.term} numberOfLines={1}>
          {entry.term}
        </Text>
        <Text style={styles.definition} numberOfLines={2}>
          {entry.definition}
        </Text>
      </View>
    </View>
  );
}
const Row = memo(RowBase);

function FieldKit() {
  return (
    <View style={styles.kit}>
      <Text style={styles.kitEyebrow}>FIELD KIT</Text>
      <View style={styles.kitRow}>
        <Image source={ASSETS.sprite2} style={styles.kitArt} resizeMode="contain" />
        <Image source={ASSETS.sprite3} style={styles.kitArt} resizeMode="contain" />
        <Image source={ASSETS.sprite5} style={styles.kitArt} resizeMode="contain" />
      </View>
    </View>
  );
}

function Terminology() {
  return (
    <View style={styles.terms}>
      <Text style={styles.termsTitle}>TERMINOLOGY</Text>
      <Text style={styles.termsBody}>
        CONTOUR INTERVAL - 10 m on this sheet. Lines packed close together mean steep ground.
      </Text>
      <Text style={styles.termsBody}>
        SCALE - 1:25 000. One grid square is one kilometre of real ground.
      </Text>
      <Text style={styles.termsBody}>
        READING ORDER - easting before northing. Read along the bottom, then up the side.
      </Text>
      <Text style={styles.termsBody}>
        BACK BEARING - add 180 to a bearing under 180, subtract 180 from one over it.
      </Text>
    </View>
  );
}

/**
 * The reference sheet. No ScrollView wrapper - a FlatList fills the flex band
 * between the fixed header and the fixed footer button.
 */
export default function LegendScreen({ onBack }: { onBack: () => void }) {
  const renderItem = useCallback(({ item }: { item: Entry }) => <Row entry={item} />, []);
  const keyExtractor = useCallback((item: Entry) => item.term, []);
  const getItemLayout = useCallback(
    (_data: ArrayLike<Entry> | null | undefined, index: number) => ({
      length: ROW_H,
      offset: ROW_H * index,
      index,
    }),
    [],
  );

  return (
    <PaperBackground variant="menu">
      <View style={styles.root}>
        <StationHeader eyebrow="REFERENCE" title="MAP LEGEND" onBack={onBack} />

        <View style={styles.listBand}>
          <FlatList
            data={ENTRIES}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            getItemLayout={getItemLayout}
            ListHeaderComponent={FieldKit}
            ListFooterComponent={Terminology}
            initialNumToRender={8}
            windowSize={5}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />
        </View>

        <View style={styles.footer}>
          <SecondaryButton label="BACK TO STATION" onPress={onBack} width={CONTENT_W} height={48} />
        </View>
      </View>
    </PaperBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  listBand: { flex: 1 },
  listContent: { paddingHorizontal: PAGE_PAD, paddingBottom: 12 },
  row: {
    height: ROW_H,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.line.hairline,
    gap: 12,
  },
  glyphWrap: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1 },
  term: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.4,
    lineHeight: 17,
    color: THEME.colors.text.primary,
  },
  definition: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.3,
    lineHeight: 15,
    color: THEME.colors.text.secondary,
    marginTop: 2,
  },
  kit: { paddingVertical: 12 },
  kitEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    lineHeight: 14,
    color: THEME.colors.text.secondary,
    marginBottom: 8,
  },
  kitRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  kitArt: { width: 56, height: 56 },
  terms: { paddingTop: 16, paddingBottom: 8 },
  termsTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2.2,
    lineHeight: 16,
    color: THEME.colors.text.brown,
    marginBottom: 8,
  },
  termsBody: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.2,
    lineHeight: 18,
    color: THEME.colors.text.secondary,
    marginBottom: 8,
  },
  footer: {
    paddingHorizontal: PAGE_PAD,
    paddingTop: 10,
    paddingBottom: 18,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.line.hairline,
  },
});
