/** Pure game domain, shared by the API and UI. All credits are integers. */
export const SYMBOLS = ['emerald', 'idol', 'compass', 'scarab', 'sun', 'leaf'] as const;
export type SymbolId = (typeof SYMBOLS)[number];
export type Grid = SymbolId[][]; // column-major: grid[column][row]
export const SYMBOL_INFO: Record<SymbolId, { name: string; multiplier: number; color: number }> = {
  emerald: { name: 'Esmeralda', multiplier: 30, color: 0x63ecc2 },
  idol: { name: 'Ídolo dourado', multiplier: 20, color: 0xf5c56c },
  compass: { name: 'Bússola', multiplier: 15, color: 0xe9bb78 },
  scarab: { name: 'Escaravelho', multiplier: 10, color: 0x69c5e6 },
  sun: { name: 'Sol ancestral', multiplier: 8, color: 0xed9471 },
  leaf: { name: 'Folha sagrada', multiplier: 5, color: 0x98c970 },
};
export const LINES = [
  [0, 0, 0],
  [1, 1, 1],
  [2, 2, 2],
  [0, 1, 2],
  [2, 1, 0],
];
export const BETS = [5, 10, 25, 50, 100];
export const INITIAL_CREDITS = 1000;
export const INITIAL_GRID: Grid = [
  ['compass', 'emerald', 'leaf'],
  ['idol', 'emerald', 'sun'],
  ['scarab', 'emerald', 'compass'],
];

/**
 * Sequência explícita de combinações vencedoras usada pela preferência
 * "Sequência de vitórias". Ela percorre símbolos, diagonais, múltiplas linhas
 * e os níveis de celebração sem alterar o sorteio normal quando desativada.
 */
export const WIN_SEQUENCE_GRIDS: readonly Grid[] = [
  [
    ['leaf', 'idol', 'compass'],
    ['leaf', 'sun', 'scarab'],
    ['leaf', 'compass', 'idol'],
  ],
  [
    ['idol', 'sun', 'compass'],
    ['scarab', 'sun', 'leaf'],
    ['emerald', 'sun', 'idol'],
  ],
  [
    ['idol', 'compass', 'scarab'],
    ['leaf', 'sun', 'scarab'],
    ['emerald', 'idol', 'scarab'],
  ],
  [
    ['compass', 'idol', 'leaf'],
    ['scarab', 'compass', 'sun'],
    ['emerald', 'idol', 'compass'],
  ],
  [
    ['leaf', 'sun', 'idol'],
    ['scarab', 'idol', 'compass'],
    ['idol', 'emerald', 'leaf'],
  ],
  [
    ['idol', 'emerald', 'leaf'],
    ['scarab', 'emerald', 'sun'],
    ['compass', 'emerald', 'idol'],
  ],
  [
    ['emerald', 'idol', 'emerald'],
    ['emerald', 'sun', 'emerald'],
    ['emerald', 'compass', 'emerald'],
  ],
  [
    ['idol', 'leaf', 'idol'],
    ['idol', 'idol', 'idol'],
    ['idol', 'sun', 'idol'],
  ],
  Array.from({ length: 3 }, () => ['idol', 'idol', 'idol']) as Grid,
  Array.from({ length: 3 }, () => ['emerald', 'emerald', 'emerald']) as Grid,
];

export const WIN_SEQUENCE_LENGTH = WIN_SEQUENCE_GRIDS.length;

export function generateWinSequenceGrid(index: number): Grid {
  const source = WIN_SEQUENCE_GRIDS[((index % WIN_SEQUENCE_LENGTH) + WIN_SEQUENCE_LENGTH) % WIN_SEQUENCE_LENGTH];
  return source.map((column) => [...column]) as Grid;
}
export function evaluate(grid: Grid, bet: number) {
  const wins = LINES.flatMap((rows, index) => {
    const symbol = grid[0][rows[0]];
    return rows.every((row, col) => grid[col][row] === symbol)
      ? [{ line: index, symbol, amount: (bet / 5) * SYMBOL_INFO[symbol].multiplier }]
      : [];
  });
  return { wins, payout: wins.reduce((total, win) => total + win.amount, 0) };
}
export function generateGrid(nextInt: (max: number) => number): Grid {
  return Array.from({ length: 3 }, () =>
    Array.from({ length: 3 }, () => SYMBOLS[nextInt(SYMBOLS.length)]),
  );
}
