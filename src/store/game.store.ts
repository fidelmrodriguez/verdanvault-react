import { create } from 'zustand';
import type { Phase, Round, RuntimeMode } from '../types/game';

type State = {
  phase: Phase;
  balance: number;
  bet: number;
  history: Round[];
  result: Round | null;
  error: string | null;
  turbo: boolean;
  musicMuted: boolean;
  fxMuted: boolean;
  winSequence: boolean;
  winSequenceIndex: number;
  connected: boolean;
  runtime: RuntimeMode;
  latency: number;
  events: string[];
  fps: number;
  frameMs: number;
  loadMs: number;
  set: (patch: Partial<State>) => void;
  event: (text: string) => void;
};

export const useGameStore = create<State>((set) => ({
  phase: 'loading',
  balance: 1000,
  bet: 10,
  history: [],
  result: null,
  error: null,
  turbo: false,
  musicMuted: false,
  fxMuted: false,
  winSequence: false,
  winSequenceIndex: 0,
  connected: false,
  runtime: 'server',
  latency: 0,
  events: [],
  fps: 0,
  frameMs: 0,
  loadMs: 0,
  set: (patch) => set(patch),
  event: (text) => set((s) => ({ events: [text, ...s.events].slice(0, 8) })),
}));
