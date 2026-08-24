import React, { useState, useRef, useEffect } from 'react';
import { HEROES } from './heroes.js';
import { VILLAINS } from './villains.js';
import { GUARDIANS } from './guardians.js';
import { getCharNumber } from './characterNumber.js';
import { applyElement } from './elements.js';
import SoccerFighter from './SoccerFighter.jsx';
import CharStats from './CharStats.jsx';
import ElementSelect from './ElementSelect.jsx';
import { sfx } from './sfx.js';
import { music } from './music.js';
import KnockoutBracket from './KnockoutBracket.jsx';
import FixturesModal from './FixturesModal.jsx';
import TrophyCeremony from './TrophyCeremony.jsx';
import TournamentMatchSummary from './TournamentMatchSummary.jsx';
import GameIcon from "./GameIcon.jsx";

const ALL = [...HEROES, ...VILLAINS, ...GUARDIANS];
// Tournament roster = heroes + villains only (no guardians, no evil) = 35 character ids, sorted by number
const POOL = [...HEROES, ...VILLAINS].filter(c => c.id !== 'evil').map(c => c.id)
  .sort((a, b) => (getCharNumber(a) ?? 999) - (getCharNumber(b) ?? 999));
const GROUP_NAMES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const PARTICIPANT_COUNT = 32;
const GROUP_SIZE = 4;

function shuffle(arr) { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

function charById(id) { return ALL.find(c => c.id === id); }

// Generate group stage matches in a fixed round-robin schedule.
// Each group's members are sorted alphabetically; the 3 rounds are:
//   Round 0: 1v2, 3v4
//   Round 1: 3v1, 2v4
//   Round 2: 4v1, 2v3
// Matches are interleaved across all groups per round so the order is:
// Group A (2 matches) -> Group B -> ... -> Group H, then back to A for round 2, etc.
function generateGroupMatches(groups) {
  const matches = [];
  for (let round = 0; round < 3; round++) {
    groups.forEach((group, gi) => {
      const sorted = [...group].sort((a, b) => charById(a).name.localeCompare(charById(b).name));
      const s = sorted;
      let m1, m2;
      if (round === 0) { m1 = [s[0], s[1]]; m2 = [s[2], s[3]]; }
      else if (round === 1) { m1 = [s[2], s[0]]; m2 = [s[1], s[3]]; }
      else { m1 = [s[3], s[0]]; m2 = [s[1], s[2]]; }
      matches.push({ groupIdx: gi, groupName: GROUP_NAMES[gi], home: m1[0], away: m1[1], played: false, homeScore: 0, awayScore: 0, round });
      matches.push({ groupIdx: gi, groupName: GROUP_NAMES[gi], home: m2[0], away: m2[1], played: false, homeScore: 0, awayScore: 0, round });
    });
  }
  return matches;
}

// Simulate a bot vs bot match: random 1-10 for each, re-roll if tie
function simulateMatch() {
  let h, a;
  do { h = Math.floor(Math.random() * 11); a = Math.floor(Math.random() * 11); } while (h === a);
  return { homeScore: h, awayScore: a, goalTimes: generateGoalTimes(h, a) };
}

function generateGoalTimes(homeScore, awayScore) {
  const times = [];
  for (let i = 0; i < homeScore; i++) times.push({ team: 'home', second: Math.floor(Math.random() * 90) + 1 });
  for (let i = 0; i < awayScore; i++) times.push({ team: 'away', second: Math.floor(Math.random() * 90) + 1 });
  return times.sort((a, b) => a.second - b.second);
}

// Compute standings from played matches
function computeStandings(groups, matches) {
  return groups.map((group, gi) => {
    const standings = group.map(id => ({
      charId: id, points: 0, wins: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, cleanSheets: 0, played: 0,
    }));
    matches.filter(m => m.groupIdx === gi && m.played).forEach(m => {
      const home = standings.find(s => s.charId === m.home);
      const away = standings.find(s => s.charId === m.away);
      if (!home || !away) return;
      home.played++; away.played++;
      home.goalsFor += m.homeScore; home.goalsAgainst += m.awayScore;
      away.goalsFor += m.awayScore; away.goalsAgainst += m.homeScore;
      if (m.homeScore > m.awayScore) { home.wins++; home.points += 3; away.losses++; }
      else { away.wins++; away.points += 3; home.losses++; }
      if (m.awayScore === 0) home.cleanSheets++;
      if (m.homeScore === 0) away.cleanSheets++;
    });
    // Sort: points → goalsFor → goalsAgainst (lower conceded) → random
    standings.sort((a, b) => b.points - a.points || b.goalsFor - a.goalsFor || a.goalsAgainst - b.goalsAgainst || Math.random() - 0.5);
    return standings;
  });
}

export default function GroupTournament({ onBack, onEnd, onShop, unlockedIds, favoriteId, sfxVolume = 70, musicVolume = 50, equippedAccessories = {}, equippedSkins = {}, settings = {}, charLevels = {}, equippedElements = {}, onEquipElement, onAward }) {
  const [phase, setPhase] = useState('setup');
  const [humanCount, setHumanCount] = useState(1);
  const [difficulty, setDifficulty] = useState(settings?.defaultCPUDifficulty || 'regular');
  const [participants, setParticipants] = useState([]);
  const [humanIds, setHumanIds] = useState(new Set());
  const [groups, setGroups] = useState([]);
  const [matches, setMatches] = useState([]);
  const [currentMatchIdx, setCurrentMatchIdx] = useState(0);
  const [standings, setStandings] = useState([]);
  const [knockoutStage, setKnockoutStage] = useState(null); // { round, matches, results }
  const [showGroups, setShowGroups] = useState(false);
  const [showTop, setShowTop] = useState(false);
  const [showOriginalGroups, setShowOriginalGroups] = useState(false);
  const [simResult, setSimResult] = useState(null);
  const [champion, setChampion] = useState(null);
  const [elements, setElements] = useState({});
  const [randomizing, setRandomizing] = useState(false);
  const [selectedForSwap, setSelectedForSwap] = useState(null);
  const [trophyTimer, setTrophyTimer] = useState(0);
  const [matchActive, setMatchActive] = useState(false);     // replaces window._playMatch / _playKnockout
  const [matchSummary, setMatchSummary] = useState(null);    // post-match score + timeline screen
  const [showSides, setShowSides] = useState(false);          // select-sides sub-screen
  const [showFixtures, setShowFixtures] = useState(false);     // fixtures (all matches) modal
  const [sideChoice, setSideChoice] = useState('arrows');     // controls the home-side human picks
  const [groupSelected, setGroupSelected] = useState(null);  // highlighted char in group draw
  const [dragSrc, setDragSrc] = useState(null);
  const [dragHover, setDragHover] = useState(null);
  const [tournamentName, setTournamentName] = useState('');
  const [currentTournamentId, setTournamentId] = useState(null);
  const [savedTournaments, setSavedTournaments] = useState(() => { try { return JSON.parse(localStorage.getItem('element6_saved_tournaments') || '[]'); } catch { return []; } });

  useEffect(() => { music.setVolume(musicVolume); sfx.setVolume(sfxVolume); music.play('menu'); return () => music.stop(); }, [musicVolume, sfxVolume]);

  // ── Phase: Setup ──
  const startRandomize = () => {
    if (!currentTournamentId) setTournamentId('t-' + Date.now());
    setPhase('randomize');
    doRandomize();
  };

  const doRandomize = () => {
    setRandomizing(true);
    setTimeout(() => {
      // Random 32 from the 35-character pool (heroes + villains, no guardians)
      const shuffled = shuffle(POOL).slice(0, PARTICIPANT_COUNT);
      setParticipants(shuffled);
      setRandomizing(false);
    }, 1500);
  };

  // ── Phase: Human Select ──
  const toggleHuman = (id) => {
    const next = new Set(humanIds);
    if (next.has(id)) next.delete(id);
    else if (next.size < humanCount) next.add(id);
    setHumanIds(next);
  };

  const proceedToGroupDraw = () => {
    const shuffled = shuffle(participants);
    const newGroups = [];
    for (let i = 0; i < 8; i++) newGroups.push(shuffled.slice(i * 4, i * 4 + 4));
    setGroups(newGroups);
    setMatches(generateGroupMatches(newGroups));
    setStandings(computeStandings(newGroups, []));
    setPhase('groupDraw');
  };

  const reRandomizeGroups = () => {
    const shuffled = shuffle(participants);
    const newGroups = [];
    for (let i = 0; i < 8; i++) newGroups.push(shuffled.slice(i * 4, i * 4 + 4));
    setGroups(newGroups);
    setMatches(generateGroupMatches(newGroups));
    setStandings(computeStandings(newGroups, []));
  };

  const swapBetweenGroups = (gi1, pi1, gi2, pi2) => {
    const newGroups = groups.map(g => [...g]);
    const tmp = newGroups[gi1][pi1]; newGroups[gi1][pi1] = newGroups[gi2][pi2]; newGroups[gi2][pi2] = tmp;
    setGroups(newGroups);
    setMatches(generateGroupMatches(newGroups));
    setStandings(computeStandings(newGroups, matches.filter(m => !m.played)));
  };

  // ── Phase: Match Play ──
  const startMatchPlay = () => {
    setCurrentMatchIdx(0);
    setMatchActive(false);
    setShowSides(false);
    setPhase('matchplay');
  };

  const currentMatch = matches[currentMatchIdx];
  const currentGroupName = currentMatch ? currentMatch.groupName : '';

  const handleMatchResult = (result) => {
    if (result) {
      // Actual played match
      const newMatches = [...matches];
      const m = newMatches[currentMatchIdx];
      m.played = true;
      m.homeScore = result.p1Score ?? 0;
      m.awayScore = result.p2Score ?? 0;
      setMatches(newMatches);
      setStandings(computeStandings(groups, newMatches));
    }
    advanceToNextMatch();
  };

  const handleSimulate = () => {
    const sim = simulateMatch();
    const newMatches = [...matches];
    const m = newMatches[currentMatchIdx];
    m.played = true; m.homeScore = sim.homeScore; m.awayScore = sim.awayScore;
    setMatches(newMatches);
    setStandings(computeStandings(groups, newMatches));
    setMatchActive(false);
    setMatchSummary({ kind: 'group', home: m.home, away: m.away, groupName: m.groupName, homeScore: sim.homeScore, awayScore: sim.awayScore, goalLog: sim.goalTimes, recorded: true });
  };

  // Simulate all bot-vs-bot matches until the next human match (or end of group stage)
  const simulateToNextHumanGroup = () => {
    const newMatches = matches.map(m => ({ ...m }));
    let humanIdx = -1;
    for (let i = currentMatchIdx; i < newMatches.length; i++) {
      const m = newMatches[i];
      if (humanIds.has(m.home) || humanIds.has(m.away)) { humanIdx = i; break; }
      if (!m.played) {
        const sim = simulateMatch();
        m.played = true; m.homeScore = sim.homeScore; m.awayScore = sim.awayScore;
      }
    }
    setMatches(newMatches);
    setStandings(computeStandings(groups, newMatches));
    setMatchActive(false); setShowSides(false);
    if (humanIdx === -1) setPhase('groupResults');
    else setCurrentMatchIdx(humanIdx);
  };

  const advanceToNextMatch = () => {
    setSimResult(null);
    setMatchActive(false);
    setShowSides(false);
    const next = currentMatchIdx + 1;
    if (next < matches.length) {
      setCurrentMatchIdx(next);
    } else {
      // Group stage complete → show results
      setPhase('groupResults');
    }
  };

  // ── Phase: Group Results → Knockout ──
  const proceedToKnockout = () => {
    // Top 2 from each group advance (16 teams)
    const qualified = [];
    standings.forEach(groupStandings => {
      qualified.push(groupStandings[0].charId, groupStandings[1].charId);
    });
    // Round of 16: 1st of A vs 2nd of B, 1st of B vs 2nd of A, etc.
    const r16 = [];
    for (let i = 0; i < 8; i++) {
      const g1 = standings[i];
      const g2 = standings[(i + 1) % 8];
      r16.push({ home: g1[0].charId, away: g2[1].charId, played: false, homeScore: 0, awayScore: 0, round: 'r16' });
    }
    setKnockoutStage({ round: 'r16', matches: r16, rounds: { r16 }, qualified });
    setPhase('knockout');
    setCurrentMatchIdx(0);
  };

  // ── Knockout phase ──
  const knockoutMatch = knockoutStage?.matches[currentMatchIdx];
  const knockoutRoundName = knockoutStage?.round === 'r16' ? 'ROUND OF 16' : knockoutStage?.round === 'qf' ? 'QUARTER FINAL' : knockoutStage?.round === 'sf' ? 'SEMI FINAL' : knockoutStage?.round === 'final' ? 'FINAL' : '';

  const handleKnockoutResult = (result) => {
    if (result) {
      const ks = { ...knockoutStage };
      ks.matches = [...ks.matches];
      ks.matches[currentMatchIdx] = { ...ks.matches[currentMatchIdx], played: true, homeScore: result.p1Score ?? 0, awayScore: result.p2Score ?? 0 };
      setKnockoutStage(ks);
    }
    advanceKnockout();
  };

  const handleKnockoutSim = () => {
    const sim = simulateMatch();
    const ks = { ...knockoutStage };
    ks.matches = [...ks.matches];
    ks.matches[currentMatchIdx] = { ...ks.matches[currentMatchIdx], played: true, homeScore: sim.homeScore, awayScore: sim.awayScore };
    setKnockoutStage(ks);
    setMatchActive(false);
    const krName = knockoutStage?.round === 'r16' ? 'ROUND OF 16' : knockoutStage?.round === 'qf' ? 'QUARTER FINAL' : knockoutStage?.round === 'sf' ? 'SEMI FINAL' : 'FINAL';
    setMatchSummary({ kind: 'knockout', home: knockoutMatch.home, away: knockoutMatch.away, subtitle: krName, homeScore: sim.homeScore, awayScore: sim.awayScore, goalLog: sim.goalTimes, recorded: true });
  };

  // Simulate all bot-vs-bot knockout matches until the next human match (or tournament end)
  const simulateToNextHumanKnockout = () => {
    let ks = {
      ...knockoutStage,
      matches: knockoutStage.matches.map(m => ({ ...m })),
      rounds: { ...knockoutStage.rounds },
    };
    while (true) {
      // Look for a human match in the current round
      let humanIdx = -1;
      for (let i = 0; i < ks.matches.length; i++) {
        const m = ks.matches[i];
        if (humanIds.has(m.home) || humanIds.has(m.away)) { humanIdx = i; break; }
      }
      if (humanIdx >= 0) {
        // Simulate all bot matches before the human match
        for (let i = 0; i < humanIdx; i++) {
          const m = ks.matches[i];
          if (!m.played) {
            const sim = simulateMatch();
            m.played = true; m.homeScore = sim.homeScore; m.awayScore = sim.awayScore;
          }
        }
        setKnockoutStage(ks);
        setCurrentMatchIdx(humanIdx);
        setMatchActive(false); setShowSides(false);
        return;
      }
      // No human match in this round — simulate all and advance
      for (let i = 0; i < ks.matches.length; i++) {
        const m = ks.matches[i];
        if (!m.played) {
          const sim = simulateMatch();
          m.played = true; m.homeScore = sim.homeScore; m.awayScore = sim.awayScore;
        }
      }
      const winners = ks.matches.map(m => m.homeScore > m.awayScore ? m.home : m.away);
      if (ks.round === 'r16') {
        const qf = [];
        for (let i = 0; i < 8; i += 2) qf.push({ home: winners[i], away: winners[i + 1], played: false, homeScore: 0, awayScore: 0, round: 'qf' });
        ks = { round: 'qf', matches: qf, rounds: { ...ks.rounds, qf }, qualified: ks.qualified };
      } else if (ks.round === 'qf') {
        const sf = [];
        for (let i = 0; i < 4; i += 2) sf.push({ home: winners[i], away: winners[i + 1], played: false, homeScore: 0, awayScore: 0, round: 'sf' });
        ks = { round: 'sf', matches: sf, rounds: { ...ks.rounds, sf }, qualified: ks.qualified };
      } else if (ks.round === 'sf') {
        const final = [{ home: winners[0], away: winners[1], played: false, homeScore: 0, awayScore: 0, round: 'final' }];
        ks = { round: 'final', matches: final, rounds: { ...ks.rounds, final }, qualified: ks.qualified };
      } else if (ks.round === 'final') {
        const champ = winners[0];
        setKnockoutStage(ks);
        setChampion(champ);
        setPhase('ceremony');
        onAward?.({ tournamentWon: true, groupTournament: true, champion: champ, reward: 100, xpPerChar: 1000, battlePassXP: 250, participants });
        // Remove from saves on completion
        if (currentTournamentId) {
          const list = savedTournaments.filter(t => t.id !== currentTournamentId);
          setSavedTournaments(list);
          try { localStorage.setItem('element6_saved_tournaments', JSON.stringify(list)); } catch {}
        }
        return;
      }
    }
  };

  // Continue from the post-match summary: record the result (if not already)
  // then advance to the next match / next round.
  const continueMatchSummary = () => {
    const s = matchSummary;
    if (!s) return;
    if (s.kind === 'group') {
      if (!s.recorded) handleMatchResult({ p1Score: s.homeScore, p2Score: s.awayScore });
      else advanceToNextMatch();
    } else {
      if (!s.recorded) handleKnockoutResult({ p1Score: s.homeScore, p2Score: s.awayScore });
      else advanceKnockout();
    }
    setMatchSummary(null);
  };

  const advanceKnockout = () => {
    setSimResult(null);
    setMatchActive(false);
    setShowSides(false);
    const ks = knockoutStage;
    const next = currentMatchIdx + 1;

    if (next < ks.matches.length) {
      setCurrentMatchIdx(next);
      return;
    }

    // Round complete → build next round
    const winners = ks.matches.map(m => m.homeScore > m.awayScore ? m.home : m.away);
    if (ks.round === 'r16') {
      const qf = [];
      for (let i = 0; i < 8; i += 2) qf.push({ home: winners[i], away: winners[i + 1], played: false, homeScore: 0, awayScore: 0, round: 'qf' });
      setKnockoutStage({ round: 'qf', matches: qf, rounds: { ...ks.rounds, qf }, qualified: ks.qualified });
      setCurrentMatchIdx(0);
      setPhase('knockout');
    } else if (ks.round === 'qf') {
      const sf = [];
      for (let i = 0; i < 4; i += 2) sf.push({ home: winners[i], away: winners[i + 1], played: false, homeScore: 0, awayScore: 0, round: 'sf' });
      setKnockoutStage({ round: 'sf', matches: sf, rounds: { ...ks.rounds, sf }, qualified: ks.qualified });
      setCurrentMatchIdx(0);
      setPhase('knockout');
    } else if (ks.round === 'sf') {
      const final = [{ home: winners[0], away: winners[1], played: false, homeScore: 0, awayScore: 0, round: 'final' }];
      setKnockoutStage({ round: 'final', matches: final, rounds: { ...ks.rounds, final }, qualified: ks.qualified });
      setCurrentMatchIdx(0);
      setPhase('knockout');
    } else if (ks.round === 'final') {
      const champ = winners[0];
      setChampion(champ);
      setPhase('ceremony');
      // Award rewards without navigating away — the ceremony + awards screens follow.
      onAward?.({ tournamentWon: true, groupTournament: true, champion: champ, reward: 100, xpPerChar: 1000, battlePassXP: 250, participants });
      // Remove this tournament from saves since it's complete
      if (currentTournamentId) {
        const list = savedTournaments.filter(t => t.id !== currentTournamentId);
        setSavedTournaments(list);
        try { localStorage.setItem('element6_saved_tournaments', JSON.stringify(list)); } catch {}
      }
    }
  };

  // Trophy animation timer
  useEffect(() => {
    if (phase === 'champion' && trophyTimer > 0) {
      const t = setTimeout(() => setTrophyTimer(t => t - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [phase, trophyTimer]);

  // ── Top scorers across all matches ──
  const allScorers = () => {
    const scorers = {};
    [...matches, ...(knockoutStage?.matches || [])].filter(m => m.played).forEach(m => {
      if (scorers[m.home]) scorers[m.home] += m.homeScore; else scorers[m.home] = m.homeScore;
      if (scorers[m.away]) scorers[m.away] += m.awayScore; else scorers[m.away] = m.awayScore;
    });
    return Object.entries(scorers).sort((a, b) => b[1] - a[1]).slice(0, 10);
  };

  const allCleanSheets = () => {
    const sheets = {};
    const allMatches = [...matches, ...(knockoutStage?.matches || [])].filter(m => m.played);
    allMatches.forEach(m => {
      if (m.awayScore === 0) sheets[m.home] = (sheets[m.home] || 0) + 1;
      if (m.homeScore === 0) sheets[m.away] = (sheets[m.away] || 0) + 1;
    });
    return Object.entries(sheets).sort((a, b) => b[1] - a[1]).slice(0, 10);
  };

  const allGoalsConceded = () => {
    const conceded = {};
    [...matches, ...(knockoutStage?.matches || [])].filter(m => m.played).forEach(m => {
      conceded[m.home] = (conceded[m.home] || 0) + m.awayScore;
      conceded[m.away] = (conceded[m.away] || 0) + m.homeScore;
    });
    return Object.entries(conceded).sort((a, b) => a[1] - b[1]);
  };

  // Swap two characters by id (used by the native drag in group draw).
  const swapChars = (aId, bId) => {
    let aPos = null, bPos = null;
    groups.forEach((g, gi) => g.forEach((id, pi) => {
      if (id === aId) aPos = { gi, pi };
      if (id === bId) bPos = { gi, pi };
    }));
    if (aPos && bPos) swapBetweenGroups(aPos.gi, aPos.pi, bPos.gi, bPos.pi);
  };

  const saveAndExit = () => {
    if (!participants.length) { onBack(); return; }
    const state = { phase, humanCount, difficulty, participants, humanIds: [...humanIds], groups, matches, currentMatchIdx, standings, knockoutStage, elements, champion, tournamentName };
    const id = currentTournamentId || ('t-' + Date.now());
    if (!currentTournamentId) setTournamentId(id);
    const entry = { id, name: tournamentName || 'Untitled Tournament', savedAt: Date.now(), state };
    const list = savedTournaments.filter(t => t.id !== id);
    list.unshift(entry);
    const trimmed = list.slice(0, 20);
    try { localStorage.setItem('element6_saved_tournaments', JSON.stringify(trimmed)); } catch {}
    setSavedTournaments(trimmed);
    onBack();
  };

  const continueTournament = (entry) => {
    const s = entry.state || {};
    setTournamentId(entry.id);
    setTournamentName(entry.name || '');
    setHumanCount(s.humanCount ?? 1);
    setDifficulty(s.difficulty ?? 'regular');
    setParticipants(s.participants || []);
    setHumanIds(new Set(s.humanIds || []));
    setGroups(s.groups || []);
    setMatches(s.matches || []);
    setCurrentMatchIdx(s.currentMatchIdx ?? 0);
    setStandings(s.standings || []);
    setKnockoutStage(s.knockoutStage || null);
    setElements(s.elements || {});
    setChampion(s.champion || null);
    setPhase(s.phase || 'groupDraw');
  };

  const deleteSaved = (id) => {
    const list = savedTournaments.filter(t => t.id !== id);
    setSavedTournaments(list);
    try { localStorage.setItem('element6_saved_tournaments', JSON.stringify(list)); } catch {}
  };

  // ════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════

  // ── Post-match summary (score + goal timeline) — shown after every match ──
  if (matchSummary) {
    return (
      <TournamentMatchSummary
        homeChar={charById(matchSummary.home)} awayChar={charById(matchSummary.away)}
        homeScore={matchSummary.homeScore} awayScore={matchSummary.awayScore}
        goalLog={matchSummary.goalLog}
        subtitle={matchSummary.kind === 'group' ? `GROUP ${matchSummary.groupName}` : (matchSummary.subtitle || '')}
        humanHome={humanIds.has(matchSummary.home)} humanAway={humanIds.has(matchSummary.away)}
        onContinue={continueMatchSummary}
      />
    );
  }

  // ── Setup Screen ──
  if (phase === 'setup') {
    return (
      <div className="flex flex-col items-center gap-4 w-full max-w-2xl">
        <div className="flex justify-between items-center w-full">
          <h2 className="text-2xl font-heading text-accent tracking-wider">GROUP TOURNAMENT</h2>
          <button onClick={onBack} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-heading text-sm hover:opacity-80"><GameIcon emoji="←" size={14} /> BACK</button>
        </div>

        {savedTournaments.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-4 w-full">
            <p className="text-sm font-heading text-accent mb-2">CONTINUE A PREVIOUS TOURNAMENT</p>
            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
              {savedTournaments.map(t => (
                <div key={t.id} className="flex items-center justify-between gap-2 bg-secondary/40 rounded-lg px-3 py-2">
                  <div className="flex flex-col">
                    <span className="font-heading text-sm text-foreground">{t.name}</span>
                    <span className="text-[10px] text-muted-foreground">{(t.state?.phase || 'in progress').toUpperCase()} · saved {new Date(t.savedAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => continueTournament(t)} className="px-3 py-1.5 bg-accent text-accent-foreground rounded font-heading text-xs">CONTINUE</button>
                    <button onClick={() => deleteSaved(t.id)} className="px-3 py-1.5 bg-destructive/80 text-destructive-foreground rounded font-heading text-xs">DELETE</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-card border border-border rounded-xl p-6 w-full flex flex-col gap-5">
          <p className="text-sm font-heading text-accent text-center">— OR START A NEW TOURNAMENT —</p>
          <div>
            <p className="text-sm font-heading text-accent mb-2">TOURNAMENT NAME</p>
            <input value={tournamentName} onChange={e => setTournamentName(e.target.value)}               placeholder={`e.g. ${new Date().getFullYear()} Element 6 World Tournament`} maxLength={30}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded text-sm font-body border border-border w-full" />
          </div>
          <div>
            <p className="text-sm font-heading text-accent mb-2">HUMAN PLAYERS</p>
            <p className="text-xs text-muted-foreground mb-3">How many human players will participate? (Max 16)</p>
            <div className="flex items-center gap-3">
              <button onClick={() => setHumanCount(Math.max(0, humanCount - 1))} className="w-10 h-10 bg-secondary text-secondary-foreground rounded-lg font-heading text-xl">-</button>
              <span className="text-3xl font-heading text-accent w-12 text-center">{humanCount}</span>
              <button onClick={() => setHumanCount(Math.min(16, humanCount + 1))} className="w-10 h-10 bg-secondary text-secondary-foreground rounded-lg font-heading text-xl">+</button>
            </div>
          </div>
          <div>
            <p className="text-sm font-heading text-accent mb-2">CPU DIFFICULTY</p>
            <select value={difficulty} onChange={e => setDifficulty(e.target.value)} className="px-4 py-2 bg-secondary text-secondary-foreground rounded text-sm font-body border border-border w-full">
              <option value="newcomer">Newcomer</option>
              <option value="beginner">Beginner</option>
              <option value="easy">Easy</option>
              <option value="amateur">Amateur</option>
              <option value="regular">Regular</option>
              <option value="pro">Pro</option>
              <option value="hard">Hard</option>
              <option value="insane">Insane</option>
              <option value="honored">Honored</option>
            </select>
          </div>
          <button onClick={startRandomize} className="px-6 py-3 bg-accent text-accent-foreground rounded-lg font-heading text-lg hover:opacity-90">START NEW TOURNAMENT <GameIcon emoji="→" size={14} /></button>
        </div>
      </div>
    );
  }

  // ── Randomization Screen ──
  if (phase === 'randomize') {
    const notChosen = POOL.filter(p => !participants.includes(p));
    return (
      <div className="flex flex-col items-center gap-3 w-full max-w-4xl max-h-[85vh] overflow-y-auto p-2">
        <h2 className="text-2xl font-heading text-accent tracking-wider">SELECTING FIGHTERS</h2>
        {randomizing && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-heading text-muted-foreground animate-pulse">Randomizing 32 of {POOL.length}...</p>
          </div>
        )}
        {!randomizing && (
          <>
            <p className="text-sm text-muted-foreground">{participants.length} fighters selected! {notChosen.length} not chosen (greyed out). Double-click a selected fighter, then double-click a greyed-out one to swap.</p>
            <div className="flex gap-2">
              <button onClick={doRandomize} className="px-4 py-2 bg-primary text-primary-foreground rounded font-heading text-xs"><GameIcon emoji="🎲" size={14} /> RE-RANDOMIZE</button>
              <button onClick={() => setPhase('humanSelect')} className="px-4 py-2 bg-accent text-accent-foreground rounded font-heading text-xs">NEXT <GameIcon emoji="→" size={14} /></button>
            </div>
          </>
        )}
        {/* Grid is ALWAYS visible — during randomizing it pulses, after it's interactive */}
        <div className="grid grid-cols-6 md:grid-cols-10 gap-1.5 p-2">
          {POOL.map((id) => {
            const c = charById(id);
            if (!c) return null;
            const chosenIdx = participants.indexOf(id);
            const isChosen = chosenIdx >= 0;
            const isSelected = selectedForSwap === chosenIdx;
            return (
              <div key={id} onDoubleClick={() => {
                if (randomizing) return;
                if (isChosen) {
                  setSelectedForSwap(isSelected ? null : chosenIdx);
                } else if (selectedForSwap !== null) {
                  const np = [...participants];
                  np[selectedForSwap] = id;
                  setParticipants(np);
                  setSelectedForSwap(null);
                }
              }}
                className={`flex flex-col items-center p-1 rounded border-2 transition-all ${
                  randomizing ? 'cursor-default animate-pulse' : 'cursor-pointer'
                } ${
                  isSelected ? 'border-accent bg-accent/20 scale-110' :
                  isChosen ? 'border-border bg-card/50 hover:border-accent/50' :
                  'border-border/30 bg-card/20 opacity-40 hover:opacity-70'
                }`}
                style={{ animationDelay: `${POOL.indexOf(id) * 30}ms` }}>
                <div className="w-7 h-7 rounded-full" style={{ backgroundColor: c.color, boxShadow: isChosen ? `0 0 6px ${c.color}88` : 'none' }} />
                <span className="text-[6px] font-heading text-foreground mt-0.5 truncate w-full text-center">{c.name.slice(0, 5)}</span>
                <span className="text-[5px] text-muted-foreground">#{getCharNumber(id)}</span>
                {isSelected && <span className="text-[6px] text-accent font-heading">SWAP?</span>}
              </div>
            );
          })}
        </div>
        {selectedForSwap !== null && !randomizing && (
          <p className="text-xs text-accent animate-pulse"><GameIcon emoji="↑" size={14} /> Now double-click a greyed-out character to swap it in!</p>
        )}
      </div>
    );
  }

  // ── Human Selection Screen ──
  if (phase === 'humanSelect') {
    return (
      <div className="flex flex-col items-center gap-3 w-full max-w-4xl max-h-[85vh] overflow-y-auto p-2">
        <h2 className="text-2xl font-heading text-accent tracking-wider">SELECT HUMAN FIGHTERS</h2>
        <p className="text-sm text-muted-foreground">Select {humanCount === 0 ? 'none' : humanCount} character(s) to be controlled by humans. ({humanIds.size}/{humanCount} selected) — Showing the {participants.length} tournament fighters</p>
        <div className="grid grid-cols-6 md:grid-cols-10 gap-2 p-2">
          {[...participants].sort((a, b) => (getCharNumber(a) ?? 999) - (getCharNumber(b) ?? 999)).map((id, i) => {
            const c = charById(id);
            if (!c) return null;
            const isHuman = humanIds.has(id);
            return (
              <button key={i} onClick={() => toggleHuman(id)}
                className={`flex flex-col items-center p-2 rounded border-2 transition-all ${
                  isHuman ? 'border-accent bg-accent/10 scale-105' :
                  'border-border hover:border-accent/50'
                }`}>
                <div className="w-10 h-10 rounded-full" style={{ backgroundColor: c.color, boxShadow: isHuman ? `0 0 10px ${c.color}` : 'none' }} />
                {isHuman && <span className="text-[8px] text-accent font-heading"><GameIcon emoji="★" size={14} /> HUMAN</span>}
                <span className="text-[8px] font-heading text-foreground mt-0.5">{c.name.slice(0, 7)}</span>
                <span className="text-[6px] text-muted-foreground">#{getCharNumber(id)}</span>
              </button>
            );
          })}
        </div>
        {humanIds.size === humanCount && (
          <div className="w-full max-w-md">
            <p className="text-xs font-heading text-accent mb-2 text-center">SELECTED HUMAN FIGHTER STATS</p>
            {[...humanIds].map(id => {
              const c = charById(id);
              const el = elements[id] || equippedElements?.[id] || 'basic';
              return (
                <div key={id} className="mb-3 p-2 bg-card border border-border rounded-lg">
                  <CharStats char={c} element={el} />
                  <ElementSelect charId={id} currentElement={el} onSelect={(e) => setElements(prev => ({ ...prev, [id]: e }))} charLevels={charLevels} label="ELEMENT" />
                </div>
              );
            })}
          </div>
        )}
        <button onClick={proceedToGroupDraw} disabled={humanIds.size !== humanCount}
          className={`px-6 py-3 rounded-lg font-heading text-lg ${humanIds.size === humanCount ? 'bg-accent text-accent-foreground hover:opacity-90' : 'bg-muted text-muted-foreground cursor-not-allowed'}`}>NEXT <GameIcon emoji="→" size={14} /></button>
      </div>
    );
  }

  // ── Group Draw Screen ──
  if (phase === 'groupDraw') {
    const selectedChar = groupSelected ? charById(groupSelected) : null;
    return (
      <div className="flex flex-col items-center gap-3 w-full max-w-4xl max-h-[85vh] overflow-y-auto p-2">
        <h2 className="text-2xl font-heading text-accent tracking-wider">GROUP DRAW</h2>
        <p className="text-[10px] text-muted-foreground text-center">Drag a fighter onto another to swap — the hovered fighter gets a yellow box. Click to view stats. <GameIcon emoji="★" size={14} /> = human.</p>
        <div className="flex gap-2 flex-wrap justify-center">
          <button onClick={saveAndExit} className="px-4 py-2 bg-destructive/70 text-destructive-foreground rounded font-heading text-xs"><GameIcon emoji="💾" size={14} /> SAVE &amp; EXIT</button>
          <button onClick={reRandomizeGroups} className="px-4 py-2 bg-primary text-primary-foreground rounded font-heading text-xs"><GameIcon emoji="🎲" size={14} /> RE-RANDOMIZE GROUPS</button>
          <button onClick={startMatchPlay} className="px-6 py-2 bg-accent text-accent-foreground rounded font-heading text-sm">START TOURNAMENT <GameIcon emoji="→" size={14} /></button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 w-full">
          {groups.map((group, gi) => (
            <div key={gi} className="bg-card border border-border rounded-lg p-2 min-h-[120px]">
              <p className="text-xs font-heading text-accent text-center mb-1">GROUP {GROUP_NAMES[gi]}</p>
              {group.map((id, pi) => {
                const c = charById(id);
                if (!c) return null;
                const isHuman = humanIds.has(id);
                const isSelected = groupSelected === id;
                const isDragHover = dragHover === id && dragSrc && dragSrc !== id;
                const isDragging = dragSrc === id;
                return (
                  <div key={id}
                    draggable
                    onDragStart={() => setDragSrc(id)}
                    onDragEnd={() => { setDragSrc(null); setDragHover(null); }}
                    onDragOver={(e) => { e.preventDefault(); if (dragSrc && id !== dragSrc) setDragHover(id); }}
                    onDrop={(e) => { e.preventDefault(); if (dragSrc && dragSrc !== id) swapChars(dragSrc, id); setDragSrc(null); setDragHover(null); }}
                    onClick={() => setGroupSelected(isSelected ? null : id)}
                    className={`flex items-center gap-1 py-1 px-1.5 rounded cursor-grab active:cursor-grabbing transition-all ${
                      isDragHover ? 'bg-yellow-400/30 ring-2 ring-yellow-400' :
                      isSelected ? 'bg-yellow-400/20 ring-2 ring-yellow-400' :
                      isDragging ? 'opacity-40' : 'hover:bg-accent/10 bg-background/40'
                    }`}>
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: c.color }} />
                    {isHuman && <span className="text-[8px] text-accent"><GameIcon emoji="★" size={14} /></span>}
                    <span className="text-[8px] font-heading text-foreground truncate flex-1">{c.name}</span>
                    <span className="text-[6px] text-muted-foreground">#{getCharNumber(id)}</span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        {selectedChar && (
          <div className="bg-card border-2 border-yellow-400 rounded-lg p-3 w-full max-w-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full" style={{ backgroundColor: selectedChar.color }} />
              <span className="font-heading text-sm">{selectedChar.name}</span>
              {humanIds.has(groupSelected) && <span className="text-[10px] text-accent"><GameIcon emoji="★" size={14} /> HUMAN</span>}
            </div>
            <CharStats char={selectedChar} element={elements[groupSelected] || equippedElements?.[groupSelected] || 'basic'} />
          </div>
        )}
      </div>
    );
  }

  // ── Match Play / Simulation Screen ──
  if (phase === 'matchplay' && currentMatch) {
    const homeChar = charById(currentMatch.home);
    const awayChar = charById(currentMatch.away);
    const homeIsHuman = humanIds.has(currentMatch.home);
    const awayIsHuman = humanIds.has(currentMatch.away);
    const isBotVsBot = !homeIsHuman && !awayIsHuman;

    // If simulating, show sim result
    if (simResult) {
      return (
        <div className="flex flex-col items-center gap-4 w-full max-w-2xl">
          <h2 className="text-2xl font-heading text-accent">MATCH SIMULATED</h2>
          <p className="text-sm text-muted-foreground">Group {currentMatch.groupName}</p>
          <div className="flex items-center gap-6 bg-card border border-border rounded-xl p-6">
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full" style={{ backgroundColor: homeChar?.color }} />
              <span className="font-heading text-xs">{homeChar?.name}</span>
              {homeIsHuman && <span className="text-[8px] text-accent"><GameIcon emoji="★" size={14} /></span>}
            </div>
            <span className="text-5xl font-heading text-accent">{simResult.homeScore} - {simResult.awayScore}</span>
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full" style={{ backgroundColor: awayChar?.color }} />
              <span className="font-heading text-xs">{awayChar?.name}</span>
              {awayIsHuman && <span className="text-[8px] text-accent"><GameIcon emoji="★" size={14} /></span>}
            </div>
          </div>
          <div className="w-full max-w-md">
            <p className="text-xs font-heading text-muted-foreground mb-2 text-center">GOAL TIMELINE</p>
            <div className="bg-card border border-border rounded-lg p-3 max-h-48 overflow-y-auto">
              {simResult.goalTimes.map((g, i) => (
                <div key={i} className="flex items-center gap-2 text-xs py-0.5">
                  <span className="font-heading text-accent w-12">{g.second}'</span>
                  <span style={{ color: g.team === 'home' ? homeChar?.color : awayChar?.color }}><GameIcon emoji="●" size={14} /></span>
                  <span className="font-body">{g.team === 'home' ? homeChar?.name : awayChar?.name} scored</span>
                </div>
              ))}
            </div>
          </div>
          <button onClick={advanceToNextMatch} className="px-6 py-3 bg-accent text-accent-foreground rounded-lg font-heading text-sm">CONTINUE <GameIcon emoji="→" size={14} /></button>
        </div>
      );
    }

    // Determine p1/p2 assignment from the selected controls (arrows = p1, wasd = p2)
    if (matchActive) {
      const isPvP = homeIsHuman && awayIsHuman;
      let p1IsHome;
      if (isPvP) p1IsHome = (sideChoice === 'arrows');       // home picks arrows <GameIcon emoji="→" size={14} /> home is p1
      else if (homeIsHuman) p1IsHome = (sideChoice === 'arrows');
      else if (awayIsHuman) p1IsHome = (sideChoice === 'wasd'); // away picks arrows <GameIcon emoji="→" size={14} /> p1 = away
      else p1IsHome = true;                                    // bot vs bot (shouldn't reach here)
      const p1Char = p1IsHome ? currentMatch.home : currentMatch.away;
      const p2Char = p1IsHome ? currentMatch.away : currentMatch.home;
      const p1IsCPU = p1IsHome ? !homeIsHuman : !awayIsHuman;
      const p2IsCPU = p1IsHome ? !awayIsHuman : !homeIsHuman;
      return (
        <SoccerFighter
          key={`match-${currentMatchIdx}`}
          tournamentMode
          p1Char={p1Char} p2Char={p2Char}
          p2IsCPU={p2IsCPU} p1IsCPU={p1IsCPU}
          cpuDifficulty={difficulty}
          p1Jersey={true} p2Jersey={true}
          musicVolume={musicVolume} sfxVolume={sfxVolume}
          equippedAccessories={equippedAccessories}
          equippedSkins={equippedSkins}
          settings={settings}
          p1Element={elements[p1Char] || equippedElements?.[p1Char] || 'basic'}
          p2Element={elements[p2Char] || equippedElements?.[p2Char] || 'basic'}
          onEnd={(r) => {
            const p1Score = r.score?.p1 ?? 0;
            const p2Score = r.score?.p2 ?? 0;
            const homeScore = p1IsHome ? p1Score : p2Score;
            const awayScore = p1IsHome ? p2Score : p1Score;
            const goalLog = (r.goalLog || []).map(g => ({ team: (g.team === 1) === p1IsHome ? 'home' : 'away', second: g.second }));
            let finalHome = homeScore, finalAway = awayScore;
            if (finalHome === 0 && finalAway === 0) { finalHome = 1; finalAway = 0; goalLog.push({ team: 'home', second: 90 }); }
            setMatchActive(false);
            setMatchSummary({ kind: 'group', home: currentMatch.home, away: currentMatch.away, groupName: currentMatch.groupName, homeScore: finalHome, awayScore: finalAway, goalLog, recorded: false });
          }}
        />
      );
    }

    // Select sides sub-screen (PvP or Player vs Bot)
    if (showSides) {
      const isPvP = homeIsHuman && awayIsHuman;
      return (
        <div className="flex flex-col items-center gap-4 w-full max-w-2xl">
          <h2 className="text-2xl font-heading text-accent tracking-wider">SELECT SIDES</h2>
          <p className="text-sm text-muted-foreground">Group {currentMatch.groupName} — {homeChar?.name} vs {awayChar?.name}</p>
          <div className="flex items-center gap-8 bg-card border border-border rounded-xl p-6">
            <div className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 rounded-full" style={{ backgroundColor: homeChar?.color, boxShadow: `0 0 12px ${homeChar?.color}` }} />
              <span className="font-heading text-xs">{homeChar?.name}</span>
              <span className="text-[9px] text-muted-foreground">{homeIsHuman ? (isPvP ? 'HOME' : 'YOU') : 'CPU'}</span>
            </div>
            <span className="text-2xl font-heading text-destructive">VS</span>
            <div className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 rounded-full" style={{ backgroundColor: awayChar?.color, boxShadow: `0 0 12px ${awayChar?.color}` }} />
              <span className="font-heading text-xs">{awayChar?.name}</span>
              <span className="text-[9px] text-muted-foreground">{awayIsHuman ? (isPvP ? 'AWAY' : 'YOU') : 'CPU'}</span>
            </div>
          </div>
          <p className="text-xs font-heading text-accent">{isPvP ? 'HOME PLAYER — CHOOSE YOUR CONTROLS' : 'CHOOSE YOUR CONTROLS'}</p>
          <div className="flex gap-3">
            <button onClick={() => setSideChoice('arrows')} className={`px-6 py-3 rounded-lg font-heading text-sm border-2 ${sideChoice === 'arrows' ? 'border-accent bg-accent/20 text-accent' : 'border-border bg-secondary text-secondary-foreground'}`}><GameIcon emoji="↑" size={14} /><GameIcon emoji="↓" size={14} /><GameIcon emoji="←" size={14} /><GameIcon emoji="→" size={14} /> ARROWS</button>
            <button onClick={() => setSideChoice('wasd')} className={`px-6 py-3 rounded-lg font-heading text-sm border-2 ${sideChoice === 'wasd' ? 'border-accent bg-accent/20 text-accent' : 'border-border bg-secondary text-secondary-foreground'}`}>WASD</button>
          </div>
          <p className="text-[10px] text-muted-foreground">{isPvP ? `Home = ${sideChoice.toUpperCase()} · Away = ${sideChoice === 'arrows' ? 'WASD' : 'ARROWS'}` : `You will use ${sideChoice.toUpperCase()}`}</p>
          <div className="flex gap-3">
            <button onClick={() => setShowSides(false)} className="px-4 py-2 bg-secondary text-secondary-foreground rounded font-heading text-xs"><GameIcon emoji="←" size={14} /> BACK</button>
            <button onClick={() => { setShowSides(false); setMatchActive(true); }} className="px-8 py-3 bg-accent text-accent-foreground rounded-lg font-heading text-sm hover:opacity-90">START MATCH <GameIcon emoji="→" size={14} /></button>
          </div>
        </div>
      );
    }

    // Pre-match screen: play or simulate
    return (
      <div className="flex flex-col items-center gap-4 w-full max-w-2xl">
        {humanCount > 0 && (
          <button onClick={simulateToNextHumanGroup} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-heading text-xs hover:opacity-80 shadow-md w-full"><GameIcon emoji="⚡" size={14} /> SIMULATE TO NEXT HUMAN MATCH</button>
        )}
        <div className="w-full flex justify-between items-center">
          <button onClick={saveAndExit} className="px-3 py-1.5 bg-destructive/70 text-destructive-foreground rounded font-heading text-xs"><GameIcon emoji="💾" size={14} /> SAVE &amp; EXIT</button>
          <button onClick={() => setShowGroups(true)} className="px-3 py-1.5 bg-secondary text-secondary-foreground rounded font-heading text-xs"><GameIcon emoji="📊" size={14} /> SEE GROUPS</button>
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground">CURRENT GROUP</p>
            <p className="text-xl font-heading text-accent">GROUP {currentMatch.groupName}</p>
          </div>
          <button onClick={() => setShowTop(true)} className="px-3 py-1.5 bg-secondary text-secondary-foreground rounded font-heading text-xs"><GameIcon emoji="🏆" size={14} /> TOP</button>
        </div>
        <button onClick={() => setShowFixtures(true)} className="px-4 py-1.5 bg-secondary/80 text-secondary-foreground rounded font-heading text-xs hover:opacity-80"><GameIcon emoji="📅" size={14} /> SEE FIXTURES</button>
        <p className="text-xs text-muted-foreground">Match {currentMatchIdx + 1} of {matches.length}</p>
        <div className="flex items-center gap-8 bg-card border border-border rounded-xl p-8">
          <div className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 rounded-full" style={{ backgroundColor: homeChar?.color, boxShadow: `0 0 12px ${homeChar?.color}` }} />
            <span className="font-heading text-sm">{homeChar?.name}</span>
            {homeIsHuman ? <span className="text-[10px] text-accent"><GameIcon emoji="★" size={14} /> HUMAN (P1)</span> : <span className="text-[10px] text-muted-foreground">CPU</span>}
          </div>
          <span className="text-3xl font-heading text-destructive">VS</span>
          <div className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 rounded-full" style={{ backgroundColor: awayChar?.color, boxShadow: `0 0 12px ${awayChar?.color}` }} />
            <span className="font-heading text-sm">{awayChar?.name}</span>
            {awayIsHuman ? <span className="text-[10px] text-accent"><GameIcon emoji="★" size={14} /> HUMAN (P2)</span> : <span className="text-[10px] text-muted-foreground">CPU</span>}
          </div>
        </div>
        <div className="flex gap-3">
          {!isBotVsBot && (
            <button onClick={() => { setSideChoice('arrows'); setShowSides(true); }}
              className="px-6 py-3 bg-accent text-accent-foreground rounded-lg font-heading text-sm hover:opacity-90"><GameIcon emoji="▶" size={14} /> PLAY MATCH</button>
          )}
          {isBotVsBot && (
            <button onClick={() => setMatchActive(true)}
              className="px-6 py-3 bg-primary/80 text-primary-foreground rounded-lg font-heading text-sm hover:opacity-90"><GameIcon emoji="👁" size={14} /> WATCH</button>
          )}
          <button onClick={handleSimulate}
            className="px-6 py-3 bg-secondary text-secondary-foreground rounded-lg font-heading text-sm hover:opacity-90"><GameIcon emoji="⚡" size={14} /> SIMULATE</button>
        </div>
        <div className="w-full max-w-3xl">
          <p className="text-[9px] text-muted-foreground text-center mb-1">ALL {participants.length} PARTICIPANTS</p>
          <div className="flex gap-1.5 overflow-x-auto pb-1 justify-center">
            {participants.map((id, i) => { const c = charById(id); const isPlaying = id === currentMatch.home || id === currentMatch.away; return (
              <div key={i} className={`w-6 h-6 rounded-full shrink-0 ${isPlaying ? 'ring-2 ring-accent scale-110' : ''}`} style={{ backgroundColor: c?.color, opacity: isPlaying ? 1 : 0.35 }} title={c?.name} />
            ); })}
          </div>
        </div>
        {showGroups && (
          <StandingsModal standings={standings} groups={groups} onClose={() => setShowGroups(false)} humanIds={humanIds} />
        )}
        {showFixtures && (
          <FixturesModal matches={matches} knockoutStage={knockoutStage} charById={charById} humanIds={humanIds} onClose={() => setShowFixtures(false)} />
        )}
        {showTop && (
          <TopModal scorers={allScorers()} cleanSheets={allCleanSheets()} onClose={() => setShowTop(false)} />
        )}
      </div>
    );
  }

  // ── Group Results Screen ──
  if (phase === 'groupResults') {
    return (
      <div className="flex flex-col items-center gap-4 w-full max-w-4xl">
        <h2 className="text-2xl font-heading text-accent tracking-wider">GROUP STAGE COMPLETE</h2>
        <p className="text-sm text-muted-foreground">Top 2 from each group advance to the Round of 16</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 w-full">
          {standings.map((groupStandings, gi) => (
            <div key={gi} className="bg-card border border-border rounded-lg p-2">
              <p className="text-xs font-heading text-accent text-center mb-1">GROUP {GROUP_NAMES[gi]}</p>
              {groupStandings.map((s, si) => {
                const c = charById(s.charId);
                const qualified = si < 2;
                return (
                  <div key={s.charId} className={`flex items-center gap-1 py-0.5 px-1 rounded ${qualified ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                    <span className="text-[8px] font-heading w-3 text-center">{si + 1}</span>
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c?.color }} />
                    <span className="text-[7px] font-heading text-foreground truncate flex-1">{c?.name}</span>
                    <span className="text-[7px] text-muted-foreground">{s.points}p</span>
                    {humanIds.has(s.charId) && <span className="text-[7px] text-accent"><GameIcon emoji="★" size={14} /></span>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <button onClick={proceedToKnockout} className="px-6 py-3 bg-accent text-accent-foreground rounded-lg font-heading text-lg hover:opacity-90">PROCEED TO KNOCKOUT <GameIcon emoji="→" size={14} /></button>
      </div>
    );
  }

  // ── Knockout Phase ──
  if (phase === 'knockout' && knockoutMatch) {
    const homeChar = charById(knockoutMatch.home);
    const awayChar = charById(knockoutMatch.away);
    const homeIsHuman = humanIds.has(knockoutMatch.home);
    const awayIsHuman = humanIds.has(knockoutMatch.away);
    const isBotVsBot = !homeIsHuman && !awayIsHuman;

    if (simResult) {
      return (
        <div className="flex flex-col items-center gap-4 w-full max-w-2xl">
          <h2 className="text-xl font-heading text-accent">{knockoutRoundName}</h2>
          <div className="flex items-center gap-6 bg-card border border-border rounded-xl p-6">
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full" style={{ backgroundColor: homeChar?.color }} />
              <span className="font-heading text-xs">{homeChar?.name}</span>
            </div>
            <span className="text-5xl font-heading text-accent">{simResult.homeScore} - {simResult.awayScore}</span>
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full" style={{ backgroundColor: awayChar?.color }} />
              <span className="font-heading text-xs">{awayChar?.name}</span>
            </div>
          </div>
          <button onClick={advanceKnockout} className="px-6 py-3 bg-accent text-accent-foreground rounded-lg font-heading text-sm">CONTINUE <GameIcon emoji="→" size={14} /></button>
        </div>
      );
    }

    // Determine p1/p2 assignment from the selected controls (arrows = p1, wasd = p2)
    if (matchActive) {
      const isPvP = homeIsHuman && awayIsHuman;
      let p1IsHome;
      if (isPvP) p1IsHome = (sideChoice === 'arrows');
      else if (homeIsHuman) p1IsHome = (sideChoice === 'arrows');
      else if (awayIsHuman) p1IsHome = (sideChoice === 'wasd');
      else p1IsHome = true;
      const p1Char = p1IsHome ? knockoutMatch.home : knockoutMatch.away;
      const p2Char = p1IsHome ? knockoutMatch.away : knockoutMatch.home;
      const p1IsCPU = p1IsHome ? !homeIsHuman : !awayIsHuman;
      const p2IsCPU = p1IsHome ? !awayIsHuman : !homeIsHuman;
      return (
        <SoccerFighter
          key={`ko-${currentMatchIdx}`}
          tournamentMode
          p1Char={p1Char} p2Char={p2Char}
          p2IsCPU={p2IsCPU} p1IsCPU={p1IsCPU}
          cpuDifficulty={difficulty}
          p1Jersey={true} p2Jersey={true}
          musicVolume={musicVolume} sfxVolume={sfxVolume}
          equippedAccessories={equippedAccessories}
          equippedSkins={equippedSkins}
          settings={settings}
          p1Element={elements[p1Char] || equippedElements?.[p1Char] || 'basic'}
          p2Element={elements[p2Char] || equippedElements?.[p2Char] || 'basic'}
          onEnd={(r) => {
            const p1Score = r.score?.p1 ?? 0;
            const p2Score = r.score?.p2 ?? 0;
            const homeScore = p1IsHome ? p1Score : p2Score;
            const awayScore = p1IsHome ? p2Score : p1Score;
            const goalLog = (r.goalLog || []).map(g => ({ team: (g.team === 1) === p1IsHome ? 'home' : 'away', second: g.second }));
            let finalHome = homeScore, finalAway = awayScore;
            if (finalHome === 0 && finalAway === 0) { finalHome = 1; finalAway = 0; goalLog.push({ team: 'home', second: 90 }); }
            const krName = knockoutStage?.round === 'r16' ? 'ROUND OF 16' : knockoutStage?.round === 'qf' ? 'QUARTER FINAL' : knockoutStage?.round === 'sf' ? 'SEMI FINAL' : 'FINAL';
            setMatchActive(false);
            setMatchSummary({ kind: 'knockout', home: knockoutMatch.home, away: knockoutMatch.away, subtitle: krName, homeScore: finalHome, awayScore: finalAway, goalLog, recorded: false });
          }}
        />
      );
    }

    // Select sides sub-screen (PvP or Player vs Bot)
    if (showSides) {
      const isPvP = homeIsHuman && awayIsHuman;
      return (
        <div className="flex flex-col items-center gap-4 w-full max-w-2xl">
          <h2 className="text-2xl font-heading text-accent tracking-wider">SELECT SIDES</h2>
          <p className="text-sm text-muted-foreground">{knockoutRoundName} — {homeChar?.name} vs {awayChar?.name}</p>
          <div className="flex items-center gap-8 bg-card border border-border rounded-xl p-6">
            <div className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 rounded-full" style={{ backgroundColor: homeChar?.color, boxShadow: `0 0 12px ${homeChar?.color}` }} />
              <span className="font-heading text-xs">{homeChar?.name}</span>
              <span className="text-[9px] text-muted-foreground">{homeIsHuman ? (isPvP ? 'HOME' : 'YOU') : 'CPU'}</span>
            </div>
            <span className="text-2xl font-heading text-destructive">VS</span>
            <div className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 rounded-full" style={{ backgroundColor: awayChar?.color, boxShadow: `0 0 12px ${awayChar?.color}` }} />
              <span className="font-heading text-xs">{awayChar?.name}</span>
              <span className="text-[9px] text-muted-foreground">{awayIsHuman ? (isPvP ? 'AWAY' : 'YOU') : 'CPU'}</span>
            </div>
          </div>
          <p className="text-xs font-heading text-accent">{isPvP ? 'HOME PLAYER — CHOOSE YOUR CONTROLS' : 'CHOOSE YOUR CONTROLS'}</p>
          <div className="flex gap-3">
            <button onClick={() => setSideChoice('arrows')} className={`px-6 py-3 rounded-lg font-heading text-sm border-2 ${sideChoice === 'arrows' ? 'border-accent bg-accent/20 text-accent' : 'border-border bg-secondary text-secondary-foreground'}`}><GameIcon emoji="↑" size={14} /><GameIcon emoji="↓" size={14} /><GameIcon emoji="←" size={14} /><GameIcon emoji="→" size={14} /> ARROWS</button>
            <button onClick={() => setSideChoice('wasd')} className={`px-6 py-3 rounded-lg font-heading text-sm border-2 ${sideChoice === 'wasd' ? 'border-accent bg-accent/20 text-accent' : 'border-border bg-secondary text-secondary-foreground'}`}>WASD</button>
          </div>
          <p className="text-[10px] text-muted-foreground">{isPvP ? `Home = ${sideChoice.toUpperCase()} · Away = ${sideChoice === 'arrows' ? 'WASD' : 'ARROWS'}` : `You will use ${sideChoice.toUpperCase()}`}</p>
          <div className="flex gap-3">
            <button onClick={() => setShowSides(false)} className="px-4 py-2 bg-secondary text-secondary-foreground rounded font-heading text-xs"><GameIcon emoji="←" size={14} /> BACK</button>
            <button onClick={() => { setShowSides(false); setMatchActive(true); }} className="px-8 py-3 bg-accent text-accent-foreground rounded-lg font-heading text-sm hover:opacity-90">START MATCH <GameIcon emoji="→" size={14} /></button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center gap-4 w-full max-w-2xl">
        <div className="w-full flex justify-between items-center">
          <button onClick={saveAndExit} className="px-3 py-1.5 bg-destructive/70 text-destructive-foreground rounded font-heading text-xs"><GameIcon emoji="💾" size={14} /> SAVE &amp; EXIT</button>
          <button onClick={() => setShowOriginalGroups(!showOriginalGroups)} className="px-3 py-1.5 bg-secondary text-secondary-foreground rounded font-heading text-xs">{showOriginalGroups ? <><GameIcon emoji="📋" size={14} /> SHOW BRACKET</> : <><GameIcon emoji="📋" size={14} /> SHOW ORIGINAL GROUPS</>}</button>
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground">STAGE</p>
            <p className="text-xl font-heading text-accent">{knockoutRoundName}</p>
          </div>
          <button onClick={() => setShowTop(true)} className="px-3 py-1.5 bg-secondary text-secondary-foreground rounded font-heading text-xs"><GameIcon emoji="🏆" size={14} /> TOP</button>
        </div>
        <button onClick={() => setShowFixtures(true)} className="px-4 py-1.5 bg-secondary/80 text-secondary-foreground rounded font-heading text-xs hover:opacity-80"><GameIcon emoji="📅" size={14} /> SEE FIXTURES</button>
        <p className="text-xs text-muted-foreground">Match {currentMatchIdx + 1} of {knockoutStage.matches.length}</p>
        {!showOriginalGroups ? (
          <div className="bg-card border border-border rounded-xl p-3 w-full">
            <p className="text-xs font-heading text-accent mb-2 text-center">KNOCKOUT BRACKET</p>
            <KnockoutBracket rounds={knockoutStage.rounds || { [knockoutStage.round]: knockoutStage.matches }} currentRound={knockoutStage.round} currentMatchIdx={currentMatchIdx} charById={charById} humanIds={humanIds} />
          </div>
        ) : (
          <StandingsModal standings={standings} groups={groups} onClose={() => setShowOriginalGroups(false)} humanIds={humanIds} embedded />
        )}
        <div className="flex items-center gap-8 bg-card border border-border rounded-xl p-8">
          <div className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 rounded-full" style={{ backgroundColor: homeChar?.color, boxShadow: `0 0 12px ${homeChar?.color}` }} />
            <span className="font-heading text-sm">{homeChar?.name}</span>
            {homeIsHuman ? <span className="text-[10px] text-accent"><GameIcon emoji="★" size={14} /> HUMAN (P1)</span> : <span className="text-[10px] text-muted-foreground">CPU</span>}
          </div>
          <span className="text-3xl font-heading text-destructive">VS</span>
          <div className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 rounded-full" style={{ backgroundColor: awayChar?.color, boxShadow: `0 0 12px ${awayChar?.color}` }} />
            <span className="font-heading text-sm">{awayChar?.name}</span>
            {awayIsHuman ? <span className="text-[10px] text-accent"><GameIcon emoji="★" size={14} /> HUMAN (P2)</span> : <span className="text-[10px] text-muted-foreground">CPU</span>}
          </div>
        </div>
        <div className="flex gap-3">
          {!isBotVsBot && (
            <button onClick={() => { setSideChoice('arrows'); setShowSides(true); }}
              className="px-6 py-3 bg-accent text-accent-foreground rounded-lg font-heading text-sm hover:opacity-90"><GameIcon emoji="▶" size={14} /> PLAY MATCH</button>
          )}
          {isBotVsBot && (
            <button onClick={() => setMatchActive(true)}
              className="px-6 py-3 bg-primary/80 text-primary-foreground rounded-lg font-heading text-sm hover:opacity-90"><GameIcon emoji="👁" size={14} /> WATCH</button>
          )}
          <button onClick={handleKnockoutSim}
            className="px-6 py-3 bg-secondary text-secondary-foreground rounded-lg font-heading text-sm hover:opacity-90"><GameIcon emoji="⚡" size={14} /> SIMULATE</button>
        </div>
        <div className="w-full max-w-2xl">
          <p className="text-[9px] text-muted-foreground text-center mb-1">ALL {participants.length} PARTICIPANTS</p>
          <div className="flex flex-wrap gap-1 justify-center">
            {participants.map((id, i) => { const c = charById(id); const isPlaying = id === knockoutMatch.home || id === knockoutMatch.away; return (
              <div key={i} className={`w-5 h-5 rounded-full ${isPlaying ? 'ring-2 ring-accent' : ''}`} style={{ backgroundColor: c?.color, opacity: isPlaying ? 1 : 0.35 }} title={c?.name} />
            ); })}
          </div>
        </div>
        {showFixtures && (
          <FixturesModal matches={matches} knockoutStage={knockoutStage} charById={charById} humanIds={humanIds} onClose={() => setShowFixtures(false)} />
        )}
        {showTop && <TopModal scorers={allScorers()} cleanSheets={allCleanSheets()} onClose={() => setShowTop(false)} />}
      </div>
    );
  }

  // ── Trophy Ceremony (10s animation) ──
  if (phase === 'ceremony' && champion) {
    return <TrophyCeremony champion={charById(champion)} onDone={() => setPhase('awards')} />;
  }

  // ── Awards Screen ──
  if (phase === 'awards' && champion) {
    const topScorer = allScorers()[0];
    const topSheets = allCleanSheets()[0];
    const leastConceded = allGoalsConceded()[0];
    const AwardCard = ({ emoji, title, charId, stat }) => {
      const ac = charId ? charById(charId) : null;
      return (
        <div className="bg-card border border-border rounded-xl p-4 flex flex-col items-center gap-2 text-center">
          <span className="text-3xl">{emoji}</span>
          <p className="text-[10px] font-heading text-accent tracking-wider">{title}</p>
          {ac ? (
            <>
              <div className="w-14 h-14 rounded-full" style={{ backgroundColor: ac.color, boxShadow: `0 0 14px ${ac.color}` }} />
              <span className="font-heading text-sm" style={{ color: ac.color }}>{ac.name}</span>
              {stat && <span className="text-[10px] text-muted-foreground">{stat}</span>}
            </>
          ) : <span className="text-xs text-muted-foreground">—</span>}
        </div>
      );
    };
    return (
      <div className="flex flex-col items-center gap-5 w-full max-w-3xl py-6">
        <h1 className="text-3xl font-heading text-accent tracking-wider">TOURNAMENT AWARDS</h1>
        {tournamentName && <p className="text-sm text-muted-foreground font-heading">“{tournamentName}”</p>}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full">
          <AwardCard emoji="🏆" title="TOURNAMENT WINNER" charId={champion} />
          <AwardCard emoji="⚽" title="MOST GOALS" charId={topScorer?.[0]} stat={topScorer ? `${topScorer[1]} goals` : null} />
          <AwardCard emoji="🧤" title="MOST CLEAN SHEETS" charId={topSheets?.[0]} stat={topSheets ? `${topSheets[1]} clean sheets` : null} />
          <AwardCard emoji="🛡️" title="LEAST GOALS CONCEDED" charId={leastConceded?.[0]} stat={leastConceded != null ? `${leastConceded[1]} conceded` : null} />
        </div>
        <div className="bg-card border border-accent rounded-xl p-3 text-center">
          <p className="text-xs font-heading text-accent">REWARDS CLAIMED</p>
          <p className="text-[10px] text-muted-foreground">+100 Tokens · +1000 XP to Champion · +250 Battle Pass XP</p>
        </div>
        <div className="w-full max-w-2xl">
          <p className="text-[9px] text-muted-foreground text-center mb-1">ALL {participants.length} PARTICIPANTS</p>
          <div className="flex flex-wrap gap-1 justify-center">
            {participants.map((id, i) => { const pc = charById(id); const isChamp = id === champion; return (
              <div key={i} className={`w-6 h-6 rounded-full ${isChamp ? 'ring-2 ring-accent scale-125' : ''}`} style={{ backgroundColor: pc?.color, opacity: isChamp ? 1 : 0.4 }} title={pc?.name} />
            ); })}
          </div>
        </div>
        <button onClick={onBack} className="px-6 py-3 bg-accent text-accent-foreground rounded-lg font-heading text-sm">RETURN TO MENU</button>
      </div>
    );
  }

  return null;
}

// ── Standings Modal ──
function StandingsModal({ standings, groups, onClose, humanIds, embedded }) {
  const content = (
    <div className={`flex flex-col gap-3 ${embedded ? '' : 'bg-background border border-border rounded-xl p-4 max-h-[80vh] overflow-y-auto'}`}>
      {!embedded && <div className="flex justify-between items-center mb-2"><h3 className="font-heading text-sm text-accent">GROUP STANDINGS</h3><button onClick={onClose} className="text-xs text-muted-foreground"><GameIcon emoji="✕" size={14} /></button></div>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {standings.map((groupStandings, gi) => (
          <div key={gi} className="bg-card border border-border rounded-lg p-3">
            <p className="text-xs font-heading text-accent text-center mb-2">GROUP {GROUP_NAMES[gi]}</p>
            {groupStandings.map((s, si) => {
              const c = charById(s.charId);
              return (
                <div key={s.charId} className={`flex items-center gap-2 py-1 px-2 rounded text-[10px] mb-1 ${si < 2 ? 'bg-green-500/15' : ''}`}>
                  <span className="font-heading w-4 text-center">{si + 1}</span>
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: c?.color }} />
                  <span className="font-heading truncate flex-1">{c?.name}</span>
                  <span className="text-muted-foreground">{s.points}p</span>
                  <span className="text-muted-foreground">{s.goalsFor}-{s.goalsAgainst}</span>
                  {humanIds.has(s.charId) && <span className="text-accent"><GameIcon emoji="★" size={14} /></span>}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
  if (embedded) return content;
  return <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}><div onClick={e => e.stopPropagation()} className="max-w-3xl w-full">{content}</div></div>;
}

// ── Top Scorers / Clean Sheets Modal ──
function TopModal({ scorers, cleanSheets, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="bg-background border border-border rounded-xl p-4 max-w-md w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-3"><h3 className="font-heading text-sm text-accent">TOURNAMENT STATS</h3><button onClick={onClose} className="text-xs text-muted-foreground"><GameIcon emoji="✕" size={14} /></button></div>
        <p className="text-xs font-heading text-accent mb-1"><GameIcon emoji="⚽" size={14} /> TOP SCORERS</p>
        {scorers.map(([id, goals], i) => {
          const c = charById(id);
          return (
            <div key={id} className="flex items-center gap-2 py-0.5 text-xs">
              <span className="font-heading w-4 text-muted-foreground">{i + 1}.</span>
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c?.color }} />
              <span className="font-heading flex-1">{c?.name}</span>
              <span className="font-heading text-accent">{goals} goals</span>
            </div>
          );
        })}
        <p className="text-xs font-heading text-accent mt-3 mb-1"><GameIcon emoji="🧤" size={14} /> CLEAN SHEETS</p>
        {cleanSheets.map(([id, sheets], i) => {
          const c = charById(id);
          return (
            <div key={id} className="flex items-center gap-2 py-0.5 text-xs">
              <span className="font-heading w-4 text-muted-foreground">{i + 1}.</span>
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c?.color }} />
              <span className="font-heading flex-1">{c?.name}</span>
              <span className="font-heading text-accent">{sheets}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}