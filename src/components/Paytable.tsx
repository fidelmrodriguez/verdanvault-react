import { SYMBOLS, SYMBOL_INFO, LINES } from '../game/rules';
const glyphs = ['◇', '▣', '✥', '♧', '☼', '❧'];
export function Paytable() {
  return (
    <>
      <p className="modal-intro">
        Três símbolos iguais em uma linha revelam uma recompensa. O custo da rodada é dividido
        igualmente entre as 5 linhas.
      </p>
      <div className="paytable">
        {SYMBOLS.map((symbol, i) => (
          <div key={symbol}>
            <span className={`symbol-glyph symbol-${symbol}`}>{glyphs[i]}</span>
            <span>
              {SYMBOL_INFO[symbol].name}
              <small>3 símbolos em uma linha</small>
            </span>
            <strong>{SYMBOL_INFO[symbol].multiplier}×</strong>
          </div>
        ))}
      </div>
      <h3>5 caminhos para descobrir</h3>
      <div className="lines">
        {LINES.map((rows, i) => (
          <div key={i}>
            <svg viewBox="0 0 70 50" aria-label={`Linha ${i + 1}`}>
              {Array.from({ length: 9 }, (_, n) => (
                <circle
                  key={n}
                  cx={12 + Math.floor(n / 3) * 23}
                  cy={9 + (n % 3) * 16}
                  r="3"
                  fill="#345449"
                />
              ))}
              <polyline
                points={rows.map((r, c) => `${12 + c * 23},${9 + r * 16}`).join(' ')}
                stroke="#d4ba78"
                strokeWidth="2"
                fill="none"
              />
            </svg>
            <small>{i + 1}</small>
          </div>
        ))}
      </div>
      <p className="note">
        Exemplo: custo de 10 cr → 2 cr por linha. Uma linha de esmeraldas retorna 60 cr. Linhas
        vencedoras se somam. Sem wild, bônus ou dinheiro real.
      </p>
    </>
  );
}
