import { Point } from './types';

// Ramer-Douglas-Peucker perpendicular distance from point to line segment
function perpendicularDistance(point: Point, lineStart: Point, lineEnd: Point): number {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;

  if (dx === 0 && dy === 0) {
    // Line start and end are the same point
    return Math.hypot(point.x - lineStart.x, point.y - lineStart.y);
  }

  const t = ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / (dx * dx + dy * dy);
  const nearestX = lineStart.x + t * dx;
  const nearestY = lineStart.y + t * dy;

  return Math.hypot(point.x - nearestX, point.y - nearestY);
}

// Ramer-Douglas-Peucker simplification algorithm
function rdp(points: Point[], tolerance: number, start: number, end: number, mask: boolean[]): void {
  if (end <= start + 1) return;

  let maxDistance = 0;
  let maxIndex = start;

  for (let i = start + 1; i < end; i++) {
    const dist = perpendicularDistance(points[i], points[start], points[end]);
    if (dist > maxDistance) {
      maxDistance = dist;
      maxIndex = i;
    }
  }

  if (maxDistance > tolerance) {
    mask[maxIndex] = true;
    rdp(points, tolerance, start, maxIndex, mask);
    rdp(points, tolerance, maxIndex, end, mask);
  }
}

export function simplifyPoints(points: Point[], tolerance = 1.5): Point[] {
  if (points.length <= 2) return points;

  const mask = new Array(points.length).fill(false);
  mask[0] = true;
  mask[points.length - 1] = true;

  rdp(points, tolerance, 0, points.length - 1, mask);

  return points.filter((_, i) => mask[i]);
}

// Build raw SVG path data using M and L commands
export function buildRawPath(points: Point[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x},${points[0].y}`;

  const parts: string[] = [`M ${points[0].x},${points[0].y}`];
  for (let i = 1; i < points.length; i++) {
    parts.push(`L ${points[i].x},${points[i].y}`);
  }

  return parts.join(' ');
}

// Build smooth SVG path data using quadratic bezier curves through midpoints
// Connects midpoint-to-midpoint segments with Q commands for a natural calligraphic feel
export function buildSmoothPath(points: Point[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x},${points[0].y}`;
  if (points.length === 2) {
    return `M ${points[0].x},${points[0].y} L ${points[1].x},${points[1].y}`;
  }

  const simplified = simplifyPoints(points);

  if (simplified.length <= 2) {
    return buildRawPath(simplified);
  }

  // Start at the first point
  const parts: string[] = [`M ${simplified[0].x},${simplified[0].y}`];

  // Line to the midpoint between the first and second points
  let midX = (simplified[0].x + simplified[1].x) / 2;
  let midY = (simplified[0].y + simplified[1].y) / 2;
  parts.push(`L ${midX},${midY}`);

  // Quadratic bezier curves: control point is the actual point,
  // end point is the midpoint to the next segment
  for (let i = 1; i < simplified.length - 1; i++) {
    const nextMidX = (simplified[i].x + simplified[i + 1].x) / 2;
    const nextMidY = (simplified[i].y + simplified[i + 1].y) / 2;
    parts.push(`Q ${simplified[i].x},${simplified[i].y} ${nextMidX},${nextMidY}`);
  }

  // Line to the final point
  const last = simplified[simplified.length - 1];
  parts.push(`L ${last.x},${last.y}`);

  return parts.join(' ');
}

// Compute approximate path length from a sequence of points
export function computePathLength(points: Point[]): number {
  if (points.length < 2) return 0;

  let length = 0;
  for (let i = 1; i < points.length; i++) {
    length += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
  }

  return length;
}
