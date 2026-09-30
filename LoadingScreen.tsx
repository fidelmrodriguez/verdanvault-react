import { useGameStore } from '../store/game.store';

export function Diagnostics() {
  const s = useGameStore();
  const serverRuntime = s.runtime === 'server';

  return (
    <>
      <p className="modal-intro">
        Dados de execução desta sessão no dispositivo atual. Eles ajudam a conferir fluidez,
        carregamento e comunicação sem interromper o jogo.
      </p>
      <div className="diagnostic-grid">
        {[
          ['Renderização', `${s.fps || '—'} FPS`],
          ['Update do loop', `${s.frameMs.toFixed(2)} ms`],
          ['Carregamento', `${s.loadMs} ms`],
          ['Conexão', serverRuntime ? (s.connected ? `${s.latency} ms` : 'Reconectando') : 'Local'],
          ['Estado do jogo', s.phase],
          ['Resolução', `${Math.min(devicePixelRatio, 2)}× DPR`],
        ].map(([label, value]) => (
          <div key={label}>
            <small>{label}</small>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      <p className="note">
        O valor de update mede a lógica do ticker e não inclui todo o trabalho da GPU. A
        renderização é suspensa quando a aba fica oculta.
      </p>
      {serverRuntime ? (
        <>
          <h3>Eventos da sessão</h3>
          <div className="event-log">
            {s.events.length ? (
              s.events.map((event, index) => (
                <div key={`${event}-${index}`}>
                  <span>WS</span>
                  {event}
                </div>
              ))
            ) : (
              <p>Aguardando eventos…</p>
            )}
          </div>
        </>
      ) : (
        <>
          <h3>Execução local</h3>
          <p className="note">
            Esta publicação está usando o modo standalone: estado e histórico ficam no navegador.
            Ao executar o servidor Node do repositório, REST e WebSocket são usados automaticamente.
          </p>
        </>
      )}
    </>
  );
}
