type FxKind = 'spin' | 'win' | 'bigwin' | 'stop' | 'reel' | 'reveal' | 'ui' | 'bonus';

class GameAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private fxBus: GainNode | null = null;
  private music: HTMLAudioElement | null = null;
  private musicSource: MediaElementAudioSourceNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private musicEnabled = true;
  private fxEnabled = true;

  async unlock() {
    try {
      if (!this.ctx) this.setup();
      await this.ctx?.resume();
      if (this.musicEnabled) await this.startMusic();
    } catch {
      // Browsers may block audio until the first explicit user gesture.
    }
  }

  setMusicEnabled(enabled: boolean) {
    this.musicEnabled = enabled;
    if (this.musicBus && this.ctx) {
      this.musicBus.gain.cancelScheduledValues(this.ctx.currentTime);
      this.musicBus.gain.setTargetAtTime(enabled ? 0.48 : 0.0001, this.ctx.currentTime, 0.045);
    }
    if (enabled) void this.unlock();
    else this.stopMusic();
  }

  setFxEnabled(enabled: boolean) {
    this.fxEnabled = enabled;
    if (this.fxBus && this.ctx) {
      this.fxBus.gain.cancelScheduledValues(this.ctx.currentTime);
      this.fxBus.gain.setTargetAtTime(enabled ? 1.38 : 0.0001, this.ctx.currentTime, 0.035);
    }
    if (enabled) void this.unlock();
  }

  private setup() {
    this.ctx = new AudioContext();
    this.master = this.ctx.createGain();
    this.musicBus = this.ctx.createGain();
    this.fxBus = this.ctx.createGain();
    this.compressor = this.ctx.createDynamicsCompressor();

    // Effects intentionally sit above the soundtrack, while the soundtrack remains audible.
    this.master.gain.value = 0.9;
    this.musicBus.gain.value = this.musicEnabled ? 0.48 : 0.0001;
    this.fxBus.gain.value = this.fxEnabled ? 1.38 : 0.0001;

    this.compressor.threshold.value = -8;
    this.compressor.knee.value = 12;
    this.compressor.ratio.value = 4;
    this.compressor.attack.value = 0.004;
    this.compressor.release.value = 0.18;

    this.musicBus.connect(this.master);
    this.fxBus.connect(this.master);
    this.master.connect(this.compressor);
    this.compressor.connect(this.ctx.destination);

    this.music = new Audio('/audio/verdant-theme.mp3');
    this.music.loop = true;
    this.music.preload = 'auto';
    this.music.volume = 1;

    this.musicSource = this.ctx.createMediaElementSource(this.music);
    this.musicSource.connect(this.musicBus);
  }

  private tone(
    frequency: number,
    start: number,
    duration: number,
    gainValue: number,
    type: OscillatorType = 'sine',
    destination: AudioNode | null = this.fxBus,
  ) {
    if (!this.ctx || !destination) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.001, gainValue), start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain);
    gain.connect(destination);
    osc.start(start);
    osc.stop(start + duration + 0.03);
  }

  private noiseBurst(duration = 0.32, gainValue = 0.035) {
    if (!this.ctx || !this.fxBus) return;
    const buffer = this.ctx.createBuffer(
      1,
      Math.floor(this.ctx.sampleRate * duration),
      this.ctx.sampleRate,
    );
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    }
    const source = this.ctx.createBufferSource();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    filter.type = 'bandpass';
    filter.frequency.value = 940;
    filter.Q.value = 0.55;
    gain.gain.value = gainValue;
    source.buffer = buffer;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.fxBus);
    source.start();
  }

  play(kind: FxKind) {
    if (!this.fxEnabled || !this.ctx || !this.fxBus) return;
    const now = this.ctx.currentTime;

    if (kind === 'spin') {
      this.noiseBurst(0.62, 0.145);
      [128, 160, 196].forEach((frequency, index) =>
        this.tone(frequency, now + index * 0.065, 0.31, 0.125, 'sawtooth'),
      );
      return;
    }
    if (kind === 'reel') {
      this.tone(245, now, 0.14, 0.13, 'triangle');
      this.tone(490, now + 0.015, 0.11, 0.062, 'square');
      return;
    }
    if (kind === 'reveal') {
      // Short layered landing cue used for bottom -> middle -> top result reveals.
      this.tone(165, now, 0.13, 0.085, 'sine');
      this.tone(660, now + 0.018, 0.16, 0.072, 'triangle');
      this.tone(990, now + 0.04, 0.12, 0.042, 'sine');
      return;
    }
    if (kind === 'stop') {
      this.tone(205, now, 0.22, 0.11, 'triangle');
      return;
    }
    if (kind === 'ui') {
      this.tone(720, now, 0.08, 0.04, 'sine');
      return;
    }
    if (kind === 'bonus') {
      [392, 523, 659, 784].forEach((frequency, index) =>
        this.tone(frequency, now + index * 0.06, 0.36, 0.118, 'triangle'),
      );
      return;
    }

    const notes =
      kind === 'bigwin'
        ? [392, 523, 659, 784, 1046, 1318]
        : [523, 659, 784, 1046];
    notes.forEach((frequency, index) => {
      this.tone(
        frequency,
        now + index * 0.09,
        kind === 'bigwin' ? 0.52 : 0.32,
        kind === 'bigwin' ? 0.155 : 0.105,
        'sine',
      );
    });
    if (kind === 'bigwin') this.noiseBurst(0.95, 0.12);
  }

  private async startMusic() {
    if (!this.music || !this.musicEnabled || !this.music.paused) return;
    try {
      await this.music.play();
    } catch {
      // The next explicit interaction will try again.
    }
  }

  private stopMusic() {
    this.music?.pause();
  }
}

export const audio = new GameAudio();
