// Tiny synthesised sound effects: no audio files, just the Web Audio oscillator. Every
// call is guarded, so a browser with sound off or no audio context plays silently.

export function createAudio() {
  let context = null;

  function ensure() {
    if (context !== null) return context;
    try {
      const AudioContext = window.AudioContext ?? window.webkitAudioContext;
      if (!AudioContext) return null;
      context = new AudioContext();
    } catch {
      return null;
    }
    return context;
  }

  /** A short beep: `frequency` in Hz, `duration` in seconds, `type` the oscillator shape. */
  function beep(frequency, duration, type, volume) {
    const ctx = ensure();
    if (ctx === null) return;
    try {
      if (ctx.state === 'suspended') void ctx.resume();
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = type;
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start();
      oscillator.stop(ctx.currentTime + duration);
    } catch {
      // Sound is garnish: never let it break the game.
    }
  }

  return {
    pickup() {
      beep(880, 0.12, 'sine', 0.12);
      window.setTimeout(() => beep(1318, 0.16, 'sine', 0.1), 70);
    },
    diamond() {
      beep(659, 0.14, 'triangle', 0.14);
      window.setTimeout(() => beep(988, 0.14, 'triangle', 0.14), 90);
      window.setTimeout(() => beep(1318, 0.24, 'triangle', 0.12), 180);
    },
    spotted() {
      beep(220, 0.2, 'square', 0.07);
    },
    smoke() {
      beep(180, 0.25, 'sawtooth', 0.05);
    },
    emp() {
      beep(1400, 0.1, 'square', 0.06);
      window.setTimeout(() => beep(700, 0.18, 'square', 0.06), 80);
    },
    win() {
      [523, 659, 784, 1046].forEach((frequency, index) => {
        window.setTimeout(() => beep(frequency, 0.22, 'triangle', 0.12), index * 110);
      });
    },
    caught() {
      beep(330, 0.25, 'sawtooth', 0.1);
      window.setTimeout(() => beep(165, 0.5, 'sawtooth', 0.1), 160);
    },
  };
}
