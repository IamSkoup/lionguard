import * as THREE from "three";
import { makeNpcMesh, animateAnimal } from "./animals";
import { NAMED } from "./content";
import { heightAt } from "./height";
import { WATER_Y } from "./constants";
import { clamp, dist2, hash2, Rng } from "./rng";
import type { AiState, CharacterId, Disposition, FactionId, NpcKind } from "./types";

export type Npc = {
  id: string;
  name: string;
  kind: NpcKind;
  x: number;
  y: number;
  z: number;
  yaw: number;
  vx: number;
  vz: number;
  hp: number;
  maxHp: number;
  state: AiState;
  timer: number;
  homeX: number;
  homeZ: number;
  wander: number;
  faction: FactionId;
  disposition: Disposition;
  named: boolean;
  mesh: THREE.Group;
  aggro: number;
  talkCd: number;
  escort: boolean;
  airborne: number;
  seed: number;
  alive: boolean;
  speed: number;
};

const KIND_HP: Partial<Record<NpcKind, number>> = {
  lion: 90,
  lioness: 80,
  hyena: 55,
  cheetah: 50,
  leopard: 70,
  elephant: 160,
  hippo: 140,
  hippoGuard: 150,
  croc: 70,
  giraffe: 80,
  zebra: 40,
  gazelle: 28,
  bird: 18,
};

function wildKind(r: number): NpcKind {
  if (r < 0.18) return "gazelle";
  if (r < 0.32) return "zebra";
  if (r < 0.4) return "giraffe";
  if (r < 0.46) return "elephant";
  if (r < 0.55) return "hyena";
  if (r < 0.62) return "bird";
  if (r < 0.7) return "cheetah";
  if (r < 0.78) return "lioness";
  if (r < 0.84) return "croc";
  if (r < 0.9) return "hippo";
  return "warthog";
}

export class NpcWorld {
  list: Npc[] = [];
  scene: THREE.Scene;
  rng = new Rng(42);
  byId = new Map<string, Npc>();

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  spawnAll() {
    for (const n of NAMED) {
      this.spawn({
        id: n.id,
        name: n.name,
        kind: n.kind,
        x: n.x,
        z: n.z,
        faction: n.faction,
        disposition: n.disposition,
        named: true,
        wander: n.homeWander,
      });
    }
    this.spawn({
      id: "cub",
      name: "Львёнок",
      kind: "lioness",
      x: 40,
      z: 140,
      faction: "pride",
      disposition: "skittish",
      named: true,
      wander: 4,
    });
    for (let i = 0; i < 42; i++) {
      const x = (this.rng.next() - 0.5) * 430;
      const z = (this.rng.next() - 0.5) * 430;
      const kind = wildKind(this.rng.next());
      let disp: Disposition = "neutral";
      if (kind === "gazelle" || kind === "zebra" || kind === "giraffe") disp = "skittish";
      if (kind === "hyena" && x < -40) disp = this.rng.next() < 0.35 ? "hostile" : "neutral";
      if (kind === "croc") disp = this.rng.next() < 0.4 ? "hostile" : "neutral";
      if (kind === "leopard") disp = "hostile";
      this.spawn({
        id: `w${i}`,
        name: kind,
        kind,
        x,
        z,
        faction: kind === "hyena" ? "hyena" : kind === "croc" || kind === "hippo" ? "river" : "wild",
        disposition: disp,
        named: false,
        wander: 18 + this.rng.next() * 22,
      });
    }
  }

  spawn(p: {
    id: string;
    name: string;
    kind: NpcKind;
    x: number;
    z: number;
    faction: FactionId;
    disposition: Disposition;
    named: boolean;
    wander: number;
  }): Npc {
    const mesh = makeNpcMesh(p.kind, hash2(p.x, p.z) * 99);
    const hp = KIND_HP[p.kind] ?? 40;
    const npc: Npc = {
      id: p.id,
      name: p.name,
      kind: p.kind,
      x: p.x,
      y: heightAt(p.x, p.z) + 0.2,
      z: p.z,
      yaw: this.rng.next() * Math.PI * 2,
      vx: 0,
      vz: 0,
      hp,
      maxHp: hp,
      state: "wander",
      timer: this.rng.next() * 4,
      homeX: p.x,
      homeZ: p.z,
      wander: p.wander,
      faction: p.faction,
      disposition: p.disposition,
      named: p.named,
      mesh,
      aggro: 0,
      talkCd: 0,
      escort: false,
      airborne: 0,
      seed: this.rng.next() * 100,
      alive: true,
      speed: 3.2 + this.rng.next() * 2.4,
    };
    if (p.kind === "gazelle") npc.speed = 9;
    if (p.kind === "cheetah") npc.speed = 11;
    if (p.kind === "hyena") npc.speed = 7.2;
    if (p.kind === "bird") npc.speed = 8;
    this.scene.add(mesh);
    this.list.push(npc);
    this.byId.set(npc.id, npc);
    return npc;
  }

  spawnHostile(kind: NpcKind, x: number, z: number, id?: string): Npc {
    return this.spawn({
      id: id ?? `h${Math.floor(Math.random() * 99999)}`,
      name: kind,
      kind,
      x,
      z,
      faction: kind === "hyena" ? "hyena" : kind === "croc" ? "river" : "outlands",
      disposition: "hostile",
      named: false,
      wander: 16,
    });
  }

  nearest(x: number, z: number, pred: (n: Npc) => boolean, max = 14): Npc | null {
    let best: Npc | null = null;
    let bd = max;
    for (const n of this.list) {
      if (!n.alive || !pred(n)) continue;
      const d = dist2(x, z, n.x, n.z);
      if (d < bd) {
        bd = d;
        best = n;
      }
    }
    return best;
  }

  update(
    dt: number,
    t: number,
    player: { x: number; z: number; yaw: number; attacking: boolean; roaring: boolean; id: CharacterId },
    wanted: number,
    night: boolean,
  ) {
    const px = player.x;
    const pz = player.z;
    for (const n of this.list) {
      if (!n.alive) {
        n.mesh.visible = false;
        continue;
      }
      const d = dist2(n.x, n.z, px, pz);
      const far = d > 95 && !n.named && !n.escort;
      n.mesh.visible = d < 140 || n.named;
      if (far) continue;

      n.talkCd = Math.max(0, n.talkCd - dt);
      n.timer -= dt;
      n.aggro = Math.max(0, n.aggro - dt * 0.25);

      if (player.roaring && d < 28) {
        n.state = n.disposition === "hostile" || n.disposition === "guard" ? "flee" : "flee";
        n.timer = 2 + Math.random();
        const ang = Math.atan2(n.x - px, n.z - pz);
        n.vx += Math.sin(ang) * 18;
        n.vz += Math.cos(ang) * 18;
        if (n.disposition === "hostile" && d < 16) {
          n.hp -= 35;
        }
      }

      if (player.attacking && d < 3.2) {
        /* combat handled outside */
      }

      if (n.disposition === "hostile" && d < 22 && n.state !== "flee") {
        n.state = d < 4.2 ? "attack" : "chase";
      }
      if (n.disposition === "guard" && wanted >= 2 && d < 30) {
        n.state = d < 4 ? "attack" : "chase";
      }
      if (n.disposition === "skittish" && d < 10 && player.attacking) n.state = "flee";
      if (n.escort) n.state = "follow";

      if (n.timer <= 0 && n.state !== "chase" && n.state !== "attack" && n.state !== "follow") {
        const roll = Math.random();
        if (night && roll < 0.25 && n.kind !== "nightpride" && n.kind !== "hyena" && n.kind !== "croc") n.state = "sleep";
        else if (roll < 0.2) n.state = "idle";
        else if (roll < 0.35) n.state = "eat";
        else if (roll < 0.45) n.state = "drink";
        else if (roll < 0.55 && d < 12 && n.disposition === "friendly") n.state = "talk";
        else n.state = "wander";
        n.timer = 2 + Math.random() * 5;
      }

      let tx = 0;
      let tz = 0;
      let spd = 0;
      if (n.state === "wander") {
        if (n.timer < 0.05 || Math.random() < 0.01) {
          const a = Math.random() * Math.PI * 2;
          const r = Math.random() * n.wander;
          n.homeX = n.named ? n.homeX : n.homeX;
          tx = n.homeX + Math.cos(a) * r - n.x;
          tz = n.homeZ + Math.sin(a) * r - n.z;
          n.yaw = Math.atan2(-tx, -tz);
        }
        spd = n.speed * 0.45;
        tx = -Math.sin(n.yaw);
        tz = -Math.cos(n.yaw);
        if (dist2(n.x, n.z, n.homeX, n.homeZ) > n.wander + 8) n.state = "return_home";
      } else if (n.state === "return_home") {
        tx = n.homeX - n.x;
        tz = n.homeZ - n.z;
        spd = n.speed * 0.7;
        if (Math.hypot(tx, tz) < 3) n.state = "idle";
      } else if (n.state === "follow") {
        tx = px - n.x;
        tz = pz - n.z;
        const dd = Math.hypot(tx, tz);
        spd = dd > 4 ? n.speed * 1.1 : 0;
      } else if (n.state === "flee") {
        tx = n.x - px;
        tz = n.z - pz;
        spd = n.speed * 1.35;
      } else if (n.state === "chase") {
        tx = px - n.x;
        tz = pz - n.z;
        spd = n.speed * 1.2;
        if (d < 3.4) n.state = "attack";
        if (d > 38) n.state = "wander";
      } else if (n.state === "attack") {
        tx = px - n.x;
        tz = pz - n.z;
        spd = n.speed * 0.6;
        if (d > 5) n.state = "chase";
      } else if (n.state === "investigate") {
        tx = px - n.x;
        tz = pz - n.z;
        spd = n.speed * 0.5;
      }

      const len = Math.hypot(tx, tz) || 1;
      n.vx += (tx / len) * spd * dt * 4;
      n.vz += (tz / len) * spd * dt * 4;
      n.vx *= 1 - Math.min(0.92, 6 * dt);
      n.vz *= 1 - Math.min(0.92, 6 * dt);
      n.x += n.vx * dt;
      n.z += n.vz * dt;
      const sp = Math.hypot(n.vx, n.vz);
      if (sp > 0.4) n.yaw = Math.atan2(-n.vx, -n.vz);
      const h = heightAt(n.x, n.z);
      const water = h < WATER_Y && (n.kind === "hippo" || n.kind === "croc" || n.kind === "hippoGuard");
      n.y = water ? WATER_Y - 0.15 : h;
      if (n.kind === "bird") n.y = h + 4 + Math.sin(t * 0.7 + n.seed) * 1.4;

      n.mesh.position.set(n.x, n.y, n.z);
      n.mesh.rotation.y = n.yaw + Math.PI;
      animateAnimal(n.mesh, t + n.seed, sp, n.kind === "bird");

      if (n.hp <= 0) {
        n.alive = false;
        n.mesh.visible = false;
      }
    }
  }

  damage(n: Npc, dmg: number, fromX: number, fromZ: number) {
    n.hp -= dmg;
    n.aggro = 6;
    if (n.disposition === "skittish" || n.disposition === "neutral") n.state = "flee";
    if (n.disposition === "hostile" || n.disposition === "guard") n.state = "chase";
    const a = Math.atan2(n.x - fromX, n.z - fromZ);
    n.vx += Math.sin(a) * 10;
    n.vz += Math.cos(a) * 10;
    if (n.hp <= 0) {
      n.alive = false;
      n.mesh.visible = false;
    }
  }

  hitPlayerDamage(px: number, pz: number, dt: number): number {
    let dmg = 0;
    for (const n of this.list) {
      if (!n.alive || n.state !== "attack") continue;
      if (dist2(n.x, n.z, px, pz) < 3.1) {
        dmg += (n.kind === "lion" || n.kind === "hippoGuard" ? 18 : 11) * dt;
      }
    }
    return dmg;
  }

  reactToCrime(px: number, pz: number, radius: number) {
    for (const n of this.list) {
      if (!n.alive) continue;
      const d = dist2(n.x, n.z, px, pz);
      if (d > radius) continue;
      if (n.disposition === "skittish" || n.disposition === "friendly") n.state = "flee";
      if (n.disposition === "guard") {
        n.state = "chase";
        n.timer = 8;
      }
      if (n.disposition === "neutral" && d < 10) n.state = "investigate";
    }
  }

  clearHostilesNear(x: number, z: number, r: number) {
    for (const n of this.list) {
      if (!n.named && n.disposition === "hostile" && dist2(n.x, n.z, x, z) < r) {
        n.alive = false;
        n.mesh.visible = false;
      }
    }
  }

  dispose() {
    for (const n of this.list) this.scene.remove(n.mesh);
    this.list = [];
    this.byId.clear();
  }
}

export function factionOfKind(k: NpcKind): FactionId {
  if (k === "hyena") return "hyena";
  if (k === "nightpride") return "night";
  if (k === "croc" || k === "hippo" || k === "hippoGuard") return "river";
  if (k === "lion" || k === "lioness") return "pride";
  return "wild";
}

void clamp;
