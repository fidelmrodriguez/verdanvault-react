import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { evaluate, generateGrid, generateWinSequenceGrid, WIN_SEQUENCE_LENGTH, SYMBOLS, INITIAL_GRID, type Grid } from '../src/game/rules';
import { GameSession } from '../server/session';
import { spinRequestSchema, roundSchema } from '../src/schemas/game.schema';

describe('Regras e pagamentos', () => {
  it('paga o multiplicador sobre o custo da linha', () =>
    assert.deepEqual(evaluate(INITIAL_GRID, 10), {
      payout: 60,
      wins: [{ line: 1, symbol: 'emerald', amount: 60 }],
    }));

  it('soma as cinco linhas sem multiplicar indevidamente o custo total', () => {
    const result = evaluate(
      Array.from({ length: 3 }, () => ['emerald', 'emerald', 'emerald']) as Grid,
      25,
    );
    assert.equal(result.payout, 750);
    assert.equal(result.wins.length, 5);
  });

  it('não premia símbolos diferentes', () => {
    const grid: Grid = [
      ['emerald', 'idol', 'compass'],
      ['scarab', 'sun', 'leaf'],
      ['idol', 'compass', 'emerald'],
    ];
    assert.equal(evaluate(grid, 10).payout, 0);
  });

  it('gera matriz 3×3 a partir de aleatoriedade injetada', () => {
    let index = 0;
    assert.deepEqual(
      generateGrid((max) => index++ % max),
      [[...SYMBOLS.slice(0, 3)], [...SYMBOLS.slice(3, 6)], [...SYMBOLS.slice(0, 3)]],
    );
  });

  it('sequência de vitórias percorre apenas resultados vencedores e inclui múltiplas linhas', () => {
    const results = Array.from({ length: WIN_SEQUENCE_LENGTH }, (_, index) =>
      evaluate(generateWinSequenceGrid(index), 10),
    );
    assert.equal(results.every((result) => result.payout > 0), true);
    assert.equal(results.some((result) => result.wins.length === 1), true);
    assert.equal(results.some((result) => result.wins.length > 1), true);
    assert.equal(results.some((result) => result.wins.length === 5), true);
  });
});

describe('Créditos no servidor', () => {
  it('desconta o custo e credita o retorno bruto', () => {
    const session = new GameSession();
    const round = session.spin('one', 10);
    assert.equal(round.balance, 1000 - 10 + round.payout);
    assert.equal(roundSchema.safeParse(round).success, true);
  });

  it('retry retorna a mesma rodada sem novo desconto', () => {
    const session = new GameSession();
    const first = session.spin('duplicate', 10);
    const balance = session.balance;
    assert.equal(session.spin('duplicate', 10), first);
    assert.equal(session.balance, balance);
    assert.equal(session.history.length, 1);
  });

  it('rejeita a mesma chave com outro payload', () => {
    const session = new GameSession();
    session.spin('same', 10);
    assert.throws(() => session.spin('same', 25), /idempotência/);
  });

  it('saldo insuficiente não altera a carteira', () => {
    const session = new GameSession();
    session.balance = 0;
    assert.throws(() => session.spin('next', 5), /insuficientes/);
    assert.equal(session.balance, 0);
  });

  it('rejeita custo não permitido', () =>
    assert.throws(() => new GameSession().spin('bad', 7), /inválido/));

  it('modo de sequência usa a variação pedida e permite reiniciar no índice zero', () => {
    const session = new GameSession();
    const first = session.spin('sequence-0', 10, true, 0);
    const rounds = [
      first,
      ...Array.from({ length: WIN_SEQUENCE_LENGTH - 1 }, (_, index) =>
        session.spin(`sequence-${index + 1}`, 10, true, index + 1),
      ),
    ];
    assert.equal(rounds.every((round) => round.payout > 0), true);
    assert.equal(rounds.some((round) => round.wins.length === 5), true);

    const restarted = session.spin('sequence-restarted', 10, true, 0);
    assert.deepEqual(restarted.grid, first.grid);
  });

  it('limita histórico e reinicia a sessão', () => {
    const session = new GameSession();
    for (let index = 0; index < 35; index++) session.spin(String(index), 5);
    assert.equal(session.history.length, 30);
    session.reset();
    assert.deepEqual(session.snapshot(), { balance: 1000, history: [], virtual: true });
    assert.equal(session.count, 0);
  });
});

describe('Contratos externos', () => {
  it('rejeita custo negativo, fracionário ou fora da faixa', () => {
    for (const bet of [-10, 0, 7, 5.5, 1000])
      assert.equal(
        spinRequestSchema.safeParse({ requestId: crypto.randomUUID(), bet }).success,
        false,
      );
  });

  it('rejeita grade com símbolos desconhecidos', () => {
    const round = new GameSession().spin('x', 10);
    assert.equal(roundSchema.safeParse({ ...round, grid: [['wild']] }).success, false);
  });
});
