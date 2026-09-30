# Arquitetura

## Visão geral

Verdant Vault separa interface, domínio, renderização e transporte para que a lógica de jogo não dependa do React nem do PixiJS.

```txt
UI React
  ↓
useGame / Zustand
  ↓
gameService
  ├─ servidor Node: REST + WebSocket
  └─ standalone: Web Crypto + localStorage
  ↓
SlotEngine (PixiJS)
```

## Fluxo da rodada

1. A UI valida se o jogo está pronto e se há créditos suficientes.
2. `useGame` cria uma chave de idempotência e inicia a animação.
3. `gameService` solicita a rodada ao servidor ou calcula no modo standalone.
4. A grade final fica conhecida antes de qualquer rolo parar.
5. `SlotEngine.finish()` agenda as três paradas, com tempos diferentes por modo.
6. Depois do assentamento, o store recebe saldo, resultado e histórico.

A movimentação transitória dos símbolos não influencia o resultado.

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

Se a build de produção estiver em uma hospedagem estática e `/api/session` não existir, o serviço troca automaticamente para o modo standalone. A interface não precisa saber qual transporte está ativo.

Nesse modo:

- a grade usa `crypto.getRandomValues` com rejeição para evitar viés de módulo;
- saldo e histórico são persistidos em `localStorage` quando disponível;
- o mesmo contrato Zod de sessão e rodada continua sendo usado;
- o motor PixiJS e os componentes React permanecem idênticos.

## Renderização

O PixiJS mantém quatro sprites por coluna para permitir wrap contínuo. As texturas dos seis símbolos são geradas apenas na inicialização. Durante o giro, apenas posição, alpha, escala e referência de textura são alterados.

A apresentação é dividida em três zonas: cena cinematográfica no topo, rolos no centro e controles/estado na base. A cena superior é composta por camadas CSS do mesmo asset (ambiente, recorte do personagem e foco de cabeça/corpo), somadas a aura da relíquia, névoa, brilho de cachoeira, folhas e partículas. Isso permite respostas visuais independentes aos estados `idle`, `spinning` e `win` sem carregar vídeo pesado.

A parada normal usa:

- cerca de 3 s de giro antes do primeiro rolo comprometer o resultado;
- intervalo de 620 ms entre paradas;
- atraso adicional de antecipação no terceiro rolo quando há retorno;
- bounce amortecido no assentamento;
- burst curto de partículas em cada parada de rolo;
- desaceleração/pulso de antecipação no último rolo vencedor;
- pulso contínuo apenas nos símbolos vencedores;
- partículas PixiJS sobre os rolos e uma celebração CSS temporária sobre o gabinete e a cena.

## Ciclo de vida

- O ticker é suspenso em aba oculta.
- `destroy()` remove listeners, resolve promises pendentes e libera texturas/renderizador.
- `prefers-reduced-motion` encurta o giro e desativa animações decorativas via CSS.

## Áudio

`game/audio.ts` usa Web Audio API e mantém buses separados para trilha e efeitos. A trilha é procedural e só começa depois de uma interação válida do usuário, respeitando a política de autoplay dos navegadores. Efeitos de UI, giro, parada individual de rolo e níveis de vitória são sintetizados em tempo real; nenhum MP3 externo é necessário.

## Layout e viewport

O gabinete principal possui orçamento de altura baseado em `100svh`. O alvo desktop de referência é 1536×776: header compacto + gabinete inteiro na primeira tela. Em resoluções mais baixas há um breakpoint por altura, além dos breakpoints por largura. O modo fullscreen usa uma grid própria e `overflow: hidden` para se comportar como cliente de jogo.

## Controles de produto

Além do giro manual, a UI expõe custo por rodada, turbo, cinco rodadas automáticas canceláveis, trilha/efeitos, fullscreen, histórico e regras. Enquanto a rodada está visualmente girando, o controle principal muda para `PARAR`: `SlotEngine.skip()` apenas encerra a animação e apresenta a grade já recebida, sem sortear novamente nem alterar o contrato. A automação continua reutilizando o mesmo `spin()` e o mesmo contrato de rodada; não existe um segundo caminho de negócio só para a UI.
