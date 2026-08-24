import React, { useRef, useEffect, useState } from 'react';
import { drawSportChar } from './sportDraw.jsx';
import { sfx } from './sfx.js';
import { music } from './music.js';
import { ALL_CHARS } from './sports.js';
import { getCharLevelData } from './elements.js';
import {
  PC_TRAITS, PC_PROFILES, PC_COMPAT, PC_LIKES, PC_DISLIKES, PC_DIALOGUE,
  PC_GROUND_BUILDINGS, PC_GUARDIAN_BUILDINGS, PC_JOBS, PC_HOME_STYLES,
  PC_HERO_ORDER, PC_VILLAIN_ORDER, PC_GUARDIAN_ORDER, PC_SEASONS,
  PC_FURNITURE, PC_CLOTHING, PC_HOLIDAYS, PC_REPUTATIONS, PC_ACHIEVEMENTS,
  PC_WEATHER_LABELS, currentHoliday, isSleeping, formatBirthday,
  weatherForSeason, timeOfDayLabel,
} from './personalCommunity.js';
import RelationshipJournal from './RelationshipJournal.jsx';
import CommunityNews from './CommunityNews.jsx';
import PCShop from './PCShop.jsx';
import GameIcon from "./GameIcon.jsx";

const SAVE_KEY = 'element6_pc_state_v2';
const CANVAS_W = 800, CANVAS_H = 480;
const GROUND_Y = 340;
const SKY_TOP = -420;
const WORLD_W = 9000;
const SLOT = 150;
const B_W = 110, B_H = 125, B_Y = 215;
const HOME_W = 80, HOME_H = 70, HOME_Y = 250;
const BUILDING_SLOTS = PC_GROUND_BUILDINGS.length;
const G_W = 160, G_H = 110, G_SPACING = 600, G_START_X = 300, G_Y = -300;

const BUILDINGS = PC_GROUND_BUILDINGS.map((b, i) => ({ ...b, x: i * SLOT + SLOT / 2 - B_W / 2, y: B_Y, w: B_W, h: B_H }));
const GUARDIANS = PC_GUARDIAN_BUILDINGS.map((b, i) => ({ ...b, x: G_START_X + i * G_SPACING, y: G_Y, w: G_W, h: G_H }));
const ALL_BUILDINGS = [...BUILDINGS, ...GUARDIANS];

const SKY = {
  day:    ['#2a3a6a', '#1a2050', '#0a0a2e'],
  sunset: ['#ff5e3a', '#5a2060', '#1a0a2e'],
  dawn:   ['#3a4a8a', '#1a1a3a', '#0a0a1e'],
  night:  ['#1a1a33', '#0a0a2a', '#050510'],
};
function computeTimeOfDay(h) {
  if (h >= 20 || h < 5) return 'night';
  if (h >= 17) return 'sunset';
  if (h < 8) return 'dawn';
  return 'day';
}

const resolveChar = (id, custom) => (custom && custom[id]) || ALL_CHARS.find(c => c.id === id) || { id, name: id, color: '#888' };
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// ── One-directional relationship helpers ──
function getRel(st, a, b) {
  if (!st.rel) st.rel = {};
  if (!st.rel[a]) st.rel[a] = {};
  if (!st.rel[a][b]) st.rel[a][b] = { friend: 0, romance: 'none', neg: 0, memories: [], met: false, lastInteract: 0 };
  return st.rel[a][b];
}
function friendLabel(rel) {
  if (!rel || !rel.met) return 'Stranger';
  const s = rel.friend;
  if (s >= 80) return 'Best Friends';
  if (s >= 60) return 'Good Friends';
  if (s >= 40) return 'Friends';
  if (s >= 20) return 'Talks';
  return 'Knows';
}
function romanceLabel(rel) {
  if (!rel) return 'None';
  return rel.romance === 'dating' ? 'Dating' : rel.romance === 'crushing' ? 'Crushing' : rel.romance === 'interested' ? 'Interested' : 'None';
}

function jobFor(id) { const t = PC_TRAITS[id]; if (!t) return 'None'; return pick(PC_JOBS[t.personality] || ['Resident']); }
function jobBuilding(job) {
  const m = { Teacher:'school', Doctor:'hospital', Nurse:'hospital', 'Police Officer':'police',
    Athlete:'field', Coach:'gym', 'Café Worker':'cafe', Chef:'restaurant', Librarian:'library',
    Shopkeeper:'grocery', 'Delivery Worker':'grocery', 'Construction Worker':'center',
    Artist:'library', Musician:'theater', Reporter:'center', Gardener:'park', Florist:'park',
    'Event Planner':'festival' };
  return m[job] || 'center';
}
function activityName(bid) {
  const m = { home:'Relaxing at home', cafe:'Grabbing coffee', restaurant:'Eating out', grocery:'Shopping',
    clothing:'Clothes shopping', park:'Walking in the park', playground:'At the playground', school:'Studying', hospital:'Working at the clinic',
    police:'On duty', library:'Reading', theater:'Watching a movie', gym:'Working out', field:'Playing sports',
    beach:'At the beach', forest:'Enjoying the forest', center:'At the community center', plaza:'Hanging out at the plaza',
    rooftop:'On the rooftops', bridge:'On the bridge', festival:'At the festival', villain_hall:'At Villain Hall' };
  if (bid && bid.startsWith && bid.startsWith('g_')) return 'Visiting the Guardian District';
  return m[bid] || 'Out and about';
}
function homePlotFor(id, idx) {
  const t = PC_TRAITS[id];
  if (t && t.category === 'Guardian') {
    const g = GUARDIANS.find(b => b.id === 'g_' + id) || GUARDIANS[0];
    return { x: g.x + g.w / 2, y: GROUND_Y, buildingId: g.id, sky: true };
  }
  const slot = BUILDING_SLOTS + idx;
  return { x: slot * SLOT + SLOT / 2, y: GROUND_Y, buildingId: null };
}

function realMinutes() { const d = new Date(); return d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60; }
function realSeason() { const m = new Date().getMonth(); if (m <= 1 || m === 11) return 3; if (m <= 4) return 0; if (m <= 7) return 1; return 2; }
function realDayOfYear() { const d = new Date(); return Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86400000); }

// For birthday testing: one character gets today as their birthday automatically.
const TEST_BDAY_ID = 'yellow';
function initialState(unlockedIds) {
  return {
    residents: {}, rel: {}, couples: [], birthdays: {},
    pcCoins: 250, furniture: {}, clothing: {},
    day: realDayOfYear(), time: realMinutes(), season: realSeason(), weather: 'sunny', seenIds: [], initialized: true,
    meetings: {}, hangouts: [], cooldowns: {}, tick: 0, lastActive: Date.now(),
    newsLog: [], seenNewsUpTo: 0, actions: {}, charAch: {}, recent: {}, dayCount: 0,
    invitations: [], events: [], lastWeatherDay: realDayOfYear(),
  };
}
function loadState() { try { const raw = localStorage.getItem(SAVE_KEY); if (raw) { const s = JSON.parse(raw); if (s && s.initialized) return s; } } catch {} return null; }
function saveState(st) { try { localStorage.setItem(SAVE_KEY, JSON.stringify(st)); } catch {} }

function ensureResidents(st, unlockedIds, customCharsData) {
  const canonical = unlockedIds.filter(id => PC_TRAITS[id]);
  const order = [...PC_HERO_ORDER, ...PC_VILLAIN_ORDER, ...PC_GUARDIAN_ORDER];
  canonical.sort((a, b) => order.indexOf(a) - order.indexOf(b));
  const newToasts = [];
  let plotIdx = 0;
  // ensure test birthday
  st.birthdays = st.birthdays || {};
  for (const id of canonical) {
    if (!st.residents[id]) {
      const t = PC_TRAITS[id];
      const plot = homePlotFor(id, plotIdx);
      if (t.category !== 'Guardian') plotIdx++;
      const ch = resolveChar(id, customCharsData);
      // test birthday: one specific char always has today's date
      let bday;
      if (id === TEST_BDAY_ID) {
        bday = { m: 8, d: 13 };
      } else {
        bday = st.birthdays[id] || { m: Math.floor(Math.random() * 12) + 1, d: Math.floor(Math.random() * 28) + 1 };
      }
      st.birthdays[id] = bday;
      st.residents[id] = {
        id, x: plot.x, y: plot.y, home: plot, job: jobFor(id),
        mood: 'Happy', activity: 'Just moved in', target: { x: plot.x, y: plot.y },
        bubble: 'I just moved in!', bubbleT: 240, dwell: 60, facing: 1, frame: 0,
        energy: 80, hunger: 60, social: 50, fun: 50,
        birthday: bday, insideBid: null, _hadParty: false,
        _wakeJitter: Math.floor(Math.random() * 120 - 60), // ±1 hour wake variation
      };
      if (!st.seenIds.includes(id)) { st.seenIds.push(id); newToasts.push(ch.name || id); }
    } else {
      if (id === TEST_BDAY_ID) {
        st.residents[id].birthday = { m: 8, d: 13 };
        st.birthdays[id] = st.residents[id].birthday;
      }
    }
  }
  return newToasts;
}

// ── Reputation: derive from action counts ──
function getReputation(st, id) {
  const a = (st.actions && st.actions[id]) || {};
  const counts = [
    ['friendly', (a.greet||0)+(a.compliment||0)+(a.help||0)],
    ['helpful', a.help||0],
    ['funny', a.joke||0],
    ['competitive', a.challenge||0],
    ['quiet', a.idle||0],
    ['popular', a.social||0],
    ['athletic', a.train||0],
    ['smart', a.read||0],
    ['mischievous', a.argue||0],
    ['serious', a.train||0],
    ['energetic', a.social||0],
    ['reliable', a.help||0],
  ];
  counts.sort((x, y) => y[1] - x[1]);
  const top = counts[0];
  if (!top || top[1] < 3) return 'Unknown';
  const r = PC_REPUTATIONS.find(r => r.id === top[0]);
  return r ? r.label : 'Unknown';
}

// ── Achievement checking ──
function checkAchievements(st, id) {
  if (!st.charAch) st.charAch = {};
  if (!st.charAch[id]) st.charAch[id] = {};
  const ach = st.charAch[id];
  const rels = (st.rel && st.rel[id]) || {};
  const friendCount = Object.values(rels).filter(r => r.friend >= 40).length;
  const bffCount = Object.values(rels).filter(r => r.friend >= 80).length;
  const datingCount = Object.values(rels).filter(r => r.romance === 'dating').length;
  if (bffCount >= 1 && !ach.first_bff) ach.first_bff = true;
  if (datingCount >= 1 && !ach.first_date) ach.first_date = true;
  if (friendCount >= 10 && !ach.ten_friends) ach.ten_friends = true;
  if (friendCount >= 15 && !ach.community_favorite) ach.community_favorite = true;
  if ((a_count(st, id, 'train') || 0) >= 10 && !ach.fitness_fanatic) ach.fitness_fanatic = true;
  if ((a_count(st, id, 'movie') || 0) >= 5 && !ach.movie_lover) ach.movie_lover = true;
  if ((a_count(st, id, 'social') || 0) >= 50 && !ach.social_butterfly) ach.social_butterfly = true;
  if ((a_count(st, id, 'peacemake') || 0) >= 1 && !ach.peacemaker) ach.peacemaker = true;
}
function a_count(st, id, key) { return ((st.actions || {})[id] || {})[key] || 0; }
function recordAction(st, id, key) {
  if (!st.actions) st.actions = {};
  if (!st.actions[id]) st.actions[id] = {};
  st.actions[id][key] = (st.actions[id][key] || 0) + 1;
}
function recordRecent(st, id, text) {
  if (!st.recent) st.recent = {};
  if (!st.recent[id]) st.recent[id] = [];
  st.recent[id].unshift(text);
  if (st.recent[id].length > 10) st.recent[id].pop();
}
// Per-character sleep check with wake jitter (randomize morning by a few minutes)
function isCharSleeping(st, id) {
  const r = st.residents[id]; if (!r) return false;
  const t = PC_TRAITS[id]; if (!t) return false;
  const hour = (st.time / 60) | 0;
  const jitter = r._wakeJitter || 0; // -2..+2 minute offset
  const adjHour = hour - (jitter / 60); // jitter shifts the effective clock slightly
  return isSleeping(Math.floor(adjHour), t.personality);
}
// Record a directed memory: "a remembers something about b"
function addMemory(st, fromId, toId, text) {
  const rel = getRel(st, fromId, toId);
  if (!rel.memories) rel.memories = [];
  rel.memories.unshift({ day: st.dayCount || 0, text });
  if (rel.memories.length > 8) rel.memories.pop();
}
function logNews(st, text) {
  st.newsLog = st.newsLog || [];
  // dedup: skip if the same text was logged recently (prevents spam)
  const recent = st.newsLog.slice(-6);
  if (recent.some(n => n.text === text)) return;
  st.newsLog.push({ day: st.dayCount || 0, text, t: Date.now() });
  if (st.newsLog.length > 200) st.newsLog.shift();
}

// ── Schedule: pick next destination based on real time + personality ──
function nextTarget(st, id) {
  const r = st.residents[id]; if (!r) return;
  const t = PC_TRAITS[id]; const prof = PC_PROFILES[t.personality] || PC_PROFILES.chill;
  const hour = (st.time / 60) | 0;
  // Sleep check — go home and stay inside (per-character wake jitter)
  if (isCharSleeping(st, id)) {
    r.target = { x: r.home.x, y: r.home.y };
    r.activity = 'Sleeping 💤';
    r.insideBid = 'home';
    r.dwell = 400 + Math.floor(Math.random() * 400);
    return;
  }
  // hangout rejoin
  const hg = (st.hangouts || []).find(h => h.members.includes(id) && h.until > (st.tick || 0));
  if (hg) {
    r.target = { x: hg.spot + (r._hgOffset || 0), y: GROUND_Y };
    r.activity = 'Hanging out 👥';
    r.insideBid = null;
    r.dwell = Math.max(r.dwell, 80);
    return;
  }
  // dating partner: prioritize spending time together
  let partner = null;
  const rels = (st.rel && st.rel[id]) || {};
  for (const oid of Object.keys(rels)) {
    if (rels[oid].romance === 'dating' && st.residents[oid]) { partner = oid; break; }
  }
  if (partner && Math.random() < 0.5) {
    const pr = st.residents[partner];
    const hr = hour;
    let pool = hr < 12 ? ['park','cafe','plaza'] : hr < 17 ? ['beach','park','restaurant'] : ['restaurant','theater','rooftop','plaza'];
    const bid = pick(pool);
    const dest = ALL_BUILDINGS.find(b => b.id === bid) || BUILDINGS.find(b => b.id === 'plaza');
    if (dest) {
      const dx = dest.x + dest.w / 2;
      r.target = { x: dx, y: GROUND_Y }; r.activity = `On a date with ${resolveChar(partner, {}).name} 💕`;
      r.dwell = 300 + Math.floor(Math.random() * 200);
      return;
    }
  }
  // visit a friend ~30%
  const friends = [];
  for (const oid of Object.keys(rels)) {
    if (rels[oid].friend >= 40 && st.residents[oid] && rels[oid].romance !== 'dating') friends.push(oid);
  }
  if (friends.length && Math.random() < 0.3) {
    const f = pick(friends); const fr = st.residents[f];
    r.target = { x: fr.home.x, y: GROUND_Y };
    r.activity = `Visiting ${resolveChar(f, {}).name}'s home`;
    r.insideBid = null;
    r.dwell = 200 + Math.floor(Math.random() * 200);
    return;
  }
  // daily schedule pools
  let pool;
  if (hour < 9) pool = ['home', 'cafe', 'grocery', 'park'];
  else if (hour < 12) pool = [jobBuilding(r.job), 'school', 'library', 'gym', 'field'];
  else if (hour < 14) pool = ['cafe', 'restaurant', 'home'];
  else if (hour < 17) pool = [jobBuilding(r.job), 'park', 'gym', 'field', 'library', 'beach', 'forest', 'rooftop', 'bridge'];
  else if (hour < 20) pool = ['plaza', 'park', 'center', 'theater', 'cafe', 'festival', 'rooftop'];
  else pool = ['home', 'restaurant', 'theater'];
  if (prof.solo > 0.6) pool = pool.filter(b => ['home','forest','library','beach'].includes(b)).concat(['home']);
  if (prof.shy > 0.6) pool = pool.filter(b => b !== 'plaza' && b !== 'festival').concat(['home','park']);
  if (t.personality === 'leader') pool = ['center','plaza','school'].concat(pool);
  if (t.personality === 'lovergirl') pool = ['cafe','park','restaurant','theater'].concat(pool);
  if (t.personality === 'hates') pool = ['home','forest','beach'];
  if (t.category === 'Guardian') pool = ['g_'+id,'g_life','g_mercy','g_death'].concat(pool.filter(b => !b.startsWith('g_')));
  // avoid enemies' current buildings
  pool = pool.filter(b => {
    if (b === 'home' || (b.startsWith && b.startsWith('g_'))) return true;
    const bd = ALL_BUILDINGS.find(x => x.id === b); if (!bd) return true;
    const enemies = [];
    for (const oid of Object.keys(rels)) { if (rels[oid].neg >= 25 && st.residents[oid]) enemies.push(oid); }
    return !enemies.some(eid => { const er = st.residents[eid]; return er && Math.abs(er.x - (bd.x + bd.w/2)) < 60; });
  });
  const bid = pick(pool.filter(Boolean)) || 'home';
  const dest = bid === 'home' ? r.home : ALL_BUILDINGS.find(b => b.id === bid);
  if (dest) {
    r.target = { x: dest.x + (dest.w || 100) / 2, y: (bid === 'home') ? r.home.y : GROUND_Y };
    r.activity = activityName(bid);
    // when they arrive at a building they'll enter it (handled in sim)
    r.insideBid = null;
  }
  r.dwell = 200 + Math.floor(Math.random() * 300);
}

function inMeeting(st, id) { const m = st.meetings || {}; return Object.keys(m).some(k => { const x = m[k]; return x.a === id || x.b === id; }); }
function inHangout(st, id) { return (st.hangouts || []).some(h => h.members.includes(id) && h.until > (st.tick || 0)); }

// ── Offline catch-up: simulate while player is away ──
function catchUpOffline(st, unlockedIds, customCharsData) {
  const now = Date.now();
  const lastActive = st.lastActive || now;
  const elapsedMin = Math.min(180, Math.floor((now - lastActive) / 60000));
  if (elapsedMin < 1) { st.lastActive = now; return; }
  const oldNewsCount = (st.newsLog || []).length;
  for (let m = 0; m < elapsedMin; m++) {
    st.tick = (st.tick || 0) + 6;
    st.time = (st.time + 1) % 1440;
    if (st.time < 1) { st.dayCount = (st.dayCount || 0) + 1; st.day = realDayOfYear(); st.weather = weatherForSeason(st.season); }
    const ids = Object.keys(st.residents);
    for (const id of ids) {
      const r = st.residents[id];
      r.dwell = (r.dwell || 0) - 60;
      if (r.dwell <= 0) nextTarget(st, id);
      // arriving at building → enter
      if (r.insideBid !== 'home' && r.target && Math.abs(r.target.x - r.x) < 6) {
        if (r.activity.includes('date') || r.activity.includes('Visiting')) r.insideBid = null;
        else { const bid = activityToBid(r.activity); if (bid && bid !== 'home') r.insideBid = bid; }
      }
    }
    // spontaneous meetings (offline instant)
    for (let attempt = 0; attempt < 4; attempt++) {
      const a = pick(ids); if (!a) break;
      if (inMeeting(st, a) || inHangout(st, a)) continue;
      const ra = st.residents[a]; if (!ra || isCharSleeping(st, a) || ra.insideBid) continue;
      let best = null, bd = 140;
      for (const b of ids) {
        if (b === a) continue;
        const rb = st.residents[b]; if (!rb || rb.insideBid || isCharSleeping(st, b)) continue;
        if (inMeeting(st, b) || inHangout(st, b)) continue;
        const d = Math.abs(ra.x - rb.x);
        if (d < bd) { bd = d; best = b; }
      }
      if (best) { resolveInstantMeeting(st, a, best, customCharsData); }
    }
  }
  st.lastActive = now;
  saveState(st);
  // mark new news available
  st.seenNewsUpTo = st.seenNewsUpTo || oldNewsCount;
}

// activity string → building id for "entering"
function activityToBid(activity) {
  if (!activity) return null;
  const map = { 'Grabbing coffee':'cafe','Eating out':'restaurant','Shopping':'grocery','Clothes shopping':'clothing',
    'Walking in the park':'park','At the playground':'playground','Studying':'school','Working at the clinic':'hospital',
    'On duty':'police','Reading':'library','Watching a movie':'theater','Working out':'gym','Playing sports':'field',
    'At the beach':'beach','Enjoying the forest':'forest','At the community center':'center','Hanging out at the plaza':'plaza',
    'On the rooftops':'rooftop','On the bridge':'bridge','At the festival':'festival','At Villain Hall':'villain_hall' };
  return map[activity] || null;
}

// ── Instant meeting resolution (offline) ──
function resolveInstantMeeting(st, aId, bId, customCharsData) {
  const key = aId + '>' + bId;
  st.cooldowns = st.cooldowns || {};
  if (st.cooldowns[key] && st.cooldowns[key] > (st.tick || 0)) return;
  const ra = st.residents[aId], rb = st.residents[bId];
  const ta = PC_TRAITS[aId], tb = PC_TRAITS[bId];
  const relAB = getRel(st, aId, bId);
  const relBA = getRel(st, bId, aId);
  if (!relAB.met) { relAB.met = true; relAB.friend = Math.max(relAB.friend, 6); logNews(st, `👋 ${resolveChar(aId, customCharsData).name} met ${resolveChar(bId, customCharsData).name} for the first time.`); }
  if (!relBA.met) { relBA.met = true; relBA.friend = Math.max(relBA.friend, 6); }
  const compat = (PC_COMPAT[ta.personality]?.[tb.personality] ?? 0.4) + relAB.friend / 250;
  const oppositeGenders = ta.gender !== tb.gender;
  const sameCat = ta.category === tb.category; // Guardians only romance Guardians
  const romanceEligible = oppositeGenders && sameCat && ta.personality !== 'hates' && tb.personality !== 'hates';
  const roll = Math.random();
  let dFriend = 4 + Math.random() * 6;
  let dNeg = 0;
  if (compat < 0.2 && roll < 0.4) { dFriend = -3 - Math.random() * 4; dNeg = 4; }
  // romance progression
  if (romanceEligible) {
    // none → interested
    if (relAB.romance === 'none' && relBA.romance === 'none' && relAB.friend >= 25 && Math.random() < 0.12 * compat) {
      relAB.romance = 'interested'; logNews(st, `✨ ${resolveChar(aId, customCharsData).name} is interested in ${resolveChar(bId, customCharsData).name}.`);
    }
    // both interested → 50% one upgrades to crushing
    if (relAB.romance === 'interested' && relBA.romance === 'interested' && Math.random() < 0.5) {
      (Math.random() < 0.5 ? relAB : relBA).romance = 'crushing';
      logNews(st, `💕 ${resolveChar(aId, customCharsData).name} and ${resolveChar(bId, customCharsData).name} are crushing on each other.`);
    }
    // both crushing → 50% begin dating
    if (relAB.romance === 'crushing' && relBA.romance === 'crushing' && Math.random() < 0.5) {
      relAB.romance = 'dating'; relBA.romance = 'dating';
      st.couples = st.couples || [];
      st.couples.push({ a: aId, b: bId });
      logNews(st, `💑 ${resolveChar(aId, customCharsData).name} and ${resolveChar(bId, customCharsData).name} started dating!`);
      checkAchievements(st, aId); checkAchievements(st, bId);
    }
  }
  // breakup ~2% for dating couples
  if (relAB.romance === 'dating' && relBA.romance === 'dating' && Math.random() < 0.02) {
    const positive = Math.random() < 0.5;
    relAB.romance = 'none'; relBA.romance = 'none';
    st.couples = (st.couples || []).filter(c => !(c.a === aId && c.b === bId));
    if (positive) { relAB.friend = clamp(relAB.friend + 5, -100, 100); relBA.friend = clamp(relBA.friend + 5, -100, 100); logNews(st, `💔 ${resolveChar(aId, customCharsData).name} and ${resolveChar(bId, customCharsData).name} broke up but stayed friends.`); }
    else { relAB.neg = clamp(relAB.neg + 20, 0, 100); relBA.neg = clamp(relBA.neg + 20, 0, 100); logNews(st, `💔 ${resolveChar(aId, customCharsData).name} and ${resolveChar(bId, customCharsData).name} broke up badly.`); }
  }
  relAB.friend = clamp(relAB.friend + dFriend, -100, 100);
  relBA.friend = clamp(relBA.friend + dFriend * (compat > 0.3 ? 1 : 0.6), -100, 100);
  relAB.neg = clamp(relAB.neg + dNeg, 0, 100);
  relBA.neg = clamp(relBA.neg + dNeg, 0, 100);
  relAB.lastInteract = st.tick || 0;
  relBA.lastInteract = st.tick || 0;
  st.cooldowns[key] = (st.tick || 0) + 30;
  recordAction(st, aId, 'social'); recordAction(st, bId, 'social');
  checkAchievements(st, aId); checkAchievements(st, bId);
}

// ── No-repeat line picker: tracks recently-said lines per directed pair ──
function pickLine(pool, st, fromId, toId) {
  if (!pool || !pool.length) return '...';
  const key = fromId + '>' + toId;
  if (!st.lastSaid) st.lastSaid = {};
  if (!st.lastSaid[key]) st.lastSaid[key] = [];
  const recent = st.lastSaid[key];
  const fresh = pool.filter(l => !recent.includes(l));
  const choice = pick(fresh.length ? fresh : pool);
  recent.push(choice);
  if (recent.length > 4) recent.shift();
  return choice;
}

// ── Build a back-and-forth dialogue with beginning / middle / ending ──
// Responses match the speaker's tone: both sides use the same conversation
// category pool so 'b' actually reacts to what 'a' said.
function buildDialogue(st, aId, bId, customCharsData) {
  const ta = PC_TRAITS[aId], tb = PC_TRAITS[bId];
  const relAB = getRel(st, aId, bId);
  const aName = resolveChar(aId, customCharsData).name;
  const bName = resolveChar(bId, customCharsData).name;
  const first = !relAB.met;
  const tod = timeOfDayLabel(st.time);
  const holiday = currentHoliday();
  const ra = st.residents[aId];
  const lines = [];
  const D = PC_DIALOGUE;
  const cat = chooseCategory(st, aId, bId);

  // Both speakers draw from the SAME category pool so the conversation is coherent.
  function poolFor(personality) {
    if (cat === 'romantic') {
      const rl = relAB.romance;
      return rl === 'dating' ? D.dating : rl === 'crushing' ? D.crushing : D.interested;
    }
    if (cat === 'friendly') return D.friendly[personality] || D.casual[personality] || ['Hey.'];
    if (cat === 'competitive') return D.competitive[personality] || D.casual[personality];
    if (cat === 'awkward') return D.awkward;
    if (cat === 'argument') return D.argument;
    if (cat === 'reconciliation') return D.reconciliation;
    return D.casual[personality] || ['Hey.'];
  }
  const aPool = poolFor(ta.personality);
  const bPool = poolFor(tb.personality);

  if (first) {
    // Beginning — introductions
    lines.push({ who: 'a', text: `Hi, I'm ${aName}!` });
    lines.push({ who: 'b', text: `Hey, I'm ${bName}.` });
    // Middle — light exchange
    lines.push({ who: 'a', text: pickLine(['Nice to meet you!', 'Where are you from?', 'Wanna hang out sometime?'], st, aId, bId) });
    lines.push({ who: 'b', text: pickLine(['You too!', 'Sure!', 'Maybe later.'], st, bId, aId) });
    // Ending — sign-off
    lines.push({ who: 'a', text: pickLine(['See you around!', 'Catch you later.'], st, aId, bId) });
  } else {
    // Beginning
    lines.push({ who: 'a', text: pickLine(aPool, st, aId, bId) });
    // Middle — b responds in the SAME tone as a (contextual match)
    lines.push({ who: 'b', text: pickLine(bPool, st, bId, aId) });
    lines.push({ who: 'a', text: pickLine(aPool, st, aId, bId) });
    lines.push({ who: 'b', text: pickLine(bPool, st, bId, aId) });
    // context line (location/time/weather/holiday) mixed in for variety
    if (ra.insideBid && ra.insideBid !== 'home') {
      const locPool = D.location[ra.insideBid];
      if (locPool && Math.random() < 0.5) lines.push({ who: 'b', text: pickLine(locPool, st, bId, aId) });
    }
    if (Math.random() < 0.4) lines.push({ who: Math.random() < 0.5 ? 'a' : 'b', text: pickLine(D.time[tod] || ['Hmm.'], st, aId, bId) });
    if (Math.random() < 0.4) lines.push({ who: Math.random() < 0.5 ? 'a' : 'b', text: pickLine(D.weather[st.weather] || ['Hmm.'], st, aId, bId) });
    if (holiday && Math.random() < 0.6) lines.push({ who: Math.random() < 0.5 ? 'a' : 'b', text: pickLine(D.holiday[holiday] || ['Hmm.'], st, aId, bId) });
  }
  // guardian wisdom / villain life flavor
  if (ta.category === 'Guardian' && Math.random() < 0.4) lines.push({ who: 'a', text: pickLine(D.guardian, st, aId, bId) });
  if (tb.category === 'Guardian' && Math.random() < 0.4) lines.push({ who: 'b', text: pickLine(D.guardian, st, bId, aId) });
  if (ta.category === 'Villain' && Math.random() < 0.3) lines.push({ who: 'a', text: pickLine(D.villainLife, st, aId, bId) });
  if (tb.category === 'Villain' && Math.random() < 0.3) lines.push({ who: 'b', text: pickLine(D.villainLife, st, bId, aId) });
  // Ending — natural sign-off (only for non-first meetings, already added for first)
  if (!first) lines.push({ who: Math.random() < 0.5 ? 'a' : 'b', text: pickLine(['See you around!', 'Catch you later.', 'Gotta go—later!', 'Take care.'], st, aId, bId) });
  return lines;
}

function chooseCategory(st, aId, bId) {
  const relAB = getRel(st, aId, bId);
  const relBA = getRel(st, bId, aId);
  const ta = PC_TRAITS[aId], tb = PC_TRAITS[bId];
  // reconciliation after argument
  if (relAB.neg >= 25 && Math.random() < 0.4) return 'reconciliation';
  // romantic if any romance exists
  if (relAB.romance !== 'none' || relBA.romance !== 'none') return 'romantic';
  // argument chance (low, higher if incompatible)
  const compat = PC_COMPAT[ta.personality]?.[tb.personality] ?? 0.4;
  if (compat < 0.2 && Math.random() < 0.5) return 'argument';
  if (relAB.neg >= 12 && Math.random() < 0.3) return 'argument';
  // competitive for competitive personalities
  if ((ta.personality === 'tough' || ta.personality === 'hardworking' || ta.personality === 'anger') && Math.random() < 0.35) return 'competitive';
  // awkward for shy first-ish meetings
  if (relAB.friend < 15 && (ta.personality === 'shy' || tb.personality === 'shy') && Math.random() < 0.3) return 'awkward';
  // friendly if already friends
  if (relAB.friend >= 40) return Math.random() < 0.7 ? 'friendly' : 'casual';
  // casual default
  return 'casual';
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + r, y, r); ctx.closePath();
}

export default function PersonalCommunity({ onBack, unlockedIds = [], progress = {}, customCharsData = {}, equippedSkins = {}, equippedAccessories = {}, sfxVolume = 70, musicVolume = 50 }) {
  const canvasRef = useRef(null);
  const stRef = useRef(null);
  const camRef = useRef({ x: 0, y: 0 });
  const keysRef = useRef({});
  const panBtnRef = useRef({});
  const dragRef = useRef(null);
  const [, force] = useState(0);
  const [selected, setSelected] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [shopOpen, setShopOpen] = useState(false);
  const [timeOfDay, setTimeOfDay] = useState(computeTimeOfDay(new Date().getHours()));
  const [clock, setClock] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [interior, setInterior] = useState(null);
  const [showTree, setShowTree] = useState(true);
  const [showNews, setShowNews] = useState(false);
  const [newsItems, setNewsItems] = useState([]);
  const [highlights, setHighlights] = useState([]);
  const clockRef = useRef({ clock: '', dateStr: '' });
  clockRef.current = { clock, dateStr };

  if (!stRef.current) {
    stRef.current = loadState() || initialState(unlockedIds);
    if (!stRef.current.initialized) stRef.current = { ...initialState(unlockedIds), ...stRef.current };
    const hadState = !!loadState();
    catchUpOffline(stRef.current, unlockedIds, customCharsData);
    // show news if there are unseen events
    const st = stRef.current;
    const newNews = (st.newsLog || []).slice(st.seenNewsUpTo || 0);
    if (hadState && newNews.length > 0) {
      setNewsItems(newNews.map(n => n.text));
      setHighlights(computeHighlights(st));
      setShowNews(true);
      st.seenNewsUpTo = (st.newsLog || []).length;
      saveState(st);
    }
  }

  useEffect(() => {
    const st = stRef.current;
    const newNames = ensureResidents(st, unlockedIds, customCharsData);
    if (newNames.length) {
      setToasts(t => [...t, ...newNames.map(n => `${n} moved into the community!`)]);
      sfx.notification();
      setTimeout(() => setToasts(t => t.slice(newNames.length)), 5000);
    }
    saveState(st);
    force(x => x + 1);
  }, [unlockedIds.join(',')]);

  useEffect(() => { music.setVolume(musicVolume); sfx.setVolume(sfxVolume); music.play('menu'); return () => music.stop(); }, [musicVolume, sfxVolume]);
  useEffect(() => { window.__el6GameplayActive = true; return () => { window.__el6GameplayActive = false; }; }, []);

  // real-time clock
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTimeOfDay(computeTimeOfDay(now.getHours()));
      setClock(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setDateStr(now.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }));
      const st = stRef.current;
      st.time = realMinutes();
      st.season = realSeason();
      st.lastActive = Date.now();
      // change weather once per day
      const today = realDayOfYear();
      if (st.lastWeatherDay !== today) { st.weather = weatherForSeason(st.season); st.lastWeatherDay = today; st.dayCount = (st.dayCount||0)+1; saveState(st); }
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const kd = (e) => { const k = e.key.toLowerCase(); keysRef.current[k] = true; if (k === 'escape') { shopOpen ? setShopOpen(false) : onBack?.(); } };
    const ku = (e) => { keysRef.current[e.key.toLowerCase()] = false; };
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
    return () => { window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); };
  }, [onBack, shopOpen]);

  // main loop
  useEffect(() => {
    let raf, last = performance.now(), acc = 0;
    const loop = (now) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min((now - last) / 1000, 0.05); last = now;
      acc += dt;
      while (acc > 0.1) { simTick(stRef.current, 0.1); acc -= 0.1; }
      panCamera(dt);
      const cv = canvasRef.current; if (cv) draw(cv.getContext('2d'), stRef.current);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line
  }, [timeOfDay]);

  function panCamera(dt) {
    const sp = 520 * dt; const c = camRef.current; const k = keysRef.current; const b = panBtnRef.current;
    if (k['arrowleft'] || k['a'] || b.left) c.x -= sp;
    if (k['arrowright'] || k['d'] || b.right) c.x += sp;
    if (k['arrowup'] || k['w'] || b.up) c.y -= sp;
    if (k['arrowdown'] || k['s'] || b.down) c.y += sp;
    c.x = clamp(c.x, 0, WORLD_W - CANVAS_W);
    c.y = clamp(c.y, SKY_TOP, 0);
  }

  function simTick(st, dt) {
    const cam = camRef.current;
    const viewLeft = cam.x - 250, viewRight = cam.x + CANVAS_W + 250;
    const holiday = currentHoliday();
    const today = new Date();
    for (const id of Object.keys(st.residents)) {
      const r = st.residents[id];
      const onScreen = r.x >= viewLeft && r.x <= viewRight;
      r.frame++;
      if (onScreen) {
        r.dwell -= dt * 60;
        r.energy = clamp(r.energy - dt * 1.2, 0, 100);
        r.hunger = clamp(r.hunger - dt * 1.6, 0, 100);
        r.social = clamp(r.social - dt * 1.0, 0, 100);
        r.fun = clamp(r.fun - dt * 0.8, 0, 100);
        if (r.energy < 25) r.mood = 'Tired';
        else if (r.hunger < 25) r.mood = 'Hungry';
        else if (r.social < 25) r.mood = 'Nervous';
        else if (r.fun < 25) r.mood = 'Sad';
        else if (r.neg > 0) r.mood = 'Angry';
        else r.mood = ['Happy','Calm','Excited','Relaxed','Motivated'][((r.frame / 300) | 0) % 5];
        if (PC_TRAITS[id]?.personality === 'hates') r.mood = 'Angry';
        // movement toward target — only if not inside a building
        if (!r.insideBid) {
          const dx = r.target.x - r.x;
          const sp = 1.4 + (PC_PROFILES[PC_TRAITS[id]?.personality]?.social || 0.4) * 0.6;
          if (Math.abs(dx) > 4) { r.x += Math.sign(dx) * sp; r.facing = dx < 0 ? -1 : 1; }
          else if (r.dwell <= 0) {
            // arrived & dwell done — enter building if heading to one
            const bid = activityToBid(r.activity);
            if (bid && bid !== 'home') { r.insideBid = bid; r.dwell = 200 + Math.floor(Math.random()*200); }
            else if (Math.random() < 0.4 && !r.activity.includes('Sleeping')) { r.bubble = pick([...(PC_DIALOGUE.mutter || []), ...(PC_DIALOGUE.idle?.[PC_TRAITS[id]?.personality] || ['...']), '*looks around*', '*stretches*', '*sits down*', '*looks at the sky*', '*thinks*']); r.bubbleT = 160; }
            nextTarget(st, id);
          } else {
            // arrived at building — enter it
            const bid = activityToBid(r.activity);
            if (bid && bid !== 'home' && r.activity.includes('date') === false) { r.insideBid = bid; r.dwell = 150 + Math.floor(Math.random()*150); }
            else if (r.bubbleT <= 0 && Math.random() < 0.008 && !r.activity.includes('Sleeping')) {
              r.bubble = pick(PC_DIALOGUE.mutter || ['...']); r.bubbleT = 160;
            }
          }
        } else {
          // inside a building — count down dwell then leave
          r.dwell -= dt * 60;
          if (r.dwell <= 0) { r.insideBid = null; nextTarget(st, id); }
        }
        // birthday party
        if (r.birthday && r.birthday.m === today.getMonth() + 1 && r.birthday.d === today.getDate()) {
          if (!r._hadParty) {
            r._hadParty = true;
            const plaza = BUILDINGS.find(b => b.id === 'plaza');
            if (plaza) { r.target = { x: plaza.x + 60, y: GROUND_Y }; r.activity = 'Birthday party! 🎂'; r.insideBid = null; r.dwell = 120; }
            setToasts(t => [...t, `🎂 It's ${resolveChar(id, customCharsData).name}'s birthday! Party at the Plaza!`]);
            logNews(st, `🎂 ${resolveChar(id, customCharsData).name} celebrated their birthday!`);
            // nearby friends walk toward the plaza and congratulate
            const bdayName = resolveChar(id, customCharsData).name;
            const rels = (st.rel && st.rel[id]) || {};
            for (const oid of Object.keys(st.residents)) {
              if (oid === id) continue;
              const orb = st.residents[oid]; if (!orb || orb.activity.includes('Sleeping') || inMeeting(st, oid) || inHangout(st, oid)) continue;
              const rel = rels[oid];
              const isFriend = rel && rel.met && rel.friend >= 40;
              const dating = rel && rel.romance === 'dating';
              if (!isFriend && !dating) continue; // enemies don't care
              const dist = Math.abs(orb.x - r.x);
              if (dist < 500) {
                orb.target = { x: plaza.x + 40 + Math.random() * 80, y: GROUND_Y };
                orb.activity = `Going to ${bdayName}'s birthday party`;
                orb.insideBid = null; orb.dwell = 200;
                orb.bubble = dating ? `Happy for you, love! 💂` : `Happy birthday, ${bdayName}! 🎂`;
                orb.bubbleT = 220;
              }
            }
            if (!st.charAch?.[id]?.birthday_host) { if(!st.charAch) st.charAch={}; if(!st.charAch[id]) st.charAch[id]={}; st.charAch[id].birthday_host = true; }
            sfx.purchaseSuccess(); setTimeout(() => setToasts(t => t.slice(1)), 6000);
          }
        } else { r._hadParty = false; }
      } else {
        // off-screen simplified sim
        r.dwell -= dt * 60;
        if (!r.insideBid) {
          const dx = r.target.x - r.x;
          if (Math.abs(dx) > 4) { r.x += Math.sign(dx) * 1.2; r.facing = dx < 0 ? -1 : 1; }
          else if (r.dwell <= 0) {
            const bid = activityToBid(r.activity);
            if (bid && bid !== 'home') r.insideBid = bid;
            nextTarget(st, id);
          }
        } else if (r.dwell <= 0) { r.insideBid = null; nextTarget(st, id); }
      }
      if (r.bubbleT > 0) r.bubbleT -= dt * 60;
    }
    // advance meetings: walk-together <GameIcon emoji="→" size={14} /> dialogue <GameIcon emoji="→" size={14} /> resolve
    st.tick = (st.tick || 0) + 1;
    const meetings = st.meetings || {};
    for (const mkey of Object.keys(meetings)) {
      const m = meetings[mkey]; const ra = st.residents[m.a], rb = st.residents[m.b];
      if (!ra || !rb) { delete meetings[mkey]; continue; }
      ra.insideBid = null; rb.insideBid = null; // come out to talk
      const aOn = ra.x >= viewLeft && ra.x <= viewRight;
      const bOn = rb.x >= viewLeft && rb.x <= viewRight;
      if (!aOn && !bOn) { resolveMeeting(st, m, customCharsData); delete meetings[mkey]; continue; }
      if (m.phase === 'approach') {
        const mid = (ra.x + rb.x) / 2;
        ra.target = { x: mid - 18, y: GROUND_Y }; ra.facing = rb.x < ra.x ? -1 : 1;
        rb.target = { x: mid + 18, y: GROUND_Y }; rb.facing = ra.x < rb.x ? -1 : 1;
        ra.activity = `Going to see ${resolveChar(m.b, customCharsData).name}`;
        rb.activity = `Going to see ${resolveChar(m.a, customCharsData).name}`;
        ra.dwell = 999; rb.dwell = 999;
        if (Math.abs(ra.x - rb.x) < 42) { m.phase = 'talk'; m.t = 0; m.idx = 0; }
      } else if (m.phase === 'talk') {
        m.t++;
        ra.facing = rb.x < ra.x ? -1 : 1; rb.facing = ra.x < rb.x ? -1 : 1;
        // walk together slowly while talking (stroll)
        if (m.t % 30 === 0) {
          const dir = Math.random() < 0.5 ? 1 : -1;
          ra.target = { x: ra.x + dir * 20, y: GROUND_Y }; rb.target = { x: rb.x + dir * 20, y: GROUND_Y };
        }
        if (m.t % 22 === 0 && m.idx < m.lines.length) {
          const line = m.lines[m.idx]; m.idx++;
          const sp = line.who === 'a' ? ra : rb;
          sp.bubble = line.text; sp.bubbleT = 200;
        }
        if (m.idx >= m.lines.length) { resolveMeeting(st, m, customCharsData); delete meetings[mkey]; }
      }
    }
    // friend groups / hangouts
    st.hangouts = (st.hangouts || []).filter(h => h.until > (st.tick || 0) && h.members.every(mid => st.residents[mid]));
    if (st.hangouts.length < 4 && Math.random() < 0.025) {
      const rids = Object.keys(st.residents);
      for (let attempt = 0; attempt < 6; attempt++) {
        const seed = pick(rids);
        if (inMeeting(st, seed) || inHangout(st, seed)) continue;
        const pals = [];
        const rels = (st.rel && st.rel[seed]) || {};
        for (const oid of Object.keys(rels)) {
          if (rels[oid].friend >= 40 && !inMeeting(st, oid) && !inHangout(st, oid) && st.residents[oid]) pals.push(oid);
        }
        if (pals.length >= 1) {
          const group = [seed, ...pals.slice(0, 1 + Math.floor(Math.random() * 2))];
          const spot = pick(['plaza','park','cafe','center','beach','field','rooftop']);
          const bd = ALL_BUILDINGS.find(b => b.id === spot) || BUILDINGS.find(b => b.id === 'plaza');
          if (bd) {
            group.forEach((mid, i) => { st.residents[mid]._hgOffset = (i - group.length / 2) * 26; st.residents[mid].dwell = 20; st.residents[mid].insideBid = null; });
            st.hangouts.push({ members: group, spot: bd.x + bd.w / 2, until: (st.tick || 0) + 240 + Math.floor(Math.random() * 120) });
            if (group.length >= 3) logNews(st, `👥 ${group.map(g => resolveChar(g, customCharsData).name).join(', ')} hung out together.`);
          }
          break;
        }
      }
    }
    // spontaneous nearby interactions
    if (Math.random() < 0.15) {
      const rids = Object.keys(st.residents);
      for (let attempt = 0; attempt < 4; attempt++) {
        const a = pick(rids); const ra = st.residents[a]; if (!ra) break;
        if (inMeeting(st, a) || inHangout(st, a)) continue;
        if (ra.insideBid || isCharSleeping(st, a) || ra.activity.includes('Being moved')) continue;
        let best = null, bd = 120;
        for (const b of rids) {
          if (b === a) continue;
          const rb = st.residents[b]; if (!rb) continue;
          if (inMeeting(st, b) || inHangout(st, b)) continue;
          if (rb.insideBid || isCharSleeping(st, b) || rb.activity.includes('Being moved')) continue;
          const d = Math.abs(ra.x - rb.x);
          if (d < bd) { bd = d; best = b; }
        }
        if (best) { interact(st, a, best); break; }
      }
    }
    saveState(st);
  }

  function interact(st, aId, bId) {
    if (aId === bId) return;
    const key = aId + '>' + bId;
    st.meetings = st.meetings || {};
    st.cooldowns = st.cooldowns || {};
    if (st.meetings[key] || st.meetings[bId + '>' + aId]) { return; }
    if (st.cooldowns[key] && st.cooldowns[key] > (st.tick || 0)) { return; }
    const ra = st.residents[aId], rb = st.residents[bId];
    if (!ra || !rb) return;
    // sleeping residents don't start conversations
    if (isCharSleeping(st, aId) || isCharSleeping(st, bId)) return;
    ra.insideBid = null; rb.insideBid = null; // come outside to meet
    const relAB = getRel(st, aId, bId);
    const lines = buildDialogue(st, aId, bId, customCharsData);
    st.meetings[key] = { a: aId, b: bId, lines, phase: 'approach', t: 0, idx: 0 };
    ra.dwell = 999; rb.dwell = 999;
    ra.bubble = `Going to see ${resolveChar(bId, customCharsData).name}…`; ra.bubbleT = 180;
    sfx.click(); saveState(st); force(x => x + 1);
  }

  function resolveMeeting(st, m, customCharsData) {
    const aId = m.a, bId = m.b;
    const ra = st.residents[aId], rb = st.residents[bId];
    const ta = PC_TRAITS[aId], tb = PC_TRAITS[bId];
    const relAB = getRel(st, aId, bId);
    const relBA = getRel(st, bId, aId);
    const compat = (PC_COMPAT[ta.personality]?.[tb.personality] ?? 0.4) + relAB.friend / 250;
    const oppositeGenders = ta.gender !== tb.gender;
    const sameCat = ta.category === tb.category;
    const romanceEligible = oppositeGenders && sameCat && ta.personality !== 'hates' && tb.personality !== 'hates';
    if (!relAB.met) { relAB.met = true; relAB.friend = Math.max(relAB.friend, 6); logNews(st, `👋 ${resolveChar(aId, customCharsData).name} met ${resolveChar(bId, customCharsData).name}.`); }
    if (!relBA.met) { relBA.met = true; relBA.friend = Math.max(relBA.friend, 6); }
    const cat = chooseCategory(st, aId, bId);
    let dFriend = 4 + Math.random() * 6;
    let dNeg = 0;
    if (cat === 'argument') { dFriend = -3 - Math.random() * 4; dNeg = 4; }
    if (cat === 'reconciliation') { dFriend = 6; dNeg = -20; recordAction(st, aId, 'peacemake'); recordAction(st, bId, 'peacemake'); }
    if (cat === 'friendly') { dFriend += 2; recordAction(st, aId, 'compliment'); }
    if (cat === 'competitive') { recordAction(st, aId, 'challenge'); recordAction(st, bId, 'challenge'); }
    // romance progression
    if (romanceEligible) {
      if (relAB.romance === 'none' && relBA.romance === 'none' && relAB.friend >= 25 && Math.random() < 0.12 * compat) {
        relAB.romance = 'interested'; logNews(st, `✨ ${resolveChar(aId, customCharsData).name} is interested in ${resolveChar(bId, customCharsData).name}.`);
      }
      if (relAB.romance === 'interested' && relBA.romance === 'interested' && Math.random() < 0.5) {
        (Math.random() < 0.5 ? relAB : relBA).romance = 'crushing';
        logNews(st, `💕 ${resolveChar(aId, customCharsData).name} and ${resolveChar(bId, customCharsData).name} are crushing on each other.`);
      }
      if (relAB.romance === 'crushing' && relBA.romance === 'crushing' && Math.random() < 0.5) {
        relAB.romance = 'dating'; relBA.romance = 'dating';
        st.couples = st.couples || [];
        st.couples.push({ a: aId, b: bId });
        logNews(st, `💑 ${resolveChar(aId, customCharsData).name} and ${resolveChar(bId, customCharsData).name} started dating!`);
        ra.bubble = `We're dating! 💕`; ra.bubbleT = 240;
        setToasts(t => [...t, `💍 ${resolveChar(aId, customCharsData).name} and ${resolveChar(bId, customCharsData).name} are now dating!`]);
        sfx.purchaseSuccess(); setTimeout(() => setToasts(t => t.slice(1)), 6000);
      }
    }
    // breakup ~2%
    if (relAB.romance === 'dating' && relBA.romance === 'dating' && Math.random() < 0.02) {
      const positive = Math.random() < 0.5;
      relAB.romance = 'none'; relBA.romance = 'none';
      st.couples = (st.couples || []).filter(c => !(c.a === aId && c.b === bId));
      if (positive) { relAB.friend = clamp(relAB.friend + 5, -100, 100); relBA.friend = clamp(relBA.friend + 5, -100, 100); logNews(st, `💔 ${resolveChar(aId, customCharsData).name} and ${resolveChar(bId, customCharsData).name} broke up but stayed friends.`); }
      else { relAB.neg = clamp(relAB.neg + 20, 0, 100); relBA.neg = clamp(relBA.neg + 20, 0, 100); logNews(st, `💔 ${resolveChar(aId, customCharsData).name} and ${resolveChar(bId, customCharsData).name} broke up badly.`); }
    }
    if (!oppositeGenders || !sameCat) { relAB.romance = 'none'; relBA.romance = 'none'; }
    relAB.friend = clamp(relAB.friend + dFriend, -100, 100);
    relBA.friend = clamp(relBA.friend + dFriend * (compat > 0.3 ? 1 : 0.6), -100, 100);
    relAB.neg = clamp(relAB.neg + dNeg, 0, 100);
    relBA.neg = clamp(relBA.neg + dNeg, 0, 100);
    // Emotion exclusivity: a character has ONE feeling toward another.
    // If romance is active, clear negative; if deeply negative, clear romance.
    if (relAB.romance !== 'none' && relAB.neg >= 25) { relAB.romance = 'none'; relAB.neg = clamp(relAB.neg - 10, 0, 100); }
    if (relBA.romance !== 'none' && relBA.neg >= 25) { relBA.romance = 'none'; relBA.neg = clamp(relBA.neg - 10, 0, 100); }
    if (relAB.romance !== 'none') relAB.neg = 0;
    if (relBA.romance !== 'none') relBA.neg = 0;
    relAB.lastInteract = st.tick || 0;
    relBA.lastInteract = st.tick || 0;
    const aName = resolveChar(aId, customCharsData).name, bName = resolveChar(bId, customCharsData).name;
    const lastLine = m.lines[m.lines.length - 1] || { text: 'See you!' };
    ra.bubble = lastLine.text; ra.bubbleT = 200;
    rb.bubble = cat === 'argument' ? 'Hmph!' : 'See you!'; rb.bubbleT = 160;
    ra.activity = 'Relaxing'; rb.activity = 'Relaxing';
    ra.insideBid = null; rb.insideBid = null;
    ra.dwell = 50; rb.dwell = 50;
    st.cooldowns[aId + '>' + bId] = (st.tick || 0) + 600;
    st.cooldowns[bId + '>' + aId] = (st.tick || 0) + 600;
    recordAction(st, aId, 'social'); recordAction(st, bId, 'social');
    recordRecent(st, aId, `Talked with ${bName}.`);
    recordRecent(st, bId, `Talked with ${aName}.`);
    // ── Directed memories: each character remembers what happened ──
    if (cat === 'argument') {
      addMemory(st, aId, bId, `Argued with ${bName}.`);
      addMemory(st, bId, aId, `Clashed with ${aName}.`);
    } else if (cat === 'reconciliation') {
      addMemory(st, aId, bId, `Made peace with ${bName}.`);
      addMemory(st, bId, aId, `Forgave ${aName}.`);
    } else if (relAB.romance === 'dating') {
      addMemory(st, aId, bId, `Started dating ${bName}.`);
      addMemory(st, bId, aId, `Started dating ${aName}.`);
    } else if (dFriend > 0) {
      addMemory(st, aId, bId, `Had a good chat with ${bName}.`);
      addMemory(st, bId, aId, `Had a good chat with ${aName}.`);
    } else {
      addMemory(st, aId, bId, `Met up with ${bName}.`);
      addMemory(st, bId, aId, `Met up with ${aName}.`);
    }
    // record the full conversation with each dialogue line for the log
    st.convLog = st.convLog || [];
    st.convLog.unshift({ a: aName, b: bName, aId, bId, cat, lines: m.lines.map(l => ({ who: l.who === 'a' ? aName : bName, text: l.text })), t: Date.now() });
    if (st.convLog.length > 12) st.convLog.pop();
    checkAchievements(st, aId); checkAchievements(st, bId);
    if (dFriend > 0) sfx.purchaseSuccess(); else if (dFriend < -3) sfx.hit(); else sfx.click();
    saveState(st); force(x => x + 1);
  }

  const summonToCursor = (id) => {
    const st = stRef.current; const r = st.residents[id]; if (!r) return;
    const cx = camRef.current.x + CANVAS_W / 2;
    r.x = cx; r.y = GROUND_Y; r.target = { x: cx, y: GROUND_Y }; r.activity = 'Summoned'; r.dwell = 120; r.insideBid = null;
    r.bubble = 'Here I am!'; r.bubbleT = 160; r.facing = 1;
    sfx.click(); saveState(st); force(x => x + 1);
  };
  const bringOut = (id) => {
    const st = stRef.current; const r = st.residents[id]; if (!r) return;
    const doorX = (r.home ? r.home.x : 200) + 50;
    r.x = doorX; r.y = GROUND_Y; r.target = { x: doorX, y: GROUND_Y }; r.activity = 'Stepped outside'; r.dwell = 120; r.insideBid = null;
    r.bubble = 'Out!'; r.bubbleT = 140;
    sfx.click(); saveState(st); force(x => x + 1);
  };

  // ── pointer handling ──
  function toWorld(e) {
    const cv = canvasRef.current; const rect = cv.getBoundingClientRect();
    return { x: (e.clientX - rect.left) * (CANVAS_W / rect.width) + camRef.current.x, y: (e.clientY - rect.top) * (CANVAS_H / rect.height) + camRef.current.y };
  }
  function residentAt(wx, wy) {
    const st = stRef.current; let best = null, bd = 28;
    for (const id of Object.keys(st.residents)) { const r = st.residents[id]; if (r.insideBid) continue; if (Math.abs(r.y - wy) > 40) continue; const d = Math.hypot(r.x - wx, r.y - wy); if (d < bd) { bd = d; best = id; } }
    return best;
  }
  function buildingAt(wx, wy) {
    for (const b of ALL_BUILDINGS) { if (wx >= b.x && wx <= b.x + b.w && wy >= b.y && wy <= b.y + b.h) return b; }
    return null;
  }
  function homeAt(wx, wy) {
    const st = stRef.current;
    for (const id of Object.keys(st.residents)) {
      const r = st.residents[id]; if (!r.home || r.home.sky) continue;
      if (Math.abs(r.home.x - wx) <= HOME_W / 2 + 8 && wy >= HOME_Y - 18 && wy <= HOME_Y + HOME_H + 8) return id;
    }
    return null;
  }
  const onPointerDown = (e) => {
    const w = toWorld(e); const id = residentAt(w.x, w.y);
    if (id) { dragRef.current = { id, startX: e.clientX, startY: e.clientY, moved: false }; try { e.currentTarget.setPointerCapture(e.pointerId); } catch {} }
  };
  const onPointerMove = (e) => {
    const d = dragRef.current; if (!d) return;
    if (Math.hypot(e.clientX - d.startX, e.clientY - d.startY) > 6) d.moved = true;
    if (!d.moved) return;
    const w = toWorld(e); const st = stRef.current; const r = st.residents[d.id]; if (!r) return;
    const nx = clamp(w.x, 0, WORLD_W);
    r.facing = nx < r.x ? -1 : 1;
    r.x = nx; r.y = GROUND_Y; r.target = { x: nx, y: GROUND_Y }; r.activity = 'Being moved'; r.dwell = 999; r.insideBid = null;
    saveState(st); force(x => x + 1);
  };
  const onPointerUp = (e) => {
    const d = dragRef.current; dragRef.current = null;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
    const w = toWorld(e);
    if (d && d.moved) {
      const st = stRef.current; const r = st.residents[d.id];
      if (r) { r.x = clamp(w.x, 0, WORLD_W); r.y = GROUND_Y; r.target = { x: r.x, y: GROUND_Y }; r.activity = 'Relaxing'; r.dwell = 120; r.bubble = 'Moved!'; r.bubbleT = 120; }
      sfx.click(); saveState(st); force(x => x + 1);
      return;
    }
    if (d && !d.moved) { setSelected(d.id); sfx.click(); return; }
    const b = buildingAt(w.x, w.y);
    if (b) { setInterior({ kind: 'building', b }); sfx.click(); return; }
    const hid = homeAt(w.x, w.y);
    if (hid) { setInterior({ kind: 'home', id: hid }); sfx.click(); return; }
    setSelected(null);
  };
  const holdPan = (dir, on) => (e) => { e.preventDefault(); panBtnRef.current[dir] = on; };

  // ── rendering ──
  function draw(ctx, st) {
    const W = CANVAS_W, H = CANVAS_H; const cam = camRef.current;
    ctx.fillStyle = SKY[timeOfDay]?.[2] || '#050510'; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.translate(-cam.x, -cam.y);
    const cols = SKY[timeOfDay] || SKY.night;
    const g = ctx.createLinearGradient(0, SKY_TOP, 0, GROUND_Y + 60);
    g.addColorStop(0, cols[0]); g.addColorStop(0.55, cols[1]); g.addColorStop(1, cols[2]);
    ctx.fillStyle = g; ctx.fillRect(0, SKY_TOP, WORLD_W, GROUND_Y - SKY_TOP + 60);
    if (timeOfDay !== 'day') {
      ctx.save(); ctx.globalAlpha = 0.9; const mx = WORLD_W * 0.5 - 300, my = SKY_TOP + 120;
      const mg = ctx.createRadialGradient(mx, my, 8, mx, my, 40);
      mg.addColorStop(0, '#fffbe0'); mg.addColorStop(0.4, '#fff8d0'); mg.addColorStop(1, 'rgba(255,248,208,0)');
      ctx.fillStyle = mg; ctx.beginPath(); ctx.arc(mx, my, 40, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fffbe0'; ctx.beginPath(); ctx.arc(mx, my, 16, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
    if (timeOfDay === 'night' || timeOfDay === 'dawn') {
      for (let i = 0; i < 80; i++) {
        const x = (i * 137) % WORLD_W, y = SKY_TOP + (i * 53) % (GROUND_Y - SKY_TOP);
        const tw = 0.4 + Math.sin((st.residents[Object.keys(st.residents)[0]]?.frame || 0) * 0.05 + i) * 0.3;
        ctx.globalAlpha = Math.max(0.1, tw); ctx.fillStyle = i % 7 === 0 ? '#aaccff' : '#fff';
        ctx.beginPath(); ctx.arc(x, y, i % 6 === 0 ? 1.6 : 1, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    // weather overlay
    drawWeatherBG(ctx, st);
    ctx.globalAlpha = 0.06; ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 10; i++) { const cx = (i * 320) % WORLD_W; const cy = SKY_TOP + 40 + (i % 3) * 60; ctx.beginPath(); ctx.ellipse(cx, cy, 90, 18, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.globalAlpha = 1;
    const baseY = GROUND_Y + 8; const parallax = cam.x * 0.4;
    for (let i = 0; i < 40; i++) {
      const w = 70 + (i % 3) * 30, h = 60 + (i * 23) % 90; const x = i * 95 - parallax;
      ctx.fillStyle = timeOfDay === 'night' ? '#0a0a1a' : timeOfDay === 'sunset' ? '#2a1040' : '#1a1a3a';
      ctx.fillRect(x, baseY - h, w, h);
      for (let wy = 6; wy < h - 8; wy += 12) for (let wx = 5; wx < w - 8; wx += 12) {
        if ((wx + wy + i) % 3 === 0) { ctx.fillStyle = (wy + i) % 4 === 0 ? '#ffd700' : '#6a5acd'; ctx.globalAlpha = 0.85; ctx.fillRect(x + wx, baseY - h + wy, 4, 6); }
      }
      ctx.globalAlpha = 1;
    }
    const plats = [{ x: 180, y: GROUND_Y - 70, w: 140 }, { x: 620, y: GROUND_Y - 110, w: 120 }, { x: 1060, y: GROUND_Y - 80, w: 150 }, { x: 1500, y: GROUND_Y - 120, w: 130 }];
    plats.forEach((p) => { ctx.fillStyle = 'rgba(46,58,95,0.7)'; roundRect(ctx, p.x, p.y, p.w, 16, 8); ctx.fill(); ctx.strokeStyle = 'rgba(120,140,200,0.4)'; ctx.lineWidth = 1; ctx.stroke(); });

    const holiday = currentHoliday();
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = 'bold 16px Orbitron'; ctx.textAlign = 'center';
    ctx.fillText('☁ GUARDIAN DISTRICT ☁', G_START_X + (GUARDIANS.length * G_SPACING) / 2, G_Y - 16);
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    for (let i = 0; i < 6; i++) { const cx = G_START_X - 100 + i * (G_SPACING * GUARDIANS.length) / 6; ctx.beginPath(); ctx.ellipse(cx, G_Y + G_H + 18, 180, 34, 0, 0, Math.PI * 2); ctx.fill(); }
    GUARDIANS.forEach(b => drawGuardianBuilding(ctx, b));

    // cobblestone ground
    const top = GROUND_Y;
    const gg = ctx.createLinearGradient(0, top, 0, top + 200);
    gg.addColorStop(0, '#c0c0c0'); gg.addColorStop(0.15, '#8a8a98'); gg.addColorStop(0.6, '#3a3a4a'); gg.addColorStop(1, '#15151f');
    ctx.fillStyle = gg; ctx.fillRect(0, top, WORLD_W, 200);
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, top); ctx.lineTo(WORLD_W, top); ctx.stroke();
    const stone = 26;
    for (let y = top + 4; y < top + 200; y += stone) {
      const rowOffset = (Math.floor(y / stone) % 2) * (stone / 2);
      for (let x = -stone + (cam.x % stone) - rowOffset; x < WORLD_W + stone * 2; x += stone) {
        const worldCol = Math.floor(x / stone), worldRow = Math.floor(y / stone);
        const shade = 150 + ((worldCol * 7 + worldRow * 13) % 40) - 20;
        ctx.fillStyle = `rgb(${shade},${shade - 4},${shade - 14})`;
        roundRect(ctx, x, y, stone - 3, stone - 3, 4); ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1; ctx.stroke();
      }
    }
    const sheen = ctx.createLinearGradient(0, top, 0, top + 14);
    sheen.addColorStop(0, 'rgba(255,255,255,0.18)'); sheen.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = sheen; ctx.fillRect(0, top, WORLD_W, 14);

    BUILDINGS.forEach(b => drawBuilding(ctx, b, holiday));
    for (const id of Object.keys(st.residents)) {
      const r = st.residents[id]; if (r && r.home && !r.home.sky) drawHome(ctx, r, id, holiday, st);
    }
    // residents (only those NOT inside a building) — they disappear when inside
    const ids = Object.keys(st.residents).filter(id => { const r = st.residents[id]; return !r.insideBid && r.x >= cam.x - 50 && r.x <= cam.x + W + 50; }).sort((a, b) => st.residents[a].x - st.residents[b].x);
    for (const id of ids) drawResident(ctx, st, id);
    // draw "inside" indicators above buildings (showing who's inside)
    drawInsideIndicators(ctx, st);
    ctx.restore();

    // HUD
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, 0, W, 30);
    ctx.textAlign = 'left'; ctx.fillStyle = '#FFD700'; ctx.font = 'bold 13px Orbitron';
    const holName = holiday ? PC_HOLIDAYS[holiday].name : '';
    const wlabel = PC_WEATHER_LABELS[st.weather] || '';
    const clk = clockRef.current.clock || clock, ds = clockRef.current.dateStr || dateStr;
    ctx.fillText(`🕐 ${clk} · 📅 ${ds} · ${PC_SEASONS[st.season]} · ${timeOfDay}${wlabel ? ' · ' + wlabel : ''}${holName ? ' · ' + holName : ''}`, 10, 20);
    ctx.textAlign = 'right'; ctx.fillStyle = '#FFD700';
    ctx.fillText(`🪙 ${st.pcCoins || 0} · ${Object.keys(st.residents).length} residents · 💍 ${(st.couples||[]).length} couples`, W - 10, 20);
  }

  function drawWeatherBG(ctx, st) {
    const w = st.weather;
    if (w === 'rain') { ctx.strokeStyle = 'rgba(150,180,255,0.3)'; ctx.lineWidth = 1; for (let i = 0; i < 60; i++) { const x = (i * 23) % WORLD_W; const y = (i * 47 + (st.tick||0) * 4) % CANVAS_H; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 3, y + 12); ctx.stroke(); } }
    else if (w === 'snow') { ctx.fillStyle = 'rgba(255,255,255,0.6)'; for (let i = 0; i < 50; i++) { const x = (i * 31 + Math.sin((st.tick||0) * 0.05 + i) * 12) % WORLD_W; const y = (i * 41 + (st.tick||0) * 2) % CANVAS_H; ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2); ctx.fill(); } }
    else if (w === 'fog') { ctx.fillStyle = 'rgba(200,200,210,0.12)'; ctx.fillRect(0, SKY_TOP, WORLD_W, GROUND_Y - SKY_TOP); }
  }

  function drawInsideIndicators(ctx, st) {
    // small dot above buildings showing count of people inside
    const counts = {};
    for (const id of Object.keys(st.residents)) {
      const r = st.residents[id]; if (!r.insideBid || r.insideBid === 'home') continue;
      counts[r.insideBid] = (counts[r.insideBid] || 0) + 1;
    }
    for (const bid of Object.keys(counts)) {
      const b = ALL_BUILDINGS.find(x => x.id === bid); if (!b) continue;
      ctx.fillStyle = 'rgba(0,0,0,0.6)'; roundRect(ctx, b.x + b.w - 18, b.y - 8, 16, 12, 3); ctx.fill();
      ctx.fillStyle = '#FFD700'; ctx.font = 'bold 9px Orbitron'; ctx.textAlign = 'center';
      ctx.fillText(String(counts[bid]), b.x + b.w - 10, b.y + 1);
    }
    ctx.textAlign = 'left';
  }

  function drawHome(ctx, r, id, holiday, st) {
    const x = r.home.x - HOME_W / 2, y = HOME_Y;
    const ch = resolveChar(id, customCharsData);
    ctx.fillStyle = '#3a2a4a'; roundRect(ctx, x, y, HOME_W, HOME_H, 6); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = ch.color; ctx.beginPath(); ctx.moveTo(x - 4, y + 2); ctx.lineTo(x + HOME_W / 2, y - 16); ctx.lineTo(x + HOME_W + 4, y + 2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#1a1a2a'; ctx.fillRect(x + HOME_W / 2 - 9, y + HOME_H - 26, 18, 26);
    const furn = (st && st.furniture) ? (st.furniture[id] || []) : [];
    furn.slice(0, 3).forEach((f, i) => { const it = PC_FURNITURE.find(x => x.id === f); if (it) { ctx.font = '11px serif'; ctx.textAlign = 'center'; ctx.fillText(it.emoji, x + 12 + i * 18, y + HOME_H - 8); } });
    if (r.insideBid === 'home' && r.activity.includes('Sleeping')) { ctx.font = '12px serif'; ctx.textAlign = 'center'; ctx.fillText('💤', x + HOME_W / 2, y + 18); }
    else if (r.insideBid === 'home') { ctx.font = '11px serif'; ctx.textAlign = 'center'; ctx.fillText('🏠', x + HOME_W / 2, y + 18); }
    if (holiday) { ctx.font = '13px serif'; ctx.textAlign = 'center'; ctx.fillText(PC_HOLIDAYS[holiday].decor, x + HOME_W - 6, y + 4); }
    const today = new Date();
    if (r.birthday && r.birthday.m === today.getMonth() + 1 && r.birthday.d === today.getDate()) { ctx.font = '14px serif'; ctx.textAlign = 'center'; ctx.fillText('🎂', x + 6, y + 4); }
    ctx.textAlign = 'left';
  }

  function drawBuilding(ctx, b, holiday) {
    ctx.fillStyle = '#3a3a5a'; roundRect(ctx, b.x, b.y, b.w, b.h, 8); ctx.fill();
    ctx.fillStyle = '#2a2a44'; roundRect(ctx, b.x + 6, b.y + 8, b.w - 12, 18, 4); ctx.fill();
    ctx.fillStyle = '#1a1a2a'; ctx.fillRect(b.x + b.w / 2 - 12, b.y + b.h - 28, 24, 28);
    ctx.font = '24px serif'; ctx.textAlign = 'center'; ctx.fillText(b.emoji, b.x + b.w / 2, b.y + 32);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 8px Orbitron'; ctx.fillText(b.name.toUpperCase(), b.x + b.w / 2, b.y + 14);
    if (holiday) { ctx.font = '14px serif'; ctx.fillText(PC_HOLIDAYS[holiday].decor, b.x + b.w - 8, b.y + 12); }
    ctx.textAlign = 'left';
  }
  function drawGuardianBuilding(ctx, b) {
    ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.beginPath(); ctx.ellipse(b.x + b.w / 2, b.y + b.h + 6, b.w * 0.62, 16, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e8e0ff'; roundRect(ctx, b.x, b.y, b.w, b.h, 8); ctx.fill();
    ctx.fillStyle = '#c8b8ff'; roundRect(ctx, b.x + 6, b.y + 8, b.w - 12, 18, 4); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.fillRect(b.x + b.w / 2 - 12, b.y + b.h - 28, 24, 28);
    ctx.font = '26px serif'; ctx.textAlign = 'center'; ctx.fillText(b.emoji, b.x + b.w / 2, b.y + 34);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 8px Orbitron'; ctx.fillText(b.name.toUpperCase(), b.x + b.w / 2, b.y + 14);
    ctx.textAlign = 'left';
  }
  function drawResident(ctx, st, id) {
    const r = st.residents[id]; const ch = resolveChar(id, customCharsData);
    const moving = Math.abs(r.target.x - r.x) > 6;
    drawSportChar(ctx, r.x, r.y, ch, { facing: r.facing, frame: r.frame, scale: 0.62, jersey: false, state: moving ? 'moving' : 'idle', equippedSkins, equippedAccessories });
    const clothId = (st.clothing && st.clothing[id]) || null; const cloth = clothId ? PC_CLOTHING.find(c => c.id === clothId) : null;
    if (cloth) { ctx.font = '10px serif'; ctx.textAlign = 'center'; ctx.fillText(cloth.emoji, r.x + 8, r.y - 40); }
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(r.x - 34, r.y - 78, 68, 12);
    ctx.fillStyle = ch.color; ctx.font = 'bold 8px Orbitron'; ctx.textAlign = 'center'; ctx.fillText((ch.name || id).slice(0, 10), r.x, r.y - 69);
    const moodCol = { Happy:'#44ff66', Calm:'#66ccff', Excited:'#ffcc44', Focused:'#aa66ff', Tired:'#888888', Hungry:'#ff8844', Nervous:'#6688aa', Sad:'#5588cc', Angry:'#ff4444', Relaxed:'#88ddaa', Motivated:'#ffaa44', Embarrassed:'#ff88cc', Irritated:'#ff4444' }[r.mood] || '#ffffff';
    ctx.fillStyle = moodCol; ctx.beginPath(); ctx.arc(r.x + 26, r.y - 72, 3, 0, Math.PI * 2); ctx.fill();
    // dating couple heart
    const rels = (st.rel && st.rel[id]) || {};
    const dating = Object.keys(rels).some(oid => rels[oid].romance === 'dating');
    if (dating) { ctx.font = '10px serif'; ctx.textAlign = 'center'; ctx.fillText('💕', r.x - 26, r.y - 70); }
    if (r.bubbleT > 0 && r.bubble) {
      const bw = Math.min(170, 60 + r.bubble.length * 5), bh = 22;
      ctx.fillStyle = 'rgba(255,255,255,0.92)'; roundRect(ctx, r.x - bw / 2, r.y - 110, bw, bh, 6); ctx.fill();
      ctx.fillStyle = '#222'; ctx.font = '9px Rajdhani'; ctx.textAlign = 'center';
      ctx.fillText(r.bubble.slice(0, 28), r.x, r.y - 96);
    }
    if (selected === id) { ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(r.x, r.y - 28, 26, 0, Math.PI * 2); ctx.stroke(); }
    ctx.textAlign = 'left';
  }

  const selChar = selected ? resolveChar(selected, customCharsData) : null;
  const selRes = selected ? stRef.current.residents[selected] : null;
  const selLevel = (id) => selected ? (getCharLevelData(progress, id)?.level || 1) : 1;
  const getRep = (id) => getReputation(stRef.current, id);

  return (
    <div className="flex flex-col items-center gap-2 w-full">
      <div className="w-full flex justify-between items-center px-2">
        <button onClick={onBack} className="px-3 py-1 bg-secondary text-secondary-foreground rounded font-body text-xs hover:opacity-80"><GameIcon emoji="←" size={14} /> Back to Menu</button>
        <span className="text-[11px] text-muted-foreground font-body"><GameIcon emoji="🏘️" size={14} /> Personal Community — heroes have lives between battles · click residents & buildings · arrows to scroll</span>
        <div className="flex gap-1">
          <button onClick={() => { const st=stRef.current; const nn=(st.newsLog||[]); if(nn.length){ setNewsItems(nn.map(n=>n.text)); setHighlights(computeHighlights(st)); setShowNews(true);} }} className="px-3 py-1 bg-primary/30 border border-primary text-primary rounded font-heading text-xs hover:bg-primary hover:text-primary-foreground"><GameIcon emoji="📰" size={14} /> NEWS</button>
          <button onClick={() => { if (!selected) { sfx.warning(); return; } setShopOpen(true); }} className="px-3 py-1 bg-primary text-primary-foreground rounded font-heading text-xs"><GameIcon emoji="🛒" size={14} /> SHOP</button>
        </div>
      </div>
      <canvas
        ref={canvasRef} width={CANVAS_W} height={CANVAS_H}
        onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}
        className="rounded-xl shadow-2xl w-full touch-none cursor-grab"
        style={{ width: '100%', maxWidth: '800px', height: 'auto', aspectRatio: `${CANVAS_W} / ${CANVAS_H}` }}
      />
      <div className="flex gap-1.5 justify-center mt-1">
        <button onPointerDown={holdPan('left', true)} onPointerUp={holdPan('left', false)} onPointerLeave={holdPan('left', false)} onPointerCancel={holdPan('left', false)} className="px-3 py-1.5 bg-secondary text-secondary-foreground rounded font-heading text-sm hover:bg-accent hover:text-accent-foreground select-none"><GameIcon emoji="◀" size={14} /></button>
        <button onPointerDown={holdPan('up', true)} onPointerUp={holdPan('up', false)} onPointerLeave={holdPan('up', false)} onPointerCancel={holdPan('up', false)} className="px-3 py-1.5 bg-secondary text-secondary-foreground rounded font-heading text-sm hover:bg-accent hover:text-accent-foreground select-none"><GameIcon emoji="▲" size={14} /></button>
        <button onPointerDown={holdPan('down', true)} onPointerUp={holdPan('down', false)} onPointerLeave={holdPan('down', false)} onPointerCancel={holdPan('down', false)} className="px-3 py-1.5 bg-secondary text-secondary-foreground rounded font-heading text-sm hover:bg-accent hover:text-accent-foreground select-none"><GameIcon emoji="▼" size={14} /></button>
        <button onPointerDown={holdPan('right', true)} onPointerUp={holdPan('right', false)} onPointerLeave={holdPan('right', false)} onPointerCancel={holdPan('right', false)} className="px-3 py-1.5 bg-secondary text-secondary-foreground rounded font-heading text-sm hover:bg-accent hover:text-accent-foreground select-none"><GameIcon emoji="▶" size={14} /></button>
      </div>
      <div className="w-full max-w-md pointer-events-none relative z-30">
        {toasts.map((t, i) => (
          <div key={i} className="bg-card border-2 border-accent rounded-lg px-4 py-2 shadow-xl mb-1 animate-pulse">
            <p className="text-[11px] font-heading text-accent"><GameIcon emoji="🏘️" size={14} /> EVENT</p>
            <p className="text-xs font-body text-foreground">{t}</p>
          </div>
        ))}
      </div>
      {selChar && selRes && (
        <RelationshipJournal
          st={stRef.current} id={selected} customCharsData={customCharsData}
          onClose={() => setSelected(null)}
          onBringOut={bringOut}
          onInteract={(oid) => interact(stRef.current, selected, oid)}
          getReputation={getRep} getLevel={selLevel}
        />
      )}
      {shopOpen && selected && (
        <PCShop stRef={stRef} selected={selected} onSave={saveState} force={force} sfx={sfx} />
      )}
      <RelationshipTree st={stRef.current} customCharsData={customCharsData} onSummon={summonToCursor} selected={selected} onSelect={setSelected} open={showTree} onToggle={() => setShowTree(v => !v)} />
      <ConversationLog st={stRef.current} customCharsData={customCharsData} onSelect={setSelected} />
      {interior && <InteriorView interior={interior} st={stRef.current} customCharsData={customCharsData} onBringOut={bringOut} onSelect={(id) => { setSelected(id); setInterior(null); }} onClose={() => setInterior(null)} />}
      {showNews && <CommunityNews news={newsItems} highlights={highlights} onClose={() => setShowNews(false)} />}
    </div>
  );
}

// ── compute daily highlights / fun facts ──
function computeHighlights(st) {
  const out = [];
  const ids = Object.keys(st.residents || {});
  if (!ids.length) return out;
  // most social
  let best = null, bv = -1;
  ids.forEach(id => { const c = ((st.actions||{})[id]||{}).social || 0; if (c > bv) { bv = c; best = id; } });
  if (best && bv > 0) out.push({ label: 'Most Social', value: resolveChar(best, {}).name });
  // newest friendship
  const news = (st.newsLog || []).filter(n => n.text.includes('met') || n.text.includes('Best Friends'));
  if (news.length) out.push({ label: 'Newest Friendship', value: news[news.length - 1].text.slice(0, 30) + '…' });
  // newest couple
  const couples = (st.newsLog || []).filter(n => n.text.includes('dating'));
  if (couples.length) out.push({ label: 'Newest Couple', value: couples[couples.length - 1].text.slice(0, 30) + '…' });
  // newest breakup
  const breaks = (st.newsLog || []).filter(n => n.text.includes('broke up'));
  if (breaks.length) out.push({ label: 'Newest Breakup', value: breaks[breaks.length - 1].text.slice(0, 30) + '…' });
  // total conversations
  let total = 0; ids.forEach(id => { total += ((st.actions||{})[id]||{}).social || 0; });
  out.push({ label: 'Total Conversations', value: String(total) });
  // couples count
  out.push({ label: 'Active Couples', value: String((st.couples||[]).length) });
  return out;
}

// friendship label (one-directional) for tree edges
function _friendLabel(rel) {
  if (!rel || !rel.met) return 'Stranger';
  const s = rel.friend;
  if (s >= 80) return 'Best Friends';
  if (s >= 60) return 'Good Friends';
  if (s >= 40) return 'Friends';
  if (s >= 20) return 'Talks';
  return 'Knows';
}

// A real visual relationship tree: characters are nodes laid out on a grid,
// SVG lines connect characters with a meaningful relationship (Friends+ / romance / rivalry).
// Lines are one-directional — drawn from source → target with an arrowhead.
function RelationshipTree({ st, customCharsData, onSummon, selected, onSelect, open, onToggle }) {
  const ids = Object.keys(st.residents || {});
  const COLS = 8;
  const NODE = 64, GAP_X = 12, GAP_Y = 70;
  const colW = NODE + GAP_X;
  const rowH = NODE + GAP_Y;

  // positions for each node
  const pos = {};
  ids.forEach((id, i) => { pos[id] = { x: (i % COLS) * colW + NODE / 2, y: Math.floor(i / COLS) * rowH + NODE / 2 }; });
  const width = COLS * colW;
  const rows = Math.ceil(ids.length / COLS);
  const height = rows * rowH;

  // collect edges: a→b where relationship is meaningful
  const edges = [];
  for (const a of ids) {
    const rels = (st.rel && st.rel[a]) || {};
    for (const b of Object.keys(rels)) {
      if (!st.residents[b]) continue;
      const rel = rels[b];
      const fl = _friendLabel(rel);
      const meaningful = rel.met && (rel.friend >= 20 || rel.romance !== 'none' || rel.neg >= 12);
      if (!meaningful) continue;
      let color = '#888', label = fl, dashed = false;
      if (rel.romance === 'dating') { color = '#ff3366'; label = '💍 Dating'; }
      else if (rel.romance === 'crushing') { color = '#ff66aa'; label = '💕 Crushing'; }
      else if (rel.romance === 'interested') { color = '#ff99cc'; label = '✨ Interested'; }
      else if (rel.neg >= 40) { color = '#ff4444'; label = '⚔ Enemy'; dashed = true; }
      else if (rel.neg >= 12) { color = '#cc6644'; label = '⚔ Rival'; dashed = true; }
      else if (rel.friend >= 80) { color = '#44ff88'; label = 'Best Friends'; }
      else if (rel.friend >= 60) { color = '#66dd88'; label = 'Good Friends'; }
      else if (rel.friend >= 40) { color = '#88ccaa'; label = 'Friends'; }
      else if (rel.friend >= 20) { color = '#aabbcc'; label = 'Talks'; }
      else { color = '#999'; label = 'Knows'; }
      edges.push({ a, b, color, label, dashed });
    }
  }

  return (
    <div className="w-full max-w-4xl bg-card/80 border-2 border-border rounded-xl p-2 shadow-xl relative z-10">
      <div className="flex justify-between items-center mb-1">
        <p className="text-[10px] font-heading text-accent"><GameIcon emoji="🌳" size={14} /> RELATIONSHIP TREE — one-directional arrows · click a node to summon</p>
        <button onClick={onToggle} className="text-[9px] font-heading text-muted-foreground hover:text-foreground">{open ? <><GameIcon emoji="▼" size={14} /> HIDE</> : <><GameIcon emoji="▶" size={14} /> SHOW</>}</button>
      </div>
      {open && (
        <div className="overflow-auto max-h-72 bg-muted/20 rounded-lg p-1">
          <svg width={width} height={height} style={{ minWidth: '100%' }}>
            {/* edges first so nodes draw on top */}
            {edges.map((e, i) => {
              const pa = pos[e.a], pb = pos[e.b]; if (!pa || !pb) return null;
              const mx = (pa.x + pb.x) / 2, my = (pa.y + pb.y) / 2;
              // shorten endpoints so the arrow doesn't bury under the node
              const dx = pb.x - pa.x, dy = pb.y - pa.y;
              const len = Math.hypot(dx, dy) || 1;
              const ux = dx / len, uy = dy / len;
              const x1 = pa.x + ux * (NODE / 2 + 2), y1 = pa.y + uy * (NODE / 2 + 2);
              const x2 = pb.x - ux * (NODE / 2 + 6), y2 = pb.y - uy * (NODE / 2 + 6);
              return (
                <g key={i}>
                  <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={e.color} strokeWidth={e.romance || e.label.includes('Best') ? 2.4 : 1.4} strokeDasharray={e.dashed ? '4 3' : undefined} opacity={0.75} markerEnd="url(#pcarrow)" />
                  {Math.abs(dy) > 40 && (
                    <text x={mx} y={my} fontSize="7" fill={e.color} textAnchor="middle" style={{ paintOrder: 'stroke', stroke: '#00000088', strokeWidth: 2 }}>{e.label}</text>
                  )}
                </g>
              );
            })}
            <defs>
              <marker id="pcarrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6 Z" fill="#aaa" />
              </marker>
            </defs>
            {/* nodes */}
            {ids.map(id => {
              const p = pos[id]; const ch = resolveChar(id, customCharsData);
              const isSel = selected === id;
              const rels = (st.rel && st.rel[id]) || {};
              const dating = Object.keys(rels).some(oid => rels[oid].romance === 'dating');
              return (
                <g key={id} style={{ cursor: 'pointer' }} onClick={() => { onSummon(id); }}>
                  <circle cx={p.x} cy={p.y} r={NODE / 2} fill={ch.color} stroke={isSel ? '#FFD700' : '#00000055'} strokeWidth={isSel ? 3 : 1.5} />
                  <text x={p.x} y={p.y + 3} fontSize="7" fill="#fff" textAnchor="middle" fontWeight="bold" style={{ paintOrder: 'stroke', stroke: '#00000088', strokeWidth: 2 }}>{(ch.name || id).slice(0, 8)}</text>
                  {dating && <text x={p.x + NODE / 2 - 2} y={p.y - NODE / 2 + 6} fontSize="10" textAnchor="middle"><GameIcon emoji="💕" size={14} /></text>}
                </g>
              );
            })}
          </svg>
        </div>
      )}
    </div>
  );
}

// Conversation log: shows each recent conversation and every dialogue line spoken.
function ConversationLog({ st, customCharsData, onSelect }) {
  const convs = st.convLog || [];
  return (
    <div className="w-full max-w-4xl bg-card/70 border border-border rounded-xl p-2 shadow-xl relative z-10">
      <p className="text-[10px] font-heading text-accent mb-1"><GameIcon emoji="💬" size={14} /> RECENT CONVERSATIONS</p>
      {convs.length === 0 && <p className="text-[10px] text-muted-foreground">No conversations yet — residents will talk as they meet.</p>}
      <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto">
        {convs.map((c, i) => {
          const aCh = resolveChar(c.aId, customCharsData), bCh = resolveChar(c.bId, customCharsData);
          return (
            <div key={i} className="bg-muted/30 border border-border rounded-lg p-2">
              <div className="flex items-center gap-2 mb-1">
                <button onClick={() => onSelect(c.aId)} className="flex items-center gap-1 hover:underline">
                  <span className="w-3 h-3 rounded-full" style={{ background: aCh.color }} />
                  <span className="text-[10px] font-heading text-accent">{c.a}</span>
                </button>
                <span className="text-[9px] text-muted-foreground"><GameIcon emoji="↔" size={14} /> {c.cat}</span>
                <button onClick={() => onSelect(c.bId)} className="flex items-center gap-1 hover:underline ml-auto">
                  <span className="text-[10px] font-heading text-accent">{c.b}</span>
                  <span className="w-3 h-3 rounded-full" style={{ background: bCh.color }} />
                </button>
              </div>
              <div className="flex flex-col gap-0.5 pl-1">
                {c.lines.map((l, j) => (
                  <p key={j} className="text-[10px] font-body text-foreground">
                    <span className="text-muted-foreground">{l.who}:</span> {l.text}
                  </p>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function InteriorView({ interior, st, customCharsData, onBringOut, onSelect, onClose }) {
  if (!interior) return null;
  const card = 'bg-card border-2 border-accent rounded-xl p-4 max-w-md w-full shadow-2xl';
  if (interior.kind === 'building') {
    const b = interior.b;
    // residents INSIDE this building (disappeared from outside)
    const inside = Object.keys(st.residents).filter(id => st.residents[id].insideBid === b.id);
    return (
      <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
        <div className={card} onClick={e => e.stopPropagation()}>
          <div className="flex justify-between items-center mb-2">
            <p className="font-heading text-accent text-lg">{b.emoji} {b.name}</p>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><GameIcon emoji="✕" size={14} /></button>
          </div>
          <p className="text-[11px] font-body text-muted-foreground mb-2">Inside {b.name}:</p>
          <div className="flex flex-wrap gap-2 mb-3 min-h-[28px]">
            {inside.length === 0 && <span className="text-[10px] text-muted-foreground">Nobody is inside right now.</span>}
            {inside.map(id => { const ch = resolveChar(id, customCharsData); return (
              <div key={id} className="flex items-center gap-1.5 bg-muted/40 border border-border rounded-lg px-2 py-1">
                <span className="w-4 h-4 rounded-full" style={{ background: ch.color }} />
                <span className="text-[11px] font-heading text-foreground">{ch.name}</span>
                <button onClick={() => { onBringOut(id); }} className="ml-1 px-1.5 py-0.5 bg-accent text-accent-foreground rounded text-[8px] font-heading">BRING OUT</button>
                <button onClick={() => { onSelect(id); }} className="px-1.5 py-0.5 bg-secondary text-secondary-foreground rounded text-[8px] font-heading">VIEW</button>
              </div>
            ); })}
          </div>
          <button onClick={onClose} className="w-full px-3 py-1.5 bg-secondary text-secondary-foreground rounded font-heading text-xs">EXIT</button>
        </div>
      </div>
    );
  }
  // home view
  const id = interior.id; const r = st.residents[id]; if (!r) return null;
  const ch = resolveChar(id, customCharsData);
  const furn = (st.furniture && st.furniture[id]) || [];
  const isHome = r.insideBid === 'home';
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className={card} onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-2">
          <p className="font-heading text-accent text-lg">{ch.name}'s Home</p>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><GameIcon emoji="✕" size={14} /></button>
        </div>
        <div className="flex items-center gap-2 mb-3">
          <span className="w-9 h-9 rounded-full border-2 border-border" style={{ background: ch.color }} />
          <div>
            <p className="text-[11px] font-body text-foreground">{r.activity}</p>
            <p className="text-[10px] text-muted-foreground">{PC_HOME_STYLES[PC_TRAITS[id]?.personality]}</p>
          </div>
        </div>
        <p className="text-[10px] font-heading text-muted-foreground mb-1">FURNITURE</p>
        <div className="flex flex-wrap gap-1 mb-3 min-h-[24px]">
          {furn.length === 0 && <span className="text-[10px] text-muted-foreground">Empty — buy furniture in the Shop.</span>}
          {furn.map(fid => { const it = PC_FURNITURE.find(f => f.id === fid); return it ? <span key={fid} className="text-xl">{it.emoji}</span> : null; })}
        </div>
        <div className="flex gap-2">
          {isHome && <button onClick={() => { onBringOut(id); onClose(); }} className="flex-1 px-3 py-1.5 bg-accent text-accent-foreground rounded font-heading text-xs"><GameIcon emoji="🚪" size={14} /> BRING OUTSIDE</button>}
          <button onClick={() => { onSelect(id); onClose(); }} className="flex-1 px-3 py-1.5 bg-secondary text-secondary-foreground rounded font-heading text-xs">VIEW JOURNAL</button>
        </div>
      </div>
    </div>
  );
}