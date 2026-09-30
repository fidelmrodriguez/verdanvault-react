import { randomInt, randomUUID } from 'node:crypto';
import { BETS, INITIAL_CREDITS, evaluate, generateGrid, generateWinSequenceGrid } from '../src/game/rules';
import type { Round } from '../src/types/game';

export class GameSession {
  balance = INITIAL_CREDITS;
  history: Round[] = [];
  private requests = new Map<string, Round>();

  spin(requestId: string, bet: number, winSequence = false, winSequenceIndex = 0): Round {
    const cached = this.requests.get(requestId);
    if (cached) {
      if (cached.bet !== bet) throw new Error('Conflito de idempotência.');
      return cached;
    }
    if (this.count >= 500) throw new Error('Limite da sessão atingido. Reinicie os créditos.');
    if (!BETS.includes(bet)) throw new Error('Custo inválido.');
    if (this.balance < bet) throw new Error('Créditos insuficientes. Reinicie a expedição.');

    const grid = winSequence
      ? generateWinSequenceGrid(winSequenceIndex)
      : generateGrid(randomInt);
    const { wins, payout } = evaluate(grid, bet);
    this.balance = this.balance - bet + payout;
    const round: Round = {
      id: randomUUID(),
      bet,
      payout,
      balance: this.balance,
      grid,
      wins,
      createdAt: new Date().toISOString(),
    };

    this.history = [round, ...this.history].slice(0, 30);
    this.requests.set(requestId, round);
    return round;
  }

  get count() {
    return this.requests.size;
  }

  reset() {
    this.balance = INITIAL_CREDITS;
    this.history = [];
    this.requests.clear();
  }

  snapshot() {
    return { balance: this.balance, history: this.history, virtual: true as const };
  }
}
