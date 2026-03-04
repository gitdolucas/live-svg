"use client";

import { EasingPreset, EASING_VALUES, Stroke, StrokeKeyframe } from "@/lib/types";

interface TimelineProps {
  strokes: Stroke[];
  keyframes: StrokeKeyframe[];
  onKeyframesChange: (keyframes: StrokeKeyframe[]) => void;
  smoothing: boolean;
  strokeColor: string;
}

const EASING_OPTIONS = Object.keys(EASING_VALUES) as EasingPreset[];

const DEFAULT_DURATION = 500;
const DEFAULT_EASING: EasingPreset = "ease-in-out";
const SEQUENCE_OVERLAP = 0.7;
const THUMBNAIL_WIDTH = 80;
const THUMBNAIL_HEIGHT = 40;
const THUMBNAIL_PADDING = 4;

function getStrokeBounds(stroke: Stroke): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} {
  const points = stroke.points;
  if (points.length === 0) {
    return { minX: 0, minY: 0, maxX: 1, maxY: 1 };
  }
  let minX = points[0].x;
  let minY = points[0].y;
  let maxX = points[0].x;
  let maxY = points[0].y;
  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  return { minX, minY, maxX, maxY };
}

function computeViewBox(stroke: Stroke): string {
  const { minX, minY, maxX, maxY } = getStrokeBounds(stroke);
  const w = maxX - minX || 1;
  const h = maxY - minY || 1;
  return `${minX - THUMBNAIL_PADDING} ${minY - THUMBNAIL_PADDING} ${w + THUMBNAIL_PADDING * 2} ${h + THUMBNAIL_PADDING * 2}`;
}

function StrokeThumbnail({
  stroke,
  smoothing,
  strokeColor,
}: {
  stroke: Stroke;
  smoothing: boolean;
  strokeColor: string;
}) {
  const pathData = smoothing ? stroke.smoothPathData : stroke.pathData;
  const viewBox = computeViewBox(stroke);

  return (
    <svg
      width={THUMBNAIL_WIDTH}
      height={THUMBNAIL_HEIGHT}
      viewBox={viewBox}
      preserveAspectRatio="xMidYMid meet"
      className="shrink-0 rounded border border-border bg-surface"
    >
      <path
        d={pathData}
        fill="none"
        stroke={strokeColor}
        strokeWidth={stroke.baseWidth * 2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Timeline({
  strokes,
  keyframes,
  onKeyframesChange,
  smoothing,
  strokeColor,
}: TimelineProps) {
  function getKeyframe(strokeId: string): StrokeKeyframe {
    const existing = keyframes.find((kf) => kf.strokeId === strokeId);
    if (existing) return existing;
    return {
      strokeId,
      delay: 0,
      duration: DEFAULT_DURATION,
      easing: DEFAULT_EASING,
    };
  }

  function updateKeyframe(updated: StrokeKeyframe) {
    const exists = keyframes.some((kf) => kf.strokeId === updated.strokeId);
    if (exists) {
      onKeyframesChange(
        keyframes.map((kf) => (kf.strokeId === updated.strokeId ? updated : kf))
      );
    } else {
      onKeyframesChange([...keyframes, updated]);
    }
  }

  function handleDelay(strokeId: string, value: number) {
    const kf = getKeyframe(strokeId);
    updateKeyframe({ ...kf, delay: Math.max(0, value) });
  }

  function handleDuration(strokeId: string, value: number) {
    const kf = getKeyframe(strokeId);
    updateKeyframe({ ...kf, duration: Math.max(50, value) });
  }

  function handleEasing(strokeId: string, value: EasingPreset) {
    const kf = getKeyframe(strokeId);
    updateKeyframe({ ...kf, easing: value });
  }

  function handleAutoSequence() {
    const updated: StrokeKeyframe[] = [];
    let currentDelay = 0;

    for (let i = 0; i < strokes.length; i++) {
      const stroke = strokes[i];
      const existingKf = keyframes.find((kf) => kf.strokeId === stroke.id);
      const duration = existingKf?.duration ?? DEFAULT_DURATION;
      const easing = existingKf?.easing ?? DEFAULT_EASING;

      updated.push({
        strokeId: stroke.id,
        delay: Math.round(currentDelay),
        duration,
        easing,
      });

      currentDelay += duration * SEQUENCE_OVERLAP;
    }

    onKeyframesChange(updated);
  }

  if (strokes.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-muted">
          Draw some strokes first
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">
          Animation Timeline
        </h2>
        <button
          onClick={handleAutoSequence}
          className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground shadow-sm transition-[opacity,transform] hover:opacity-90 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Auto-sequence
        </button>
      </div>

      <ul className="flex flex-col gap-2">
        {strokes.map((stroke, index) => {
          const kf = getKeyframe(stroke.id);
          return (
            <li
              key={stroke.id}
              className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-3"
            >
              <div className="flex items-center gap-3">
                <StrokeThumbnail
                  stroke={stroke}
                  smoothing={smoothing}
                  strokeColor={strokeColor}
                />
                <span className="text-xs font-medium text-muted">
                  Stroke {index + 1}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <label className="flex items-center gap-1.5">
                  <span className="text-xs text-muted">
                    Delay
                  </span>
                  <input
                    type="number"
                    min={0}
                    step={50}
                    value={kf.delay}
                    onChange={(e) =>
                      handleDelay(stroke.id, Number(e.target.value))
                    }
                    className="w-20 rounded border border-border bg-background px-2 py-1 text-xs text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                  <span className="text-xs text-muted">ms</span>
                </label>

                <label className="flex items-center gap-1.5">
                  <span className="text-xs text-muted">
                    Duration
                  </span>
                  <input
                    type="number"
                    min={50}
                    step={50}
                    value={kf.duration}
                    onChange={(e) =>
                      handleDuration(stroke.id, Number(e.target.value))
                    }
                    className="w-20 rounded border border-border bg-background px-2 py-1 text-xs text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                  <span className="text-xs text-muted">ms</span>
                </label>

                <label className="flex items-center gap-1.5">
                  <span className="text-xs text-muted">
                    Easing
                  </span>
                  <select
                    value={kf.easing}
                    onChange={(e) =>
                      handleEasing(stroke.id, e.target.value as EasingPreset)
                    }
                    className="rounded border border-border bg-background px-2 py-1 text-xs text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  >
                    {EASING_OPTIONS.map((preset) => (
                      <option key={preset} value={preset}>
                        {preset}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
