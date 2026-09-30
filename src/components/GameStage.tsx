import type { RefObject } from 'react';
import {
  BookOpen,
  Diamond,
  History,
  Maximize2,
  Minus,
  Music2,
  Plus,
  Repeat2,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Square,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import type { SlotEngine } from '../game/SlotEngine';
import { BETS, WIN_SEQUENCE_LENGTH } from '../game/rules';
import { useGameStore } from '../store/game.store';
import type { HeroMascotState, HeroStory, HeroStoryState } from '../content/hero';
import { GameCanvas } from './GameCanvas';
import { HeroScene } from './HeroScene';
import { WinCelebration, type CelebrationTier } from './WinCelebration';

const credits = (value: number) => value.toLocaleString('pt-BR');

type GameStageProps = {
  engine: RefObject<SlotEngine | null>;
  stage: RefObject<HTMLElement | null>;
  onReady: () => void;
  busy: boolean;
  canSpin: boolean;
  autoActive: boolean;
  autoRemaining: number;
  celebrating: boolean;
  celebrationTier: CelebrationTier | 'none';
  heroMascot: HeroMascotState;
  heroStory: HeroStory;
  heroStoryState: HeroStoryState;
  heroStoryIndex: number;
  mobileStoryVisible: boolean;
  sequenceStep: number;
  hasWinResult: boolean;
  title: string;
  animatedWin: number;
  winLabel: string;
  onToggleAllAudio: () => void;
  onFullscreen: () => Promise<void>;
  onSpinControl: () => void;
  onStartAuto: () => void;
  onOpenHistory: () => void;
  onOpenRules: () => void;
};

export function GameStage({
  engine,
  stage,
  onReady,
  busy,
  canSpin,
  autoActive,
  autoRemaining,
  celebrating,
  celebrationTier,
  heroMascot,
  heroStory,
  heroStoryState,
  heroStoryIndex,
  mobileStoryVisible,
  sequenceStep,
  hasWinResult,
  title,
  animatedWin,
  winLabel,
  onToggleAllAudio,
  onFullscreen,
  onSpinControl,
  onStartAuto,
  onOpenHistory,
  onOpenRules,
}: GameStageProps) {
  const s = useGameStore();

  return (
    <section
      className={`game-stage ${busy ? 'is-busy' : ''} ${celebrating ? `is-celebrating celebration-${celebrationTier}` : ''} ${autoActive ? 'is-auto' : ''}`}
      ref={stage}
      aria-label="Jogo Verdant Vault"
    >
      <div className="stage-top">
        <span className="edition">
          <span />
          VERDANT VAULT · THE LOST TEMPLE
        </span>
        <div className="stage-tools">
          <button
            className="glass-btn"
            aria-label={
              s.musicMuted && s.fxMuted ? 'Ativar música e efeitos' : 'Desativar música e efeitos'
            }
            onClick={onToggleAllAudio}
          >
            {s.musicMuted && s.fxMuted ? <VolumeX size={17} /> : <Volume2 size={17} />}
          </button>
          <button
            className="glass-btn desktop-fullscreen-btn"
            aria-label="Alternar tela cheia"
            onClick={() => void onFullscreen()}
          >
            <Maximize2 size={17} />
          </button>
        </div>
      </div>

      <HeroScene
        mascot={heroMascot}
        busy={busy}
        celebrating={celebrating}
        resultId={s.result?.id}
        story={heroStory}
        storyState={heroStoryState}
        storyIndex={heroStoryIndex}
        mobileStoryVisible={mobileStoryVisible}
      />

      <div className="machine-body">
        <div className="reel-section">
          <div className="reel-cap">
            <span>✦</span>
            <span>
              {s.winSequence
                ? `VITÓRIAS GARANTIDAS · VARIAÇÃO ${sequenceStep || 1}/${WIN_SEQUENCE_LENGTH}`
                : busy
                  ? 'OS ROLOS ESTÃO EM MOVIMENTO'
                  : autoActive
                    ? `AUTO · ${autoRemaining + 1} RODADAS`
                    : 'O TESOURO ESTÁ NOS DETALHES'}
            </span>
            <span>✦</span>
          </div>
          <div
            className={['reel-frame', busy ? 'is-spinning' : '', celebrating ? 'has-win' : '']
              .filter(Boolean)
              .join(' ')}
          >
            <div className="corner tl" />
            <div className="corner tr" />
            <div className="corner bl" />
            <div className="corner br" />
            <span className="line-marker left">1</span>
            <GameCanvas engine={engine} onReady={onReady} />
            <span className="line-marker right">1</span>
            <div className="reel-sheen" aria-hidden="true" />
            {celebrating && <div className="reel-win-glow" aria-hidden="true" />}
          </div>

          <div className={`result-banner ${hasWinResult ? 'is-win' : ''}`} role="status" aria-live="polite">
            {hasWinResult ? <Sparkles size={16} /> : <Diamond size={13} />}
            <span>{title}</span>
          </div>
        </div>

        {celebrating && celebrationTier !== 'none' && (
          <WinCelebration tier={celebrationTier} label={winLabel} animatedWin={animatedWin} />
        )}

        <div className="control-deck">
          <div className="balance-block">
            <span>SEUS CRÉDITOS</span>
            <strong>
              {credits(s.balance)}
              <small> cr</small>
            </strong>
            <small className="credit-note">Créditos de jogo</small>
          </div>
          <div className="bet-block">
            <span>CUSTO POR RODADA</span>
            <div className="stepper">
              <button
                aria-label="Diminuir custo"
                disabled={busy || s.phase === 'error' || s.bet === BETS[0]}
                onClick={() => s.set({ bet: BETS[BETS.indexOf(s.bet) - 1] })}
              >
                <Minus size={15} />
              </button>
              <strong>
                {s.bet}
                <small> cr</small>
              </strong>
              <button
                aria-label="Aumentar custo"
                disabled={busy || s.phase === 'error' || s.bet === BETS.at(-1)}
                onClick={() => s.set({ bet: BETS[BETS.indexOf(s.bet) + 1] })}
              >
                <Plus size={15} />
              </button>
            </div>
          </div>
          <div className={`win-block ${hasWinResult ? 'positive' : ''}`}>
            <span>ÚLTIMA DESCOBERTA</span>
            <strong>
              {credits(s.result?.payout ?? 0)}
              <small> cr</small>
            </strong>
          </div>
          <button
            className={`spin-btn ${busy ? 'spinning' : ''}`}
            aria-label={
              s.phase === 'spinning'
                ? 'Parar rolos'
                : busy
                  ? 'Girando'
                  : s.phase === 'error'
                    ? 'Tentar novamente'
                    : 'Girar · explorar relíquias'
            }
            disabled={s.phase === 'spinning' ? false : !canSpin}
            onClick={onSpinControl}
          >
            {s.phase === 'spinning' ? <Square size={20} /> : <RotateCcw size={23} />}
            <span>
              {s.phase === 'spinning'
                ? 'PARAR'
                : busy
                  ? 'GIRANDO'
                  : s.phase === 'error'
                    ? 'TENTAR NOVAMENTE'
                    : 'GIRAR'}
              <small>
                {s.phase === 'spinning'
                  ? 'PULAR ANIMAÇÃO'
                  : busy
                    ? 'Aguarde os rolos'
                    : 'EXPLORAR RELÍQUIAS'}
              </small>
            </span>
          </button>
          <button
            className={`turbo-btn ${s.turbo ? 'active' : ''}`}
            aria-label="Modo rápido"
            aria-pressed={s.turbo}
            disabled={busy}
            onClick={() => s.set({ turbo: !s.turbo })}
          >
            <Zap size={20} />
            <small>TURBO</small>
          </button>
          <button
            className={`auto-btn ${autoActive ? 'active' : ''}`}
            aria-label={autoActive ? 'Parar rodadas automáticas' : 'Iniciar 5 rodadas automáticas'}
            aria-pressed={autoActive}
            disabled={s.winSequence || (!canSpin && !autoActive)}
            onClick={onStartAuto}
          >
            <Repeat2 size={19} />
            <small>{autoActive ? `AUTO ${autoRemaining + 1}` : 'AUTO'}</small>
          </button>
        </div>

        <div className="stage-bottom">
          <button onClick={onOpenHistory}><History size={14} /> Histórico</button>
          <button onClick={onOpenRules}><BookOpen size={14} /> Regras</button>
          <span className="sound-state">
            <Music2 size={13} />
            Música {s.musicMuted ? 'Off' : 'On'} · FX {s.fxMuted ? 'Off' : 'On'}
          </span>
          <span className="space-hint">ESPAÇO · GIRAR</span>
          <span><ShieldCheck size={13} /> CRÉDITOS VIRTUAIS</span>
        </div>
      </div>
    </section>
  );
}
