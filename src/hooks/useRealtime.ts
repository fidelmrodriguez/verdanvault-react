import { useEffect } from 'react';
import { eventSchema } from '../schemas/game.schema';
import { useGameStore } from '../store/game.store';
import type { RuntimeMode } from '../types/game';

export function useRealtime(enabled: boolean, runtime: RuntimeMode) {
  useEffect(() => {
    const store = useGameStore.getState;
    if (!enabled) return;

    if (runtime === 'standalone') {
      store().set({ connected: true, latency: 0 });
      return () => store().set({ connected: false });
    }

    let disposed = false;
    let socket: WebSocket;
    let retry = 0;
    let reconnect: ReturnType<typeof setTimeout>;
    let heartbeat: ReturnType<typeof setInterval>;

    const connect = () => {
      socket = new WebSocket(
        `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}/ws`,
      );
      socket.onopen = () => {
        retry = 0;
        store().set({ connected: true });
        store().event('Canal de eventos conectado');
        const ping = () => {
          if (socket.readyState === WebSocket.OPEN)
            socket.send(JSON.stringify({ type: 'ping', sentAt: Date.now() }));
        };
        ping();
        heartbeat = setInterval(ping, 5000);
      };
      socket.onmessage = (message) => {
        let data: unknown;
        try {
          data = JSON.parse(message.data);
        } catch {
          return;
        }
        const result = eventSchema.safeParse(data);
        if (!result.success) return;
        const event = result.data;
        if (event.type === 'pong') store().set({ latency: Date.now() - event.sentAt });
        if (event.type === 'round.settled') {
          store().event(`Rodada ${event.round.id.slice(0, 8)} · +${event.round.payout} cr`);
          if (['idle', 'result'].includes(store().phase))
            store().set({
              balance: event.round.balance,
              history: [
                event.round,
                ...store().history.filter((r) => r.id !== event.round.id),
              ].slice(0, 30),
            });
        }
        if (event.type === 'session.reset' && ['idle', 'result'].includes(store().phase))
          store().set({ balance: event.balance, history: [], result: null, phase: 'idle' });
      };
      socket.onclose = () => {
        clearInterval(heartbeat);
        store().set({ connected: false });
        if (!disposed) reconnect = setTimeout(connect, Math.min(1000 * 2 ** retry++, 10000));
      };
      socket.onerror = () => socket.close();
    };

    connect();
    return () => {
      disposed = true;
      clearInterval(heartbeat);
      clearTimeout(reconnect);
      socket?.close();
    };
  }, [enabled, runtime]);
}
