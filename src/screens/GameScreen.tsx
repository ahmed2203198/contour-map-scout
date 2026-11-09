import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Check, Crosshair, Mountain, Ruler } from 'lucide-react-native';
import ASSETS from '../assets';
import AnswerChip from '../components/AnswerChip';
import BaseplateCompass from '../components/BaseplateCompass';
import FeatureTrace from '../components/FeatureTrace';
import FloatingControlBar from '../components/FloatingControlBar';
import GridKeypad from '../components/GridKeypad';
import MapCanvas, { MapTarget } from '../components/MapCanvas';
import PaperBackground from '../components/PaperBackground';
import PrimaryButton from '../components/PrimaryButton';
import ProfilePanel from '../components/ProfilePanel';
import ScaleRuler from '../components/ScaleRuler';
import SecondaryButton from '../components/SecondaryButton';
import StationHeader from '../components/StationHeader';
import {
  CONTENT_W,
  GAME_AREA_BOTTOM_PAD,
  HIT_SLOP,
  SCREEN_W,
  TOLERANCE_BEARING_DEG,
} from '../constants/config';
import { THEME } from '../constants/theme';
import { formatGrid, profileFromHeightField } from '../game/geometry';
import { FAULT_TEXT, gradeBearing, gradeDistance, gradeFeature, gradeGrid, gradeRouteLeg } from '../game/grading';
import { LESSON_META, LessonMode, Task, buildTasks } from '../game/progress';
import { FEATURE_LABEL, FeatureKind, Sheet, heightFieldFor } from '../game/sheets';
import { LessonResult, useLessonFlow } from '../hooks/useLessonFlow';
import { Settings, formatDistance } from '../hooks/useSettings';

const BAR_INNER = SCREEN_W - 32 - 24;
const CHIP_W = Math.floor((BAR_INNER - 16) / 3);

/**
 * Skill Trail lesson host - archetype G2. One map canvas, one floating bar, and
 * only the control row changes with the task kind, so zoom, pan and the plate
 * geometry are shared by every lesson.
 */
export default function GameScreen({
  mode,
  sheet,
  settings,
  onGameOver,
  onMenu,
}: {
  mode: LessonMode;
  sheet: Sheet;
  settings: Settings;
  onGameOver: (result: LessonResult) => void;
  onMenu: () => void;
}) {
  const tasks = useMemo<Task[]>(() => buildTasks(mode, sheet), [mode, sheet]);

  const flow = useLessonFlow(tasks, onGameOver);
  const task = flow.task;

  const [selected, setSelected] = useState<string | null>(null);
  const [reading, setReading] = useState(0);
  const [digits, setDigits] = useState('');
  const [bearing, setBearing] = useState(0);
  const [keypadOpen, setKeypadOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [paused, setPaused] = useState(false);
  const [gridHint, setGridHint] = useState<string | null>(null);

  const shake = useRef(new Animated.Value(0)).current;
  const pillScale = useRef(new Animated.Value(1)).current;
  const enter = useRef(new Animated.Value(0)).current;
  const plateScale = useRef(new Animated.Value(0.97)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(enter, { toValue: 1, duration: 260, useNativeDriver: true }),
      Animated.spring(plateScale, {
        toValue: 1,
        tension: THEME.anim.entry.tension,
        friction: THEME.anim.entry.friction,
        useNativeDriver: true,
      }),
    ]).start();
  }, [enter, plateScale]);

  /** Every new task starts from a clean control row. */
  useEffect(() => {
    setSelected(null);
    setReading(0);
    setDigits('');
    setBearing(0);
    setKeypadOpen(false);
    setGridHint(null);
  }, [flow.index]);

  useEffect(() => {
    if (flow.feedback === 'correct') {
      Animated.sequence([
        Animated.timing(pillScale, { toValue: 1.12, duration: 130, useNativeDriver: true }),
        Animated.timing(pillScale, { toValue: 1, duration: 130, useNativeDriver: true }),
      ]).start();
    }
    if (flow.feedback === 'reveal') {
      Animated.sequence([
        Animated.timing(shake, { toValue: 8, duration: 60, useNativeDriver: true }),
        Animated.timing(shake, { toValue: -8, duration: 60, useNativeDriver: true }),
        Animated.timing(shake, { toValue: 6, duration: 60, useNativeDriver: true }),
        Animated.timing(shake, { toValue: 0, duration: 60, useNativeDriver: true }),
      ]).start();
    }
  }, [flow.feedback, pillScale, shake]);

  // -- grading -------------------------------------------------------------

  const answerContour = useCallback(
    (kindOrId: string, byMap: boolean) => {
      if (!task || task.kind !== 'contours' || flow.isLocked()) {
        return;
      }
      const found = sheet.features.find(f => f.id === kindOrId);
      const picked: FeatureKind = byMap ? (found ? found.kind : 'ridge') : (kindOrId as FeatureKind);
      setSelected(byMap ? kindOrId : picked);
      const verdict = gradeFeature(picked, task.feature.kind);
      flow.submit(verdict, `${task.feature.name} - ${FEATURE_LABEL[task.feature.kind]}`);
    },
    [task, flow, sheet],
  );

  const confirmScale = useCallback(() => {
    if (!task || task.kind !== 'scale' || flow.isLocked()) {
      return;
    }
    const verdict = gradeDistance(reading, task.truthKm);
    flow.submit(
      verdict,
      `${formatDistance(reading, settings.units)} OF ${formatDistance(task.truthKm, settings.units)}`,
    );
  }, [task, flow, reading, settings.units]);

  const submitGrid = useCallback(() => {
    if (!task || task.kind !== 'grids' || flow.isLocked()) {
      return;
    }
    const verdict = gradeGrid(digits, task.truth);
    if (verdict === 'wrong' && gridHint === null) {
      setGridHint('EASTING FIRST, THEN NORTHING - READ ALONG, THEN UP');
    }
    setKeypadOpen(false);
    flow.submit(verdict, `${task.place} ${formatGrid(digits || '......')}`);
  }, [task, flow, digits, gridHint]);

  const submitBearing = useCallback(() => {
    if (!task || task.kind !== 'bearings' || flow.isLocked()) {
      return;
    }
    const verdict = gradeBearing(bearing, task.truth);
    // On a route mission the debrief also reports what the ground does to this
    // leg - a bearing can be dead right and still walk you into the cliff band.
    const fault = mode === 'route' ? gradeRouteLeg(task.from, task.to, sheet) : 'none';
    const note = fault === 'none' ? '' : ` - ${FAULT_TEXT[fault]}`;
    flow.submit(verdict, `${task.place} ${Math.round(bearing)} DEG${note}`);
  }, [task, flow, bearing, mode, sheet]);

  const onTargetTap = useCallback(
    (id: string) => {
      answerContour(id, true);
    },
    [answerContour],
  );

  const onDigit = useCallback((d: string) => {
    setDigits(prev => (prev.length >= 6 ? prev : prev + d));
  }, []);

  const onBackspace = useCallback(() => {
    setDigits(prev => prev.slice(0, -1));
  }, []);

  const toggleProfile = useCallback(() => {
    setProfileOpen(prev => !prev);
  }, []);

  // -- derived view data ---------------------------------------------------

  const targets: MapTarget[] = useMemo(() => {
    if (!task || task.kind !== 'contours') {
      return [];
    }
    return sheet.features.map(f => ({ id: f.id, p: f.target, label: f.name }));
  }, [task, sheet]);

  const profile = useMemo(() => {
    const field = heightFieldFor(sheet);
    const from = { x: 0.08, y: 0.42 };
    const to = { x: 0.92, y: 0.58 };
    return profileFromHeightField(field, from, to, 36);
  }, [sheet]);

  const routePath = useMemo(
    () => (mode === 'route' ? sheet.checkpoints.map(c => c.p) : null),
    [mode, sheet],
  );

  const meta = LESSON_META[mode];
  const traceFeature = task && task.kind === 'contours' ? task.feature : null;
  const blink = task && task.kind === 'grids' ? task.point : null;

  const controls = () => {
    if (!task) {
      return null;
    }
    if (task.kind === 'contours') {
      return (
        <View style={styles.contourControls} pointerEvents="box-none">
          <View style={styles.chipRow} pointerEvents="box-none">
            {task.options.map(opt => (
              <AnswerChip
                key={opt}
                label={FEATURE_LABEL[opt]}
                active={selected === opt}
                onPress={() => answerContour(opt, false)}
                width={CHIP_W}
                disabled={flow.feedback !== 'idle'}
              />
            ))}
          </View>
          <SecondaryButton
            label={profileOpen ? 'HIDE PROFILE' : 'SHOW PROFILE'}
            Icon={Mountain}
            onPress={toggleProfile}
            width={BAR_INNER}
            height={44}
            tone="teal"
          />
        </View>
      );
    }

    if (task.kind === 'scale') {
      return (
        <View style={styles.splitRow} pointerEvents="box-none">
          <View style={styles.readingBlock}>
            <Text style={styles.readingLabel}>READING</Text>
            <Text style={styles.reading}>{formatDistance(reading, settings.units)}</Text>
          </View>
          <PrimaryButton
            label="CONFIRM"
            Icon={Ruler}
            onPress={confirmScale}
            width={168}
            height={48}
            disabled={flow.feedback !== 'idle'}
          />
        </View>
      );
    }

    if (task.kind === 'grids') {
      return (
        <View style={styles.splitRow} pointerEvents="box-none">
          <View style={styles.readingBlock}>
            <Text style={styles.readingLabel}>REFERENCE</Text>
            <Text style={styles.reading}>{digits.length > 0 ? formatGrid(digits) : '--- ---'}</Text>
          </View>
          <PrimaryButton
            label="ENTER REF"
            Icon={Crosshair}
            onPress={() => setKeypadOpen(true)}
            width={168}
            height={48}
            disabled={flow.feedback !== 'idle'}
          />
        </View>
      );
    }

    return (
      <View style={styles.splitRow} pointerEvents="box-none">
        <View style={styles.readingBlock}>
          <Text style={styles.readingLabel}>{`BEARING - ${TOLERANCE_BEARING_DEG} DEG`}</Text>
          <Text style={styles.reading}>{`${Math.round(bearing)} DEG`}</Text>
        </View>
        <PrimaryButton
          label="SET BEARING"
          Icon={Check}
          onPress={submitBearing}
          width={168}
          height={48}
          disabled={flow.feedback !== 'idle'}
        />
      </View>
    );
  };

  return (
    <PaperBackground variant="game">
      <View style={styles.root}>
        <StationHeader
          eyebrow={meta.label}
          title={`TASK ${Math.min(flow.index + 1, flow.total)} / ${flow.total}`}
          onBack={onMenu}
          rightSlot={
            <View style={styles.headRight} pointerEvents="box-none">
              <Animated.View
                style={[styles.accuracyPill, { transform: [{ scale: pillScale }] }]}
                pointerEvents="box-none"
              >
                <Text style={styles.accuracyText}>{`${flow.accuracy}%`}</Text>
              </Animated.View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="PAUSE"
                onPress={() => setPaused(true)}
                hitSlop={HIT_SLOP}
                style={styles.pauseBtn}
              >
                <Image source={ASSETS.iconPause} style={styles.pauseGlyph} resizeMode="contain" />
              </Pressable>
            </View>
          }
        />

        <Animated.View
          style={[styles.gameArea, { opacity: enter }]}
          pointerEvents="box-none"
        >
          <Animated.View style={{ transform: [{ scale: plateScale }] }} pointerEvents="box-none">
            <MapCanvas
              sheet={sheet}
              targets={targets}
              onTargetTap={onTargetTap}
              blink={blink}
              routePath={routePath}
            >
              <FeatureTrace feature={traceFeature} state={flow.feedback} />
              {task && task.kind === 'scale' ? (
                <ScaleRuler
                  key={task.id}
                  path={task.path}
                  onReading={setReading}
                  disabled={flow.feedback !== 'idle'}
                />
              ) : null}
            </MapCanvas>
          </Animated.View>

          {task && task.kind === 'bearings' ? (
            <View style={styles.compassWrap} pointerEvents="box-none">
              <BaseplateCompass
                resetKey={task.id}
                sensitivity={settings.sensitivity}
                hapticsOn={settings.haptics}
                onBearing={setBearing}
                disabled={flow.feedback !== 'idle'}
              />
            </View>
          ) : null}
        </Animated.View>

        <View style={styles.profileSlot} pointerEvents="box-none">
          <ProfilePanel
            open={profileOpen}
            points={profile.points}
            minH={profile.minH}
            maxH={profile.maxH}
            cursorT={0.5}
          />
        </View>

        <FloatingControlBar eyebrow={`${meta.label} - ${task ? task.leg : ''}`} task={task ? task.prompt : ''} shake={shake}>
          {controls()}
        </FloatingControlBar>

        <GridKeypad
          visible={keypadOpen}
          digits={digits}
          hint={gridHint ?? undefined}
          onDigit={onDigit}
          onBackspace={onBackspace}
          onSubmit={submitGrid}
          onClose={() => setKeypadOpen(false)}
        />

        {paused ? (
          <View style={styles.pauseOverlay}>
            <View style={styles.pauseCard}>
              <Text style={styles.pauseTitle}>PAUSED</Text>
              <View style={styles.pauseRule} />
              <Text style={styles.pauseBody}>THE SHEET KEEPS YOUR PLACE. NOTHING IS TIMED.</Text>
              <PrimaryButton
                label="RESUME"
                onPress={() => setPaused(false)}
                width={CONTENT_W - 40}
                height={56}
                style={styles.pauseCta}
              />
              <SecondaryButton
                label="RANGER STATION"
                onPress={onMenu}
                width={CONTENT_W - 40}
                height={48}
              />
            </View>
          </View>
        ) : null}
      </View>
    </PaperBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
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
  pauseBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  pauseGlyph: { width: 24, height: 24 },
  gameArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: GAME_AREA_BOTTOM_PAD,
  },
  compassWrap: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: GAME_AREA_BOTTOM_PAD - 24,
  },
  profileSlot: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: GAME_AREA_BOTTOM_PAD - 48,
    alignItems: 'center',
  },
  contourControls: { width: '100%', gap: 8 },
  chipRow: { flexDirection: 'row', gap: 8, justifyContent: 'space-between' },
  splitRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  readingBlock: { flexShrink: 1, paddingRight: 10 },
  readingLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.8,
    lineHeight: 14,
    color: THEME.colors.text.secondary,
  },
  reading: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.6,
    lineHeight: 26,
    color: THEME.colors.accent.teal,
  },
  pauseOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(44,36,22,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  pauseCard: {
    width: CONTENT_W,
    padding: 20,
    alignItems: 'center',
    backgroundColor: THEME.colors.surface.card,
    borderWidth: 1,
    borderColor: THEME.colors.line.hairlineStrong,
    borderRadius: THEME.radius.xl,
  },
  pauseTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 3,
    lineHeight: 30,
    color: THEME.colors.text.primary,
  },
  pauseRule: {
    width: 64,
    height: 2,
    backgroundColor: THEME.colors.accent.teal,
    marginTop: 10,
    marginBottom: 12,
  },
  pauseBody: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.2,
    lineHeight: 16,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
    marginBottom: 18,
  },
  pauseCta: { marginBottom: 10 },
});
