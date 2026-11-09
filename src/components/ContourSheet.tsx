import React, { memo, useMemo } from 'react';
import Svg, { Circle, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { CELL, GRID_COLS, GRID_ROWS, SHEET_PX } from '../constants/config';
import { THEME } from '../constants/theme';
import { Pt, pointAlong, svgPath, toPx } from '../game/geometry';
import { Sheet, contourStack } from '../game/sheets';

const BROWN = THEME.colors.accent.brown;
const TEAL = THEME.colors.accent.teal;
const INK = THEME.colors.text.primary;

/**
 * One invented survey sheet, drawn entirely in SVG so it stays crisp at 2.6x
 * zoom. Pure geometry from sheets.ts - nothing here holds state.
 */
function ContourSheetBase({
  sheet,
  routePath,
  showFootpath = true,
}: {
  sheet: Sheet;
  routePath?: Pt[] | null;
  showFootpath?: boolean;
}) {
  const contours = useMemo(() => sheet.hills.map(h => contourStack(h)), [sheet]);
  const riverD = useMemo(() => svgPath(sheet.river), [sheet]);
  const pathD = useMemo(() => svgPath(sheet.footpath), [sheet]);
  const cliffD = useMemo(() => svgPath(sheet.cliff), [sheet]);
  const routeD = useMemo(() => (routePath && routePath.length > 1 ? svgPath(routePath) : ''), [routePath]);
  const fordPx = useMemo(() => toPx(sheet.ford), [sheet]);

  return (
    <Svg width={SHEET_PX} height={SHEET_PX} viewBox={`0 0 ${SHEET_PX} ${SHEET_PX}`}>
      <Rect x={0} y={0} width={SHEET_PX} height={SHEET_PX} fill={THEME.colors.bg.paper} />

      {/* Grid squares - eastings and northings */}
      <G>
        {Array.from({ length: GRID_COLS + 1 }).map((_, i) => (
          <Line
            key={`v${i}`}
            x1={i * CELL}
            y1={0}
            x2={i * CELL}
            y2={SHEET_PX}
            stroke={INK}
            strokeOpacity={0.14}
            strokeWidth={1}
          />
        ))}
        {Array.from({ length: GRID_ROWS + 1 }).map((_, i) => (
          <Line
            key={`h${i}`}
            x1={0}
            y1={i * CELL}
            x2={SHEET_PX}
            y2={i * CELL}
            stroke={INK}
            strokeOpacity={0.14}
            strokeWidth={1}
          />
        ))}
      </G>

      {/* Contour rings. Every 50 m ring is an index contour: heavier, labelled. */}
      <G>
        {contours.map((stack, hi) =>
          stack.map((c, ci) => (
            <Path
              key={`c-${hi}-${ci}`}
              d={svgPath(c.points, true)}
              stroke={BROWN}
              strokeOpacity={c.index ? 0.85 : 0.55}
              strokeWidth={c.index ? 2.2 : 1.2}
              fill="none"
            />
          )),
        )}
      </G>

      {/* Index contour height labels */}
      <G>
        {contours.map((stack, hi) =>
          stack
            .filter(c => c.index)
            .map((c, ci) => {
              const at = toPx(pointAlong(c.points, 0.12));
              return (
                <SvgText
                  key={`cl-${hi}-${ci}`}
                  x={at.x}
                  y={at.y + 3}
                  fill={BROWN}
                  fontSize={9}
                  fontWeight="700"
                  textAnchor="middle"
                >
                  {String(c.metres)}
                </SvgText>
              );
            }),
        )}
      </G>

      {/* Cliff band - ink ticks on the downhill side */}
      <G>
        <Path d={cliffD} stroke={INK} strokeOpacity={0.7} strokeWidth={2} fill="none" />
        {sheet.cliff.map((p, i) => {
          const a = toPx(p);
          return (
            <Line
              key={`cliff-${i}`}
              x1={a.x}
              y1={a.y}
              x2={a.x}
              y2={a.y + 7}
              stroke={INK}
              strokeOpacity={0.6}
              strokeWidth={1.5}
            />
          );
        })}
      </G>

      {/* Footpath - dashed, the only dashed line on the sheet */}
      {showFootpath ? (
        <Path d={pathD} stroke={BROWN} strokeOpacity={0.5} strokeWidth={1.5} strokeDasharray="5,4" fill="none" />
      ) : null}

      {/* River and ford. Teal is water, routes and correctness - nothing else. */}
      <Path d={riverD} stroke={TEAL} strokeWidth={3} strokeLinecap="round" fill="none" />
      <Line
        x1={fordPx.x - 8}
        y1={fordPx.y}
        x2={fordPx.x + 8}
        y2={fordPx.y}
        stroke={THEME.colors.bg.paper}
        strokeWidth={3}
      />

      {/* The planned route, when a mission is running */}
      {routeD !== '' ? (
        <Path d={routeD} stroke={TEAL} strokeOpacity={0.55} strokeWidth={2} strokeDasharray="7,5" fill="none" />
      ) : null}

      {/* Spot heights */}
      <G>
        {sheet.spotHeights.map((s, i) => {
          const a = toPx(s.p);
          return (
            <G key={`sh-${i}`}>
              <Circle cx={a.x} cy={a.y} r={2.4} fill={INK} fillOpacity={0.8} />
              <SvgText x={a.x + 6} y={a.y + 4} fill={INK} fillOpacity={0.75} fontSize={9} fontWeight="700">
                {String(s.h)}
              </SvgText>
            </G>
          );
        })}
      </G>

      {/* Checkpoints */}
      <G>
        {sheet.checkpoints.map(c => {
          const a = toPx(c.p);
          return (
            <Circle
              key={c.id}
              cx={a.x}
              cy={a.y}
              r={7}
              fill={THEME.colors.bg.paper}
              stroke={TEAL}
              strokeWidth={2}
            />
          );
        })}
      </G>

      {/* Grid numerals: eastings along the bottom, northings up the left edge */}
      <G>
        {Array.from({ length: GRID_COLS }).map((_, i) => (
          <SvgText
            key={`en-${i}`}
            x={i * CELL + CELL / 2}
            y={SHEET_PX - 4}
            fill={INK}
            fillOpacity={0.5}
            fontSize={9}
            fontWeight="700"
            textAnchor="middle"
          >
            {String(i)}
          </SvgText>
        ))}
        {Array.from({ length: GRID_ROWS }).map((_, i) => (
          <SvgText
            key={`nn-${i}`}
            x={5}
            y={SHEET_PX - i * CELL - CELL / 2 + 3}
            fill={INK}
            fillOpacity={0.5}
            fontSize={9}
            fontWeight="700"
          >
            {String(i)}
          </SvgText>
        ))}
      </G>

      {/* North arrow, drawn as geometry - never as a text glyph */}
      <G>
        <Line
          x1={SHEET_PX - 16}
          y1={28}
          x2={SHEET_PX - 16}
          y2={10}
          stroke={TEAL}
          strokeWidth={2}
          strokeLinecap="round"
        />
        <Path d={`M ${SHEET_PX - 21} 16 L ${SHEET_PX - 16} 8 L ${SHEET_PX - 11} 16 Z`} fill={TEAL} />
        <SvgText x={SHEET_PX - 16} y={40} fill={TEAL} fontSize={8} fontWeight="800" textAnchor="middle">
          N
        </SvgText>
      </G>
    </Svg>
  );
}

export const ContourSheet = memo(ContourSheetBase);
export default ContourSheet;
