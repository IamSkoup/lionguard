import { useEffect, useRef } from "react";
import { Heart, Map as MapIcon, Pause } from "lucide-react";
import { engineRef, useGameUI } from "@/game/store";
import { TouchPad } from "./TouchPad";

export function GameHUD() {
  const screen = useGameUI((s) => s.screen);
  const hud = useGameUI((s) => s.hud);
  const toasts = useGameUI((s) => s.toasts);
  const dropToast = useGameUI((s) => s.dropToast);
  const interact = hud.interactLabel;
  const mapRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (screen !== "playing") return;
    let raf = 0;
    const tick = () => {
      const c = mapRef.current;
      const eng = engineRef.current;
      if (c && eng) {
        const ctx = c.getContext("2d");
        if (ctx) {
          const size = 96;
          if (c.width !== size) {
            c.width = size;
            c.height = size;
          }
          const img = ctx.createImageData(size, size);
          const { yaw, blips } = eng.getMinimap(img.data, size);
          ctx.putImageData(img, 0, 0);
          ctx.save();
          ctx.translate(48, 48);
          ctx.rotate(-yaw);
          ctx.fillStyle = "#efe6d2";
          ctx.beginPath();
          ctx.moveTo(0, -6);
          ctx.lineTo(4, 5);
          ctx.lineTo(-4, 5);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
          for (const b of blips) {
            const px = ((b.x - 0) / 1);
            void px;
            const p = eng.getMap().player;
            const x = 48 + ((b.x - p.x) / 52) * 48;
            const y = 48 + ((b.z - p.z) / 52) * 48;
            ctx.fillStyle = b.c;
            ctx.fillRect(x - 1.5, y - 1.5, 3, 3);
          }
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [screen]);

  useEffect(() => {
    if (!toasts.length) return;
    const t = window.setTimeout(() => dropToast(toasts[0]!.id), 3200);
    return () => window.clearTimeout(t);
  }, [toasts, dropToast]);

  if (screen !== "playing" && screen !== "dialogue") return null;

  const hp = Math.max(0, hud.hp / hud.maxHp);
  const st = Math.max(0, hud.stamina / hud.maxStamina);
  const ab = Math.max(0, Math.min(1, hud.ability));
  const clock = formatTime(hud.timeOfDay);

  return (
    <div className="pointer-events-none absolute inset-0 p-3 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 max-w-[min(100%,22rem)]">
          <div className="rounded-[20px] border border-border bg-ink/70 px-4 py-3">
            <div className="flex items-baseline justify-between gap-3">
              <p className="font-display text-sm tracking-[0.18em] text-cream">{hud.characterName}</p>
              <p className="hud-num text-[11px] text-muted">{clock}</p>
            </div>
            <p className="mt-0.5 text-[11px] text-cream-dim">{hud.region}</p>
            <Bar label="Здоровье" value={hp} color="var(--color-health)" />
            <Bar label="Силы" value={st} color="var(--color-stone)" />
            <Bar label={hud.abilityName} value={ab} color="var(--color-ok)" />
            <div className="mt-2 flex items-center justify-between text-[11px] text-cream-dim">
              <span className="hud-num">{hud.money} солнц</span>
              <span className="uppercase tracking-wider">{weatherRu(hud.weather)}</span>
            </div>
            {hud.wanted > 0 && (
              <div className="mt-2 flex gap-1" aria-label="Преследование">
                {Array.from({ length: 5 }, (_, i) => (
                  <span key={i} className={`star-wanted ${i < hud.wanted ? "on" : ""}`} />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="pointer-events-auto flex gap-2">
            <button
              type="button"
              className="grid size-11 place-items-center rounded-full border border-border bg-ink/70 text-cream"
              onClick={() => engineRef.current && useGameUI.getState().setScreen("map")}
              aria-label="Карта"
            >
              <MapIcon className="size-4" />
            </button>
            <button
              type="button"
              className="grid size-11 place-items-center rounded-full border border-border bg-ink/70 text-cream"
              onClick={() => engineRef.current?.pause()}
              aria-label="Пауза"
            >
              <Pause className="size-4" />
            </button>
          </div>
          <canvas
            ref={mapRef}
            className="size-24 rounded-full border border-border-strong shadow-lg sm:size-28"
            aria-hidden
          />
        </div>
      </div>

      <div className="absolute bottom-24 left-1/2 w-[min(92%,28rem)] -translate-x-1/2 text-center sm:bottom-10">
        <p className="font-display text-xs tracking-[0.14em] text-stone">{hud.missionTitle}</p>
        <p className="mt-1 text-sm text-cream">{hud.missionHint}</p>
        {interact && (
          <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-border bg-ink/70 px-3 py-1.5 text-xs text-cream">
            <Heart className="size-3" /> {interact}
          </p>
        )}
      </div>

      <div className="absolute right-4 top-1/3 flex max-w-xs flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="rounded-[12px] border border-border bg-ink/80 px-3 py-2 text-sm text-cream"
          >
            {t.text}
          </div>
        ))}
      </div>

      <TouchPad />
    </div>
  );
}

function Bar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="mt-2">
      <div className="mb-1 flex justify-between text-[10px] uppercase tracking-wider text-muted">
        <span>{label}</span>
        <span className="hud-num">{Math.round(value * 100)}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-ink-3">
        <div className="h-full rounded-full" style={{ width: `${Math.round(value * 100)}%`, background: color }} />
      </div>
    </div>
  );
}

function formatTime(t: number) {
  const h = Math.floor(t) % 24;
  const m = Math.floor((t - Math.floor(t)) * 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function weatherRu(w: string) {
  const map: Record<string, string> = {
    clear: "Ясно",
    clouds: "Облачно",
    rain: "Дождь",
    storm: "Гроза",
    fog: "Туман",
    wind: "Ветер",
  };
  return map[w] ?? w;
}
