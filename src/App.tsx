import { useCallback, useEffect, useRef, useState } from 'react';
import { Activity, ArrowRight, Diamond, History, Settings2 } from 'lucide-react';
import { GameHeader } from './components/GameHeader';
import { GameModals, type Panel } from './components/GameModals';
import { GameSidebar } from './components/GameSidebar';
import { GameStage } from './components/GameStage';
import { LoadingScreen } from './components/LoadingScreen';
import { useGameStore } from './store/game.store';
import { useGame } from './hooks/useGame';
import type { SlotEngine } from './game/SlotEngine';
import { audio } from './game/audio';
import { SYMBOL_INFO, WIN_SEQUENCE_LENGTH } from './game/rules';
import {
  HERO_STORIES,
  PRELOAD_ART,
  storySeed,
  type HeroMascotState,
  type HeroStoryState,
} from './content/hero';

const credits = (value: number) => value.toLocaleString('pt-BR');

export default function App() {
  const engine = useRef<SlotEngine | null>(null);
  const [ready, setReady] = useState(false);
  const [preloadedArt, setPreloadedArt] = useState(0);
  const [loadingLeaving, setLoadingLeaving] = useState(false);
  const [loadingComplete, setLoadingComplete] = useState(false);
  const onReady = useCallback(() => setReady(true), []);
  const s = useGameStore();
  const { spin, reset, bootstrap, booted } = useGame(engine);
  const [panel, setPanel] = useState<Panel>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const [celebrationId, setCelebrationId] = useState<string | null>(null);
  const [heroMascot, setHeroMascot] = useState<HeroMascotState>(1);
  const [storyCycle, setStoryCycle] = useState(0);
  const [mobileStoryVisible, setMobileStoryVisible] = useState(true);
  const [autoRemaining, setAutoRemaining] = useState(0);
  const [animatedWin, setAnimatedWin] = useState(0);
  const [sequenceStep, setSequenceStep] = useState(0);
  const sequenceResultId = useRef<string | null>(null);
  const stage = useRef<HTMLElement>(null);
  const busy = ['requesting', 'spinning', 'loading'].includes(s.phase);
  const canSpin = ready && booted && !busy && s.balance >= s.bet;
  const autoActive = autoRemaining > 0;
  const artProgress = PRELOAD_ART.length ? preloadedArt / PRELOAD_ART.length : 1;
  const loadingProgress = Math.min(100, Math.round(artProgress * 80 + (booted ? 10 : 0) + (ready ? 10 : 0)));
  const hasWinResult = s.phase === 'result' && (s.result?.payout ?? 0) > 0;
  const celebrating = hasWinResult && celebrationId === s.result?.id;
  const winMultiplier = (s.result?.payout ?? 0) / Math.max(s.result?.bet ?? 1, 1);
  const celebrationTier =
    winMultiplier >= 20 ? 'grand' : winMultiplier >= 8 ? 'big' : hasWinResult ? 'normal' : 'none';
  const winLabel =
    winMultiplier >= 20
      ? 'GRANDE DESCOBERTA'
      : winMultiplier >= 8
        ? 'TESOURO RARO'
        : 'RELÍQUIA ENCONTRADA';
  const heroWinTier: HeroMascotState =
    winMultiplier >= 20 ? 4 : winMultiplier >= 8 ? 3 : (s.result?.payout ?? 0) > 0 ? 2 : 1;
  const heroStoryState: HeroStoryState =
    heroMascot === 4
      ? 'grand'
      : heroMascot === 3
        ? 'big'
        : heroMascot === 2
          ? 'win'
          : heroMascot === 6
            ? 'miss'
            : heroMascot === 5 || busy
              ? 'busy'
              : 'idle';
  const heroStoryPool = HERO_STORIES[heroStoryState];
  const resultStorySeed = storySeed(s.result?.id, heroStoryPool.length);
  const heroStoryIndex =
    heroStoryState === 'idle' || heroStoryState === 'busy'
      ? storyCycle % heroStoryPool.length
      : resultStorySeed;
  const heroStory = heroStoryPool[heroStoryIndex];
  const showDiagnostics =
    import.meta.env.DEV && new URLSearchParams(window.location.search).has('debug');

  useEffect(() => {
    if (heroStoryState !== 'idle' && heroStoryState !== 'busy') return;
    const interval = window.setInterval(
      () => setStoryCycle((current) => current + 1),
      heroStoryState === 'busy' ? 5600 : 8200,
    );
    return () => window.clearInterval(interval);
  }, [heroStoryState]);

  useEffect(() => {
    setMobileStoryVisible(true);
    const timer = window.setTimeout(() => setMobileStoryVisible(false), 3200);
    return () => window.clearTimeout(timer);
  }, [heroStoryIndex, heroStoryState]);

  useEffect(() => {
    if (s.phase !== 'result' || !s.result?.payout) {
      setCelebrationId(null);
      return;
    }

    setCelebrationId(s.result.id);
    const duration = winMultiplier >= 20 ? 5600 : winMultiplier >= 8 ? 4600 : 3600;
    const timer = window.setTimeout(() => setCelebrationId(null), duration);
    return () => window.clearTimeout(timer);
  }, [s.phase, s.result?.bet, s.result?.id, s.result?.payout, winMultiplier]);

  useEffect(() => {
    if (busy) {
      setHeroMascot(5);
      return;
    }

    if (s.phase !== 'result' || !s.result) {
      setHeroMascot(1);
      return;
    }

    if (!s.result.payout) {
      setHeroMascot(6);
      const restoreMiss = window.setTimeout(() => setHeroMascot(1), 3000);
      return () => window.clearTimeout(restoreMiss);
    }

    const tier = heroWinTier;
    setHeroMascot(tier);
    const restore = window.setTimeout(
      () => setHeroMascot(1),
      tier === 4 ? 5600 : tier === 3 ? 4600 : 3400,
    );
    return () => {
      window.clearTimeout(restore);
    };
  }, [busy, heroWinTier, s.phase, s.result?.id, s.result?.payout]);

  useEffect(() => {
    const payout = s.result?.payout ?? 0;
    if (!payout || s.phase !== 'result') {
      setAnimatedWin(0);
      return;
    }
    const started = performance.now();
    const duration = Math.min(2100, 950 + payout * 7);
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - started) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setAnimatedWin(Math.round(payout * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [s.phase, s.result?.id, s.result?.payout]);

  useEffect(() => {
    let active = true;
    let completed = 0;

    const markLoaded = () => {
      if (!active) return;
      completed += 1;
      setPreloadedArt(Math.min(completed, PRELOAD_ART.length));
    };

    PRELOAD_ART.forEach((src) => {
      const image = new Image();
      let settled = false;
      const settle = () => {
        if (settled) return;
        settled = true;
        markLoaded();
      };
      image.addEventListener('load', settle, { once: true });
      image.addEventListener('error', settle, { once: true });
      image.src = src;
      if (image.complete) settle();
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (loadingProgress < 100) return;

    const leaveTimer = window.setTimeout(() => setLoadingLeaving(true), 240);
    const completeTimer = window.setTimeout(() => setLoadingComplete(true), 760);
    return () => {
      window.clearTimeout(leaveTimer);
      window.clearTimeout(completeTimer);
    };
  }, [loadingProgress]);

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    if (!loadingComplete) {
      root.classList.add('loading-scroll-lock');
      body.classList.add('loading-scroll-lock');
      return () => {
        root.classList.remove('loading-scroll-lock');
        body.classList.remove('loading-scroll-lock');
      };
    }

    root.classList.remove('loading-scroll-lock');
    body.classList.remove('loading-scroll-lock');
  }, [loadingComplete]);

  useEffect(() => {
    audio.setMusicEnabled(!s.musicMuted);
  }, [s.musicMuted]);

  useEffect(() => {
    audio.setFxEnabled(!s.fxMuted);
  }, [s.fxMuted]);

  useEffect(() => {
    try {
      const patch: Partial<typeof s> = {};
      if (localStorage.getItem('verdant-vault-win-sequence') === 'on') {
        patch.winSequence = true;
        patch.winSequenceIndex = 0;
      }
      if (localStorage.getItem('verdant-vault-music') === 'off') patch.musicMuted = true;
      if (localStorage.getItem('verdant-vault-fx') === 'off') patch.fxMuted = true;
      s.set(patch);
    } catch {
      // Storage can be unavailable in private browsing; the session preference still works.
    }
  }, []);

  useEffect(() => {
    const unlock = () => {
      if (!s.musicMuted || !s.fxMuted) void audio.unlock();
    };
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, [s.fxMuted, s.musicMuted]);

  useEffect(() => {
    const onUiPress = (event: PointerEvent) => {
      if (s.fxMuted) return;
      const target = event.target instanceof Element ? event.target.closest('button, a, select') : null;
      if (!target) return;
      void audio.unlock().then(() => audio.play('ui'));
    };
    document.addEventListener('pointerdown', onUiPress);
    return () => document.removeEventListener('pointerdown', onUiPress);
  }, [s.fxMuted]);

  useEffect(() => {
    const closeDesktopMenu = () => {
      if (window.innerWidth > 1024) setMobileMenuOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('resize', closeDesktopMenu);
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      window.removeEventListener('resize', closeDesktopMenu);
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, []);

  useEffect(() => {
    if (!autoRemaining || s.phase !== 'result' || panel || s.balance < s.bet) return;
    const timer = window.setTimeout(() => {
      setAutoRemaining((count) => Math.max(0, count - 1));
      if (ready && booted && s.balance >= s.bet) void spin();
    }, s.turbo ? 260 : 820);
    return () => window.clearTimeout(timer);
  }, [autoRemaining, booted, panel, ready, s.balance, s.bet, s.phase, s.turbo, spin]);

  useEffect(() => {
    if (!s.winSequence) {
      setSequenceStep(0);
      sequenceResultId.current = null;
      return;
    }
    if (s.phase !== 'result' || !s.result?.id || sequenceResultId.current === s.result.id) return;
    sequenceResultId.current = s.result.id;
    setSequenceStep((current) => (current % WIN_SEQUENCE_LENGTH) + 1);
  }, [s.phase, s.result?.id, s.winSequence]);

  useEffect(() => {
    if (s.phase === 'error' || s.balance < s.bet) setAutoRemaining(0);
  }, [s.balance, s.bet, s.phase]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (
        event.code === 'Space' &&
        !panel &&
        !(
          event.target instanceof HTMLElement &&
          ['BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'].includes(event.target.tagName)
        )
      ) {
        event.preventDefault();
        if (canSpin) {
          if (autoActive) setAutoRemaining(0);
          void spin();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [autoActive, canSpin, panel, spin]);

  const persistAudioPreference = (key: 'music' | 'fx', enabled: boolean) => {
    try {
      localStorage.setItem(`verdant-vault-${key}`, enabled ? 'on' : 'off');
    } catch {
      // Preferences still work for the current session when storage is unavailable.
    }
  };

  const toggleMusic = () => {
    const musicMuted = !s.musicMuted;
    s.set({ musicMuted });
    persistAudioPreference('music', !musicMuted);
  };

  const toggleFx = () => {
    const fxMuted = !s.fxMuted;
    s.set({ fxMuted });
    persistAudioPreference('fx', !fxMuted);
  };

  const toggleAllAudio = () => {
    const muteEverything = !(s.musicMuted && s.fxMuted);
    s.set({ musicMuted: muteEverything, fxMuted: muteEverything });
    persistAudioPreference('music', !muteEverything);
    persistAudioPreference('fx', !muteEverything);
  };

  const toggleWinSequence = () => {
    const next = !s.winSequence;
    setAutoRemaining(0);
    if (next) {
      setSequenceStep(0);
      sequenceResultId.current = null;
      s.set({ winSequence: true, winSequenceIndex: 0, turbo: false });
    } else {
      s.set({ winSequence: false, winSequenceIndex: 0 });
    }
    try {
      localStorage.setItem('verdant-vault-win-sequence', next ? 'on' : 'off');
    } catch {
      // The preference remains active for the current session even without storage.
    }
  };

  const startAuto = () => {
    if (autoActive) {
      setAutoRemaining(0);
      return;
    }
    if (!canSpin) return;
    setAutoRemaining(4);
    void spin();
  };

  const manualSpin = () => {
    if (autoActive) setAutoRemaining(0);
    void spin();
  };

  const spinControl = () => {
    if (s.phase === 'spinning') {
      engine.current?.skip();
      return;
    }
    manualSpin();
  };

  const fullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await stage.current?.requestFullscreen();
    } catch {
      setNotice('Tela cheia indisponível neste navegador.');
    }
  };

  const title =
    s.phase === 'requesting'
      ? 'O mecanismo está ganhando velocidade…'
      : s.phase === 'spinning'
        ? 'Os rolos estão encontrando o caminho…'
        : s.result?.payout
          ? `Relíquia encontrada: +${credits(s.result.payout)} créditos`
          : s.result
            ? 'O templo se reorganizou. Tente outro caminho.'
            : 'O templo guarda a próxima descoberta.';

  return (
    <div className="app-shell">
      {!loadingComplete && <LoadingScreen progress={loadingProgress} leaving={loadingLeaving} />}
      <GameHeader
        mobileMenuOpen={mobileMenuOpen}
        onToggleMobileMenu={() => setMobileMenuOpen((open) => !open)}
        onCloseMobileMenu={() => setMobileMenuOpen(false)}
        onOpenRules={() => setPanel('rules')}
        onOpenSettings={() => setPanel('settings')}
      />

      <main>
        <div className="game-layout" id="game">
          <GameStage
            engine={engine}
            stage={stage}
            onReady={onReady}
            busy={busy}
            canSpin={canSpin}
            autoActive={autoActive}
            autoRemaining={autoRemaining}
            celebrating={celebrating}
            celebrationTier={celebrationTier}
            heroMascot={heroMascot}
            heroStory={heroStory}
            heroStoryState={heroStoryState}
            heroStoryIndex={heroStoryIndex}
            mobileStoryVisible={mobileStoryVisible}
            sequenceStep={sequenceStep}
            hasWinResult={hasWinResult}
            title={title}
            animatedWin={animatedWin}
            winLabel={winLabel}
            onToggleAllAudio={toggleAllAudio}
            onFullscreen={fullscreen}
            onSpinControl={spinControl}
            onStartAuto={startAuto}
            onOpenHistory={() => setPanel('history')}
            onOpenRules={() => setPanel('rules')}
          />

          <GameSidebar
            busy={busy}
            canSpin={canSpin}
            autoActive={autoActive}
            autoRemaining={autoRemaining}
            onOpenRules={() => setPanel('rules')}
            onOpenHistory={() => setPanel('history')}
            onToggleMusic={toggleMusic}
            onToggleFx={toggleFx}
            onStartAuto={startAuto}
          />
        </div>

        {(s.error || notice) && (
          <div className="error-bar" role="alert">
            {s.error || notice}
            {!booted && <button onClick={() => void bootstrap()}>Reconectar</button>}
            {booted && s.error && (
              <button disabled={busy} onClick={() => void reset()}>
                Reiniciar sessão
              </button>
            )}
            {notice && <button onClick={() => setNotice('')}>Fechar</button>}
          </div>
        )}

        {s.balance < s.bet && !busy && (
          <div className="error-bar">
            Créditos insuficientes para esta rodada.
            <button onClick={() => void reset()}>Repor créditos</button>
          </div>
        )}

        <div className="below-game">
          <div>
            <span className="connection-dot" data-online={s.connected} />
            <span>{s.connected ? 'Caminho aberto' : 'Restabelecendo caminho'}</span>
          </div>
          <div>
            <button onClick={() => setPanel('history')}>
              <History size={15} /> Histórico
            </button>
            <button onClick={() => setPanel('settings')}>
              <Settings2 size={15} /> Preferências
            </button>
            {showDiagnostics && (
              <button onClick={() => setPanel('status')}>
                <Activity size={15} /> Diagnóstico
              </button>
            )}
          </div>
        </div>

        <section className="feature-strip">
          <div className="feature-icon">
            <Diamond size={23} />
          </div>
          <div>
            <span className="eyebrow">THE LOST TEMPLE</span>
            <h3>Cada giro revela uma nova combinação.</h3>
            <p>Cinco linhas, seis relíquias e um templo que nunca entrega o mesmo caminho.</p>
          </div>
          <button onClick={() => setPanel('rules')}>
            Ver relíquias <ArrowRight size={17} />
          </button>
        </section>
      </main>

      <footer>
        <span>
          VERDANT VAULT <b>© 2026</b>
        </span>
        <p>Créditos virtuais · sem valor monetário.</p>
        <span>
          THE LOST TEMPLE <Diamond size={12} />
        </span>
      </footer>

      {panel && (
        <GameModals
          panel={panel}
          busy={busy}
          canSpin={canSpin}
          autoActive={autoActive}
          autoRemaining={autoRemaining}
          onClose={() => setPanel(null)}
          onToggleMusic={toggleMusic}
          onToggleFx={toggleFx}
          onToggleWinSequence={toggleWinSequence}
          onStartAuto={startAuto}
          onReset={reset}
        />
      )}

      <div className="sr-only" aria-live="polite">
        {s.phase === 'result' && s.result
          ? `Resultado: ${s.result.grid
              .flat()
              .map((id) => SYMBOL_INFO[id].name)
              .join(', ')}. Retorno ${s.result.payout} créditos. Saldo ${s.balance}.`
          : ''}
      </div>
    </div>
  );
}
