# Assets


## Arte local em uso

- `public/game-art/temple-expedition-background.png`: cenário do hero.
- `public/game-art/fox-explorer-idle.png`: estado padrão da raposa.
- `public/game-art/fox-explorer-win.png`: reação de vitória normal.
- `public/game-art/fox-explorer-big-win.png`: reação de grande vitória.
- `public/game-art/fox-explorer-grand-win.png`: reação de vitória máxima.
- `public/game-art/loading-screen.webp`: tela de carregamento.

## Arte visual

- `src/game/symbolArt.ts`: seis relíquias vetoriais desenhadas em código com PixiJS.
- `public/favicon.svg`: ícone do projeto.

A ilustração principal e a trilha são carregadas localmente; o jogo não depende de CDN para imagens, fontes ou áudio.

## Áudio

`public/audio/verdant-theme.mp3` é uma trilha original criada para o projeto, em loop. Os efeitos de giro, rolo, interface e vitória continuam sintetizados em tempo real com Web Audio API.

## Fontes

DM Sans e Manrope são empacotadas pelo `@fontsource`, mantendo o carregamento independente de serviços externos.