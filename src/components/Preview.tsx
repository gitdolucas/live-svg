"use client";

import { useState, useEffect } from "react";
import { Stroke, StrokeKeyframe } from "@/lib/types";
import { generatePreviewSVG } from "@/lib/export";

interface PreviewProps {
  strokes: Stroke[];
  keyframes: StrokeKeyframe[];
  strokeColor: string;
  strokeWidth: number;
  smoothing: boolean;
  canvasWidth: number;
  canvasHeight: number;
  background?: string;
}

export default function Preview({
  strokes,
  keyframes,
  strokeColor,
  strokeWidth,
  smoothing,
  canvasWidth,
  canvasHeight,
  background,
}: PreviewProps) {
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [animationKey, setAnimationKey] = useState(0);

  const hasStrokes = strokes.length > 0 && keyframes.length > 0;

  useEffect(() => {
    if (!svgContent || !hasStrokes) return;
    const svg = generatePreviewSVG(strokes, keyframes, {
      color: strokeColor,
      width: strokeWidth,
      smoothing,
      canvasWidth,
      canvasHeight,
      background: background?.trim() || undefined,
    });
    setSvgContent(svg);
    setAnimationKey((k) => k + 1);
  }, [strokeColor, strokeWidth, background]);

  function handlePlay() {
    const svg = generatePreviewSVG(strokes, keyframes, {
      color: strokeColor,
      width: strokeWidth,
      smoothing,
      canvasWidth,
      canvasHeight,
      background: background?.trim() || undefined,
    });
    setSvgContent(svg);
    setAnimationKey((k) => k + 1);
  }

  function handleReset() {
    setSvgContent(null);
    setAnimationKey((k) => k + 1);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <button
          onClick={handlePlay}
          disabled={!hasStrokes}
          className="px-4 py-2 bg-accent text-accent-foreground text-sm font-medium rounded-lg hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-[opacity,transform] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Play
        </button>
        <button
          onClick={handleReset}
          disabled={!svgContent}
          className="px-4 py-2 bg-surface border border-border text-foreground text-sm font-medium rounded-lg hover:bg-border/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Reset
        </button>
      </div>

      <div
        className="w-full border border-border rounded-xl overflow-hidden bg-surface relative"
        style={{ aspectRatio: `${canvasWidth} / ${canvasHeight}` }}
      >
        {!hasStrokes ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-muted text-sm text-center px-4">
              Add strokes and configure timing first
            </p>
          </div>
        ) : svgContent ? (
          <div
            key={animationKey}
            className="preview-svg-container absolute inset-0 w-full h-full"
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-muted text-sm text-center px-4">
              Press Play to preview the animation
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
