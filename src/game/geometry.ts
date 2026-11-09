import { GRID_COLS, GRID_ROWS, SHEET_PX, SHEET_SCALE_M_PER_PX } from '../constants/config';

/** A point in normalised sheet space: 0..1 across, 0..1 down. */
export type Pt = { x: number; y: number };

export const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);

/** Normalised point -> pixel inside the sheet viewport. */
export const toPx = (p: Pt): Pt => ({ x: p.x * SHEET_PX, y: p.y * SHEET_PX });

export function dist(a: Pt, b: Pt) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/** Total length of a normalised polyline, in normalised units. */
export function polylineLength(points: Pt[]) {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += dist(points[i - 1], points[i]);
  }
  return total;
}

/** Point at a fraction 0..1 along a normalised polyline. */
export function pointAlong(points: Pt[], t: number): Pt {
  if (points.length === 0) {
    return { x: 0, y: 0 };
  }
  if (points.length === 1) {
    return points[0];
  }
  const target = polylineLength(points) * clamp(t, 0, 1);
  let walked = 0;
  for (let i = 1; i < points.length; i++) {
    const seg = dist(points[i - 1], points[i]);
    if (walked + seg >= target || i === points.length - 1) {
      const local = seg === 0 ? 0 : (target - walked) / seg;
      return {
        x: points[i - 1].x + (points[i].x - points[i - 1].x) * local,
        y: points[i - 1].y + (points[i].y - points[i - 1].y) * local,
      };
    }
    walked += seg;
  }
  return points[points.length - 1];
}

/** Normalised length -> ground kilometres on this sheet. */
export function toKilometres(normalisedLength: number) {
  const px = normalisedLength * SHEET_PX;
  return (px * SHEET_SCALE_M_PER_PX) / 1000;
}

/** Ground kilometres between two normalised points. */
export function kmBetween(a: Pt, b: Pt) {
  return toKilometres(dist(a, b));
}

/** Compass bearing a -> b in whole degrees, 0 = sheet north (up), clockwise. */
export function bearingBetween(a: Pt, b: Pt) {
  const dx = b.x - a.x;
  const dy = a.y - b.y; // sheet y grows downward, north is up
  let deg = (Math.atan2(dx, dy) * 180) / Math.PI;
  if (deg < 0) {
    deg += 360;
  }
  return Math.round(deg) % 360;
}

/** Smallest absolute difference between two bearings, 0..180. */
export function bearingDelta(a: number, b: number) {
  const raw = Math.abs(((a - b) % 360 + 360) % 360);
  return raw > 180 ? 360 - raw : raw;
}

/**
 * Six-figure grid reference for a normalised point.
 * Easting before northing; northings count up from the bottom edge.
 */
export function gridRefFor(p: Pt): string {
  return formatGrid(gridDigitsFor(p));
}

/** The six digits the keypad expects: easting (2) + tenth, northing (2) + tenth. */
export function gridDigitsFor(p: Pt): string {
  const e = clamp(p.x, 0, 0.9999) * GRID_COLS;
  const n = clamp(1 - p.y, 0, 0.9999) * GRID_ROWS;
  const eWhole = Math.floor(e);
  const eTenth = Math.min(9, Math.floor((e - eWhole) * 10));
  const nWhole = Math.floor(n);
  const nTenth = Math.min(9, Math.floor((n - nWhole) * 10));
  return `0${eWhole}${eTenth}0${nWhole}${nTenth}`;
}

/** "018 047" - how a six-figure reference is read aloud. */
export function formatGrid(digits: string) {
  const d = (digits + '......').slice(0, 6);
  return `${d.slice(0, 3)} ${d.slice(3, 6)}`;
}

/**
 * Cross-section under a line: samples the sheet's height field and returns
 * {t, h} pairs plus the min/max metres, ready for the Profile View.
 */
export function profileFromHeightField(
  heightAt: (p: Pt) => number,
  from: Pt,
  to: Pt,
  samples = 36,
) {
  const pts: { t: number; h: number }[] = [];
  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const p = { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t };
    const h = heightAt(p);
    if (h < min) {
      min = h;
    }
    if (h > max) {
      max = h;
    }
    pts.push({ t, h });
  }
  if (!isFinite(min) || !isFinite(max) || max - min < 1) {
    max = min + 1;
  }
  return { points: pts, minH: Math.round(min), maxH: Math.round(max) };
}

/** An SVG path string from a normalised polyline, optionally closed. */
export function svgPath(points: Pt[], close = false) {
  if (points.length === 0) {
    return '';
  }
  const px = points.map(toPx);
  let d = `M ${px[0].x.toFixed(2)} ${px[0].y.toFixed(2)}`;
  for (let i = 1; i < px.length; i++) {
    d += ` L ${px[i].x.toFixed(2)} ${px[i].y.toFixed(2)}`;
  }
  if (close) {
    d += ' Z';
  }
  return d;
}

/** Approximate pixel length of a normalised polyline - used for strokeDasharray traces. */
export function pathPixelLength(points: Pt[]) {
  return Math.max(1, Math.round(polylineLength(points) * SHEET_PX));
}
