import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Image, StyleSheet, Text, View } from 'react-native';
import { Award, Home, Mountain, RotateCcw, Target } from 'lucide-react-native';
import ASSETS from '../assets';
import CheckpointList from '../components/CheckpointList';
import HairlineRule from '../components/HairlineRule';
import PaperBackground from '../components/PaperBackground';
import PrimaryButton from '../components/PrimaryButton';
import SecondaryButton from '../components/SecondaryButton';
import StationHeader from '../components/StationHeader';
import { StatItem, StatRow } from '../components/StatCard';
import { CONTENT_W, PAGE_PAD } from '../constants/config';
import { THEME } from '../constants/theme';
import { LESSON_META, LessonMode, missionStats } from '../game/progress';
import { Sheet } from '../game/sheets';
import { LessonResult } from '../hooks/useLessonFlow';
import { Settings, formatDistance } from '../hooks/useSettings';

/**
 * Mission Debrief. Decoration stays strictly outside the verdict's bounding box -
 * a stroke through a letter turns "ROUTE" into something else entirely.
 */
export default function GameOverScreen({
  result,
  mode,
  sheet,
  settings,
  onPlayAgain,
  onMenu,
}: {
  result: LessonResult;
  mode: LessonMode;
  sheet: Sheet;
  settings: Settings;
  onPlayAgain: () => void;
  onMenu: () => void;
}) {
  const pop = useRef(new Animated.Value(0.88)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const statsIn = useRef(new Animated.Value(0)).current;
  const listIn = useRef(new Animated.Value(0)).current;

  const meta = LESSON_META[mode];
  const passed = result.accuracy >= 60;
  const verdict = mode === 'route'
    ? passed ? 'ROUTE COMPLETE' : 'ROUTE ABANDONED'
    : passed ? 'LESSON COMPLETE' : 'LESSON MISSED';

  const stats = useMemo(() => missionStats(sheet, result.errors), [sheet, result.errors]);

  useEffect(() => {
    Animated.stagger(80, [
      Animated.parallel([
        Animated.timing(fade, { toValue: 1, duration: 360, useNativeDriver: true }),
        Animated.spring(pop, {
          toValue: 1,
          tension: THEME.anim.pop.tension,
          friction: THEME.anim.pop.friction,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(statsIn, { toValue: 1, duration: 320, useNativeDriver: true }),
      Animated.timing(listIn, { toValue: 1, duration: 320, useNativeDriver: true }),
    ]).start();
  }, [fade, pop, statsIn, listIn]);

  const items: StatItem[] = [
    {
      key: 'route',
      Icon: Target,
      value: formatDistance(stats.routeKm, settings.units),
      label: 'ROUTE',
      valueColor: THEME.colors.accent.teal,
    },
    {
      key: 'climb',
      Icon: Mountain,
      value: `${stats.climbM} M`,
      label: 'CLIMB',
      valueColor: THEME.colors.accent.brown,
    },
    {
      key: 'score',
      Icon: Award,
      value: `${result.correct}/${result.total}`,
      label: 'CORRECT',
      valueColor: THEME.colors.accent.terracotta,
    },
  ];

  return (
    <PaperBackground variant="debrief">
      <View style={styles.root}>
        <StationHeader
          eyebrow="MISSION DEBRIEF"
          title={sheet.name}
          rightSlot={
            <View style={styles.accuracyPill}>
              <Text style={styles.accuracyText}>{`${result.accuracy}%`}</Text>
            </View>
          }
        />

        <Animated.View
          style={[styles.verdictBlock, { opacity: fade, transform: [{ scale: pop }] }]}
          pointerEvents="box-none"
        >
          <Text style={styles.verdict}>{verdict}</Text>
          <HairlineRule width={72} height={2} color={THEME.colors.accent.teal} opacity={1} style={styles.verdictRule} />
          <Image source={ASSETS.sprite4} style={styles.badge} resizeMode="contain" />
        </Animated.View>

        <Animated.View style={[styles.statsWrap, { opacity: statsIn }]} pointerEvents="box-none">
          <StatRow items={items} />
        </Animated.View>

        <View style={styles.skillStrip}>
          <Text style={styles.skillEyebrow}>SKILL EARNED</Text>
          <Text style={styles.skillName} numberOfLines={1}>
            {meta.skill}
          </Text>
        </View>

        <Animated.View style={[styles.legBand, { opacity: listIn }]} pointerEvents="box-none">
          <CheckpointList legs={result.legs} />
        </Animated.View>

        <View style={styles.ctaBlock} pointerEvents="box-none">
          <PrimaryButton
            label="PLAN AGAIN"
            Icon={RotateCcw}
            onPress={onPlayAgain}
            width={CONTENT_W}
            height={60}
            style={styles.primaryCta}
          />
          <SecondaryButton label="RANGER STATION" Icon={Home} onPress={onMenu} width={CONTENT_W} height={48} />
        </View>
      </View>
    </PaperBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingBottom: 20 },
  accuracyPill: {
    width: 52,
    height: 32,
    borderRadius: THEME.radius.sm,
    borderWidth: 1,
    borderColor: THEME.colors.line.hairlineTeal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accuracyText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.4,
    lineHeight: 16,
    color: THEME.colors.accent.teal,
  },
  verdictBlock: { alignItems: 'center', marginTop: 20 },
  verdict: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 2.5,
    lineHeight: 34,
    color: THEME.colors.text.primary,
    textAlign: 'center',
  },
  verdictRule: { marginTop: 12 },
  badge: { width: 84, height: 84, marginTop: 14 },
  statsWrap: { marginHorizontal: PAGE_PAD, marginTop: 16 },
  skillStrip: {
    marginHorizontal: PAGE_PAD,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: THEME.colors.line.hairlineTeal,
    borderRadius: THEME.radius.md,
    backgroundColor: THEME.colors.surface.card,
  },
  skillEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    lineHeight: 14,
    color: THEME.colors.text.secondary,
  },
  skillName: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.2,
    lineHeight: 18,
    color: THEME.colors.accent.teal,
  },
  legBand: {
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
    marginHorizontal: PAGE_PAD,
    marginTop: 10,
  },
  ctaBlock: { marginHorizontal: PAGE_PAD, marginTop: 14 },
  primaryCta: { marginBottom: 10 },
});
