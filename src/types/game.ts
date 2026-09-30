import type { z } from 'zod';
import type { roundSchema, sessionSchema, eventSchema } from '../schemas/game.schema';

export type Round = z.infer<typeof roundSchema>;
export type Session = z.infer<typeof sessionSchema>;
export type GameEvent = z.infer<typeof eventSchema>;
export type Phase = 'loading' | 'idle' | 'requesting' | 'spinning' | 'result' | 'error';
export type RuntimeMode = 'server' | 'standalone';
