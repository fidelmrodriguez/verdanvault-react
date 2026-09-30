import { useEffect, useRef, useState } from 'react';
import { SlotEngine } from '../game/SlotEngine';
import { useGameStore } from '../store/game.store';
export function GameCanvas({
  engine,
  onReady,
}: {
  engine: React.RefObject<SlotEngine | null>;
  onReady: () => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const [error, setError] = useState('');
  const [initialized, setInitialized] = useState(false);
  useEffect(() => {
    const instance = new SlotEngine(host.current!, (fps, frameMs) =>
      useGameStore.getState().set({ fps, frameMs }),
    );
    engine.current = instance;
    let active = true;
    void instance
      .init()
      .then(() => {
        if (active) {
          setInitialized(true);
          onReady();
        }
      })
      .catch(() => {
        if (active)
          setError(
            'A renderização não iniciou. Ative a aceleração gráfica do navegador e recarregue.',
          );
      });
    return () => {
      active = false;
      instance.destroy();
      engine.current = null;
    };
  }, [engine, onReady]);
  return (
    <div
      className="canvas-host"
      ref={host}
      role="img"
      aria-label="Três rolos com três símbolos cada. O resultado da rodada é anunciado abaixo."
    >
      {!initialized && !error && <div className="render-loading">Preparando o templo…</div>}
      {error && (
        <p role="alert" className="canvas-error">
          {error}
        </p>
      )}
    </div>
  );
}
