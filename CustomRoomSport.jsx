import db from './localBackend';

import React from 'react';
import SportsShell from './SportsShell.jsx';
import VolleyballGame from './VolleyballGame.jsx';
import BaseballGame from './BaseballGame.jsx';
import SoccerMode from './SoccerMode.jsx';
import BangerMode from './BangerMode.jsx';

import { sfx } from './sfx.js';

const GAME_COMPONENTS = {
  volleyball: VolleyballGame,
  baseball: BaseballGame,
};

// Launches a sport match for a custom room. The sports engines don't share the
// CustomRoom netcode layer (which is fight-specific), so the match runs locally:
// the host's roster (human + bots) plays a quick match. Friends still use the
// shared room code as a meeting point to coordinate, then each plays locally.
export default function CustomRoomSport({ mode, room, me, progress, unlockedIds, favoriteId, equippedSkins, equippedAccessories, settings, charLevels, equippedElements, onEquipElement, sfxVolume, musicVolume, customCharsData, customNumberMap, onEnd }) {
  const handleEnd = (res) => {
    sfx.click();
    // Close the room so it leaves the browse list
    try { if (room?.host_user_id === me?.id) { db.entities.CustomRoom.update(room.id, { status: 'closed' }); } } catch {}
    onEnd?.(res);
  };

  if (mode === 'soccer') {
    return (
      <SoccerMode
        onBack={handleEnd}
        onEnd={(result) => handleEnd(result)}
        unlockedIds={unlockedIds}
        favoriteId={favoriteId}
        equippedAccessories={equippedAccessories}
        equippedSkins={equippedSkins}
        sfxVolume={sfxVolume}
        musicVolume={musicVolume}
        settings={settings}
        charLevels={charLevels}
        equippedElements={equippedElements}
        onEquipElement={onEquipElement}
        customCharsData={customCharsData}
        customNumberMap={customNumberMap}
      />
    );
  }

  if (mode === 'banger') {
    return (
      <BangerMode
        onExit={handleEnd}
        onAward={() => {}}
        unlockedIds={unlockedIds}
        favoriteId={favoriteId}
        equippedAccessories={equippedAccessories}
        equippedSkins={equippedSkins}
        sfxVolume={sfxVolume}
        musicVolume={musicVolume}
        settings={settings}
        charLevels={charLevels}
        equippedElements={equippedElements}
        onEquipElement={onEquipElement}
        customCharsData={customCharsData}
        customNumberMap={customNumberMap}
      />
    );
  }

  const Game = GAME_COMPONENTS[mode];
  if (!Game) { handleEnd(); return null; }

  return (
    <SportsShell
      sport={mode}
      unlockedIds={unlockedIds}
      favoriteId={favoriteId}
      equippedAccessories={equippedAccessories}
      equippedSkins={equippedSkins}
      settings={settings}
      charLevels={charLevels}
      equippedElements={equippedElements}
      onEquipElement={onEquipElement}
      sfxVolume={sfxVolume}
      musicVolume={musicVolume}
      GameComponent={Game}
      onEnd={handleEnd}
      onExit={handleEnd}
      customCharsData={customCharsData}
      customNumberMap={customNumberMap}
    />
  );
}