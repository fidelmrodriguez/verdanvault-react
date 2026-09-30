import { useCallback, useEffect, useRef, useState } from 'react';
import { gameService } from '../services/game.service';
import { useGameStore } from '../store/game.store';
import { audio } from '../game/audio';
import type { SlotEngine } from '../game/SlotEngine';
import { requestId } from '../utils/requestId';
import { WIN_SEQUENCE_LENGTH } from '../game/rules';
import { useRealtime } from './useRealtime';

export function useGame(engine: React.RefObject<SlotEngine | null>) {
  const [booted, setBooted] = useState(false);
  const pending = useRef<{ id: string; bet: number; winSequence: boolean; winSequenceIndex: number } | null>(null);

  const bootstrap = useCallback(async () => {
    const start = performance.now();
    useGameStore.getState().set({ phase: 'loading', error: null });
    try {
      const session = await gameService.session();
      useGameStore.getState().set({
        ...session,
        runtime: gameService.mode,
        phase: 'idle',
        loadMs: Math.round(performance.now() - start),
      });
      setBooted(true);
    } catch (error) {
      useGameStore.getState().set({ phase: 'error', error: (error as Error).message });
    }
  }, []);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  const runtime = useGameStore((state) => state.runtime);
  useRealtime(booted, runtime);

  const spin = useCallback(async () => {
    const s = useGameStore.getState();
    if (!engine.current || !['idle', 'result', 'error'].includes(s.phase) || !booted) return;

    const request = pending.current ?? {
      id: requestId(),
      bet: s.bet,
      winSequence: s.winSequence,
      winSequenceIndex: s.winSequenceIndex,
    };
    pending.current = request;
    s.set({ phase: 'requesting', error: null });
    void audio.unlock();
    if (!s.turbo) {
      engine.current.start();
      audio.play('spin');
    }

    try {
      const round = await gameService.spin(request.id, request.bet, request.winSequence, request.winSequenceIndex);
      s.set({ phase: 'spinning' });
      await engine.current.finish(round, s.turbo);
      pending.current = null;
      s.set({
        balance: round.balance,
        result: round,
        history: [round, ...useGameStore.getState().history.filter((r) => r.id !== round.id)].slice(
          0,
          30,
        ),
        winSequenceIndex: request.winSequence
          ? (request.winSequenceIndex + 1) % WIN_SEQUENCE_LENGTH
          : useGameStore.getState().winSequenceIndex,
        phase: 'result',
      });
      const multiplier = round.payout / Math.max(round.bet, 1);
      audio.play(round.payout ? (multiplier >= 20 ? 'bonus' : multiplier >= 8 ? 'bigwin' : 'win') : 'stop');
    } catch (error) {
      engine.current?.cancel();
      s.set({ phase: 'error', error: (error as Error).message });
    }
  }, [booted, engine]);

  const reset = async () => {
    const s = useGameStore.getState();
    if (['requesting', 'spinning', 'loading'].includes(s.phase)) return;
    s.set({ phase: 'loading', error: null });
    try {
      const session = await gameService.reset();
      pending.current = null;
      s.set({ ...session, result: null, phase: 'idle' });
    } catch (error) {
      s.set({ phase: 'error', error: (error as Error).message });
    }
  };

  return { spin, reset, bootstrap, booted };
}
