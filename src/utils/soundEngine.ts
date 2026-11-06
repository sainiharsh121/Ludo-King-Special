import { DICE_ROLL_WAV_BASE64, TOKEN_MOVE_WAV_BASE64, decodeWavSync } from './audioAssets';

class SoundEngine {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  // Cached authentic audio buffers
  private diceBuffer: AudioBuffer | null = null;
  private tokenBuffer: AudioBuffer | null = null;
  private lastDiceRollTime: number = 0;

  // Volume & Loudness controls (matching video acoustics)
  public masterVolume: number = 1.0;
  public diceVolume: number = 1.0;   // Original recording peak 0.735 (-2.68 dBFS)
  public tokenVolume: number = 1.0;  // Original recording peak 0.150 (-16.47 dBFS)

  public unlockAudio() {
    this.initContext();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    this.ensureAudioBuffers();
  }

  private ensureAudioBuffers() {
    if (!this.ctx) return;
    if (!this.diceBuffer) {
      this.diceBuffer = decodeWavSync(this.ctx, DICE_ROLL_WAV_BASE64);
    }
    if (!this.tokenBuffer) {
      this.tokenBuffer = decodeWavSync(this.ctx, TOKEN_MOVE_WAV_BASE64);
    }
  }

  // Play authentic dice roll sound (exact Ludo King recording: 298.2ms crisp rattle & settle, peak 0.735 / -2.68 dBFS)
  public playDiceShake() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    this.lastDiceRollTime = Date.now();

    if (this.diceBuffer) {
      const source = this.ctx.createBufferSource();
      source.buffer = this.diceBuffer;
      const gainNode = this.ctx.createGain();
      gainNode.gain.setValueAtTime(this.diceVolume * this.masterVolume, this.ctx.currentTime);
      source.connect(gainNode);
      gainNode.connect(this.ctx.destination);
      source.start();
      return;
    }

    // Synthetic fallback if buffer unavailable
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const totalDuration = 0.16;
    const flipCount = 6;

    for (let i = 0; i < flipCount; i++) {
      const progress = i / flipCount;
      const timeOffset = Math.pow(progress, 1.05) * totalDuration + (Math.random() * 0.002 - 0.001);
      const startTime = now + timeOffset;

      const bufferSize = Math.floor(ctx.sampleRate * 0.008);
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let s = 0; s < bufferSize; s++) {
        output[s] = Math.random() * 2 - 1;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      const bandpass = ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(2500 + Math.random() * 1000, startTime);
      bandpass.Q.setValueAtTime(2.6, startTime);

      const gain = ctx.createGain();
      const clickVolume = (0.14 + (Math.random() * 0.04)) * this.masterVolume;
      gain.gain.setValueAtTime(clickVolume, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.007);

      whiteNoise.connect(bandpass);
      bandpass.connect(gain);
      gain.connect(ctx.destination);

      whiteNoise.start(startTime);
      whiteNoise.stop(startTime + 0.008);

      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(300 + Math.random() * 80, startTime);
      osc.frequency.exponentialRampToValueAtTime(90, startTime + 0.007);

      oscGain.gain.setValueAtTime(0.04 * this.masterVolume, startTime);
      oscGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.007);

      osc.connect(oscGain);
      oscGain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.008);
    }
  }

  // Dice landing solid impact (instant crisp snap - suppressed if authentic dice sample already concluded)
  public playDiceLand() {
    if (!this.enabled) return;
    // If playDiceShake was called within the last 380ms, the recorded sample already played the natural landing clack
    if (Date.now() - this.lastDiceRollTime < 380) {
      return;
    }
    this.initContext();
    if (!this.ctx) return;

    const ctx = this.ctx;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(210, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.028);

    gain.gain.setValueAtTime(0.22 * this.masterVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.028);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.03);
  }

  // Pawn hopping single step (exact Ludo King recording: 108.8ms snappy wood clack, peak 0.150 / -16.47 dBFS)
  public playPawnStep() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    if (this.tokenBuffer) {
      const source = this.ctx.createBufferSource();
      source.buffer = this.tokenBuffer;
      const gainNode = this.ctx.createGain();
      gainNode.gain.setValueAtTime(this.tokenVolume * this.masterVolume, this.ctx.currentTime);
      source.connect(gainNode);
      gainNode.connect(this.ctx.destination);
      source.start();
      return;
    }

    // Synthetic fallback if buffer unavailable
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Wood clack sound
    osc.type = 'sine';
    const baseFreq = 480 + Math.random() * 40;
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.5, now + 0.06);

    gain.gain.setValueAtTime(0.25 * this.masterVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.07);
  }

  // Pawn unlocking from home yard
  public playPawnUnlock() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    const ctx = this.ctx;
    const now = ctx.currentTime;
    const freqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6

    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const time = now + idx * 0.07;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(0.2, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(time);
      osc.stop(time + 0.22);
    });
  }

  // Dramatic opponent capture sound
  public playCaptureSound() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    const ctx = this.ctx;
    const now = ctx.currentTime;

    // Sub punch
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.35);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.36);

    // Whoosh whistle
    const whoosh = ctx.createOscillator();
    const whooshGain = ctx.createGain();
    whoosh.type = 'sawtooth';
    whoosh.frequency.setValueAtTime(800, now + 0.05);
    whoosh.frequency.exponentialRampToValueAtTime(150, now + 0.4);

    whooshGain.gain.setValueAtTime(0.12, now + 0.05);
    whooshGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    whoosh.connect(whooshGain);
    whooshGain.connect(ctx.destination);
    whoosh.start(now + 0.05);
    whoosh.stop(now + 0.42);
  }

  // Rapid rewind tick sound for captured pawn returning to base
  public playRewindStep(stepIdx: number, totalSteps: number) {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    const ctx = this.ctx;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    const progress = Math.max(0, Math.min(1, stepIdx / Math.max(1, totalSteps)));
    const freq = 650 - progress * 300;
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.85, now + 0.03);

    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.035);
  }

  // Safe star chime
  public playSafeStarSound() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    const ctx = this.ctx;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(1760, now + 0.2);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.32);
  }

  // Freeze Star crystalline frost sound
  public playFreezeSound() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    const ctx = this.ctx;
    const now = ctx.currentTime;

    // High crystalline bells
    [1046.5, 1567.98, 2093].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.04);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.1, now + idx * 0.04 + 0.25);

      gain.gain.setValueAtTime(0.12, now + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.04);
      osc.stop(now + idx * 0.04 + 0.36);
    });
  }

  // Jump Icon energetic spring whoosh
  public playJumpSound() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    const ctx = this.ctx;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(740, now + 0.16);
    osc.frequency.exponentialRampToValueAtTime(520, now + 0.28);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.32);
  }

  // Victory / Home arrival fanfare
  public playHomeSound() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    const ctx = this.ctx;
    const now = ctx.currentTime;
    // Triumphant fanfare: C5, G5, C6
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const time = now + idx * 0.09;

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(0.15, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(time);
      osc.stop(time + 0.45);
    });
  }

  // Turn Alert Ping
  public playTurnSound() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    const ctx = this.ctx;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(650, now);
    osc.frequency.exponentialRampToValueAtTime(850, now + 0.12);

    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.16);
  }

  // Double buzz when no moves available
  public playNoMoveSound() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    const ctx = this.ctx;
    const now = ctx.currentTime;

    [0, 0.12].forEach(delay => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = now + delay;

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, t);

      gain.gain.setValueAtTime(0.1, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.09);
    });
  }

  // Snappy arcade button tap
  public playButtonClick() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    const ctx = this.ctx;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.05);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.06);
  }

  // Jingle coin pickup / reward sound
  public playCoinSound() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    const ctx = this.ctx;
    const now = ctx.currentTime;

    [1318.51, 1760.0].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = now + i * 0.06;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.16);
    });
  }

  // Spin wheel tick
  public playWheelTick() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    const ctx = this.ctx;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(950 + Math.random() * 100, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.025);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.03);
  }

  // Spin wheel victory
  public playWheelWin() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    const ctx = this.ctx;
    const now = ctx.currentTime;
    const freqs = [523.25, 659.25, 783.99, 1046.5, 1318.51];

    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const time = now + idx * 0.08;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(0.2, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(time);
      osc.stop(time + 0.32);
    });
  }

  // Royal fanfare for Page 1 / Splash game start
  public playGameStartFanfare() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    const ctx = this.ctx;
    const now = ctx.currentTime;
    // Majestic ascending major chord arpeggio with shimmering decay
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const time = now + idx * 0.07;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(0.22, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(time);
      osc.stop(time + 0.65);
    });
  }

  // Celebratory rocket firework sound (rising whistle + boom explosion + spark crackle)
  public playCelebrationRocketSound() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    const ctx = this.ctx;
    const now = ctx.currentTime;

    // Sequence of 4 celebratory firework rockets launching and bursting
    const bursts = [0, 0.35, 0.8, 1.3];

    bursts.forEach((startDelay, idx) => {
      const launchTime = now + startDelay;
      const whistleDuration = 0.32;
      const burstTime = launchTime + whistleDuration;

      // 1. Rocket Whistle Whoosh (Ascending whistle)
      const whistleOsc = ctx.createOscillator();
      const whistleGain = ctx.createGain();
      whistleOsc.type = 'sawtooth';

      const startFreq = 400 + idx * 70;
      const peakFreq = 1200 + idx * 100;
      whistleOsc.frequency.setValueAtTime(startFreq, launchTime);
      whistleOsc.frequency.exponentialRampToValueAtTime(peakFreq, burstTime);

      whistleGain.gain.setValueAtTime(0.01, launchTime);
      whistleGain.gain.linearRampToValueAtTime(0.12, burstTime - 0.05);
      whistleGain.gain.exponentialRampToValueAtTime(0.001, burstTime);

      const whistleFilter = ctx.createBiquadFilter();
      whistleFilter.type = 'bandpass';
      whistleFilter.frequency.setValueAtTime(peakFreq, launchTime);
      whistleFilter.Q.setValueAtTime(3.0, launchTime);

      whistleOsc.connect(whistleFilter);
      whistleFilter.connect(whistleGain);
      whistleGain.connect(ctx.destination);

      whistleOsc.start(launchTime);
      whistleOsc.stop(burstTime);

      // 2. Rocket Explosion Boom (Low frequency impact thump)
      const boomOsc = ctx.createOscillator();
      const boomGain = ctx.createGain();
      boomOsc.type = 'triangle';
      boomOsc.frequency.setValueAtTime(150 + Math.random() * 30, burstTime);
      boomOsc.frequency.exponentialRampToValueAtTime(32, burstTime + 0.35);

      boomGain.gain.setValueAtTime(0.26, burstTime);
      boomGain.gain.exponentialRampToValueAtTime(0.001, burstTime + 0.35);

      boomOsc.connect(boomGain);
      boomGain.connect(ctx.destination);

      boomOsc.start(burstTime);
      boomOsc.stop(burstTime + 0.38);

      // 3. Crackling Firework Sparks (Highpass filtered noise)
      const crackleDuration = 0.45;
      const bufferSize = Math.floor(ctx.sampleRate * crackleDuration);
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let s = 0; s < bufferSize; s++) {
        data[s] = (Math.random() * 2 - 1) * (Math.random() > 0.8 ? 1 : 0.2);
      }
      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;

      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'highpass';
      noiseFilter.frequency.setValueAtTime(1400, burstTime);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.18, burstTime);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, burstTime + crackleDuration);

      noiseSource.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(ctx.destination);

      noiseSource.start(burstTime);
      noiseSource.stop(burstTime + crackleDuration);
    });

    // 4. Harmonic celebratory victory chords overlay
    const victoryChords = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    victoryChords.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const time = now + 0.35 + idx * 0.09;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(0.18, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(time);
      osc.stop(time + 0.55);
    });
  }

  // Aliases for game start & dice roll
  public playGameStartSound() {
    this.playGameStartFanfare();
  }

  public playDiceRollSound() {
    this.playDiceShake();
  }
}

export const soundEngine = new SoundEngine();

// Auto-unlock Web Audio context on the first user interaction (critical for mobile phones)
if (typeof window !== 'undefined') {
  const unlockAudioGesture = () => {
    soundEngine.unlockAudio();
    window.removeEventListener('touchstart', unlockAudioGesture);
    window.removeEventListener('touchend', unlockAudioGesture);
    window.removeEventListener('pointerdown', unlockAudioGesture);
    window.removeEventListener('click', unlockAudioGesture);
    window.removeEventListener('keydown', unlockAudioGesture);
  };
  window.addEventListener('touchstart', unlockAudioGesture, { passive: true, once: true });
  window.addEventListener('touchend', unlockAudioGesture, { passive: true, once: true });
  window.addEventListener('pointerdown', unlockAudioGesture, { passive: true, once: true });
  window.addEventListener('click', unlockAudioGesture, { once: true });
  window.addEventListener('keydown', unlockAudioGesture, { once: true });
}


