import db from './localBackend';

import React, { useState, useRef, useEffect } from 'react';
import MainMenu from './MainMenu.jsx';
import ModeSelect from './ModeSelect.jsx';
import CharacterSelect from './CharacterSelect.jsx';
import MapSelect from './MapSelect.jsx';
import PlatformFighter from './PlatformFighter.jsx';
import StoryMode from './StoryMode.jsx';
import HeroCodex from './HeroCodex.jsx';
import PrologueCutscene from './PrologueCutscene.jsx';
import TournamentMode from './TournamentMode.jsx';
import TrainingMode from './TrainingMode.jsx';
import Tutorial from './Tutorial.jsx';
import SaveCodes from './SaveCodes.jsx';
import Shop from './Shop.jsx';
import StageEditor from './StageEditor.jsx';
import FightingQuests from './FightingQuests.jsx';
import Settings from './Settings.jsx';
import OnlineSettings from './OnlineSettings.jsx';
import SoccerMode from './SoccerMode.jsx';
import { calculateSoccerXP } from './SoccerMatchReview.jsx';
import SportsHub from './SportsHub.jsx';
import HowToPlay from './HowToPlay.jsx';
import { calculateSportXP } from './sports.js';
import TeamMode from './TeamMode.jsx';
import MeetCharacters from './MeetCharacters.jsx';
import DailyQuests from './DailyQuests.jsx';
import StorySaveSlots from './StorySaveSlots.jsx';
import EditCharacters from './EditCharacters.jsx';
import EventsScreen from './EventsScreen.jsx';
import EquipScreen from './EquipScreen.jsx';
import LoadingScreen from './LoadingScreen.jsx';
import CustomBattle from './CustomBattle.jsx';
import WinScreen from './WinScreen.jsx';
import CommunityHub from './CommunityHub.jsx';
import Sandbox from './Sandbox.jsx';
import CreatorMode from './CreatorMode.jsx';
import AboutTheGame from './AboutTheGame.jsx';
import GrandCircuit from './GrandCircuit.jsx';
import LoreLibrary from './LoreLibrary.jsx';
import DailyRewards from './DailyRewards.jsx';
import ComboTrainer from './ComboTrainer.jsx';
import OnlineSportsLobby from './OnlineSportsLobby.jsx';
import BattleRoyaleLobby from './BattleRoyaleLobby.jsx';
import ShapeshiftSelect from './ShapeshiftSelect.jsx';

import CharacterCreator from './CharacterCreator.jsx';
import FriendsScreen from './FriendsScreen.jsx';
import ChatPanel from './ChatPanel.jsx';
import OnlineLobby from './OnlineLobby.jsx';
import LANLobby from './LANLobby.jsx';
import CustomRoomLobby from './CustomRoomLobby.jsx';
import Leaderboard from './Leaderboard.jsx';
import MatchReview from './MatchReview.jsx';

import LeaderboardHall from './LeaderboardHall.jsx';
import FlyerBoard from './FlyerBoard.jsx';
import ControllerSettings from './ControllerSettings.jsx';
import VirtualKeyboard from './VirtualKeyboard.jsx';
import HubServerSelect from './HubServerSelect.jsx';
import HubCharSelect from './HubCharSelect.jsx';
import { buildCustomNumberMap } from './characterNumber.js';
import { recordMasteryWin, recordMasteryPlaytime } from './mastery.js';
import { ALL_CHARS } from './allCharacters.js';

import MatchRewards, { calculateBattleXP } from './MatchRewards.jsx';
import { getActiveEvent } from './events.js';
import { music } from './music.js';
import { sfx } from './sfx.js';
import { ELEMENTS, getCharLevelData, getUnlockedElements, applyElement, xpForLevel, MAX_LEVEL } from './elements.js';
import { HEROES } from './heroes.js';
import { VILLAINS } from './villains.js';
import { GUARDIANS } from './guardians.js';
import { ERAS } from './eras.js';
import { charPrice } from './charPrices.js';
import { getAccessory, accessoriesFor, ACCESSORIES } from './cosmetics.js';
import { getSkin, skinsForChar, SKINS } from './skins.js';
import { CROSSOVERS, getCrossover } from './crossovers.js';
import { getKillFX, KILL_FX as KILL_FX_LIST } from './killFX.js';
import { getShikigami } from './shikigami.js';
import { getEmoteById, EMOTES as ALL_EMOTES } from './emotes.js';
import { generateDailyQuests, getTodayKey, needsDailyReset } from './dailyQuests.js';
import { applyUiTheme } from './uiThemes.js';
import { setCustomBackdropUrl, clearCustomBackdrop } from './customBackdrop.js';
import { formatNumber } from './formatNumber.js';
import TouchControls from './TouchControls.jsx';
import { useGamepadMenuNav } from './useGamepadMenuNav.js';
import { getKeybinds } from './keybinds.js';
import UsernamePrompt from './UsernamePrompt.jsx';
import GameIcon from "./GameIcon.jsx";

// Screens where a canvas game is actively running and the gamepad is used
// for gameplay. Menu navigation is disabled ONLY on these screens so the
// controller can drive the character; every other menu / lobby / shop /
// settings screen is fully navigable with the gamepad.
const GAME_SCREENS = ['fighting', 'soccer', 'sports', 'training', 'tutorial', 'team'];

const DEFAULT_PROGRESS = {
  unlockedIds: ['yellow'],
  defeatedVillains: [],
  favoriteId: null,
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
    matchTime: 240, cameraZoom: 'normal', showBlastZones: true, showNametags: true, reducedMotion: false, bgParticleDensity: 30, autoPauseFocus: true, aiAggression: 50, defaultGameMode: 'regular', comboCounter: true, showFPS: false, customMusic: {}, penaltiesInsteadOfSuddenDeath: false, mobileMode: false, uiEra: 'dynamic', hideStockBoxes: false, hideStageAndMode: false, hideCountdown: false, hideTopUsername: false },
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
  customCharSlots: 3, // starts with 3, can buy up to 10
};

function loadProgress() {
  try {
    const saved = localStorage.getItem('element6_progress');
    if (saved) {
      const p = { ...DEFAULT_PROGRESS, ...JSON.parse(saved) };
      // Auto-delete duplicate items everywhere
      p.unlockedIds = [...new Set(p.unlockedIds || [])];
      p.ownedAccessories = [...new Set(p.ownedAccessories || [])];
      p.ownedSkins = [...new Set(p.ownedSkins || [])];
      p.ownedKillFX = [...new Set(p.ownedKillFX || [])];
      p.ownedPacks = [...new Set(p.ownedPacks || [])];
      p.ownedTitles = [...new Set(p.ownedTitles || [])];
      p.ownedCrossovers = [...new Set(p.ownedCrossovers || [])];
      // Merge owned crossovers into unlockedIds so they appear as playable characters
      p.unlockedIds = [...new Set([...(p.unlockedIds || []), ...(p.ownedCrossovers || [])])];
      p.ownedShikigami = [...new Set(p.ownedShikigami || [])];
      return p;
    }
  } catch {}
  return { ...DEFAULT_PROGRESS };
}
let _activeStorySlot = null;
const STORY_FIELDS = ['defeatedVillains', 'playerX', 'playerY', 'inventory', 'hotbar', 'currentHeroId', 'blockMods'];

// Debounce cloud saves to avoid hammering the DB on rapid updates
let _cloudSaveTimer = null;
let _lastProgress = null;

async function _doCloudSave(prog) {
  try {
    const { default: b44 } = await import('./localBackend.js');
    const me = await b44.auth.me();
    if (!me) return;
    const existing = await b44.entities.UserProgress.filter({ user_id: me.id });
    const json = JSON.stringify(prog);
    if (existing[0]) {
      await b44.entities.UserProgress.update(existing[0].id, { progress_json: json });
    } else {
      await b44.entities.UserProgress.create({ user_id: me.id, progress_json: json });
    }
  } catch {}
}

function saveProgress(prog) {
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
  // Cloud-save (debounced, 1 second delay for faster persistence)
  if (_cloudSaveTimer) clearTimeout(_cloudSaveTimer);
  _cloudSaveTimer = setTimeout(() => { _cloudSaveTimer = null; _doCloudSave(_lastProgress); }, 1000);
}

// Flush any pending cloud save immediately — used when the tab is hidden or closed
// so settings/progress persist even if the user leaves before the debounce fires.
function flushCloudSave() {
  if (_cloudSaveTimer) { clearTimeout(_cloudSaveTimer); _cloudSaveTimer = null; }
  if (_lastProgress) _doCloudSave(_lastProgress);
}

const ALL = [...ALL_CHARS];

const TOUCH_SCREENS = ['fighting', 'soccer', 'sports', 'training', 'tutorial', 'lan', 'team', 'customrooms', 'experimental', 'sportslobby'];

export default function Game() {
  const [screen, setScreen] = useState('menu');
  const [returnScreen, setReturnScreen] = useState('menu');
  const [hubServer, setHubServer] = useState(null);
  const [fighters, setFighters] = useState(null);
  const [pending, setPending] = useState(null); // { mode, p1, p2, isCPU, difficulty }
  const [onlineMode, setOnlineMode] = useState('unranked'); // ranked | unranked | soccer
  const [showCutscene, setShowCutscene] = useState(!localStorage.getItem('element6_progress'));
  const [progress, setProgress] = useState(loadProgress);
  const [tokenFlash, setTokenFlash] = useState(null);
  const [storyRewardToast, setStoryRewardToast] = useState(null);
  const [battleResult, setBattleResult] = useState(null);
  const [playCampaign, setPlayCampaign] = useState(null);
  const [winData, setWinData] = useState(null);
  const [soccerResult, setSoccerResult] = useState(null);
  const [userProfile, setUserProfile] = useState({ username: '', title: '' });
  const [pendingDM, setPendingDM] = useState(null);
  const [customCharData, setCustomCharData] = useState({});
  const [customNumberMap, setCustomNumberMap] = useState({});
  const [unreadCount, setUnreadCount] = useState(0);
  const [chatToast, setChatToast] = useState(null);
  const [usernameToast, setUsernameToast] = useState(null); // { oldName, newName }
  const [matchRequestToast, setMatchRequestToast] = useState(null); // { req } incoming match invite
  const [pendingMatchRequest, setPendingMatchRequest] = useState(null); // accepted request ready to launch
  const [tradeGiftToast, setTradeGiftToast] = useState(null); // incoming gift or trade request notification
  const [customRoomMode, setCustomRoomMode] = useState('fight'); // fight | soccer | volleyball | baseball
  const [onlineSport, setOnlineSport] = useState(null);        // sportId for online sports lobby
  const [onlineSportsLobby, setOnlineSportsLobby] = useState(null);
  const [onlineSportsRole, setOnlineSportsRole] = useState(null);
  const [onlineSportsMatchId, setOnlineSportsMatchId] = useState(null);
  const [me, setMe] = useState(null);
  const [showDailyReward, setShowDailyReward] = useState(false);
  const chatSeenRef = useRef({});
  const chatInitRef = useRef(false);
  const prevUnreadRef = useRef(0);
  const onChatScreenRef = useRef(false);

  // Controller menu navigation — active everywhere. During active matches each
  // game component sets window.__el6GameplayActive to suppress menu-nav so the
  // gamepad drives the fighter; pausing/finishing clears it so buttons are clickable.
  useGamepadMenuNav(progress?.settings?.controllerEnabled !== false);

  // Fetch current user for online sports lobby
  useEffect(() => { db.auth.me().then(u => setMe(u)).catch(() => {}); }, []);

  // ── Navigation history — every Back button returns to the previous screen ──
  // Forward navigation (setScreen) auto-records where we came from; goBack() pops
  // back to it. Reaching the menu clears the stack (menu is home base), so post-match
  // exits that dump you to the menu don't leave stale match screens in the history.
  const historyRef = useRef([]);
  const prevScreenRef = useRef(screen);
  const suppressHistoryRef = useRef(false);
  useEffect(() => {
    const prev = prevScreenRef.current;
    if (suppressHistoryRef.current) {
      suppressHistoryRef.current = false;
    } else if (prev !== screen && screen !== 'menu') {
      historyRef.current.push(prev);
    }
    prevScreenRef.current = screen;
    if (screen === 'menu') historyRef.current = [];
  }, [screen]);
  const goBack = () => {
    let back = historyRef.current.length ? historyRef.current.pop() : 'menu';
    if (back === screen && historyRef.current.length) back = historyRef.current.pop();
    if (back !== screen) { suppressHistoryRef.current = true; setScreen(back); }
  };

  const updateLeaderboard = async (mode, data, xp = 0) => {
    try {
      const user = await db.auth.me();
      if (!user) return;
      const entries = await db.entities.LeaderboardEntry.filter({ user_id: user.id });
      let entry = entries[0];
      if (!entry) {
        entry = await db.entities.LeaderboardEntry.create({
          user_id: user.id,
          user_name: user.full_name || (user.email || 'Player').split('@')[0],
          total_xp: 0, soccer_xp: 0, combat_xp: 0, wins: 0, losses: 0,
          soccer_goals: 0, soccer_saves: 0, soccer_shots: 0, soccer_shots_on_target: 0, soccer_count: 0,
          combat_kills: 0, combat_deaths: 0, fight_count: 0,
          baseball_xp: 0, baseball_count: 0, baseball_runs: 0, baseball_hits: 0,
          volleyball_xp: 0, volleyball_count: 0, volleyball_spikes: 0, volleyball_digs: 0,
          tennis_xp: 0, tennis_count: 0, tennis_points: 0, tennis_aces: 0,
          track_xp: 0, track_count: 0, track_best_time: 0,
          basketball_xp: 0, basketball_count: 0, basketball_points: 0, basketball_assists: 0, basketball_steals: 0, basketball_rebounds: 0,
          dodgeball_xp: 0, dodgeball_count: 0, dodgeball_hits: 0, dodgeball_throws: 0, dodgeball_super_throws: 0, dodgeball_dodges: 0,
        });
      }
      const won = data.p1Won === true;
      const set1 = (base, val) => { entry[base] = (entry[base] || 0) + val; };
      if (mode === 'soccer') {
        const s = data.soccerStats?.p1 || {};
        set1('soccer_count', 1); set1('soccer_goals', s.goals || 0); set1('soccer_saves', s.saves || 0);
        set1('soccer_shots', s.shots || 0); set1('soccer_shots_on_target', s.shotsOnTarget || 0); set1('soccer_xp', xp);
      } else if (mode === 'baseball') {
        const s = data.stats || {}; set1('baseball_count', 1); set1('baseball_runs', s.runs || 0); set1('baseball_hits', s.hits || 0); set1('baseball_xp', xp);
      } else if (mode === 'volleyball') {
        const s = data.stats || {}; set1('volleyball_count', 1); set1('volleyball_spikes', s.spikes || 0); set1('volleyball_digs', s.digs || 0); set1('volleyball_xp', xp);
      } else if (mode === 'tennis') {
        const s = data.stats || {}; set1('tennis_count', 1); set1('tennis_points', s.points || 0); set1('tennis_aces', s.aces || 0); set1('tennis_xp', xp);
      } else if (mode === 'track') {
        const s = data.stats || {}; set1('track_count', 1);
        const best = entry.track_best_time || 0; if (s.time && (!best || s.time < best)) entry.track_best_time = s.time;
        set1('track_xp', xp);
      } else if (mode === 'basketball') {
        const s = data.stats || {}; set1('basketball_count', 1); set1('basketball_points', s.pointsScored || 0); set1('basketball_assists', s.assists || 0); set1('basketball_steals', s.steals || 0); set1('basketball_rebounds', s.rebounds || 0); set1('basketball_xp', xp);
      } else if (mode === 'dodgeball') {
        const s = data.stats || {}; set1('dodgeball_count', 1); set1('dodgeball_hits', s.hits || 0); set1('dodgeball_throws', s.throws || 0); set1('dodgeball_super_throws', s.superThrows || 0); set1('dodgeball_dodges', s.dodges || 0); set1('dodgeball_xp', xp);
      } else if (mode === 'zipline') {
        // single-player survival — no win/loss or fight bookkeeping; only total_xp below
      } else if (mode === 'banger') {
        // team-elimination — wins/losses tracked below; no fight/combat column
      } else {
        entry.fight_count = (entry.fight_count || 0) + 1;
        if (won) entry.combat_kills = (entry.combat_kills || 0) + 1;
        else entry.combat_deaths = (entry.combat_deaths || 0) + 1;
        entry.combat_xp = (entry.combat_xp || 0) + xp;
      }
      entry.total_xp = (entry.total_xp || 0) + xp;
      if (won) entry.wins = (entry.wins || 0) + 1;
      else entry.losses = (entry.losses || 0) + 1;
      await db.entities.LeaderboardEntry.update(entry.id, entry);
    } catch {}
  };
  const progressRef = useRef(progress);
  useEffect(() => { music.setCustomTracks(progress?.settings?.customMusic || {}); }, [progress?.settings?.customMusic]);
  // Load (or clear) the custom backdrop image so it persists across reloads
  useEffect(() => {
    const url = progress?.settings?.customBackdrop;
    if (url) setCustomBackdropUrl(url); else clearCustomBackdrop();
  }, [progress?.settings?.customBackdrop]);
  progressRef.current = progress;
  const activeEvent = getActiveEvent();
  const eventColor = activeEvent?.color || '#7744FF';
  const disableEventBg = progress?.settings?.disableEventBackground === true;
  const effectiveEventColor = disableEventBg ? '#7744FF' : eventColor;
  const activeStorySlotRef = useRef(null);
  const [storySlots, setStorySlots] = useState(() => {
    const slots = [];
    for (let i = 0; i < 3; i++) {
      try { const d = localStorage.getItem(`element6_story_slot_${i}`); slots.push(d ? JSON.parse(d) : null); } catch { slots.push(null); }
    }
    return slots;
  });

  const refreshStorySlots = () => {
    const slots = [];
    for (let i = 0; i < 3; i++) {
      try { const d = localStorage.getItem(`element6_story_slot_${i}`); slots.push(d ? JSON.parse(d) : null); } catch { slots.push(null); }
    }
    setStorySlots(slots);
  };

  const update = (patch) => {
    setProgress(prev => {
      const next = { ...prev, ...patch };
      saveProgress(next);
      return next;
    });
  };

  const unlockHero = (id) => {
    setProgress(prev => {
      if (prev.unlockedIds.includes(id)) return prev;
      const next = { ...prev, unlockedIds: [...prev.unlockedIds, id] };
      saveProgress(next);
      return next;
    });
  };
  const unlockVillain = unlockHero;
  const unlockAll = () => {
    setProgress(prev => {
      const all = [...HEROES.map(h => h.id), ...VILLAINS.map(v => v.id), ...GUARDIANS.map(g => g.id)];
      const charLevels = { ...(prev.charLevels || {}) };
      all.forEach(id => { charLevels[id] = { level: 50, xp: 0 }; });
      const next = {
        ...prev,
        unlockedIds: [...new Set([...prev.unlockedIds, ...all])],
        ownedAccessories: [...new Set([...(prev.ownedAccessories || []), ...ACCESSORIES.map(a => a.id)])],
        ownedSkins: [...new Set([...(prev.ownedSkins || []), ...SKINS.map(s => s.id)])],
        ownedKillFX: [...new Set([...(prev.ownedKillFX || []), ...KILL_FX_LIST.filter(k => k.price > 0).map(k => k.id)])],
        charLevels,
      };
      saveProgress(next);
      return next;
    });
  };

  const buyCharacter = (charId) => {
    const price = charPrice(charId);
    setProgress(prev => {
      if ((prev.unlockedIds || []).includes(charId)) return prev;
      if ((prev.coins || 0) < price) return prev;
      const next = { ...prev, coins: prev.coins - price, unlockedIds: [...prev.unlockedIds, charId] };
      saveProgress(next);
      return next;
    });
  };

  const setFavorite = (id) => update({ favoriteId: id });
  const addCoins = (n) => {
    setProgress(prev => { const next = { ...prev, coins: (prev.coins || 0) + n }; saveProgress(next); return next; });
    if (n > 0) { setTokenFlash(n); setTimeout(() => setTokenFlash(null), 2500); }
  };
  const addXP = (charId, xp) => {
    if (!charId || xp <= 0) return;
    setProgress(prev => {
      const levels = { ...(prev.charLevels || {}) };
      const cd = levels[charId] || { level: 1, xp: 0 };
      let nl = cd.level; let nxp = (cd.xp || 0) + xp;
      while (nl < MAX_LEVEL && nxp >= xpForLevel(nl)) { nxp -= xpForLevel(nl); nl++; }
      levels[charId] = { ...cd, level: nl, xp: nxp };
      const next = { ...prev, charLevels: levels };
      saveProgress(next); return next;
    });
  };

  const buyAccessory = (accId) => {
    const a = getAccessory(accId);
    if (!a) return;
    setProgress(prev => {
      if ((prev.ownedAccessories || []).includes(accId)) return prev;
      if ((prev.coins || 0) < a.price) return prev;
      const next = { ...prev, coins: prev.coins - a.price, ownedAccessories: [...(prev.ownedAccessories || []), accId] };
      saveProgress(next);
      return next;
    });
  };
  const equipAccessory = (charId, accId) => {
    setProgress(prev => {
      const eq = { ...(prev.equippedAccessories || {}) };
      // Migrate legacy single-value format to array
      const current = Array.isArray(eq[charId]) ? [...eq[charId]] : (eq[charId] ? [eq[charId]] : []);
      if (!accId) {
        delete eq[charId];
      } else {
        const idx = current.indexOf(accId);
        if (idx >= 0) {
          current.splice(idx, 1);
          if (current.length > 0) eq[charId] = current; else delete eq[charId];
        } else {
          if (current.length >= 4) current.shift();
          current.push(accId);
          eq[charId] = current;
        }
      }
      const next = { ...prev, equippedAccessories: eq };
      saveProgress(next);
      return next;
    });
  };

  const buySkin = (skinId) => {
    const sk = getSkin(skinId);
    if (!sk) return;
    setProgress(prev => {
      if ((prev.ownedSkins || []).includes(skinId)) return prev;
      if ((prev.coins || 0) < sk.price) return prev;
      const next = { ...prev, coins: prev.coins - sk.price, ownedSkins: [...(prev.ownedSkins || []), skinId] };
      saveProgress(next);
      return next;
    });
  };
  const equipSkin = (charId, skinId) => {
    setProgress(prev => {
      const eq = { ...(prev.equippedSkins || {}) };
      if (skinId) eq[charId] = skinId; else delete eq[charId];
      const next = { ...prev, equippedSkins: eq };
      saveProgress(next);
      return next;
    });
  };

  const buyKillFX = (fxId) => {
    const fx = getKillFX(fxId);
    if (!fx) return;
    setProgress(prev => {
      if ((prev.ownedKillFX || []).includes(fxId)) return prev;
      if ((prev.coins || 0) < fx.price) return prev;
      const next = { ...prev, coins: prev.coins - fx.price, ownedKillFX: [...(prev.ownedKillFX || []), fxId] };
      saveProgress(next);
      return next;
    });
  };
  const equipKillFX = (fxId) => {
    setProgress(prev => {
      const next = { ...prev, equippedKillFX: fxId };
      saveProgress(next);
      return next;
    });
  };

  const equipElement = (charId, elementId) => {
    setProgress(prev => {
      const eq = { ...(prev.equippedElements || {}) };
      if (elementId && elementId !== 'basic') eq[charId] = elementId; else delete eq[charId];
      const next = { ...prev, equippedElements: eq };
      saveProgress(next);
      return next;
    });
  };

  // Equip a profile title (also persists to the user record for multiplayer display)
  const equipTitle = (titleId) => {
    setProgress(prev => { const next = { ...prev, equippedTitle: titleId }; saveProgress(next); return next; });
    db.auth.updateMe({ profile_title: titleId || '' }).catch(() => {});
    sfx.click();
  };

  // Crossover buy/equip — crossovers are thematic cosmetic skins
  const buyCrossover = (crossoverId) => {
    setProgress(prev => {
      if ((prev.ownedCrossovers || []).includes(crossoverId)) return prev;
      const cx = getCrossover(crossoverId);
      if (!cx) return prev;
      if ((prev.coins || 0) < cx.price) return prev;
      const next = { ...prev, coins: prev.coins - cx.price, ownedCrossovers: [...(prev.ownedCrossovers || []), crossoverId], unlockedIds: [...new Set([...(prev.unlockedIds || []), crossoverId])] };
      saveProgress(next);
      return next;
    });
  };
  const equipCrossover = (charId, crossoverId) => {
    setProgress(prev => {
      const eq = { ...(prev.equippedCrossovers || {}) };
      if (crossoverId) eq[charId] = crossoverId; else delete eq[charId];
      const next = { ...prev, equippedCrossovers: eq };
      saveProgress(next);
      return next;
    });
    sfx.click();
  };

  // Shikigami — purely cosmetic floating companions (per-character equip)
  const buyShikigami = (shikigamiId) => {
    setProgress(prev => {
      if ((prev.ownedShikigami || []).includes(shikigamiId)) return prev;
      const sk = getShikigami(shikigamiId);
      if (!sk) return prev;
      if ((prev.coins || 0) < sk.price) return prev;
      const next = { ...prev, coins: prev.coins - sk.price, ownedShikigami: [...(prev.ownedShikigami || []), shikigamiId] };
      saveProgress(next);
      return next;
    });
  };
  const equipShikigami = (charId, shikigamiId) => {
    setProgress(prev => {
      const eq = { ...(prev.equippedShikigami || {}) };
      if (shikigamiId) eq[charId] = shikigamiId; else delete eq[charId];
      const next = { ...prev, equippedShikigami: eq };
      saveProgress(next);
      return next;
    });
    sfx.click();
  };

  // Buy an emote with Element 6 tokens
  const buyEmote = (emoteId) => {
    setProgress(prev => {
      if ((prev.ownedEmotes || []).includes(emoteId)) return prev;
      const emote = getEmoteById(emoteId);
      if (!emote || emote.price === 0) return prev;
      if ((prev.coins || 0) < emote.price) return prev;
      const next = { ...prev, coins: prev.coins - emote.price, ownedEmotes: [...(prev.ownedEmotes || []), emoteId] };
      saveProgress(next);
      return next;
    });
    sfx.purchaseSuccess();
  };
  // Equip an emote — accepts the full new equippedEmotes object from EmoteEquipSection
  // (which already handles slot assignment and victory emote via setEmoteSlot/setVictoryEmote)
  const equipEmote = (newEquippedEmotes) => {
    setProgress(prev => {
      const next = { ...prev, equippedEmotes: newEquippedEmotes };
      saveProgress(next);
      return next;
    });
    sfx.click();
  };

  // Paid packs are intentionally unavailable in the standalone build.
  const handleBuyPack = (packId) => {
    sfx.warning();
    alert(`Online checkout is not enabled in this local build (pack: ).`);
  };

  // Custom character saved (new) — add to unlocks
  const onCustomCharSaved = (charId) => {
    setProgress(prev => {
      const next = { ...prev, unlockedIds: [...new Set([...(prev.unlockedIds || []), `custom_${charId}`])] };
      saveProgress(next); return next;
    });
    sfx.purchaseSuccess();
  };
  // Custom character deleted — remove from unlocks
  const onCustomCharDeleted = (charId) => {
    setProgress(prev => {
      const next = { ...prev, unlockedIds: (prev.unlockedIds || []).filter(id => id !== `custom_${charId}`) };
      saveProgress(next); return next;
    });
    sfx.warning();
  };

  // Story Mode completion rewards — 3 random locked chars + gear sets (NOT all chars)
  const handleStoryComplete = () => {
    const allCharIds = [...HEROES.map(h => h.id), ...VILLAINS.map(v => v.id), ...GUARDIANS.map(g => g.id)];
    const locked = allCharIds.filter(id => !progressRef.current.unlockedIds.includes(id));
    const shuffled = [...locked].sort(() => Math.random() - 0.5);
    const newUnlocks = shuffled.slice(0, 3);
    // Pre-compute one random skin per character for both unlock + notification
    const charSkins = {};
    const rewards = { chars: [], skins: [], accessories: [] };
    newUnlocks.forEach(cid => {
      const char = ALL.find(c => c.id === cid);
      rewards.chars.push(char?.name || cid);
      const skins = skinsForChar(cid);
      if (skins.length > 0) {
        const sk = skins[Math.floor(Math.random() * skins.length)];
        charSkins[cid] = sk;
        rewards.skins.push(`${char?.name || cid}: ${sk.name}`);
      }
      rewards.accessories.push(`${char?.name || cid} Headband, Gloves, Shoes, Cape`);
    });
    setProgress(prev => {
      const next = { ...prev };
      next.unlockedIds = [...next.unlockedIds, ...newUnlocks];
      newUnlocks.forEach(cid => {
        if (charSkins[cid]) {
          next.ownedSkins = [...new Set([...(next.ownedSkins || []), charSkins[cid].id])];
        }
        const exclusives = [`acc_${cid}_headband`, `acc_${cid}_gloves`, `acc_${cid}_shoes`, `acc_${cid}_cape`];
        next.ownedAccessories = [...new Set([...(next.ownedAccessories || []), ...exclusives])];
      });
      next.riftCompleted = true;
      saveProgress(next);
      return next;
    });
    sfx.battlePassReward();
    setStoryRewardToast(rewards);
    setTimeout(() => setStoryRewardToast(null), 12000);
  };

  const handleDailyClaim = (questState) => {
    setProgress(prev => {
      const next = { ...prev, dailyQuests: questState };
      saveProgress(next);
      return next;
    });
  };
  const handleDailyCosmeticUnlock = (cosmetic) => {
    setProgress(prev => {
      let next = { ...prev };
      if (cosmetic.type === 'accessory') {
        if (!(prev.ownedAccessories || []).includes(cosmetic.id)) {
          next.ownedAccessories = [...(prev.ownedAccessories || []), cosmetic.id];
        }
      } else if (cosmetic.type === 'skin') {
        if (!(prev.ownedSkins || []).includes(cosmetic.id)) {
          next.ownedSkins = [...(prev.ownedSkins || []), cosmetic.id];
        }
      } else if (cosmetic.type === 'killfx') {
        if (!(prev.ownedKillFX || []).includes(cosmetic.id)) {
          next.ownedKillFX = [...(prev.ownedKillFX || []), cosmetic.id];
        }
      }
      saveProgress(next);
      return next;
    });
  };

  const recordFightResult = (charId, statsDelta, won, moveStats) => {
    setProgress(prev => {
      const s = JSON.parse(JSON.stringify(prev.stats || {}));
      const bump = (cat, val) => { s[cat] = s[cat] || {}; s[cat][charId] = (s[cat][charId] || 0) + val; };
      bump('distance', statsDelta.distance || 0);
      bump('supers', statsDelta.supers || 0);
      bump('powers', statsDelta.powers || 0);
      bump('heavies', statsDelta.heavies || 0);
      if (won) bump('wins', 1);
      // Per-move usage stats
      let ms = prev.moveStats;
      if (moveStats) {
        ms = JSON.parse(JSON.stringify(prev.moveStats || {}));
        ms[charId] = ms[charId] || {};
        for (const [k, v] of Object.entries(moveStats)) {
          ms[charId][k] = (ms[charId][k] || 0) + v;
        }
      }
      const next = { ...prev, stats: s, moveStats: ms };
      if (won) {
        next.charMastery = recordMasteryWin(prev.charMastery || {}, charId);
      }
      saveProgress(next);
      return next;
    });
  };

  const claimFightQuest = (questId, reward) => {
    setProgress(prev => {
      const next = { ...prev, coins: (prev.coins || 0) + reward, claimedFightQuests: [...(prev.claimedFightQuests || []), questId] };
      saveProgress(next);
      return next;
    });
  };
  const nextFightQuestTier = () => {
    setProgress(prev => {
      const next = { ...prev, fightQuestTier: (prev.fightQuestTier || 0) + 1 };
      saveProgress(next);
      return next;
    });
  };

  const importSave = (parsed) => {
    const merged = { ...DEFAULT_PROGRESS, ...parsed };
    saveProgress(merged);
    setProgress(merged);
  };

  const handleStorySlotSelect = (idx) => {
    try {
      const data = localStorage.getItem(`element6_story_slot_${idx}`);
      _activeStorySlot = idx;
      activeStorySlotRef.current = idx;
      if (data) {
        const slotData = JSON.parse(data);
        // Merge story-specific fields into current global progress (preserves coins, cosmetics, etc.)
        const merged = { ...progressRef.current };
        STORY_FIELDS.forEach(f => { if (slotData[f] !== undefined) merged[f] = slotData[f]; });
        merged.unlockedIds = merged.unlockedIds || ['yellow'];
        saveProgress(merged);
        setProgress(merged);
        setScreen('story');
      } else {
        // New story — keep global progress, reset only story-specific fields
        const fresh = { ...progressRef.current, defeatedVillains: [], inventory: [], hotbar: [], currentHeroId: (progressRef.current.unlockedIds || ['yellow'])[0] };
        delete fresh.playerX; delete fresh.playerY;
        fresh._savedAt = Date.now();
        saveProgress(fresh);
        setProgress(fresh);
        refreshStorySlots();
        setScreen('cutscene');
      }
    } catch {}
  };

  const handleStorySlotDelete = (idx) => {
    try { localStorage.removeItem(`element6_story_slot_${idx}`); } catch {}
    refreshStorySlots();
  };

  const handleNavigate = (dest) => {
    // Queue modes launched from the Hub return to the Hub on Back
    if (screen === 'hub' && ['onlineunranked','onlineranked','tournament','sports','customrooms','leaderboardhall','friends'].includes(dest)) setReturnScreen('hub');
    else if (screen !== 'hub') setReturnScreen('menu');
    const mobileMode = progress?.settings?.mobileMode === true;
    if (mobileMode && ['customrooms', 'team'].includes(dest)) {
      alert('Mobile Mode is ON\n\nMultiplayer is restricted in Mobile Mode. Only LAN Play is available for multiplayer.\n\nTurn off Mobile Mode in Settings to access all multiplayer features.');
      return;
    }
    if (dest === 'hub') { setScreen('hubserverselect'); sfx.click(); }
    else if (dest === 'sandbox') { setScreen('sandbox'); sfx.click(); }
    else if (dest === 'creatormode') { setPlayCampaign(null); setScreen('creatormode'); sfx.click(); }
    else if (dest === 'story') { refreshStorySlots(); setScreen('storySaves'); }
    else if (dest === 'fight') setScreen('modeSelect');
    else if (dest === 'creator') setScreen('creator');
    else if (dest === 'friends') setScreen('friends');
    else if (dest === 'chat') setScreen('chat');
    else if (dest === 'leaderboard') setScreen('leaderboard');
    else if (dest === 'regularbattle') { setPending({ mode: 'regular' }); setScreen('charSelect'); }
    else if (dest === 'onlineranked') { setOnlineMode('ranked'); setScreen('onlinelobby'); }
    else if (dest === 'onlineunranked') { setOnlineMode('unranked'); setScreen('onlinelobby'); }
    else if (dest === 'onlinesettings') setScreen('settings');
    else setScreen(dest);
  };

  const handleClaimEventReward = (eventId, tier, reward) => {
    setProgress(prev => {
      const eventProgress = { ...(prev.eventProgress || {}) };
      const ep = { ...(eventProgress[eventId] || { xp: 0, claimedTiers: [] }) };
      ep.claimedTiers = [...(ep.claimedTiers || []), tier];
      eventProgress[eventId] = ep;
      let next = { ...prev, eventProgress };
      // Apply reward
      if (reward.type === 'tokens') {
        next.coins = (next.coins || 0) + reward.amount;
      } else if (reward.type === 'skin' && reward.item) {
        next.ownedSkins = [...new Set([...(next.ownedSkins || []), reward.item.id])];
      } else if (reward.type === 'allskins' && reward.items) {
        // Tier 50: grant every character's event skin
        const newIds = reward.items.map(s => s.id);
        next.ownedSkins = [...new Set([...(next.ownedSkins || []), ...newIds])];
      } else if (reward.type === 'accessory' && reward.item) {
        next.ownedAccessories = [...new Set([...(next.ownedAccessories || []), reward.item.id])];
      } else if (reward.type === 'allaccessories' && reward.items) {
        const newIds = reward.items.map(a => a.id);
        next.ownedAccessories = [...new Set([...(next.ownedAccessories || []), ...newIds])];
      } else if (reward.type === 'character' && reward.charId) {
        next.unlockedIds = [...new Set([...(next.unlockedIds || []), reward.charId])];
      } else if (reward.type === 'killfx' && reward.item) {
        next.ownedKillFX = [...new Set([...(next.ownedKillFX || []), reward.item.id])];
      } else if (reward.type === 'emote' && reward.emoteId) {
        next.ownedEmotes = [...new Set([...(next.ownedEmotes || []), reward.emoteId])];
      }
      saveProgress(next);
      return next;
    });
  };

  // Apply display mode — dark by default
  useEffect(() => {
    const mode = progress?.settings?.displayMode || 'dark';
    if (mode === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [progress?.settings?.displayMode]);

  // Apply UI Era theme — overrides primary/accent CSS variables with the selected era's palette
  useEffect(() => {
    const uiEra = progress?.settings?.uiEra || 'dynamic';
    if (uiEra === 'dynamic' || !uiEra) return; // keep default theme
    const era = ERAS.find(e => e.id === uiEra);
    if (!era) return;
    const root = document.documentElement;
    // Convert hex accent to HSL channels for the CSS variables
    const hexToHsl = (hex) => {
      const r = parseInt(hex.slice(1, 3), 16) / 255;
      const g = parseInt(hex.slice(3, 5), 16) / 255;
      const b = parseInt(hex.slice(5, 7), 16) / 255;
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      let h, s, l = (max + min) / 2;
      if (max === min) { h = s = 0; }
      else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r: h = (g - b) / d + (g < b ? 6 : 0); break;
          case g: h = (b - r) / d + 2; break;
          case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
      }
      return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
    };
    root.style.setProperty('--primary', hexToHsl(era.accent));
    root.style.setProperty('--accent', hexToHsl(era.accent));
    root.style.setProperty('--ring', hexToHsl(era.accent));
    root.style.setProperty('--sidebar-primary', hexToHsl(era.accent));
    return () => {
      // Restore defaults when uiEra changes back to dynamic
      root.style.removeProperty('--primary');
      root.style.removeProperty('--accent');
      root.style.removeProperty('--ring');
      root.style.removeProperty('--sidebar-primary');
    };
  }, [progress?.settings?.uiEra]);

  // Apply saved app theme on load — sets CSS variables so the chosen palette
  // persists across page reloads (not just when Settings is open).
  useEffect(() => {
    applyUiTheme(progress?.settings?.theme || 'default');
  }, [progress?.settings?.theme]);

  // Track total playtime + per-character mastery playtime (ANY game mode)
  const screenRef = useRef(screen);
  useEffect(() => { screenRef.current = screen; }, [screen]);
  const fightersRef = useRef(fighters);
  useEffect(() => { fightersRef.current = fighters; }, [fighters]);
  useEffect(() => {
    const t = setInterval(() => {
      const currentScreen = screenRef.current;
      const isGameScreen = ['fighting', 'soccer', 'sports', 'training', 'team', 'tutorial', 'lan', 'customrooms', 'sportslobby', 'battleroyale', 'grandcircuit', 'tournament', 'sandbox', 'combos'].includes(currentScreen);
      if (!isGameScreen) return;
      setProgress(prev => {
        let next = { ...prev, playtimeSeconds: (prev.playtimeSeconds || 0) + 30 };
        // Attribute playtime to the active fight character, or the favorite character
        const activeCharId = fightersRef.current?.p1 || prev.favoriteId || 'yellow';
        if (activeCharId) {
          next.charMastery = recordMasteryPlaytime(prev.charMastery || {}, activeCharId, 30);
        }
        saveProgress(next);
        return next;
      });
    }, 30000);
    return () => clearInterval(t);
  }, []);

  // Flush pending cloud save when the tab is hidden or closed so settings/progress persist
  useEffect(() => {
    const onVis = () => { if (document.visibilityState === 'hidden') flushCloudSave(); };
    const onHide = () => flushCloudSave();
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('pagehide', onHide);
    window.addEventListener('beforeunload', onHide);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('pagehide', onHide);
      window.removeEventListener('beforeunload', onHide);
    };
  }, []);

  // Load cloud progress on mount — merges cloud data if it's newer than local
  useEffect(() => {
    const loadCloud = async () => {
      try {
        const me = await db.auth.me();
        if (!me) return;
        const existing = await db.entities.UserProgress.filter({ user_id: me.id });
        if (existing[0]?.progress_json) {
          const cloud = JSON.parse(existing[0].progress_json);
          const localRaw = localStorage.getItem('element6_progress');
          const local = localRaw ? JSON.parse(localRaw) : {};
          const cloudTime = cloud._lastSavedAt || 0;
          const localTime = local._lastSavedAt || 0;
          if (cloudTime > localTime) {
            const merged = { ...DEFAULT_PROGRESS, ...cloud };
            // Merge equipped items so local equipment is never lost when cloud overwrites
            const localParsed = localRaw ? JSON.parse(localRaw) : {};
            for (const field of ['equippedAccessories', 'equippedSkins', 'equippedElements', 'equippedCrossovers']) {
              const localEq = localParsed[field] || {};
              const cloudEq = cloud[field] || {};
              merged[field] = { ...localEq, ...cloudEq };
            }
            // Merge owned crossovers into unlockedIds so they appear as playable characters
            merged.unlockedIds = [...new Set([...(merged.unlockedIds || []), ...(merged.ownedCrossovers || [])])];
            localStorage.setItem('element6_progress', JSON.stringify(merged));
            setProgress(merged);
          }
        }
      } catch {}
    };
    loadCloud();
  }, []);

  const bumpTrophy = (type) => {
    setProgress(prev => {
      const tr = { ...(prev.trophies || { fight: 0, sport: 0 }) };
      tr[type] = (tr[type] || 0) + 1;
      const next = { ...prev, trophies: tr };
      saveProgress(next);
      return next;
    });
  };

  // Load username + title for HUD display
  useEffect(() => {
    db.auth.me().then(u => {
      setUserProfile({ username: u.username || (u.full_name || (u.email || 'Player')).split('@')[0], title: u.profile_title || '' });
    }).catch(() => {});
  }, []);

  // Load custom character data for the fight engine
  useEffect(() => {
    db.auth.me().then(async (me) => {
      const chars = await db.entities.CustomCharacter.filter({ owner_user_id: me.id });
      const map = {};
      chars.forEach(c => {
        const cc = c.color || '#FF6600';
        // Defensive defaults — ensure every field the engine needs is present
        const stats = c.stats || { power: 6, speed: 6, defense: 6, utility: 6, control: 6 };
        const safeStats = {
          power: Math.min(10, Math.max(1, stats.power || 6)),
          speed: Math.min(10, Math.max(1, stats.speed || 6)),
          defense: Math.min(10, Math.max(1, stats.defense || 6)),
          utility: Math.min(10, Math.max(1, stats.utility || 6)),
          control: Math.min(10, Math.max(1, stats.control || 6)),
        };
        const abilities = c.abilities || {};
        const heavyAttack = abilities.heavyAttack || { name: 'Heavy Strike', damage: 20, knockback: 1.3, range: 170, duration: 22, color: cc, type: 'dash', desc: 'A powerful forward strike.' };
        const signatures = abilities.signatures || {
          side: { name: 'Side Slash', damage: 16, knockback: 1.0, range: 180, duration: 20, color: cc, type: 'dash', desc: 'A slashing attack.' },
          up: { name: 'Rising Strike', damage: 14, knockback: 1.2, range: 120, duration: 18, color: cc, type: 'launch', desc: 'An upward attack.' },
          down: { name: 'Ground Slam', damage: 18, knockback: 1.1, range: 150, duration: 22, color: cc, type: 'groundSlam', desc: 'A downward strike.' },
        };
        const superMove = abilities.superMove || { name: 'Custom Super', damage: 42, duration: 50, color: cc, desc: 'A devastating ultimate.' };
        map[`custom_${c.id}`] = {
          id: `custom_${c.id}`,
          name: c.name || 'Custom',
          color: cc,
          secondary_color: c.secondary_color || '#333333',
          title: c.title || 'The Custom',
          isSpirit: false,
          stats: safeStats,
          created_date: c.created_date || '',
          power: c.power_name || (c.power_effect?.name) || 'Custom Power',
          heavyAttack: { ...heavyAttack, color: heavyAttack.color || cc, knockback: heavyAttack.knockback ?? 1.3, damage: heavyAttack.damage ?? 20, range: heavyAttack.range ?? 170, duration: heavyAttack.duration ?? 22 },
          signatures: {
            side: { ...signatures.side, color: signatures.side?.color || cc, knockback: signatures.side?.knockback ?? 1.0, damage: signatures.side?.damage ?? 16, range: signatures.side?.range ?? 180, duration: signatures.side?.duration ?? 20 },
            up: { ...signatures.up, color: signatures.up?.color || cc, knockback: signatures.up?.knockback ?? 1.2, damage: signatures.up?.damage ?? 14, range: signatures.up?.range ?? 120, duration: signatures.up?.duration ?? 18 },
            down: { ...signatures.down, color: signatures.down?.color || cc, knockback: signatures.down?.knockback ?? 1.1, damage: signatures.down?.damage ?? 18, range: signatures.down?.range ?? 150, duration: signatures.down?.duration ?? 22 },
          },
          superMove: { ...superMove, color: superMove.color || cc, damage: superMove.damage ?? 42, duration: superMove.duration ?? 50 },
          appearance: c.appearance || null,
          power_effect: c.power_effect || null,
          isCustom: true,
        };
      });
      setCustomCharData(map);
      setCustomNumberMap(buildCustomNumberMap(map));
    }).catch(() => {});
  }, []);

  // ── Daily Reward: check on mount if the user hasn't claimed today ──
  useEffect(() => {
    const checkDailyReward = async () => {
      try {
        const user = await db.auth.me();
        if (!user) return;
        const existing = await db.entities.DailyReward.filter({ user_id: user.id });
        const today = new Date().toISOString().slice(0, 10);
        if (!existing[0] || existing[0].last_claim_date !== today) {
          setShowDailyReward(true);
        }
      } catch {}
    };
    checkDailyReward();
  }, []);

  // Track whether the chat screen is open (to suppress notifications while viewing)
  useEffect(() => { onChatScreenRef.current = screen === 'chat'; }, [screen]);

  // ── Chat notifications: poll conversations for new messages ──
  useEffect(() => {
    let me = null;
    let pollTimer = null;
    const poll = async () => {
      if (!me) { try { me = await db.auth.me(); } catch { return; } }
      try {
        const convs = await db.entities.ChatConversation.filter({});
        const myName = me.username || (me.full_name || (me.email || 'Player')).split('@')[0];
        const mine = convs.filter(c => c.member_ids && c.member_ids.includes(me.id));
        if (!chatInitRef.current) {
          mine.forEach(c => { if (c.last_message_at) chatSeenRef.current[c.id] = c.last_message_at; });
          chatInitRef.current = true;
          prevUnreadRef.current = 0;
          return;
        }
        let total = 0; let toastConv = null;
        mine.forEach(c => {
          if (c.last_message_at && c.last_message_at > (chatSeenRef.current[c.id] || '')) {
            total++;
            if (!toastConv) toastConv = c;
          }
        });
        setUnreadCount(total);
        if (total > prevUnreadRef.current && !onChatScreenRef.current && toastConv) {
          const name = toastConv.type === 'group' ? (toastConv.name || 'Group') : (toastConv.member_names?.find(n => n !== myName) || 'New DM');
          setChatToast({ name, text: toastConv.last_message });
          sfx.notification();
          setTimeout(() => setChatToast(null), 4000);
        }
        prevUnreadRef.current = total;
      } catch {}
    };
    poll();
    pollTimer = setInterval(poll, 5000);
    return () => { if (pollTimer) clearInterval(pollTimer); };
  }, []);

  const markChatSeen = (convId, lastAt) => {
    if (convId) chatSeenRef.current[convId] = lastAt || new Date().toISOString();
  };

  const handleUsernameChange = ({ oldName, newName }) => {
    setUserProfile(prev => ({ ...prev, username: newName }));
    setUsernameToast({ oldName, newName });
    setTimeout(() => setUsernameToast(null), 5000);
  };

  const acceptMatchRequest = async (req) => {
    setMatchRequestToast(null);
    await db.entities.MatchRequest.update(req.id, { status: 'accepted' });
    // All match requests go to a custom room so both players can meet online
    setScreen('customrooms');
    sfx.notification();
  };

  const declineMatchRequest = async (req) => {
    setMatchRequestToast(null);
    await db.entities.MatchRequest.update(req.id, { status: 'declined' });
    sfx.click();
  };

  // Poll for incoming match requests
  useEffect(() => {
    let me = null;
    let seenIds = new Set();
    const poll = async () => {
      try {
        if (!me) me = await db.auth.me();
        const reqs = await db.entities.MatchRequest.filter({ to_user_id: me.id, status: 'pending' });
        const fresh = reqs.find(r => !seenIds.has(r.id));
        if (fresh) {
          seenIds.add(fresh.id);
          setMatchRequestToast(fresh);
          sfx.notification();
        }
        // Also check for declined responses to requests we sent
        const myDeclined = await db.entities.MatchRequest.filter({ from_user_id: me.id, status: 'declined' });
        const freshDecline = myDeclined.find(r => !seenIds.has(`d_${r.id}`));
        if (freshDecline) {
          seenIds.add(`d_${freshDecline.id}`);
          setChatToast({ name: '⚔️ Match Request', text: `${freshDecline.to_username} declined your ${freshDecline.sport} challenge.` });
          setTimeout(() => setChatToast(null), 4000);
        }
      } catch {}
    };
    poll();
    const t = setInterval(poll, 6000);
    return () => clearInterval(t);
  }, []);

  // Poll for incoming TradeGift records (gifts received + trade requests)
  useEffect(() => {
    let me = null;
    let seenIds = new Set();
    // Persist applied gift IDs so each gift (especially tokens) is applied EXACTLY
    // once — never re-applied on reload, which would duplicate token grants.
    const APPLIED_KEY = 'element6_applied_gifts';
    const appliedIds = new Set((() => { try { return JSON.parse(localStorage.getItem(APPLIED_KEY) || '[]'); } catch { return []; } })());
    const markApplied = (id) => { if (!id) return; appliedIds.add(id); try { localStorage.setItem(APPLIED_KEY, JSON.stringify([...appliedIds])); } catch {} };
    const poll = async () => {
      try {
        if (!me) me = await db.auth.me();
        const recs = await db.entities.TradeGift.filter({ to_user_id: me.id }, '-created_date', 20);
        const fresh = (recs || []).find(r => !seenIds.has(r.id));
        if (fresh) {
          seenIds.add(fresh.id);
          if (fresh.type === 'gift' && fresh.status === 'completed' && !appliedIds.has(fresh.id)) {
            // Merge gifted items into local progress immediately (exactly once)
            const give = fresh.give || {};
            setProgress(prev => {
              const next = { ...prev };
              if (give.tokens > 0) next.coins = (next.coins || 0) + give.tokens;
              if (give.skins) next.ownedSkins = [...new Set([...(next.ownedSkins || []), ...give.skins])];
              if (give.accessories) next.ownedAccessories = [...new Set([...(next.ownedAccessories || []), ...give.accessories])];
              if (give.killFX) next.ownedKillFX = [...new Set([...(next.ownedKillFX || []), ...give.killFX])];
              if (give.chars) next.unlockedIds = [...new Set([...(next.unlockedIds || []), ...give.chars])];
              saveProgress(next);
              return next;
            });
            markApplied(fresh.id);
            setTradeGiftToast({ type: 'gift', name: fresh.from_username || 'Someone', text: `sent you a gift!` });
            sfx.notification();
            setTimeout(() => setTradeGiftToast(null), 5000);
          } else if (fresh.type === 'trade_request' && fresh.status === 'pending') {
            setTradeGiftToast({ type: 'trade', name: fresh.from_username || 'Someone', text: `sent you a trade offer!` });
            sfx.notification();
            setTimeout(() => setTradeGiftToast(null), 5000);
          }
        }
        // Also check for accepted/declined trade responses
        const mine = await db.entities.TradeGift.filter({ from_user_id: me.id, status: 'completed', type: 'trade_completed' }, '-created_date', 10);
        const acceptedFresh = (mine || []).find(r => !seenIds.has(`c_${r.id}`));
        if (acceptedFresh) {
          seenIds.add(`c_${acceptedFresh.id}`);
          setTradeGiftToast({ type: 'trade_accepted', name: acceptedFresh.to_username || 'Someone', text: `accepted your trade! Reload to see new items.` });
          sfx.notification();
          setTimeout(() => setTradeGiftToast(null), 6000);
        }
      } catch {}
    };
    poll();
    const t = setInterval(poll, 8000);
    return () => clearInterval(t);
  }, []);

  // Reset daily quests if needed
  useEffect(() => {
    if (needsDailyReset(progress?.dailyQuests?.dateKey)) {
      const todayKey = getTodayKey();
      setProgress(prev => {
        const next = {
          ...prev,
          dailyQuests: { dateKey: todayKey, quests: generateDailyQuests(todayKey), claimed: [], dailyStats: { _total: { sigs: 0, heavies: 0, powers: 0, supers: 0, distance: 0, wins: 0 } } },
        };
        saveProgress(next);
        return next;
      });
    }
  }, []);

  // Flow: mode <GameIcon emoji="→" size={14} /> fighters <GameIcon emoji="→" size={14} /> map <GameIcon emoji="→" size={14} /> fight
  const handleModePick = (mode) => {
    if (mode === 'custom') { setScreen('custombattle'); return; }
    if (mode === 'tournament') { setScreen('tournament'); return; }
    if (mode === 'grandcircuit') { setScreen('grandcircuit'); return; }
    if (mode === 'team') { setScreen('team'); return; }
    if (mode === 'shapeshift') { setPending({ mode }); setScreen('shapeshiftSelect'); return; }
    const mobileMode = progress?.settings?.mobileMode === true;
    if (mobileMode && (mode === 'onlineranked' || mode === 'onlineunranked')) {
      alert('Mobile Mode is ON\n\nOnline multiplayer is restricted in Mobile Mode. Use LAN Play for multiplayer.');
      return;
    }
    if (mode === 'onlineranked') { setOnlineMode('ranked'); setScreen('onlinelobby'); return; }
    if (mode === 'onlineunranked') { setOnlineMode('unranked'); setScreen('onlinelobby'); return; }
    setPending({ mode }); setScreen('charSelect');
  };
  const handleCharSelect = (p1, p2, isCPU, difficulty, p1Element, p2Element, shikigamiOverride) => {
    // Evil is banned from ranked and challenge modes
    const evilBanned = ['ranked', 'challenge'];
    const isEvilChar = (id) => id === 'evil' || ALL.find(c => c.id === id)?.baseCharId === 'evil';
    if (evilBanned.includes(pending?.mode) && (isEvilChar(p1) || isEvilChar(p2))) {
      return; // silently reject
    }
    let resolvedDifficulty = difficulty;
    if (pending?.mode === 'ranked') {
      // Bot Ranked difficulty scales relative to the player's rating.
      const elo = progress.rankedRating || 1000;
      resolvedDifficulty = elo >= 2400 ? 'honored' : elo >= 2100 ? 'insane' : elo >= 1800 ? 'hard'
        : elo >= 1550 ? 'pro' : elo >= 1300 ? 'regular' : elo >= 1100 ? 'amateur'
        : elo >= 950 ? 'easy' : elo >= 800 ? 'beginner' : 'newcomer';
    }
    // Brawl: skip map select, force Split City
    if (pending?.mode === 'brawl') {
      setFighters({ p1, p2, isCPU, map: 'splitcity', difficulty: resolvedDifficulty, gameMode: 'brawl', customPlatforms: [{ x: 40, y: 620, w: 1200, h: 48 }], p1Element, p2Element, shikigamiOverride: shikigamiOverride || null });
      setScreen('loading');
      return;
    }
    setPending(prev => ({ ...prev, p1, p2, isCPU, difficulty: resolvedDifficulty, p1Element, p2Element, shikigamiOverride: shikigamiOverride || null }));
    setScreen('mapSelect');
  };
  // Shapeshift: receive 3-character teams for P1 (and P2 if human), then go to map select
  const handleShapeshiftSelect = (p1Team, p2Team, p2IsCPU, difficulty, p1Element, p2Element) => {
    setPending(prev => ({ ...prev, p1: p1Team[0], p2: p2Team[0], isCPU: p2IsCPU, difficulty, p1Element, p2Element, p1Team, p2Team, shapeshiftMode: true }));
    setScreen('mapSelect');
  };
  const handleMapPick = (map) => {
    let customPlatforms = null;
    let customSpawnPoints = null;
    let customHazards = null;
    let customObjects = null;
    let resolvedMap = map;
    if (map && map.startsWith('custom_')) {
      const idx = parseInt(map.split('_')[1], 10);
      const stage = progress.customStages?.[idx];
      customPlatforms = stage?.platforms || progress.customStage || null;
      customSpawnPoints = stage?.spawnPoints || null;
      customHazards = stage?.hazards || null;
      customObjects = stage?.objects || null;
      resolvedMap = 'custom';
    }
    // Ranked: generate random accessories + skin for P2
    let rankedAccessories = null, rankedSkins = null;
    if (pending?.mode === 'ranked') {
      const p2Id = pending.p2;
      const availAccs = accessoriesFor(p2Id).filter(a => !a.id.startsWith('jersey_'));
      rankedAccessories = {};
      if (availAccs.length > 0 && Math.random() < 0.6) {
        rankedAccessories[p2Id] = availAccs[Math.floor(Math.random() * availAccs.length)].id;
      }
      const availSkins = skinsForChar(p2Id);
      rankedSkins = {};
      if (availSkins.length > 0 && Math.random() < 0.5) {
        rankedSkins[p2Id] = availSkins[Math.floor(Math.random() * availSkins.length)].id;
      }
    }
    setFighters({ p1: pending.p1, p2: pending.p2, isCPU: pending.isCPU, map: resolvedMap, difficulty: pending.difficulty, gameMode: pending.mode, customPlatforms, customSpawnPoints, customHazards, customObjects, rankedAccessories, rankedSkins, p1Element: pending.p1Element || 'basic', p2Element: pending.p2Element || 'basic', shikigamiOverride: pending.shikigamiOverride || null, p1Team: pending.p1Team || null, p2Team: pending.p2Team || null, shapeshiftMode: pending.shapeshiftMode || false });
    setScreen('loading');
  };

  // Shared per-match award routine. Used by both the in-game Rematch button
  // (onAward — pays out immediately so progress is never lost mid-session) and
  // handleFightEnd (onEnd — pays the final match, then shows the rewards screen).
  const awardFightMatch = (m) => {
    if (!fighters || !m || m.p1Won === null || m.p1Won === undefined) return { reward: 0, xp: 0 };
    const usedEvil = fighters.p1 === 'evil' || fighters.p2 === 'evil';
    const isPvP = !fighters.isCPU;
    const activeEvent = getActiveEvent();
    const won = m.p1Won === true;
    let reward = usedEvil ? 0 : (won ? 10 : 3);
    if (fighters.gameMode === 'botbattle') reward = 0;
    if (won && fighters.gameMode === 'ranked' && !usedEvil) reward += 25;
    if (won && fighters.gameMode === 'sudden' && !usedEvil) reward += 15;
    if (won && fighters.gameMode === 'superonly' && !usedEvil) reward += 15;
    if (won && fighters.gameMode === 'hp' && !usedEvil) reward += 10;
    if (fighters.gameMode === 'coin' && !usedEvil) reward += (m.stats?.coins || 0);
    if (won && fighters.gameMode === 'challenge' && !usedEvil) reward += 40;
    if (won && fighters.gameMode === 'brawl' && !usedEvil) reward += 15;
    if (reward > 0) addCoins(reward);
    recordFightResult(fighters.p1, m.stats || {}, won, m.moveStats);
    const xpGained = usedEvil ? 0 : calculateBattleXP(fighters.difficulty, won, isPvP);
    if (xpGained > 0) {
      setProgress(prev => {
        const levels = { ...(prev.charLevels || {}) };
        const cd = levels[fighters.p1] || { level: 1, xp: 0 };
        let nl = cd.level; let nxp = (cd.xp || 0) + xpGained;
        while (nl < MAX_LEVEL && nxp >= xpForLevel(nl)) { nxp -= xpForLevel(nl); nl++; }
        levels[fighters.p1] = { ...cd, level: nl, xp: nxp };
        const next = { ...prev, charLevels: levels };
        saveProgress(next);
        return next;
      });
    }
    // P2 XP — in PvP, both characters get XP based on their performance
    if (isPvP && !usedEvil && xpGained > 0) {
      const p2Won = !won;
      const p2XP = Math.floor(calculateBattleXP(fighters.difficulty, p2Won, true) * 0.8);
      if (p2XP > 0) {
        setProgress(prev => {
          const levels = { ...(prev.charLevels || {}) };
          const cd = levels[fighters.p2] || { level: 1, xp: 0 };
          let nl = cd.level; let nxp = (cd.xp || 0) + p2XP;
          while (nl < MAX_LEVEL && nxp >= xpForLevel(nl)) { nxp -= xpForLevel(nl); nl++; }
          levels[fighters.p2] = { ...cd, level: nl, xp: nxp };
          const next = { ...prev, charLevels: levels };
          saveProgress(next); return next;
        });
      }
    }
    // Track daily quest stats
    const stats = m.stats || {};
    setProgress(prev => {
      if (!prev.dailyQuests) return prev;
      const dq = { ...prev.dailyQuests };
      dq.dailyStats = dq.dailyStats || {};
      dq.dailyStats._total = dq.dailyStats._total || { sigs: 0, heavies: 0, powers: 0, supers: 0, distance: 0, wins: 0 };
      dq.dailyStats._total.heavies += stats.heavies || 0;
      dq.dailyStats._total.powers += stats.powers || 0;
      dq.dailyStats._total.supers += stats.supers || 0;
      dq.dailyStats._total.distance += stats.distance || 0;
      if (won) dq.dailyStats._total.wins += 1;
      if (m.moveStats) {
        for (const v of Object.values(m.moveStats)) {
          dq.dailyStats._total.sigs = (dq.dailyStats._total.sigs || 0) + (v.sig || 0) + (v.recovery || 0);
        }
      }
      const next = { ...prev, dailyQuests: dq };
      saveProgress(next);
      return next;
    });
    // Ranked ELO — no change if Evil used
    if (fighters.gameMode === 'ranked' && !usedEvil) {
      setProgress(prev => {
        const elo = prev.rankedRating || 1000;
        const change = won ? 25 : -15;
        const nextElo = Math.max(0, elo + change);
        const next = { ...prev, rankedRating: nextElo };
        saveProgress(next);
        return next;
      });
    }
    // Event XP — earn toward active event battle pass
    if (activeEvent && xpGained > 0) {
      setProgress(prev => {
        const eventProgress = { ...(prev.eventProgress || {}) };
        const ep = { ...(eventProgress[activeEvent.id] || { xp: 0, claimedTiers: [] }) };
        ep.xp = (ep.xp || 0) + xpGained;
        eventProgress[activeEvent.id] = ep;
        const next = { ...prev, eventProgress };
        saveProgress(next);
        return next;
      });
    }
    updateLeaderboard('fight', m, xpGained);
    try {
      const hist = JSON.parse(localStorage.getItem('element6_matchHistory') || '[]');
      hist.unshift({
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        mode: 'Fight',
        p1: ALL.find(c => c.id === fighters.p1)?.name || fighters.p1,
        p2: ALL.find(c => c.id === fighters.p2)?.name || fighters.p2,
        result: m.p1Won === true ? 'WIN' : 'LOSS',
        score: `${m.stats?.wins || 0} wins`,
        xp: xpGained,
      });
      localStorage.setItem('element6_matchHistory', JSON.stringify(hist.slice(0, 10)));
    } catch {}
    return { reward, xp: xpGained };
  };

  // Shared award routine for the 5 new sports (soccer has its own inline handler).
  const awardSportMatch = (sport, result) => {
    if (!result || result.p1Won === null || result.p1Won === undefined) return;
    const won = result.p1Won === true;
    const xp = calculateSportXP(sport, result.stats, won);
    const coins = result.tournamentWon ? (result.reward || 50) : (won ? 15 : 5);
    if (coins > 0) addCoins(coins);
    addXP(result.p1CharId || progress.favoriteId || 'yellow', xp);
    if (result.p2IsHuman && result.p2CharId) addXP(result.p2CharId, calculateSportXP(sport, result.stats, !won));
    // Mastery: award wins for any game mode
    if (won) {
      setProgress(prev => {
        const next = { ...prev, charMastery: recordMasteryWin(prev.charMastery || {}, result.p1CharId || progress.favoriteId || 'yellow') };
        saveProgress(next); return next;
      });
    }
    updateLeaderboard(sport, result, xp);
    try {
      const hist = JSON.parse(localStorage.getItem('element6_matchHistory') || '[]');
      hist.unshift({
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        mode: sport.charAt(0).toUpperCase() + sport.slice(1),
        p1: ALL.find(c => c.id === (result.p1CharId || progress.favoriteId || 'yellow'))?.name || 'P1',
        p2: ALL.find(c => c.id === result.p2CharId)?.name || 'P2',
        result: won ? 'WIN' : 'LOSS',
        score: result.tournamentWon ? 'Tournament Win' : (won ? 'Win' : 'Loss'),
        xp,
      });
      localStorage.setItem('element6_matchHistory', JSON.stringify(hist.slice(0, 10)));
    } catch {}
  };

  const handleFightEnd = (result) => {
    if (!fighters) { setFighters(null); setScreen('menu'); return; }
    const isPvP = !fighters.isCPU;
    const preBattleLevel = getCharLevelData(progressRef.current, fighters.p1);

    // Collect completed matches — supports accumulated rematches
    const matches = (result && Array.isArray(result.accumulatedMatches) && result.accumulatedMatches.length > 0)
      ? result.accumulatedMatches.filter(m => m && m.p1Won !== null && m.p1Won !== undefined)
      : (result && result.p1Won !== null && result.p1Won !== undefined ? [result] : []);

    if (matches.length === 0) { setFighters(null); setScreen('menu'); return; }

    let totalReward = 0;
    let totalXP = 0;
    matches.forEach((m) => {
      const { reward, xp } = awardFightMatch(m);
      totalReward += reward;
      totalXP += xp;
    });

    // Aggregate stats across all accumulated rematches so the rewards screen
    // reflects the full session, not just the final match.
    const aggStats = { distance: 0, supers: 0, powers: 0, heavies: 0, hits: 0, superHits: 0, heavyHits: 0, kills: 0, deaths: 0, coins: 0 };
    const aggP2 = { distance: 0, supers: 0, powers: 0, heavies: 0, hits: 0, superHits: 0, heavyHits: 0, kills: 0, deaths: 0, coins: 0 };
    const aggMove = {};
    let p1Wins = 0;
    matches.forEach(m => {
      const s = m.stats || {};
      for (const k of Object.keys(aggStats)) aggStats[k] += s[k] || 0;
      const s2 = m.p2Stats || {};
      for (const k of Object.keys(aggP2)) aggP2[k] += s2[k] || 0;
      if (m.moveStats) { for (const [k, v] of Object.entries(m.moveStats)) aggMove[k] = (aggMove[k] || 0) + (v || 0); }
      if (m.p1Won === true) p1Wins++;
    });
    const aggregatedResult = {
      p1Won: matches.length > 1 ? (p1Wins >= matches.length - p1Wins ? true : false) : matches[0].p1Won,
      stats: aggStats,
      p2Stats: aggP2,
      moveStats: aggMove,
      p2Char: fighters.p2,
    };
    setBattleResult({
      charId: fighters.p1,
      p2CharId: fighters.p2,
      result: aggregatedResult,
      difficulty: fighters.difficulty,
      gameMode: fighters.gameMode,
      isPlayerVsPlayer: isPvP,
      preBattleLevel,
      coinsEarned: totalReward,
      totalXP,
      matchCount: matches.length,
    });

    // ── Record Honored Bot matches for global tracking (1v1 vs honored bot in regular battle) ──
    if (fighters.isCPU && fighters.difficulty === 'honored' && (fighters.gameMode === 'regular' || fighters.gameMode === 'ranked')) {
      db.auth.me().then(user => {
        if (!user) return;
        const p1Char = ALL.find(c => c.id === fighters.p1);
        const p2Char = ALL.find(c => c.id === fighters.p2);
        matches.forEach(m => {
          db.entities.HonoredBotMatch.create({
            user_id: user.id,
            username: userProfile.username || (user.full_name || 'Player'),
            char_id: fighters.p1,
            char_name: p1Char?.name || fighters.p1,
            bot_char_id: fighters.p2,
            bot_char_name: p2Char?.name || fighters.p2,
            winner: m.p1Won === true ? 'player' : 'bot',
            player_stocks: m.stats?.p1Stocks ?? m.p1Stocks ?? (m.p1Won === true ? 1 : 0),
            bot_stocks: m.stats?.p2Stocks ?? m.p2Stocks ?? (m.p1Won === false ? 1 : 0),
            match_duration_seconds: m.stats?.duration ?? m.duration ?? 0,
          }).catch(() => {});
        });
      }).catch(() => {});
    }

    const _winCharId = fighters.p1;
    setFighters(null);
    if (aggregatedResult.p1Won === true) {
      setWinData({ charId: _winCharId, customCharsData: customCharData });
      setScreen('winscreen');
    } else {
      setScreen('rewards');
    }
  };

  const handleDeleteCustomStage = (idx) => {
    setProgress(prev => {
      const list = [...(prev.customStages || [])];
      list.splice(idx, 1);
      const next = { ...prev, customStages: list, customStage: list[0]?.platforms || null };
      saveProgress(next);
      return next;
    });
  };

  const handleSaveCustomStage = (stageData) => {
    const platforms = stageData.platforms || stageData;
    const name = stageData.name || 'Custom Stage';
    const emoji = stageData.emoji || 'palette';
    const spawnPoints = stageData.spawnPoints || null;
    const backdrop = stageData.backdrop || null;
    const hazards = stageData.hazards || null;
    const objects = stageData.objects || null;
    const editIdx = stageData._editingIndex;
    const downloaded = !!stageData.downloaded;
    const originalOwnerId = stageData.originalOwnerId || null;
    setProgress(prev => {
      const list = [...(prev.customStages || [])];
      if (editIdx != null && editIdx >= 0 && editIdx < list.length) {
        // Editing an existing stage — update in place (no duplicate)
        list[editIdx] = { platforms, name, emoji, spawnPoints, backdrop, hazards, objects, downloaded, originalOwnerId };
      } else {
        if (list.length >= 10) list.shift(); // max 10 stages (includes downloads)
        list.push({ platforms, name, emoji, spawnPoints, backdrop, hazards, objects, downloaded, originalOwnerId });
      }
      const next = { ...prev, customStages: list, customStage: platforms };
      saveProgress(next);
      return next;
    });
    setScreen('menu');
  };

  const customStagesList = (progress.customStages || []).map(s => s.platforms || s);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-start p-4 relative overflow-y-auto"
      style={{ background: progress?.settings?.displayMode === 'light'
        ? `radial-gradient(ellipse at top, ${disableEventBg ? '#aaa8bb' : effectiveEventColor}22 0%, #e8e4f0 50%, #ddd8e8 100%)`
        : `radial-gradient(ellipse at top, ${disableEventBg ? '#5544aa' : effectiveEventColor}22 0%, #0a0820 50%, #06040f 100%)` }}
    >
      <UsernamePrompt onSet={(name) => setUserProfile(prev => ({ ...prev, username: name }))} />
      {/* Global splitcity backdrop — visible on menu screens, covered by game canvases during sport/fight */}
      {progress?.settings?.displayMode !== 'light' && !['fighting', 'soccer', 'sports', 'story', 'lan', 'onlinelobby', 'customrooms'].includes(screen) && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `url(${progress?.settings?.customBackdrop || ''})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            opacity: progress?.settings?.customBackdrop ? 0.4 : 0.18,
            zIndex: 0,
          }}
        />
      )}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: (progress.settings?.bgParticleDensity ?? 30) }).map((_, i) => (
          <div key={i} className="absolute rounded-full animate-pulse" style={{
            left: `${(i * 137.5) % 100}%`, top: `${(i * 79.3) % 100}%`,
            width: `${1 + (i % 3)}px`, height: `${1 + (i % 3)}px`,
            backgroundColor: [eventColor, '#4488FF', '#FF44AA', '#FFD700'][i % 4],
            opacity: 0.25 + (i % 5) * 0.05,
            animationDelay: `${(i * 0.4) % 3}s`, animationDuration: `${2 + (i % 4)}s`,
          }} />
        ))}
      </div>

      <div className="relative z-10 w-full flex flex-col items-center my-auto">
        {tokenFlash && (
          <div className="fixed top-4 right-4 z-50 bg-accent text-accent-foreground px-4 py-2 rounded-lg font-heading text-sm shadow-2xl animate-pulse">
            +{formatNumber(tokenFlash)} <GameIcon emoji="◆" size={14} /> Element 6 Tokens!
          </div>
        )}
        {storyRewardToast && (
          <div className="fixed top-4 left-4 z-50 bg-card border-2 border-accent rounded-lg px-5 py-4 shadow-2xl max-w-sm">
            <div className="flex justify-between items-start mb-2">
              <p className="font-heading text-sm text-accent"><GameIcon emoji="🏆" size={14} /> STORY COMPLETE!</p>
              <button onClick={() => setStoryRewardToast(null)} className="text-muted-foreground hover:text-foreground text-xs ml-2"><GameIcon emoji="✕" size={14} /></button>
            </div>
            <div className="space-y-1 text-xs font-body">
              <p className="text-foreground"><span className="text-muted-foreground">Characters:</span> <span className="text-accent font-heading">{storyRewardToast.chars.join(', ')}</span></p>
              <p className="text-foreground"><span className="text-muted-foreground">Skins:</span> <span className="text-primary font-heading">{storyRewardToast.skins.join(', ') || 'None'}</span></p>
              <p className="text-muted-foreground">+ Headband, Gloves, Shoes & Cape for each!</p>
            </div>
          </div>
        )}
        {chatToast && (
          <div className="fixed top-16 right-4 z-50 bg-card border-2 border-accent rounded-lg px-4 py-3 shadow-2xl max-w-xs animate-pulse">
            <p className="text-[10px] font-heading text-accent"><GameIcon emoji="💬" size={14} /> NEW MESSAGE — {chatToast.name}</p>
            <p className="text-xs font-body text-foreground truncate">{chatToast.text}</p>
          </div>
        )}
        {usernameToast && (
          <div className="fixed top-28 right-4 z-50 bg-card border-2 border-primary rounded-lg px-4 py-3 shadow-2xl max-w-xs">
            <p className="text-[10px] font-heading text-primary">USERNAME CHANGED</p>
            <p className="text-xs font-body text-foreground">You changed your username to <span className="text-accent font-heading">{usernameToast.newName}</span> from <span className="text-muted-foreground">{usernameToast.oldName}</span></p>
          </div>
        )}
        {matchRequestToast && (
          <div className="fixed top-44 right-4 z-50 bg-card border-2 border-accent rounded-lg px-4 py-3 shadow-2xl max-w-xs">
            <p className="text-[10px] font-heading text-accent">MATCH REQUEST</p>
            <p className="text-xs font-body text-foreground mb-2"><span className="text-accent font-heading">{matchRequestToast.from_username}</span> challenged you to <span className="font-heading text-primary">{matchRequestToast.sport.toUpperCase()}</span>!</p>
            <div className="flex gap-2">
              <button onClick={() => acceptMatchRequest(matchRequestToast)} className="flex-1 px-3 py-1 bg-accent text-accent-foreground rounded font-heading text-xs"><GameIcon emoji="✓" size={14} /> ACCEPT</button>
              <button onClick={() => declineMatchRequest(matchRequestToast)} className="flex-1 px-3 py-1 bg-destructive text-destructive-foreground rounded font-heading text-xs"><GameIcon emoji="✕" size={14} /> DECLINE</button>
            </div>
          </div>
        )}
        {tradeGiftToast && (
          <div className="fixed top-60 right-4 z-50 bg-card border-2 border-accent rounded-lg px-4 py-3 shadow-2xl max-w-xs animate-pulse">
            <p className="text-[10px] font-heading text-accent inline-flex items-center gap-1">{tradeGiftToast.type === 'gift' ? <><GameIcon emoji="🎁" size={14} /> GIFT RECEIVED</> : tradeGiftToast.type === 'trade' ? <><GameIcon emoji="🔄" size={14} /> TRADE OFFER</> : <><GameIcon emoji="✅" size={14} /> TRADE ACCEPTED</>}</p>
            <p className="text-xs font-body text-foreground"><span className="text-accent font-heading">{tradeGiftToast.name}</span> {tradeGiftToast.text}</p>
          </div>
        )}
        {screen === 'menu' && (
          <MainMenu onNavigate={handleNavigate} coins={progress.coins}
            favoriteName={ALL.find(c => c.id === progress.favoriteId)?.name}
            favoriteLevel={getCharLevelData(progress, progress.favoriteId)?.level || 1}
            rankedRating={progress.rankedRating} onlineRankedRating={progress.onlineRankedRating} musicVolume={progress.settings?.musicVolume ?? 50}
            disableEventBg={disableEventBg} activeEvent={activeEvent} mobileMode={progress?.settings?.mobileMode === true}
            username={userProfile.username} chatNotifCount={unreadCount} />
        )}

        {screen === 'cutscene' && (
          <PrologueCutscene onBack={goBack} onComplete={() => { setShowCutscene(false); setScreen('story'); }} />
        )}

        {screen === 'storySaves' && (
          <StorySaveSlots
            slots={storySlots}
            onSelect={handleStorySlotSelect}
            onDelete={handleStorySlotDelete}
            onBack={goBack}
          />
        )}

        {screen === 'story' && (
          <StoryMode
            onBack={() => { _activeStorySlot = null; activeStorySlotRef.current = null; goBack(); }} progress={progress}
            onUnlockHero={unlockHero} onUnlockVillain={unlockVillain} onUnlockAll={handleStoryComplete}
            onSaveProgress={(extra) => update(extra)}
            onAddCoins={addCoins}
            equippedAccessories={progress.equippedAccessories || {}}
            equippedSkins={progress.equippedSkins || {}}
            equippedShikigami={progress.equippedShikigami || {}}
            equippedEmotes={progress.equippedEmotes || {}}
          />
        )}

        {screen === 'hub' && (
          <CommunityHub
            progress={progress} userProfile={userProfile} customCharsData={customCharData}
            serverCode={hubServer?.room_code || hubServer?.code || 'default'}
            onBack={goBack}
            onNavigate={handleNavigate}
            onOpenServers={() => setScreen('customrooms')}
            onPlayCampaign={(c) => { setPlayCampaign(c); setScreen('creatormode'); }}
            onDownloadStage={handleSaveCustomStage}
            onEquipPatch={(patch) => {
              if (patch?.type === 'favorite') setFavorite(patch.id);
              else if (patch?.type === 'skin') equipSkin(patch.charId, patch.skinId);
              else if (patch?.type === 'acc') equipAccessory(patch.charId, patch.accId);
              else if (patch?.type === 'killfx') equipKillFX(patch.id);
              else if (patch?.type === 'title') equipTitle(patch.id);
              sfx.click();
            }}
            onTransfer={async (info) => {
              if (info.kind === 'trade') {
                // Trade offer already created via TradeOfferModal — pending peer acceptance
                return;
              }
              // Gift: remove items from sender immediately, add to receiver's UserProgress,
              // and create a TradeGift notification record.
              const give = info.give || {};
              setProgress(prev => {
                const next = { ...prev };
                if (give.tokens > 0) next.coins = Math.max(0, (next.coins || 0) - give.tokens);
                if (give.skins?.length) next.ownedSkins = (next.ownedSkins || []).filter(s => !give.skins.includes(s));
                if (give.accessories?.length) next.ownedAccessories = (next.ownedAccessories || []).filter(a => !give.accessories.includes(a));
                if (give.killFX?.length) next.ownedKillFX = (next.ownedKillFX || []).filter(f => !give.killFX.includes(f));
                if (give.chars?.length) next.unlockedIds = (next.unlockedIds || []).filter(c => !give.chars.includes(c));
                saveProgress(next);
                return next;
              });
              try {
                const me = await db.auth.me();
                // The recipient's own client applies the gift from the TradeGift
                // record below (see the incoming-gift poll). Don't write their cloud
                // progress here too — that would double-credit tokens once the
                // recipient merges the cloud write and the poll re-applies the gift.
                await db.entities.TradeGift.create({
                  type: 'gift', from_user_id: me.id, to_user_id: info.to,
                  from_username: userProfile.username, to_username: info.peerName || 'Player',
                  status: 'completed', give, room_code: '',
                });
                sfx.purchaseSuccess();
              } catch (e) { sfx.warning(); }
            }}
          />
        )}

        {screen === 'hubserverselect' && (
          <HubServerSelect onBack={goBack} onJoin={(srv) => { setHubServer(srv); setScreen('hubcharselect'); }} />
        )}

        {screen === 'hubcharselect' && (
          <HubCharSelect
            unlockedIds={progress.unlockedIds} customCharsData={customCharData} favoriteId={progress.favoriteId}
            onEnter={(p1) => { setFavorite(p1); setScreen('hub'); }}
            onBack={goBack}
          />
        )}

        {screen === 'sandbox' && (
          <Sandbox progress={progress} customCharsData={customCharData} onBack={goBack} />
        )}

        {screen === 'creatormode' && (
          <CreatorMode
            progress={progress} customCharsData={customCharData}
            onBack={goBack}
            playCampaign={playCampaign}
            customStages={progress.customStages || []}
          />
        )}

        {screen === 'modeSelect' && (
          <ModeSelect onPick={handleModePick} onBack={goBack} />
        )}

        {screen === 'charSelect' && (
          <CharacterSelect
            onStart={handleCharSelect} onBack={goBack}
            unlockedIds={progress.unlockedIds} favoriteId={progress.favoriteId} onSetFavorite={setFavorite}
            equippedAccessories={progress.equippedAccessories} equippedSkins={progress.equippedSkins} gameMode={pending?.mode}
            charLevels={progress.charLevels || {}} equippedElements={progress.equippedElements || {}} onEquipElement={equipElement}
            defaultCPUDifficulty={progress.settings?.defaultCPUDifficulty || 'regular'}
            customCharsData={customCharData} customNumberMap={customNumberMap}
            ownedCrossovers={progress.ownedCrossovers || []} equippedCrossovers={progress.equippedCrossovers || {}}
            onEquipCrossover={equipCrossover}
            charMastery={progress.charMastery || {}}
            ownedShikigami={progress.ownedShikigami || []} equippedShikigami={progress.equippedShikigami || {}}
            ownedAccessories={progress.ownedAccessories || []} onEquipAccessory={equipAccessory}
            />
            )}

        {screen === 'mapSelect' && pending && (
          <MapSelect
            onPick={handleMapPick} onBack={goBack}
            p1Id={pending.p1} p2Id={pending.p2} customCharsData={customCharData} customStages={customStagesList}
            customStageMetas={progress.customStages || []}
            eventStage={activeEvent?.eventStage || null}
          />
        )}

        {screen === 'shapeshiftSelect' && (
          <ShapeshiftSelect
            onStart={handleShapeshiftSelect} onBack={goBack}
            unlockedIds={progress.unlockedIds} favoriteId={progress.favoriteId}
            defaultCPUDifficulty={progress.settings?.defaultCPUDifficulty || 'regular'}
            customCharsData={customCharData}
            ownedCrossovers={progress.ownedCrossovers || []}
          />
        )}

        {screen === 'loading' && fighters && (
          <LoadingScreen
            p1Char={fighters.p1} p2Char={fighters.p2} mapId={fighters.map} gameMode={fighters.gameMode}
            equippedAccessories={progress.equippedAccessories || {}} equippedSkins={progress.equippedSkins || {}}
            customCharsData={customCharData} equippedCrossovers={progress.equippedCrossovers || {}}
            onComplete={() => setScreen('fighting')}
          />
        )}

        {screen === 'fighting' && fighters && (
          <PlatformFighter
            p1Char={fighters.p1} p2Char={fighters.p2} p2IsCPU={fighters.isCPU}
            selectedMap={fighters.map} cpuDifficulty={fighters.difficulty}
            gameMode={fighters.gameMode} customPlatforms={fighters.customPlatforms} customSpawnPoints={fighters.customSpawnPoints} customHazards={fighters.customHazards} customObjects={fighters.customObjects}
            p1Element={fighters.p1Element || 'basic'} p2Element={fighters.p2Element || 'basic'}
            onEnd={handleFightEnd} onAward={(result) => awardFightMatch(result)} musicVolume={progress.settings?.musicVolume ?? 50} sfxVolume={progress.settings?.sfxVolume ?? 70}
            equippedAccessories={fighters.rankedAccessories ? { ...(progress.equippedAccessories || {}), ...fighters.rankedAccessories } : progress.equippedAccessories}
            equippedSkins={fighters.rankedSkins ? { ...(progress.equippedSkins || {}), ...fighters.rankedSkins } : progress.equippedSkins}
            killFXId={progress.settings?.killFXEnabled !== false ? (progress.equippedKillFX || 'none') : 'none'}
            matchTime={progress.settings?.matchTime ?? 240}
            settings={progress.settings || {}}
            p1Username={userProfile.username} p1Title={userProfile.title}
            customCharsData={customCharData}
            equippedCrossovers={progress.equippedCrossovers || {}}
            equippedShikigami={fighters.shikigamiOverride ? { ...(progress.equippedShikigami || {}), ...fighters.shikigamiOverride } : (progress.equippedShikigami || {})}
            equippedEmotes={progress.equippedEmotes || {}}
            shapeshiftMode={fighters.shapeshiftMode || false}
            p1Team={fighters.p1Team} p2Team={fighters.p2Team}
          />
        )}

        {screen === 'rewards' && battleResult && (
          <MatchRewards
            charId={battleResult.charId} p2CharId={battleResult.p2CharId} result={battleResult.result}
            difficulty={battleResult.difficulty} gameMode={battleResult.gameMode}
            isPlayerVsPlayer={battleResult.isPlayerVsPlayer}
            currentLevelData={battleResult.preBattleLevel} coinsEarned={battleResult.coinsEarned}
            onContinue={() => { setScreen('matchreview'); }}
            onBack={() => { setBattleResult(null); setScreen('menu'); }}
          />
        )}

        {screen === 'codex' && <HeroCodex onBack={goBack} progress={progress} />}

        {screen === 'tournament' && (
          <TournamentMode unlockedIds={progress.unlockedIds} favoriteId={progress.favoriteId} onUnlock={unlockHero} onAwardCoins={addCoins}             onChampion={() => bumpTrophy('fight')} onBack={goBack}
            equippedAccessories={progress.equippedAccessories || {}} equippedSkins={progress.equippedSkins || {}} onAwardXP={(charId, xp) => {
              if (!charId || xp <= 0) return;
              setProgress(prev => {
                const levels = { ...(prev.charLevels || {}) };
                const cd = levels[charId] || { level: 1, xp: 0 };
                let nl = cd.level; let nxp = (cd.xp || 0) + xp;
                while (nl < MAX_LEVEL && nxp >= xpForLevel(nl)) { nxp -= xpForLevel(nl); nl++; }
                levels[charId] = { ...cd, level: nl, xp: nxp };
                const next = { ...prev, charLevels: levels };
                saveProgress(next); return next;
              });
            }} />
        )}

        {screen === 'training' && (
          <TrainingMode unlockedIds={progress.unlockedIds} favoriteId={progress.favoriteId}
            equippedAccessories={progress.equippedAccessories || {}} equippedSkins={progress.equippedSkins || {}}
            customCharsData={customCharData}
            onBack={goBack} />
        )}

        {screen === 'combos' && (
          <ComboTrainer
            onBack={goBack}
            customCharsData={customCharData}
            equippedSkins={progress.equippedSkins || {}}
            equippedAccessories={progress.equippedAccessories || {}}
            sfxVolume={progress.settings?.sfxVolume ?? 70}
            musicVolume={progress.settings?.musicVolume ?? 50}
            settings={progress.settings || {}}
          />
        )}

        {screen === 'tutorial' && <Tutorial onBack={goBack} />}

        {screen === 'shop' && (
          <Shop progress={progress} onBuy={buyAccessory} onEquip={equipAccessory} onBuySkin={buySkin} onEquipSkin={equipSkin} onBuyKillFX={buyKillFX} onEquipKillFX={equipKillFX} onBuyCharacter={buyCharacter} onBuyPack={handleBuyPack} onEquipTitle={equipTitle} onBuyCrossover={buyCrossover} onEquipCrossover={equipCrossover} onBuyShikigami={buyShikigami} onEquipShikigami={equipShikigami} onBuyEmote={buyEmote} onBack={goBack} />
        )}

        {screen === 'savecodes' && (
          <SaveCodes progress={progress} onImport={importSave} onBack={goBack} />
        )}

        {screen === 'stageeditor' && (
          <StageEditor savedStages={progress.customStages || []} onSave={handleSaveCustomStage} onDeleteStage={handleDeleteCustomStage} onBack={goBack} />
        )}

        {screen === 'fightquests' && (
          <FightingQuests progress={progress} onClaim={claimFightQuest} onNextTier={nextFightQuestTier} onBack={goBack} />
        )}

        {screen === 'settings' && (
          <Settings onBack={goBack} settings={progress.settings} onSave={(s) => update({ settings: s })} onUsernameChange={handleUsernameChange} onOpenController={() => setScreen('controller')} onReset={() => {
            try {
              localStorage.removeItem('element6_progress');
              for (let i = 0; i < 3; i++) localStorage.removeItem(`element6_story_slot_${i}`);
            } catch {}
            window.location.reload();
          }} />
        )}

        {screen === 'onlinesettings' && (
          <OnlineSettings onBack={goBack} settings={progress.settings} onSave={(s) => update({ settings: s })} />
        )}

        {screen === 'soccer' && (
          <SoccerMode onBack={goBack} onShop={() => setScreen('shop')} onOnlinePlay={() =>         { if (progress?.settings?.mobileMode === true) { alert('Mobile Mode is ON\n\nOnline multiplayer is restricted in Mobile Mode. Use LAN Play for multiplayer.'); return; } setOnlineMode('soccer'); setScreen('onlinelobby'); }}
            onAward={(result) => {
              if (result.groupTournament) {
                bumpTrophy('sport');
                addCoins(result.reward || 500);
                addXP(result.champion || progress.favoriteId || 'yellow', result.xpPerChar || 1000);
                const ev = getActiveEvent();
                if (ev && result.battlePassXP) {
                  setProgress(prev => {
                    const ep2 = { ...(prev.eventProgress || {}) };
                    const evp = { ...(ep2[ev.id] || { xp: 0, claimedTiers: [] }) };
                    evp.xp = (evp.xp || 0) + result.battlePassXP;
                    ep2[ev.id] = evp;
                    const next = { ...prev, eventProgress: ep2 };
                    saveProgress(next); return next;
                  });
                }
                return;
              }
              if (result.tournamentWon) {
                bumpTrophy('sport');
                addCoins(result.reward || 50);
                addXP(result.p1CharId || progress.favoriteId || 'yellow', 30);
              } else {
                const s = result.soccerStats || {};
                const p1Won = result.p1Won === true;
                const p2Won = result.p1Won === false;
                addCoins(p1Won ? 15 : 5);
                addXP(result.p1CharId || progress.favoriteId || 'yellow', calculateSoccerXP(s.p1, p1Won));
                if (result.p2IsHuman && result.p2CharId) {
                  addXP(result.p2CharId, calculateSoccerXP(s.p2, p2Won));
                }
              }
              // Mastery: award win for any soccer win
              if (result.p1Won === true || result.tournamentWon) {
                setProgress(prev => {
                  const next = { ...prev, charMastery: recordMasteryWin(prev.charMastery || {}, result.p1CharId || progress.favoriteId || 'yellow') };
                  saveProgress(next); return next;
                });
              }
              const _soccerXP = result.tournamentWon ? 30 : calculateSoccerXP(result.soccerStats?.p1 || {}, result.p1Won === true);
              updateLeaderboard('soccer', result, _soccerXP);
              try {
                const hist = JSON.parse(localStorage.getItem('element6_matchHistory') || '[]');
                hist.unshift({
                  date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                  mode: 'Soccer',
                  p1: ALL.find(c => c.id === (result.p1CharId || progress.favoriteId || 'yellow'))?.name || 'P1',
                  p2: ALL.find(c => c.id === result.p2CharId)?.name || 'P2',
                  result: result.p1Won === true ? 'WIN' : 'LOSS',
                  score: `${result.soccerStats?.p1?.goals || 0}-${result.soccerStats?.p2?.goals || 0}`,
                  xp: _soccerXP,
                });
                localStorage.setItem('element6_matchHistory', JSON.stringify(hist.slice(0, 10)));
              } catch {}
            }}
            onEnd={(result) => {
              // Award coins/XP (shared with onAward) then move to the review screen.
              if (result.tournamentWon) {
                addCoins(result.reward || 50);
                addXP(result.p1CharId || progress.favoriteId || 'yellow', 30);
              } else {
                const s = result.soccerStats || {};
                const p1Won = result.p1Won === true;
                const p2Won = result.p1Won === false;
                addCoins(p1Won ? 15 : 5);
                addXP(result.p1CharId || progress.favoriteId || 'yellow', calculateSoccerXP(s.p1, p1Won));
                if (result.p2IsHuman && result.p2CharId) {
                  addXP(result.p2CharId, calculateSoccerXP(s.p2, p2Won));
                }
              }
              // Mastery: award win for any soccer win
              if (result.p1Won === true || result.tournamentWon) {
                setProgress(prev => {
                  const next = { ...prev, charMastery: recordMasteryWin(prev.charMastery || {}, result.p1CharId || progress.favoriteId || 'yellow') };
                  saveProgress(next); return next;
                });
              }
              const _soccerXP = result.tournamentWon ? 30 : calculateSoccerXP(result.soccerStats?.p1 || {}, result.p1Won === true);
              updateLeaderboard('soccer', result, _soccerXP);
              try {
                const hist = JSON.parse(localStorage.getItem('element6_matchHistory') || '[]');
                hist.unshift({
                  date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                  mode: 'Soccer',
                  p1: ALL.find(c => c.id === (result.p1CharId || progress.favoriteId || 'yellow'))?.name || 'P1',
                  p2: ALL.find(c => c.id === result.p2CharId)?.name || 'P2',
                  result: result.p1Won === true ? 'WIN' : 'LOSS',
                  score: `${result.soccerStats?.p1?.goals || 0}-${result.soccerStats?.p2?.goals || 0}`,
                  xp: _soccerXP,
                });
                localStorage.setItem('element6_matchHistory', JSON.stringify(hist.slice(0, 10)));
              } catch {}
              setSoccerResult(result);
              setScreen('matchreview');
            }} unlockedIds={progress.unlockedIds} favoriteId={progress.favoriteId}
            equippedAccessories={progress.equippedAccessories || {}} equippedSkins={progress.equippedSkins || {}}
            sfxVolume={progress.settings?.sfxVolume ?? 70} musicVolume={progress.settings?.musicVolume ?? 50}
            settings={progress.settings || {}}
            charLevels={progress.charLevels || {}}
            equippedElements={progress.equippedElements || {}}
            onEquipElement={equipElement}
            customCharsData={customCharData}
            customNumberMap={customNumberMap}
            equippedCrossovers={progress.equippedCrossovers || {}}
            equippedShikigami={progress.equippedShikigami || {}}
            equippedEmotes={progress.equippedEmotes || {}}
            ownedAccessories={progress.ownedAccessories || []} onEquipAccessory={equipAccessory}
            />
        )}

        {screen === 'sports' && (
          <SportsHub
            onBack={goBack}
            onPlaySoccer={() => setScreen('soccer')}
            onShop={() => setScreen('shop')}
            onAward={(result) => { awardSportMatch(result.sport, result); if (result.tournamentWon) setTokenFlash(result.reward || 50); }}
            onEnd={() => {}}
            onCustomRoom={(sportId) => { setCustomRoomMode(sportId); setReturnScreen('sports'); setScreen('customrooms'); }}
            onOnlinePlay={(sportId) => { setOnlineSport(sportId); setReturnScreen('sports'); setScreen('sportslobby'); }}
            unlockedIds={progress.unlockedIds} favoriteId={progress.favoriteId}
            equippedAccessories={progress.equippedAccessories || {}} equippedSkins={progress.equippedSkins || {}}
            settings={progress.settings || {}} charLevels={progress.charLevels || {}} equippedElements={progress.equippedElements || {}} onEquipElement={equipElement}
            sfxVolume={progress.settings?.sfxVolume ?? 70} musicVolume={progress.settings?.musicVolume ?? 50}
            customCharsData={customCharData} customNumberMap={customNumberMap}
            charMastery={progress.charMastery || {}}
            equippedEmotes={progress.equippedEmotes || {}}
          />
            )}

            {screen === 'team' && (
          <TeamMode onBack={goBack} onEnd={(result) => {
            if (result.p1Won) {
              addCoins(20);
              setProgress(prev => { const next = { ...prev, charMastery: recordMasteryWin(prev.charMastery || {}, result.p1CharId || prev.favoriteId || 'yellow') }; saveProgress(next); return next; });
            }
            setScreen('menu');
          }} unlockedIds={progress.unlockedIds} favoriteId={progress.favoriteId} musicVolume={progress.settings?.musicVolume ?? 50} sfxVolume={progress.settings?.sfxVolume ?? 70} matchTime={progress.settings?.matchTime ?? 240} settings={progress.settings || {}} equippedAccessories={progress.equippedAccessories || {}} equippedSkins={progress.equippedSkins || {}} equippedShikigami={progress.equippedShikigami || {}} charLevels={progress.charLevels || {}} equippedElements={progress.equippedElements || {}} onEquipElement={equipElement} customCharsData={customCharData} customNumberMap={customNumberMap} equippedEmotes={progress.equippedEmotes || {}} />
        )}

        {screen === 'meet' && (
          <MeetCharacters onBack={goBack} favoriteId={progress.favoriteId} onSetFavorite={setFavorite} progress={progress} customCharsData={customCharData} customNumberMap={customNumberMap} />
        )}

        {screen === 'daily' && (
          <DailyQuests
            progress={progress}
            onClaimChest={handleDailyClaim}
            onCosmeticUnlock={handleDailyCosmeticUnlock}
            onAddCoins={addCoins}
            onBack={goBack}
          />
        )}

        {screen === 'editchars' && (
          <EditCharacters
            onBack={goBack}
            progress={progress}
            onEquipAccessory={equipAccessory}
            onEquipSkin={equipSkin}
            onEquipElement={equipElement}
            onSetFavorite={setFavorite}
          />
        )}

        {screen === 'events' && (
          <EventsScreen onBack={goBack} progress={progress} onClaimEventReward={handleClaimEventReward}
            onNavigateEquip={() => setScreen('equip')} />
        )}

        {screen === 'equip' && (
          <EquipScreen onBack={goBack} progress={progress}
            onEquipSkin={equipSkin} onEquipAccessory={equipAccessory} onEquipKillFX={equipKillFX}
            onEquipCrossover={equipCrossover} onEquipShikigami={equipShikigami}
            onEquipEmote={equipEmote} ownedEmotes={progress.ownedEmotes || []} equippedEmotes={progress.equippedEmotes || {}} />
        )}

        {screen === 'custombattle' && (
          <CustomBattle
            onBack={goBack}
            unlockedIds={progress.unlockedIds}
            favoriteId={progress.favoriteId}
            equippedAccessories={progress.equippedAccessories || {}}
            equippedSkins={progress.equippedSkins || {}}
            musicVolume={progress.settings?.musicVolume ?? 50}
            sfxVolume={progress.settings?.sfxVolume ?? 70}
            customStages={progress.customStages || []}
            settings={progress.settings || {}}
            charLevels={progress.charLevels || {}}
            equippedElements={progress.equippedElements || {}}
            onEquipElement={equipElement}
            customCharsData={customCharData} customNumberMap={customNumberMap}
            equippedShikigami={progress.equippedShikigami || {}}
            equippedEmotes={progress.equippedEmotes || {}}
          />
        )}

        {screen === 'creator' && (
          <CharacterCreator
            onBack={goBack}
            onSave={onCustomCharSaved}
            onDelete={onCustomCharDeleted}
            progress={progress}
          />
        )}

        {screen === 'friends' && (
          <FriendsScreen onBack={goBack} onMessage={(f) => { setPendingDM(f); setScreen('chat'); }} />
        )}

        {screen === 'chat' && (
          <ChatPanel onBack={() => { setPendingDM(null); goBack(); }} initialDM={pendingDM} onMarkSeen={markChatSeen} />
        )}

        {screen === 'customrooms' && (
          <CustomRoomLobby
            mode={customRoomMode}
            onBack={() => { setCustomRoomMode('fight'); goBack(); }}
            onEnd={() => { setCustomRoomMode('fight'); setScreen('menu'); }}
            unlockedIds={progress.unlockedIds}
            favoriteId={progress.favoriteId}
            equippedSkins={progress.equippedSkins || {}}
            equippedAccessories={progress.equippedAccessories || {}}
            sfxVolume={progress.settings?.sfxVolume ?? 70}
            musicVolume={progress.settings?.musicVolume ?? 50}
            settings={progress.settings || {}}
            customStages={progress.customStages || []}
            charLevels={progress.charLevels || {}}
            equippedElements={progress.equippedElements || {}}
            onEquipElement={equipElement}
            customCharsData={customCharData} customNumberMap={customNumberMap}
            equippedEmotes={progress.equippedEmotes || {}}
          />
        )}

        {screen === 'sportslobby' && (
          <OnlineSportsLobby
            sport={onlineSport}
            me={me}
            onBack={goBack}
            onEnd={(res) => {
              // Award XP for online sports matches
              if (res && res.sport && res.won !== undefined) {
                awardSportMatch(res.sport, res);
              }
              setOnlineSport(null);
              setOnlineSportsLobby(null);
              setOnlineSportsRole(null);
              setOnlineSportsMatchId(null);
              setScreen(returnScreen || 'sports');
            }}
            settings={progress.settings || {}}
            sfxVolume={progress.settings?.sfxVolume ?? 70}
            musicVolume={progress.settings?.musicVolume ?? 50}
            unlockedIds={progress.unlockedIds}
            favoriteId={progress.favoriteId}
            equippedSkins={progress.equippedSkins || {}}
            equippedAccessories={progress.equippedAccessories || {}}
            charLevels={progress.charLevels || {}}
            equippedElements={progress.equippedElements || {}}
            onEquipElement={equipElement}
            customCharsData={customCharData}
            customNumberMap={customNumberMap}
            equippedShikigami={progress.equippedShikigami || {}}
            equippedEmotes={progress.equippedEmotes || {}}
          />
        )}

        {screen === 'battleroyale' && (
          <BattleRoyaleLobby
            onBack={goBack}
            onEnd={(res) => {
              // Award Battle Royale tokens based on placement + human player count
              if (res && res.realCount >= 5) {
                if (res.placement === 1) addCoins(100);
                else if (res.placement === 2) addCoins(75);
              }
              // Win a match where all bots are HONORED difficulty = 50 tokens
              if (res && res.placement === 1 && res.botDifficulty === 'honored') {
                addCoins(50);
              }
              // Mastery: award win for BR victory
              if (res && res.placement === 1 && res.charId) {
                setProgress(prev => {
                  const next = { ...prev, charMastery: recordMasteryWin(prev.charMastery || {}, res.charId) };
                  saveProgress(next); return next;
                });
              }
              setScreen('menu');
            }}
            unlockedIds={progress.unlockedIds}
            favoriteId={progress.favoriteId}
            equippedElements={progress.equippedElements || {}}
            equippedAccessories={progress.equippedAccessories || {}}
            equippedSkins={progress.equippedSkins || {}}
            charLevels={progress.charLevels || {}}
            settings={progress.settings || {}}
            sfxVolume={progress.settings?.sfxVolume ?? 70}
            musicVolume={progress.settings?.musicVolume ?? 50}
            onEquipElement={equipElement}
            equippedShikigami={progress.equippedShikigami || {}}
            equippedEmotes={progress.equippedEmotes || {}}
          />
        )}

        {screen === 'onlinelobby' && (
          <OnlineLobby
            mode={onlineMode}
            onBack={goBack}
            onEnd={(res) => {
              // Update Online Ranked ELO.
              if (onlineMode === 'ranked' && res && res.won !== undefined && !res.disconnected) {
                const won = res.won === true;
                setProgress(prev => {
                  const elo = prev.onlineRankedRating || 1000;
                  const change = won ? 25 : -15;
                  const next = { ...prev, onlineRankedRating: Math.max(0, elo + change) };
                  saveProgress(next);
                  return next;
                });
              }
              setScreen('menu');
            }}
            unlockedIds={progress.unlockedIds}
            favoriteId={progress.favoriteId}
            equippedSkins={progress.equippedSkins || {}}
            equippedAccessories={progress.equippedAccessories || {}}
            sfxVolume={progress.settings?.sfxVolume ?? 70}
            musicVolume={progress.settings?.musicVolume ?? 50}
            settings={progress.settings || {}}
            botElo={progress.rankedRating}
            onlineElo={progress.onlineRankedRating}
            charLevels={progress.charLevels || {}}
            equippedElements={progress.equippedElements || {}}
            onEquipElement={equipElement}
            equippedShikigami={progress.equippedShikigami || {}}
            equippedEmotes={progress.equippedEmotes || {}}
          />
        )}

        {screen === 'lan' && (
          <LANLobby
            onBack={goBack}
            onEnd={() => setScreen('menu')}
            unlockedIds={progress.unlockedIds}
            favoriteId={progress.favoriteId}
            equippedSkins={progress.equippedSkins || {}}
            equippedAccessories={progress.equippedAccessories || {}}
            settings={progress.settings || {}}
            sfxVolume={progress.settings?.sfxVolume ?? 70}
            musicVolume={progress.settings?.musicVolume ?? 50}
            charLevels={progress.charLevels || {}}
            equippedElements={progress.equippedElements || {}}
            customCharsData={customCharData} customNumberMap={customNumberMap}
          />
        )}

        {screen === 'leaderboard' && (
          <Leaderboard onBack={goBack} />
        )}

        {screen === 'leaderboardhall' && (
          <LeaderboardHall onBack={goBack} />
        )}

        {screen === 'flyers' && (
          <FlyerBoard onBack={goBack} />
        )}

        {screen === 'controller' && (
          <ControllerSettings onBack={goBack} settings={progress.settings || {}} onSaveSettings={(s) => update({ settings: s })} />
        )}

        {screen === 'winscreen' && winData && (
          <WinScreen charId={winData.charId} customCharsData={winData.customCharsData}
            victoryEmote={progress.equippedEmotes?.victoryEmote}
            onContinue={() => setScreen('rewards')} />
        )}

        {screen === 'about' && <AboutTheGame onBack={goBack} />}

        {screen === 'grandcircuit' && (
          <GrandCircuit
            onBack={goBack}
            onEnd={(res) => {
              if (res?.userWon) {
                addCoins(200); bumpTrophy('fight');
                setProgress(prev => { const next = { ...prev, charMastery: recordMasteryWin(prev.charMastery || {}, prev.favoriteId || 'yellow') }; saveProgress(next); return next; });
              }
              setScreen('menu');
            }}
            unlockedIds={progress.unlockedIds}
            favoriteId={progress.favoriteId}
            settings={progress.settings || {}}
            sfxVolume={progress.settings?.sfxVolume ?? 70}
            musicVolume={progress.settings?.musicVolume ?? 50}
            equippedAccessories={progress.equippedAccessories || {}}
            equippedSkins={progress.equippedSkins || {}}
            customCharsData={customCharData}
            charLevels={progress.charLevels || {}}
            equippedElements={progress.equippedElements || {}}
            onEquipElement={equipElement}
            equippedShikigami={progress.equippedShikigami || {}}
            equippedEmotes={progress.equippedEmotes || {}}
          />
        )}

        {screen === 'matchreview' && (battleResult || soccerResult) && (
          <MatchReview
            mode={battleResult ? 'fight' : 'soccer'}
            data={battleResult || soccerResult}
            onContinue={() => { setBattleResult(null); setSoccerResult(null); setScreen('menu'); }}
          />
        )}

        {screen === 'lore' && (
          <LoreLibrary onBack={goBack} />
        )}
      </div>

      {progress?.settings?.mobileMode === true && TOUCH_SCREENS.includes(screen) && (
        <TouchControls keybinds={getKeybinds(progress.settings).p1} />
      )}
      <VirtualKeyboard />

      {showDailyReward && (
        <DailyRewards
          onClose={() => setShowDailyReward(false)}
          onClaim={(reward) => { addCoins(reward); }}
        />
      )}
    </div>
  );
}