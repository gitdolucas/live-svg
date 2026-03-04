export interface Point {
  x: number;
  y: number;
  pressure: number;
  timestamp: number;
}

export interface Stroke {
  id: string;
  points: Point[];
  pathData: string;
  smoothPathData: string;
  pathLength: number;
  smoothPathLength: number;
  baseWidth: number;
}

export interface StrokeKeyframe {
  strokeId: string;
  delay: number;
  duration: number;
  easing: EasingPreset;
}

export type EasingPreset =
  | "linear"
  | "ease-in"
  | "ease-out"
  | "ease-in-out"
  | "ease-in-quad"
  | "ease-out-quad"
  | "ease-in-out-quad";

export const EASING_VALUES: Record<EasingPreset, string> = {
  linear: "0 0 1 1",
  "ease-in": "0.42 0 1 1",
  "ease-out": "0 0 0.58 1",
  "ease-in-out": "0.42 0 0.58 1",
  "ease-in-quad": "0.55 0.085 0.68 0.53",
  "ease-out-quad": "0.25 0.46 0.45 0.94",
  "ease-in-out-quad": "0.455 0.03 0.515 0.955",
};

export interface AppState {
  strokes: Stroke[];
  keyframes: StrokeKeyframe[];
  strokeColor: string;
  strokeWidth: number;
  smoothing: boolean;
  canvasWidth: number;
  canvasHeight: number;
}
