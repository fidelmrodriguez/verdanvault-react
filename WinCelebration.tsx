import { Compass, Music2, Repeat2, RotateCcw, Sparkles, Volume2, VolumeX, Zap } from 'lucide-react';
import { Diagnostics } from './Diagnostics';
import { Modal } from './Modal';
import { Paytable } from './Paytable';
import { useGameStore } from '../store/game.store';

export type Panel = 'rules' | 'history' | 'settings' | 'status' | null;

type GameModalsProps = {
  panel: Exclude<Panel, null>;
  busy: boolean;
  canSpin: boolean;
  autoActive: boolean;
  autoRemaining: number;
  onClose: () => void;
  onToggleMusic: () => void;
  onToggleFx: () => void;
  onToggleWinSequence: () => void;
  onStartAuto: () => void;
  onReset: () => Promise<void>;
};

export function GameModals({
  panel,
  busy,
  canSpin,
  autoActive,
  autoRemaining,
  onClose,
  onToggleMusic,
  onToggleFx,
  onToggleWinSequence,
  onStartAuto,
  onReset,
}: GameModalsProps) {
  const s = useGameStore();
  const title = {
    rules: 'As relíquias do templo',
    history: 'Diário de expedição',
    settings: 'Preferências',
    status: 'Status da expedição',
  }[panel];

  return (
    <Modal title={title} onClose={onClose}>
      {panel === 'rules' && <Paytable />}
      {panel === 'status' && <Diagnostics />}
      {panel === 'history' && (
        <>
          <p className="modal-intro">Até 30 rodadas recentes ficam registradas nesta sessão.</p>
          {s.history.length ? (
            <div className="history-table">
              <table>
                <thead>
                  <tr>
                    <th>Horário</th>
                    <th>Custo</th>
                    <th>Retorno</th>
                    <th>Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {s.history.map((round) => (
                    <tr key={round.id}>
                      <td>{new Date(round.createdAt).toLocaleTimeString('pt-BR')}</td>
                      <td>{round.bet}</td>
                      <td className={round.payout ? 'positive' : ''}>{round.payout}</td>
                      <td>{round.balance}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-history">
              <Compass size={38} />
              <p>Nenhuma rodada ainda. O templo está esperando.</p>
            </div>
          )}
        </>
      )}
      {panel === 'settings' && (
        <>
          <p className="modal-intro">
            Ajuste trilha, efeitos e ritmo da expedição.
          </p>
          <button className="setting" onClick={onToggleMusic}>
            <span>
              <Music2 size={19} /> Música
            </span>
            <b>{s.musicMuted ? 'Desativada' : 'Ativada'}</b>
          </button>
          <button className="setting" onClick={onToggleFx}>
            <span>
              {s.fxMuted ? <VolumeX size={19} /> : <Volume2 size={19} />} Efeitos do jogo
            </span>
            <b>{s.fxMuted ? 'Desativados' : 'Ativados'}</b>
          </button>
          <p className="preference-note">
            Música e efeitos são independentes. Os efeitos de giro, parada e vitória têm prioridade no mix
            e ficam acima da trilha sem deixar a música desaparecer.
          </p>
          <button
            className={`setting win-sequence-setting ${s.winSequence ? 'active' : ''}`}
            onClick={onToggleWinSequence}
            aria-pressed={s.winSequence}
          >
            <span>
              <Sparkles size={19} /> Sequência de vitórias
            </span>
            <b>{s.winSequence ? 'Ativada · vitórias em sequência' : 'Desativada'}</b>
          </button>
          <p className="preference-note">
            Ao ativar, seus próximos giros continuam sendo iniciados por você, mas cada um recebe a próxima
            variação vencedora da sequência. Depois da última, a ordem volta para a variação 1 e continua assim
            até você desativar. O painel permanece aberto e não há giro automático nesse modo.
          </p>
          <button
            className="setting"
            disabled={busy}
            onClick={() => s.set({ turbo: !s.turbo })}
          >
            <span>
              <Zap size={19} /> Resultado instantâneo
            </span>
            <b>{s.turbo ? 'Ativado' : 'Desativado'}</b>
          </button>
          <button className="setting" disabled={s.winSequence || (!canSpin && !autoActive)} onClick={onStartAuto}>
            <span><Repeat2 size={19} /> 5 rodadas automáticas</span>
            <b>{autoActive ? `${autoRemaining + 1} restantes` : 'Pronto'}</b>
          </button>
          <div className="reset-box">
            <h3>Recomeçar expedição</h3>
            <p>Volte a 1.000 créditos e limpe o histórico desta sessão.</p>
            <button
              className="secondary-btn"
              disabled={busy}
              onClick={() => {
                void onReset();
                onClose();
              }}
            >
              <RotateCcw size={16} /> Reiniciar sessão
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}
