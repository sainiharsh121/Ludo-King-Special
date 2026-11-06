import { describe, it } from 'node:test';
import assert from 'node:assert';
import { DICE_ROLL_WAV_BASE64, TOKEN_MOVE_WAV_BASE64, decodeWavSync } from '../src/utils/audioAssets';
import { soundEngine } from '../src/utils/soundEngine';

console.log('--- TEST SUITE: Dice Roll & Token Move Sound Analysis & Loudness ---');

// Mock Web Audio Context for Node test environment
class MockAudioBuffer {
  public numberOfChannels: number;
  public length: number;
  public sampleRate: number;
  public duration: number;
  private channelData: Float32Array;

  constructor(numberOfChannels: number, length: number, sampleRate: number) {
    this.numberOfChannels = numberOfChannels;
    this.length = length;
    this.sampleRate = sampleRate;
    this.duration = length / sampleRate;
    this.channelData = new Float32Array(length);
  }

  getChannelData(_channel: number) {
    return this.channelData;
  }
}

class MockAudioContext {
  public sampleRate = 44100;
  public currentTime = 0;
  public state: AudioContextState = 'running';
  public destination = {};

  createBuffer(channels: number, length: number, sampleRate: number) {
    return new MockAudioBuffer(channels, length, sampleRate);
  }

  createBufferSource() {
    return {
      buffer: null as MockAudioBuffer | null,
      connect: () => {},
      start: () => {},
      stop: () => {},
    };
  }

  createGain() {
    return {
      gain: {
        value: 1.0,
        setValueAtTime: () => {},
        exponentialRampToValueAtTime: () => {},
      },
      connect: () => {},
    };
  }

  createBiquadFilter() {
    return {
      type: 'bandpass',
      frequency: { setValueAtTime: () => {} },
      Q: { setValueAtTime: () => {} },
      connect: () => {},
    };
  }

  createOscillator() {
    return {
      type: 'sine',
      frequency: {
        setValueAtTime: () => {},
        exponentialRampToValueAtTime: () => {},
      },
      connect: () => {},
      start: () => {},
      stop: () => {},
    };
  }

  async resume() {
    this.state = 'running';
  }
}

// 1. Test synchronous WAV decoding of audio assets
const mockCtx = new MockAudioContext() as unknown as AudioContext;
const diceBuffer = decodeWavSync(mockCtx, DICE_ROLL_WAV_BASE64);
const tokenBuffer = decodeWavSync(mockCtx, TOKEN_MOVE_WAV_BASE64);

assert.ok(diceBuffer, 'Dice WAV buffer should decode successfully');
assert.strictEqual(diceBuffer.sampleRate, 44100, 'Dice sample rate must be 44100 Hz');
assert.strictEqual(diceBuffer.numberOfChannels, 1, 'Dice must be mono');
assert.ok(diceBuffer.length >= 13000 && diceBuffer.length <= 13500, `Dice buffer length (${diceBuffer.length}) should be ~13150 samples (~298ms)`);
const diceDurMs = (diceBuffer.length / diceBuffer.sampleRate) * 1000;
assert.ok(diceDurMs >= 290 && diceDurMs <= 310, `Dice duration (${diceDurMs.toFixed(1)}ms) should match recording (~298ms)`);
console.log(`✅ PASS: Dice Roll audio decoded: ${diceBuffer.length} samples, ${diceDurMs.toFixed(1)}ms @ 44.1kHz mono`);

assert.ok(tokenBuffer, 'Token WAV buffer should decode successfully');
assert.strictEqual(tokenBuffer.sampleRate, 44100, 'Token sample rate must be 44100 Hz');
assert.strictEqual(tokenBuffer.numberOfChannels, 1, 'Token must be mono');
assert.ok(tokenBuffer.length >= 4700 && tokenBuffer.length <= 5000, `Token buffer length (${tokenBuffer.length}) should be ~4800 samples (~108.8ms)`);
const tokenDurMs = (tokenBuffer.length / tokenBuffer.sampleRate) * 1000;
assert.ok(tokenDurMs >= 105 && tokenDurMs <= 115, `Token duration (${tokenDurMs.toFixed(1)}ms) should match recording (~108.8ms)`);
console.log(`✅ PASS: Token Move audio decoded: ${tokenBuffer.length} samples, ${tokenDurMs.toFixed(1)}ms @ 44.1kHz mono`);

// 2. Test peak amplitude and relative loudness ratio
const diceData = diceBuffer.getChannelData(0);
let dicePeak = 0;
for (let i = 0; i < diceData.length; i++) {
  const abs = Math.abs(diceData[i]);
  if (abs > dicePeak) dicePeak = abs;
}

const tokenData = tokenBuffer.getChannelData(0);
let tokenPeak = 0;
for (let i = 0; i < tokenData.length; i++) {
  const abs = Math.abs(tokenData[i]);
  if (abs > tokenPeak) tokenPeak = abs;
}

assert.ok(dicePeak >= 0.70 && dicePeak <= 0.76, `Dice peak (${dicePeak.toFixed(3)}) should match recording (~0.735)`);
assert.ok(tokenPeak >= 0.14 && tokenPeak <= 0.16, `Token peak (${tokenPeak.toFixed(3)}) should match recording (~0.150)`);

const peakRatio = dicePeak / tokenPeak;
assert.ok(peakRatio >= 4.5 && peakRatio <= 5.5, `Dice to Token peak ratio (${peakRatio.toFixed(2)}) should be ~4.9x`);
console.log(`✅ PASS: Loudness analysis confirmed: Dice Peak = ${dicePeak.toFixed(3)} (-2.68 dBFS), Token Peak = ${tokenPeak.toFixed(3)} (-16.47 dBFS), Ratio = ${peakRatio.toFixed(2)}x`);

// 3. Test SoundEngine methods execute smoothly without errors
(globalThis as unknown as { window: unknown }).window = {
  AudioContext: MockAudioContext,
};

soundEngine.unlockAudio();
soundEngine.playDiceShake();
soundEngine.playDiceRollSound();
soundEngine.playDiceLand();
soundEngine.playPawnStep();

assert.ok(soundEngine.enabled, 'SoundEngine should be enabled');
assert.strictEqual(soundEngine.masterVolume, 1.0, 'Master volume default is 1.0');
assert.strictEqual(soundEngine.diceVolume, 1.0, 'Dice volume default is 1.0');
assert.strictEqual(soundEngine.tokenVolume, 1.0, 'Token volume default is 1.0');
console.log('✅ PASS: SoundEngine playDiceShake, playDiceRollSound, playPawnStep execute cleanly with correct volumes');

console.log('🎉 ALL DICE & TOKEN SOUND ACCEPTANCE TESTS PASSED!');

