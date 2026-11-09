import { Dimensions } from 'react-native';

const win = Dimensions.get('window');
export const SCREEN_W = win.width;
export const SCREEN_H = win.height;

/** EXACTLY 8000 - shorter values race the UI-test screenshot window (rule #13). */
export const LOADER_DURATION_MS = 8000;

/** Sheet geometry - 10x10 grid squares so a six-figure reference maps onto whole cells. */
export const GRID_COLS = 10;
export const GRID_ROWS = 10;
export const BOARD_PAD = 6;
export const BOARD_BORDER = 2;
export const BOARD_FRAME = BOARD_PAD + BOARD_BORDER; // 8
export const BOARD_MAX_W = Math.min(SCREEN_W - 32, 380);
export const CELL = Math.floor((BOARD_MAX_W - 2 * BOARD_FRAME) / GRID_COLS);
export const SHEET_PX = CELL * GRID_COLS; // the inner SVG viewport, square
export const BOARD_W = SHEET_PX + 2 * BOARD_FRAME;

/** Layout helpers - every Pressable gets an explicit width from these. */
export const PAGE_PAD = 20;
export const CONTENT_W = SCREEN_W - PAGE_PAD * 2;
export const HALF_W = Math.floor((CONTENT_W - 10) / 2);
export const THIRD_W = Math.floor((CONTENT_W - 20) / 3);
export const HEADER_TOP = 44;
export const HEADER_H = 72;

/** 1:25 000 feel on a ~380px sheet. */
export const SHEET_SCALE_M_PER_PX = 26;
export const CONTOUR_INTERVAL_M = 10;

export const TOLERANCE_SCALE_PCT = 8;
export const TOLERANCE_BEARING_DEG = 5;
export const HAPTIC_TICK_DEG = 5;

export const ZOOM_MIN = 1;
export const ZOOM_MAX = 2.6;
export const HIT_ZOOMED_OUT = 44;
export const HIT_ZOOMED_IN = 30;

export const TASKS_PER_LESSON = 5;
export const MISSION_CHECKPOINTS = 4;

export const TRACE_MS = 300;
export const REVEAL_MS = 600;
export const PROFILE_MS = 500;
export const SHEET_SLIDE_MS = 240;
export const SCREEN_FADE_MS = 320;
export const ELEMENT_FADE_MS = 220;
export const PULSE_MS = 2400;

export const RULER_GRIP = 56;
export const BAR_H = 92;
export const BAR_BOTTOM = 24;
export const GAME_AREA_BOTTOM_PAD = 176; // clears the tallest floating bar (chips + profile row)

export const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 };
