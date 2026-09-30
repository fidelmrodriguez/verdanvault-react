import { before, after, it } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, type ChildProcess } from 'node:child_process';
import { once } from 'node:events';
import { WebSocket } from 'ws';

const base = 'http://127.0.0.1:5191';
let child: ChildProcess;
let cookie = '';

before(async () => {
  child = spawn(process.execPath, ['--import', 'tsx', 'server/index.ts', '--production'], {
    env: { ...process.env, PORT: '5191' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('API startup timed out')), 10000);
    child.stdout!.on('data', (chunk) => {
      if (String(chunk).includes('Verdant Vault')) {
        clearTimeout(timer);
        resolve();
      }
    });
    child.once('error', reject);
  });
  const response = await fetch(base + '/api/session');
  cookie = response.headers.get('set-cookie')!.split(';')[0];
  assert.equal(response.status, 200);
});

after(() => child?.kill('SIGTERM'));

const post = (path: string, data: unknown, extra: Record<string, string> = {}) =>
  fetch(base + path, {
    method: 'POST',
    headers: { Cookie: cookie, 'Content-Type': 'application/json', ...extra },
    body: JSON.stringify(data),
  });

it('REST bootstrap expõe créditos virtuais', async () => {
  const response = await fetch(base + '/api/session', { headers: { Cookie: cookie } });
  assert.equal((await response.json()).virtual, true);
});

it('retries concorrentes retornam uma única rodada', async () => {
  const data = { requestId: crypto.randomUUID(), bet: 10 };
  const results = await Promise.all(
    Array.from({ length: 4 }, async () => await (await post('/api/spins', data)).json()),
  );
  assert.equal(new Set(results.map((round) => round.id)).size, 1);
  assert.equal(new Set(results.map((round) => round.balance)).size, 1);
});

it('rejeita payload inválido com HTTP 400', async () =>
  assert.equal((await post('/api/spins', { bet: -1 })).status, 400));

it('sequência de vitórias da API só entrega rodadas vencedoras enquanto estiver ativa', async () => {
  const rounds = [];
  for (let index = 0; index < 10; index++) {
    const response = await post('/api/spins', {
      requestId: crypto.randomUUID(),
      bet: 10,
      winSequence: true,
      winSequenceIndex: index,
    });
    assert.equal(response.status, 200);
    rounds.push(await response.json());
  }
  assert.equal(rounds.every((round) => round.payout > 0), true);
  assert.equal(rounds.some((round) => round.wins.length > 1), true);
  assert.equal(rounds.some((round) => round.wins.length === 5), true);
});

it('rejeita mutação cross-origin com HTTP 403', async () =>
  assert.equal(
    (await post('/api/session/reset', {}, { Origin: 'https://foreign.example' })).status,
    403,
  ));

it('WebSocket emite settlement e heartbeat', async () => {
  const ws = new WebSocket(base.replace('http', 'ws') + '/ws', {
    headers: { Cookie: cookie, Origin: base },
  });
  try {
    const opened = once(ws, 'open');
    const messages: unknown[] = [];
    ws.on('message', (data) => messages.push(JSON.parse(data.toString())));
    await opened;

    const received = new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Missing settlement')), 3000);
      ws.on('message', (data) => {
        if (JSON.parse(data.toString()).type === 'round.settled') {
          clearTimeout(timer);
          resolve();
        }
      });
    });

    await post('/api/spins', { requestId: crypto.randomUUID(), bet: 10 });
    await received;

    const pong = once(ws, 'message');
    ws.send(JSON.stringify({ type: 'ping', sentAt: 1234 }));
    const [bytes] = await pong;
    assert.deepEqual(JSON.parse(bytes.toString()), { type: 'pong', sentAt: 1234 });
    assert.ok(messages.length >= 2);
  } finally {
    ws.close();
  }
});

it('reset restaura créditos e limpa histórico', async () => {
  const response = await post('/api/session/reset', {});
  assert.deepEqual(await response.json(), { balance: 1000, history: [], virtual: true });
});
