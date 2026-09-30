import { ArrowRight, Compass, Diamond, History, Music2, Repeat2, Settings2, Volume2, VolumeX, Zap } from 'lucide-react';
import { useGameStore } from '../store/game.store';

type GameSidebarProps = {
  busy: boolean;
  canSpin: boolean;
  autoActive: boolean;
  autoRemaining: number;
  onOpenRules: () => void;
  onOpenHistory: () => void;
  onToggleMusic: () => void;
  onToggleFx: () => void;
  onStartAuto: () => void;
};

export function GameSidebar({
  busy,
  canSpin,
  autoActive,
  autoRemaining,
  onOpenRules,
  onOpenHistory,
  onToggleMusic,
  onToggleFx,
  onStartAuto,
}: GameSidebarProps) {
  const s = useGameStore();

  return (
    <aside className="sidebar game-info-grid">
      <section className="expedition-card">
        <div className="eyebrow">
          <span className="tiny-diamond" /> DIÁRIO DE EXPEDIÇÃO
        </div>
        <h2>Explore. Gire. Descubra.</h2>
        <p>Combine 3 relíquias em uma das 5 linhas e descubra o que o templo reservou.</p>
        <div className="stat-row">
          <div>
            <strong>03</strong>
            <small>ROLOS</small>
          </div>
          <div>
            <strong>05</strong>
            <small>LINHAS</small>
          </div>
          <div>
            <strong>06</strong>
            <small>RELÍQUIAS</small>
          </div>
        </div>
        <button className="text-link" onClick={onOpenRules}>
          Conhecer as relíquias <ArrowRight size={16} />
        </button>
      </section>

      <section className="session-card">
        <div className="section-label">
          <span>
            <History size={15} /> ÚLTIMAS DESCOBERTAS
          </span>
          <button aria-label="Ver histórico" onClick={onOpenHistory}>
            <ArrowRight size={16} />
          </button>
        </div>
        {s.history.length ? (
          <div className="recent-list">
            {s.history.slice(0, 3).map((round) => (
              <div key={round.id}>
                <span className={`recent-icon ${round.payout ? 'positive' : ''}`}>
                  {round.payout ? <Diamond size={17} /> : <Compass size={17} />}
                </span>
                <div>
                  <b>{round.payout ? 'Relíquia descoberta' : 'Caminho explorado'}</b>
                  <small>
                    {new Date(round.createdAt).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </small>
                </div>
                <strong className={round.payout ? 'positive' : ''}>
                  {round.payout ? `+${round.payout}` : '—'}
                  <small> cr</small>
                </strong>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-history">
            <Compass size={30} />
            <p>Seu diário começa aqui.</p>
            <small>Gire para registrar a primeira descoberta.</small>
          </div>
        )}
        <div className="session-total">
          <span>Rodadas nesta sessão</span>
          <strong>
            {s.history.length}
            {s.history.length === 30 ? '+' : ''}
          </strong>
        </div>
      </section>

      <section className="controls-card">
        <div className="section-label">
          <span>
            <Settings2 size={15} /> RITMO DE JOGO
          </span>
        </div>
        <button className="quick-setting" onClick={onToggleMusic}>
          <span><Music2 size={17} /> Música</span>
          <b>{s.musicMuted ? 'Off' : 'On'}</b>
        </button>
        <button className="quick-setting" onClick={onToggleFx}>
          <span>{s.fxMuted ? <VolumeX size={17} /> : <Volume2 size={17} />} Efeitos do jogo</span>
          <b>{s.fxMuted ? 'Off' : 'On'}</b>
        </button>
        <button
          className="quick-setting"
          disabled={busy}
          onClick={() => s.set({ turbo: !s.turbo })}
        >
          <span>
            <Zap size={17} /> Resultado instantâneo
          </span>
          <b>{s.turbo ? 'On' : 'Off'}</b>
        </button>
        <button className="quick-setting" disabled={!canSpin && !autoActive} onClick={onStartAuto}>
          <span><Repeat2 size={17} /> Rodadas automáticas</span>
          <b>{autoActive ? `${autoRemaining + 1} restantes` : '5 rodadas'}</b>
        </button>
        <p>Desative o resultado instantâneo para acompanhar a parada completa dos três rolos.</p>
      </section>
    </aside>
  );
}
