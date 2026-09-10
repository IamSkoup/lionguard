export class Input {
  keys = new Set<string>();
  injected: string[] | null = null;
  mouseDX = 0;
  mouseDY = 0;
  wheelY = 0;
  lookX = 0;
  lookY = 0;
  joyX = 0;
  joyY = 0;
  camYaw = 0;
  camPitch = 0.42;
  zoom = 9.5;
  pointerLocked = false;
  isTouch = false;
  invertY = false;
  sens = 0.0022;
  private canvas: HTMLCanvasElement;
  private unbind: Array<() => void> = [];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.isTouch =
      typeof window !== "undefined" &&
      ("ontouchstart" in window || navigator.maxTouchPoints > 0);
    this.bind();
  }

  private bind() {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Tab") e.preventDefault();
      if (e.repeat && (e.code === "Space" || e.code === "KeyE" || e.code === "KeyF" || e.code === "KeyQ"))
        return;
      this.keys.add(e.code);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      this.keys.delete(e.code);
    };
    const clear = () => this.keys.clear();
    const onMouse = (e: MouseEvent) => {
      if (!this.pointerLocked) return;
      this.mouseDX += e.movementX;
      this.mouseDY += e.movementY;
    };
    const onWheel = (e: WheelEvent) => {
      this.wheelY += e.deltaY;
    };
    const onLock = () => {
      this.pointerLocked = document.pointerLockElement === this.canvas;
    };
    const onContext = (e: Event) => e.preventDefault();
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", clear);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) clear();
    });
    document.addEventListener("mousemove", onMouse);
    this.canvas.addEventListener("wheel", onWheel, { passive: true });
    document.addEventListener("pointerlockchange", onLock);
    this.canvas.addEventListener("contextmenu", onContext);
    this.unbind.push(
      () => window.removeEventListener("keydown", onKeyDown),
      () => window.removeEventListener("keyup", onKeyUp),
      () => window.removeEventListener("blur", clear),
      () => document.removeEventListener("mousemove", onMouse),
      () => document.removeEventListener("pointerlockchange", onLock),
    );
  }

  requestLock() {
    if (this.isTouch) return;
    this.canvas.requestPointerLock?.();
  }

  exitLock() {
    if (document.pointerLockElement) document.exitPointerLock?.();
  }

  down(code: string): boolean {
    if (this.injected) return this.injected.includes(code);
    return this.keys.has(code);
  }

  consume(code: string): boolean {
    if (this.injected) return this.injected.includes(code);
    if (!this.keys.has(code)) return false;
    this.keys.delete(code);
    return true;
  }

  setInjected(codes: string[] | null) {
    this.injected = codes;
  }

  setJoy(x: number, y: number) {
    this.joyX = x;
    this.joyY = y;
  }

  addLook(dx: number, dy: number) {
    this.lookX += dx;
    this.lookY += dy;
  }

  updateCamera(dt: number) {
    const dx = this.mouseDX + this.lookX;
    const dy = this.mouseDY + this.lookY;
    this.mouseDX = 0;
    this.mouseDY = 0;
    this.lookX = 0;
    this.lookY = 0;
    this.camYaw -= dx * this.sens;
    const ySign = this.invertY ? 1 : -1;
    this.camPitch += dy * this.sens * ySign;
    this.camPitch = Math.max(0.12, Math.min(1.25, this.camPitch));
    if (this.wheelY) {
      this.zoom = Math.max(5.5, Math.min(16, this.zoom + this.wheelY * 0.01));
      this.wheelY = 0;
    }
    void dt;
  }

  moveAxes(): { x: number; y: number } {
    let x = this.joyX;
    let y = this.joyY;
    if (this.down("KeyA") || this.down("ArrowLeft")) x -= 1;
    if (this.down("KeyD") || this.down("ArrowRight")) x += 1;
    if (this.down("KeyW") || this.down("ArrowUp")) y += 1;
    if (this.down("KeyS") || this.down("ArrowDown")) y -= 1;
    const m = Math.hypot(x, y);
    if (m > 1) {
      x /= m;
      y /= m;
    }
    return { x, y };
  }

  dispose() {
    for (const u of this.unbind) u();
    this.unbind = [];
  }
}
