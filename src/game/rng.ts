export function hash2(x: number, y: number): number {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return s - Math.floor(s);
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function clamp(v: number, a: number, b: number): number {
  return Math.max(a, Math.min(b, v));
}

export function smooth(t: number): number {
  return t * t * (3 - 2 * t);
}

export function noise2(x: number, y: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = smooth(fx);
  const uy = smooth(fy);
  return lerp(
    lerp(hash2(ix, iy), hash2(ix + 1, iy), ux),
    lerp(hash2(ix, iy + 1), hash2(ix + 1, iy + 1), ux),
    uy,
  );
}

export function fbm(x: number, z: number, oct = 4): number {
  let a = 0;
  let amp = 1;
  let f = 1;
  let n = 0;
  for (let i = 0; i < oct; i++) {
    a += amp * noise2(x * f, z * f);
    n += amp;
    amp *= 0.5;
    f *= 2.03;
  }
  return a / n;
}

export function dist2(ax: number, az: number, bx: number, bz: number): number {
  const dx = ax - bx;
  const dz = az - bz;
  return Math.hypot(dx, dz);
}

export function wrapPi(a: number): number {
  return Math.atan2(Math.sin(a), Math.cos(a));
}

export function lerpAngle(a: number, b: number, t: number): number {
  return a + wrapPi(b - a) * t;
}

export function expLerp(cur: number, target: number, k: number, dt: number): number {
  return cur + (target - cur) * (1 - Math.exp(-k * dt));
}

export function pick<T>(arr: T[], r: number): T {
  return arr[Math.floor(r * arr.length) % arr.length]!;
}

export class Rng {
  s: number;
  constructor(seed: number) {
    this.s = seed >>> 0 || 1;
  }
  next(): number {
    this.s = (this.s * 1664525 + 1013904223) >>> 0;
    return this.s / 4294967296;
  }
  range(a: number, b: number): number {
    return a + (b - a) * this.next();
  }
  int(a: number, b: number): number {
    return Math.floor(this.range(a, b + 1));
  }
}
