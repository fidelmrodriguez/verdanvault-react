import { test, expect } from '@playwright/test';

test.setTimeout(60_000);

const winningRound = {
  id: '11111111-1111-4111-8111-111111111111',
  bet: 10,
  payout: 60,
  balance: 1050,
  grid: [
    ['compass', 'emerald', 'leaf'],
    ['idol', 'emerald', 'sun'],
    ['scarab', 'emerald', 'compass'],
  ],
  wins: [{ line: 1, symbol: 'emerald', amount: 60 }],
  createdAt: '2026-09-29T18:00:00.000Z',
};

const losingRound = {
  id: '22222222-2222-4222-8222-222222222222',
  bet: 10,
  payout: 0,
  balance: 990,
  grid: [
    ['emerald', 'idol', 'compass'],
    ['scarab', 'sun', 'leaf'],
    ['idol', 'compass', 'emerald'],
  ],
  wins: [],
  createdAt: '2026-09-29T18:01:00.000Z',
};

test('desktop: giro, histórico, regras, preferências e reset', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');

  const spin = page.getByRole('button', { name: 'Girar · explorar relíquias' });
  await expect(spin).toBeEnabled();
  await page.route('**/api/spins', (route) => route.fulfill({ json: winningRound }));
  await spin.click();
  await expect(page.getByRole('status')).toContainText('+60 créditos', { timeout: 30_000 });
  await expect(page.locator('.win-celebration')).toBeVisible();
  await expect(page.locator('.balance-block>strong')).toHaveText('1.050 cr');
  await page.unroute('**/api/spins');

  await page.getByRole('button', { name: 'Histórico', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Diário de expedição' })).toBeVisible();
  await page.getByRole('button', { name: 'Fechar', exact: true }).click();

  await page.getByRole('button', { name: 'Regras', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'As relíquias do templo' })).toBeVisible();
  await page.keyboard.press('Escape');

  await page.getByRole('button', { name: 'Preferências', exact: true }).first().click();
  const music = page.getByRole('button', { name: /^Música/ });
  const effects = page.getByRole('button', { name: /Efeitos do jogo/ });
  await music.click();
  await expect(music).toContainText('Desativada');
  await expect(effects).toContainText('Ativados');
  await effects.click();
  await expect(effects).toContainText('Desativados');
  await music.click();
  await effects.click();
  const winSequence = page.getByRole('button', { name: /Sequência de vitórias/ });
  await winSequence.click();
  await expect(winSequence).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('heading', { name: 'Preferências' })).toBeVisible();
  await page.getByRole('button', { name: 'Reiniciar sessão' }).click();
  await expect(page.locator('.balance-block>strong')).toHaveText('1.000 cr');
  expect(errors).toEqual([]);
});

test('mobile: sem overflow, tap e retry de rede', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const spin = page.getByRole('button', { name: 'Girar · explorar relíquias' });
  await expect(spin).toBeEnabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const zones = await page.evaluate(() => {
    const hero = document.querySelector('.hero-scene')!.getBoundingClientRect();
    const reels = document.querySelector('.reel-frame')!.getBoundingClientRect();
    const controls = document.querySelector('.control-deck')!.getBoundingClientRect();
    return {
      heroBottom: hero.bottom,
      reelTop: reels.top,
      reelBottom: reels.bottom,
      controlsTop: controls.top,
    };
  });
  expect(zones.heroBottom).toBeLessThanOrEqual(zones.reelTop);
  expect(zones.reelBottom).toBeLessThanOrEqual(zones.controlsTop);

  await page.route('**/api/spins', (route) => route.fulfill({ json: losingRound }));
  await spin.click();
  await expect(page.getByRole('status')).toContainText('tente outro caminho', { timeout: 30_000 });
  await expect(page.locator('.balance-block>strong')).toHaveText('990 cr');
  await page.unroute('**/api/spins');

  await page.route('**/api/spins', (route) => route.abort());
  await spin.click();
  await expect(page.getByRole('alert')).toContainText('Servidor indisponível');
  await page.unroute('**/api/spins');
  await page.getByRole('button', { name: 'Tentar novamente' }).click();
  await expect(page.getByRole('button', { name: 'Girar · explorar relíquias' })).toBeEnabled({
    timeout: 30_000,
  });
});

test('API: request duplicado liquida uma vez e cross-origin é negado', async ({ request }) => {
  await request.get('/api/session');
  const payload = { requestId: crypto.randomUUID(), bet: 10 };
  const first = await (await request.post('/api/spins', { data: payload })).json();
  const second = await (await request.post('/api/spins', { data: payload })).json();
  expect(first.id).toBe(second.id);
  expect(first.balance).toBe(second.balance);
  expect(
    (
      await request.post('/api/spins', {
        headers: { Origin: 'https://foreign.example' },
        data: { ...payload, requestId: crypto.randomUUID() },
      })
    ).status(),
  ).toBe(403);
});


test('1536x776: gabinete completo cabe na primeira tela', async ({ page }) => {
  await page.setViewportSize({ width: 1536, height: 776 });
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Girar · explorar relíquias' })).toBeEnabled();
  const fit = await page.evaluate(() => {
    const stage = document.querySelector('.game-stage')!.getBoundingClientRect();
    const hero = document.querySelector('.hero-scene')!.getBoundingClientRect();
    const reels = document.querySelector('.reel-frame')!.getBoundingClientRect();
    const controls = document.querySelector('.control-deck')!.getBoundingClientRect();
    const bottom = document.querySelector('.stage-bottom')!.getBoundingClientRect();
    return {
      stageTop: stage.top,
      stageBottom: stage.bottom,
      viewport: innerHeight,
      heroBottom: hero.bottom,
      reelsTop: reels.top,
      reelsBottom: reels.bottom,
      controlsTop: controls.top,
      controlsBottom: controls.bottom,
      bottomTop: bottom.top,
    };
  });
  expect(fit.stageBottom).toBeLessThanOrEqual(fit.viewport);
  expect(fit.heroBottom).toBeLessThanOrEqual(fit.reelsTop);
  expect(fit.reelsBottom).toBeLessThanOrEqual(fit.controlsTop);
  expect(fit.controlsBottom).toBeLessThanOrEqual(fit.bottomTop + 1);
});

test('controles de produto: turbo e auto rodam sem abrir telas técnicas', async ({ page }) => {
  await page.goto('/');
  const auto = page.getByRole('button', { name: 'Iniciar 5 rodadas automáticas' });
  await expect(auto).toBeVisible();
  await page.getByRole('button', { name: 'Modo rápido' }).click();
  await expect(page.getByRole('button', { name: 'Modo rápido' })).toHaveAttribute('aria-pressed', 'true');
});


test('sequência de vitórias mantém o modal aberto e avança apenas quando o usuário gira', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: /Girar/ })).toBeEnabled();

  await page.getByRole('button', { name: 'Preferências', exact: true }).first().click();
  const sequence = page.getByRole('button', { name: /Sequência de vitórias/ });
  await sequence.click();

  await expect(page.getByRole('heading', { name: 'Preferências' })).toBeVisible();
  await expect(sequence).toHaveAttribute('aria-pressed', 'true');

  // Ativar a preferência não pode disparar giro nem fechar o modal.
  await page.waitForTimeout(1200);
  await expect(page.getByRole('heading', { name: 'Preferências' })).toBeVisible();

  await page.getByRole('button', { name: 'Fechar' }).click();
  await expect(page.getByText(/VITÓRIAS GARANTIDAS · VARIAÇÃO 1\/10/)).toBeVisible();

  await page.getByRole('button', { name: /Girar/ }).click();
  await expect(page.getByText(/Relíquia encontrada|TESOURO RARO|GRANDE DESCOBERTA/i)).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.getByText(/VITÓRIAS GARANTIDAS · VARIAÇÃO 1\/10/)).toBeVisible();
});


test('modal bloqueia o documento e mantém apenas o conteúdo do dialog rolável', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Girar · explorar relíquias' })).toBeEnabled();

  await page.getByRole('button', { name: 'Preferências', exact: true }).first().click();
  await expect(page.getByRole('heading', { name: 'Preferências' })).toBeVisible();

  const locked = await page.evaluate(() => ({
    html: document.documentElement.classList.contains('modal-scroll-lock'),
    body: document.body.classList.contains('modal-scroll-lock'),
    position: getComputedStyle(document.body).position,
    dialogOverflow: getComputedStyle(document.querySelector('dialog')!).overflowY,
  }));
  expect(locked.html).toBe(true);
  expect(locked.body).toBe(true);
  expect(locked.position).toBe('fixed');
  expect(['auto', 'scroll']).toContain(locked.dialogOverflow);

  await page.getByRole('button', { name: 'Fechar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Preferências' })).toBeHidden();
  expect(
    await page.evaluate(() =>
      document.documentElement.classList.contains('modal-scroll-lock') ||
      document.body.classList.contains('modal-scroll-lock'),
    ),
  ).toBe(false);
});

test('tablet/mobile mantém a top bar fixa', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 900 });
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Girar · explorar relíquias' })).toBeEnabled();

  const before = await page.locator('.topbar').boundingBox();
  const style = await page.locator('.topbar').evaluate((element) => getComputedStyle(element).position);
  expect(style).toBe('fixed');
  expect(before?.y ?? -1).toBeCloseTo(0, 0);

  await page.evaluate(() => window.scrollTo(0, 450));
  await page.waitForTimeout(80);
  const after = await page.locator('.topbar').boundingBox();
  expect(after?.y ?? -1).toBeCloseTo(0, 0);
});
