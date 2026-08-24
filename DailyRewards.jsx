import db from './localBackend';

import React, { useState, useEffect } from 'react';

import GameIcon from "./GameIcon.jsx";
import { sfx } from './sfx.js';

function getTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
}

// Reward: 50 tokens base, +20 per consecutive streak day; streak caps at 7 days — day 8 resets to day 1 (50 tokens). Missing a day also resets to 50.
function calcReward(streakDay) {
  return 50 + (streakDay > 0 ? streakDay * 20 : 0);
}

export default function DailyRewards({ onClaim, onClose, coins }) {
  const [rewardData, setRewardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const user = await db.auth.me().catch(() => null);
        if (!user) { setLoading(false); return; }
        const existing = await db.entities.DailyReward.filter({ user_id: user.id });
        const today = getTodayStr();
        const localClaimed = localStorage.getItem('daily_reward_claimed') === today;
        if (existing[0]) {
          setRewardData(existing[0]);
          if (existing[0].last_claim_date === today || localClaimed) {
            setClaimed(true);
          }
        } else {
          setRewardData({ user_id: user.id, last_claim_date: null, streak_day: 0, total_tokens_earned: 0 });
          if (localClaimed) setClaimed(true);
        }
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  const handleClaim = async () => {
    if (claiming || claimed) return;
    setClaiming(true);
    try {
      const user = await db.auth.me().catch(() => null);
      if (!user) return;
      const today = getTodayStr();

      // Determine new streak — consecutive days only; missing a day resets to 0
      let newStreak = 0;
      if (rewardData.last_claim_date) {
        const last = new Date(rewardData.last_claim_date);
        const now = new Date(today);
        const diffDays = Math.round((now - last) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          // Streak caps at 7 days — claiming on day 8 resets back to day 1 (50 tokens)
          newStreak = (rewardData.streak_day || 0) >= 7 ? 0 : (rewardData.streak_day || 0) + 1;
        }
      }

      const reward = calcReward(newStreak);

      // Save to entity
      if (rewardData.id) {
        await db.entities.DailyReward.update(rewardData.id, {
          last_claim_date: today,
          streak_day: newStreak,
          total_tokens_earned: (rewardData.total_tokens_earned || 0) + reward,
        });
      } else {
        await db.entities.DailyReward.create({
          user_id: user.id,
          last_claim_date: today,
          streak_day: newStreak,
          total_tokens_earned: reward,
        });
      }

      localStorage.setItem('daily_reward_claimed', today);
      setClaimed(true);
      sfx.purchaseSuccess();
      if (onClaim) onClaim(reward);
      if (onClose) onClose(); // dismiss popup and enter the game
    } catch {}
    setClaiming(false);
  };

  if (loading) return null;
  if (claimed && !onClose) return null;

  // Project the streak that will apply if claimed now (for display)
  let projectedStreak = 0;
  if (rewardData?.last_claim_date) {
    const last = new Date(rewardData.last_claim_date);
    const now = new Date(getTodayStr());
    const diffDays = Math.round((now - last) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) projectedStreak = (rewardData.streak_day || 0) >= 7 ? 0 : (rewardData.streak_day || 0) + 1;
  }
  const todayReward = calcReward(projectedStreak);
  const displayStreak = claimed ? (rewardData?.streak_day || 0) : projectedStreak;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
        <h2 className="text-2xl font-heading text-accent text-center tracking-wider mb-1 flex items-center justify-center gap-2">
          <GameIcon emoji="🎁" size={22} color="var(--accent)" /> DAILY REWARD
        </h2>
        <p className="text-center text-muted-foreground text-xs font-heading mb-4">
          {claimed ? "You've already claimed today's reward!" : `Day ${displayStreak + 1} streak`}
        </p>

        {/* Streak view */}
        <div className="grid grid-cols-7 gap-1 mb-4">
          {Array.from({ length: 7 }, (_, i) => {
            const dayNum = i + 1;
            const isCurrent = dayNum === displayStreak + 1;
            const isPast = dayNum < displayStreak + 1;
            return (
              <div key={i} className={`rounded-lg p-2 text-center border ${isCurrent ? 'bg-accent/20 border-accent' : isPast ? 'bg-muted/30 border-border/30' : 'bg-muted/10 border-border/20'}`}>
                <div className="text-[8px] font-heading text-muted-foreground">DAY {dayNum}</div>
                <div className={`text-xs font-heading ${isCurrent ? 'text-accent font-bold' : 'text-foreground/60'}`}>
                  {50 + i * 20}
                </div>
              </div>
            );
          })}
        </div>

        {/* Reward display */}
        <div className="text-center mb-4">
          <div className="text-4xl font-heading text-accent font-bold flex items-center justify-center gap-2">
            <GameIcon emoji="💰" size={28} color="var(--accent)" />
            {todayReward}
          </div>
          <div className="text-xs text-muted-foreground font-heading mt-1">TOKENS</div>
        </div>

        {!claimed ? (
          <button
            onClick={handleClaim}
            disabled={claiming}
            className="w-full py-3 bg-accent text-accent-foreground rounded-xl font-heading text-sm font-bold hover:opacity-90 disabled:opacity-50"
          >
            {claiming ? 'CLAIMING...' : 'CLAIM REWARD'}
          </button>
        ) : (
          <button
            onClick={onClose}
            className="w-full py-3 bg-secondary text-secondary-foreground rounded-xl font-heading text-sm hover:opacity-80"
          >
            CLOSE
          </button>
        )}
        <p className="text-center text-[10px] text-muted-foreground font-heading mt-3">
          Come back tomorrow to claim your next reward!
        </p>
      </div>
    </div>
  );
}