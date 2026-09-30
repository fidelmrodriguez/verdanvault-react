# Verdant Vault — The Lost Temple

Jogo web 2D de exploração construído com React, TypeScript e PixiJS. A experiência combina uma interface responsiva, rolos animados em WebGL, créditos virtuais, histórico de rodadas e uma camada opcional de servidor com REST e WebSocket.

## Netlify

https://verdanvault-react.netlify.app/

## Recursos

- Slot 3×3 com cinco linhas e seis relíquias.
- Composição vertical em três atos: cena animada, rolos e controles/informações — o mesmo ritmo visual de um jogo de slot completo.
- Hero responsivo com cenário, raposa reativa e narrativa contextual; em tablet/mobile o texto vira uma notificação temporária na parte inferior para manter o personagem em destaque.
- Animação dos rolos com aceleração, giro prolongado, parada sequencial, antecipação e bounce de assentamento; durante o giro, o botão principal vira `PARAR` para concluir a apresentação imediatamente sem recalcular o resultado.
- Celebrações progressivas: vitória normal usa chuva de moedas; BIG WIN adiciona ondas de choque e faíscas; a grande descoberta intensifica o efeito com mais moedas, anéis luminosos, fragmentos dourados e flash global.
- Trilha local **Humid Discovery** em loop, com introdução atmosférica, groove de andamento médio, percussão orgânica, camadas suaves de synth/pad e motivos melódicos de corda/pluck; efeitos do jogo continuam sintetizados com Web Audio.
- Interface em React com controles por mouse, toque e teclado (`Espaço`).
- Custos de rodada ajustáveis, modo turbo, 5 rodadas automáticas, música e efeitos controláveis separadamente, fullscreen no desktop e histórico das últimas 30 rodadas.
- **Sequência de vitórias (opcional):** em Preferências, cada giro iniciado pelo usuário recebe a próxima combinação vencedora determinística — símbolos, diagonais, múltiplas linhas e grandes descobertas. Após a última variação, a sequência volta à primeira; ao desativar, os próximos giros retornam ao sorteio normal.

- **Mascote reativa:** a raposa muda para busca durante o giro, reação sem recompensa quando a rodada não paga e estados progressivos para vitória normal, BIG WIN e grande descoberta.
- **Celebrações por nível:** vitória normal usa chuva de moedas; BIG WIN adiciona ondas de choque e faíscas; a grande descoberta intensifica o espetáculo com mais moedas, anéis luminosos e fragmentos dourados.
- Renderização com PixiJS 8 e texturas geradas uma vez a partir de arte vetorial em código.
- Estado compartilhado com Zustand e validação de contratos com Zod.
- Servidor Node opcional com sessão em memória, idempotência, REST e WebSocket.
- Modo standalone automático para hospedagem estática; o jogo continua funcional sem backend.
- Layout responsivo com gabinete completo acima da dobra em 1536×776, comportamento dedicado em tela cheia e a mesma coreografia de rolos em desktop, tablet e mobile.
- Loading responsivo com enquadramento dedicado em telas menores e scroll vertical/horizontal bloqueado até a transição terminar.
- Modais travam completamente o scroll da página por trás e mantêm apenas o conteúdo interno do próprio modal rolável.
- Em tablet/mobile, a top bar permanece fixa no topo durante a navegação; no desktop ela mantém o comportamento normal da composição.
- Testes de regras, API e fluxos de navegador.

## Stack

- React 19
- TypeScript
- PixiJS 8
- Zustand
- Zod
- Node.js
- WebSocket (`ws`)
- Vite
- Playwright
- Node Test Runner

## Arquitetura

```txt
src/
 ├── components/   header, loading, hero, gabinete, celebrações, sidebar, modais e canvas
 ├── content/      narrativa e catálogo visual do hero
 ├── game/         regras, motor PixiJS, arte dos símbolos e áudio
 ├── hooks/        ciclo da rodada e conexão em tempo real
 ├── schemas/      contratos validados em runtime
 ├── services/     transporte REST e fallback standalone
 ├── store/        estado compartilhado da interface
 ├── styles/       tema, responsividade e animações
 ├── types/        tipos derivados dos contratos
 └── utils/        utilitários de requisição
server/
 ├── index.ts      HTTP, arquivos estáticos e WebSocket
 └── session.ts    estado autoritativo e idempotência
```

O resultado da rodada é calculado antes da apresentação visual. Quando o servidor Node está disponível, ele mantém o saldo e decide a grade; o cliente apenas anima o resultado recebido. Em uma publicação estática, a mesma interface de serviço muda para o modo standalone e usa Web Crypto e `localStorage`, sem alterar os componentes da UI.

## Requisitos

- Node.js 22 ou superior
- npm
- Navegador moderno com WebGL

## Como executar

```bash
npm ci
npm run dev
```

Abra `http://localhost:5173`.

O comando inicia o frontend Vite, a API REST e o WebSocket na mesma origem.

## Scripts

```bash
npm run dev          # desenvolvimento: frontend + REST + WebSocket
npm run build        # typecheck + build de produção
npm start            # serve dist/ com o servidor Node
npm run typecheck    # TypeScript strict
npm test             # testes de domínio e API
npm run test:e2e     # testes Playwright
npm run check        # typecheck + testes + build
npm run format       # formata o código e a documentação
npm run format:check # verifica formatação
```

## Deploy e runtime

O repositório inclui `netlify.toml`. No Netlify, basta importar o repositório com as configurações padrão; o build usa `npm run build` e publica `dist/`.

Como o deploy estático não mantém um processo Node ou uma conexão WebSocket própria, o frontend detecta a ausência da API e entra automaticamente no modo standalone. Nesse modo, saldo e histórico permanecem no navegador. Ao rodar `npm run dev` ou `npm start`, a aplicação usa REST e WebSocket automaticamente.

## Regras

O custo total da rodada é dividido igualmente entre as cinco linhas. Uma linha paga quando os três símbolos são iguais. O retorno de cada linha é o custo da linha multiplicado pelo valor da relíquia.

| Relíquia | Multiplicador |
| --- | ---: |
| Esmeralda | 30× |
| Ídolo dourado | 20× |
| Bússola | 15× |
| Escaravelho | 10× |
| Sol ancestral | 8× |
| Folha sagrada | 5× |

Os créditos são virtuais e não têm valor monetário.

## Decisões técnicas

### Renderização e UI

React cuida da interface, histórico, preferências e diálogos. PixiJS mantém o loop gráfico dos rolos, evitando re-renderizações React a cada frame. Os símbolos são desenhados em código e transformados em texturas compartilhadas durante a inicialização.

### Ritmo da rodada

O giro normal usa uma única timeline de aproximadamente **6 segundos** em desktop, tablet e mobile. Os rolos mantêm a mesma sensação de peso em todas as telas: fase de viagem, parada em cascata e revelação de cada rolo da linha inferior para a central e depois para a superior, com bounce, partículas e cue sonoro por aterrissagem. O Turbo continua apresentando o grid final imediatamente, sem animação dos rolos. Depois da parada, símbolos premiados pulsam e a cena superior entra em celebração com flare, contador de prêmio e partículas.

### Áudio e sensação de jogo

A trilha principal é **Humid Discovery**, carregada localmente e reproduzida em loop. A faixa começa com uma introdução atmosférica e abre gradualmente para um groove de andamento médio, sustentado por percussão orgânica e contida, camadas macias de synth/pad e motivos melódicos de corda/pluck. O resultado combina exploração tropical, mistério e movimento sem assumir estética chiptune ou música de cassino agressiva. Música e efeitos têm controles independentes; os efeitos de giro, parada e vitória permanecem em um bus mais alto que a trilha, com compressão no master para preservar impacto e clareza. Por política dos navegadores, o áudio começa após a primeira interação do usuário e permanece em loop até ser desligado nas preferências.

### Enquadramento de tela

O gabinete usa um orçamento vertical explícito. Em 1536×776, a barra superior e todo o loop jogável — cena animada, rolos, saldo/aposta/prêmio, giro, turbo, auto e navegação inferior — cabem na primeira tela. Em fullscreen, o próprio gabinete se torna o viewport e recalcula as zonas sem criar uma página longa. O conteúdo editorial e histórico detalhado ficam abaixo do jogo.

### Estado e consistência

No servidor, cada requisição de rodada recebe uma chave de idempotência. Repetir a mesma requisição retorna a rodada já processada, evitando desconto duplicado em retries. Zod valida tanto entradas quanto respostas antes de elas chegarem ao estado da UI.

### Performance

O motor limita DPR a 2, reutiliza sprites e partículas, suspende o ticker em abas ocultas e evita criar texturas dentro do loop. FPS e tempo médio do update são registrados no estado do jogo para profiling. Em desenvolvimento, `?debug=1` habilita o painel de diagnóstico sem expor métricas técnicas na experiência normal.

## Build e validação

```bash
npm run check
```

Para validar o fluxo de navegador:

```bash
npx playwright install chromium
npm run test:e2e
```

Mais detalhes estão em `docs/ARQUITETURA.md`, `docs/ASSETS.md` e `docs/VALIDACAO.md`.
