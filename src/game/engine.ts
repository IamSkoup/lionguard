import * as THREE from "three";
import { animateAnimal, makePlayerMesh } from "./animals";
import { GameAudio } from "./audio";
import { ACHIEVEMENTS, CHAR_META, COLLECT_TYPES, FIXED_DT, GRAVITY, POI, WATER_Y, WORLD_HALF } from "./constants";
import { MISSIONS, missionAvailable, NAMED, VIGNETTES, WORLD_LINES } from "./content";
import { biomeAt, heightAt, regionName } from "./height";
import { Input } from "./input";
import { NpcWorld, type Npc } from "./npc";
import { defaultSave, hasSave, loadSave, writeSave } from "./save";
import { engineRef, useGameUI, type EngineHandle } from "./store";
import type { CharacterId, FactionId, Item, SaveData, WeatherId } from "./types";
import { buildWorld, updateSky, type WorldBuilt } from "./world";
import { clamp, dist2, expLerp, hash2, lerpAngle, pick, Rng } from "./rng";

type Body = {
  id: CharacterId;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  yaw: number;
  hp: number;
  stamina: number;
  mesh: THREE.Group;
  grounded: boolean;
  abilityCd: number;
  atkCd: number;
  iFrames: number;
  mounted: boolean;
};

const TMP = new THREE.Vector3();
const TMP2 = new THREE.Vector3();

export class GameEngine implements EngineHandle {
  canvas: HTMLCanvasElement;
  renderer: THREE.WebGLRenderer;
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(60, 1, 0.2, 520);
  input: Input;
  audio = new GameAudio();
  world!: WorldBuilt;
  npcs!: NpcWorld;
  bodies: Record<CharacterId, Body>;
  active: CharacterId = "kion";
  save: SaveData = defaultSave();
  acc = 0;
  last = 0;
  running = false;
  mode: "menu" | "play" | "dead" = "menu";
  camX = 0;
  camY = 12;
  camZ = 20;
  trauma = 0;
  roarT = 0;
  roarLevel = 1;
  wanted = 0;
  hideT = 0;
  interact: { label: string; fn: () => void } | null = null;
  hudT = 0;
  saveT = 0;
  eventT = 18;
  weatherT = 40;
  flash = 0;
  hitstop = 0;
  timeScale = 1;
  fps = 60;
  frames = 0;
  fpsT = 0;
  particles: { m: THREE.Mesh; life: number; vx: number; vy: number; vz: number }[] = [];
  collect: { id: string; item: string; x: number; z: number; mesh: THREE.Mesh }[] = [];
  secretsFound = new Set<string>();
  switched = new Set<CharacterId>();
  rng = new Rng(7);
  lastAtk = 0;
  deathTimer = 0;
  switchHold = 0;
  disposed = false;
  loop = (t: number) => this.frame(t);

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.input = new Input(canvas);
    this.scene.background = new THREE.Color(0x8eb7d8);
    this.world = buildWorld(this.scene);
    this.npcs = new NpcWorld(this.scene);
    this.npcs.spawnAll();
    this.bodies = {
      kion: this.makeBody("kion"),
      janja: this.makeBody("janja"),
      kiara: this.makeBody("kiara"),
    };
    this.spawnCollectibles();
    this.resize();
    window.addEventListener("resize", this.onResize);
    document.addEventListener("visibilitychange", this.onVis);
    engineRef.current = this;
    useGameUI.getState().setHasSave(hasSave());
    useGameUI.getState().setEngineReady(true);
    this.camera.position.set(220, 28, 92);
    this.last = performance.now();
    this.running = true;
    this.renderer.setAnimationLoop(this.loop);
    this.placeBodiesFromSave(this.save);
    this.wireQa();
  }

  private makeBody(id: CharacterId): Body {
    const mesh = makePlayerMesh(id);
    mesh.castShadow = true;
    this.scene.add(mesh);
    const m = CHAR_META[id];
    return {
      id,
      x: m.spawn.x,
      y: heightAt(m.spawn.x, m.spawn.z) + 1,
      z: m.spawn.z,
      vx: 0,
      vy: 0,
      vz: 0,
      yaw: 0,
      hp: m.hp,
      stamina: m.stamina,
      mesh,
      grounded: true,
      abilityCd: 0,
      atkCd: 0,
      iFrames: 0,
      mounted: false,
    };
  }

  private spawnCollectibles() {
    const spots: { x: number; z: number; item: string }[] = [
      { x: 190, z: 120, item: "mark" },
      { x: 248, z: 42, item: "mark" },
      { x: 56, z: 64, item: "carving" },
      { x: -220, z: 80, item: "relic" },
      { x: 74, z: 50, item: "scar" },
      { x: 16, z: -205, item: "stone" },
      { x: 36, z: 208, item: "feather" },
      { x: 132, z: 8, item: "mark" },
      { x: -188, z: 8, item: "relic" },
      { x: 80, z: 56, item: "scar" },
      { x: 100, z: -18, item: "herb" },
      { x: 208, z: 90, item: "herb" },
      { x: 40, z: 138, item: "fruit" },
      { x: -10, z: -88, item: "stone" },
      { x: 4, z: 22, item: "feather" },
    ];
    const geo = new THREE.OctahedronGeometry(0.35, 0);
    for (const s of spots) {
      const mesh = new THREE.Mesh(
        geo,
        new THREE.MeshStandardMaterial({ color: 0xe8d48a, emissive: 0x6a5018, roughness: 0.4 }),
      );
      mesh.position.set(s.x, heightAt(s.x, s.z) + 1.1, s.z);
      this.scene.add(mesh);
      this.collect.push({ id: `${s.item}:${s.x}:${s.z}`, item: s.item, x: s.x, z: s.z, mesh });
    }
  }

  private placeBodiesFromSave(s: SaveData) {
    (Object.keys(s.characters) as CharacterId[]).forEach((id) => {
      const c = s.characters[id];
      const b = this.bodies[id];
      b.x = c.x;
      b.z = c.z;
      b.y = Math.max(c.y, heightAt(c.x, c.z) + 0.9);
      b.yaw = c.yaw;
      b.hp = c.hp;
      b.stamina = c.stamina;
      b.mesh.position.set(b.x, b.y, b.z);
    });
    this.active = s.active;
    this.save = s;
    this.wanted = 0;
  }

  newGame() {
    this.save = defaultSave();
    this.placeBodiesFromSave(this.save);
    this.mode = "play";
    this.switched = new Set(["kion"]);
    useGameUI.getState().markChar("kion");
    useGameUI.getState().setScreen("playing");
    this.audio.unlock();
    this.audio.setMood("explore");
    this.input.requestLock();
    this.toast("Кайон просыпается у Древа жизни.");
    this.syncHud();
    this.saveNow();
  }

  continueGame() {
    const s = loadSave();
    if (!s) {
      this.newGame();
      return;
    }
    this.placeBodiesFromSave(s);
    this.mode = "play";
    useGameUI.getState().markChar(s.active);
    useGameUI.getState().setScreen("playing");
    this.audio.unlock();
    this.input.requestLock();
    this.toast("Возвращение в саванну.");
    this.syncHud();
  }

  pause() {
    if (this.mode !== "play") return;
    useGameUI.getState().setScreen("paused");
    this.input.exitLock();
  }

  resume() {
    if (useGameUI.getState().screen === "dead") return;
    useGameUI.getState().setScreen("playing");
    this.input.requestLock();
  }

  requestPointer() {
    this.audio.unlock();
    this.input.requestLock();
  }

  isPlaying() {
    return this.mode === "play";
  }

  setJoy(x: number, y: number) {
    this.input.setJoy(x, y);
  }

  addLook(dx: number, dy: number) {
    this.input.addLook(dx, dy);
  }

  tapKey(code: string) {
    this.input.keys.add(code);
    window.setTimeout(() => this.input.keys.delete(code), 90);
  }

  private p(): Body {
    return this.bodies[this.active];
  }

  switchTo(id: CharacterId) {
    if (id === this.active || this.mode !== "play") return;
    const ui = useGameUI.getState();
    ui.setVignette(pick(VIGNETTES[id], Math.random()));
    ui.setScreen("switching");
    this.audio.ui();
    window.setTimeout(() => {
      this.active = id;
      this.save.active = id;
      this.switched.add(id);
      ui.markChar(id);
      this.camX = this.p().x;
      this.camY = this.p().y + 8;
      this.camZ = this.p().z + 10;
      this.input.camYaw = this.p().yaw;
      ui.setVignette(null);
      ui.setScreen("playing");
      this.input.requestLock();
      this.toast(CHAR_META[id].name);
      this.advanceSwitchMission(id);
      if (this.switched.size === 3) this.grant("switch3");
      if (id === "kion" && dist2(this.p().x, this.p().z, 220, 70) < 40) this.grant("king-tree");
    }, 700);
  }

  private advanceSwitchMission(id: CharacterId) {
    const m = this.activeMission();
    if (!m) return;
    const obj = m.objectives[this.save.missionObj];
    if (obj && obj.type === "switch" && obj.who === id) this.completeObjective();
  }

  fastTravel(x: number, z: number) {
    if (this.save.money < 40) {
      this.toast("Нужно 40 солнц для быстрого пути.");
      return;
    }
    this.save.money -= 40;
    const b = this.p();
    b.x = x;
    b.z = z;
    b.y = heightAt(x, z) + 1.2;
    b.vx = b.vz = 0;
    this.wanted = Math.max(0, this.wanted - 2);
    this.toast("Путь через саванну...");
    useGameUI.getState().setScreen("playing");
  }

  setWaypoint(x: number, z: number) {
    useGameUI.setState({ mapWaypoint: { x, z } });
  }

  advanceDialogue() {
    const ui = useGameUI.getState();
    if (!ui.dialogue) return;
    if (ui.dialogueI + 1 >= ui.dialogue.length) {
      ui.setDialogue(null);
      ui.setScreen("playing");
      this.input.requestLock();
    } else ui.setDialogueI(ui.dialogueI + 1);
  }

  applySettings(p: Partial<SaveData["settings"]>) {
    this.save.settings = { ...this.save.settings, ...p };
    this.input.sens = 0.0022 * this.save.settings.mouseSens;
    this.input.invertY = this.save.settings.invertY;
    this.audio.masterVol = this.save.settings.master;
    this.audio.musicVol = this.save.settings.music;
    this.audio.sfxVol = this.save.settings.sfx;
    this.audio.applyVolumes();
  }

  getSettings() {
    return this.save.settings;
  }

  getMap() {
    const b = this.p();
    return {
      player: { x: b.x, z: b.z, yaw: b.yaw },
      others: (["kion", "janja", "kiara"] as CharacterId[])
        .filter((id) => id !== this.active)
        .map((id) => ({ id, x: this.bodies[id].x, z: this.bodies[id].z })),
      pois: Object.entries(POI).map(([id, p]) => ({
        id,
        name: p.name,
        x: p.x,
        z: p.z,
        discovered: this.save.discovered.includes(id),
        ft: Boolean(p.ft),
      })),
      mission: this.missionPoint(),
      blips: this.npcs.list.filter((n) => n.alive && n.named).map((n) => ({ x: n.x, z: n.z, c: "#efe6d2" })),
      world: WORLD_HALF,
    };
  }

  getInventory() {
    return { money: this.save.money, items: this.save.inventory, rep: this.save.reputation };
  }

  getAchievements() {
    const got = new Set(this.save.achievements);
    return ACHIEVEMENTS.map((a) => ({ ...a, got: got.has(a.id) }));
  }

  getMinimap(out: Uint8ClampedArray, size: number) {
    const b = this.p();
    const r = 52;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const gx = b.x + ((x / size) * 2 - 1) * r;
        const gz = b.z + ((y / size) * 2 - 1) * r;
        const h = heightAt(gx, gz);
        const bio = biomeAt(gx, gz);
        let cr = 140, cg = 130, cb = 70;
        if (bio === "outlands") { cr = 150; cg = 90; cb = 55; }
        else if (bio === "tree") { cr = 70; cg = 120; cb = 80; }
        else if (bio === "water") { cr = 40; cg = 90; cb = 110; }
        else if (bio === "desert") { cr = 190; cg = 160; cb = 90; }
        else if (bio === "mountains") { cr = 120; cg = 120; cb = 125; }
        const shade = clamp(0.7 + h * 0.03, 0.45, 1.2);
        const i = (y * size + x) * 4;
        out[i] = cr * shade;
        out[i + 1] = cg * shade;
        out[i + 2] = cb * shade;
        out[i + 3] = 210;
      }
    }
    const blips: { x: number; z: number; c: string; k: string }[] = [];
    const mp = this.missionPoint();
    if (mp) blips.push({ x: mp.x, z: mp.z, c: "#efe6d2", k: "mission" });
    for (const n of this.npcs.list) {
      if (!n.alive || dist2(n.x, n.z, b.x, b.z) > r) continue;
      if (n.disposition === "hostile") blips.push({ x: n.x, z: n.z, c: "#b44a3c", k: "danger" });
      else if (n.named) blips.push({ x: n.x, z: n.z, c: "#c4b8a4", k: "npc" });
    }
    return { yaw: this.input.camYaw, blips };
  }

  saveNow() {
    (Object.keys(this.bodies) as CharacterId[]).forEach((id) => {
      const c = this.bodies[id];
      this.save.characters[id] = { x: c.x, y: c.y, z: c.z, yaw: c.yaw, hp: c.hp, stamina: c.stamina };
    });
    this.save.active = this.active;
    writeSave(this.save);
    useGameUI.getState().setHasSave(true);
  }

  resetSave() {
    this.save = defaultSave();
    writeSave(this.save);
  }

  private onResize = () => this.resize();
  private onVis = () => {
    if (document.hidden) {
      this.saveNow();
      void this.audio.ctx?.suspend();
    } else this.audio.resume();
  };

  resize() {
    const w = this.canvas.clientWidth || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / Math.max(1, h);
    this.camera.updateProjectionMatrix();
  }

  private frame(now: number) {
    if (this.disposed) return;
    let dt = (now - this.last) / 1000;
    this.last = now;
    dt = Math.min(dt, 0.1);
    this.frames++;
    this.fpsT += dt;
    if (this.fpsT >= 0.4) {
      this.fps = this.frames / this.fpsT;
      this.frames = 0;
      this.fpsT = 0;
    }
    const screen = useGameUI.getState().screen;
    if (this.hitstop > 0) {
      this.hitstop -= dt;
      this.renderer.render(this.scene, this.camera);
      return;
    }
    this.acc += dt;
    let steps = 0;
    while (this.acc >= FIXED_DT && steps < 5) {
      this.fixed(FIXED_DT * this.timeScale);
      this.acc -= FIXED_DT;
      steps++;
    }
    this.visual(dt);
    if (screen === "menu" || screen === "settings" || screen === "controls" || screen === "achievements") {
      this.cinematic(dt);
    }
    this.renderer.render(this.scene, this.camera);
  }

  private cinematic(dt: number) {
    const t = performance.now() * 0.00012;
    const cx = 72 + Math.cos(t) * 28;
    const cz = 48 + Math.sin(t) * 28;
    const cy = heightAt(72, 48) + 18;
    this.camera.position.set(cx, cy, cz);
    this.camera.lookAt(72, heightAt(72, 48) + 10, 48);
    this.save.timeOfDay = (this.save.timeOfDay + dt * 0.15) % 24;
    updateSky(this.world, this.save.timeOfDay, this.save.weather, TMP.set(72, 12, 48));
    this.npcs.update(dt, performance.now() / 1000, { x: 72, z: 48, yaw: 0, attacking: false, roaring: false, id: "kion" }, 0, false);
    this.audio.update(dt);
  }

  private fixed(dt: number) {
    const screen = useGameUI.getState().screen;
    this.save.playTime += dt;
    this.save.timeOfDay += dt * 0.035;
    if (this.save.timeOfDay >= 24) this.save.timeOfDay -= 24;
    if (this.save.timeOfDay > 20 && this.save.timeOfDay < 20.1) this.grant("night");
    this.weatherTick(dt);
    this.idleOthers(dt);
    if (screen !== "playing" && screen !== "dialogue" && screen !== "map") {
      this.npcs.update(dt, this.save.playTime, { x: this.p().x, z: this.p().z, yaw: this.p().yaw, attacking: false, roaring: this.roarT > 0, id: this.active }, this.wanted, this.isNight());
      return;
    }
    if (this.mode === "dead") {
      this.deathTimer += dt;
      return;
    }
    this.input.updateCamera(dt);
    this.movePlayer(dt);
    this.combat();
    this.wantedTick(dt);
    this.interactScan();
    this.missionsTick(dt);
    this.eventsTick(dt);
    this.collectTick();
    this.discoverTick();
    this.npcs.update(dt, this.save.playTime, {
      x: this.p().x,
      z: this.p().z,
      yaw: this.p().yaw,
      attacking: this.lastAtk > 0,
      roaring: this.roarT > 1.2,
      id: this.active,
    }, this.wanted, this.isNight());
    const dmg = this.npcs.hitPlayerDamage(this.p().x, this.p().z, dt);
    if (dmg > 0 && this.p().iFrames <= 0) this.hurt(dmg);
    this.saveT += dt;
    if (this.saveT > 24) {
      this.saveT = 0;
      this.saveNow();
    }
    this.hudT += dt;
    if (this.hudT > 0.12) {
      this.hudT = 0;
      this.syncHud();
    }
    this.audio.timeOfDay = this.save.timeOfDay;
    this.audio.wanted = this.wanted;
    this.audio.inCombat = this.lastAtk > 0 || this.wanted >= 2;
    this.audio.update(dt);
    if (this.input.consume("Escape")) this.pause();
    if (this.input.consume("Tab")) {
      useGameUI.getState().setScreen("map");
      this.input.exitLock();
    }
    if (this.input.down("KeyC")) this.switchHold += dt;
    else this.switchHold = 0;
    useGameUI.getState().setSwitchWheel(this.switchHold > 0.28);
    if (this.input.consume("Digit1")) this.switchTo("kion");
    if (this.input.consume("Digit2")) this.switchTo("janja");
    if (this.input.consume("Digit3")) this.switchTo("kiara");
    if (this.input.consume("KeyI") || this.input.consume("KeyB")) {
      useGameUI.getState().setScreen("inventory");
      this.input.exitLock();
    }
  }

  private isNight() {
    return this.save.timeOfDay < 5.8 || this.save.timeOfDay > 19.6;
  }

  private weatherTick(dt: number) {
    this.weatherT -= dt;
    if (this.weatherT <= 0) {
      this.weatherT = 35 + this.rng.next() * 50;
      const pool: WeatherId[] = ["clear", "clear", "clouds", "clouds", "wind", "rain", "fog", "storm"];
      this.save.weather = pick(pool, this.rng.next());
      if (this.save.weather === "storm") this.grant("storm");
    }
    if (this.save.weather === "storm" && Math.random() < 0.004) {
      this.flash = 0.35;
      this.audio.thunder();
      this.trauma = Math.max(this.trauma, 0.25);
    }
  }

  private idleOthers(dt: number) {
    for (const id of ["kion", "janja", "kiara"] as CharacterId[]) {
      if (id === this.active) continue;
      const b = this.bodies[id];
      const home = CHAR_META[id].spawn;
      const a = this.save.playTime * 0.15 + (id === "janja" ? 2 : 1);
      const tx = home.x + Math.cos(a) * 6;
      const tz = home.z + Math.sin(a) * 6;
      b.x = expLerp(b.x, tx, 0.4, dt);
      b.z = expLerp(b.z, tz, 0.4, dt);
      b.y = heightAt(b.x, b.z);
      const dx = tx - b.x;
      const dz = tz - b.z;
      if (Math.hypot(dx, dz) > 0.4) b.yaw = Math.atan2(-dx, -dz);
      b.mesh.position.set(b.x, b.y, b.z);
      b.mesh.rotation.y = b.yaw + Math.PI;
      animateAnimal(b.mesh, this.save.playTime, 1.2, false);
    }
  }

  private movePlayer(dt: number) {
    const b = this.p();
    const meta = CHAR_META[this.active];
    const axes = this.input.moveAxes();
    const sprintWant = this.input.down("ShiftLeft") || this.input.down("ShiftRight");
    const canSprint = sprintWant && b.stamina > 4 && (axes.y > 0.1 || Math.hypot(axes.x, axes.y) > 0.4);
    const speed = (canSprint ? meta.sprint : meta.walk) * (b.mounted ? 1.55 : 1) * (this.save.weather === "storm" ? 0.88 : 1);
    if (canSprint) b.stamina = Math.max(0, b.stamina - 18 * dt);
    else b.stamina = Math.min(meta.stamina, b.stamina + 12 * dt);

    const fy = -Math.sin(this.input.camYaw);
    const fz = -Math.cos(this.input.camYaw);
    const rx = Math.cos(this.input.camYaw);
    const rz = -Math.sin(this.input.camYaw);
    const mx = fy * axes.y + rx * axes.x;
    const mz = fz * axes.y + rz * axes.x;
    const moving = Math.hypot(mx, mz) > 0.12;
    const h = heightAt(b.x, b.z);
    const inWater = h < WATER_Y - 0.05;
    const ctrl = inWater ? 0.55 : 1;
    if (moving) {
      const len = Math.hypot(mx, mz) || 1;
      const ax = (mx / len) * speed * ctrl;
      const az = (mz / len) * speed * ctrl;
      b.vx = expLerp(b.vx, ax, 8, dt);
      b.vz = expLerp(b.vz, az, 8, dt);
      b.yaw = lerpAngle(b.yaw, Math.atan2(-mx, -mz), 1 - Math.exp(-10 * dt));
      this.audio.step(canSprint ? 2.2 : 1.2);
    } else {
      b.vx = expLerp(b.vx, 0, 8, dt);
      b.vz = expLerp(b.vz, 0, 8, dt);
    }

    if (this.input.consume("Space") && b.grounded && b.stamina > 8) {
      b.vy = meta.jump * (b.mounted ? 0.7 : 1);
      b.grounded = false;
      b.stamina -= 8;
      this.audio.jump();
    }

    b.vy -= GRAVITY * dt;
    b.x += b.vx * dt;
    b.z += b.vz * dt;
    b.y += b.vy * dt;
    b.x = clamp(b.x, -WORLD_HALF + 2, WORLD_HALF - 2);
    b.z = clamp(b.z, -WORLD_HALF + 2, WORLD_HALF - 2);

    for (const c of this.world.colliders) {
      const d = dist2(b.x, b.z, c.x, c.z);
      if (d < c.r + 0.7) {
        const push = (c.r + 0.7 - d) / Math.max(0.001, d);
        b.x += (b.x - c.x) * push;
        b.z += (b.z - c.z) * push;
      }
    }

    const ground = heightAt(b.x, b.z);
    const stand = ground + (inWater ? 0.35 : 0);
    if (b.y <= stand + 0.05) {
      if (!b.grounded && b.vy < -6) {
        this.audio.land();
        this.trauma = Math.min(1, this.trauma + 0.12);
      }
      b.y = stand;
      b.vy = 0;
      b.grounded = true;
    } else b.grounded = false;

    if (b.y < -8) this.hurt(200);

    b.abilityCd = Math.max(0, b.abilityCd - dt);
    b.atkCd = Math.max(0, b.atkCd - dt);
    b.iFrames = Math.max(0, b.iFrames - dt);
    this.lastAtk = Math.max(0, this.lastAtk - dt);
    this.roarT = Math.max(0, this.roarT - dt);

    b.mesh.position.set(b.x, b.y, b.z);
    b.mesh.rotation.y = b.yaw + Math.PI;
    animateAnimal(b.mesh, this.save.playTime, Math.hypot(b.vx, b.vz), !b.grounded);
  }

  private combat() {
    const b = this.p();
    const meta = CHAR_META[this.active];
    if (this.input.consume("KeyF") && b.atkCd <= 0) {
      b.atkCd = this.active === "kiara" ? 0.32 : 0.42;
      this.lastAtk = 0.25;
      this.audio.attack();
      this.flash = 0.08;
      const fx = -Math.sin(b.yaw);
      const fz = -Math.cos(b.yaw);
      b.vx += fx * 4;
      b.vz += fz * 4;
      let hits = 0;
      for (const n of this.npcs.list) {
        if (!n.alive) continue;
        const d = dist2(b.x + fx * 1.4, b.z + fz * 1.4, n.x, n.z);
        if (d < 2.6) {
          this.npcs.damage(n, meta.attack + (b.iFrames > 0 && this.active === "kiara" ? 10 : 0), b.x, b.z);
          hits++;
          this.burst(n.x, n.y + 0.8, n.z, 0xb44a3c);
          if (!n.alive) {
            this.save.kills++;
            this.save.money += 8;
            this.crime(n, true);
          } else this.crime(n, false);
        }
      }
      if (hits) {
        this.trauma = Math.min(1, this.trauma + 0.22);
        this.hitstop = 0.05;
        this.audio.hit();
      }
    }
    if (this.input.consume("KeyQ") && b.abilityCd <= 0) this.useAbility();
  }

  private useAbility() {
    const b = this.p();
    const meta = CHAR_META[this.active];
    b.abilityCd = meta.abilityCd;
    if (this.active === "kion") {
      this.roarT = 1.6;
      this.roarLevel = clamp(1 + Math.floor((130 - b.hp) / 50), 1, 3);
      this.world.roarWave.visible = true;
      this.world.roarWave.position.set(b.x, b.y + 0.4, b.z);
      (this.world.roarWave.material as THREE.MeshBasicMaterial).opacity = 0.85;
      this.world.roarWave.scale.setScalar(1);
      this.trauma = 0.85;
      this.audio.roar();
      this.audio.setMood("roar");
      this.input.zoom = 14;
      this.grant("hevi");
      this.npcs.reactToCrime(b.x, b.z, 30);
      const obj = this.activeMission()?.objectives[this.save.missionObj];
      if (obj?.type === "roar") this.save.missionProg += 1;
      this.toast("Хеви Кабиса!");
      for (const c of this.world.colliders) {
        if (c.r < 1.2 && dist2(b.x, b.z, c.x, c.z) < 12 * this.roarLevel) c.r *= 0.4;
      }
    } else if (this.active === "janja") {
      this.audio.laugh();
      this.toast("Джанджа сзывает стаю!");
      for (let i = 0; i < 2; i++) {
        const a = b.yaw + (i === 0 ? 0.8 : -0.8);
        const n = this.npcs.spawnHostile("hyena", b.x - Math.sin(a) * 4, b.z - Math.cos(a) * 4, `ally${Date.now()}${i}`);
        n.disposition = "friendly";
      }
    } else {
      b.iFrames = 0.45;
      const fx = -Math.sin(b.yaw);
      const fz = -Math.cos(b.yaw);
      b.vx += fx * 22;
      b.vz += fz * 22;
      this.audio.jump();
      this.toast("Рывок!");
    }
  }

  private crime(n: Npc, killed: boolean) {
    const friendly = n.disposition === "friendly" || n.disposition === "guard" || n.named;
    if (friendly) {
      this.wanted = Math.min(5, this.wanted + (killed ? 1.2 : 0.55));
      this.save.reputation[n.faction] = clamp(this.save.reputation[n.faction] - (killed ? 8 : 3), -100, 100);
      this.npcs.reactToCrime(this.p().x, this.p().z, 40);
      if (this.wanted >= 1) this.toast("Стражи территории замечают вас.");
      if (this.wanted >= 5) this.grant("wanted5");
    } else if (n.disposition === "hostile") {
      this.save.reputation[n.faction] = clamp(this.save.reputation[n.faction] + 1, -100, 100);
    }
    const obj = this.activeMission()?.objectives[this.save.missionObj];
    if (obj?.type === "hunt" && (!obj.kind || obj.kind === n.kind)) this.save.missionProg += 1;
  }

  private wantedTick(dt: number) {
    if (this.wanted <= 0) return;
    const b = this.p();
    const nearGuard = this.npcs.list.some((n) => n.alive && n.disposition === "guard" && dist2(n.x, n.z, b.x, b.z) < 28);
    if (!nearGuard && this.lastAtk <= 0) {
      this.hideT += dt;
      if (this.hideT > 5) {
        this.wanted = Math.max(0, this.wanted - dt * 0.18);
        if (this.wanted === 0) this.grant("chaos");
      }
    } else this.hideT = 0;
    if (this.wanted >= 3 && Math.random() < 0.01) {
      const a = Math.random() * Math.PI * 2;
      this.npcs.spawnHostile(this.regionGuard(), b.x + Math.cos(a) * 22, b.z + Math.sin(a) * 22);
    }
    this.audio.setMood(this.wanted >= 3 ? "chase" : this.wanted >= 1 ? "combat" : "explore");
  }

  private regionGuard(): Npc["kind"] {
    const bio = biomeAt(this.p().x, this.p().z);
    if (bio === "tree") return "nightpride";
    if (bio === "outlands") return "hyena";
    if (bio === "water") return "croc";
    return "lioness";
  }

  private hurt(amount: number) {
    const b = this.p();
    if (b.iFrames > 0) return;
    b.hp -= amount;
    b.iFrames = 0.35;
    this.trauma = Math.min(1, this.trauma + 0.35);
    this.audio.hit();
    if (b.hp <= 0) this.die();
  }

  private die() {
    const b = this.p();
    b.hp = 0;
    this.mode = "dead";
    this.deathTimer = 0;
    this.save.deaths++;
    this.grant("dead");
    this.audio.death();
    this.audio.setMood("dead");
    this.input.exitLock();
    const ui = useGameUI.getState();
    ui.setDeathPhase(0);
    ui.setScreen("dead");
    window.setTimeout(() => ui.setDeathPhase(1), 1600);
    window.setTimeout(() => ui.setDeathPhase(2), 3200);
    window.setTimeout(() => this.respawn(), 4600);
  }

  private respawn() {
    const b = this.p();
    const med = CHAR_META[this.active].med;
    b.x = med.x;
    b.z = med.z;
    b.y = heightAt(med.x, med.z) + 1;
    b.vx = b.vz = b.vy = 0;
    b.hp = CHAR_META[this.active].hp * 0.6;
    b.stamina = CHAR_META[this.active].stamina * 0.5;
    this.wanted = 0;
    this.save.money = Math.max(0, this.save.money - 40);
    this.npcs.clearHostilesNear(b.x, b.z, 40);
    this.save.timeOfDay = (this.save.timeOfDay + 3) % 24;
    this.mode = "play";
    useGameUI.getState().setScreen("playing");
    useGameUI.getState().setDeathPhase(0);
    this.audio.setMood("explore");
    this.toast("Вы приходите в себя.");
    this.saveNow();
  }

  private interactScan() {
    const b = this.p();
    this.interact = null;
    const npc = this.npcs.nearest(b.x, b.z, (n) => n.named && n.alive, 3.6);
    if (npc) this.interact = { label: `Говорить · ${npc.name}`, fn: () => this.talk(npc) };
    const col = this.collect.find((c) => c.mesh.visible && dist2(c.x, c.z, b.x, b.z) < 2.2);
    if (col) this.interact = { label: "Поднять", fn: () => this.pickCollect(col) };
    for (const [id, p] of Object.entries(POI)) {
      if (dist2(b.x, b.z, p.x, p.z) < 6 && !this.save.discovered.includes(id)) {
        this.save.discovered.push(id);
        this.toast(`Открыто: ${p.name}`);
      }
    }
    if (this.input.consume("KeyE") && this.interact) this.interact.fn();
    if (this.input.consume("KeyH")) this.useItem("herb");
    if (this.input.consume("KeyG")) this.useItem("fruit");
  }

  private talk(npc: Npc) {
    const named = NAMED.find((n) => n.id === npc.id);
    const lines = named?.lines[this.active] ?? [`${npc.name} молча смотрит на вас.`];
    const extra = this.worldComment();
    const dlg = lines.map((text) => ({ speaker: npc.name, text }));
    if (extra) dlg.push({ speaker: npc.name, text: extra });
    useGameUI.getState().setDialogue(dlg);
    useGameUI.getState().setScreen("dialogue");
    this.input.exitLock();
    const obj = this.activeMission()?.objectives[this.save.missionObj];
    if (obj?.type === "talk" && obj.npcId === npc.id) this.completeObjective();
    if (npc.id === "nirmala") this.addItem("herb", "Целебные травы", "heal", 1);
    if (npc.id === "rafiki") this.addItem("fruit", "Плоды баобаба", "food", 1);
  }

  private worldComment(): string | null {
    if (this.wanted >= 2) return "Тебя ищут стражи. Лучше скрыться.";
    if (this.save.reputation.pride < 20 && this.active === "kion") return "Говорят, король ведёт себя странно.";
    if (this.save.kills > 8 && Math.random() < 0.5) return pick(WORLD_LINES, Math.random());
    if (this.save.helped > 3 && Math.random() < 0.4) return "Король снова помог нам.";
    return null;
  }

  private pickCollect(c: { id: string; item: string; mesh: THREE.Mesh; x: number; z: number }) {
    c.mesh.visible = false;
    this.save.collectibles.push(c.id);
    const def = COLLECT_TYPES.find((t) => t.id === c.item);
    this.addItem(c.item, def?.name ?? c.item, c.item === "herb" ? "heal" : c.item === "fruit" ? "food" : "collect", 1);
    this.audio.pickup();
    this.toast(`Найдено: ${def?.name ?? c.item}`);
    this.save.money += 15;
    const obj = this.activeMission()?.objectives[this.save.missionObj];
    if (obj?.type === "collect" && obj.item === c.item) this.save.missionProg += 1;
    if (this.save.collectibles.length >= 10) this.grant("quiet");
  }

  private addItem(id: string, name: string, kind: Item["kind"], qty: number) {
    const it = this.save.inventory.find((i) => i.id === id);
    if (it) it.qty += qty;
    else this.save.inventory.push({ id, name, kind, qty, desc: name });
  }

  useItem(id: string) {
    const it = this.save.inventory.find((i) => i.id === id);
    if (!it || it.qty <= 0) return;
    it.qty--;
    const b = this.p();
    if (id === "herb") b.hp = Math.min(CHAR_META[this.active].hp, b.hp + 40);
    if (id === "fruit") b.stamina = CHAR_META[this.active].stamina;
    this.toast(id === "herb" ? "Травы восстанавливают силы." : "Плоды возвращают дыхание.");
  }

  private collectTick() {
    const t = this.save.playTime;
    for (const c of this.collect) {
      if (!c.mesh.visible) continue;
      c.mesh.position.y = heightAt(c.x, c.z) + 1.1 + Math.sin(t * 2 + c.x) * 0.15;
      c.mesh.rotation.y += 0.03;
    }
  }

  private discoverTick() {
    const b = this.p();
    if (dist2(b.x, b.z, 74, 50) < 4 && b.y > heightAt(74, 50) + 8) {
      this.secretsFound.add("peak");
      this.grant("climb");
    }
    if (dist2(b.x, b.z, 56, 64) < 6) this.secretsFound.add("cave");
    if (dist2(b.x, b.z, 190, 120) < 8) this.secretsFound.add("falls");
    if (this.secretsFound.size >= 10) this.grant("quiet");
    if (this.active === "janja" && dist2(b.x, b.z, POI.hyenaTunnel.x, POI.hyenaTunnel.z) < 4) {
      b.x = -160;
      b.z = 22;
      this.toast("Узкий лаз вывел к лагерю гиен.");
    }
    if (this.active === "kiara" && dist2(b.x, b.z, POI.royalPath.x, POI.royalPath.z) < 3.5) {
      b.x = 74;
      b.z = 50;
      b.y = heightAt(74, 50) + 4;
      this.toast("Королевская тропа.");
    }
  }

  private activeMission() {
    const id = Object.keys(this.save.missions).find((k) => this.save.missions[k] === "active");
    return MISSIONS.find((m) => m.id === id) ?? null;
  }

  private missionPoint(): { x: number; z: number } | null {
    const m = this.activeMission();
    if (!m) return null;
    const o = m.objectives[this.save.missionObj];
    if (!o) return null;
    if ("x" in o && "z" in o) return { x: o.x, z: o.z };
    if (o.type === "talk") {
      const n = this.npcs.byId.get(o.npcId);
      if (n) return { x: n.x, z: n.z };
    }
    if (o.type === "race") return o.checkpoints[Math.floor(this.save.missionProg)] ?? o.checkpoints[0]!;
    return null;
  }

  private missionsTick(dt: number) {
    for (const m of MISSIONS) {
      if (!this.save.missions[m.id] && missionAvailable(m.id, this.save.missions)) {
        this.save.missions[m.id] = "available";
        this.toast(`Новое дело: ${m.title}`);
      }
    }
    let m = this.activeMission();
    if (!m) {
      const next = MISSIONS.find((x) => this.save.missions[x.id] === "available" && (!x.who || x.who === this.active) && (!x.night || this.isNight()));
      if (next) {
        this.save.missions[next.id] = "active";
        this.save.missionObj = 0;
        this.save.missionProg = 0;
        m = next;
        this.toast(next.title);
        if (next.id === "heir-spar" || next.id === "gazelle" || next.id === "thieves" || next.id === "gorge" || next.id === "crocs") {
          this.seedHostiles(next.id);
        }
      }
    }
    if (!m) return;
    if (m.who && m.who !== this.active) return;
    if (m.night && !this.isNight()) return;
    const obj = m.objectives[this.save.missionObj];
    if (!obj) {
      this.finishMission(m.id);
      return;
    }
    const b = this.p();
    if (obj.type === "goto" && dist2(b.x, b.z, obj.x, obj.z) < obj.r) this.completeObjective();
    if (obj.type === "hunt" && this.save.missionProg >= obj.count) this.completeObjective();
    if (obj.type === "collect") {
      const qty = this.save.inventory.find((i) => i.id === obj.item)?.qty ?? 0;
      if (qty >= obj.count || this.save.missionProg >= obj.count) this.completeObjective();
    }
    if (obj.type === "roar" && this.save.missionProg >= obj.count) this.completeObjective();
    if (obj.type === "region" && biomeAt(b.x, b.z) === obj.biome) this.completeObjective();
    if (obj.type === "help" && this.save.helped >= obj.count) this.completeObjective();
    if (obj.type === "survive") {
      this.save.missionProg += dt;
      if (this.save.missionProg >= obj.seconds) this.completeObjective();
    }
    if (obj.type === "defend") {
      if (dist2(b.x, b.z, obj.x, obj.z) < obj.r) {
        this.save.missionProg += dt;
        if (Math.random() < 0.02) this.npcs.spawnHostile("hyena", obj.x + (Math.random() - 0.5) * 16, obj.z + (Math.random() - 0.5) * 16);
        if (this.save.missionProg >= obj.seconds) this.completeObjective();
      }
    }
    if (obj.type === "escort") {
      const n = this.npcs.byId.get(obj.npcId);
      if (n) {
        n.escort = true;
        n.disposition = "friendly";
        if (dist2(n.x, n.z, obj.x, obj.z) < obj.r) this.completeObjective();
      }
    }
    if (obj.type === "race") {
      const cp = obj.checkpoints[Math.floor(this.save.missionProg)];
      if (cp && dist2(b.x, b.z, cp.x, cp.z) < 8) {
        this.save.missionProg += 1;
        this.toast("Контрольная точка!");
        if (this.save.missionProg >= obj.checkpoints.length) this.completeObjective();
      }
    }
  }

  private seedHostiles(id: string) {
    const spots: Record<string, { x: number; z: number; k: Npc["kind"]; n: number }> = {
      "heir-spar": { x: 86, z: 28, k: "lioness", n: 4 },
      gazelle: { x: 18, z: -70, k: "hyena", n: 5 },
      thieves: { x: 100, z: -20, k: "hyena", n: 3 },
      gorge: { x: -200, z: -40, k: "leopard", n: 4 },
      crocs: { x: -10, z: -90, k: "croc", n: 6 },
    };
    const s = spots[id];
    if (!s) return;
    for (let i = 0; i < s.n; i++) {
      this.npcs.spawnHostile(s.k, s.x + (Math.random() - 0.5) * 12, s.z + (Math.random() - 0.5) * 12);
    }
  }

  private completeObjective() {
    this.save.missionObj += 1;
    this.save.missionProg = 0;
    this.audio.pickup();
    const m = this.activeMission();
    if (!m) return;
    if (this.save.missionObj >= m.objectives.length) this.finishMission(m.id);
  }

  private finishMission(id: string) {
    const m = MISSIONS.find((x) => x.id === id);
    if (!m) return;
    this.save.missions[id] = "done";
    this.save.missionObj = 0;
    this.save.missionProg = 0;
    this.save.money += m.reward.money;
    if (m.reward.rep) {
      for (const [k, v] of Object.entries(m.reward.rep)) {
        const f = k as FactionId;
        this.save.reputation[f] = clamp(this.save.reputation[f] + (v ?? 0), -100, 100);
      }
    }
    this.toast(`Дело закрыто: ${m.title}`);
    if (id === "hyena-home") this.grant("hyena-back");
    if (id === "heir-spar" || id === "sunset-rock") {
      const kiaraDone = ["heir-spar", "sunset-rock"].every((x) => this.save.missions[x] === "done");
      if (kiaraDone) this.grant("queen");
    }
    const done = MISSIONS.filter((x) => this.save.missions[x.id] === "done").length;
    if (done >= 10) this.grant("missions10");
    if (this.save.money >= 1500) this.grant("rich");
    this.saveNow();
  }

  private eventsTick(dt: number) {
    this.eventT -= dt;
    if (this.eventT > 0) return;
    this.eventT = 22 + this.rng.next() * 28;
    if (useGameUI.getState().screen !== "playing") return;
    const b = this.p();
    const roll = this.rng.next();
    if (roll < 0.18) {
      const a = this.rng.next() * Math.PI * 2;
      this.npcs.spawnHostile("hyena", b.x + Math.cos(a) * 18, b.z + Math.sin(a) * 18);
      this.toast("На стадо напали хищники.");
    } else if (roll < 0.32) {
      this.toast("Кто-то зовёт на помощь.");
      this.save.helped++;
    } else if (roll < 0.45) this.toast("Редкое животное мелькнуло в траве.");
    else if (roll < 0.58) this.toast("Стая гиен пытается украсть плоды.");
    else if (roll < 0.7) this.toast("Животное попало в ловушку. Подойдите ближе, чтобы помочь.");
    else if (roll < 0.82) {
      this.npcs.spawnHostile("leopard", b.x + 14, b.z + 8);
      this.toast("Чужак на территории.");
    } else this.toast(pick(WORLD_LINES, this.rng.next()));
  }

  private visual(dt: number) {
    const b = this.p();
    const screen = useGameUI.getState().screen;
    updateSky(this.world, this.save.timeOfDay, this.save.weather, TMP.set(b.x, b.y, b.z));
    for (const w of this.world.waters) w.position.y = 0.18 + Math.sin(this.save.playTime * 1.5) * 0.05;
    if (this.roarT > 0) {
      const k = 1.6 - this.roarT;
      this.world.roarWave.visible = true;
      this.world.roarWave.position.set(b.x, b.y + 0.3, b.z);
      this.world.roarWave.scale.setScalar(1 + k * 18);
      (this.world.roarWave.material as THREE.MeshBasicMaterial).opacity = Math.max(0, this.roarT * 0.5);
    } else this.world.roarWave.visible = false;

    this.trauma = Math.max(0, this.trauma - dt * 1.4);
    const shakeAmt = this.trauma * this.trauma * 0.55 * this.save.settings.shake;
    if (screen === "playing" || screen === "dialogue" || screen === "paused") this.followCam(dt, shakeAmt);

    this.renderer.toneMappingExposure = this.flash > 0 ? 1.4 : screen === "dead" ? 0.45 : 1.05;
    this.flash = Math.max(0, this.flash - dt);

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]!;
      p.life -= dt;
      p.m.position.x += p.vx * dt;
      p.m.position.y += p.vy * dt;
      p.m.position.z += p.vz * dt;
      p.vy -= 6 * dt;
      if (p.life <= 0) {
        this.scene.remove(p.m);
        this.particles.splice(i, 1);
      }
    }
    if (this.input.zoom > 9.6 && this.roarT <= 0) this.input.zoom = expLerp(this.input.zoom, 9.5, 1.5, dt);
  }

  private followCam(dt: number, shake: number) {
    const b = this.p();
    const dist = this.lastAtk > 0 ? this.input.zoom * 0.82 : this.roarT > 0 ? this.input.zoom * 1.25 : this.input.zoom;
    const yaw = this.input.camYaw;
    const pitch = this.input.camPitch;
    const fx = -Math.sin(yaw) * Math.cos(pitch - 0.2);
    const fy = Math.sin(pitch);
    const fz = -Math.cos(yaw) * Math.cos(pitch - 0.2);
    const desired = TMP2.set(b.x - fx * dist, b.y + 1.4 + fy * dist, b.z - fz * dist);
    const g = heightAt(desired.x, desired.z) + 1.2;
    if (desired.y < g) desired.y = g;
    this.camX = expLerp(this.camX, desired.x, 5.5, dt);
    this.camY = expLerp(this.camY, desired.y, 5.5, dt);
    this.camZ = expLerp(this.camZ, desired.z, 5.5, dt);
    this.camera.position.set(
      this.camX + (hash2(this.save.playTime, 1) - 0.5) * shake * 2,
      this.camY + (hash2(this.save.playTime, 2) - 0.5) * shake * 2,
      this.camZ + (hash2(this.save.playTime, 3) - 0.5) * shake * 2,
    );
    this.camera.lookAt(b.x, b.y + 1.15, b.z);
  }

  private burst(x: number, y: number, z: number, color: number) {
    for (let i = 0; i < 6; i++) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.08, 4, 3), new THREE.MeshBasicMaterial({ color }));
      m.position.set(x, y, z);
      this.scene.add(m);
      this.particles.push({
        m,
        life: 0.4 + Math.random() * 0.3,
        vx: (Math.random() - 0.5) * 8,
        vy: 2 + Math.random() * 4,
        vz: (Math.random() - 0.5) * 8,
      });
    }
  }

  private toast(text: string) {
    useGameUI.getState().pushToast(text);
  }

  private grant(id: string) {
    if (this.save.achievements.includes(id)) return;
    this.save.achievements.push(id);
    const a = ACHIEVEMENTS.find((x) => x.id === id);
    if (a) this.toast(`Достижение: ${a.title}`);
  }

  private hint(): string {
    const m = this.activeMission();
    if (!m) return "Свободный мир. Исследуйте саванну.";
    if (m.who && m.who !== this.active) return `Нужен ${CHAR_META[m.who].name}`;
    if (m.night && !this.isNight()) return "Дождитесь ночи.";
    const o = m.objectives[this.save.missionObj];
    return o?.label ?? m.briefing;
  }

  private syncHud() {
    const b = this.p();
    const meta = CHAR_META[this.active];
    const m = this.activeMission();
    useGameUI.getState().setHud({
      character: this.active,
      characterName: meta.name,
      hp: b.hp,
      maxHp: meta.hp,
      stamina: b.stamina,
      maxStamina: meta.stamina,
      ability: 1 - b.abilityCd / meta.abilityCd,
      abilityName: meta.ability,
      money: this.save.money,
      wanted: Math.round(this.wanted),
      missionTitle: m?.title ?? "Свободное странствие",
      missionHint: this.hint(),
      timeOfDay: this.save.timeOfDay,
      weather: this.save.weather,
      region: regionName(b.x, b.z),
      interactLabel: this.interact?.label ?? null,
      compass: this.input.camYaw,
      grounded: b.grounded,
      mounted: b.mounted,
      sprinting: Math.hypot(b.vx, b.vz) > meta.walk + 1,
      fps: this.fps,
    });
  }

  private wireQa() {
    window.__game = { engine: this };
    window.__controlsTest = {
      getYaw: () => this.p().yaw,
      getSpeed: () => Math.hypot(this.p().vx, this.p().vz),
      setKeys: (codes) => this.input.setInjected(codes),
      setSteer: (v) => {
        if (v > 0.2) this.input.setInjected(["KeyW", "KeyA"]);
        else if (v < -0.2) this.input.setInjected(["KeyW", "KeyD"]);
        else this.input.setInjected(["KeyW"]);
      },
    };
  }

  dispose() {
    this.disposed = true;
    this.running = false;
    this.renderer.setAnimationLoop(null);
    window.removeEventListener("resize", this.onResize);
    document.removeEventListener("visibilitychange", this.onVis);
    this.input.dispose();
    this.audio.dispose();
    this.npcs.dispose();
    this.renderer.dispose();
    engineRef.current = null;
  }
}
