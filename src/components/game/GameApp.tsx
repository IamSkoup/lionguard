import { useEffect, useRef } from "react";
import { engineRef, useGameUI } from "@/game/store";
import { hasSave } from "@/game/save";
import { GameHUD } from "./GameHUD";
import { GameMenus } from "./GameMenus";

export function GameApp() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const screen = useGameUI((s) => s.screen);

  useEffect(() => {
    useGameUI.getState().setHasSave(hasSave());
    const canvas = canvasRef.current;
    if (!canvas) return;
    let alive = true;
    let engine: { dispose: () => void } | null = null;
    void import("@/game/engine").then(({ GameEngine }) => {
      if (!alive || !canvasRef.current) return;
      engine = new GameEngine(canvasRef.current);
    });
    return () => {
      alive = false;
      engine?.dispose();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    const onVis = () => {
      if (document.hidden) engineRef.current?.saveNow();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  return (
    <div className="game-root">
      <canvas
        ref={canvasRef}
        className="game-canvas"
        tabIndex={0}
        onClick={() => {
          if (screen === "playing") engineRef.current?.requestPointer();
        }}
      />
      <GameHUD />
      <GameMenus />
    </div>
  );
}
