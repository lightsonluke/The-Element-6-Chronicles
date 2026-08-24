import db from './localBackend';

// Music manager — MP3 file playback with scene-based management, looping, and custom uploads.
// AudioContext is kept for SFX compatibility (sfx.js uses music.ctx).

// Homescreen menu music cycle — rotates through these 6 tracks each visit.
const MENU_TRACKS = [
  '', // Night Shade (original)
  '',                                   // Pixel Rebound
  '',                                  // Turbo Cartridge
  '',    // Cherry Cola
  '',                                            // Josa
  '',                                          // Medium
];
const PARKOUR_TRACK = '';
const ROCKCLIMB_TRACK = '';
// Built-in fight/sports track library. New tracks are selectable presets
// in Settings → Fight & Sports Music (and join the auto-rotation).
export const FIGHT_TRACK_LIBRARY = [
  { id: 'powerup', name: 'Power Up', url: '' },
  { id: 'dubhub', name: 'Dub Hub', url: '' },
  { id: 'robotcity', name: 'Robot City', url: '' },
  { id: 'cherrycola', name: 'Cherry Cola', url: '' },
  { id: 'actionman', name: 'Action Man', url: '' },
  { id: 'pixelrush', name: 'Pixel Rush', url: '' },
  { id: 'victoryparade', name: 'Victory Parade', url: '' },
  { id: 'glitchdrift', name: 'Glitch Drift', url: '' },
  { id: 'turbocart', name: 'Turbo Cartridge', url: '' },
  { id: 'bossraid', name: 'Boss Raid', url: '' },
  { id: 'quick', name: 'Quick', url: '' },
  { id: 'final', name: 'Final', url: '' },
  { id: 'bossstage', name: 'Boss Stage', url: '' },
  { id: 'pixeldrift', name: 'Pixel Drift', url: '' },
  { id: 'josa', name: 'Josa', url: '' },
  { id: 'medium', name: 'Medium', url: '' },
  { id: 'pixelrebound', name: 'Pixel Rebound', url: '' },
  { id: 'pixelheartrush', name: 'Pixel Heart Rush', url: '' },
  { id: 'growingpixel', name: 'Growing Pixel', url: '' },
  { id: 'pixelbossshowdown', name: 'Pixel Boss Showdown', url: '' },
];
const FIGHT_TRACKS = FIGHT_TRACK_LIBRARY.map(t => t.url);

// Grand Circuit track pool — only these tracks play during Grand Circuit matches.
// The "Final" track is reserved for the championship match.
export const GRAND_CIRCUIT_TRACKS = [
  '', // Turbo Cartridge
  '',         // Boss Raid
  '',      // Pixel Rush
  '',          // Quick
  '',      // Boss Stage
  '',      // Pixel Drift
  '',            // Josa
  '',         // Medium
];
export const GRAND_CIRCUIT_FINAL_TRACK = '';

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

    this._interactionHandler = () => { this.init(); if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); };
    window.addEventListener('click', this._interactionHandler, { once: true });
    window.addEventListener('keydown', this._interactionHandler, { once: true });

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
    this._allAudioEls.push(this.audioEl);
    this.audioEl.loop = true;
    this.audioEl.volume = this.muted ? 0 : this.volume;
    this.audioEl.play().catch(() => { });
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
    } else if (sceneName === 'menu' || sceneName === 'story') {
      url = MENU_TRACKS[this.menuIndex % MENU_TRACKS.length];
    } else if (sceneName === 'parkour') {
      url = PARKOUR_TRACK;
    } else if (sceneName === 'rockclimb') {
      url = ROCKCLIMB_TRACK;
    } else if (sceneName === 'fight' || sceneName === 'soccer') {
      url = FIGHT_TRACKS[this.fightIndex % FIGHT_TRACKS.length];
    } else {
      url = MENU_TRACKS[this.menuIndex % MENU_TRACKS.length];
    }
    if (!url) return;

    // Second overlap guard: if the same URL is already playing, don't restart.
    if (this.currentUrl === url && this.audioEl && !this.audioEl.paused) return;

    this._stopInternal();
    this.currentScene = sceneName;
    this.currentUrl = url;

    if (sceneName === 'menu' || sceneName === 'story') {
      this.menuIndex = (this.menuIndex + 1) % MENU_TRACKS.length;
    }
    if ((sceneName === 'fight' || sceneName === 'soccer') && !this.customTracks[sceneName]) {
      this.fightIndex = (this.fightIndex + 1) % FIGHT_TRACKS.length;
    }

    this.audioEl = new Audio(url);
    this._allAudioEls.push(this.audioEl);
    this.audioEl.loop = true;
    this.audioEl.volume = this.muted ? 0 : this.volume;
    this.audioEl.play().catch(() => { });
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