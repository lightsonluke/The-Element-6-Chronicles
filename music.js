// Music manager — MP3 file playback with scene-based management, looping, and custom uploads.
// AudioContext is kept for SFX compatibility (sfx.js uses music.ctx).

// All audio served from local public/audio/ directory
// BASE_URL keeps audio working from both localhost and a GitHub Pages project URL.
const A = (name) => `${import.meta.env.BASE_URL}audio/${name}`;

// Homescreen music is intentionally separate from battle music. The selected
// track changes every two hours, never while the player is already on a match.
const MENU_TRACKS = [
  A('home.mp3'),
  A('home-2.mp3'),
];
const HOME_ROTATION_MS = 2 * 60 * 60 * 1000;
const PARKOUR_TRACK = A('parkour.mp3');
const ROCKCLIMB_TRACK = A('parkour.mp3');
// Built-in fight/sports track library. New tracks are selectable presets
// in Settings → Fight & Sports Music (and join the auto-rotation).
export const FIGHT_TRACK_LIBRARY = [
  { id: 'element-6-track', name: 'Element 6 Track', url: A('element-6-track.mp3') },
  { id: 'pixel-launch', name: 'Pixel Launch', url: A('pixel-launch.mp3') },
  { id: 'pixel-create', name: 'Pixel Create', url: A('pixel-create.mp3') },
  { id: 'pixel-king', name: 'Pixel King', url: A('pixel-king.mp3') },
  { id: 'pixel-many', name: 'Pixel Many', url: A('pixel-many.mp3') },
  { id: 'blade-of-dawn-one', name: 'Blade of Dawn I', url: A('blade-of-dawn-one.mp3') },
  { id: 'blade-of-dawn', name: 'Blade of Dawn', url: A('blade-of-dawn.mp3') },
  { id: 'boss-fight-circuit', name: 'Boss Fight Circuit', url: A('boss-fight-circuit.mp3') },
  { id: 'boss-raid', name: 'Boss Raid', url: A('boss-raid.mp3') },
  { id: 'boss-stage', name: 'Boss Stage', url: A('boss-stage.mp3') },
  { id: 'pixel-boss-showdown', name: 'Pixel Boss Showdown', url: A('pixel-boss-showdown.mp3') },
  { id: 'pixel-drift-one', name: 'Pixel Drift I', url: A('pixel-drift-one.mp3') },
  { id: 'pixel-heart-rush', name: 'Pixel Heart Rush', url: A('pixel-heart-rush.mp3') },
  { id: 'pixel-quest-loop', name: 'Pixel Quest Loop', url: A('pixel-quest-loop.mp3') },
  { id: 'pixel-rebound-one', name: 'Pixel Rebound I', url: A('pixel-rebound-one.mp3') },
  { id: 'pixel-rebound', name: 'Pixel Rebound', url: A('pixel-rebound.mp3') },
  { id: 'pixel-rush-one', name: 'Pixel Rush I', url: A('pixel-rush-one.mp3') },
  { id: 'pixel-rush', name: 'Pixel Rush', url: A('pixel-rush.mp3') },
  { id: 'pixelated-skyline', name: 'Pixelated Skyline', url: A('pixelated-skyline.mp3') },
  { id: 'turbo-cartridge-one', name: 'Turbo Cartridge I', url: A('turbo-cartridge-one.mp3') },
  { id: 'turbo-cartridge', name: 'Turbo Cartridge', url: A('turbo-cartridge.mp3') },
  { id: 'victory-pixel-parade', name: 'Victory Pixel Parade', url: A('victory-pixel-parade.mp3') },
  { id: 'final', name: 'Final', url: A('final.mp3') },
  { id: 'glitch-drift-quest-one', name: 'Glitch Drift Quest I', url: A('glitch-drift-quest-one.mp3') },
  { id: 'glitch-drift-quest', name: 'Glitch Drift Quest', url: A('glitch-drift-quest.mp3') },
  { id: 'turbo-cartridge-two', name: 'Turbo Cartridge II', url: A('turbo-cartridge-two.mp3') },
  { id: 'turbo-cartridge-three', name: 'Turbo Cartridge III', url: A('turbo-cartridge-three.mp3') },
  { id: 'pixel-quest', name: 'Pixel Quest', url: A('pixel-quest.mp3') },
  { id: 'coin-op-reaper', name: 'Coin Op Reaper', url: A('coin-op-reaper.mp3') },
  { id: 'neon-glitch', name: 'Neon Glitch', url: A('neon-glitch.mp3') },
];
const FIGHT_TRACKS = FIGHT_TRACK_LIBRARY.map(t => t.url);

// Grand Circuit track pool — only these tracks play during Grand Circuit matches.
// The "Final" track is reserved for the championship match.
export const GRAND_CIRCUIT_TRACKS = [
  A('boss-fight-circuit.mp3'),
  A('boss-raid.mp3'),
  A('boss-stage.mp3'),
  A('pixel-boss-showdown.mp3'),
  A('turbo-cartridge-three.mp3'),
  A('neon-glitch.mp3'),
];
export const GRAND_CIRCUIT_FINAL_TRACK = A('final.mp3');

// Singleton guard: if HMR reloads this module, reuse the existing instance so
// we don't create a second MusicManager whose audio plays alongside the old one.
class MusicManager {
  constructor() {
    // Reuse existing instance across HMR hot-reloads
    if (globalThis.__musicManagerInstance) return globalThis.__musicManagerInstance;
    globalThis.__musicManagerInstance = this;

    this.ctx = null;
    this.audioEl = null;
    this.volume = 0.3;
    this.currentScene = null;
    this.customTracks = {};
    this.fightIndex = 0;
    this.menuIndex = 0;
    this.muted = false;
    this._allAudioEls = []; // track every Audio element so stop() can kill them all

    // Browsers reject audio started before a click/tap. Retry the already chosen
    // track on that first interaction instead of leaving the homescreen silent.
    this._interactionHandler = () => {
      this.init();
      if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
      if (this.audioEl && this.audioEl.paused) this.audioEl.play().then(() => { this._pendingPlayback = false; }).catch(() => { this._pendingPlayback = true; });
    };
    this._pendingPlayback = false;
    window.addEventListener('pointerdown', this._interactionHandler);
    window.addEventListener('touchstart', this._interactionHandler, { passive: true });
    window.addEventListener('keydown', this._interactionHandler);

    // Reaper: kill ANY audio/video element on the page that this manager didn't create.
    // This guarantees only volume-bar-controlled music can ever play.
    this._killForeignMedia = () => {
      try {
        const all = document.querySelectorAll('audio, video');
        all.forEach(el => {
          if (!this._allAudioEls.includes(el) && !el.dataset.ekKeep) {
            el.muted = true;
            el.pause();
            el.src = '';
            el.load && el.load();
          }
        });
      } catch (e) { }
    };
    // Run once immediately so any audio already present is silenced at once.
    this._killForeignMedia();
    // Re-run on a short interval as a fallback.
    setInterval(() => this._killForeignMedia(), 250);
    // Observe DOM mutations so newly inserted audio/video is killed instantly.
    try {
      this._observer = new MutationObserver(() => this._killForeignMedia());
      this._observer.observe(document.documentElement || document.body || document, { childList: true, subtree: true });
    } catch (e) { }
  }

  init() {
    if (this.ctx) return;
    try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { }
  }

  setCustomTracks(tracks) { this.customTracks = tracks || {}; }

  // Play a specific track URL directly (used by Grand Circuit for curated music)
  playTrack(url) {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    if (!url) return;
    this._stopInternal();
    this.currentScene = 'custom';
    this.currentUrl = url;
    this.audioEl = new Audio(url);
    this.audioEl.preload = 'auto';
    this._allAudioEls.push(this.audioEl);
    this.audioEl.loop = true;
    this.audioEl.volume = this.muted ? 0 : this.volume;
    this.audioEl.load();
    this.audioEl.play().then(() => { this._pendingPlayback = false; }).catch(() => { this._pendingPlayback = true; });
  }

  play(sceneName) {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();

    // Overlap guard: if this exact scene is already playing with a live audio
    // element, don't start a second one. This prevents the homescreen (and any
    // other scene) from ever playing two tracks simultaneously.
    if (sceneName === this.currentScene && this.audioEl && !this.audioEl.paused) return;

    let url;
    if (this.customTracks[sceneName]) {
      url = this.customTracks[sceneName];
    } else if (sceneName === 'menu') {
      url = MENU_TRACKS[Math.floor(Date.now() / HOME_ROTATION_MS) % MENU_TRACKS.length];
    } else if (sceneName === 'story') {
      url = FIGHT_TRACKS[this.fightIndex % FIGHT_TRACKS.length];
    } else if (sceneName === 'parkour') {
      url = PARKOUR_TRACK;
    } else if (sceneName === 'rockclimb') {
      url = ROCKCLIMB_TRACK;
    } else if (sceneName === 'fight' || sceneName === 'soccer') {
      url = FIGHT_TRACKS[this.fightIndex % FIGHT_TRACKS.length];
    } else {
      url = MENU_TRACKS[Math.floor(Date.now() / HOME_ROTATION_MS) % MENU_TRACKS.length];
    }
    if (!url) return;

    // Second overlap guard: if the same URL is already playing, don't restart.
    if (this.currentUrl === url && this.audioEl && !this.audioEl.paused) return;

    this._stopInternal();
    this.currentScene = sceneName;
    this.currentUrl = url;

    if ((sceneName === 'fight' || sceneName === 'soccer' || sceneName === 'story') && !this.customTracks[sceneName]) {
      this.fightIndex = (this.fightIndex + 1) % FIGHT_TRACKS.length;
    }

    this.audioEl = new Audio(url);
    this.audioEl.preload = 'auto';
    this._allAudioEls.push(this.audioEl);
    this.audioEl.loop = true;
    this.audioEl.volume = this.muted ? 0 : this.volume;
    this.audioEl.load();
    this.audioEl.play().then(() => { this._pendingPlayback = false; }).catch(() => { this._pendingPlayback = true; });
  }

  // Internal stop — always halts playback. Used when switching to a new scene.
  _stopInternal() {
    for (const el of this._allAudioEls) {
      try { el.muted = true; el.pause(); el.src = ''; } catch (e) { }
    }
    this._allAudioEls = [];
    this.audioEl = null;
    this.currentScene = null;
    this.currentUrl = null;
  }

  // Public stop — called by sub-screen cleanup. When menu music is playing,
  // treat it as a no-op so returning to the homescreen doesn't silence the
  // track; play('fight') etc. still halt it via _stopInternal().
  stop() {
    if (this.currentScene === 'menu') return;
    this._stopInternal();
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, (vol / 100) * 0.8));
    // Apply to every tracked audio element — not just the current one
    for (const el of this._allAudioEls) {
      if (!this.muted) el.volume = this.volume;
    }
    if (this.audioEl && !this.muted) this.audioEl.volume = this.volume;
  }

  setMuted(muted) {
    this.muted = muted;
    for (const el of this._allAudioEls) {
      el.volume = muted ? 0 : this.volume;
    }
  }
}

export const music = new MusicManager();
