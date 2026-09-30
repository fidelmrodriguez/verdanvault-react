# Validação

## Checklist automatizado

```bash
npm run typecheck
npm test
npm run build
```

## Navegador

```bash
npx playwright install chromium
npm run test:e2e
```

Os fluxos E2E cobrem inicialização, giro, histórico, regras, preferências, reset, controles de turbo/auto, fechamento de modal, layout mobile sem overflow horizontal e enquadramento do gabinete em 1536×776.

## Checklist manual

- Desktop: Chrome/Edge e Firefox, incluindo viewport 1536×776.
- Mobile: largura de 390 px e dispositivo físico quando disponível.
- Abrir um modal e interagir com seus controles sem fechamento acidental.
- Girar no modo normal e confirmar o ritmo prolongado, a parada sequencial dos três rolos e a antecipação do último.
- Em uma vitória, confirmar pulso dos símbolos, flare no cenário, reação do personagem, contador crescente do prêmio, chuva de moedas e encerramento automático da placa de recompensa.
- Observar a cena superior em idle e confirmar câmera, personagem em camadas, aura da relíquia, cachoeira, névoa, folhas e partículas sem bloquear os controles.
- Ativar turbo e confirmar que apenas o ritmo muda.
- Iniciar 5 rodadas automáticas, interromper no meio e confirmar que a próxima rodada não dispara.
- Após a primeira interação, confirmar trilha procedural, sons de UI, giro, parada de cada rolo e vitória.
- Alternar som e tela cheia.
- Ocultar e restaurar a aba durante uma sessão.
- Validar `prefers-reduced-motion`.
- Publicar `dist/` em hospedagem estática e confirmar fallback standalone.
- Executar `npm start` e confirmar REST + WebSocket.

- [ ] Música e efeitos podem ser desligados e religados separadamente em Preferências.
- [ ] Efeitos de giro/parada/vitória permanecem mais altos que a trilha, sem a música ficar inaudível.

- [ ] Giro normal completa em aproximadamente 30 s; Turbo continua instantâneo.
- [ ] Cada rolo revela o resultado em três etapas: linha inferior, linha central e linha superior.
- [ ] Nenhuma parada normal substitui as três linhas finais simultaneamente.
