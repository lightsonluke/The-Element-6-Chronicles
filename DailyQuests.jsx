import React, { useState, useEffect } from 'react';
import { generateDailyQuests, openChest, getTodayKey, needsDailyReset, CHEST_TYPES } from './dailyQuests.js';
import { HEROES } from './heroes.js';
import { VILLAINS } from './villains.js';
import { GUARDIANS } from './guardians.js';
import { music } from './music.js';
import { sfx } from './sfx.js';
import GameIcon from "./GameIcon.jsx";

const ALL = [...HEROES, ...VILLAINS, ...GUARDIANS];

export default function DailyQuests({ progress, onClaimChest, onCosmeticUnlock, onAddCoins, onBack }) {
  const todayKey = getTodayKey();
  const [questState, setQuestState] = useState(() => {
    if (progress?.dailyQuests?.dateKey === todayKey) {
      return progress.dailyQuests;
    }
    const fresh = {
      dateKey: todayKey,
      quests: generateDailyQuests(todayKey),
      claimed: [],
      dailyStats: {},
    };
    return fresh;
  });
  const [openingChest, setOpeningChest] = useState(null);
  const [chestResult, setChestResult] = useState(null);
  const [chestAnimFrame, setChestAnimFrame] = useState(0);

  useEffect(() => { music.play('menu'); return () => music.stop(); }, []);

  const stats = { ...(progress?.stats || {}), ...(questState.dailyStats || {}) };

  const getQuestProgress = (q) => {
    // dailyStats accumulates today's fight stats per stat type, summed across all characters
    const daily = questState.dailyStats || {};
    if (q.stat === 'wins') {
      return Object.values(daily).reduce((sum, charStats) => sum + (charStats.wins || 0), 0);
    }
    if (q.stat === 'sigs') {
      // Count sigs - from moveStats
      let total = 0;
      const ms = progress?.moveStats || {};
      // We track daily sigs via a simple counter
      return daily._total?.sigs || 0;
    }
    if (q.stat === 'heavies') return daily._total?.heavies || 0;
    if (q.stat === 'powers') return daily._total?.powers || 0;
    if (q.stat === 'supers') return daily._total?.supers || 0;
    if (q.stat === 'distance') return daily._total?.distance || 0;
    return 0;
  };

  const allClaimed = questState.quests.every(q => questState.claimed.includes(q.id) || getQuestProgress(q) >= q.target);

  const handleClaim = (q) => {
    if (questState.claimed.includes(q.id)) return;
    if (getQuestProgress(q) < q.target) return;
    const next = { ...questState, claimed: [...questState.claimed, q.id] };
    setQuestState(next);
    onClaimChest?.(next);
  };

  const handleOpenChest = (questId, chestId) => {
    const ownedItems = [
      ...(progress?.ownedAccessories || []),
      ...(progress?.ownedSkins || []),
      ...(progress?.ownedKillFX || []),
    ];
    setOpeningChest(questId);
    setChestResult(null);
    setChestAnimFrame(0);
    sfx.superActivate();

    // Simulate opening animation
    let frame = 0;
    const animInterval = setInterval(() => {
      frame++;
      setChestAnimFrame(frame);
      if (frame >= 30) {
        clearInterval(animInterval);
        const result = openChest(chestId, ownedItems);
        setChestResult(result);
        if (result.cosmetic) {
          onCosmeticUnlock?.(result.cosmetic);
        }
        if (result.coins) {
          onAddCoins?.(result.coins);
        }
      }
    }, 80);
  };

  // Get unclaimed chests (exclude opened ones)
  const earnedChests = questState.claimed
    .filter(qid => !(questState.openedChests || []).includes(qid))
    .map(qid => {
      const q = questState.quests.find(qq => qq.id === qid);
      return { questId: qid, chestId: q?.chestReward };
    })
    .filter(c => c.chestId);

  return (
    <div className="w-full max-w-3xl flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-heading text-accent tracking-wider">DAILY QUESTS</h2>
          <p className="text-xs text-muted-foreground font-body">Resets daily · Complete quests to earn chests!</p>
        </div>
        <button onClick={onBack} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-heading text-sm hover:opacity-80"><GameIcon emoji="←" size={14} /> BACK</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {questState.quests.map(q => {
          const v = getQuestProgress(q);
          const done = v >= q.target;
          const claimed = questState.claimed.includes(q.id);
          const pct = Math.min(100, (v / q.target) * 100);
          const chest = CHEST_TYPES.find(c => c.id === q.chestReward);
          return (
            <div key={q.id} className={`bg-card border rounded-xl p-3 ${done ? 'border-accent' : 'border-border'}`}>
              <div className="flex justify-between items-start mb-1">
                <p className="font-heading text-sm text-foreground">{q.title}</p>
                <span className="text-2xl" style={{ color: chest?.color }}>{chest ? <GameIcon emoji="🎁" size={14} /> : ''}</span>
              </div>
              <p className="text-[11px] text-muted-foreground font-body mb-2">{q.desc}</p>
              <div className="h-2 bg-muted rounded-full overflow-hidden mb-1">
                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: done ? '#FFD700' : '#7744FF' }} />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-muted-foreground font-body">{Math.min(v, q.target)} / {q.target}</span>
                {claimed ? (
                  <span className="text-[10px] text-green-400 font-heading"><GameIcon emoji="✓" size={14} /> CLAIMED</span>
                ) : done ? (
                  <button onClick={() => handleClaim(q)} className="px-3 py-1 bg-accent text-accent-foreground rounded font-heading text-[10px] hover:opacity-80">CLAIM</button>
                ) : (
                  <span className="text-[10px] text-muted-foreground font-heading"><GameIcon emoji="🔒" size={14} /></span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Chest opening area */}
      {earnedChests.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="font-heading text-sm text-accent mb-3">EARNED CHESTS ({earnedChests.length})</h3>
          <div className="flex gap-4 flex-wrap justify-center">
            {earnedChests.map(({ questId, chestId }, i) => {
              const chest = CHEST_TYPES.find(c => c.id === chestId);
              const isOpening = openingChest === questId && !chestResult;
              const result = openingChest === questId ? chestResult : null;
              return (
                <div key={i} className="flex flex-col items-center gap-2">
                  <div
                    className="w-20 h-20 rounded-xl border-2 flex items-center justify-center text-4xl cursor-pointer transition-all hover:scale-110"
                    style={{
                      borderColor: chest?.color,
                      backgroundColor: chest?.color + '22',
                      boxShadow: `0 0 ${isOpening ? 20 + chestAnimFrame : 8}px ${chest?.color}`,
                      transform: isOpening ? `scale(${1 + Math.sin(chestAnimFrame * 0.5) * 0.1})` : undefined,
                    }}
                    onClick={() => !isOpening && !result && handleOpenChest(questId, chestId)}
                  >
                    {isOpening ? <GameIcon emoji="✨" size={14} /> : result ? <GameIcon emoji="🎉" size={14} /> : <GameIcon emoji="🎁" size={14} />}
                  </div>
                  <span className="text-[10px] font-heading" style={{ color: chest?.color }}>{chest?.name}</span>
                  {result && (
                    <div className="text-center animate-in fade-in">
                      <p className="text-xs font-heading text-accent">+{result.coins} <GameIcon emoji="◆" size={14} /></p>
                      {result.cosmetic && (
                        <p className="text-[10px] font-heading text-primary">
                          {result.cosmetic.type === 'accessory' ? <GameIcon emoji="🎩" size={14} /> : result.cosmetic.type === 'skin' ? <GameIcon emoji="🎨" size={14} /> : <GameIcon emoji="💀" size={14} />} {result.cosmetic.name}!
                        </p>
                      )}
                      <button
                        onClick={() => {
                          const next = { ...questState, openedChests: [...(questState.openedChests || []), questId] };
                          setQuestState(next);
                          onClaimChest?.(next);
                          setOpeningChest(null);
                          setChestResult(null);
                        }}
                        className="mt-1 px-2 py-0.5 bg-secondary text-secondary-foreground rounded text-[9px] font-heading"
                      >OK</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {!earnedChests.some(c => openingChest === c.questId) && (
            <p className="text-center text-[10px] text-muted-foreground font-body mt-3">Click a chest to open it!</p>
          )}
        </div>
      )}

      {earnedChests.length === 0 && (
        <div className="bg-card border border-border rounded-xl p-6 text-center">
          <p className="text-muted-foreground font-body text-sm">Complete daily quests to earn chests!</p>
        </div>
      )}
    </div>
  );
}