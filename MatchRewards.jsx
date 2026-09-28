import React, { useState, useEffect } from 'react';
import { HEROES } from './heroes.js';
import { VILLAINS } from './villains.js';
import { GUARDIANS } from './guardians.js';
import { getCharLevelData, xpForLevel, MAX_LEVEL } from './elements.js';
import { music } from './music.js';
import GameIcon from "./GameIcon.jsx";

const ALL = [...HEROES, ...VILLAINS, ...GUARDIANS];

// XP per difficulty — harder bots give more XP, player battles give most
export const DIFFICULTY_XP = {
  newcomer: 10, beginner: 15, easy: 20, amateur: 25, regular: 35,
  pro: 50, hard: 70, insane: 90, honored: 120,
};

export function calculateBattleXP(difficulty, won, isPlayerVsPlayer) {
  let baseXP = DIFFICULTY_XP[difficulty] || 35;
  if (isPlayerVsPlayer) baseXP = 80; // player vs player gives most XP
  if (!won) baseXP = Math.floor(baseXP * 0.3); // loss gives 30%
  return baseXP;
}

export default function MatchRewards({
  charId, p2CharId, result, difficulty, gameMode, isPlayerVsPlayer, currentLevelData, coinsEarned,
  totalXP, matchCount, onContinue, onBack,
}) {
  const [showXP, setShowXP] = useState(false);
  const [showCoins, setShowCoins] = useState(false);
  const [showLevel, setShowLevel] = useState(false);

  const char = ALL.find(c => c.id === charId);
  const won = result?.p1Won === true;
  const isDraw = result?.p1Won === null;
  const singleXP = calculateBattleXP(difficulty, won || isDraw, isPlayerVsPlayer);
  const isAccumulated = matchCount && matchCount > 1;
  const xpGained = isAccumulated ? (totalXP || 0) : singleXP;

  const oldLevel = currentLevelData?.level || 1;
  const oldXP = currentLevelData?.xp || 0;
  const xpNeeded = xpForLevel(oldLevel);
  let newXP = oldXP + xpGained;
  let newLevel = oldLevel;
  let leveledUp = false;

  while (newLevel < MAX_LEVEL && newXP >= xpForLevel(newLevel)) {
    newXP -= xpForLevel(newLevel);
    newLevel++;
    leveledUp = true;
  }
  if (newLevel >= MAX_LEVEL) newXP = 0;

  const xpForNext = newLevel >= MAX_LEVEL ? 0 : xpForLevel(newLevel);
  const xpProgress = newLevel >= MAX_LEVEL ? 100 : (newXP / xpForNext) * 100;

  // Resume background music during post-match review
  useEffect(() => {
    music.play('menu');
    return () => music.stop();
  }, []);

  useEffect(() => {
    const t1 = setTimeout(() => setShowXP(true), 300);
    const t2 = setTimeout(() => setShowCoins(true), 900);
    const t3 = setTimeout(() => setShowLevel(true), 1500);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  // Battle stats
  const stats = result?.stats || {};
  const moveStats = result?.moveStats || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'radial-gradient(ellipse at top, #14172a 0%, #0a0b16 50%, #050310 100%)' }}>
      <div className="w-full max-w-3xl flex flex-col gap-4 p-6">

        {/* Header */}
        <div className="text-center">
          <h2 className="text-3xl font-heading text-accent tracking-wider">MATCH REWARDS</h2>
          <p className="text-sm text-muted-foreground font-body mt-1">
            {isAccumulated ? `${matchCount} MATCHES PLAYED` : (won ? 'Victory!' : isDraw ? 'Draw' : 'Defeat')} — {difficulty ? difficulty.toUpperCase() : 'BATTLE'}
            {isPlayerVsPlayer ? ' • PLAYER VS PLAYER' : ''}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex justify-center gap-3">
          <button onClick={onBack} className="px-6 py-2 bg-secondary text-secondary-foreground rounded-lg font-heading text-sm hover:opacity-80">
            <GameIcon emoji="⭕" size={14} /> BACK TO MENU
          </button>
          <button onClick={onContinue} className="px-6 py-2 bg-accent text-accent-foreground rounded-lg font-heading text-sm hover:opacity-80">
            <GameIcon emoji="✖" size={14} /> CONTINUE
          </button>
        </div>

        {/* Main reward banner */}
        <div className="rounded-xl border-2 p-4 flex items-center gap-4"
          style={{ borderColor: char?.color + '55', background: `linear-gradient(135deg, ${char?.color}15 0%, #0a0b16 70%)` }}>
          {/* Character circle */}
          <div className="relative flex-shrink-0">
            <div className="w-16 h-16 rounded-full flex items-center justify-center border-4"
              style={{ borderColor: char?.color, backgroundColor: char?.color + '22' }}>
              <div className="w-8 h-8 rounded-full" style={{ backgroundColor: char?.color, boxShadow: `0 0 15px ${char?.color}` }} />
            </div>
          </div>

          {/* Level + XP */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-heading text-lg" style={{ color: char?.color }}>{char?.name}</span>
              <span className="text-[10px] font-heading text-muted-foreground">Lv {newLevel}/{MAX_LEVEL}</span>
              {leveledUp && (
                <span className="text-[9px] font-heading text-accent animate-pulse px-2 py-0.5 rounded bg-accent/20">
                  <GameIcon emoji="⬆" size={14} /> LEVEL UP!
                </span>
              )}
            </div>
            <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-1000"
                style={{ width: showLevel ? `${xpProgress}%` : '0%', backgroundColor: char?.color, boxShadow: `0 0 8px ${char?.color}` }} />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[9px] font-heading text-accent">
                {showXP ? `XP +${xpGained}` : '...'}
              </span>
              <span className="text-[9px] font-body text-muted-foreground">
                {newLevel >= MAX_LEVEL ? 'MAX LEVEL' : `${newXP}/${xpForNext}`}
              </span>
            </div>
          </div>

          {/* Gold/coins */}
          <div className="flex-shrink-0 text-center">
            <div className="w-12 h-12 rounded-full bg-accent/20 border-2 border-accent flex items-center justify-center">
              <span className="text-lg"><GameIcon emoji="◆" size={14} /></span>
            </div>
            <p className="text-[9px] font-heading text-accent mt-1">
              {showCoins ? `+${coinsEarned}` : '...'}
            </p>
            <p className="text-[7px] font-body text-muted-foreground">TOKENS</p>
          </div>
        </div>

        {/* Battle stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card/80 border border-border rounded-xl p-3">
            <p className="text-[10px] font-heading text-muted-foreground mb-2">BATTLE STATS</p>
            <div className="space-y-1">
              <StatRow label="Distance" value={stats.distance || 0} />
              <StatRow label="Supers Used" value={stats.supers || 0} />
              <StatRow label="Powers Used" value={stats.powers || 0} />
              <StatRow label="Heavy Attacks" value={stats.heavies || 0} />
              {stats.coins != null && <StatRow label="Coins Collected" value={stats.coins || 0} />}
            </div>
          </div>

          <div className="bg-card/80 border border-border rounded-xl p-3">
            <p className="text-[10px] font-heading text-muted-foreground mb-2">REWARDS EARNED</p>
            <div className="space-y-1">
              <RewardRow icon=<GameIcon emoji="✦" size={14} /> label="XP Gained" value={`+${xpGained}`} color={char?.color} shown={showXP} />
              <RewardRow icon=<GameIcon emoji="◆" size={14} /> label="Tokens" value={`+${coinsEarned}`} color="#FFD700" shown={showCoins} />
              {leveledUp && <RewardRow icon=<GameIcon emoji="⬆" size={14} /> label="Level Up!" value={`Lv ${oldLevel} → ${newLevel}`} color="#44FF88" shown={showLevel} />}
              {!leveledUp && newLevel < MAX_LEVEL && (
                <RewardRow icon=<GameIcon emoji="◎" size={14} /> label="Next Level" value={`${xpForNext - newXP} XP to go`} color="#888899" shown={showLevel} />
              )}
            </div>
          </div>
        </div>

        {/* Match review — both players */}
        {result?.p2Stats && p2CharId && (() => {
          const char2 = ALL.find(c => c.id === p2CharId);
          const s1 = result.stats || {};
          const s2 = result.p2Stats || {};
          const reviewRows = [
            { label: 'Hits', p1: s1.hits || 0, p2: s2.hits || 0 },
            { label: 'Super Hits', p1: s1.superHits || 0, p2: s2.superHits || 0 },
            { label: 'Heavy Hits', p1: s1.heavyHits || 0, p2: s2.heavyHits || 0 },
            { label: 'Kills', p1: s1.kills || 0, p2: s2.kills || 0 },
            { label: 'Deaths', p1: s1.deaths || 0, p2: s2.deaths || 0 },
          ];
          return (
            <div className="bg-card/80 border border-border rounded-xl p-3">
              <p className="text-[10px] font-heading text-muted-foreground mb-2 text-center">MATCH REVIEW</p>
              <div className="grid grid-cols-3 gap-1 mb-2 pb-1 border-b border-border">
                <p className="text-center font-heading text-[10px]" style={{ color: char?.color }}>{char?.name}</p>
                <p className="text-center text-[8px] font-body text-muted-foreground">VS</p>
                <p className="text-center font-heading text-[10px]" style={{ color: char2?.color }}>{char2?.name}</p>
              </div>
              {reviewRows.map((r, i) => (
                <div key={i} className="grid grid-cols-3 gap-1 py-0.5">
                  <span className="text-center font-heading text-xs text-foreground">{r.p1}</span>
                  <span className="text-center text-[9px] font-body text-muted-foreground">{r.label}</span>
                  <span className="text-center font-heading text-xs text-foreground">{r.p2}</span>
                </div>
              ))}
            </div>
          );
        })()}

        {/* XP info */}
        <div className="text-center">
          <p className="text-[9px] font-body text-muted-foreground">
            {isAccumulated
              ? `XP accumulated across ${matchCount} rematches and paid out together.`
              : (isPlayerVsPlayer
                ? 'Player vs Player battles give the most XP!'
                : `Harder bots give more XP. ${difficulty} difficulty awarded ${xpGained} XP.`)}
          </p>
        </div>
      </div>
    </div>
  );
}

function StatRow({ label, value }) {
  return (
    <div className="flex justify-between text-[10px] font-body">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-heading text-foreground">{value}</span>
    </div>
  );
}

function RewardRow({ icon, label, value, color, shown }) {
  return (
    <div className="flex items-center gap-2 text-[10px] font-body" style={{ opacity: shown ? 1 : 0, transition: 'opacity 0.5s' }}>
      <span style={{ color }}>{icon}</span>
      <span className="text-muted-foreground flex-1">{label}</span>
      <span className="font-heading" style={{ color }}>{value}</span>
    </div>
  );
}