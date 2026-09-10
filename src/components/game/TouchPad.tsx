import { useEffect, useRef, useState } from "react";
import { engineRef, useGameUI } from "@/game/store";

export function TouchPad() {
  const screen = useGameUI((s) => s.screen);
  const [touch, setTouch] = useState(false);
  const stick = useRef<HTMLDivElement>(null);
  const origin = useRef<{ x: number; y: number; id: number } | null>(null);
  const look = useRef<{ x: number; y: number; id: number } | null>(null);

  useEffect(() => {
    const coarse = window.matchMedia("(pointer: coarse)").matches || navigator.maxTouchPoints > 0;
    setTouch(coarse);
  }, []);

  useEffect(() => {
    if (!touch || screen !== "playing") return;
    const onMove = (e: TouchEvent) => {
      for (const t of Array.from(e.changedTouches)) {
        if (origin.current && t.identifier === origin.current.id) {
          const dx = (t.clientX - origin.current.x) / 46;
          const dy = (t.clientY - origin.current.y) / 46;
          const m = Math.hypot(dx, dy) || 1;
          const nx = m > 1 ? dx / m : dx;
          const ny = m > 1 ? dy / m : dy;
          engineRef.current?.setJoy(nx, -ny);
          const knob = stick.current?.querySelector("[data-knob]") as HTMLElement | null;
          if (knob) {
            knob.style.transform = `translate(${nx * 22}px, ${ny * 22}px)`;
          }
        }
        if (look.current && t.identifier === look.current.id) {
          const dx = t.clientX - look.current.x;
          const dy = t.clientY - look.current.y;
          look.current.x = t.clientX;
          look.current.y = t.clientY;
          engineRef.current?.addLook(dx * 1.6, dy * 1.6);
        }
      }
    };
    const onEnd = (e: TouchEvent) => {
      for (const t of Array.from(e.changedTouches)) {
        if (origin.current?.id === t.identifier) {
          origin.current = null;
          engineRef.current?.setJoy(0, 0);
          const knob = stick.current?.querySelector("[data-knob]") as HTMLElement | null;
          if (knob) knob.style.transform = "translate(0,0)";
        }
        if (look.current?.id === t.identifier) look.current = null;
      }
    };
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onEnd);
    window.addEventListener("touchcancel", onEnd);
    return () => {
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
      window.removeEventListener("touchcancel", onEnd);
    };
  }, [touch, screen]);

  if (!touch || screen !== "playing") return null;

  const tap = (code: string) => {
    engineRef.current?.tapKey(code);
  };

  return (
    <div className="pointer-events-none absolute inset-0">
      <div
        ref={stick}
        className="pointer-events-auto absolute bottom-8 left-6 size-32 rounded-full border border-border-strong bg-ink/40"
        onTouchStart={(e) => {
          const t = e.changedTouches[0];
          if (!t) return;
          origin.current = { x: t.clientX, y: t.clientY, id: t.identifier };
        }}
      >
        <div data-knob className="absolute left-1/2 top-1/2 size-14 -translate-x-1/2 -translate-y-1/2 rounded-full bg-stone/80" />
      </div>
      <div
        className="pointer-events-auto absolute inset-y-0 right-0 w-1/2"
        onTouchStart={(e) => {
          const t = e.changedTouches[0];
          if (!t) return;
          look.current = { x: t.clientX, y: t.clientY, id: t.identifier };
        }}
      />
      <div className="pointer-events-auto absolute bottom-8 right-5 flex flex-col gap-2">
        <div className="flex gap-2">
          <button type="button" className="touch-btn" onPointerDown={() => tap("KeyQ")}>Q</button>
          <button type="button" className="touch-btn" onPointerDown={() => tap("KeyF")}>Атака</button>
        </div>
        <div className="flex gap-2">
          <button type="button" className="touch-btn" onPointerDown={() => tap("KeyE")}>E</button>
          <button type="button" className="touch-btn" onPointerDown={() => tap("Space")}>Прыжок</button>
        </div>
        <div className="flex gap-2">
          <button type="button" className="touch-btn" onPointerDown={() => tap("ShiftLeft")}>Бег</button>
          <button type="button" className="touch-btn" onPointerDown={() => tap("Digit1")}>К</button>
          <button type="button" className="touch-btn" onPointerDown={() => tap("Digit2")}>Д</button>
          <button type="button" className="touch-btn" onPointerDown={() => tap("Digit3")}>Ки</button>
        </div>
      </div>
    </div>
  );
}
