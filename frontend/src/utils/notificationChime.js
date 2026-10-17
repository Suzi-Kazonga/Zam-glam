// A short chime, so a notification is heard and not only seen.
//
// Nobody watches a dashboard while they pack a parcel or ride to an address, so the badge
// alone is easy to miss. This plays two quick notes whenever a notification count rises.
//
// The sound is generated rather than loaded: no audio file to ship, and nothing to fail
// on a slow connection.
//
// Browsers refuse to play anything until the person has interacted with the page, so the
// first click or key press unlocks it. Before that, a chime is simply skipped.

let audio = null;
let unlocked = false;

const STORAGE_KEY = 'zamglam:chime';

// Somebody who finds it irritating can turn it off, and it stays off on this device.
export function chimeEnabled() {
  try {
    return localStorage.getItem(STORAGE_KEY) !== 'off';
  } catch {
    return true;
  }
}

export function setChimeEnabled(enabled) {
  try {
    localStorage.setItem(STORAGE_KEY, enabled ? 'on' : 'off');
  } catch {
    // A browser with storage blocked simply keeps the default.
  }
}

function context() {
  if (audio) return audio;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  audio = new AudioContextClass();
  return audio;
}

// The first gesture anywhere on the page is what lets sound play at all.
export function unlockChime() {
  if (unlocked) return;
  const ctx = context();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  unlocked = ctx.state !== 'suspended';
}

if (typeof window !== 'undefined') {
  const unlock = () => unlockChime();
  window.addEventListener('pointerdown', unlock, { once: false, passive: true });
  window.addEventListener('keydown', unlock, { once: false, passive: true });
}

// Two notes, a fifth apart, about a fifth of a second altogether — enough to notice,
// short enough not to annoy.
export function playNotificationChime() {
  if (!chimeEnabled()) return;
  const ctx = context();
  if (!ctx || ctx.state === 'suspended') return;

  try {
    const now = ctx.currentTime;
    [[880, 0], [1320, 0.12]].forEach(([frequency, offset]) => {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      // Fade each note in and out, or it clicks at both ends.
      gain.gain.setValueAtTime(0.0001, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.18, now + offset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.18);
      oscillator.connect(gain).connect(ctx.destination);
      oscillator.start(now + offset);
      oscillator.stop(now + offset + 0.2);
    });
  } catch {
    // Sound is a courtesy; never let it break the page.
  }
}
