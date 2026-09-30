# Arquitetura

## Visão geral

Verdant Vault separa interface, domínio, renderização, transporte e conteúdo narrativo. O `App.tsx` funciona como orquestrador de estados e efeitos de alto nível; a apresentação é dividida em componentes React menores, enquanto regras, áudio e animação dos rolos permanecem desacoplados da UI.

```txt
React UI
  ├─ GameHeader / LoadingScreen
  ├─ GameStage
  │   ├─ HeroScene
  │   ├─ GameCanvas (PixiJS)
  │   └─ WinCelebration
  ├─ GameSidebar
  └─ GameModals
        ↓
useGame / Zustand
        ↓
gameService
  ├─ servidor Node: REST + WebSocket
  └─ standalone: Web Crypto + localStorage
        ↓
SlotEngine (PixiJS)
```

O conteúdo narrativo e o catálogo visual do hero ficam em `src/content/hero.ts`, evitando caminhos de assets e textos espalhados pelo componente raiz.

## Fluxo da rodada

1. A UI verifica prontidão, saldo e estado atual.
2. `useGame` cria uma chave de idempotência e solicita a rodada.
3. `gameService` usa o servidor Node ou o modo standalone.
4. A grade final é determinada antes da animação dos rolos.
5. `SlotEngine.finish()` executa a apresentação visual.
6. Os rolos param em cascata e cada coluna revela o resultado de baixo para cima: linha inferior, central e superior.
7. Após o assentamento, Zustand recebe saldo, resultado e histórico.
8. A UI seleciona reação da raposa, narrativa e nível de celebração de acordo com o resultado.

A movimentação transitória dos símbolos nunca altera o resultado sorteado.

## Componentização React

- `App.tsx`: orquestra loading, ciclo de vida, narrativa, áudio e ações globais.
- `GameHeader.tsx`: navegação desktop, status e menu hamburger de tablet/mobile.
- `LoadingScreen.tsx`: tela de carregamento e barra de progresso.
- `GameStage.tsx`: gabinete, rolos, controles e composição principal do jogo.
- `HeroScene.tsx`: cenário, raposa, narrativa desktop e toast responsivo.
- `WinCelebration.tsx`: efeitos progressivos de vitória normal, BIG WIN e grande descoberta.
- `GameSidebar.tsx`: diário, histórico resumido e atalhos de ritmo.
- `GameModals.tsx`: regras, histórico, preferências e diagnóstico.
- `GameCanvas.tsx`: ponte React ↔ PixiJS.
- `src/content/hero.ts`: catálogo de assets e textos por estado narrativo.

Componentes podem ler Zustand diretamente quando isso evita prop drilling excessivo. Ações de navegação e fluxo continuam explícitas por props quando pertencem ao componente pai.

## Servidor

O servidor Node usa sessão em memória por cookie `HttpOnly` e mantém até 30 rodadas de histórico. Requisições de spin são idempotentes por `requestId` e mutações rejeitam `Origin` incompatível.

### Endpoints

| Método | Rota | Função |
| --- | --- | --- |
| GET | `/api/health` | saúde do processo |
| GET | `/api/session` | cria ou recupera a sessão |
| POST | `/api/spins` | processa uma rodada |
| POST | `/api/session/reset` | reinicia saldo e histórico |
| WS | `/ws` | eventos da sessão e heartbeat |

## Modo standalone

Se `/api/session` não estiver disponível em hospedagem estática, o serviço troca automaticamente para o modo standalone. Nesse modo:

- a grade usa `crypto.getRandomValues` com rejeição para evitar viés de módulo;
- saldo e histórico são persistidos em `localStorage` quando disponível;
- os mesmos contratos Zod continuam validando sessão e rodada;
- PixiJS e os componentes React não precisam saber qual transporte está ativo.

Esse é o modo usado no deploy estático do Netlify.

## Renderização e ritmo

O PixiJS mantém quatro sprites por coluna para permitir wrap contínuo. Texturas dos seis símbolos são geradas na inicialização e reutilizadas durante toda a sessão.

O giro normal usa uma timeline única de aproximadamente **6 segundos** em desktop, tablet e mobile:

- cerca de 4 s de viagem antes da primeira parada;
- 500 ms entre o início das paradas dos rolos;
- antecipação adicional no terceiro rolo;
- revelação sequencial inferior → central → superior;
- bounce, squash, partículas e cue sonoro por aterrissagem;
- celebração progressiva conforme o multiplicador da vitória.

O Turbo ignora a animação dos rolos e apresenta o grid final imediatamente. O botão `PARAR` encerra apenas a apresentação visual: a grade já foi determinada e não é recalculada.

## Hero e estados da raposa

O hero usa cenário e personagens como assets independentes. A raposa possui seis estados visuais:

1. idle / padrão;
2. vitória normal;
3. BIG WIN;
4. grande descoberta;
5. busca durante o giro;
6. rodada sem recompensa.

Durante o giro, `fox-searching.png` substitui o estado padrão. Quando uma rodada termina sem payout, `fox-no-reward.png` aparece temporariamente. Vitórias escolhem os estados 2, 3 ou 4 de acordo com o multiplicador.

A narrativa contextual segue os mesmos estados (`idle`, `busy`, `miss`, `win`, `big`, `grand`). No desktop ela ocupa a composição lateral do hero. Em tablet/mobile vira uma notificação temporária na parte inferior do hero para não cobrir o personagem.

## Celebrações de vitória

As celebrações são divididas em três níveis:

- **normal**: chuva de moedas, placa de prêmio e efeitos base;
- **BIG WIN**: mais moedas, ondas de choque, faíscas e flare mais intenso;
- **grand**: ainda mais moedas, anéis luminosos, fragmentos dourados, flash global e placa ampliada.

O nível visual segue o mesmo corte usado pelo áudio e pelos estados da raposa: vitória normal, BIG WIN e grande descoberta.

## Áudio

`src/game/audio.ts` usa Web Audio API para efeitos e mantém buses separados para música e FX. A trilha principal é o arquivo local `public/audio/verdant-theme.mp3`, atualmente **Humid Discovery**, reproduzido em loop após a primeira interação válida do usuário.

A faixa tem introdução atmosférica, groove de andamento médio, percussão orgânica, camadas suaves de synth/pad e motivos melódicos de corda/pluck. O mix mantém giro, parada, aterrissagem e vitória acima da música. Música e FX podem ser desligados separadamente em Preferências.

## Loading e scroll lock

A tela de loading pré-carrega cenário, loading art e todos os estados da raposa. Enquanto `loadingComplete` é falso:

- `html` e `body` recebem `loading-scroll-lock`;
- scroll vertical e horizontal ficam bloqueados;
- overscroll/rubber-band também é bloqueado em dispositivos touch;
- a trava já existe no `index.html`, evitando um frame inicial com scroll antes do React montar.

A classe só é removida depois que a transição de saída do loading termina. Desktop e tablet/mobile usam enquadramentos distintos do mesmo asset de loading; em telas menores o recorte prioriza o lado direito para manter a raposa visível.

## Navegação responsiva

- **Desktop (> 1024 px):** navegação completa no topo, status da expedição e botão de fullscreen.
- **Tablet/mobile (≤ 1024 px):** links do topo e fullscreen desaparecem; as opções ficam acessíveis pelo menu hamburger. O botão de volume permanece disponível.

## Ciclo de vida e performance

- O ticker PixiJS é suspenso em aba oculta.
- `destroy()` remove listeners, resolve promises pendentes e libera texturas/renderizador.
- O preload cobre background, loading e todos os estados da raposa.
- A timeline dos rolos é única entre desktop, tablet e mobile.
- DPR é limitado a 2 e sprites/partículas são reutilizados.
- `?debug=1` habilita diagnóstico de FPS e tempo médio de update em desenvolvimento.

## Controles de produto

A UI oferece custo por rodada, Turbo, cinco rodadas automáticas canceláveis, música e FX independentes, fullscreen apenas no desktop, histórico, regras e sequência opcional de vitórias determinísticas.

A **Sequência de vitórias** não gira automaticamente: quando ativada, cada giro iniciado pelo usuário recebe a próxima combinação vencedora da sequência. Ao chegar à última variação, o índice volta para a primeira e continua em ciclo até a preferência ser desativada.
