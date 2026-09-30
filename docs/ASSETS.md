# Assets

## Arte local em uso

Todos os assets visuais de runtime ficam em `public/game-art/`:

- `temple-expedition-background.png`: cenário do hero.
- `fox-explorer-idle.png`: estado padrão da raposa.
- `fox-explorer-win.png`: reação de vitória normal.
- `fox-explorer-big-win.png`: reação de BIG WIN.
- `fox-explorer-grand-win.png`: reação de grande descoberta.
- `fox-searching.png`: estado exibido enquanto os rolos estão girando.
- `fox-no-reward.png`: reação temporária de rodada sem recompensa.
- `loading-screen.webp`: arte da tela de carregamento.

Os personagens são carregados como arquivos independentes; o projeto não recompõe nem mescla essas imagens em runtime.

## Arte gerada em código

- `src/game/symbolArt.ts`: seis relíquias desenhadas em código e convertidas em texturas PixiJS na inicialização.
- `public/favicon.svg`: ícone do projeto.

## Áudio

- `public/audio/verdant-theme.mp3`: trilha local **Humid Discovery**, usada em loop.
- efeitos de UI, giro, rolos, aterrissagem, vitória normal, BIG WIN e bônus são sintetizados em tempo real com Web Audio API por `src/game/audio.ts`.

Música e efeitos usam buses independentes e podem ser ativados/desativados separadamente nas Preferências.

## Fontes

DM Sans e Manrope são empacotadas por `@fontsource`, sem dependência de CDN de fontes.

## Carregamento

`src/content/hero.ts` centraliza os caminhos do background, loading e seis estados da raposa. `PRELOAD_ART` é usado pela aplicação para pré-carregar esses arquivos antes de liberar a experiência principal.

A tela de loading usa o mesmo `loading-screen.webp` em todas as resoluções, com enquadramento CSS diferente em tablet/mobile para priorizar a raposa no lado direito da arte.

## Dependências externas

O runtime não depende de CDN para imagens, áudio ou fontes. Dependências JavaScript são instaladas via npm e empacotadas pelo Vite. Avisos de licença relevantes ficam em `docs/THIRD-PARTY-NOTICES.txt`.
