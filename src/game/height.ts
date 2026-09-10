import { WORLD_HALF, WATER_Y } from "./constants";
import { clamp, dist2, fbm, lerp } from "./rng";
import type { BiomeId } from "./types";

export function heightAt(x: number, z: number): number {
  const n = fbm(x * 0.0075, z * 0.0075, 5);
  let h = (n - 0.42) * 14;

  const pr = dist2(x, z, 72, 48);
  if (pr < 42) {
    const t = 1 - pr / 42;
    h += t * t * 24;
    if (z < 52 && pr < 18) h += (1 - pr / 18) * 10;
  }

  const tl = dist2(x, z, 220, 70);
  if (tl < 62) h += Math.pow(1 - tl / 62, 1.15) * 30;

  if (x < -30) {
    h += (fbm(x * 0.02 + 9, z * 0.02, 3) - 0.35) * 12 + 2.5;
    const mesa = dist2(x, z, -170, 10);
    if (mesa < 28) h += (1 - mesa / 28) * 8;
  }

  const wh = dist2(x, z, 18, -70);
  if (wh < 32) {
    const t = 1 - wh / 32;
    h = lerp(h, -1.35, t * t);
  }

  const river = Math.abs(z + 0.18 * x + Math.sin(x * 0.035) * 10 + 52);
  if (river < 8 && x < 90 && x > -80) h = Math.min(h, lerp(-1.0, h, river / 8));

  const falls = dist2(x, z, 190, 120);
  if (falls < 16) h = lerp(h, Math.max(h, 10) - (1 - falls / 16) * 6, 0.7);

  if (z < -170) h += (fbm(x * 0.03, z * 0.03, 2) - 0.5) * 6 - 1;
  if (z > 180) h += Math.max(0, (z - 180) * 0.12) + fbm(x * 0.02, z * 0.02, 3) * 8;

  const cave = dist2(x, z, 56, 64);
  if (cave < 8) h -= (1 - cave / 8) * 5;

  return h;
}

export function slopeAt(x: number, z: number): { ny: number; nx: number; nz: number } {
  const e = 1.1;
  const hL = heightAt(x - e, z);
  const hR = heightAt(x + e, z);
  const hD = heightAt(x, z - e);
  const hU = heightAt(x, z + e);
  const nx = hL - hR;
  const nz = hD - hU;
  const ny = 2 * e;
  const l = Math.hypot(nx, ny, nz) || 1;
  return { nx: nx / l, ny: ny / l, nz: nz / l };
}

export function biomeAt(x: number, z: number): BiomeId {
  if (heightAt(x, z) < WATER_Y + 0.4) return "water";
  if (z < -175) return "desert";
  if (z > 175) return "mountains";
  if (x > 165) return "tree";
  if (x < -45) return "outlands";
  const n = fbm(x * 0.02, z * 0.02, 2);
  if (n > 0.62 && z > 90) return "forest";
  return "pride";
}

export function regionName(x: number, z: number): string {
  const b = biomeAt(x, z);
  if (dist2(x, z, 72, 48) < 28) return "Скала Предков";
  if (dist2(x, z, 220, 70) < 40) return "Древо жизни";
  if (dist2(x, z, 18, -70) < 34) return "Большие Источники";
  if (dist2(x, z, -160, 22) < 28) return "Лагерь гиен";
  if (dist2(x, z, 100, -20) < 16) return "Баобаб Рафики";
  if (dist2(x, z, 40, 140) < 22) return "Оазис беззаботных";
  switch (b) {
    case "outlands":
      return "Земли Изгнанников";
    case "tree":
      return "Земли Древа жизни";
    case "water":
      return "Воды Круга жизни";
    case "desert":
      return "Южные пустоши";
    case "mountains":
      return "Северные кряжи";
    case "forest":
      return "Редколесье";
    default:
      return "Земли Прайда";
  }
}

export function biomeColor(x: number, z: number, h: number): { r: number; g: number; b: number } {
  const b = biomeAt(x, z);
  let r = 0.55, g = 0.5, bl = 0.28;
  if (b === "pride") {
    r = 0.62; g = 0.56; bl = 0.28;
    if (h > 10) { r = 0.5; g = 0.46; bl = 0.32; }
  } else if (b === "outlands") {
    r = 0.52; g = 0.32; bl = 0.2;
  } else if (b === "tree") {
    r = 0.28; g = 0.48; bl = 0.3;
  } else if (b === "water") {
    r = 0.18; g = 0.32; bl = 0.28;
  } else if (b === "desert") {
    r = 0.72; g = 0.58; bl = 0.32;
  } else if (b === "mountains") {
    r = 0.45; g = 0.44; bl = 0.4;
  } else {
    r = 0.3; g = 0.46; bl = 0.26;
  }
  const n = fbm(x * 0.05, z * 0.05, 2);
  r += (n - 0.5) * 0.08;
  g += (n - 0.5) * 0.06;
  const rock = clamp((h - 14) * 0.04, 0, 0.4);
  r = lerp(r, 0.42, rock);
  g = lerp(g, 0.4, rock);
  bl = lerp(bl, 0.36, rock);
  return { r, g, b: bl };
}

export function inWorld(x: number, z: number): boolean {
  return Math.abs(x) <= WORLD_HALF + 8 && Math.abs(z) <= WORLD_HALF + 8;
}
