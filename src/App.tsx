import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Activity,
  ArrowRight,
  BookOpen,
  Compass,
  Diamond,
  History,
  Leaf,
  Menu,
  Maximize2,
  Minus,
  Music2,
  Plus,
  Repeat2,
  RotateCcw,
  Settings2,
  ShieldCheck,
  Square,
  Sparkles,
  Volume2,
  VolumeX,
  X,
  Zap,
} from 'lucide-react';
import { GameCanvas } from './components/GameCanvas';
import { Modal } from './components/Modal';
import { Paytable } from './components/Paytable';
import { Diagnostics } from './components/Diagnostics';
import { useGameStore } from './store/game.store';
import { useGame } from './hooks/useGame';
import type { SlotEngine } from './game/SlotEngine';
import { audio } from './game/audio';
import { BETS, SYMBOL_INFO, WIN_SEQUENCE_LENGTH } from './game/rules';

const credits = (value: number) => value.toLocaleString('pt-BR');
type Panel = 'rules' | 'history' | 'settings' | 'status' | null;

const HERO_BACKGROUND = '/game-art/temple-expedition-background.png';
const LOADING_ART = '/game-art/loading-screen.webp';
const HERO_MASCOTS = {
  1: '/game-art/fox-explorer-idle.png',
  2: '/game-art/fox-explorer-win.png',
  3: '/game-art/fox-explorer-big-win.png',
  4: '/game-art/fox-explorer-grand-win.png',
  5: '/game-art/fox-searching.png',
  6: '/game-art/fox-no-reward.png',
} as const;
const PRELOAD_ART = [LOADING_ART, HERO_BACKGROUND, ...Object.values(HERO_MASCOTS)] as const;

type HeroMascotState = 1 | 2 | 3 | 4 | 5 | 6;
type HeroStoryState = 'idle' | 'busy' | 'miss' | 'win' | 'big' | 'grand';
type HeroStory = { kicker: string; headline: string; body: string };

const HERO_STORIES: Record<HeroStoryState, readonly HeroStory[]> = {
  idle: [
    {
      kicker: 'A EXPEDIÇÃO CONTINUA',
      headline: 'A próxima descoberta ainda dorme entre as ruínas.',
      body: 'Cada giro abre um novo caminho pelo templo. Observe os símbolos e siga os sinais deixados pelos antigos guardiões.',
    },
    {
      kicker: 'ECOS DO TEMPLO',
      headline: 'Há alguma coisa brilhando além das pedras.',
      body: 'As câmaras mais antigas ainda não foram exploradas. Uma combinação pode revelar uma passagem esquecida.',
    },
    {
      kicker: 'MAPA INCOMPLETO',
      headline: 'Nem todos os caminhos aparecem à primeira vista.',
      body: 'A selva esconde atalhos, câmaras e relíquias. Continue a expedição e deixe os rolos indicarem a próxima rota.',
    },
    {
      kicker: 'SANTUÁRIO VERDE',
      headline: 'O templo muda toda vez que você retorna.',
      body: 'Pedras antigas, símbolos vivos e uma energia difícil de explicar. Há sempre mais uma história esperando para ser encontrada.',
    },
    {
      kicker: 'SINAIS NAS RUÍNAS',
      headline: 'Os símbolos parecem formar um padrão.',
      body: 'Talvez seja coincidência. Talvez seja um convite. Continue girando e descubra até onde essa trilha leva.',
    },
    {
      kicker: 'ENTRE CIPÓS E PEDRA',
      headline: 'A selva guardou este lugar por tempo demais.',
      body: 'Agora cada giro remove um pouco do silêncio. Relíquias, inscrições e passagens começam a reaparecer.',
    },
    {
      kicker: 'CÂMARA EXTERNA',
      headline: 'A entrada foi encontrada. O verdadeiro mistério começa agora.',
      body: 'As primeiras relíquias são apenas pistas. Quanto mais fundo você avança, mais raro se torna o que o templo pode revelar.',
    },
    {
      kicker: 'LUZ ENTRE AS FOLHAS',
      headline: 'Alguma coisa desperta no coração das ruínas.',
      body: 'A energia esmeralda percorre as paredes e ilumina símbolos esquecidos. O próximo giro pode aproximar você da origem dessa luz.',
    },
    {
      kicker: 'DIÁRIO DE CAMPO',
      headline: 'Nenhuma expedição é igual à anterior.',
      body: 'Os rolos reorganizam as pistas a cada tentativa. O templo recompensa quem continua procurando.',
    },
    {
      kicker: 'ANTES DO PRÓXIMO GIRO',
      headline: 'Escute a selva. Depois, siga os símbolos.',
      body: 'O caminho pode parecer silencioso agora, mas as ruínas nunca ficam quietas por muito tempo.',
    },
  ],
  busy: [
    {
      kicker: 'O TEMPLO DESPERTA',
      headline: 'As engrenagens antigas voltaram a se mover.',
      body: 'Os símbolos atravessam as câmaras enquanto a expedição procura uma nova combinação.',
    },
    {
      kicker: 'ROTA EM MOVIMENTO',
      headline: 'As paredes parecem mudar de lugar diante dos seus olhos.',
      body: 'Mantenha a atenção nos rolos. O templo está escolhendo qual caminho revelar desta vez.',
    },
    {
      kicker: 'SÍMBOLOS EM CURSO',
      headline: 'A próxima pista está se formando agora.',
      body: 'Relíquias passam rápido pelas janelas do templo. Quando tudo parar, um novo fragmento da história poderá surgir.',
    },
    {
      kicker: 'PULSO ESMERALDA',
      headline: 'A energia cresce à medida que os rolos avançam.',
      body: 'Cada parada aproxima a expedição de uma resposta. Espere o último símbolo encontrar seu lugar.',
    },
    {
      kicker: 'MECANISMO ANCESTRAL',
      headline: 'Algo antigo está alinhando as relíquias.',
      body: 'O templo não entrega seus segredos de uma só vez. Primeiro ele gira, depois observa, então decide o que mostrar.',
    },
    {
      kicker: 'PASSAGEM INSTÁVEL',
      headline: 'As ruínas estão reorganizando o caminho.',
      body: 'As colunas se movem, os símbolos descem e a expedição espera o momento exato em que tudo finalmente se encaixa.',
    },
  ],
  miss: [
    {
      kicker: 'CAMINHO FECHADO',
      headline: 'Desta vez, as ruínas permaneceram em silêncio.',
      body: 'Nem toda passagem se abre de imediato. A raposa registra o caminho e se prepara para uma nova tentativa.',
    },
    {
      kicker: 'NENHUMA RELÍQUIA',
      headline: 'Os símbolos não revelaram um tesouro desta vez.',
      body: 'O templo continua mudando. Um novo giro pode reorganizar as pistas e abrir outra rota pela expedição.',
    },
    {
      kicker: 'PISTA PERDIDA',
      headline: 'A trilha terminou antes da câmara secreta.',
      body: 'A busca não acabou. Há outros sinais nas paredes e novas combinações esperando para surgir.',
    },
    {
      kicker: 'SILÊNCIO NAS RUÍNAS',
      headline: 'Nenhum prêmio apareceu nesta passagem.',
      body: 'A expedição segue adiante. Às vezes, a próxima descoberta está escondida logo depois de um caminho vazio.',
    },
  ],
  win: [
    {
      kicker: 'RELÍQUIA ENCONTRADA',
      headline: 'As ruínas entregaram um novo tesouro.',
      body: 'Os símbolos se alinharam e uma peça esquecida voltou à luz. Ainda existem muitas câmaras para explorar.',
    },
    {
      kicker: 'DESCOBERTA CONFIRMADA',
      headline: 'Um fragmento do passado acaba de reaparecer.',
      body: 'A relíquia carrega marcas de uma civilização que desapareceu sem deixar respostas. Talvez o próximo giro revele mais.',
    },
    {
      kicker: 'SINAL FAVORÁVEL',
      headline: 'O templo respondeu à expedição.',
      body: 'Uma combinação abriu espaço entre as pedras e trouxe uma nova descoberta. O caminho adiante parece mais promissor.',
    },
    {
      kicker: 'ACHADO DE CAMPO',
      headline: 'Mais uma relíquia foi retirada das sombras.',
      body: 'Pequenas descobertas constroem grandes histórias. Continue avançando e reúna novas pistas sobre o templo perdido.',
    },
    {
      kicker: 'PORTA ENTREABERTA',
      headline: 'A vitória revelou mais do que créditos.',
      body: 'Por um instante, inscrições antigas ficaram visíveis nas paredes. A expedição pode estar chegando perto de algo maior.',
    },
    {
      kicker: 'TRILHA CORRETA',
      headline: 'Os símbolos apontaram na mesma direção.',
      body: 'Uma nova peça da jornada foi encontrada. O templo ainda guarda segredos suficientes para muitas outras expedições.',
    },
  ],
  big: [
    {
      kicker: 'TESOURO RARO',
      headline: 'Uma descoberta digna das lendas.',
      body: 'A energia do templo se intensifica. Relíquias desse nível quase nunca chegam à superfície intactas.',
    },
    {
      kicker: 'CÂMARA RARA',
      headline: 'As ruínas abriram uma passagem que poucos encontrariam.',
      body: 'O brilho dourado atravessa a selva e revela um tesouro preservado por gerações. A expedição acaba de mudar de escala.',
    },
    {
      kicker: 'ARQUIVO PERDIDO',
      headline: 'Esta descoberta não aparece nos mapas.',
      body: 'Os símbolos revelaram uma peça rara, cercada de inscrições e energia esmeralda. Há sinais de algo ainda maior adiante.',
    },
    {
      kicker: 'RITUAL DESPERTO',
      headline: 'O templo reconheceu a combinação.',
      body: 'A luz percorre as colunas como se a estrutura inteira tivesse voltado à vida por alguns instantes.',
    },
    {
      kicker: 'TESOURO DO SANTUÁRIO',
      headline: 'Uma relíquia rara emergiu das câmaras internas.',
      body: 'A expedição encontrou algo que parecia existir apenas nas histórias contadas ao redor das fogueiras.',
    },
    {
      kicker: 'MARCO DA EXPEDIÇÃO',
      headline: 'Este achado vai para a primeira página do diário.',
      body: 'Poucas combinações despertam uma resposta tão forte das ruínas. O templo claramente ainda não mostrou tudo.',
    },
  ],
  grand: [
    {
      kicker: 'RELÍQUIA LENDÁRIA',
      headline: 'O coração do templo foi revelado.',
      body: 'Uma força ancestral desperta entre as pedras. A expedição acaba de alcançar uma descoberta extraordinária.',
    },
    {
      kicker: 'SEGREDO ANCESTRAL',
      headline: 'A lenda era verdadeira.',
      body: 'No centro das ruínas, uma relíquia impossível de ignorar rompeu séculos de silêncio. Este é o tipo de descoberta que muda uma expedição para sempre.',
    },
    {
      kicker: 'CÂMARA DO CORAÇÃO',
      headline: 'As portas mais antigas finalmente se abriram.',
      body: 'A energia esmeralda tomou o salão inteiro. Tudo indica que esta peça esteve protegida desde os primeiros dias do templo.',
    },
    {
      kicker: 'DESCOBERTA HISTÓRICA',
      headline: 'Você encontrou o tipo de tesouro que vira lenda.',
      body: 'As inscrições brilham, a selva parece parar e o templo reconhece a conquista. Poucos caminhos chegam tão longe.',
    },
    {
      kicker: 'O TEMPLO RESPONDE',
      headline: 'Toda a ruína vibra com a mesma energia.',
      body: 'A combinação perfeita revelou uma relíquia de valor incomum. Ainda assim, há sinais de que o santuário possui camadas mais profundas.',
    },
    {
      kicker: 'CAPÍTULO LENDÁRIO',
      headline: 'Esta é uma história que merece ser contada novamente.',
      body: 'Entre pedra, selva e luz esmeralda, a expedição encontrou uma recompensa reservada aos caminhos mais raros.',
    },
  ],
};

function storySeed(value: string | undefined, length: number) {
  if (!value || length <= 1) return 0;
  let hash = 0;
  for (const char of value) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return hash % length;
}

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
      {!loadingComplete && (
        <div className={`loading-screen ${loadingLeaving ? 'is-leaving' : ''}`} aria-label="Carregando Verdant Vault">
          <img className="loading-screen-art" src={LOADING_ART} alt="" />
          <div className="loading-screen-shade" />
          <div className="loading-screen-content">
            <span className="loading-kicker">THE LOST TEMPLE</span>
            <strong>VERDANT VAULT</strong>
            <div
              className="loading-progress"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={loadingProgress}
            >
              <i style={{ width: `${loadingProgress}%` }} />
            </div>
            <small>{loadingProgress}% · preparando a expedição</small>
          </div>
        </div>
      )}
      <header className="topbar">
        <a className="brand" href="#" aria-label="Verdant Vault, início">
          <div className="brand-icon">
            <Leaf size={24} />
          </div>
          <span>
            VERDANT<span className="brand-light"> VAULT</span>
            <small>THE LOST TEMPLE</small>
          </span>
        </a>
        <nav className="desktop-nav" aria-label="Navegação principal">
          <a className="nav-active" href="#game">
            O jogo
          </a>
          <button onClick={() => setPanel('rules')}>Como jogar</button>
          <button onClick={() => setPanel('settings')}>Preferências</button>
        </nav>
        <div className="header-status">
          <span className="status-dot" />
          EXPEDIÇÃO ATIVA<span className="status-badge">TEMPLO 01</span>
        </div>
        <button
          className="mobile-menu-toggle"
          type="button"
          aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-navigation"
          onClick={() => setMobileMenuOpen((open) => !open)}
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <nav
          id="mobile-navigation"
          className={`mobile-navigation ${mobileMenuOpen ? 'is-open' : ''}`}
          aria-label="Navegação móvel"
        >
          <a href="#game" onClick={() => setMobileMenuOpen(false)}>
            O jogo
          </a>
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              setPanel('rules');
            }}
          >
            Como jogar
          </button>
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              setPanel('settings');
            }}
          >
            Preferências
          </button>
        </nav>
      </header>

      <main>
        <div className="game-layout" id="game">
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
                    s.musicMuted && s.fxMuted
                      ? 'Ativar música e efeitos'
                      : 'Desativar música e efeitos'
                  }
                  onClick={toggleAllAudio}
                >
                  {s.musicMuted && s.fxMuted ? <VolumeX size={17} /> : <Volume2 size={17} />}
                </button>
                <button
                  className="glass-btn desktop-fullscreen-btn"
                  aria-label="Alternar tela cheia"
                  onClick={fullscreen}
                >
                  <Maximize2 size={17} />
                </button>
              </div>
            </div>

            <div className={`hero-scene hero-state-${heroMascot} ${busy ? 'is-busy' : ''} ${celebrating ? 'is-celebrating' : ''}`} aria-hidden="true">
              <img className="hero-background-image" src={HERO_BACKGROUND} alt="" fetchPriority="high" />
              <div className="hero-vignette" />
              <div className="hero-panel">
                <div className="hero-brand-copy">
                  <div className="hero-brand-rule" />
                  <span>THE LOST TEMPLE</span>
                  <h2>
                    VERDANT
                    <br />
                    <em>VAULT</em>
                  </h2>
                  <div className="hero-brand-sub">
                    <i />
                    UM NOVO CAMINHO A CADA GIRO
                    <i />
                  </div>
                </div>
                <div className={`hero-mascot-shell mascot-${heroMascot}`}>
                  <div className="hero-mascot-glow" />
                  <img
                    key={`${s.result?.id ?? 'idle'}-${heroMascot}`}
                    className="hero-mascot"
                    src={HERO_MASCOTS[heroMascot]}
                    alt=""
                    fetchPriority="high"
                  />
                </div>
                <div className="hero-story" key={`desktop-${heroStoryState}-${heroStoryIndex}`}>
                  <span className="story-kicker">{heroStory.kicker}</span>
                  <strong>{heroStory.headline}</strong>
                  <small>{heroStory.body}</small>
                </div>
                <div
                  className={`hero-mobile-toast ${mobileStoryVisible ? 'is-visible' : ''}`}
                  key={`mobile-${heroStoryState}-${heroStoryIndex}`}
                >
                  <span>{heroStory.kicker}</span>
                  <strong>{heroStory.headline}</strong>
                </div>
              </div>
              {celebrating && (
                <div className="hero-win-burst">
                  <span className="burst-ring" />
                  <span className="burst-ray ray-1" />
                  <span className="burst-ray ray-2" />
                  <span className="burst-ray ray-3" />
                </div>
              )}
            </div>

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
                  className={[
                    'reel-frame',
                    busy ? 'is-spinning' : '',
                    celebrating ? 'has-win' : '',
                  ]
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

                <div
                  className={`result-banner ${hasWinResult ? 'is-win' : ''}`}
                  role="status"
                  aria-live="polite"
                >
                  {hasWinResult ? <Sparkles size={16} /> : <Diamond size={13} />}
                  <span>{title}</span>
                </div>
              </div>

              {celebrating && (
                <div className={`win-celebration celebration-${celebrationTier}`} aria-live="polite">
                  <div className="coin-rain" aria-hidden="true">
                    {Array.from({ length: celebrationTier === 'grand' ? 34 : celebrationTier === 'big' ? 24 : 16 }, (_, index) => (
                      <i key={index} className={`coin coin-${(index % 16) + 1} coin-extra-${index + 1}`} />
                    ))}
                  </div>
                  {(celebrationTier === 'big' || celebrationTier === 'grand') && (
                    <div className="big-win-effects" aria-hidden="true">
                      <i className="shockwave shockwave-1" />
                      <i className="shockwave shockwave-2" />
                      {Array.from({ length: celebrationTier === 'grand' ? 22 : 12 }, (_, index) => (
                        <i key={index} className={`spark spark-${(index % 12) + 1}`} />
                      ))}
                    </div>
                  )}
                  {celebrationTier === 'grand' && (
                    <div className="grand-win-effects" aria-hidden="true">
                      <i className="grand-flash" />
                      {Array.from({ length: 18 }, (_, index) => (
                        <i key={index} className={`relic-shard shard-${(index % 9) + 1}`} />
                      ))}
                      <i className="grand-ring grand-ring-1" />
                      <i className="grand-ring grand-ring-2" />
                      <i className="grand-ring grand-ring-3" />
                    </div>
                  )}
                  <div className="win-plaque">
                    <span>{winLabel}</span>
                    <strong>+{credits(animatedWin)}</strong>
                    <small>CRÉDITOS</small>
                  </div>
                </div>
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
                  onClick={spinControl}
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
                    <small>{s.phase === 'spinning' ? 'PULAR ANIMAÇÃO' : busy ? 'Aguarde os rolos' : 'EXPLORAR RELÍQUIAS'}</small>
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
                  onClick={startAuto}
                >
                  <Repeat2 size={19} />
                  <small>{autoActive ? `AUTO ${autoRemaining + 1}` : 'AUTO'}</small>
                </button>
              </div>

              <div className="stage-bottom">
                <button onClick={() => setPanel('history')}><History size={14} /> Histórico</button>
                <button onClick={() => setPanel('rules')}><BookOpen size={14} /> Regras</button>
                <span className="sound-state">
                  <Music2 size={13} />
                  Música {s.musicMuted ? 'Off' : 'On'} · FX {s.fxMuted ? 'Off' : 'On'}
                </span>
                <span className="space-hint">ESPAÇO · GIRAR</span>
                <span><ShieldCheck size={13} /> CRÉDITOS VIRTUAIS</span>
              </div>
            </div>
          </section>

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
              <button className="text-link" onClick={() => setPanel('rules')}>
                Conhecer as relíquias <ArrowRight size={16} />
              </button>
            </section>

            <section className="session-card">
              <div className="section-label">
                <span>
                  <History size={15} /> ÚLTIMAS DESCOBERTAS
                </span>
                <button aria-label="Ver histórico" onClick={() => setPanel('history')}>
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
              <button className="quick-setting" onClick={toggleMusic}>
                <span><Music2 size={17} /> Música</span>
                <b>{s.musicMuted ? 'Off' : 'On'}</b>
              </button>
              <button className="quick-setting" onClick={toggleFx}>
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
              <button className="quick-setting" disabled={!canSpin && !autoActive} onClick={startAuto}>
                <span><Repeat2 size={17} /> Rodadas automáticas</span>
                <b>{autoActive ? `${autoRemaining + 1} restantes` : '5 rodadas'}</b>
              </button>
              <p>Desative o resultado instantâneo para acompanhar a parada completa dos três rolos.</p>
            </section>
          </aside>
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
        <Modal
          title={
            {
              rules: 'As relíquias do templo',
              history: 'Diário de expedição',
              settings: 'Preferências',
              status: 'Status da expedição',
            }[panel]
          }
          onClose={() => setPanel(null)}
        >
          {panel === 'rules' && <Paytable />}
          {panel === 'status' && <Diagnostics />}
          {panel === 'history' && (
            <>
              <p className="modal-intro">
                Até 30 rodadas recentes ficam registradas nesta sessão.
              </p>
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
                Ajuste trilha, efeitos e ritmo. A preferência de movimento reduzido do sistema é respeitada
                automaticamente.
              </p>
              <button className="setting" onClick={toggleMusic}>
                <span>
                  <Music2 size={19} /> Música
                </span>
                <b>{s.musicMuted ? 'Desativada' : 'Ativada'}</b>
              </button>
              <button className="setting" onClick={toggleFx}>
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
                onClick={toggleWinSequence}
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
              <button className="setting" disabled={s.winSequence || (!canSpin && !autoActive)} onClick={startAuto}>
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
                    void reset();
                    setPanel(null);
                  }}
                >
                  <RotateCcw size={16} /> Reiniciar sessão
                </button>
              </div>
            </>
          )}
        </Modal>
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
