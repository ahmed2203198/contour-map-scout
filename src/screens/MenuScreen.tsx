import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Image, StyleSheet, Text, View } from 'react-native';
import { Award, BookOpen, Map, Mountain, Settings as SettingsIcon, Target } from 'lucide-react-native';
import ASSETS from '../assets';
import HairlineRule from '../components/HairlineRule';
import PaperBackground from '../components/PaperBackground';
import PrimaryButton from '../components/PrimaryButton';
import SecondaryButton from '../components/SecondaryButton';
import StationHeader from '../components/StationHeader';
import { StatRow, StatItem } from '../components/StatCard';
import { CONTENT_W, HALF_W, MISSION_CHECKPOINTS, PAGE_PAD } from '../constants/config';
import { THEME } from '../constants/theme';
import { kmBetween } from '../game/geometry';
import { Sheet } from '../game/sheets';
import { LESSON_META, Progress, SKILL_ORDER, nextLesson, skillsEarned } from '../game/progress';

/**
 * Ranger Station - archetype M4, asymmetric editorial. The title is flush-left,
 * the hero sheet art sits right-and-down in a flexible band, and the CTA sits
 * bottom-left above the two hairline footer buttons.
 */
export default function MenuScreen({
  progress,
  sheet,
  onStart,
  onLegend,
  onSettings,
}: {
  progress: Progress;
  sheet: Sheet;
  onStart: () => void;
  onLegend: () => void;
  onSettings: () => void;
}) {
  const fade = useRef(new Animated.Value(0)).current;
  const lift = useRef(new Animated.Value(18)).current;
  const cardIn = useRef(new Animated.Value(0)).current;
  const ctaIn = useRef(new Animated.Value(0.94)).current;
  const stripIn = useRef(new Animated.Value(0)).current;
  const pillPulse = useRef(new Animated.Value(1)).current;

  const earned = skillsEarned(progress);
  const lesson = nextLesson(progress);
  const meta = LESSON_META[lesson];

  const missionKm = useMemo(() => {
    const cps = sheet.checkpoints;
    let km = 0;
    for (let i = 1; i < cps.length; i++) {
      km += kmBetween(cps[i - 1].p, cps[i].p);
    }
    return km.toFixed(1);
  }, [sheet]);

  useEffect(() => {
    Animated.stagger(90, [
      Animated.parallel([
        Animated.timing(fade, { toValue: 1, duration: 420, useNativeDriver: true }),
        Animated.timing(lift, { toValue: 0, duration: 420, useNativeDriver: true }),
      ]),
      Animated.timing(cardIn, { toValue: 1, duration: 360, useNativeDriver: true }),
      Animated.spring(ctaIn, {
        toValue: 1,
        tension: THEME.anim.entry.tension,
        friction: THEME.anim.entry.friction,
        useNativeDriver: true,
      }),
      Animated.timing(stripIn, { toValue: 1, duration: 360, useNativeDriver: true }),
    ]).start();
  }, [fade, lift, cardIn, ctaIn, stripIn]);

  useEffect(() => {
    if (earned === 0) {
      return;
    }
    Animated.sequence([
      Animated.timing(pillPulse, { toValue: 1.12, duration: 130, useNativeDriver: true }),
      Animated.timing(pillPulse, { toValue: 1, duration: 130, useNativeDriver: true }),
    ]).start();
  }, [earned, pillPulse]);

  const accuracy = (id: (typeof SKILL_ORDER)[number]) => progress.lastAccuracy[id];

  const stats: StatItem[] = [
    {
      key: 'contours',
      Icon: Mountain,
      value: accuracy('contours') > 0 ? `${accuracy('contours')}%` : '0',
      label: 'CONTOURS',
      valueColor: THEME.colors.accent.teal,
    },
    {
      key: 'grids',
      Icon: Target,
      value: accuracy('grids') > 0 ? `${accuracy('grids')}%` : '0',
      label: 'GRIDS',
      valueColor: THEME.colors.accent.brown,
    },
    {
      key: 'best',
      Icon: Award,
      value: progress.bestStreak > 0 ? String(progress.bestStreak) : '0',
      label: 'BEST RUN',
      valueColor: THEME.colors.accent.terracotta,
    },
  ];

  return (
    <PaperBackground variant="menu">
      <View style={styles.root}>
        <StationHeader
          align="left"
          sideWidth={34}
          eyebrow="RANGER STATION"
          title={sheet.name}
          leftSlot={<Image source={ASSETS.iconHome} style={styles.stationGlyph} resizeMode="contain" />}
          rightSlot={
            <Animated.View style={[styles.skillPill, { transform: [{ scale: pillPulse }] }]} pointerEvents="box-none">
              <Text style={styles.skillText}>{`SKILLS ${earned}/${SKILL_ORDER.length}`}</Text>
            </Animated.View>
          }
        />

        <Animated.View
          style={[styles.heroBlock, { opacity: fade, transform: [{ translateY: lift }] }]}
          pointerEvents="box-none"
        >
          <Text style={styles.hero}>CONTOUR</Text>
          <Text style={styles.hero}>MAP</Text>
          <Text style={[styles.hero, styles.heroAccent]}>SCOUT</Text>
          <HairlineRule width={140} opacity={0.24} style={styles.heroRule} />
          <Text style={styles.tagline}>A FIELD COURSE IN READING TERRAIN</Text>
        </Animated.View>

        <View style={styles.artBand}>
          <Image source={ASSETS.sprite1} style={styles.heroArt} resizeMode="contain" />
        </View>

        <Animated.View style={[styles.missionCard, { opacity: cardIn }]} pointerEvents="box-none">
          <Text style={styles.cardEyebrow}>NEXT MISSION</Text>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {meta.mission}
          </Text>
          <View style={styles.metaRow}>
            <View style={styles.metaChip}>
              <Text style={styles.metaText}>{`${MISSION_CHECKPOINTS} CHECKPOINTS`}</Text>
            </View>
            <View style={styles.metaChip}>
              <Text style={styles.metaText}>{`${missionKm} KM`}</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View style={[styles.statStrip, { opacity: stripIn }]} pointerEvents="box-none">
          <StatRow items={stats} />
        </Animated.View>

        <Text style={styles.hint}>{`HOW TO PLAY - ${meta.label} - TAP THE LANDFORM`}</Text>

        <Animated.View style={[styles.ctaWrap, { transform: [{ scale: ctaIn }] }]} pointerEvents="box-none">
          <PrimaryButton label="START MISSION" Icon={Map} onPress={onStart} width={CONTENT_W} height={60} />
        </Animated.View>

        <View style={styles.footerRow} pointerEvents="box-none">
          <SecondaryButton label="MAP LEGEND" Icon={BookOpen} onPress={onLegend} width={HALF_W} height={48} />
          <SecondaryButton label="SETTINGS" Icon={SettingsIcon} onPress={onSettings} width={HALF_W} height={48} />
        </View>
      </View>
    </PaperBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingBottom: 18 },
  stationGlyph: { width: 24, height: 24 },
  skillPill: {
    height: 32,
    paddingHorizontal: 12,
    borderRadius: THEME.radius.sm,
    borderWidth: 1,
    borderColor: THEME.colors.accent.brown + '55',
    backgroundColor: THEME.colors.bg.paper,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skillText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    lineHeight: 16,
    color: THEME.colors.text.brown,
  },
  heroBlock: { paddingLeft: PAGE_PAD, marginTop: 22 },
  hero: {
    fontSize: 38,
    fontWeight: '800',
    letterSpacing: 2,
    lineHeight: 40,
    color: THEME.colors.text.primary,
  },
  heroAccent: { color: THEME.colors.accent.brown },
  heroRule: { marginTop: 12 },
  tagline: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.6,
    lineHeight: 16,
    color: THEME.colors.text.secondary,
    marginTop: 10,
    maxWidth: 240,
  },
  artBand: {
    flex: 1,
    minHeight: 72,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingRight: 8,
  },
  heroArt: { width: '60%', height: '96%', maxHeight: 190 },
  missionCard: {
    marginHorizontal: PAGE_PAD,
    padding: 14,
    backgroundColor: THEME.colors.surface.card,
    borderWidth: 1,
    borderColor: THEME.colors.accent.brown + '33',
    borderRadius: THEME.radius.lg,
  },
  cardEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    lineHeight: 14,
    color: THEME.colors.text.secondary,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.4,
    lineHeight: 22,
    color: THEME.colors.text.primary,
    marginTop: 4,
  },
  metaRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  metaChip: {
    height: 26,
    paddingHorizontal: 10,
    borderRadius: THEME.radius.sm,
    borderWidth: 1,
    borderColor: THEME.colors.line.hairlineTeal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    lineHeight: 15,
    color: THEME.colors.accent.teal,
  },
  statStrip: { marginHorizontal: PAGE_PAD, marginTop: 12 },
  hint: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.6,
    lineHeight: 14,
    color: THEME.colors.text.secondary,
    marginHorizontal: PAGE_PAD,
    marginTop: 14,
    marginBottom: 8,
  },
  ctaWrap: { marginHorizontal: PAGE_PAD },
  footerRow: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: PAGE_PAD,
    marginTop: 12,
  },
});
