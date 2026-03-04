import { Stroke, StrokeKeyframe, EASING_VALUES } from "./types";

const NORMALIZED_PATH_LENGTH = 1000;

export interface ExportOptions {
  color: string;
  width: number;
  smoothing: boolean;
  canvasWidth: number;
  canvasHeight: number;
  background?: string;
}

function buildPathElement(
  stroke: Stroke,
  keyframe: StrokeKeyframe,
  options: ExportOptions
): string {
  const useSmooth = options.smoothing;
  const d = useSmooth ? stroke.smoothPathData : stroke.pathData;

  const durSec = keyframe.duration / 1000;
  const beginSec = keyframe.delay / 1000;
  const keySplines = EASING_VALUES[keyframe.easing];

  const strokeWidth = stroke.baseWidth * options.width;

  const gap = NORMALIZED_PATH_LENGTH;
  // Fade in over first 2% of stroke duration so we never show zero-length caps (dots) before the draw starts
  const opacityDur = Math.max(0.01, durSec * 0.02);
  return [
    `  <path`,
    `    d="${d}"`,
    `    pathLength="${NORMALIZED_PATH_LENGTH}"`,
    `    fill="none"`,
    `    stroke="${options.color}"`,
    `    stroke-width="${strokeWidth}"`,
    `    stroke-linecap="round"`,
    `    stroke-linejoin="round"`,
    `    stroke-dasharray="0 ${gap}"`,
    `    stroke-opacity="0"`,
    `  >`,
    `    <animate`,
    `      attributeName="stroke-opacity"`,
    `      from="0"`,
    `      to="1"`,
    `      dur="${opacityDur}s"`,
    `      begin="${beginSec}s"`,
    `      fill="freeze"`,
    `    />`,
    `    <animate`,
    `      attributeName="stroke-dasharray"`,
    `      from="0 ${gap}"`,
    `      to="${NORMALIZED_PATH_LENGTH} ${gap}"`,
    `      dur="${durSec}s"`,
    `      begin="${beginSec}s"`,
    `      fill="freeze"`,
    `      calcMode="spline"`,
    `      keySplines="${keySplines}"`,
    `      keyTimes="0;1"`,
    `      values="0 ${gap};${NORMALIZED_PATH_LENGTH} ${gap}"`,
    `    />`,
    `  </path>`,
  ].join("\n");
}

function buildSVGContent(
  strokes: Stroke[],
  keyframes: StrokeKeyframe[],
  options: ExportOptions
): string {
  const keyframeMap = new Map<string, StrokeKeyframe>(
    keyframes.map((kf) => [kf.strokeId, kf])
  );

  const backgroundRect =
    options.background
      ? `  <rect width="100%" height="100%" fill="${options.background}" />`
      : "";

  const paths = strokes
    .map((stroke) => {
      const keyframe = keyframeMap.get(stroke.id);
      if (!keyframe) return null;
      return buildPathElement(stroke, keyframe, options);
    })
    .filter((p): p is string => p !== null)
    .join("\n");

  const parts: string[] = [];
  if (backgroundRect) parts.push(backgroundRect);
  if (paths) parts.push(paths);

  return parts.join("\n");
}

export function exportAnimatedSVG(
  strokes: Stroke[],
  keyframes: StrokeKeyframe[],
  options: ExportOptions
): string {
  const { canvasWidth, canvasHeight } = options;
  const innerContent = buildSVGContent(strokes, keyframes, options);

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<svg`,
    `  xmlns="http://www.w3.org/2000/svg"`,
    `  viewBox="0 0 ${canvasWidth} ${canvasHeight}"`,
    `  width="${canvasWidth}"`,
    `  height="${canvasHeight}"`,
    `>`,
    innerContent,
    `</svg>`,
  ].join("\n");
}

export function generatePreviewSVG(
  strokes: Stroke[],
  keyframes: StrokeKeyframe[],
  options: ExportOptions
): string {
  const { canvasWidth, canvasHeight } = options;
  const innerContent = buildSVGContent(strokes, keyframes, options);

  return [
    `<svg`,
    `  xmlns="http://www.w3.org/2000/svg"`,
    `  viewBox="0 0 ${canvasWidth} ${canvasHeight}"`,
    `  width="100%"`,
    `  height="100%"`,
    `  preserveAspectRatio="xMidYMid slice"`,
    `>`,
    innerContent,
    `</svg>`,
  ].join("\n");
}
