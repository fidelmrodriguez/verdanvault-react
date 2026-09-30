# Arquitetura

## Visão geral

Verdant Vault separa interface, domínio, renderização e transporte. O `App.tsx` atua como orquestrador dos estados e efeitos de alto nível; a apresentação é dividida em componentes React menores, enquanto regras e animação dos rolos permanecem independentes do React.

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

O conteúdo narrativo e o catálogo de assets do hero ficam em `src/content/hero.ts`, evitando que textos e caminhos de mídia fiquem acoplados ao componente raiz.

## Fluxo da rodada

1. A UI valida se o jogo está pronto e se há créditos suficientes.
2. `useGame` cria uma chave de idempotência e solicita a rodada.
3. `gameService` usa o servidor Node ou o modo standalone.
4. A grade final é conhecida antes de qualquer rolo parar.
5. `SlotEngine.finish()` executa a timeline visual determinística.
6. Cada rolo revela o resultado de baixo para cima: linha inferior, central e superior.
7. Depois do assentamento, Zustand recebe saldo, resultado e histórico.

A movimentação transitória dos símbolos não influencia o resultado.

## Componentização React

- `App.tsx`: orquestra ciclo de vida, loading, narrativa, áudio e ações globais.
- `GameHeader.tsx`: navegação desktop e menu responsivo.
- `LoadingScreen.tsx`: loading e progresso de preload.
- `GameStage.tsx`: gabinete, rolos, controles e estados visuais principais.
- `HeroScene.tsx`: cenário, raposas e narrativa contextual.
- `WinCelebration.tsx`: efeitos progressivos de vitória normal, BIG WIN e grande descoberta.
- `GameSidebar.tsx`: diário, histórico recente e atalhos de ritmo.
- `GameModals.tsx`: regras, histórico, preferências e diagnóstico.
- `GameCanvas.tsx`: integração React ↔ PixiJS.

Componentes de apresentação podem ler o estado global via Zustand quando isso evita prop drilling excessivo; ações de navegação e fluxo permanecem explícitas por props.

## Servidor

O servidor Node usa uma sessão em memória por cookie `HttpOnly` e mantém até 30 rodadas de histórico. Requisições de spin são idempotentes por `requestId` e mutações rejeitam `Origin` incompatível.

### Endpoints

| Método | Rota | Função |
| --- | --- | --- |
| GET | `/api/health` | saúde do processo |
| GET | `/api/session` | cria ou recupera a sessão |
| POST | `/api/spins` | processa uma rodada |
| POST | `/api/session/reset` | reinicia saldo e histórico |
| WS | `/ws` | eventos da sessão e heartbeat |

## Modo standalone

Se `/api/session` não estiver disponível em uma hospedagem estática, o serviço troca automaticamente para o modo standalone. Nesse modo:

- a grade usa `crypto.getRandomValues` com rejeição para evitar viés de módulo;
- saldo e histórico são persistidos em `localStorage` quando disponível;
- os mesmos contratos Zod de sessão e rodada continuam sendo usados;
- PixiJS e os componentes React não precisam saber qual transporte está ativo.

## Renderização e ritmo

O PixiJS mantém quatro sprites por coluna para permitir wrap contínuo. Texturas dos seis símbolos são geradas na inicialização; durante o giro, o motor altera posição, alpha, escala e referência de textura.

O giro normal usa uma timeline única de aproximadamente **6 segundos** em desktop, tablet e mobile:

- cerca de 4 s de viagem antes da primeira parada;
- intervalo de 500 ms entre os rolos;
- antecipação adicional no terceiro rolo;
- revelação sequencial inferior → central → superior;
- bounce, squash, partículas e cue sonoro por aterrissagem;
- celebração progressiva conforme o nível do prêmio.

O Turbo ignora a animação dos rolos e apresenta o grid final imediatamente. O botão `PARAR` usa `SlotEngine.skip()` para encerrar apenas a apresentação visual; a grade já foi determinada e não é sorteada novamente.

## Hero e estados da raposa

O hero usa background e personagens como assets independentes. A raposa possui estados específicos para idle, busca durante o giro, ausência de recompensa, vitória normal, BIG WIN e grande descoberta. A narrativa contextual é selecionada por estado e rodada sem expor detalhes técnicos ao jogador.

Em tablet/mobile, o texto narrativo vira uma notificação temporária na parte inferior do hero para preservar o personagem em destaque.

## Áudio

`game/audio.ts` usa Web Audio API para os efeitos e mantém buses separados para música e FX. A trilha principal é o arquivo local **Humid Discovery**, reproduzido em loop após a primeira interação válida do usuário. O mix mantém efeitos de giro, parada e vitória acima da música, com controles independentes para trilha e efeitos.

## Ciclo de vida

- O ticker PixiJS é suspenso em aba oculta.
- `destroy()` remove listeners, resolve promises pendentes e libera texturas/renderizador.
- O preload cobre background, loading e todos os estados da raposa.
- A timeline dos rolos é a mesma em desktop, tablet e mobile.

## Layout e viewport

O gabinete usa orçamento de altura baseado no viewport e breakpoints por largura/altura. Desktop preserva navegação completa e fullscreen; tablet/mobile usam menu hamburger e mantêm o hero centralizado. O loading possui enquadramento específico para telas menores sem recomprimir os assets.

## Controles de produto

A UI oferece custo por rodada, Turbo, cinco rodadas automáticas canceláveis, música/FX independentes, fullscreen no desktop, histórico, regras e sequência opcional de vitórias determinísticas. Todas as variantes reutilizam o mesmo fluxo de rodada e o mesmo contrato de domínio.
