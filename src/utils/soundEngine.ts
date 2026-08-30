// Web Audio API Procedural Sound & Medieval Music Engine for "A Masmorra de Anakk Tur"
// Generates realistic fantasy sound effects and ambient looping medieval tavern/dungeon music.

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private sfxVolume: number = 0.8;
  private musicVolume: number = 0.5;
  private isMusicMuted: boolean = false;
  private isMusicPlaying: boolean = false;
  private musicInterval: NodeJS.Timeout | null = null;
  private activeMusicNodes: (AudioNode | OscillatorNode)[] = [];

  constructor() {
    // Restore sound preferences from localStorage
    try {
      const savedMute = localStorage.getItem('ANAKK_TUR_SOUND_MUTED');
      if (savedMute !== null) {
        this.isMuted = savedMute === 'true';
      }
      const savedMusicMute = localStorage.getItem('ANAKK_TUR_MUSIC_MUTED');
      if (savedMusicMute !== null) {
        this.isMusicMuted = savedMusicMute === 'true';
      }
      const savedSfxVol = localStorage.getItem('ANAKK_TUR_SFX_VOLUME');
      if (savedSfxVol !== null) {
        this.sfxVolume = parseFloat(savedSfxVol) || 0.8;
      }
      const savedMusicVol = localStorage.getItem('ANAKK_TUR_MUSIC_VOLUME');
      if (savedMusicVol !== null) {
        this.musicVolume = parseFloat(savedMusicVol) || 0.5;
      }
    } catch {
      this.isMuted = false;
      this.isMusicMuted = false;
    }
  }

  private initContext() {
    if (!this.ctx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // --- AUDIO CONTROLS & VOLUME ---

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    try {
      localStorage.setItem('ANAKK_TUR_SOUND_MUTED', String(this.isMuted));
    } catch {}
    return this.isMuted;
  }

  public toggleMusic(): boolean {
    this.isMusicMuted = !this.isMusicMuted;
    try {
      localStorage.setItem('ANAKK_TUR_MUSIC_MUTED', String(this.isMusicMuted));
    } catch {}
    if (this.isMusicMuted) {
      this.stopBackgroundMusic();
    } else {
      this.startBackgroundMusic();
    }
    return this.isMusicMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public getIsMusicMuted(): boolean {
    return this.isMusicMuted;
  }

  public getIsMusicPlaying(): boolean {
    return this.isMusicPlaying && !this.isMusicMuted;
  }

  public getSfxVolume(): number {
    return this.sfxVolume;
  }

  public getMusicVolume(): number {
    return this.musicVolume;
  }

  public setSfxVolume(vol: number) {
    this.sfxVolume = Math.max(0, Math.min(1, vol));
    try {
      localStorage.setItem('ANAKK_TUR_SFX_VOLUME', String(this.sfxVolume));
    } catch {}
  }

  public setMusicVolume(vol: number) {
    this.musicVolume = Math.max(0, Math.min(1, vol));
    try {
      localStorage.setItem('ANAKK_TUR_MUSIC_VOLUME', String(this.musicVolume));
    } catch {}
  }

  // --- PROCEDURAL MEDIEVAL DUNGEON / TAVERN BACKGROUND MUSIC ---

  public startBackgroundMusic() {
    if (this.isMusicMuted) return;
    this.initContext();
    if (!this.ctx || this.isMusicPlaying) return;

    this.isMusicPlaying = true;
    this.playMedievalMeasure();

    // Schedule looping musical phrases every 4.8 seconds
    this.musicInterval = setInterval(() => {
      if (this.isMusicPlaying && !this.isMusicMuted) {
        this.playMedievalMeasure();
      }
    }, 4800);
  }

  public stopBackgroundMusic() {
    this.isMusicPlaying = false;
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }

  /**
   * Procedural medieval lute, ambient dungeon drone, and harp arpeggio generator
   * in D Dorian / D Minor (D - E - F - G - A - B - C - D)
   */
  private playMedievalMeasure() {
    if (this.isMusicMuted || !this.isMusicPlaying) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const vol = this.musicVolume * 0.45;

    // 1. Deep Dungeon Drone (Low D2 / A2 Pad)
    const droneOsc = this.ctx.createOscillator();
    const droneGain = this.ctx.createGain();
    const droneFilter = this.ctx.createBiquadFilter();

    droneOsc.type = 'triangle';
    droneOsc.frequency.setValueAtTime(73.42, now); // D2
    droneFilter.type = 'lowpass';
    droneFilter.frequency.setValueAtTime(320, now);

    droneGain.gain.setValueAtTime(0.001, now);
    droneGain.gain.linearRampToValueAtTime(vol * 0.4, now + 1.2);
    droneGain.gain.linearRampToValueAtTime(0.001, now + 4.6);

    droneOsc.connect(droneFilter);
    droneFilter.connect(droneGain);
    droneGain.connect(this.ctx.destination);

    droneOsc.start(now);
    droneOsc.stop(now + 4.8);

    // 2. Lute / Harp Arpeggios (D minor / Dorian notes)
    const melodies = [
      [146.83, 220.00, 293.66, 349.23, 440.00, 392.00], // D3, A3, D4, F4, A4, G4
      [146.83, 261.63, 329.63, 392.00, 440.00, 349.23], // D3, C4, E4, G4, A4, F4
      [110.00, 174.61, 220.00, 293.66, 349.23, 261.63], // A2, F3, A3, D4, F4, C4
      [130.81, 196.00, 261.63, 329.63, 392.00, 293.66], // C3, G3, C4, E4, G4, D4
    ];
    const chosenMelody = melodies[Math.floor(Math.random() * melodies.length)];

    chosenMelody.forEach((freq, idx) => {
      const noteTime = now + (idx * 0.75) + (Math.random() * 0.05);
      const noteOsc = this.ctx!.createOscillator();
      const noteGain = this.ctx!.createGain();

      noteOsc.type = 'sine';
      noteOsc.frequency.setValueAtTime(freq, noteTime);

      noteGain.gain.setValueAtTime(0.001, noteTime);
      noteGain.gain.linearRampToValueAtTime(vol * 0.35, noteTime + 0.05);
      noteGain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.9);

      noteOsc.connect(noteGain);
      noteGain.connect(this.ctx!.destination);

      noteOsc.start(noteTime);
      noteOsc.stop(noteTime + 0.95);
    });

    // 3. Subtle Dungeon Chime / Bell on Measure Start (every other measure)
    if (Math.random() > 0.4) {
      const bellOsc = this.ctx.createOscillator();
      const bellGain = this.ctx.createGain();

      bellOsc.type = 'sine';
      bellOsc.frequency.setValueAtTime(880, now + 0.2); // A5 Bell

      bellGain.gain.setValueAtTime(0.001, now + 0.2);
      bellGain.gain.linearRampToValueAtTime(vol * 0.25, now + 0.25);
      bellGain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);

      bellOsc.connect(bellGain);
      bellGain.connect(this.ctx.destination);

      bellOsc.start(now + 0.2);
      bellOsc.stop(now + 2.6);
    }
  }

  // --- SOUND EFFECTS (SFX) ---

  // 1. Physical Attack / Sword Slash (Corte de Espada)
  public playSwordSlashSound() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const vol = this.sfxVolume;

    // Aerodynamic swoosh (Air whoosh)
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.18);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(900, now);
    filter.frequency.exponentialRampToValueAtTime(3600, now + 0.07);
    filter.frequency.exponentialRampToValueAtTime(500, now + 0.18);
    filter.Q.setValueAtTime(3.5, now);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.45 * vol, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);
    noise.start(now);

    // Steel Blade Clang & Slice
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const clangGain = this.ctx.createGain();

    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(620, now + 0.05);
    osc1.frequency.exponentialRampToValueAtTime(160, now + 0.32);

    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(1240, now + 0.05);
    osc2.frequency.exponentialRampToValueAtTime(280, now + 0.26);

    clangGain.gain.setValueAtTime(0.0, now);
    clangGain.gain.setValueAtTime(0.55 * vol, now + 0.05);
    clangGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc1.connect(clangGain);
    osc2.connect(clangGain);
    clangGain.connect(this.ctx.destination);

    osc1.start(now + 0.05);
    osc2.start(now + 0.05);
    osc1.stop(now + 0.35);
    osc2.stop(now + 0.35);
  }

  // Alias for attack
  public playAttackSound() {
    this.playSwordSlashSound();
  }

  // 2. Magical Spell / Ability Cast (Conjuração Mágica de Habilidades)
  public playMagicCastSound() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const vol = this.sfxVolume;

    // Resonant harmonic arpeggio
    const freqs = [440, 554.37, 659.25, 880, 1108.73, 1318.51]; // A major / mystical sparkle
    freqs.forEach((freq, idx) => {
      const startTime = now + idx * 0.04;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, startTime + 0.25);

      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(0.28 * vol, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.36);
    });

    // Ethereal sweep
    const sweepOsc = this.ctx.createOscillator();
    const sweepGain = this.ctx.createGain();
    sweepOsc.type = 'triangle';
    sweepOsc.frequency.setValueAtTime(320, now);
    sweepOsc.frequency.exponentialRampToValueAtTime(1450, now + 0.35);

    sweepGain.gain.setValueAtTime(0.2 * vol, now);
    sweepGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    sweepOsc.connect(sweepGain);
    sweepGain.connect(this.ctx.destination);

    sweepOsc.start(now);
    sweepOsc.stop(now + 0.4);
  }

  public playSpellSound() {
    this.playMagicCastSound();
  }

  // 3. Mysterious Event Reveal (Som Misterioso / Revelar Eventos)
  public playMysteryEventSound() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const vol = this.sfxVolume;

    // Mysterious minor chord (D minor / G# diminished dissonance)
    const chord = [293.66, 349.23, 415.30, 587.33]; // D4, F4, G#4, D5

    chord.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0.001, now + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.3 * vol, now + idx * 0.08 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.7);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.75);
    });
  }

  // 4. Monster Roar & Destruction (Rugido de Destruição de Monstro)
  public playMonsterRoarSound() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const vol = this.sfxVolume;

    // Low rumble noise
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.45);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(240, now);
    filter.frequency.exponentialRampToValueAtTime(80, now + 0.45);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.5 * vol, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);
    noise.start(now);

    // Deep roar guttural oscillator
    const roarOsc = this.ctx.createOscillator();
    const roarGain = this.ctx.createGain();

    roarOsc.type = 'sawtooth';
    roarOsc.frequency.setValueAtTime(95, now);
    roarOsc.frequency.linearRampToValueAtTime(65, now + 0.2);
    roarOsc.frequency.exponentialRampToValueAtTime(35, now + 0.5);

    roarGain.gain.setValueAtTime(0.45 * vol, now);
    roarGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    roarOsc.connect(roarGain);
    roarGain.connect(this.ctx.destination);

    roarOsc.start(now);
    roarOsc.stop(now + 0.5);
  }

  // 5. 3D Tumbling Dice Sound (Rolagem de Dados)
  public playDiceRollSound() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const vol = this.sfxVolume;
    const count = 8;

    for (let i = 0; i < count; i++) {
      const clickTime = now + (i * 0.07) + (Math.random() * 0.03);
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(320 + Math.random() * 450, clickTime);
      osc.frequency.exponentialRampToValueAtTime(110, clickTime + 0.045);

      gain.gain.setValueAtTime(0.28 * vol, clickTime);
      gain.gain.exponentialRampToValueAtTime(0.01, clickTime + 0.045);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(clickTime);
      osc.stop(clickTime + 0.045);
    }
  }

  // 6. Dice Hit (Estrelas / Dano)
  public playDiceHitSound() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const vol = this.sfxVolume;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(1760, now + 0.15);

    gain.gain.setValueAtTime(0.35 * vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.4);
  }

  // 7. Dice Blank / Nulo (Gota de Sangue)
  public playDiceBlankSound() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const vol = this.sfxVolume;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(130, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.16);

    gain.gain.setValueAtTime(0.32 * vol, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.16);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.16);
  }

  // 8. Treasure Coins Plunder
  public playTreasureSound() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const vol = this.sfxVolume;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 arpeggio

    notes.forEach((freq, idx) => {
      const noteTime = now + (idx * 0.08);
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.35 * vol, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(noteTime);
      osc.stop(noteTime + 0.35);
    });
  }

  // 9. Card Draw & Play Sounds
  public playCardPlaySound() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const vol = this.sfxVolume;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.08);

    gain.gain.setValueAtTime(0.4 * vol, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  public playDrawCardSound() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const vol = this.sfxVolume;
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.12);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1);
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(2000, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.25 * vol, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(now);
  }

  public playPageFlipSound() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const vol = this.sfxVolume;
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.25);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, now);
    filter.frequency.exponentialRampToValueAtTime(450, now + 0.25);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.35 * vol, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(now);
  }
}

export const soundEngine = new SoundEngine();
