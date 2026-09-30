import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer, WebSocket } from 'ws';
import { GameSession } from './session';
import { spinRequestSchema } from '../src/schemas/game.schema';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sessions = new Map<string, { game: GameSession; touched: number }>();
const sockets = new Map<WebSocket, string>();
const production = process.argv.includes('--production');
const vite = production
  ? null
  : await (
      await import('vite')
    ).createServer({ root, server: { middlewareMode: true }, appType: 'spa' });
const cookieId = (cookie = '') =>
  cookie
    .split(';')
    .map((s) => s.trim())
    .find((s) => s.startsWith('vv_session='))
    ?.slice(11);
const send = (res: import('node:http').ServerResponse, code: number, data: unknown) => {
  res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(data));
};
const broadcast = (id: string, data: unknown) => {
  for (const [socket, session] of sockets)
    if (session === id && socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(data));
};
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? '/', 'http://localhost');
    if (url.pathname === '/api/health') return send(res, 200, { ok: true, mode: 'node' });
    if (url.pathname.startsWith('/api/')) {
      if (req.headers.origin && new URL(req.headers.origin).host !== req.headers.host)
        return send(res, 403, { message: 'Origem não permitida.' });
      let id = cookieId(req.headers.cookie);
      if (!id || !sessions.has(id)) {
        if (url.pathname !== '/api/session' || req.method !== 'GET')
          return send(res, 401, { message: 'Sessão expirada. Recarregue o jogo.' });
        if (sessions.size >= 1000)
          return send(res, 503, { message: 'Servidor ocupado. Tente novamente.' });
        id = randomUUID();
        sessions.set(id, { game: new GameSession(), touched: Date.now() });
        res.setHeader(
          'Set-Cookie',
          `vv_session=${id}; HttpOnly; SameSite=Strict; Path=/; Max-Age=86400`,
        );
      }
      const entry = sessions.get(id)!;
      entry.touched = Date.now();
      const game = entry.game;
      if (url.pathname === '/api/session' && req.method === 'GET')
        return send(res, 200, game.snapshot());
      if (url.pathname === '/api/session/reset' && req.method === 'POST') {
        game.reset();
        broadcast(id, { type: 'session.reset', balance: game.balance });
        return send(res, 200, game.snapshot());
      }
      if (url.pathname === '/api/spins' && req.method === 'POST') {
        let body = '';
        for await (const chunk of req) {
          body += chunk;
          if (body.length > 2048) return send(res, 413, { message: 'Requisição muito grande.' });
        }
        let parsed;
        try {
          parsed = spinRequestSchema.safeParse(JSON.parse(body));
        } catch {
          return send(res, 400, { message: 'JSON inválido.' });
        }
        if (!parsed.success) return send(res, 400, { message: 'Dados de rodada inválidos.' });
        try {
          const round = game.spin(parsed.data.requestId, parsed.data.bet, parsed.data.winSequence, parsed.data.winSequenceIndex);
          broadcast(id, { type: 'round.settled', round });
          return send(res, 200, round);
        } catch (e) {
          return send(res, 409, { message: (e as Error).message });
        }
      }
      return send(res, 404, { message: 'Rota não encontrada.' });
    }
    if (vite) return vite.middlewares(req, res);
    const safe = path.resolve(root, 'dist', '.' + decodeURIComponent(url.pathname));
    if (!safe.startsWith(path.join(root, 'dist') + path.sep) && safe !== path.join(root, 'dist'))
      return send(res, 403, {});
    let target = safe;
    try {
      if (!(await stat(target)).isFile()) target = path.join(root, 'dist/index.html');
    } catch {
      target = path.join(root, 'dist/index.html');
    }
    const mime: Record<string, string> = {
      '.html': 'text/html',
      '.js': 'text/javascript',
      '.css': 'text/css',
      '.svg': 'image/svg+xml',
      '.webp': 'image/webp',
      '.png': 'image/png',
    };
    res.writeHead(200, {
      'Content-Type': mime[path.extname(target)] ?? 'application/octet-stream',
    });
    res.end(await readFile(target));
  } catch (error) {
    console.error(error);
    if (!res.headersSent) send(res, 500, { message: 'Não foi possível completar a operação.' });
    else res.end();
  }
});
const wss = new WebSocketServer({ noServer: true, maxPayload: 1024 });
server.on('upgrade', (req, socket, head) => {
  if (req.url !== '/ws') {
    if (!vite) socket.destroy();
    return;
  }
  const id = cookieId(req.headers.cookie);
  if (
    !id ||
    !sessions.has(id) ||
    !req.headers.origin ||
    new URL(req.headers.origin).host !== req.headers.host
  ) {
    socket.destroy();
    return;
  }
  wss.handleUpgrade(req, socket, head, (ws) => {
    sockets.set(ws, id!);
    ws.send(JSON.stringify({ type: 'connected', at: new Date().toISOString() }));
    ws.on('message', (data) => {
      try {
        const event = JSON.parse(data.toString());
        if (event.type === 'ping' && typeof event.sentAt === 'number')
          ws.send(JSON.stringify({ type: 'pong', sentAt: event.sentAt }));
      } catch {
        /* Invalid messages never alter game state. */
      }
    });
    ws.on('close', () => sockets.delete(ws));
    ws.on('error', () => sockets.delete(ws));
  });
});
const cleanup = setInterval(() => {
  for (const [id, entry] of sessions)
    if (Date.now() - entry.touched > 86400000) sessions.delete(id);
}, 60000);
cleanup.unref();
const port = Number(process.env.PORT ?? 5173);
server.listen(port, '0.0.0.0', () =>
  console.log(
    `Verdant Vault → http://localhost:${port} (${production ? 'production' : 'development'})`,
  ),
);
for (const signal of ['SIGINT', 'SIGTERM'] as const)
  process.on(signal, () => {
    wss.close();
    server.close();
    void vite?.close();
    process.exit(0);
  });
