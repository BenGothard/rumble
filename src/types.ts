export interface Vector2 {
  x: number;
  y: number;
}

export const zero: Vector2 = { x: 0, y: 0 };

export function add(a: Vector2, b: Vector2): Vector2 {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function scale(v: Vector2, scalar: number): Vector2 {
  return { x: v.x * scalar, y: v.y * scalar };
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function clampVector(pos: Vector2, min: Vector2, max: Vector2): Vector2 {
  return {
    x: clamp(pos.x, min.x, max.x),
    y: clamp(pos.y, min.y, max.y),
  };
}

export function distance(a: Vector2, b: Vector2): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}
