/**
 * Seedable Deterministic Pseudo-Random Number Generator (PRNG)
 * Uses Mulberry32 algorithm for fast, high-quality 32-bit pseudo-random numbers.
 */

export interface PRNG {
  /** Return a uniform float in [0, 1) */
  next(): number;
  /** Return a d6 roll in 1..6, with optional boostSixPercent (e.g. 0.02 for +2% boost) */
  d6(boostSixPercent?: number): number;
  /** Return an integer in [min, max] inclusive */
  range(min: number, max: number): number;
  /** Pick an element from an array */
  pick<T>(array: T[]): T;
  /** Get internal state for serialization */
  getState(): number;
  /** Clone RNG at current state */
  clone(): PRNG;
}

export function createPRNG(seed: number | string = Date.now()): PRNG {
  let s: number;

  if (typeof seed === 'string') {
    // Simple string hash to 32-bit int
    let h = 2166136261 >>> 0;
    for (let i = 0; i < seed.length; i++) {
      h = Math.imul(h ^ seed.charCodeAt(i), 16777619) >>> 0;
    }
    s = h;
  } else {
    s = seed >>> 0;
  }

  function nextUint32(): number {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return (t ^ (t >>> 14)) >>> 0;
  }

  function next(): number {
    return nextUint32() / 4294967296;
  }

  function d6(boostSixPercent: number = 0): number {
    if (boostSixPercent > 0) {
      // Base probability of 6 is 1/6 (~16.6667%)
      // With boostSixPercent (e.g. 0.02 = 2%), probability of 6 becomes 1/6 + 0.02 = 18.6667%
      if (next() < (1 / 6 + boostSixPercent)) {
        return 6;
      }
      // Remaining probability (81.3333%) distributed uniformly among 1..5
      return (nextUint32() % 5) + 1;
    }

    // Rejection sampling guarantees each face 1..6 has probability exactly 1/6 (zero modulo bias)
    const limit = 4294967292; // 2^32 - (2^32 % 6)
    let val: number;
    do {
      val = nextUint32();
    } while (val >= limit);
    return (val % 6) + 1;
  }

  function range(min: number, max: number): number {
    if (min === max) return min;
    const span = max - min + 1;
    return min + (nextUint32() % span);
  }

  function pick<T>(array: T[]): T {
    if (array.length === 0) {
      throw new Error('Cannot pick from empty array');
    }
    const idx = nextUint32() % array.length;
    return array[idx];
  }

  function getState(): number {
    return s;
  }

  function clone(): PRNG {
    const copy = createPRNG(0);
    // @ts-expect-error set internal state
    copy._setState(s);
    return copy;
  }

  const instance: PRNG & { _setState: (val: number) => void } = {
    next,
    d6,
    range,
    pick,
    getState,
    clone,
    _setState: (val: number) => {
      s = val >>> 0;
    },
  };

  return instance;
}

