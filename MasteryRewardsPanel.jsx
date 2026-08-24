import React from 'react';
import { MASTERY_REWARDS, getMasteryRankForChar, getMasteryProgress } from './mastery.js';
import GameIcon from "./GameIcon.jsx";

// Displays mastery-rank-based skin tint rewards for a character.
// Each rank (Bronze -> Master) unlocks a unique badge + a recolor tint that can be equipped as a skin.
export default function MasteryRewardsPanel({ char, charMastery, equippedSkinId, onEquipSkin, selectedChar }) {
  if (!char) return null;
  const rank = getMasteryRankForChar(charMastery, char.id);
  const progress = getMasteryProgress(charMastery, char.id);

  return (
    <div className="flex flex-col gap-3">
      {/* Current rank summary */}
      <div className="rounded-lg p-3 border" style={{ borderColor: rank.color + '55', backgroundColor: rank.color + '0a' }}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-heading text-muted-foreground">MASTERY REWARDS</span>
          <span className="text-sm font-heading" style={{ color: rank.color }}>{rank.icon} {rank.name}</span>
          <span className="text-[9px] text-muted-foreground ml-auto">{progress.score} pts - {progress.wins} wins</span>
        </div>
        <p className="text-[9px] text-muted-foreground font-body">
          Earn mastery points by playing and winning with {char.name}. Each new rank unlocks a unique badge and a recolor tint you can equip as a skin.
        </p>
      </div>

      {/* Reward grid - one tile per rank */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {MASTERY_REWARDS.map(reward => {
          const unlocked = rank.id >= reward.rankId;
          const tintId = `mastery_${char.id}_${reward.rankId}`;
          const isEquipped = equippedSkinId === tintId;
          return (
            <div key={reward.rankId}
              className={`rounded-lg p-2 border-2 flex flex-col items-center ${isEquipped ? 'border-accent' : unlocked ? 'border-border' : 'border-border opacity-50'}`}
              style={unlocked ? { boxShadow: `0 0 8px ${reward.skinTint}33` } : {}}>
              {/* Badge icon */}
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-lg" style={{ filter: unlocked ? `drop-shadow(0 0 4px ${reward.skinTint})` : 'grayscale(1)' }}>{reward.badgeIcon}</span>
                <span className="text-[9px] font-heading" style={{ color: unlocked ? reward.skinTint : '#666' }}>{reward.badgeName}</span>
              </div>
              {/* Tint preview - character color circle overlaid with tint */}
              <div className="flex items-center gap-2 my-1">
                <div className="w-7 h-7 rounded-full border-2 border-border" style={{ backgroundColor: char.color }} />
                <GameIcon emoji="->" size={14} />
                <div className="w-7 h-7 rounded-full border-2 border-border" style={{ backgroundColor: unlocked ? reward.skinTint : '#444', boxShadow: unlocked ? `0 0 6px ${reward.skinTint}` : 'none' }} />
              </div>
              <p className="text-[8px] font-heading text-center">{reward.badgeName} Tint</p>
              {!unlocked ? (
                <p className="text-[7px] text-destructive font-heading mt-1 text-center"><GameIcon emoji="X" size={14} /> Rank {reward.rankId} required</p>
              ) : (
                <button onClick={() => onEquipSkin?.(selectedChar, isEquipped ? null : tintId)}
                  className={`px-2 py-0.5 rounded text-[8px] font-heading mt-1 w-full ${isEquipped ? 'bg-secondary text-secondary-foreground' : 'bg-accent text-accent-foreground'}`}>
                  {isEquipped ? 'EQUIPPED' : 'EQUIP TINT'}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {rank.id === 0 && (
        <p className="text-[10px] text-muted-foreground font-body text-center">
          {char.name} is Unranked - play and win battles to earn the Bronze badge and first tint!
        </p>
      )}
    </div>
  );
}