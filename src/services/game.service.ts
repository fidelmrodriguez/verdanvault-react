import type { z } from 'zod';
import { roundSchema, sessionSchema } from '../schemas/game.schema';
import { BETS, INITIAL_CREDITS, evaluate, generateGrid, generateWinSequenceGrid } from '../game/rules';
import type { Round, RuntimeMode, Session } from '../types/game';

class ApiUnavailableError extends Error {}

async function request<T>(url: string, schema: z.ZodType<T>, body?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: body ? 'POST' : 'GET',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    throw new ApiUnavailableError('Servidor indisponível.');
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) throw new ApiUnavailableError('API indisponível.');

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new ApiUnavailableError('Resposta inválida da API.');
  }

  if (!response.ok) {
    if (response.status === 404) throw new ApiUnavailableError('API não encontrada.');
    throw new Error(
      typeof data === 'object' && data && 'message' in data
        ? String(data.message)
        : 'Não foi possível concluir a operação.',
    );
  }

  const parsed = schema.safeParse(data);
  if (!parsed.success) throw new Error('Resposta do servidor incompatível. Recarregue o jogo.');
  return parsed.data;
}

const STORAGE_KEY = 'verdant-vault-session-v1';
const settled = new Map<string, Round>();

function secureRandomInt(max: number) {
  const range = 0x1_0000_0000;
  const limit = Math.floor(range / max) * max;
  const buffer = new Uint32Array(1);
  do crypto.getRandomValues(buffer);
  while (buffer[0] >= limit);
  return buffer[0] % max;
}

function readStandalone(): Session {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = sessionSchema.safeParse(JSON.parse(raw));
      if (parsed.success) return parsed.data;
    }
  } catch {
    // Storage is optional. The in-memory defaults still keep the game playable.
  }
  return { balance: INITIAL_CREDITS, history: [], virtual: true };
}

function writeStandalone(session: Session) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Private modes can deny storage. The current round still works.
  }
}

const standalone = {
  session: () => readStandalone(),
  reset: () => {
    settled.clear();
    const session: Session = { balance: INITIAL_CREDITS, history: [], virtual: true };
    writeStandalone(session);
    return session;
  },
  spin: (requestId: string, bet: number, winSequence = false, winSequenceIndex = 0) => {
    const cached = settled.get(requestId);
    if (cached) return cached;
    if (!BETS.includes(bet)) throw new Error('Custo inválido.');

    const session = readStandalone();
    if (session.balance < bet) throw new Error('Créditos insuficientes. Reinicie a expedição.');

    const grid = winSequence
      ? generateWinSequenceGrid(winSequenceIndex)
      : generateGrid(secureRandomInt);
    const { wins, payout } = evaluate(grid, bet);
    const round: Round = {
      id: requestId,
      bet,
      payout,
      balance: session.balance - bet + payout,
      grid,
      wins,
      createdAt: new Date().toISOString(),
    };

    settled.set(requestId, round);
    writeStandalone({ balance: round.balance, history: [round, ...session.history].slice(0, 30), virtual: true });
    return round;
  },
};

let runtime: RuntimeMode = 'server';

export const gameService = {
  get mode() {
    return runtime;
  },
  async session() {
    try {
      const session = await request('/api/session', sessionSchema);
      runtime = 'server';
      return session;
    } catch (error) {
      if (!(error instanceof ApiUnavailableError) || !import.meta.env.PROD) throw error;
      runtime = 'standalone';
      return standalone.session();
    }
  },
  async reset() {
    if (runtime === 'standalone') return standalone.reset();
    return request('/api/session/reset', sessionSchema, {});
  },
  async spin(requestId: string, bet: number, winSequence = false, winSequenceIndex = 0) {
    if (runtime === 'standalone') return standalone.spin(requestId, bet, winSequence, winSequenceIndex);
    return request('/api/spins', roundSchema, { requestId, bet, winSequence, winSequenceIndex });
  },
};
