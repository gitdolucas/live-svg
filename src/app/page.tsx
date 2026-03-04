"use client";

import { useState, useCallback, useEffect } from "react";
import { Stroke, StrokeKeyframe, EasingPreset } from "@/lib/types";
import DrawCanvas from "@/components/DrawCanvas";
import Timeline from "@/components/Timeline";
import Preview from "@/components/Preview";
import ExportPanel from "@/components/ExportPanel";

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 400;
const DEFAULT_DURATION = 500;
const DEFAULT_EASING: EasingPreset = "ease-in-out";
const SEQUENCE_OVERLAP = 0.7;

const SECTION_DELAYS = [0, 80, 160, 240, 320, 400];

export default function Home() {
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [keyframes, setKeyframes] = useState<StrokeKeyframe[]>([]);
  const [strokeColor, setStrokeColor] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [smoothing, setSmoothing] = useState(true);
  const [background, setBackground] = useState("");
  const [advancedMode, setAdvancedMode] = useState(false);

  const onStrokeComplete = useCallback((stroke: Stroke) => {
    setStrokes((prev) => [...prev, stroke]);
    setKeyframes((prev) => {
      const last = prev[prev.length - 1];
      const delay =
        last != null
          ? Math.round(last.delay + last.duration * SEQUENCE_OVERLAP)
          : 0;
      const newKf: StrokeKeyframe = {
        strokeId: stroke.id,
        delay,
        duration: DEFAULT_DURATION,
        easing: DEFAULT_EASING,
      };
      return [...prev, newKf];
    });
  }, []);

  const onUndo = useCallback(() => {
    if (strokes.length === 0) return;
    const nextStrokes = strokes.slice(0, -1);
    const ids = new Set(nextStrokes.map((s) => s.id));
    setStrokes(nextStrokes);
    setKeyframes((kf) => kf.filter((x) => ids.has(x.strokeId)));
  }, [strokes]);

  const onClear = useCallback(() => {
    setStrokes([]);
    setKeyframes([]);
  }, []);

  const onKeyframesChange = useCallback((next: StrokeKeyframe[]) => {
    setKeyframes(next);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        onUndo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onUndo]);

  return (
    <div className="min-h-screen bg-background text-foreground relative z-10">
      <div className="mx-auto max-w-4xl px-4 py-10 flex flex-col gap-12">
        <header
          className="text-center animate-section-reveal"
          style={{ animationDelay: "0ms", animationFillMode: "backwards" }}
        >
          <h1 className="font-serif text-3xl md:text-4xl font-normal tracking-tight text-foreground">
            Live SVG – Signature animator
          </h1>
          <p className="mt-2 text-sm text-muted">
            Draw your signature, set timing and easing, then export an animated
            SVG.
          </p>
          <div className="mt-6 flex justify-center gap-0 rounded-lg border border-border bg-surface p-0.5">
            <button
              type="button"
              onClick={() => setAdvancedMode(false)}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                !advancedMode
                  ? "bg-accent text-accent-foreground"
                  : "text-muted hover:text-foreground"
              }`}
            >
              Simple
            </button>
            <button
              type="button"
              onClick={() => setAdvancedMode(true)}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                advancedMode
                  ? "bg-accent text-accent-foreground"
                  : "text-muted hover:text-foreground"
              }`}
            >
              Advanced
            </button>
          </div>
          <div className="mt-6 h-px w-16 mx-auto bg-border" aria-hidden />
        </header>

        {/* Draw */}
        <section
          className="flex flex-col gap-3 opacity-0 animate-section-reveal"
          style={{
            animationDelay: `${SECTION_DELAYS[1]}ms`,
            animationFillMode: "forwards",
          }}
        >
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">
            Draw
          </h2>
          <DrawCanvas
            strokes={strokes}
            onStrokeComplete={onStrokeComplete}
            onUndo={onUndo}
            onClear={onClear}
            strokeColor={strokeColor}
            strokeWidth={strokeWidth}
            smoothing={smoothing}
            canvasWidth={CANVAS_WIDTH}
            canvasHeight={CANVAS_HEIGHT}
          />
        </section>

        {/* Settings */}
        <section
          className="flex flex-col gap-3 opacity-0 animate-section-reveal"
          style={{
            animationDelay: `${SECTION_DELAYS[2]}ms`,
            animationFillMode: "forwards",
          }}
        >
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">
            Settings
          </h2>
          <div className="flex flex-wrap items-center gap-6 rounded-xl border border-border bg-surface p-4 shadow-sm">
            <label className="flex items-center gap-2">
              <span className="text-sm text-muted">Color</span>
              <input
                type="color"
                value={strokeColor}
                onChange={(e) => setStrokeColor(e.target.value)}
                className="h-9 w-12 rounded border border-border cursor-pointer bg-transparent"
              />
              <input
                type="text"
                value={strokeColor}
                onChange={(e) => setStrokeColor(e.target.value)}
                className="w-24 rounded border border-border bg-background px-2 py-1.5 text-sm font-mono text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
              {!advancedMode && (
                <span className="text-xs text-muted">
                  This color is used in the exported file.
                </span>
              )}
            </label>
            <label className="flex items-center gap-2">
              <span className="text-sm text-muted">Width</span>
              <input
                type="number"
                min={0.5}
                max={20}
                step={0.5}
                value={strokeWidth}
                onChange={(e) => setStrokeWidth(Number(e.target.value))}
                className="w-20 rounded border border-border bg-background px-2 py-1.5 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </label>
            {advancedMode && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted">Path</span>
                <button
                  type="button"
                  onClick={() => setSmoothing(!smoothing)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    smoothing
                      ? "bg-accent text-accent-foreground"
                      : "bg-surface border border-border text-muted hover:bg-border/50"
                  }`}
                >
                  {smoothing ? "Smooth" : "Raw"}
                </button>
              </div>
            )}
          </div>
        </section>

        {advancedMode && (
          <section
            className="flex flex-col gap-3 opacity-0 animate-section-reveal"
            style={{
              animationDelay: `${SECTION_DELAYS[3]}ms`,
              animationFillMode: "forwards",
            }}
          >
            <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">
              Timeline
            </h2>
            <Timeline
              strokes={strokes}
              keyframes={keyframes}
              onKeyframesChange={onKeyframesChange}
              smoothing={smoothing}
              strokeColor={strokeColor}
            />
          </section>
        )}

        {/* Preview */}
        <section
          className="flex flex-col gap-3 opacity-0 animate-section-reveal"
          style={{
            animationDelay: `${SECTION_DELAYS[4]}ms`,
            animationFillMode: "forwards",
          }}
        >
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">
            Preview
          </h2>
          <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-surface p-4 shadow-sm">
            <label className="flex items-center gap-2">
              <span className="text-sm text-muted">Background</span>
              <input
                type="color"
                value={background || "#ffffff"}
                onChange={(e) => setBackground(e.target.value)}
                className="h-8 w-10 rounded border border-border cursor-pointer bg-transparent"
              />
              <input
                type="text"
                value={background}
                onChange={(e) => setBackground(e.target.value)}
                placeholder="transparent"
                className="w-28 rounded border border-border bg-background px-2 py-1 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
              <button
                type="button"
                onClick={() => {
                  setBackground("");
                  onClear();
                }}
                className="text-muted hover:text-foreground text-xs transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent rounded"
              >
                Clear
              </button>
              <span className="text-xs text-muted">
                Clear also resets the animation.
              </span>
            </label>
          </div>
          <Preview
            strokes={strokes}
            keyframes={keyframes}
            strokeColor={strokeColor}
            strokeWidth={strokeWidth}
            smoothing={smoothing}
            canvasWidth={CANVAS_WIDTH}
            canvasHeight={CANVAS_HEIGHT}
            background={background}
          />
        </section>

        {/* Export */}
        <section
          className="flex flex-col gap-3 opacity-0 animate-section-reveal"
          style={{
            animationDelay: `${SECTION_DELAYS[5]}ms`,
            animationFillMode: "forwards",
          }}
        >
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">
            Export
          </h2>
          <ExportPanel
            strokes={strokes}
            keyframes={keyframes}
            strokeColor={strokeColor}
            strokeWidth={strokeWidth}
            smoothing={smoothing}
            canvasWidth={CANVAS_WIDTH}
            canvasHeight={CANVAS_HEIGHT}
            background={background}
            mode={advancedMode ? "advanced" : "simple"}
          />
        </section>
      </div>
    </div>
  );
}
