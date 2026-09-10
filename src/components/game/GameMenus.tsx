import { useEffect, useState } from "react";
import { CHAR_META, FACTION_NAMES } from "@/game/constants";
import { engineRef, useGameUI } from "@/game/store";
import type { CharacterId } from "@/game/types";

export function GameMenus() {
  const screen = useGameUI((s) => s.screen);
  return (
    <>
      {screen === "menu" && <MainMenu />}
      {screen === "paused" && <PauseMenu />}
      {screen === "settings" && <Settings />}
      {screen === "controls" && <ControlsHelp />}
      {screen === "achievements" && <Achievements />}
      {screen === "dead" && <DeathScreen />}
      {screen === "map" && <WorldMap />}
      {screen === "inventory" && <Inventory />}
      {screen === "dialogue" && <Dialogue />}
      {screen === "switching" && <SwitchVignette />}
      <SwitchWheel />
    </>
  );
}

function MainMenu() {
  const hasSave = useGameUI((s) => s.hasSave);
  const ready = useGameUI((s) => s.engineReady);
  return (
    <div className="absolute inset-0 flex items-end bg-gradient-to-t from-ink via-ink/70 to-transparent sm:items-center">
      <div className="panel-card m-4 w-[min(100%-2rem,26rem)] sm:ml-16">
        <p className="text-[11px] uppercase tracking-[0.28em] text-stone">Open World</p>
        <h1 className="font-display mt-2 text-4xl leading-tight tracking-[0.12em] text-cream">
          THE LION
          <br />
          GUARD
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-cream-dim">
          После финала третьего сезона. Кайон правит Древом жизни, Витани стережёт Земли Прайда, а Джанджа больше не враг.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <button type="button" className="menu-btn menu-btn-primary" disabled={!ready} onClick={() => engineRef.current?.newGame()}>
            Новая игра
          </button>
          <button type="button" className="menu-btn" disabled={!ready || !hasSave} onClick={() => engineRef.current?.continueGame()}>
            Продолжить
          </button>
          <button type="button" className="menu-btn" onClick={() => useGameUI.getState().setScreen("settings")}>
            Настройки
          </button>
          <button type="button" className="menu-btn" onClick={() => useGameUI.getState().setScreen("controls")}>
            Управление
          </button>
          <button type="button" className="menu-btn" onClick={() => useGameUI.getState().setScreen("achievements")}>
            Достижения
          </button>
        </div>
      </div>
    </div>
  );
}

function PauseMenu() {
  return (
    <div className="absolute inset-0 grid place-items-center bg-ink/55">
      <div className="panel-card w-[min(92%,22rem)]">
        <h2 className="font-display text-2xl tracking-[0.16em] text-cream">Пауза</h2>
        <div className="mt-5 flex flex-col gap-2">
          <button type="button" className="menu-btn menu-btn-primary" onClick={() => engineRef.current?.resume()}>
            Продолжить
          </button>
          <button type="button" className="menu-btn" onClick={() => useGameUI.getState().setScreen("map")}>
            Карта
          </button>
          <button type="button" className="menu-btn" onClick={() => useGameUI.getState().setScreen("inventory")}>
            Сумка
          </button>
          <button type="button" className="menu-btn" onClick={() => useGameUI.getState().setScreen("settings")}>
            Настройки
          </button>
          <button type="button" className="menu-btn" onClick={() => useGameUI.getState().setScreen("controls")}>
            Управление
          </button>
          <button
            type="button"
            className="menu-btn"
            onClick={() => {
              engineRef.current?.saveNow();
              useGameUI.getState().setScreen("menu");
            }}
          >
            В меню
          </button>
        </div>
      </div>
    </div>
  );
}

function Settings() {
  const [s, setS] = useState(() => engineRef.current?.getSettings() ?? {
    mouseSens: 1, master: 0.8, music: 0.55, sfx: 0.8, shake: 0.7, invertY: false,
  });
  const apply = (p: Partial<typeof s>) => {
    const next = { ...s, ...p };
    setS(next);
    engineRef.current?.applySettings(next);
  };
  return (
    <div className="absolute inset-0 grid place-items-center bg-ink/60">
      <div className="panel-card w-[min(92%,24rem)]">
        <h2 className="font-display text-2xl tracking-[0.14em]">Настройки</h2>
        <Slider label="Чувствительность" value={s.mouseSens} onChange={(v) => apply({ mouseSens: v })} />
        <Slider label="Общая громкость" value={s.master} onChange={(v) => apply({ master: v })} />
        <Slider label="Музыка" value={s.music} onChange={(v) => apply({ music: v })} />
        <Slider label="Эффекты" value={s.sfx} onChange={(v) => apply({ sfx: v })} />
        <Slider label="Тряска камеры" value={s.shake} onChange={(v) => apply({ shake: v })} />
        <label className="mt-4 flex items-center gap-3 text-sm text-cream-dim">
          <input type="checkbox" checked={s.invertY} onChange={(e) => apply({ invertY: e.target.checked })} />
          Инвертировать ось Y
        </label>
        <button
          type="button"
          className="menu-btn mt-6"
          onClick={() => {
            const playing = engineRef.current?.isPlaying();
            useGameUI.getState().setScreen(playing ? "paused" : "menu");
          }}
        >
          Назад
        </button>
      </div>
    </div>
  );
}

function Slider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="mt-4 block text-sm">
      <span className="flex justify-between text-cream-dim">
        {label}
        <span className="hud-num text-cream">{Math.round(value * 100)}</span>
      </span>
      <input
        type="range"
        min={0.1}
        max={2}
        step={0.05}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full accent-stone"
      />
    </label>
  );
}

function ControlsHelp() {
  return (
    <div className="absolute inset-0 grid place-items-center bg-ink/60">
      <div className="panel-card max-h-[80dvh] w-[min(92%,28rem)] overflow-auto">
        <h2 className="font-display text-2xl tracking-[0.14em]">Управление</h2>
        <ul className="mt-4 space-y-2 text-sm text-cream-dim">
          <li>WASD — движение относительно камеры</li>
          <li>Мышь — камера</li>
          <li>Shift — бег · Пробел — прыжок</li>
          <li>F — атака · Q — способность</li>
          <li>E — взаимодействие · H — травы</li>
          <li>1 / 2 / 3 — Кайон, Джанджа, Киара</li>
          <li>Удерживайте C — круг выбора</li>
          <li>Tab — карта · Esc — пауза</li>
          <li>На телефоне: левый стик, правая половина — взгляд</li>
        </ul>
        <button type="button" className="menu-btn mt-6" onClick={() => useGameUI.getState().setScreen("menu")}>
          Назад
        </button>
      </div>
    </div>
  );
}

function Achievements() {
  const list = engineRef.current?.getAchievements() ?? [];
  return (
    <div className="absolute inset-0 grid place-items-center bg-ink/60">
      <div className="panel-card max-h-[80dvh] w-[min(92%,28rem)] overflow-auto">
        <h2 className="font-display text-2xl tracking-[0.14em]">Достижения</h2>
        <ul className="mt-4 space-y-3">
          {list.map((a) => (
            <li key={a.id} className="border-b border-border pb-3">
              <p className={`font-medium ${a.got ? "text-cream" : "text-muted"}`}>{a.title}</p>
              <p className="text-sm text-cream-dim">{a.desc}</p>
            </li>
          ))}
        </ul>
        <button type="button" className="menu-btn mt-6" onClick={() => useGameUI.getState().setScreen("menu")}>
          Назад
        </button>
      </div>
    </div>
  );
}

function DeathScreen() {
  const phase = useGameUI((s) => s.deathPhase);
  return (
    <div className="absolute inset-0 grid place-items-center bg-ink/70">
      <div className="text-center">
        <h1 className="wasted-title">МЁРТВ</h1>
        <p className="mt-4 text-lg text-cream-dim">Вы потеряли сознание.</p>
        {phase >= 1 && <p className="mt-6 text-sm uppercase tracking-[0.2em] text-stone">Прошло несколько часов...</p>}
      </div>
    </div>
  );
}

function WorldMap() {
  const data = engineRef.current?.getMap();
  if (!data) return null;
  const size = 280;
  const to = (x: number, z: number) => ({
    left: ((x + data.world) / (data.world * 2)) * size,
    top: ((z + data.world) / (data.world * 2)) * size,
  });
  return (
    <div className="absolute inset-0 grid place-items-center bg-ink/70 p-4">
      <div className="panel-card w-[min(100%,36rem)]">
        <h2 className="font-display text-2xl tracking-[0.14em]">Карта земель</h2>
        <p className="mt-1 text-sm text-cream-dim">Нажмите метку, чтобы поставить путь. Открытые места — быстрый переход за 40 солнц.</p>
        <div className="relative mx-auto mt-4 overflow-hidden rounded-[16px] border border-border" style={{ width: size, height: size, background: "#1a1912" }}>
          {data.pois.map((p) => {
            const pos = to(p.x, p.z);
            return (
              <button
                key={p.id}
                type="button"
                title={p.name}
                className="absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{ left: pos.left, top: pos.top, background: p.discovered ? "#c4b8a4" : "#3a3830" }}
                onClick={() => {
                  engineRef.current?.setWaypoint(p.x, p.z);
                  if (p.discovered && p.ft) engineRef.current?.fastTravel(p.x, p.z);
                }}
              />
            );
          })}
          {data.mission && (
            <span
              className="absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cream"
              style={{ left: to(data.mission.x, data.mission.z).left, top: to(data.mission.x, data.mission.z).top }}
            />
          )}
          <span
            className="absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-health"
            style={{ left: to(data.player.x, data.player.z).left, top: to(data.player.x, data.player.z).top }}
          />
        </div>
        <button type="button" className="menu-btn mt-5" onClick={() => engineRef.current?.resume()}>
          Закрыть
        </button>
      </div>
    </div>
  );
}

function Inventory() {
  const inv = engineRef.current?.getInventory();
  if (!inv) return null;
  return (
    <div className="absolute inset-0 grid place-items-center bg-ink/70 p-4">
      <div className="panel-card max-h-[80dvh] w-[min(100%,28rem)] overflow-auto">
        <h2 className="font-display text-2xl tracking-[0.14em]">Сумка</h2>
        <p className="mt-1 hud-num text-sm text-stone">{inv.money} солнц</p>
        <ul className="mt-4 space-y-2">
          {inv.items.map((it) => (
            <li key={it.id} className="flex items-center justify-between gap-3 border-b border-border py-2">
              <div>
                <p className="text-cream">{it.name}</p>
                <p className="text-xs text-cream-dim">{it.desc}</p>
              </div>
              <span className="hud-num text-stone">{it.qty}</span>
            </li>
          ))}
        </ul>
        <h3 className="mt-6 text-xs uppercase tracking-[0.18em] text-muted">Отношения</h3>
        <ul className="mt-2 space-y-1 text-sm">
          {Object.entries(inv.rep).map(([k, v]) => (
            <li key={k} className="flex justify-between text-cream-dim">
              <span>{FACTION_NAMES[k as keyof typeof FACTION_NAMES] ?? k}</span>
              <span className="hud-num text-cream">{v}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex gap-2">
          <button type="button" className="menu-btn" onClick={() => engineRef.current?.useItem("herb")}>
            Травы
          </button>
          <button type="button" className="menu-btn" onClick={() => engineRef.current?.resume()}>
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}

function Dialogue() {
  const lines = useGameUI((s) => s.dialogue);
  const i = useGameUI((s) => s.dialogueI);
  const line = lines?.[i];
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "KeyE" || e.code === "Space" || e.code === "Enter") engineRef.current?.advanceDialogue();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  if (!line) return null;
  return (
    <button
      type="button"
      className="absolute inset-x-0 bottom-0 bg-transparent p-4 text-left"
      onClick={() => engineRef.current?.advanceDialogue()}
    >
      <div className="mx-auto w-[min(100%,40rem)] rounded-[20px] border border-border bg-ink/85 px-5 py-4">
        <p className="font-display text-sm tracking-[0.16em] text-stone">{line.speaker}</p>
        <p className="mt-2 text-base leading-relaxed text-cream">{line.text}</p>
        <p className="mt-3 text-[11px] uppercase tracking-[0.16em] text-muted">Дальше</p>
      </div>
    </button>
  );
}

function SwitchVignette() {
  const text = useGameUI((s) => s.switchVignette);
  return (
    <div className="absolute inset-0 grid place-items-center bg-ink">
      <p className="max-w-md px-6 text-center font-display text-xl leading-snug text-cream">{text}</p>
    </div>
  );
}

function SwitchWheel() {
  const open = useGameUI((s) => s.switchWheel);
  const used = useGameUI((s) => s.usedChars);
  if (!open) return null;
  const chars: CharacterId[] = ["kion", "janja", "kiara"];
  return (
    <div className="pointer-events-auto absolute inset-0 grid place-items-center bg-ink/40">
      <div className="flex gap-3">
        {chars.map((id) => (
          <button
            key={id}
            type="button"
            className="menu-btn w-28 flex-col py-4"
            onClick={() => engineRef.current?.switchTo(id)}
          >
            {CHAR_META[id].name}
            {used[id] ? "" : ""}
          </button>
        ))}
      </div>
    </div>
  );
}
