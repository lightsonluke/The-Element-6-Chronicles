// Music manager — MP3 file playback with scene-based management, looping, and custom uploads.
// AudioContext is kept for SFX compatibility (sfx.js uses music.ctx).

// All audio served from local public/audio/ directory
// BASE_URL keeps audio working from both localhost and a GitHub Pages project URL.
const A = (name) => `${import.meta.env.BASE_URL}audio/${name}`;

// Homescreen menu music cycle — rotates through these 6 tracks each visit.
const MENU_TRACKS = [
  A('nightshade.mp3'),    // Night Shade (original)
  A('pixelrebound.mp3'),  // Pixel Rebound
  A('turbocartridge.mp3'),// Turbo Cartridge
  A('cherrycola.mp3'),   // Cherry Cola
  A('josa.mp3'),          // Josa
  A('medium.mp3'),        // Medium
];
const PARKOUR_TRACK = A('robotcity.mp3');
const ROCKCLIMB_TRACK = A('powerup.mp3');
// Built-in fight/sports track library. New tracks are selectable presets
// in Settings → Fight & Sports Music (and join the auto-rotation).
export const FIGHT_TRACK_LIBRARY = [
  { id: 'powerup', name: 'Power Up', url: A('powerup.mp3') },
  { id: 'dubhub', name: 'Dub Hub', url: A('dubhub.mp3') },
  { id: 'robotcity', name: 'Robot City', url: A('robotcity.mp3') },
  { id: 'cherrycola', name: 'Cherry Cola', url: A('cherrycola.mp3') },
  { id: 'actionman', name: 'Action Man', url: A('actionman.mp3') },
  { id: 'pixelrush', name: 'Pixel Rush', url: A('pixelrush.mp3') },
  { id: 'victoryparade', name: 'Victory Parade', url: A('victoryparade.mp3') },
  { id: 'glitchdrift', name: 'Glitch Drift', url: A('glitchdrift.mp3') },
  { id: 'turbocart', name: 'Turbo Cartridge', url: A('turbocartridge.mp3') },
  { id: 'bossraid', name: 'Boss Raid', url: A('bossraid.mp3') },
  { id: 'quick', name: 'Quick', url: A('quick.mp3') },
  { id: 'final', name: 'Final', url: A('final.mp3') },
  { id: 'bossstage', name: 'Boss Stage', url: A('bossstage.mp3') },
  { id: 'pixeldrift', name: 'Pixel Drift', url: A('pixeldrift.mp3') },
  { id: 'josa', name: 'Josa', url: A('josa.mp3') },
  { id: 'medium', name: 'Medium', url: A('medium.mp3') },
  { id: 'pixelrebound', name: 'Pixel Rebound', url: A('pixelrebound.mp3') },
  { id: 'pixelheartrush', name: 'Pixel Heart Rush', url: A('pixelheartrush.mp3') },
  { id: 'growingpixel', name: 'Growing Pixel', url: A('growingpixel.mp3') },
  { id: 'pixelbossshowdown', name: 'Pixel Boss Showdown', url: A('pixelbossshowdown.mp3') },
];
const FIGHT_TRACKS = FIGHT_TRACK_LIBRARY.map(t => t.url);

// Grand Circuit track pool — only these tracks play during Grand Circuit matches.
// The "Final" track is reserved for the championship match.
export const GRAND_CIRCUIT_TRACKS = [
  A('turbocartridge.mp3'), // Turbo Cartridge
  A('bossraid.mp3'),       // Boss Raid
  A('pixelrush.mp3'),      // Pixel Rush
  A('quick.mp3'),          // Quick
  A('bossstage.mp3'),      // Boss Stage
  A('pixeldrift.mp3'),     // Pixel Drift
  A('josa.mp3'),           // Josa
  A('medium.mp3'),         // Medium
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
