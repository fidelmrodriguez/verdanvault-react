import { Application, Container, Graphics, Sprite, Texture } from 'pixi.js';
import { createSymbol } from './symbolArt';
import { INITIAL_GRID, SYMBOLS, LINES, type Grid } from './rules';
import type { Round } from '../types/game';
import { audio } from './audio';

const W = 600;
const H = 390;
const CELL = 122;
const TOP = 12;

type Particle = {
  sprite: Graphics;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
};

export class SlotEngine {
  private app = new Application();
  private reels: Container[] = [];
  private sprites: Sprite[][] = [];
  private textures = new Map<string, Texture>();
  private highlight = new Graphics();
  private particles: Particle[] = [];
  private spinning = false;
  private clock = 0;
  private stopping = false;
  private stopAt = 0;
  private stopGap = 420;
  private settleTail = 320;
  private finalAnticipation = 0;
  private turbo = false;
  private stopped = [false, false, false];
  private revealedRows = Array.from({ length: 3 }, () => [false, false, false]);
  private rowRevealGap = 0;
  private result: Round | null = null;
  private done: (() => void) | null = null;
  private destroyed = false;
  private ready = false;
  private frameTime = 0;
  private frames = 0;
  private elapsed = 0;
  private winningCells = new Set<string>();
  private winClock = 0;

  constructor(
    private host: HTMLElement,
    private onMetrics: (fps: number, frameMs: number) => void,
  ) {}

  async init() {
    await this.app.init({
      width: W,
      height: H,
      backgroundAlpha: 0,
      antialias: true,
      resolution: Math.min(devicePixelRatio, 2),
      autoDensity: true,
      preference: 'webgl',
    });

    if (this.destroyed) {
      this.app.destroy(true, { children: true, texture: true });
      return;
    }

    this.ready = true;
    this.host.appendChild(this.app.canvas);
    this.app.canvas.setAttribute('aria-hidden', 'true');

    for (const id of SYMBOLS) {
      const art = createSymbol(id);
      this.textures.set(id, this.app.renderer.generateTexture({ target: art, resolution: 2 }));
      art.destroy({ children: true });
    }

    const bg = new Graphics();
    this.app.stage.addChild(bg);
    for (let col = 0; col < 3; col++) {
      for (let row = 0; row < 3; row++) {
        bg.roundRect(col * 196 + 9, row * CELL + TOP, 190, CELL - 5, 8).fill({
          color: 0x102b23,
          alpha: 0.86,
        });
        bg.roundRect(col * 196 + 9, row * CELL + TOP, 190, CELL - 5, 8).stroke({
          color: 0xc5b479,
          alpha: 0.16,
          width: 1,
        });
        bg.circle(col * 196 + 104, row * CELL + TOP + 59, 44).stroke({
          color: 0xa4c088,
          alpha: 0.06,
          width: 1,
        });
      }
    }

    const mask = new Graphics().rect(5, TOP, 590, 365).fill(0xffffff);
    this.app.stage.addChild(mask);

    for (let col = 0; col < 3; col++) {
      const reel = new Container();
      reel.mask = mask;
      this.app.stage.addChild(reel);
      this.reels.push(reel);

      const sprites: Sprite[] = [];
      for (let row = 0; row < 4; row++) {
        const sprite = new Sprite(this.textures.get(INITIAL_GRID[col][row % 3]));
        sprite.anchor.set(0.5);
        sprite.position.set(col * 196 + 104, TOP + CELL * (row - 0.5));
        reel.addChild(sprite);
        sprites.push(sprite);
      }
      this.sprites.push(sprites);
    }

    this.app.stage.addChild(this.highlight);
    this.setGrid(INITIAL_GRID);

    for (let i = 0; i < 48; i++) {
      const sprite = new Graphics()
        .poly([0, -4, 2, 0, 0, 4, -2, 0])
        .fill(i % 2 ? 0xf9d788 : 0x83efbe);
      sprite.visible = false;
      this.app.stage.addChild(sprite);
      this.particles.push({ sprite, x: 0, y: 0, vx: 0, vy: 0, life: 0 });
    }

    this.app.ticker.maxFPS = 60;
    this.app.ticker.add((ticker) => this.tick(Math.min(ticker.deltaMS, 50), ticker.elapsedMS));
    document.addEventListener('visibilitychange', this.visibility);
  }

  private visibility = () => {
    if (document.hidden) this.app.stop();
    else this.app.start();
  };

  setGrid(grid: Grid) {
    for (let col = 0; col < 3; col++) {
      for (let row = 0; row < 4; row++) {
        const sprite = this.sprites[col]?.[row];
        if (!sprite) continue;
        sprite.texture = this.textures.get(grid[col][row % 3])!;
        sprite.y = TOP + CELL * (row + 0.5);
        sprite.alpha = row === 3 ? 0 : 1;
        sprite.scale.set(1);
      }
    }
  }

  start() {
    if (!this.ready) return;
    this.spinning = true;
    this.stopping = false;
    this.clock = 0;
    this.result = null;
    this.stopped = [false, false, false];
    this.revealedRows = Array.from({ length: 3 }, () => [false, false, false]);
    this.rowRevealGap = 0;
    this.highlight.clear();
    this.highlight.alpha = 1;
    this.winningCells.clear();
    this.winClock = 0;
    for (let col = 0; col < 3; col++) {
      for (let row = 0; row < 4; row++) {
        const sprite = this.sprites[col]?.[row];
        if (sprite) sprite.scale.set(1);
      }
    }
    for (const particle of this.particles) particle.life = 0;
  }

  finish(round: Round, turbo: boolean): Promise<void> {
    this.result = round;
    this.turbo = turbo;
    this.stopping = true;

    if (turbo) {
      // Turbo is a result-preview mode: no reel travel, no stop cascade.
      this.spinning = false;
      this.stopping = false;
      this.stopped = [true, true, true];
      this.revealedRows = Array.from({ length: 3 }, () => [true, true, true]);
      this.setGrid(round.grid);
      this.showWins(round);
      return Promise.resolve();
    }

    // One canonical normal-spin timeline on every device and viewport.
    // 4.00s travel + reel cascade + bottom -> middle -> top reveals = 6.00s total.
    this.stopAt = 4000;
    this.stopGap = 500;
    this.rowRevealGap = 160;
    this.settleTail = 430;
    this.finalAnticipation = 250;

    return new Promise((resolve) => {
      this.done = resolve;
    });
  }

  skip() {
    if (!this.spinning || !this.stopping || !this.result) return;
    this.spinning = false;
    this.stopped = [true, true, true];
    this.setGrid(this.result.grid);
    this.showWins(this.result);
    audio.play('stop');
    this.done?.();
    this.done = null;
  }

  cancel() {
    this.spinning = false;
    this.stopping = false;
    this.stopped = [false, false, false];
    this.revealedRows = Array.from({ length: 3 }, () => [false, false, false]);
    this.setGrid(this.result?.grid ?? INITIAL_GRID);
    this.done?.();
    this.done = null;
  }

  private stopTime(column: number) {
    return this.stopAt + column * this.stopGap + (column === 2 ? this.finalAnticipation : 0);
  }

  private settleReel(column: number, stopTime: number) {
    if (!this.result) return;

    if (!this.stopped[column]) {
      this.stopped[column] = true;
      audio.play('reel');
      this.stopBurst(column);

      // Freeze the reel at cell centers, but keep the currently visible random
      // symbols until each result cell lands. This avoids the old "all rows pop
      // in at once" effect.
      for (let row = 0; row < 4; row++) {
        const sprite = this.sprites[column][row];
        sprite.y = TOP + CELL * (row + 0.5);
        sprite.alpha = row === 3 ? 0 : 0.68;
        sprite.scale.set(1);
      }
    }

    const sinceStop = Math.max(0, this.clock - stopTime);
    const revealOrder = [2, 1, 0] as const;

    revealOrder.forEach((row, orderIndex) => {
      const revealAt = orderIndex * this.rowRevealGap;
      if (sinceStop < revealAt) return;

      if (!this.revealedRows[column][row]) {
        this.revealedRows[column][row] = true;
        const sprite = this.sprites[column][row];
        sprite.texture = this.textures.get(this.result!.grid[column][row])!;
        sprite.alpha = 1;
        audio.play('reveal');
        this.symbolLandBurst(column, row);
      }

      const sprite = this.sprites[column][row];
      const sinceReveal = Math.max(0, sinceStop - revealAt);
      const bounce = Math.sin(sinceReveal / 48) * 8.5 * Math.exp(-sinceReveal / 150);
      const squash =
        sinceReveal < 180 ? Math.sin((sinceReveal / 180) * Math.PI) * 0.035 : 0;

      sprite.y = TOP + CELL * (row + 0.5) + bounce;
      sprite.alpha = 1;
      sprite.scale.set(1 + squash, 1 - squash);
    });

    // Keep unrevealed cells visually "pending" instead of replacing them with
    // the final grid prematurely.
    for (let row = 0; row < 3; row++) {
      if (this.revealedRows[column][row]) continue;
      const sprite = this.sprites[column][row];
      sprite.y = TOP + CELL * (row + 0.5);
      sprite.alpha = 0.68;
      sprite.scale.set(1);
    }
  }

  private spinReel(column: number, dt: number) {
    const acceleration = Math.min(1, 0.22 + this.clock / 1800);
    const anticipating =
      !this.turbo &&
      column === 2 &&
      Boolean(this.result?.payout) &&
      this.stopping &&
      this.clock > this.stopAt + this.stopGap * 1.55;
    const anticipationPulse = anticipating ? 0.77 + Math.sin(this.clock / 82) * 0.08 : 1;
    const speed = (0.9 + column * 0.09) * acceleration * anticipationPulse;

    for (const sprite of this.sprites[column]) {
      sprite.alpha = anticipating ? 0.92 : 0.76;
      const stretch = anticipating ? 1.055 : 1.035;
      sprite.scale.set(1, stretch);
      sprite.y += dt * speed;
      if (sprite.y > TOP + CELL * 3.5) {
        sprite.y -= CELL * 4;
        sprite.texture = this.textures.get(SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)])!;
      }
    }
  }

  private symbolLandBurst(column: number, row: number) {
    let emitted = 0;
    const centerX = column * 196 + 104;
    const centerY = TOP + CELL * (row + 0.5);
    for (const particle of this.particles) {
      if (particle.life > 0) continue;
      const angle = Math.random() * Math.PI * 2;
      particle.x = centerX + (Math.random() - 0.5) * 30;
      particle.y = centerY + (Math.random() - 0.5) * 18;
      particle.vx = Math.cos(angle) * (0.1 + Math.random() * 0.22);
      particle.vy = Math.sin(angle) * (0.1 + Math.random() * 0.22) - 0.08;
      particle.life = 180 + Math.random() * 240;
      emitted++;
      if (emitted >= 4) break;
    }
  }

  private stopBurst(column: number) {
    let emitted = 0;
    for (const particle of this.particles) {
      if (particle.life > 0) continue;
      const angle = Math.random() * Math.PI * 2;
      particle.x = column * 196 + 104;
      particle.y = TOP + CELL * (1.5 + (Math.random() - 0.5) * 0.45);
      particle.vx = Math.cos(angle) * (0.16 + Math.random() * 0.34);
      particle.vy = Math.sin(angle) * (0.16 + Math.random() * 0.34) - 0.12;
      particle.life = 260 + Math.random() * 360;
      emitted++;
      if (emitted >= 8) break;
    }
  }

  private tick(dt: number, raw: number) {
    const begin = performance.now();
    this.clock += dt;

    if (this.spinning) {
      for (let column = 0; column < 3; column++) {
        const stopTime = this.stopTime(column);
        if (this.stopping && this.clock >= stopTime) this.settleReel(column, stopTime);
        else this.spinReel(column, dt);
      }

      const finalStop = this.stopTime(2);
      const finalReveal = finalStop + this.rowRevealGap * 2;
      if (this.stopping && this.clock >= finalReveal + this.settleTail) {
        this.spinning = false;
        // At this point every visible cell has already landed in sequence.
        // setGrid only normalizes position/scale; it no longer reveals anything.
        this.setGrid(this.result!.grid);
        this.showWins(this.result!);
        this.done?.();
        this.done = null;
      }
    }

    if (!this.spinning && this.winningCells.size) {
      this.winClock += dt;
      const pulse = 1 + Math.sin(this.winClock / 135) * 0.045;
      for (const key of this.winningCells) {
        const [column, row] = key.split(':').map(Number);
        const sprite = this.sprites[column]?.[row];
        if (sprite) sprite.scale.set(pulse);
      }
      this.highlight.alpha = 0.62 + Math.sin(this.winClock / 170) * 0.26;
    }

    for (const particle of this.particles) {
      particle.life -= dt;
      particle.sprite.visible = particle.life > 0;
      if (particle.life > 0) {
        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;
        particle.vy += 0.00012 * dt;
        particle.sprite.position.set(particle.x, particle.y);
        particle.sprite.alpha = Math.min(particle.life / 400, 1);
        particle.sprite.rotation += dt * 0.003;
      }
    }

    this.frameTime += performance.now() - begin;
    this.frames++;
    this.elapsed += raw;
    if (this.elapsed >= 1000) {
      this.onMetrics(Math.round((this.frames * 1000) / this.elapsed), this.frameTime / this.frames);
      this.frames = 0;
      this.frameTime = 0;
      this.elapsed = 0;
    }
  }

  private showWins(round: Round) {
    this.highlight.clear();
    this.winningCells.clear();
    this.winClock = 0;
    for (const win of round.wins) {
      const rows = LINES[win.line];
      rows.forEach((row, column) => this.winningCells.add(`${column}:${row}`));
      rows.forEach((row, column) =>
        this.highlight
          .roundRect(column * 196 + 10, row * CELL + TOP + 1, 188, CELL - 7, 8)
          .stroke({ color: 0x99f1b9, width: 2, alpha: 0.9 }),
      );
      this.highlight
        .poly(
          rows.flatMap((row, column) => [column * 196 + 104, TOP + CELL * (row + 0.5)]),
          false,
        )
        .stroke({ color: 0xead096, width: 2, alpha: 0.5 });
    }

    if (round.payout > 0) {
      for (const particle of this.particles) {
        particle.x = 300;
        particle.y = 195;
        particle.vx = (Math.random() - 0.5) * 0.7;
        particle.vy = -Math.random() * 0.65;
        particle.life = 900 + Math.random() * 900;
      }
    }
  }

  destroy() {
    this.destroyed = true;
    document.removeEventListener('visibilitychange', this.visibility);
    this.done?.();
    if (this.ready) {
      for (const texture of this.textures.values()) texture.destroy(true);
      this.app.destroy(true, { children: true });
    }
  }
}
