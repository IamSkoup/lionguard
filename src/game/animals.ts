import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import type { CharacterId, NpcKind } from "./types";

const mats = new Map<string, THREE.MeshStandardMaterial>();

export function mat(color: number, extra?: { rough?: number; metal?: number; emissive?: number }): THREE.MeshStandardMaterial {
  const key = `${color}|${extra?.rough ?? 0.86}|${extra?.emissive ?? 0}`;
  let m = mats.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({
      color,
      roughness: extra?.rough ?? 0.86,
      metalness: extra?.metal ?? 0.02,
      emissive: extra?.emissive ?? 0,
      flatShading: true,
    });
    mats.set(key, m);
  }
  return m;
}

function box(w: number, h: number, d: number, x: number, y: number, z: number, rx = 0, ry = 0, rz = 0) {
  const g = new THREE.BoxGeometry(w, h, d);
  g.rotateX(rx);
  g.rotateY(ry);
  g.rotateZ(rz);
  g.translate(x, y, z);
  return g;
}
function sph(r: number, x: number, y: number, z: number, sx = 1, sy = 1, sz = 1) {
  const g = new THREE.SphereGeometry(r, 6, 5);
  g.scale(sx, sy, sz);
  g.translate(x, y, z);
  return g;
}
function cyl(rt: number, rb: number, h: number, x: number, y: number, z: number, rx = 0, ry = 0, rz = 0) {
  const g = new THREE.CylinderGeometry(rt, rb, h, 6);
  g.rotateX(rx);
  g.rotateY(ry);
  g.rotateZ(rz);
  g.translate(x, y, z);
  return g;
}

function mergeColor(parts: THREE.BufferGeometry[], color: number, shadow = true): THREE.Mesh {
  const g = mergeGeometries(parts, false);
  parts.forEach((p) => p.dispose());
  if (!g) return new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.2), mat(color));
  const mesh = new THREE.Mesh(g, mat(color));
  mesh.castShadow = shadow;
  mesh.receiveShadow = true;
  return mesh;
}

export type AnimalRig = {
  group: THREE.Group;
  legs: THREE.Object3D[];
  body: THREE.Object3D;
  head: THREE.Object3D;
  tail?: THREE.Object3D;
};

function feline(opts: {
  body: number;
  belly: number;
  mane?: number;
  tuft?: number;
  scar?: boolean;
  mark?: boolean;
  slim?: boolean;
  scale?: number;
}): THREE.Group {
  const s = opts.scale ?? 1;
  const g = new THREE.Group();
  const body = mergeColor(
    [
      sph(0.42, 0, 0.62, 0.05, 1.15, 0.72, 1.35),
      sph(0.28, 0, 0.7, 0.55, 1.05, 0.9, 0.9),
      sph(0.22, 0, 0.52, -0.5, 0.9, 0.7, 1.1),
    ],
    opts.body,
  );
  const belly = mergeColor([sph(0.3, 0, 0.48, 0.05, 1.05, 0.5, 1.2)], opts.belly);
  const headParts = [
    sph(0.28, 0, 0.92, 0.78, 1.05, 0.9, 1),
    sph(0.14, 0, 0.84, 1.02, 1.1, 0.7, 0.9),
    sph(0.07, 0.16, 1.12, 0.72),
    sph(0.07, -0.16, 1.12, 0.72),
  ];
  const head = mergeColor(headParts, opts.body);
  if (opts.mane) {
    const mane = mergeColor(
      [sph(0.34, 0, 0.95, 0.62, 1.25, 1.05, 1.15), sph(0.22, 0, 1.12, 0.55, 1.1, 0.7, 0.9)],
      opts.mane,
    );
    g.add(mane);
  }
  if (opts.tuft) {
    g.add(mergeColor([sph(0.1, 0, 1.22, 0.7, 0.7, 1.1, 0.7), sph(0.08, 0, 0.55, -0.72, 0.6, 0.6, 1.1)], opts.tuft));
  }
  const legs = mergeColor(
    [
      cyl(0.08, 0.1, 0.5, 0.22, 0.28, 0.32),
      cyl(0.08, 0.1, 0.5, -0.22, 0.28, 0.32),
      cyl(0.07, 0.09, 0.48, 0.2, 0.26, -0.32),
      cyl(0.07, 0.09, 0.48, -0.2, 0.26, -0.32),
    ],
    opts.body,
  );
  const tail = mergeColor([cyl(0.04, 0.05, 0.7, 0, 0.7, -0.85, 0.9, 0, 0)], opts.body);
  g.add(body, belly, head, legs, tail);
  if (opts.scar) {
    const scar = new THREE.Mesh(box(0.02, 0.16, 0.04, -0.12, 0.96, 0.95, 0, 0, 0.4), mat(0x3a2418));
    g.add(scar);
  }
  if (opts.mark) {
    const m = new THREE.Mesh(new THREE.CircleGeometry(0.11, 8), mat(0x1c140c, { emissive: 0x0a0804 }));
    m.position.set(0.32, 0.78, 0.15);
    m.rotation.y = Math.PI / 2;
    g.add(m);
  }
  g.scale.setScalar(s * (opts.slim ? 0.92 : 1));
  g.userData.legs = legs;
  g.userData.body = body;
  g.userData.head = head;
  return g;
}

function hyena(color: number, crest: number, scale = 1): THREE.Group {
  const g = new THREE.Group();
  const body = mergeColor(
    [
      sph(0.38, 0, 0.7, 0.18, 1.05, 0.7, 1.2),
      sph(0.3, 0, 0.55, -0.35, 0.95, 0.6, 1.1),
    ],
    color,
  );
  const head = mergeColor(
    [
      sph(0.24, 0, 0.88, 0.72, 0.95, 0.8, 1.1),
      sph(0.12, 0, 0.8, 0.98, 1.2, 0.55, 0.9),
      box(0.08, 0.22, 0.06, 0.16, 1.08, 0.7),
      box(0.08, 0.22, 0.06, -0.16, 1.08, 0.7),
    ],
    color,
  );
  const spots = mergeColor(
    [
      sph(0.08, 0.22, 0.72, 0.05),
      sph(0.07, -0.2, 0.64, -0.2),
      sph(0.06, 0.1, 0.8, -0.3),
      sph(0.07, -0.18, 0.78, 0.22),
    ],
    crest,
  );
  const mohawk = mergeColor([box(0.08, 0.16, 0.55, 0, 0.96, 0.1)], crest);
  const legs = mergeColor(
    [
      cyl(0.07, 0.09, 0.55, 0.18, 0.3, 0.32),
      cyl(0.07, 0.09, 0.55, -0.18, 0.3, 0.32),
      cyl(0.07, 0.08, 0.4, 0.16, 0.24, -0.32),
      cyl(0.07, 0.08, 0.4, -0.16, 0.24, -0.32),
    ],
    color,
  );
  g.add(body, head, spots, mohawk, legs);
  g.scale.setScalar(scale);
  g.userData.body = body;
  g.userData.head = head;
  g.userData.legs = legs;
  return g;
}

export function makePlayerMesh(id: CharacterId): THREE.Group {
  if (id === "kion") {
    return feline({
      body: 0xe0a84a,
      belly: 0xf0d7a8,
      tuft: 0xc24a24,
      scar: true,
      mark: true,
      scale: 1.08,
    });
  }
  if (id === "janja") return hyena(0x8a7358, 0x3a3028, 1.02);
  return feline({
    body: 0xecb85c,
    belly: 0xf6e2b8,
    slim: true,
    scale: 1.0,
  });
}

export function makeNpcMesh(kind: NpcKind, seed = 1): THREE.Group {
  const j = (seed % 7) * 0.012;
  switch (kind) {
    case "lion":
      return feline({ body: 0xd49a3c, belly: 0xead09a, mane: 0x6a3a18, scale: 1.12 + j });
    case "lioness":
      return feline({ body: 0xe0b25a, belly: 0xf2dcb0, slim: true, scale: 0.98 + j });
    case "nightpride":
      return feline({ body: 0xc9a056, belly: 0xead7b0, mark: true, scale: 1.02 });
    case "hyena":
      return hyena(0x7a6750 + ((seed * 13) % 20), 0x2e2822, 0.95 + j);
    case "cheetah":
      return feline({ body: 0xd2a24a, belly: 0xeee0c0, slim: true, scale: 0.9 });
    case "leopard":
      return feline({ body: 0xc48a3a, belly: 0xe6cfa0, scale: 1.0 });
    case "zebra": {
      const g = new THREE.Group();
      const body = mergeColor([sph(0.45, 0, 0.7, 0, 1.3, 0.8, 1.5)], 0xf2efe8);
      const stripes = mergeColor(
        [
          box(0.96, 0.12, 0.08, 0, 0.72, 0.1),
          box(0.96, 0.1, 0.08, 0, 0.72, -0.18),
          box(0.96, 0.1, 0.08, 0, 0.72, 0.34),
        ],
        0x1a1916,
      );
      const head = mergeColor([sph(0.2, 0, 0.95, 0.72, 0.8, 0.7, 1.2), cyl(0.04, 0.04, 0.18, 0.08, 1.16, 0.7)], 0xf2efe8);
      const legs = mergeColor(
        [
          cyl(0.06, 0.07, 0.62, 0.2, 0.32, 0.32),
          cyl(0.06, 0.07, 0.62, -0.2, 0.32, 0.32),
          cyl(0.06, 0.07, 0.62, 0.18, 0.32, -0.36),
          cyl(0.06, 0.07, 0.62, -0.18, 0.32, -0.36),
        ],
        0x1a1916,
      );
      g.add(body, stripes, head, legs);
      g.scale.setScalar(1.05);
      g.userData.body = body;
      g.userData.head = head;
      g.userData.legs = legs;
      return g;
    }
    case "gazelle": {
      const g = new THREE.Group();
      const body = mergeColor([sph(0.28, 0, 0.62, 0, 1.2, 0.7, 1.4)], 0xc49a5a);
      const head = mergeColor(
        [sph(0.14, 0, 0.95, 0.42), cyl(0.015, 0.02, 0.28, 0.05, 1.18, 0.4, 0, 0, 0.2), cyl(0.015, 0.02, 0.28, -0.05, 1.18, 0.4, 0, 0, -0.2)],
        0xc49a5a,
      );
      const legs = mergeColor(
        [
          cyl(0.035, 0.04, 0.58, 0.12, 0.3, 0.18),
          cyl(0.035, 0.04, 0.58, -0.12, 0.3, 0.18),
          cyl(0.035, 0.04, 0.58, 0.1, 0.3, -0.22),
          cyl(0.035, 0.04, 0.58, -0.1, 0.3, -0.22),
        ],
        0xc49a5a,
      );
      g.add(body, head, legs);
      g.userData.body = body;
      g.userData.head = head;
      g.userData.legs = legs;
      return g;
    }
    case "elephant": {
      const g = new THREE.Group();
      const body = mergeColor([sph(0.7, 0, 0.9, 0, 1.15, 0.9, 1.3), cyl(0.08, 0.12, 0.7, 0, 0.7, 0.95, 0.6)], 0x8a8680);
      const legs = mergeColor(
        [
          cyl(0.16, 0.18, 0.7, 0.32, 0.36, 0.32),
          cyl(0.16, 0.18, 0.7, -0.32, 0.36, 0.32),
          cyl(0.16, 0.18, 0.7, 0.28, 0.36, -0.36),
          cyl(0.16, 0.18, 0.7, -0.28, 0.36, -0.36),
        ],
        0x8a8680,
      );
      g.add(body, legs);
      g.scale.setScalar(1.6);
      g.userData.body = body;
      g.userData.head = body;
      g.userData.legs = legs;
      return g;
    }
    case "giraffe": {
      const g = new THREE.Group();
      const body = mergeColor([sph(0.4, 0, 1.1, 0, 1.1, 0.7, 1.4), cyl(0.1, 0.14, 1.3, 0, 1.85, 0.35)], 0xd2a054);
      const head = mergeColor([sph(0.16, 0, 2.55, 0.5, 0.8, 0.7, 1.2)], 0xd2a054);
      const legs = mergeColor(
        [
          cyl(0.06, 0.08, 1.05, 0.16, 0.52, 0.28),
          cyl(0.06, 0.08, 1.05, -0.16, 0.52, 0.28),
          cyl(0.06, 0.08, 1.05, 0.14, 0.52, -0.3),
          cyl(0.06, 0.08, 1.05, -0.14, 0.52, -0.3),
        ],
        0xd2a054,
      );
      g.add(body, head, legs);
      g.userData.body = body;
      g.userData.head = head;
      g.userData.legs = legs;
      return g;
    }
    case "hippo":
    case "hippoGuard": {
      const g = new THREE.Group();
      const body = mergeColor([sph(0.55, 0, 0.48, 0, 1.3, 0.85, 1.4), sph(0.32, 0, 0.52, 0.62, 1.1, 0.8, 1)], 0x6a6e6a);
      g.add(body);
      g.scale.setScalar(kind === "hippoGuard" ? 1.3 : 1.15);
      g.userData.body = body;
      g.userData.head = body;
      g.userData.legs = body;
      return g;
    }
    case "croc": {
      const g = new THREE.Group();
      const body = mergeColor(
        [sph(0.22, 0, 0.18, 0, 1.1, 0.5, 2.4), sph(0.12, 0, 0.16, 0.62, 0.9, 0.45, 1.6)],
        0x3d5a3a,
      );
      g.add(body);
      g.userData.body = body;
      g.userData.head = body;
      g.userData.legs = body;
      return g;
    }
    case "bird": {
      const g = new THREE.Group();
      const body = mergeColor([sph(0.12, 0, 0.2, 0, 1, 0.8, 1.4), box(0.5, 0.04, 0.16, 0, 0.22, 0)], 0x3a3a42);
      g.add(body);
      g.userData.body = body;
      g.userData.head = body;
      g.userData.legs = body;
      return g;
    }
    case "mandrill": {
      const g = new THREE.Group();
      const body = mergeColor([sph(0.22, 0, 0.55, 0), sph(0.16, 0, 0.82, 0.18)], 0x5a4638);
      const face = mergeColor([sph(0.08, 0, 0.82, 0.3)], 0x3a7a8a);
      g.add(body, face);
      g.userData.body = body;
      g.userData.head = face;
      g.userData.legs = body;
      return g;
    }
    case "meerkat": {
      const g = new THREE.Group();
      const body = mergeColor([cyl(0.08, 0.1, 0.45, 0, 0.4, 0), sph(0.12, 0, 0.68, 0.02)], 0xc4a06a);
      g.add(body);
      g.userData.body = body;
      g.userData.head = body;
      g.userData.legs = body;
      return g;
    }
    case "warthog": {
      const g = new THREE.Group();
      const body = mergeColor([sph(0.32, 0, 0.42, 0, 1.3, 0.8, 1.4), sph(0.16, 0, 0.46, 0.48)], 0x6a5040);
      g.add(body);
      g.userData.body = body;
      g.userData.head = body;
      g.userData.legs = body;
      return g;
    }
    default:
      return feline({ body: 0xc4a060, belly: 0xe8d0a0 });
  }
}

export function animateAnimal(mesh: THREE.Group, t: number, speed: number, airborne: boolean) {
  const body = mesh.userData.body as THREE.Object3D | undefined;
  const head = mesh.userData.head as THREE.Object3D | undefined;
  if (!body) return;
  const bob = airborne ? 0 : Math.sin(t * (6 + speed * 2)) * Math.min(0.08, 0.02 + speed * 0.01);
  body.position.y = bob;
  if (head) head.position.y = bob * 0.6;
  mesh.scale.y = airborne ? 1.06 : 1 + Math.sin(t * 8) * Math.min(0.03, speed * 0.004);
}

export function disposeMats() {
  for (const m of mats.values()) m.dispose();
  mats.clear();
}
