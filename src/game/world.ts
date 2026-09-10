import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { WORLD_HALF } from "./constants";
import { biomeColor, heightAt } from "./height";
import { hash2 } from "./rng";
import { mat } from "./animals";

export type WorldBuilt = {
  terrain: THREE.Mesh;
  colliders: { x: number; z: number; r: number }[];
  waters: THREE.Mesh[];
  sun: THREE.DirectionalLight;
  hemi: THREE.HemisphereLight;
  ambient: THREE.AmbientLight;
  sky: THREE.Mesh;
  fill: THREE.PointLight;
  trees: THREE.InstancedMesh;
  rocks: THREE.InstancedMesh;
  roarWave: THREE.Mesh;
  rain: THREE.Points;
  landmarks: THREE.Group;
};

function acaciaGeo(): THREE.BufferGeometry {
  const trunk = new THREE.CylinderGeometry(0.12, 0.2, 2.2, 5);
  trunk.translate(0, 1.1, 0);
  const canopy = new THREE.SphereGeometry(1.4, 6, 5);
  canopy.scale(1.6, 0.38, 1.6);
  canopy.translate(0, 2.35, 0);
  const g = mergeGeometries([trunk, canopy], false);
  trunk.dispose();
  canopy.dispose();
  return g ?? new THREE.BoxGeometry(1, 2, 1);
}

function rockGeo(): THREE.BufferGeometry {
  const g = new THREE.IcosahedronGeometry(1, 0);
  g.scale(1.1, 0.7, 0.9);
  return g;
}

export function buildWorld(scene: THREE.Scene): WorldBuilt {
  const segs = 128;
  const size = WORLD_HALF * 2;
  const geo = new THREE.PlaneGeometry(size, size, segs, segs);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const colors = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const h = heightAt(x, z);
    pos.setY(i, h);
    const c = biomeColor(x, z, h);
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  const terrain = new THREE.Mesh(
    geo,
    new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.95,
      metalness: 0,
      flatShading: true,
    }),
  );
  terrain.receiveShadow = true;
  scene.add(terrain);

  const skyGeo = new THREE.SphereGeometry(420, 16, 12);
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: {
      top: { value: new THREE.Color(0x8ec4e8) },
      bot: { value: new THREE.Color(0xe8d7a8) },
    },
    vertexShader: `varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `uniform vec3 top; uniform vec3 bot; varying vec3 vP; void main(){ float h = clamp(vP.y / 220.0 * 0.5 + 0.5, 0.0, 1.0); gl_FragColor = vec4(mix(bot, top, h), 1.0); }`,
    depthWrite: false,
  });
  const sky = new THREE.Mesh(skyGeo, skyMat);
  scene.add(sky);

  const hemi = new THREE.HemisphereLight(0xc8e4ff, 0x6a5a38, 0.55);
  scene.add(hemi);
  const ambient = new THREE.AmbientLight(0xfff2d8, 0.28);
  scene.add(ambient);
  const sun = new THREE.DirectionalLight(0xffe6b0, 1.35);
  sun.position.set(40, 70, 20);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.near = 2;
  sun.shadow.camera.far = 160;
  sun.shadow.camera.left = -50;
  sun.shadow.camera.right = 50;
  sun.shadow.camera.top = 50;
  sun.shadow.camera.bottom = -50;
  sun.shadow.bias = -0.0008;
  scene.add(sun);
  scene.add(sun.target);
  const fill = new THREE.PointLight(0xffc978, 0.0, 40, 1.4);
  scene.add(fill);

  const waters: THREE.Mesh[] = [];
  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x2a6a72,
    transparent: true,
    opacity: 0.62,
    roughness: 0.18,
    metalness: 0.12,
  });
  function water(x: number, z: number, r: number) {
    const m = new THREE.Mesh(new THREE.CircleGeometry(r, 24), waterMat);
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, 0.2, z);
    scene.add(m);
    waters.push(m);
  }
  water(18, -70, 26);
  water(-10, -90, 12);
  water(190, 118, 8);
  water(232, 78, 10);
  water(40, 138, 7);

  const landmarks = new THREE.Group();
  landmarks.add(prideRock());
  landmarks.add(treeOfLife());
  landmarks.add(baobab(100, -20));
  landmarks.add(outlandsSpire(-200, -40));
  landmarks.add(hyenaDen(-160, 22));
  scene.add(landmarks);

  const colliders: { x: number; z: number; r: number }[] = [
    { x: 72, z: 48, r: 6 },
    { x: 220, z: 70, r: 5.5 },
    { x: 100, z: -20, r: 2.2 },
    { x: -160, z: 22, r: 3 },
  ];

  const treeMesh = new THREE.InstancedMesh(acaciaGeo(), mat(0x5a7a3a), 180);
  treeMesh.castShadow = true;
  treeMesh.receiveShadow = true;
  const dummy = new THREE.Object3D();
  let ti = 0;
  for (let i = 0; i < 400 && ti < 180; i++) {
    const x = (hash2(i, 3) - 0.5) * WORLD_HALF * 1.9;
    const z = (hash2(i, 9) - 0.5) * WORLD_HALF * 1.9;
    if (Math.hypot(x - 72, z - 48) < 18) continue;
    if (Math.hypot(x - 220, z - 70) < 22) continue;
    const h = heightAt(x, z);
    if (h < 1.2) continue;
    const b = Math.abs(x) > 160 && x > 0 ? 1 : hash2(i, 11);
    if (b < 0.45 && x < 160) continue;
    dummy.position.set(x, h, z);
    dummy.rotation.y = hash2(i, 4) * Math.PI * 2;
    const sc = 0.8 + hash2(i, 5) * 1.4;
    dummy.scale.setScalar(sc);
    dummy.updateMatrix();
    treeMesh.setMatrixAt(ti, dummy.matrix);
    colliders.push({ x, z, r: 0.7 * sc });
    ti++;
  }
  treeMesh.count = ti;
  scene.add(treeMesh);

  const rocks = new THREE.InstancedMesh(rockGeo(), mat(0x6a6258), 120);
  rocks.castShadow = true;
  rocks.receiveShadow = true;
  let ri = 0;
  for (let i = 0; i < 250 && ri < 120; i++) {
    const x = (hash2(i, 21) - 0.5) * WORLD_HALF * 1.9;
    const z = (hash2(i, 17) - 0.5) * WORLD_HALF * 1.9;
    const h = heightAt(x, z);
    if (h < 0.6) continue;
    dummy.position.set(x, h + 0.2, z);
    dummy.rotation.set(hash2(i, 1), hash2(i, 2) * 6, hash2(i, 3));
    const sc = 0.6 + hash2(i, 8) * 2.2;
    dummy.scale.set(sc, sc * (0.5 + hash2(i, 6)), sc);
    dummy.updateMatrix();
    rocks.setMatrixAt(ri, dummy.matrix);
    if (sc > 1.4) colliders.push({ x, z, r: 0.6 * sc });
    ri++;
  }
  rocks.count = ri;
  scene.add(rocks);

  const roarMat = new THREE.MeshBasicMaterial({
    color: 0xf2e29a,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const roarWave = new THREE.Mesh(new THREE.RingGeometry(0.6, 1.2, 32), roarMat);
  roarWave.rotation.x = -Math.PI / 2;
  roarWave.visible = false;
  scene.add(roarWave);

  const rainGeo = new THREE.BufferGeometry();
  const rainCount = 900;
  const rainPos = new Float32Array(rainCount * 3);
  for (let i = 0; i < rainCount; i++) {
    rainPos[i * 3] = (Math.random() - 0.5) * 70;
    rainPos[i * 3 + 1] = Math.random() * 28;
    rainPos[i * 3 + 2] = (Math.random() - 0.5) * 70;
  }
  rainGeo.setAttribute("position", new THREE.BufferAttribute(rainPos, 3));
  const rain = new THREE.Points(
    rainGeo,
    new THREE.PointsMaterial({ color: 0xb8c8d8, size: 0.12, transparent: true, opacity: 0 }),
  );
  rain.visible = false;
  scene.add(rain);

  scene.fog = new THREE.FogExp2(0xc8d4b0, 0.011);

  return { terrain, colliders, waters, sun, hemi, ambient, sky, fill, trees: treeMesh, rocks, roarWave, rain, landmarks };
}

function prideRock(): THREE.Group {
  const g = new THREE.Group();
  const stone = mat(0x8a7a62);
  const a = new THREE.Mesh(new THREE.CylinderGeometry(7, 11, 16, 7), stone);
  a.position.set(72, heightAt(72, 48) + 4, 48);
  a.rotation.y = 0.4;
  a.castShadow = true;
  const b = new THREE.Mesh(new THREE.BoxGeometry(8, 10, 5), stone);
  b.position.set(74, heightAt(72, 48) + 12, 46);
  b.rotation.y = 0.35;
  b.castShadow = true;
  const lip = new THREE.Mesh(new THREE.BoxGeometry(6, 1.4, 4), stone);
  lip.position.set(76, heightAt(72, 48) + 17.2, 44);
  g.add(a, b, lip);
  return g;
}

function treeOfLife(): THREE.Group {
  const g = new THREE.Group();
  const h = heightAt(220, 70);
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 3.4, 22, 8), mat(0x6a4a30));
  trunk.position.set(220, h + 11, 70);
  trunk.castShadow = true;
  const leaves = mat(0x3a7a48);
  for (let i = 0; i < 6; i++) {
    const s = new THREE.Mesh(new THREE.SphereGeometry(5.5 - i * 0.3, 8, 6), leaves);
    const a = (i / 6) * Math.PI * 2;
    s.position.set(220 + Math.cos(a) * 3.2, h + 18 + (i % 3) * 2.4, 70 + Math.sin(a) * 3.2);
    s.castShadow = true;
    g.add(s);
  }
  const crown = new THREE.Mesh(new THREE.SphereGeometry(6.5, 8, 6), leaves);
  crown.position.set(220, h + 24, 70);
  g.add(trunk, crown);
  return g;
}

function baobab(x: number, z: number): THREE.Group {
  const g = new THREE.Group();
  const h = heightAt(x, z);
  const t = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 2.2, 8, 7), mat(0x6e5a40));
  t.position.set(x, h + 4, z);
  t.castShadow = true;
  const c = new THREE.Mesh(new THREE.SphereGeometry(3.2, 7, 5), mat(0x4a6a32));
  c.position.set(x, h + 9.2, z);
  c.scale.set(1.3, 0.55, 1.3);
  g.add(t, c);
  return g;
}

function outlandsSpire(x: number, z: number): THREE.Group {
  const g = new THREE.Group();
  const h = heightAt(x, z);
  const m = new THREE.Mesh(new THREE.ConeGeometry(4.5, 16, 5), mat(0x7a4a32));
  m.position.set(x, h + 8, z);
  m.castShadow = true;
  g.add(m);
  return g;
}

function hyenaDen(x: number, z: number): THREE.Group {
  const g = new THREE.Group();
  const h = heightAt(x, z);
  const a = new THREE.Mesh(new THREE.IcosahedronGeometry(3.2, 0), mat(0x5a4030));
  a.position.set(x, h + 1.4, z);
  a.scale.set(1.6, 0.7, 1.2);
  g.add(a);
  return g;
}

export function updateSky(
  built: WorldBuilt,
  time: number,
  weather: string,
  player: THREE.Vector3,
) {
  const hour = time;
  const day = 1 - Math.max(0, Math.cos(((hour - 12) / 12) * Math.PI)) * 0.15;
  const night = hour < 5.5 || hour > 20.2 ? 1 : hour < 7 ? 1 - (hour - 5.5) / 1.5 : hour > 18.5 ? (hour - 18.5) / 1.7 : 0;
  const sunA = ((hour - 6) / 24) * Math.PI * 2;
  built.sun.position.set(player.x + Math.cos(sunA) * 70, 18 + Math.sin(sunA) * 80, player.z + 20);
  built.sun.target.position.copy(player);
  built.sun.intensity = THREE.MathUtils.lerp(0.12, 1.4, 1 - night) * (weather === "storm" ? 0.45 : weather === "clouds" ? 0.7 : 1);
  built.hemi.intensity = THREE.MathUtils.lerp(0.12, 0.6, 1 - night);
  built.ambient.intensity = THREE.MathUtils.lerp(0.06, 0.3, 1 - night);
  const skyMat = built.sky.material as THREE.ShaderMaterial;
  const top = skyMat.uniforms.top.value as THREE.Color;
  const bot = skyMat.uniforms.bot.value as THREE.Color;
  if (night > 0.6) {
    top.set(0x0b1220);
    bot.set(0x1a2230);
  } else if (hour < 8 || hour > 17.5) {
    top.set(0xc07048);
    bot.set(0xe8b070);
  } else if (weather === "storm") {
    top.set(0x4a5560);
    bot.set(0x6a7068);
  } else if (weather === "fog") {
    top.set(0xb8c0c4);
    bot.set(0xd0d4c8);
  } else {
    top.set(0x7eb7e0);
    bot.set(0xe8d7a8);
  }
  const fog = built.terrain.parent instanceof THREE.Scene ? (built.terrain.parent.fog as THREE.FogExp2 | null) : null;
  if (fog) {
    fog.color.copy(bot);
    fog.density = weather === "fog" ? 0.028 : weather === "rain" || weather === "storm" ? 0.016 : night > 0.5 ? 0.014 : 0.01;
  }
  built.fill.position.set(player.x, player.y + 2, player.z);
  built.fill.intensity = night * 0.55;
  built.sun.shadow.camera.updateProjectionMatrix();

  const raining = weather === "rain" || weather === "storm";
  built.rain.visible = raining;
  const pm = built.rain.material as THREE.PointsMaterial;
  pm.opacity = raining ? (weather === "storm" ? 0.85 : 0.55) : 0;
  if (raining) {
    built.rain.position.copy(player);
    const arr = built.rain.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < arr.count; i++) {
      let y = arr.getY(i) - (weather === "storm" ? 1.4 : 0.8);
      if (y < 0) y = 26;
      arr.setY(i, y);
    }
    arr.needsUpdate = true;
  }
  void day;
}
