import db from './localBackend';

// Module-level progress + cloud-save helpers extracted from Game.jsx to keep
// the main page under the edit-size cap. Pure, self-contained, no React.

export const DEFAULT_PROGRESS = {
  worldSeed: null,
  unlockedIds: ['yellow'],
  defeatedVillains: [],
  favoriteId: null,
  favoriteIds: [],
  coins: 0,
  ownedAccessories: [],
  equippedAccessories: {},
  ownedSkins: [],
  equippedSkins: {},
  stats: {},
  moveStats: {},
  claimedFightQuests: [],
  fightQuestTier: 0,
  customStage: null,
  customStages: [],
  rankedRating: 1000,
  onlineRankedRating: 1000,
  ownedKillFX: [],
  equippedKillFX: 'none',
  clips: [],
  charLevels: {},
  equippedElements: {},
  eventProgress: {},
  dailyQuests: null,
  settings: { theme: 'default', displayMode: 'dark', defaultCPUDifficulty: 'regular', autoSelectFavorite: true, showDamageNumbers: true, screenShake: true, musicVolume: 50, sfxVolume: 70, killFXEnabled: true, disableEventBackground: false,
    matchTime: 240, cameraZoom: 'normal', showBlastZones: true, showNametags: true, reducedMotion: false, bgParticleDensity: 30, autoPauseFocus: true, aiAggression: 50, defaultGameMode: 'regular', comboCounter: true, showFPS: false, customMusic: {}, penaltiesInsteadOfSuddenDeath: false, mobileMode: false },
  ownedPacks: [],
  ownedTitles: [],
  equippedTitle: null,
  battlePassPlus: false,
  playtimeSeconds: 0,
  trophies: { fight: 0, sport: 0 },
  ownedCrossovers: [],
  equippedCrossovers: {},
  ownedShikigami: [],
  equippedShikigami: {},
  customCharSlots: 3,
  charMastery: {},
};

export const STORY_FIELDS = ['defeatedVillains', 'playerX', 'playerY', 'inventory', 'hotbar', 'currentHeroId', 'blockMods', 'worldSeed'];

let _activeStorySlot = null;
let _cloudSaveTimer = null;
let _lastProgress = null;

export function getActiveStorySlot() { return _activeStorySlot; }
export function setActiveStorySlot(v) { _activeStorySlot = v; }

export function loadProgress() {
  try {
    const saved = localStorage.getItem('element6_progress');
    if (saved) {
      const p = { ...DEFAULT_PROGRESS, ...JSON.parse(saved) };
      // Auto-delete duplicate items everywhere
      p.unlockedIds = [...new Set(p.unlockedIds || [])];
      p.ownedAccessories = [...new Set(p.ownedAccessories || [])];
      p.ownedSkins = [...new Set(p.ownedSkins || [])];
      // ── Skins removed from the game: refund owned (non-mastery) skins as tokens ──
      if (p.ownedSkins && p.ownedSkins.length > 0) {
        const removed = p.ownedSkins.filter(id => !id.startsWith('mastery_'));
        if (removed.length > 0) {
          p.coins = (p.coins || 0) + removed.length * 150; // flat 150-token refund per skin
        }
        p.ownedSkins = p.ownedSkins.filter(id => id.startsWith('mastery_'));
      }
      if (p.equippedSkins) {
        const kept = {};
        for (const [cid, sid] of Object.entries(p.equippedSkins)) {
          if (sid && sid.startsWith('mastery_')) kept[cid] = sid;
        }
        p.equippedSkins = kept;
      }
      p.ownedKillFX = [...new Set(p.ownedKillFX || [])];
      p.ownedPacks = [...new Set(p.ownedPacks || [])];
      p.ownedTitles = [...new Set(p.ownedTitles || [])];
      p.ownedCrossovers = [...new Set(p.ownedCrossovers || [])];
      p.ownedShikigami = [...new Set(p.ownedShikigami || [])];
      return p;
    }
  } catch {}
  return { ...DEFAULT_PROGRESS };
}

async function _doCloudSave(prog) {
  try {
    const me = await db.auth.me();
    if (!me) return;
    const existing = await db.entities.UserProgress.filter({ user_id: me.id });
    const json = JSON.stringify(prog);
    if (existing[0]) await db.entities.UserProgress.update(existing[0].id, { progress_json: json });
    else await db.entities.UserProgress.create({ user_id: me.id, progress_json: json });
  } catch {}
}

export function saveProgress(prog) {
  const withTs = { ...prog, _lastSavedAt: Date.now() };
  _lastProgress = withTs;
  try {
    localStorage.setItem('element6_progress', JSON.stringify(withTs));
    if (_activeStorySlot != null) {
      const storyData = { _savedAt: Date.now() };
      STORY_FIELDS.forEach(f => { if (withTs[f] !== undefined) storyData[f] = withTs[f]; });
      localStorage.setItem(`element6_story_slot_${_activeStorySlot}`, JSON.stringify(storyData));
    }
  } catch {}
  if (_cloudSaveTimer) clearTimeout(_cloudSaveTimer);
  _cloudSaveTimer = setTimeout(() => { _cloudSaveTimer = null; _doCloudSave(_lastProgress); }, 1000);
}

export function flushCloudSave() {
  if (_cloudSaveTimer) { clearTimeout(_cloudSaveTimer); _cloudSaveTimer = null; }
  if (_lastProgress) _doCloudSave(_lastProgress);
}