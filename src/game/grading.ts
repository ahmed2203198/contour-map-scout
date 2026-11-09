import { TOLERANCE_BEARING_DEG, TOLERANCE_SCALE_PCT } from '../constants/config';
import { Pt, bearingDelta, dist } from './geometry';
import { FeatureKind, Sheet } from './sheets';

export type Verdict = 'correct' | 'wrong';

export function gradeFeature(selected: FeatureKind, answer: FeatureKind): Verdict {
  return selected === answer ? 'correct' : 'wrong';
}

/** The ruler reading is graded as a percentage of the true ground distance. */
export function gradeDistance(readingKm: number, truthKm: number, tolPct = TOLERANCE_SCALE_PCT): Verdict {
  if (truthKm <= 0) {
    return 'wrong';
  }
  const offBy = (Math.abs(readingKm - truthKm) / truthKm) * 100;
  return offBy <= tolPct ? 'correct' : 'wrong';
}

/** Six figures, exact match - a grid reference is either right or it is not. */
export function gradeGrid(entered: string, truth: string): Verdict {
  return entered.length === 6 && entered === truth ? 'correct' : 'wrong';
}

export function gradeBearing(set: number, truth: number, tol = TOLERANCE_BEARING_DEG): Verdict {
  return bearingDelta(set, truth) <= tol ? 'correct' : 'wrong';
}

export type LegFault = 'none' | 'river' | 'cliff';

/**
 * A route leg is rejected when it crosses the river away from the ford
 * or climbs straight through the cliff band.
 */
export function gradeRouteLeg(from: Pt, to: Pt, sheet: Sheet): LegFault {
  const samples = 24;
  let crossesRiver = false;
  let nearFord = false;
  let hitsCliff = false;

  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const p = { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t };

    for (const r of sheet.river) {
      if (dist(p, r) < 0.035) {
        crossesRiver = true;
      }
    }
    if (dist(p, sheet.ford) < 0.06) {
      nearFord = true;
    }
    for (const c of sheet.cliff) {
      if (dist(p, c) < 0.035) {
        hitsCliff = true;
      }
    }
  }

  if (hitsCliff) {
    return 'cliff';
  }
  if (crossesRiver && !nearFord) {
    return 'river';
  }
  return 'none';
}

export const FAULT_TEXT: Record<LegFault, string> = {
  none: 'LEG CLEARS THE GROUND',
  river: 'LEG CROSSES THE RIVER AWAY FROM THE FORD',
  cliff: 'LEG CLIMBS THROUGH THE CLIFF BAND',
};
