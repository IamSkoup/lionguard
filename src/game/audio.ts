type Mood = "explore" | "combat" | "chase" | "night" | "roar" | "menu" | "dead";

export class GameAudio {
  ctx: AudioContext | null = null;
  master: GainNode | null = null;
  music: GainNode | null = null;
  sfx: GainNode | null = null;
  unlocked = false;
  mood: Mood = "menu";
  private musicTimer = 0;
  private stepTimer = 0;
  private oscs: OscillatorNode[] = [];
  private wind: AudioBufferSourceNode | null = null;
  masterVol = 0.8;
  musicVol = 0.55;
  sfxVol = 0.8;
  timeOfDay = 9;
  wanted = 0;
  inCombat = false;

  unlock() {
    if (this.unlocked && this.ctx) {
      if (this.ctx.state === "suspended") void this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC({ latencyHint: "interactive" });
    this.master = this.ctx.createGain();
    this.music = this.ctx.createGain();
    this.sfx = this.ctx.createGain();
    this.music.connect(this.master);
    this.sfx.connect(this.master);
    this.master.connect(this.ctx.destination);
    this.applyVolumes();
    this.unlocked = true;
    this.startWind();
    this.kickMusic();
  }

  applyVolumes() {
    if (!this.master || !this.music || !this.sfx || !this.ctx) return;
    const t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(this.masterVol * this.masterVol, t, 0.04);
    this.music.gain.setTargetAtTime(this.musicVol * this.musicVol * 0.28, t, 0.08);
    this.sfx.gain.setTargetAtTime(this.sfxVol * this.sfxVol, t, 0.04);
  }

  resume() {
    if (this.ctx?.state === "suspended") void this.ctx.resume();
  }

  private startWind() {
    if (!this.ctx || !this.sfx) return;
    const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * 2, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    let v = 0;
    for (let i = 0; i < d.length; i++) {
      v = v * 0.98 + (Math.random() * 2 - 1) * 0.02;
      d[i] = v;
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const g = this.ctx.createGain();
    g.gain.value = 0.04;
    const f = this.ctx.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.value = 800;
    src.connect(f);
    f.connect(g);
    g.connect(this.sfx);
    src.start();
    this.wind = src;
  }

  private tone(freq: number, dur: number, type: OscillatorType, vol: number, dest: GainNode, slide = 0) {
    if (!this.ctx) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), this.ctx.currentTime + dur);
    g.gain.setValueAtTime(0.0001, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(vol, this.ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + dur);
    o.connect(g);
    g.connect(dest);
    o.start();
    o.stop(this.ctx.currentTime + dur + 0.02);
  }

  private noiseBurst(dur: number, vol: number, freq = 400) {
    if (!this.ctx || !this.sfx) return;
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const f = this.ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = freq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + dur);
    src.connect(f);
    f.connect(g);
    g.connect(this.sfx);
    src.start();
  }

  ui() {
    if (!this.sfx) return;
    this.tone(520, 0.08, "sine", 0.08, this.sfx);
  }

  step(speed: number) {
    this.stepTimer += speed;
    if (this.stepTimer < 1) return;
    this.stepTimer = 0;
    this.noiseBurst(0.05, 0.05 + Math.random() * 0.03, 220 + Math.random() * 80);
  }

  attack() {
    this.noiseBurst(0.12, 0.18, 500);
    if (this.sfx) this.tone(180, 0.12, "square", 0.06, this.sfx, -80);
  }

  hit() {
    this.noiseBurst(0.1, 0.22, 700);
  }

  roar() {
    if (!this.sfx) return;
    this.tone(90, 1.4, "sawtooth", 0.16, this.sfx, -40);
    this.tone(140, 1.2, "square", 0.08, this.sfx, 30);
    this.noiseBurst(0.8, 0.28, 300);
  }

  laugh() {
    if (!this.sfx) return;
    this.tone(340, 0.12, "square", 0.07, this.sfx, 80);
    this.tone(280, 0.16, "square", 0.06, this.sfx, 40);
    this.tone(400, 0.1, "square", 0.05, this.sfx, -20);
  }

  jump() {
    if (!this.sfx) return;
    this.tone(240, 0.12, "sine", 0.07, this.sfx, 180);
  }

  land() {
    this.noiseBurst(0.08, 0.12, 180);
  }

  death() {
    if (!this.sfx) return;
    this.tone(220, 1.4, "sine", 0.1, this.sfx, -160);
  }

  pickup() {
    if (!this.sfx) return;
    this.tone(660, 0.1, "sine", 0.08, this.sfx);
    this.tone(880, 0.14, "sine", 0.06, this.sfx);
  }

  thunder() {
    this.noiseBurst(0.7, 0.35, 180);
  }

  rain(on: boolean) {
    void on;
  }

  setMood(m: Mood) {
    this.mood = m;
  }

  update(dt: number) {
    if (!this.ctx || !this.music) return;
    this.musicTimer -= dt;
    if (this.musicTimer > 0) return;
    const night = this.timeOfDay < 6 || this.timeOfDay > 19;
    if (this.mood === "dead") {
      this.musicTimer = 2;
      return;
    }
    if (this.mood === "roar") {
      this.musicTimer = 0.4;
      return;
    }
    const chase = this.wanted >= 3 || this.mood === "chase";
    const combat = this.inCombat || this.mood === "combat";
    if (chase) {
      this.kickPerc(90, 0.12);
      this.kickPerc(140, 0.08);
      this.musicTimer = 0.28;
      return;
    }
    if (combat) {
      this.kickPerc(110, 0.1);
      this.musicTimer = 0.42;
      return;
    }
    const pent = night ? [196, 220, 247, 294, 330] : [262, 294, 330, 392, 440];
    const f = pent[Math.floor(Math.random() * pent.length)]! * (this.mood === "menu" ? 0.75 : 1);
    this.tone(f, 1.6 + Math.random(), "sine", 0.045, this.music);
    if (Math.random() < 0.4) this.tone(f * 1.5, 1.2, "triangle", 0.02, this.music);
    this.musicTimer = combat ? 0.5 : 1.4 + Math.random() * 1.4;
  }

  private kickPerc(f: number, v: number) {
    if (!this.music) return;
    this.tone(f, 0.18, "triangle", v, this.music, -50);
    this.noiseBurst(0.06, v * 0.4, 200);
  }

  private kickMusic() {
    this.musicTimer = 0.2;
  }

  dispose() {
    try {
      this.wind?.stop();
      void this.ctx?.close();
    } catch {
      /* ignore */
    }
    this.ctx = null;
  }
}
