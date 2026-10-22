// Web Audio API procedural SFX synthesizer for zero-dependency, zero-latency gaming audio

class SoundEngine {
  private ctx: AudioContext | null = null;
  private musicInterval: number | null = null;
  private isMuted: boolean = false;
  private isMusicPlaying: boolean = false;
  private musicVolume: number = 0.15;
  private sfxVolume: number = 0.35;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.isMuted && this.isMusicPlaying) {
      this.stopMusic();
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setMusicVolume(val: number) {
    this.musicVolume = Math.max(0, Math.min(1, val));
  }

  public setSfxVolume(val: number) {
    this.sfxVolume = Math.max(0, Math.min(1, val));
  }

  // Realistic mechanical keyboard clack
  public playKeystroke() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const now = ctx.currentTime;

      // Subtle mechanical frequency range 600Hz - 900Hz
      const freq = 650 + Math.random() * 200;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.04);

      gain.gain.setValueAtTime(this.sfxVolume * 0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.045);
    } catch {
      // AudioContext policy safe
    }
  }

  // Countdown beep (3, 2, 1)
  public playCountdownTick(pitch: number = 440) {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(pitch, now);

    gain.gain.setValueAtTime(this.sfxVolume * 0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.13);
  }

  // FIGHT! Deep impact bass drop & arcade clash
  public playFightSound() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Sub-bass sweep
    const bass = ctx.createOscillator();
    const bassGain = ctx.createGain();
    bass.type = 'sawtooth';
    bass.frequency.setValueAtTime(160, now);
    bass.frequency.exponentialRampToValueAtTime(45, now + 0.4);

    bassGain.gain.setValueAtTime(this.sfxVolume * 0.6, now);
    bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    bass.connect(bassGain);
    bassGain.connect(ctx.destination);

    bass.start(now);
    bass.stop(now + 0.45);

    // Chime chords
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.04);

      gain.gain.setValueAtTime(this.sfxVolume * 0.3, now + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.04);
      osc.stop(now + 0.55);
    });
  }

  // Triumphant ascending coin/level-up sparkle arpeggio
  public playCorrectSound() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51]; // C5, E5, G5, C6, E6

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startTime = now + i * 0.06;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(this.sfxVolume * 0.4, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.28);
    });
  }

  // Heavy crunchy error buzzer (-50 pts penalty!)
  public playErrorBuzzer() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'square';

    osc1.frequency.setValueAtTime(140, now);
    osc1.frequency.linearRampToValueAtTime(90, now + 0.35);

    osc2.frequency.setValueAtTime(147, now); // dissonance
    osc2.frequency.linearRampToValueAtTime(95, now + 0.35);

    gain.gain.setValueAtTime(this.sfxVolume * 0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.4);
    osc2.stop(now + 0.4);
  }

  // Power-up unlocked / activated swoosh
  public playPowerUp() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.3);

    gain.gain.setValueAtTime(this.sfxVolume * 0.45, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.36);
  }

  // Debuff received / screen attack impact
  public playDebuffHit() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(450, now);
    osc.frequency.linearRampToValueAtTime(100, now + 0.25);

    gain.gain.setValueAtTime(this.sfxVolume * 0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.28);
  }

  // Sudden Death alarm siren
  public playSuddenDeathAlarm() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    [0, 0.2, 0.4].forEach((delay) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(700, now + delay);
      osc.frequency.linearRampToValueAtTime(950, now + delay + 0.15);

      gain.gain.setValueAtTime(this.sfxVolume * 0.4, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + delay);
      osc.stop(now + delay + 0.19);
    });
  }

  // Background Synthwave Arcade Beat (procedural low-intensity fast rhythm)
  public toggleMusic(): boolean {
    if (this.isMusicPlaying) {
      this.stopMusic();
      return false;
    } else {
      this.startMusic();
      return true;
    }
  }

  public isMusicActive(): boolean {
    return this.isMusicPlaying;
  }

  public startMusic() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    this.stopMusic();
    this.isMusicPlaying = true;

    // 128 BPM Synthwave Loop
    const stepTime = 60 / 128 / 2; // eighth notes
    let step = 0;
    const bassline = [110, 110, 130.81, 110, 98, 98, 123.47, 98]; // A2, C3, G2, B2
    const leadNotes = [440, 523.25, 659.25, 587.33, 523.25, 440, 392, 440];

    this.musicInterval = window.setInterval(() => {
      if (!this.isMusicPlaying || this.isMuted) return;
      const now = ctx.currentTime;

      // Kick on 1 and 3
      if (step % 4 === 0) {
        const kick = ctx.createOscillator();
        const kickGain = ctx.createGain();
        kick.frequency.setValueAtTime(120, now);
        kick.frequency.exponentialRampToValueAtTime(35, now + 0.09);
        kickGain.gain.setValueAtTime(this.musicVolume * 0.7, now);
        kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        kick.connect(kickGain);
        kickGain.connect(ctx.destination);
        kick.start(now);
        kick.stop(now + 0.1);
      }

      // Snare on 2 and 4 (noise-like short square burst)
      if (step % 4 === 2) {
        const snare = ctx.createOscillator();
        const snareGain = ctx.createGain();
        snare.type = 'triangle';
        snare.frequency.setValueAtTime(240, now);
        snare.frequency.exponentialRampToValueAtTime(80, now + 0.08);
        snareGain.gain.setValueAtTime(this.musicVolume * 0.45, now);
        snareGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
        snare.connect(snareGain);
        snareGain.connect(ctx.destination);
        snare.start(now);
        snare.stop(now + 0.09);
      }

      // Synth Bass Arp
      const bassFreq = bassline[step % bassline.length];
      const bassOsc = ctx.createOscillator();
      const bassGain = ctx.createGain();
      bassOsc.type = 'sawtooth';
      bassOsc.frequency.setValueAtTime(bassFreq, now);
      bassGain.gain.setValueAtTime(this.musicVolume * 0.35, now);
      bassGain.gain.exponentialRampToValueAtTime(0.001, now + stepTime * 0.8);
      bassOsc.connect(bassGain);
      bassGain.connect(ctx.destination);
      bassOsc.start(now);
      bassOsc.stop(now + stepTime * 0.85);

      // Lead melody every alternate step
      if (step % 2 === 0) {
        const leadFreq = leadNotes[(step / 2) % leadNotes.length];
        const leadOsc = ctx.createOscillator();
        const leadGain = ctx.createGain();
        leadOsc.type = 'sine';
        leadOsc.frequency.setValueAtTime(leadFreq, now);
        leadGain.gain.setValueAtTime(this.musicVolume * 0.25, now);
        leadGain.gain.exponentialRampToValueAtTime(0.001, now + stepTime * 1.5);
        leadOsc.connect(leadGain);
        leadGain.connect(ctx.destination);
        leadOsc.start(now);
        leadOsc.stop(now + stepTime * 1.6);
      }

      step++;
    }, stepTime * 1000);
  }

  public stopMusic() {
    this.isMusicPlaying = false;
    if (this.musicInterval !== null) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }
}

export const soundEngine = new SoundEngine();
