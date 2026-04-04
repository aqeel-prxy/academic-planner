/**
 * Short two-tone bell using Web Audio API (works without asset files).
 * Safe no-op if audio is unavailable (SSR, strict browsers).
 */
export function playBellChime() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const now = ctx.currentTime;

    const ring = (freq, start, dur) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.12, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + dur + 0.05);
    };

    ring(880, now, 0.22);
    ring(660, now + 0.18, 0.28);

    const closeAt = (now + 0.65) * 1000;
    window.setTimeout(() => {
      ctx.close().catch(() => {});
    }, closeAt);
  } catch {
    /* ignore */
  }
}
