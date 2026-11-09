import { CONTOUR_INTERVAL_M } from '../constants/config';
import { Pt, clamp, dist } from './geometry';

export type FeatureKind = 'ridge' | 'valley' | 'peak' | 'spur' | 'saddle' | 'reentrant';

export type Feature = {
  id: string;
  kind: FeatureKind;
  name: string;
  /** The axis of the landform - what the teal trace draws when the answer is right. */
  path: Pt[];
  /** Where the tap target sits on the sheet. */
  target: Pt;
};

export type SpotHeight = { p: Pt; h: number };

export type Hill = {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  wobble: number;
  phase: number;
  /** Summit height in metres. */
  top: number;
  rings: number;
};

export type Checkpoint = { id: string; label: string; p: Pt };

export type Sheet = {
  id: string;
  name: string;
  hills: Hill[];
  river: Pt[];
  ford: Pt;
  cliff: Pt[];
  footpath: Pt[];
  spotHeights: SpotHeight[];
  features: Feature[];
  checkpoints: Checkpoint[];
};

/**
 * One closed contour ring. Nested rings share wobble + phase so they never cross,
 * which is what makes the stack read as a real landform rather than noise.
 */
export function ring(h: Hill, step: number, segments = 56): Pt[] {
  const pts: Pt[] = [];
  const grow = 1 + step;
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    const wob =
      1 +
      h.wobble * Math.sin(3 * a + h.phase) +
      h.wobble * 0.45 * Math.cos(5 * a - h.phase * 1.7);
    pts.push({
      x: clamp(h.cx + Math.cos(a) * h.rx * grow * wob, 0.012, 0.988),
      y: clamp(h.cy + Math.sin(a) * h.ry * grow * wob, 0.012, 0.988),
    });
  }
  return pts;
}

export type ContourRing = { points: Pt[]; metres: number; index: boolean };

/** Every contour ring of one hill, outermost first, with its height in metres. */
export function contourStack(h: Hill): ContourRing[] {
  const out: ContourRing[] = [];
  for (let i = h.rings - 1; i >= 0; i--) {
    const metres = h.top - i * CONTOUR_INTERVAL_M;
    out.push({
      points: ring(h, i * 0.52),
      metres,
      index: metres % 50 === 0,
    });
  }
  return out;
}

/**
 * The sheet's height field, sampled from the hill set. Used by the Profile View
 * so the cross-section always agrees with the contours drawn above it.
 */
export function heightFieldFor(sheet: Sheet) {
  return (p: Pt) => {
    let h = 120;
    for (const hill of sheet.hills) {
      const spanX = hill.rx * (1 + hill.rings * 0.52);
      const spanY = hill.ry * (1 + hill.rings * 0.52);
      const nx = (p.x - hill.cx) / spanX;
      const ny = (p.y - hill.cy) / spanY;
      const d = Math.sqrt(nx * nx + ny * ny);
      const falloff = Math.max(0, 1 - d * d);
      h += (hill.top - 120) * falloff;
    }
    // The river cuts a shallow trench through whatever it crosses.
    let nearest = 1;
    for (const r of sheet.river) {
      const d = dist(p, r);
      if (d < nearest) {
        nearest = d;
      }
    }
    h -= Math.max(0, 1 - nearest / 0.12) * 24;
    return h;
  };
}

const HARROWFELL: Sheet = {
  id: 'harrowfell',
  name: 'HARROWFELL',
  hills: [
    { cx: 0.31, cy: 0.3, rx: 0.075, ry: 0.07, wobble: 0.16, phase: 0.6, top: 320, rings: 6 },
    { cx: 0.74, cy: 0.63, rx: 0.065, ry: 0.058, wobble: 0.2, phase: 2.3, top: 270, rings: 5 },
  ],
  river: [
    { x: 0.96, y: 0.12 },
    { x: 0.8, y: 0.2 },
    { x: 0.63, y: 0.31 },
    { x: 0.55, y: 0.46 },
    { x: 0.49, y: 0.62 },
    { x: 0.37, y: 0.76 },
    { x: 0.2, y: 0.86 },
    { x: 0.05, y: 0.92 },
  ],
  ford: { x: 0.49, y: 0.62 },
  cliff: [
    { x: 0.2, y: 0.47 },
    { x: 0.27, y: 0.5 },
    { x: 0.34, y: 0.5 },
    { x: 0.4, y: 0.47 },
  ],
  footpath: [
    { x: 0.08, y: 0.18 },
    { x: 0.22, y: 0.26 },
    { x: 0.4, y: 0.37 },
    { x: 0.49, y: 0.62 },
    { x: 0.66, y: 0.7 },
    { x: 0.86, y: 0.82 },
  ],
  spotHeights: [
    { p: { x: 0.31, y: 0.3 }, h: 324 },
    { p: { x: 0.74, y: 0.63 }, h: 271 },
    { p: { x: 0.53, y: 0.46 }, h: 186 },
    { p: { x: 0.14, y: 0.72 }, h: 142 },
  ],
  features: [
    {
      id: 'spur-ne',
      kind: 'spur',
      name: 'THE EAST SPUR',
      path: [
        { x: 0.33, y: 0.31 },
        { x: 0.42, y: 0.33 },
        { x: 0.5, y: 0.36 },
        { x: 0.56, y: 0.4 },
      ],
      target: { x: 0.47, y: 0.345 },
    },
    {
      id: 'valley-mid',
      kind: 'valley',
      name: 'FORDMERE VALLEY',
      path: [
        { x: 0.63, y: 0.31 },
        { x: 0.55, y: 0.46 },
        { x: 0.49, y: 0.62 },
        { x: 0.37, y: 0.76 },
      ],
      target: { x: 0.52, y: 0.54 },
    },
    {
      id: 'peak-harrow',
      kind: 'peak',
      name: 'HARROW TOP',
      path: [
        { x: 0.27, y: 0.3 },
        { x: 0.31, y: 0.26 },
        { x: 0.35, y: 0.3 },
        { x: 0.31, y: 0.34 },
        { x: 0.27, y: 0.3 },
      ],
      target: { x: 0.31, y: 0.3 },
    },
    {
      id: 'ridge-south',
      kind: 'ridge',
      name: 'BEACON RIDGE',
      path: [
        { x: 0.3, y: 0.38 },
        { x: 0.26, y: 0.52 },
        { x: 0.22, y: 0.66 },
        { x: 0.17, y: 0.78 },
      ],
      target: { x: 0.245, y: 0.59 },
    },
    {
      id: 'saddle-mid',
      kind: 'saddle',
      name: 'THE HOLLOW SADDLE',
      path: [
        { x: 0.4, y: 0.44 },
        { x: 0.5, y: 0.5 },
        { x: 0.62, y: 0.56 },
      ],
      target: { x: 0.5, y: 0.5 },
    },
    {
      id: 'reentrant-e',
      kind: 'reentrant',
      name: 'STONEGILL RE-ENTRANT',
      path: [
        { x: 0.86, y: 0.5 },
        { x: 0.8, y: 0.56 },
        { x: 0.75, y: 0.6 },
      ],
      target: { x: 0.8, y: 0.555 },
    },
  ],
  checkpoints: [
    { id: 'cp-a', label: 'BEACON RIDGE', p: { x: 0.245, y: 0.59 } },
    { id: 'cp-b', label: 'FORD CROSSING', p: { x: 0.49, y: 0.62 } },
    { id: 'cp-c', label: 'STONEGILL HEAD', p: { x: 0.8, y: 0.555 } },
    { id: 'cp-d', label: 'HARROW TOP', p: { x: 0.31, y: 0.3 } },
  ],
};

const BEACON_RIDGE: Sheet = {
  id: 'beaconridge',
  name: 'BEACON RIDGE',
  hills: [
    { cx: 0.5, cy: 0.26, rx: 0.09, ry: 0.055, wobble: 0.13, phase: 1.4, top: 410, rings: 6 },
    { cx: 0.24, cy: 0.68, rx: 0.06, ry: 0.07, wobble: 0.22, phase: 0.2, top: 250, rings: 4 },
  ],
  river: [
    { x: 0.04, y: 0.33 },
    { x: 0.2, y: 0.42 },
    { x: 0.37, y: 0.53 },
    { x: 0.52, y: 0.66 },
    { x: 0.7, y: 0.76 },
    { x: 0.93, y: 0.84 },
  ],
  ford: { x: 0.52, y: 0.66 },
  cliff: [
    { x: 0.58, y: 0.36 },
    { x: 0.66, y: 0.38 },
    { x: 0.73, y: 0.36 },
  ],
  footpath: [
    { x: 0.12, y: 0.12 },
    { x: 0.33, y: 0.2 },
    { x: 0.5, y: 0.26 },
    { x: 0.64, y: 0.45 },
    { x: 0.78, y: 0.64 },
    { x: 0.9, y: 0.9 },
  ],
  spotHeights: [
    { p: { x: 0.5, y: 0.26 }, h: 412 },
    { p: { x: 0.24, y: 0.68 }, h: 254 },
    { p: { x: 0.74, y: 0.5 }, h: 198 },
  ],
  features: [
    {
      id: 'ridge-beacon',
      kind: 'ridge',
      name: 'THE BEACON CREST',
      path: [
        { x: 0.33, y: 0.25 },
        { x: 0.44, y: 0.255 },
        { x: 0.56, y: 0.26 },
        { x: 0.68, y: 0.28 },
      ],
      target: { x: 0.5, y: 0.26 },
    },
    {
      id: 'reentrant-n',
      kind: 'reentrant',
      name: 'NORTH GILL',
      path: [
        { x: 0.44, y: 0.14 },
        { x: 0.47, y: 0.2 },
        { x: 0.5, y: 0.24 },
      ],
      target: { x: 0.47, y: 0.19 },
    },
    {
      id: 'spur-sw',
      kind: 'spur',
      name: 'LOW SPUR',
      path: [
        { x: 0.26, y: 0.66 },
        { x: 0.18, y: 0.72 },
        { x: 0.11, y: 0.79 },
      ],
      target: { x: 0.18, y: 0.72 },
    },
    {
      id: 'valley-main',
      kind: 'valley',
      name: 'FOLD VALLEY',
      path: [
        { x: 0.2, y: 0.42 },
        { x: 0.37, y: 0.53 },
        { x: 0.52, y: 0.66 },
      ],
      target: { x: 0.37, y: 0.53 },
    },
    {
      id: 'peak-low',
      kind: 'peak',
      name: 'WHINFELL TOP',
      path: [
        { x: 0.2, y: 0.68 },
        { x: 0.24, y: 0.63 },
        { x: 0.28, y: 0.68 },
        { x: 0.24, y: 0.73 },
        { x: 0.2, y: 0.68 },
      ],
      target: { x: 0.24, y: 0.68 },
    },
    {
      id: 'saddle-beacon',
      kind: 'saddle',
      name: 'WIND SADDLE',
      path: [
        { x: 0.36, y: 0.45 },
        { x: 0.3, y: 0.56 },
        { x: 0.26, y: 0.63 },
      ],
      target: { x: 0.3, y: 0.56 },
    },
  ],
  checkpoints: [
    { id: 'cp-a', label: 'BEACON CREST', p: { x: 0.5, y: 0.26 } },
    { id: 'cp-b', label: 'NORTH GILL', p: { x: 0.47, y: 0.19 } },
    { id: 'cp-c', label: 'FOLD FORD', p: { x: 0.52, y: 0.66 } },
    { id: 'cp-d', label: 'WHINFELL TOP', p: { x: 0.24, y: 0.68 } },
  ],
};

const FORDMERE: Sheet = {
  id: 'fordmere',
  name: 'FORDMERE',
  hills: [
    { cx: 0.2, cy: 0.22, rx: 0.06, ry: 0.062, wobble: 0.18, phase: 2.9, top: 230, rings: 4 },
    { cx: 0.62, cy: 0.33, rx: 0.07, ry: 0.06, wobble: 0.15, phase: 1.1, top: 295, rings: 5 },
    { cx: 0.42, cy: 0.78, rx: 0.058, ry: 0.05, wobble: 0.24, phase: 0.4, top: 205, rings: 4 },
  ],
  river: [
    { x: 0.02, y: 0.5 },
    { x: 0.18, y: 0.52 },
    { x: 0.34, y: 0.56 },
    { x: 0.5, y: 0.58 },
    { x: 0.68, y: 0.62 },
    { x: 0.86, y: 0.7 },
    { x: 0.98, y: 0.78 },
  ],
  ford: { x: 0.5, y: 0.58 },
  cliff: [
    { x: 0.72, y: 0.24 },
    { x: 0.79, y: 0.27 },
    { x: 0.85, y: 0.32 },
  ],
  footpath: [
    { x: 0.06, y: 0.84 },
    { x: 0.24, y: 0.72 },
    { x: 0.42, y: 0.66 },
    { x: 0.5, y: 0.58 },
    { x: 0.62, y: 0.42 },
    { x: 0.76, y: 0.16 },
  ],
  spotHeights: [
    { p: { x: 0.2, y: 0.22 }, h: 232 },
    { p: { x: 0.62, y: 0.33 }, h: 297 },
    { p: { x: 0.42, y: 0.78 }, h: 208 },
  ],
  features: [
    {
      id: 'peak-fordmere',
      kind: 'peak',
      name: 'MERE PIKE',
      path: [
        { x: 0.58, y: 0.33 },
        { x: 0.62, y: 0.28 },
        { x: 0.66, y: 0.33 },
        { x: 0.62, y: 0.38 },
        { x: 0.58, y: 0.33 },
      ],
      target: { x: 0.62, y: 0.33 },
    },
    {
      id: 'valley-fordmere',
      kind: 'valley',
      name: 'THE MERE TROUGH',
      path: [
        { x: 0.18, y: 0.52 },
        { x: 0.34, y: 0.56 },
        { x: 0.5, y: 0.58 },
        { x: 0.68, y: 0.62 },
      ],
      target: { x: 0.34, y: 0.56 },
    },
    {
      id: 'spur-fordmere',
      kind: 'spur',
      name: 'KILN SPUR',
      path: [
        { x: 0.22, y: 0.26 },
        { x: 0.26, y: 0.34 },
        { x: 0.3, y: 0.42 },
      ],
      target: { x: 0.26, y: 0.34 },
    },
    {
      id: 'ridge-fordmere',
      kind: 'ridge',
      name: 'LOW BARROW RIDGE',
      path: [
        { x: 0.34, y: 0.8 },
        { x: 0.44, y: 0.78 },
        { x: 0.54, y: 0.8 },
      ],
      target: { x: 0.44, y: 0.79 },
    },
    {
      id: 'saddle-fordmere',
      kind: 'saddle',
      name: 'KILN SADDLE',
      path: [
        { x: 0.3, y: 0.3 },
        { x: 0.44, y: 0.31 },
        { x: 0.56, y: 0.32 },
      ],
      target: { x: 0.44, y: 0.31 },
    },
    {
      id: 'reentrant-fordmere',
      kind: 'reentrant',
      name: 'BARROW GILL',
      path: [
        { x: 0.42, y: 0.88 },
        { x: 0.42, y: 0.83 },
        { x: 0.42, y: 0.79 },
      ],
      target: { x: 0.42, y: 0.84 },
    },
  ],
  checkpoints: [
    { id: 'cp-a', label: 'MERE PIKE', p: { x: 0.62, y: 0.33 } },
    { id: 'cp-b', label: 'THE FORD', p: { x: 0.5, y: 0.58 } },
    { id: 'cp-c', label: 'BARROW RIDGE', p: { x: 0.44, y: 0.79 } },
    { id: 'cp-d', label: 'KILN SPUR', p: { x: 0.26, y: 0.34 } },
  ],
};

export const SHEETS: Sheet[] = [HARROWFELL, BEACON_RIDGE, FORDMERE];

export function sheetById(id: string): Sheet {
  return SHEETS.find(s => s.id === id) || HARROWFELL;
}

export const FEATURE_LABEL: Record<FeatureKind, string> = {
  ridge: 'RIDGE',
  valley: 'VALLEY',
  peak: 'PEAK',
  spur: 'SPUR',
  saddle: 'SADDLE',
  reentrant: 'RE-ENTRANT',
};
