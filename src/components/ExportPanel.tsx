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
}

export default function ExportPanel({
  strokes,
  keyframes,
  strokeColor,
  strokeWidth,
  smoothing,
  canvasWidth,
  canvasHeight,
}: ExportPanelProps) {
  const [background, setBackground] = useState("");
  const [copied, setCopied] = useState(false);

  const hasStrokes = strokes.length > 0 && keyframes.length > 0;

  function buildSVG(): string {
    return exportAnimatedSVG(strokes, keyframes, {
      color: strokeColor,
      width: strokeWidth,
      smoothing,
      canvasWidth,
      canvasHeight,
      background: background.trim() || undefined,
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
            <label className="text-muted text-xs font-medium uppercase tracking-wide">
              Background color
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={background || "#ffffff"}
                onChange={(e) => setBackground(e.target.value)}
                className="w-8 h-8 rounded cursor-pointer border border-border bg-transparent"
              />
              <input
                type="text"
                value={background}
                onChange={(e) => setBackground(e.target.value)}
                placeholder="transparent"
                className="flex-1 px-3 py-1.5 text-sm bg-background border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
              />
              {background && (
                <button
                  onClick={() => setBackground("")}
                  className="text-muted hover:text-foreground text-xs transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent rounded"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

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
        </>
      )}
    </div>
  );
}
