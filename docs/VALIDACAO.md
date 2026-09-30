# Validação

## Checklist automatizado

```bash
npm run typecheck
npm test
npm run build
```

Para uma verificação agregada:

```bash
npm run check
```

## Navegador

```bash
npx playwright install chromium
npm run test:e2e
```

Os fluxos E2E cobrem inicialização, giro, histórico, regras, preferências, reset, Turbo/Auto, fechamento de modal e cenários responsivos.

## Checklist manual

### Loading

- [ ] Ao abrir a aplicação, `html` e `body` não permitem scroll vertical nem horizontal enquanto o loading estiver visível.
- [ ] Em mobile/tablet, overscroll/rubber-band não move o documento durante o loading.
- [ ] A trava de scroll só é removida depois que o loading termina a transição de saída.
- [ ] O loading desktop não distorce ou aplica zoom durante entrada/saída.
- [ ] Em tablet/mobile, o enquadramento de `loading-screen.webp` privilegia o lado direito para manter a raposa visível.

### Responsividade e navegação

- [ ] Desktop em 1536×776 mantém o gabinete jogável acima da dobra.
- [ ] Desktop (>1024 px) exibe navegação completa e botão de fullscreen.
- [ ] Tablet/mobile (≤1024 px) escondem links desktop e fullscreen e oferecem as opções pelo hamburger.
- [ ] Em tablet/mobile, a top bar permanece fixa no topo durante o scroll e o conteúdo começa abaixo dela, sem sobreposição.
- [ ] O botão de volume permanece acessível em todas as resoluções.
- [ ] Mobile em ~390 px não cria overflow horizontal inesperado depois do loading.
- [ ] A narrativa mobile/tablet aparece como toast temporário na parte inferior do hero sem cobrir o rosto da raposa.

### Modais

- [ ] Ao abrir qualquer modal, o scroll vertical e horizontal da página por trás fica bloqueado.
- [ ] Se o modal tiver conteúdo maior que a altura disponível, somente o próprio modal rola.
- [ ] Fechar pelo botão, `Esc` ou backdrop restaura a posição de scroll anterior da página.
- [ ] O foco retorna ao elemento que abriu o modal.

### Rodada e rolos

- [ ] Giro normal completa em aproximadamente 6 s em desktop, tablet e mobile.
- [ ] Desktop e mobile usam a mesma timeline do `SlotEngine`.
- [ ] Os três rolos param em cascata.
- [ ] Cada rolo revela o resultado em três etapas: linha inferior → central → superior.
- [ ] Nenhuma parada normal substitui as três linhas finais simultaneamente.
- [ ] Cada aterrissagem mantém bounce, squash, partículas e cue sonoro.
- [ ] Turbo apresenta o grid final imediatamente, sem animação dos rolos.
- [ ] `PARAR` encurta apenas a apresentação visual e não recalcula o resultado.

### Estados da raposa

- [ ] Idle usa `fox-explorer-idle.png`.
- [ ] Durante o giro aparece `fox-searching.png`.
- [ ] Rodada sem payout mostra temporariamente `fox-no-reward.png`.
- [ ] Vitória normal usa `fox-explorer-win.png`.
- [ ] BIG WIN usa `fox-explorer-big-win.png`.
- [ ] Grande descoberta usa `fox-explorer-grand-win.png`.
- [ ] Trocas de estado não deslocam a raposa horizontalmente; o personagem permanece centralizado.

### Celebrações

- [ ] Vitória normal: placa de prêmio + chuva de moedas + efeitos base.
- [ ] BIG WIN: mais moedas + ondas de choque + faíscas + flare reforçado.
- [ ] Grande descoberta: mais moedas + anéis + fragmentos dourados + flash global mais intenso.
- [ ] Símbolos vencedores permanecem destacados após o assentamento.
- [ ] A celebração termina sem bloquear a próxima interação válida.

### Áudio

- [ ] A trilha local `Humid Discovery` inicia após a primeira interação permitida pelo navegador.
- [ ] Música e FX podem ser desligados/religados separadamente em Preferências.
- [ ] Efeitos de giro, parada, aterrissagem e vitória permanecem acima da música no mix.
- [ ] Vitória normal, BIG WIN e bônus usam assinaturas sonoras distintas.

### Preferências e modos auxiliares

- [ ] Auto executa até cinco rodadas e pode ser interrompido.
- [ ] Sequência de vitórias não gira sozinha: o usuário continua iniciando cada rodada.
- [ ] Com Sequência de vitórias ativa, cada giro manual avança para a próxima variação vencedora.
- [ ] Após a última variação, a sequência volta para a primeira enquanto a preferência permanecer ativa.
- [ ] Desativar a sequência devolve imediatamente os próximos giros ao sorteio normal.

### Runtime

- [ ] Publicar `dist/` em hospedagem estática e confirmar fallback standalone.
- [ ] No standalone, saldo/histórico persistem no navegador quando `localStorage` está disponível.
- [ ] Executar `npm start` e confirmar REST + WebSocket.
- [ ] Ocultar/restaurar a aba e confirmar suspensão/retomada correta do ticker PixiJS.
- [ ] Abrir modais e interagir com controles sem fechamento acidental.
