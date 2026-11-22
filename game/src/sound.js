// The Meridian Vault — tiny sounds, made with the Web Audio API and nothing else:
// a chime for loot, a low buzz when a guard spots the thief, a fanfare for the
// getaway and a falling tone for getting busted. No audio files, no network.

let context = null;
let muted = false;

/** True while the sounds are muted. */
export function isMuted() {
  return muted;
}

/** Flip the mute switch. */
export function toggleMute() {
  muted = !muted;
  return muted;
}

/** The audio context, made lazily on the first sound (browsers need a gesture first). */
function audio() {
  if (context === null) {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      context = new AudioContext();
    } catch {
      context = false;
    }
  }
  return context || null;
}

/** One short note: a frequency, a start delay, a length and a volume. */
function note(frequency, delay, length, volume) {
  const ctx = audio();
  if (ctx === null || muted) return;
  try {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0, ctx.currentTime + delay);
    gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + delay + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + length);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start(ctx.currentTime + delay);
    oscillator.stop(ctx.currentTime + delay + length + 0.05);
  } catch {
    // Sound is garnish: a failure here never stops the game.
  }
}

/** Two notes up: a piece of loot leaves its place. */
export function playGrab() {
  note(660, 0, 0.12, 0.15);
  note(990, 0.09, 0.18, 0.15);
}

/** A low buzz: a guard or a camera has eyes on the thief. */
export function playSpotted() {
  note(140, 0, 0.25, 0.2);
  note(110, 0.05, 0.25, 0.15);
}

/** Three notes up: the getaway is clean. */
export function playWin() {
  note(523, 0, 0.15, 0.15);
  note(659, 0.12, 0.15, 0.15);
  note(784, 0.24, 0.3, 0.18);
}

/** Three notes down: the heist is over. */
export function playBusted() {
  note(392, 0, 0.2, 0.18);
  note(311, 0.16, 0.2, 0.18);
  note(233, 0.32, 0.4, 0.2);
}
