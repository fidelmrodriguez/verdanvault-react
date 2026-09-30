import { z } from 'zod';
import { SYMBOLS, BETS } from '../game/rules';

export const gridSchema = z.array(z.array(z.enum(SYMBOLS)).length(3)).length(3);

export const roundSchema = z.object({
  id: z.string(),
  bet: z.number().int(),
  payout: z.number().int(),
  balance: z.number().int(),
  grid: gridSchema,
  wins: z.array(
    z.object({
      line: z.number().int().min(0).max(4),
      symbol: z.enum(SYMBOLS),
      amount: z.number().int(),
    }),
  ),
  createdAt: z.string(),
});

export const sessionSchema = z.object({
  balance: z.number().int(),
  history: z.array(roundSchema),
  virtual: z.literal(true),
});

export const spinRequestSchema = z.object({
  requestId: z.string().uuid(),
  bet: z
    .number()
    .int()
    .refine((n) => BETS.includes(n)),
  winSequence: z.boolean().optional().default(false),
  winSequenceIndex: z.number().int().nonnegative().optional().default(0),
});

export const eventSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('connected'), at: z.string() }),
  z.object({ type: z.literal('round.settled'), round: roundSchema }),
  z.object({ type: z.literal('session.reset'), balance: z.number().int() }),
  z.object({ type: z.literal('pong'), sentAt: z.number() }),
]);
