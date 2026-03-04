"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Stroke, Point } from "@/lib/types";
import {
  buildRawPath,
  buildSmoothPath,
  computePathLength,
} from "@/lib/smoothing";

interface DrawCanvasProps {
  strokes: Stroke[];
  onStrokeComplete: (stroke: Stroke) => void;
  onUndo: () => void;
  onClear: () => void;
  strokeColor: string;
  strokeWidth: number;
  smoothing: boolean;
  canvasWidth: number;
  canvasHeight: number;
}

export default function DrawCanvas({
  strokes,
  onStrokeComplete,
  onUndo,
  onClear,
  strokeColor,
  strokeWidth,
  smoothing,
  canvasWidth,
  canvasHeight,
}: DrawCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const isDrawingRef = useRef(false);
  const currentPointsRef = useRef<Point[]>([]);
  const shiftKeyRef = useRef(false);
  const liveStraightEndpointRef = useRef<Point | null>(null);
  const [livePoints, setLivePoints] = useState<Point[]>([]);

  // Track Shift key so straight-line mode works even when canvas doesn't have focus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Shift") shiftKeyRef.current = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Shift") {
        if (
          isDrawingRef.current &&
          liveStraightEndpointRef.current != null
        ) {
          currentPointsRef.current = [
            ...currentPointsRef.current,
            liveStraightEndpointRef.current,
          ];
          setLivePoints([...currentPointsRef.current]);
          liveStraightEndpointRef.current = null;
        }
        shiftKeyRef.current = false;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  const getSVGCoords = useCallback(
    (e: PointerEvent): { x: number; y: number } => {
      const svg = svgRef.current;
      if (!svg) return { x: 0, y: 0 };
      const rect = svg.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    },
    []
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      e.preventDefault();
      svgRef.current?.setPointerCapture(e.pointerId);
      isDrawingRef.current = true;
      liveStraightEndpointRef.current = null;

      const { x, y } = getSVGCoords(e.nativeEvent);
      const point: Point = {
        x,
        y,
        pressure: e.pressure > 0 ? e.pressure : 0.5,
        timestamp: performance.now(),
      };

      currentPointsRef.current = [point];
      setLivePoints([point]);
    },
    [getSVGCoords]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (!isDrawingRef.current) return;
      e.preventDefault();

      const { x, y } = getSVGCoords(e.nativeEvent);
      const point: Point = {
        x,
        y,
        pressure: e.pressure > 0 ? e.pressure : 0.5,
        timestamp: performance.now(),
      };

      if (shiftKeyRef.current) {
        liveStraightEndpointRef.current = point;
        setLivePoints([...currentPointsRef.current, point]);
      } else {
        liveStraightEndpointRef.current = null;
        currentPointsRef.current = [...currentPointsRef.current, point];
        setLivePoints((prev) => [...prev, point]);
      }
    },
    [getSVGCoords]
  );

  const finishStroke = useCallback(() => {
    if (!isDrawingRef.current) return;
    const endpoint = liveStraightEndpointRef.current;
    if (endpoint != null) {
      currentPointsRef.current = [...currentPointsRef.current, endpoint];
      liveStraightEndpointRef.current = null;
    }
    isDrawingRef.current = false;

    const points = currentPointsRef.current;
    currentPointsRef.current = [];
    setLivePoints([]);

    if (points.length === 0) return;

    const pathData = buildRawPath(points);
    const smoothPathData = buildSmoothPath(points);
    const pathLength = computePathLength(points);
    const smoothPathLength = computePathLength(
      // Use the same points; smooth path length is approximate via point chain
      points
    );

    const stroke: Stroke = {
      id: crypto.randomUUID(),
      points,
      pathData,
      smoothPathData,
      pathLength,
      smoothPathLength,
      baseWidth: strokeWidth,
    };

    onStrokeComplete(stroke);
  }, [strokeWidth, onStrokeComplete]);

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      e.preventDefault();
      svgRef.current?.releasePointerCapture(e.pointerId);
      finishStroke();
    },
    [finishStroke]
  );

  const handlePointerLeave = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (!isDrawingRef.current) return;
      e.preventDefault();
      finishStroke();
    },
    [finishStroke]
  );

  // Cancel drawing if the pointer is released outside the window
  useEffect(() => {
    const handleWindowPointerUp = () => {
      if (isDrawingRef.current) {
        finishStroke();
      }
    };
    window.addEventListener("pointerup", handleWindowPointerUp);
    return () => window.removeEventListener("pointerup", handleWindowPointerUp);
  }, [finishStroke]);

  const livePathData =
    livePoints.length > 0
      ? smoothing
        ? buildSmoothPath(livePoints)
        : buildRawPath(livePoints)
      : null;

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Toolbar */}
      <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 shadow-sm">
        <button
          onClick={onUndo}
          disabled={strokes.length === 0}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-border/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-40"
          title="Undo last stroke"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 14L4 9l5-5" />
            <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
          </svg>
          Undo
        </button>

        <div className="h-4 w-px bg-border" />

        <button
          onClick={onClear}
          disabled={strokes.length === 0}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-border/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-40"
          title="Clear all strokes"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 6h18" />
            <path d="M8 6V4h8v2" />
            <path d="M19 6l-1 14H6L5 6" />
          </svg>
          Clear
        </button>

        <div className="h-4 w-px bg-border" />

        <div className="flex items-center gap-1.5 px-1">
          <span className="text-sm text-muted">Mode:</span>
          <span
            className={`rounded px-2 py-0.5 text-xs font-semibold ${
              smoothing
                ? "bg-accent/15 text-accent"
                : "bg-border/50 text-muted"
            }`}
          >
            {smoothing ? "Smooth" : "Raw"}
          </span>
        </div>

        <div className="h-4 w-px bg-border" />

        <span
          className="text-xs text-muted px-1"
          title="Hold Shift while drawing to constrain the current segment to a straight line"
        >
          Shift: straight line
        </span>
      </div>

      {/* Canvas */}
      <div
        className="canvas-workspace overflow-hidden rounded-xl border border-border"
        style={{ width: canvasWidth, height: canvasHeight }}
      >
        <svg
          ref={svgRef}
          width={canvasWidth}
          height={canvasHeight}
          viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
          className="block bg-surface"
          style={{ touchAction: "none", cursor: "crosshair" }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerLeave}
        >
          {/* Committed strokes */}
          {strokes.map((stroke) => (
            <path
              key={stroke.id}
              d={smoothing ? stroke.smoothPathData : stroke.pathData}
              stroke={strokeColor}
              fill="none"
              strokeWidth={stroke.baseWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}

          {/* Live in-progress stroke */}
          {livePathData && (
            <path
              d={livePathData}
              stroke={strokeColor}
              fill="none"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </svg>
      </div>
    </div>
  );
}
