"use client";

import { useState } from "react";
import { Stroke, StrokeKeyframe } from "@/lib/types";
import { exportAnimatedSVG } from "@/lib/export";

interface ExportPanelProps {
  strokes: Stroke[];
  keyframes: StrokeKeyframe[];
  strokeColor: string;
  strokeWidth: number;
  smoothing: boolean;
  canvasWidth: number;
  canvasHeight: number;
  background?: string;
  mode: "simple" | "advanced";
}

export default function ExportPanel({
  strokes,
  keyframes,
  strokeColor,
  strokeWidth,
  smoothing,
  canvasWidth,
  canvasHeight,
  background = "",
  mode,
}: ExportPanelProps) {
  const [showSvgCode, setShowSvgCode] = useState(false);
  const [copied, setCopied] = useState(false);

  const hasStrokes = strokes.length > 0 && keyframes.length > 0;

  function buildSVG(): string {
    return exportAnimatedSVG(strokes, keyframes, {
      color: strokeColor,
      width: strokeWidth,
      smoothing,
      canvasWidth,
      canvasHeight,
      background: background?.trim() || undefined,
    });
  }

  function handleDownload() {
    const svg = buildSVG();
    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "signature.svg";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleCopy() {
    const svg = buildSVG();
    await navigator.clipboard.writeText(svg);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const previewCode = hasStrokes
    ? (() => {
        const svg = buildSVG();
        return svg.length > 2000 ? svg.slice(0, 2000) + "..." : svg;
      })()
    : "";

  return (
    <div className="flex flex-col gap-4">
      {!hasStrokes ? (
        <p className="text-muted text-sm">Nothing to export yet</p>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-accent text-accent-foreground text-sm font-medium rounded-lg hover:opacity-90 active:scale-[0.98] transition-[opacity,transform] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                Download SVG
              </button>
              <button
                onClick={handleCopy}
                className="px-4 py-2 bg-surface border border-border text-foreground text-sm font-medium rounded-lg hover:bg-border/50 transition-colors min-w-[90px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                {copied ? "Copied!" : "Copy SVG"}
              </button>
            </div>
            {mode === "simple" && (
              <p className="text-muted text-xs">
                Exported file uses the same background as the preview.
              </p>
            )}
            {mode === "advanced" && (
              <>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showSvgCode}
                    onChange={(e) => setShowSvgCode(e.target.checked)}
                    className="rounded border-border text-accent focus:ring-accent"
                  />
                  <span className="text-sm text-muted">Show SVG code</span>
                </label>
                {showSvgCode && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-muted text-xs font-medium uppercase tracking-wide">
                      SVG preview
                    </label>
                    <textarea
                      readOnly
                      value={previewCode}
                      rows={8}
                      className="w-full px-3 py-2 text-xs font-mono bg-surface border border-border rounded-lg text-muted resize-none focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
