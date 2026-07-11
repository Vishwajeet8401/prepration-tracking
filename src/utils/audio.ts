/**
 * Helper utility to play success sound using Web Audio API
 */
export const playSuccessChime = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const playOscillator = (freq: number, startTime: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);

      gain.gain.setValueAtTime(0, ctx.currentTime + startTime);
      gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + startTime);
      osc.stop(ctx.currentTime + startTime + duration);
    };

    // Play a quick uplifting chord arpeggio
    playOscillator(523.25, 0.0, 0.3); // C5
    playOscillator(659.25, 0.1, 0.3); // E5
    playOscillator(783.99, 0.2, 0.3); // G5
    playOscillator(1046.50, 0.3, 0.8); // C6
  } catch (e) {
    console.error("Audio playback failed", e);
  }
};
