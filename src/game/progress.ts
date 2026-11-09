import { MISSION_CHECKPOINTS, TASKS_PER_LESSON } from '../constants/config';
import { Pt, bearingBetween, gridDigitsFor, kmBetween, polylineLength, toKilometres } from './geometry';
import { FEATURE_LABEL, Feature, FeatureKind, Sheet } from './sheets';

export type LessonMode = 'contours' | 'scale' | 'grids' | 'bearings' | 'route';

export const LESSON_ORDER: LessonMode[] = ['contours', 'scale', 'grids', 'bearings', 'route'];

export type SkillId = 'contours' | 'scale' | 'grids' | 'bearings';

export const SKILL_ORDER: SkillId[] = ['contours', 'scale', 'grids', 'bearings'];

export type Progress = {
  skills: Record<SkillId, boolean>;
  bestStreak: number;
  lastAccuracy: Record<SkillId, number>;
};

export const EMPTY_PROGRESS: Progress = {
  skills: { contours: false, scale: false, grids: false, bearings: false },
  bestStreak: 0,
  lastAccuracy: { contours: 0, scale: 0, grids: 0, bearings: 0 },
};

export const LESSON_META: Record<LessonMode, { label: string; skill: string; mission: string }> = {
  contours: { label: 'TERRAIN READER', skill: 'CONTOUR READING', mission: 'HARROW TOP SURVEY' },
  scale: { label: 'SCALE RULER', skill: 'SCALE MEASURING', mission: 'FORD LINE MEASURE' },
  grids: { label: 'GRID REFERENCE', skill: 'GRID REFERENCING', mission: 'SIX FIGURE SWEEP' },
  bearings: { label: 'COMPASS BEARING', skill: 'BEARING SETTING', mission: 'BEZEL DRILL' },
  route: { label: 'ROUTE MISSION', skill: 'ROUTE PLANNING', mission: 'BEACON RIDGE TRAVERSE' },
};

export function skillsEarned(p: Progress) {
  return SKILL_ORDER.filter(s => p.skills[s]).length;
}

/** The next unfinished lesson in the Skill Trail order; the capstone once all four are set. */
export function nextLesson(p: Progress): LessonMode {
  for (const s of SKILL_ORDER) {
    if (!p.skills[s]) {
      return s;
    }
  }
  return 'route';
}

export function markLesson(p: Progress, mode: LessonMode, accuracy: number, streak: number): Progress {
  const skills = { ...p.skills };
  const lastAccuracy = { ...p.lastAccuracy };
  if (mode !== 'route') {
    skills[mode] = true;
    lastAccuracy[mode] = accuracy;
  }
  return { skills, lastAccuracy, bestStreak: Math.max(p.bestStreak, streak) };
}

// ---------------------------------------------------------------------------
// Task queue
// ---------------------------------------------------------------------------

export type ContourTask = {
  kind: 'contours';
  id: string;
  prompt: string;
  leg: string;
  feature: Feature;
  options: FeatureKind[];
};

export type ScaleTask = {
  kind: 'scale';
  id: string;
  prompt: string;
  leg: string;
  path: Pt[];
  truthKm: number;
};

export type GridTask = {
  kind: 'grids';
  id: string;
  prompt: string;
  leg: string;
  point: Pt;
  truth: string;
  place: string;
};

export type BearingTask = {
  kind: 'bearings';
  id: string;
  prompt: string;
  leg: string;
  from: Pt;
  to: Pt;
  truth: number;
  place: string;
};

export type Task = ContourTask | ScaleTask | GridTask | BearingTask;

function rotate<T>(arr: T[], by: number): T[] {
  if (arr.length === 0) {
    return arr;
  }
  const n = ((by % arr.length) + arr.length) % arr.length;
  return arr.slice(n).concat(arr.slice(0, n));
}

/** Three answer chips: the right kind plus two plausible neighbours. */
function optionsFor(kind: FeatureKind, seed: number): FeatureKind[] {
  const pool: FeatureKind[] = ['ridge', 'valley', 'peak', 'spur', 'saddle', 'reentrant'];
  const others = rotate(pool.filter(k => k !== kind), seed).slice(0, 2);
  const all = [kind, ...others];
  return rotate(all, seed % 3);
}

function contourTasks(sheet: Sheet): ContourTask[] {
  const feats = sheet.features.slice(0, TASKS_PER_LESSON);
  return feats.map((feature, i) => ({
    kind: 'contours' as const,
    id: `${sheet.id}-c-${feature.id}`,
    prompt: `IDENTIFY THE ${FEATURE_LABEL[feature.kind]}`,
    leg: `TASK ${i + 1}`,
    feature,
    options: optionsFor(feature.kind, i + 1),
  }));
}

function scaleTasks(sheet: Sheet): ScaleTask[] {
  const cps = sheet.checkpoints;
  const out: ScaleTask[] = [];
  for (let i = 0; i < TASKS_PER_LESSON; i++) {
    const a = cps[i % cps.length].p;
    const b = cps[(i + 1 + (i % 2)) % cps.length].p;
    const path = [a, b];
    out.push({
      kind: 'scale',
      id: `${sheet.id}-s-${i}`,
      prompt: `MEASURE ${cps[i % cps.length].label} TO ${cps[(i + 1 + (i % 2)) % cps.length].label}`,
      leg: `TASK ${i + 1}`,
      path,
      truthKm: toKilometres(polylineLength(path)),
    });
  }
  return out;
}

function gridTasks(sheet: Sheet): GridTask[] {
  const pool = [...sheet.checkpoints.map(c => ({ p: c.p, label: c.label })), ...sheet.spotHeights.map(s => ({ p: s.p, label: `SPOT HEIGHT ${s.h} M` }))];
  const out: GridTask[] = [];
  for (let i = 0; i < TASKS_PER_LESSON; i++) {
    const item = pool[i % pool.length];
    out.push({
      kind: 'grids',
      id: `${sheet.id}-g-${i}`,
      prompt: `GIVE THE REFERENCE FOR ${item.label}`,
      leg: `TASK ${i + 1}`,
      point: item.p,
      truth: gridDigitsFor(item.p),
      place: item.label,
    });
  }
  return out;
}

function bearingTasks(sheet: Sheet): BearingTask[] {
  const cps = sheet.checkpoints;
  const out: BearingTask[] = [];
  for (let i = 0; i < TASKS_PER_LESSON; i++) {
    const from = cps[i % cps.length];
    const to = cps[(i + 2) % cps.length];
    out.push({
      kind: 'bearings',
      id: `${sheet.id}-b-${i}`,
      prompt: `SET THE BEARING TO ${to.label}`,
      leg: `TASK ${i + 1}`,
      from: from.p,
      to: to.p,
      truth: bearingBetween(from.p, to.p),
      place: to.label,
    });
  }
  return out;
}

/** The capstone: each leg asks for the next checkpoint's reference, then its bearing. */
function routeTasks(sheet: Sheet): Task[] {
  const cps = sheet.checkpoints;
  const out: Task[] = [];
  for (let leg = 0; leg < MISSION_CHECKPOINTS; leg++) {
    const from = cps[leg % cps.length];
    const to = cps[(leg + 1) % cps.length];
    const legLabel = `LEG ${leg + 1}/${MISSION_CHECKPOINTS}`;
    out.push({
      kind: 'grids',
      id: `${sheet.id}-r${leg}-g`,
      prompt: `REFERENCE FOR ${to.label}`,
      leg: legLabel,
      point: to.p,
      truth: gridDigitsFor(to.p),
      place: to.label,
    });
    out.push({
      kind: 'bearings',
      id: `${sheet.id}-r${leg}-b`,
      prompt: `BEARING TO ${to.label}`,
      leg: legLabel,
      from: from.p,
      to: to.p,
      truth: bearingBetween(from.p, to.p),
      place: to.label,
    });
  }
  return out;
}

export function buildTasks(mode: LessonMode, sheet: Sheet): Task[] {
  switch (mode) {
    case 'contours':
      return contourTasks(sheet);
    case 'scale':
      return scaleTasks(sheet);
    case 'grids':
      return gridTasks(sheet);
    case 'bearings':
      return bearingTasks(sheet);
    case 'route':
    default:
      return routeTasks(sheet);
  }
}

/** The route the debrief reports on: checkpoint to checkpoint around the sheet. */
export function missionStats(sheet: Sheet, errors: number) {
  const cps = sheet.checkpoints;
  let km = 0;
  for (let i = 1; i < cps.length; i++) {
    km += kmBetween(cps[i - 1].p, cps[i].p);
  }
  const climb = sheet.hills.reduce((sum, h) => sum + (h.top - 120), 0);
  return {
    routeKm: Math.round(km * 10) / 10,
    climbM: Math.round(climb / 10) * 10,
    errors,
  };
}
