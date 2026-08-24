// Central config for all Sports-mode games (soccer + 5 new sports).
// Each sport awards XP, has its own leaderboard + tournament mode, a themed
// jersey, and (for team sports) assignable POSITION roles that affect gameplay.

import { HEROES } from './heroes.js';
import { VILLAINS } from './villains.js';
import { GUARDIANS } from './guardians.js';
import { OLD_GEN_CHARS } from './eras.js';

// Normalize old-gen chars: add `power` alias (Gen V uses `power`, old-gen uses `powerTitle`)
const OLD_GEN_NORMALIZED = OLD_GEN_CHARS.map(c => ({ ...c, power: c.power || c.powerTitle, isGuardian: false, isOldGen: true }));

export const ALL_CHARS = [...HEROES, ...VILLAINS, ...GUARDIANS, ...OLD_GEN_NORMALIZED];

export const SPORTS = [
  { id: 'soccer',     name: 'Soccer',      emoji: '⚽', color: '#44AA44', jerseyType: 'soccer_kit',      teamSize: 1, court: 'pitch',  desc: 'Kicking the ball into the net using signatures.' },
  { id: 'volleyball', name: 'Volleyball',  emoji: '🏐', color: '#FF8800', jerseyType: 'volleyball_kit',  teamSize: 2, court: 'court',  desc: 'Bump, set, switch, jump, and spike over the net.',
    roles: [
      { id: 'setter', name: 'Setter', desc: 'Bumps & sets the ball — Control gifts the hitter the perfect pass.' },
      { id: 'hitter', name: 'Hitter', desc: 'Leaps at the net — Power amps spike velocity and spike angle.' },
    ] },
  { id: 'baseball',   name: 'Baseball',    emoji: '⚾', color: '#44AA88', jerseyType: 'baseball_kit',   teamSize: 3, court: 'diamond', desc: 'Pitch, hit, field, and run bases in a dual-view duel.',
    roles: [
      { id: 'pitcher',  name: 'Pitcher',  desc: 'Power arms the pitch — throw heat, curves, and change-ups to strike out batters.' },
      { id: 'infield',  name: 'Infield',  desc: 'Speed covers the dirt — quick reflexes for grounders and tag-outs.' },
      { id: 'outfield', name: 'Outfield', desc: 'Range tracks deep flies — cut off gaps and gun down runners.' },
    ] },
  { id: 'parkour', name: 'Parkour', emoji: '🏃', color: '#66E0FF', jerseyType: 'parkour_kit', teamSize: 1, court: 'rooftops', desc: 'Race across the rooftops of Split City in an endless parkour challenge. Master wall jumps, climb towering buildings, outrun the advancing wall, and compete for the highest distance on the global leaderboard.' },
  { id: 'rockclimb', name: 'Rock Climbing', emoji: '🧗', color: '#88BB66', jerseyType: 'climbing_kit', teamSize: 1, court: 'mountain', desc: 'Scale enormous mountains using skill, timing, and strategy. Master wall jumps, choose the fastest route, and compete for the best climbing time on the global leaderboard.' },
  { id: 'ctf', name: 'Capture the Flag', emoji: '🚩', color: '#FF6600', jerseyType: 'soccer_kit', teamSize: 2, court: 'city', desc: '2v2 offline Capture the Flag across the rooftops of Split City at Night. Steal the enemy flag, defend your base, and dominate the skyline!' },
  { id: 'dodgeball', name: 'Dodgeball', emoji: '🟡', color: '#FFB300', jerseyType: 'dodgeball_kit', teamSize: 1, court: 'gym', desc: 'Eye-level dodgeball — throw, dodge, and super-throw your way to the score limit. 10 balls, no ring-outs, win by 2 in Deuce.' },
  { id: 'zipline', name: 'Ziplining', emoji: '🪢', color: '#5BC8A0', jerseyType: 'parkour_kit', teamSize: 1, court: 'forest', desc: 'Ride three forest ziplines forever — switch lanes to dodge endless obstacles and chase the longest run on the global leaderboard.' },
  { id: 'banger', name: 'Banger', emoji: '💥', color: '#FF4D6D', jerseyType: 'volleyball_kit', teamSize: 3, court: 'gym', subtitle: 'Element 6 Original', desc: 'Element 6 Original — strategic 3v3 elimination. Chip the ball over the net, call BANGER! on impact, and eliminate the opposition.' },
  ];

export const getSport = (id) => SPORTS.find(s => s.id === id) || SPORTS[0];

// Locked characters (evil is generally banned from competitive play;
// guardians are also excluded from sports modes)
export const PLAYABLE = ALL_CHARS.filter(c => c.id !== 'evil' && !c.isGuardian);

// Pick a random unlocked character id, optionally excluding some ids.
export function randomCharId(unlockedIds, exclude = []) {
  const pool = PLAYABLE.filter(c => (unlockedIds || []).includes(c.id) && !exclude.includes(c.id));
  if (pool.length === 0) {
    const any = PLAYABLE.filter(c => (unlockedIds || []).includes(c.id));
    return any.length ? any[Math.floor(Math.random() * any.length)].id : 'yellow';
  }
  return pool[Math.floor(Math.random() * pool.length)].id;
}

// Team colors used for per-side jerseys across all sports.
export const TEAM_COLOR_P1 = '#3577E8';  // blue
export const TEAM_COLOR_P2 = '#E04646';  // red

// Generic sport XP calc. Each sport passes a small stats object.
export function calculateSportXP(sportId, stats, won) {
  const base = 8;
  const winBonus = won ? 12 : 0;
  let perf = 0;
  if (!stats) return base + winBonus;
  switch (sportId) {
    case 'soccer':
      perf = (stats.goals || 0) * 3 + (stats.saves || 0) * 5 + (stats.shotsOnTarget || 0) * 1;
      break;
    case 'baseball':
      perf = (stats.runs || 0) * 4 + (stats.hits || 0) * 3 + (stats.strikeouts || 0) * 2;
      break;
    case 'volleyball':
      perf = (stats.spikes || 0) * 4 + (stats.digs || 0) * 2 + (stats.aces || 0) * 3;
      break;
    case 'dodgeball':
      perf = (stats.hits || 0) * 4 + (stats.superThrows || 0) * 3 + (stats.dodges || 0) * 1 + (stats.throws || 0) * 0.5;
      break;
    case 'zipline':
      perf = Math.min(90, Math.floor((stats.distance || 0) / 22));
      break;
    case 'banger':
      perf = (stats.elims || 0) * 6 + (stats.hits || 0) * 2;
      break;
    default:
      perf = 0;
  }
  return base + winBonus + perf;
}

export function calculateSportCoins(sportId, won, tournamentWon) {
  if (tournamentWon) return 50;
  return won ? 15 : 5;
}