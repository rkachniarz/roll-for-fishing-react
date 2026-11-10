// @ts-check
// Sound (DEV_PLAN 9.2): the cast, the splash of a bite, a catch, a fish that
// got away, something found, the dice, a level gained. Every sound is made in
// code with the Web Audio API, a placeholder until real sounds come (CR-14);
// a sound is a short recipe of tones and noise, so swapping one for a recorded
// file later changes only `play`.
//
// Browsers only let sound start after the player has touched the page, so the
// audio context is made on the first tap or key. The volume is a setting (0 to
// 100, 0 for none). Noise comes from a fixed little generator rather than
// Math.random: it changes nothing in the game (D4), and the sounds stay the
// same every time.

/** @typedef {'cast' | 'splash' | 'catch' | 'escape' | 'found' | 'dice' | 'level'} SoundName */

/**
 * @typedef {Object} Audio
 * @property {(name: SoundName) => void} play
 * @property {(volume: number) => void} setVolume  0-100.
 */

/**
 * @param {number} volume  0-100, from the settings.
 * @returns {Audio}
 */
export function createAudio(volume) {
  /** @type {AudioContext | null} */
  let ctx = null;
  /** @type {GainNode | null} */
  let master = null;
  /** @type {AudioBuffer | null} */
  let noise = null;
  let level = volume;

  const start = () => {
    if (ctx) {
      if (ctx.state === 'suspended') ctx.resume();
      return;
    }
    const Ctor = window.AudioContext ?? /** @type {any} */ (window).webkitAudioContext;
    if (!Ctor) return;
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = gainFor(level);
    master.connect(ctx.destination);
    // A second of white noise, from a fixed generator.
    noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = noise.getChannelData(0);
    let seed = 12345;
    for (let i = 0; i < data.length; i++) {
      seed = (seed * 1103515245 + 12345) >>> 0;
      data[i] = (seed / 0xffffffff) * 2 - 1;
    }
  };
  for (const type of ['pointerdown', 'keydown']) window.addEventListener(type, start, { capture: true });

  /**
   * A tone: a frequency gliding to another, rising fast and fading.
   * @param {number} at  Seconds from now.
   * @param {number} from  Hz.
   * @param {number} to  Hz.
   * @param {number} length  Seconds.
   * @param {number} loud  0-1.
   * @param {OscillatorType} [wave]
   */
  const tone = (at, from, to, length, loud, wave = 'sine') => {
    if (!ctx || !master) return;
    const t0 = ctx.currentTime + at;
    const osc = ctx.createOscillator();
    osc.type = wave;
    osc.frequency.setValueAtTime(from, t0);
    osc.frequency.exponentialRampToValueAtTime(to, t0 + length);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, t0);
    env.gain.exponentialRampToValueAtTime(loud, t0 + 0.01);
    env.gain.exponentialRampToValueAtTime(0.0001, t0 + length);
    osc.connect(env).connect(master);
    osc.start(t0);
    osc.stop(t0 + length + 0.02);
  };

  /**
   * Noise through a band-pass filter whose middle glides: a whoosh or a splash.
   * @param {number} at  Seconds from now.
   * @param {number} from  The filter's middle, Hz.
   * @param {number} to
   * @param {number} length  Seconds.
   * @param {number} loud  0-1.
   */
  const hiss = (at, from, to, length, loud) => {
    if (!ctx || !master || !noise) return;
    const t0 = ctx.currentTime + at;
    const src = ctx.createBufferSource();
    src.buffer = noise;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 1.2;
    filter.frequency.setValueAtTime(from, t0);
    filter.frequency.exponentialRampToValueAtTime(to, t0 + length);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, t0);
    env.gain.exponentialRampToValueAtTime(loud, t0 + 0.02);
    env.gain.exponentialRampToValueAtTime(0.0001, t0 + length);
    src.connect(filter).connect(env).connect(master);
    src.start(t0, 0, length + 0.05);
  };

  /** Each sound's recipe. */
  const RECIPES = /** @type {Record<SoundName, () => void>} */ ({
    // The line whips out; the bobber plops in.
    cast: () => {
      hiss(0, 600, 2400, 0.25, 0.35);
      tone(0.32, 520, 180, 0.12, 0.3);
    },
    // A fish takes it.
    splash: () => {
      hiss(0, 1800, 500, 0.35, 0.6);
      tone(0, 300, 90, 0.15, 0.25);
    },
    // Up and bright.
    catch: () => {
      tone(0, 523, 523, 0.18, 0.25, 'triangle');
      tone(0.12, 784, 784, 0.3, 0.25, 'triangle');
    },
    // Down and dull.
    escape: () => {
      tone(0, 392, 196, 0.35, 0.2, 'triangle');
      hiss(0, 900, 300, 0.25, 0.25);
    },
    // A small chime.
    found: () => {
      tone(0, 1318, 1318, 0.25, 0.18);
      tone(0.07, 1760, 1760, 0.3, 0.12);
    },
    // Dice clattering over the desk.
    dice: () => {
      for (const at of [0, 0.08, 0.15, 0.26, 0.4, 0.52]) hiss(at, 3000, 2200, 0.04, 0.35);
    },
    // A little fanfare.
    level: () => {
      [523, 659, 784, 1046].forEach((f, i) => tone(i * 0.1, f, f, 0.3, 0.2, 'triangle'));
    },
  });

  return {
    play(name) {
      if (!ctx || level <= 0) return;
      RECIPES[name]?.();
    },
    setVolume(volume) {
      level = volume;
      if (master) master.gain.value = gainFor(level);
    },
  };
}

/**
 * The master gain for a 0-100 setting: steps that sound even, loudest at 0.6.
 * @param {number} volume
 */
export function gainFor(volume) {
  const v = Math.min(Math.max(volume, 0), 100) / 100;
  return v === 0 ? 0 : 0.6 * v * v;
}
