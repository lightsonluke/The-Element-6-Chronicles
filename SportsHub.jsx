import React, { useState } from 'react';
import { SPORTS, getSport } from './sports.js';
import SportsShell from './SportsShell.jsx';
import VolleyballGame from './VolleyballGame.jsx';
import BaseballGame from './BaseballGame.jsx';
import SplitCityParkour from './SplitCityParkour.jsx';
import RockClimbing from './RockClimbing.jsx';
import CaptureTheFlag from './CaptureTheFlag.jsx';
import DodgeballMode from './DodgeballMode.jsx';
import Ziplining from './Ziplining.jsx';
import BangerMode from './BangerMode.jsx';
import GameIcon from "./GameIcon.jsx";

const GAME_COMPONENTS = {
  volleyball: VolleyballGame,
  baseball: BaseballGame,
};

// Sports tab: pick a sport, then play. Soccer delegates to the existing
// Soccer flow inside Game.jsx (onPlaySoccer); the 5 new sports use SportsShell.
export default function SportsHub({ onBack, onPlaySoccer, onShop, onAward, onEnd, onCustomRoom, onOnlinePlay, unlockedIds, favoriteId, equippedAccessories = {}, equippedSkins = {}, settings = {}, charLevels = {}, equippedElements = {}, onEquipElement, sfxVolume, musicVolume, customCharsData = {}, customNumberMap = {}, charMastery = {}, equippedEmotes = {} }) {
  const [sport, setSport] = useState(null);

  if (sport === 'soccer') { onPlaySoccer?.(); return null; }

  if (sport === 'parkour') {
    return (
      <SplitCityParkour
        onExit={() => setSport(null)}
        onAward={onAward}
        unlockedIds={unlockedIds}
        equippedAccessories={equippedAccessories} equippedSkins={equippedSkins}
        customCharsData={customCharsData}
        sfxVolume={sfxVolume} musicVolume={musicVolume}
        settings={settings}
        charLevels={charLevels}
      />
    );
  }

  if (sport === 'rockclimb') {
    return (
      <RockClimbing
        onExit={() => setSport(null)}
        onAward={onAward}
        unlockedIds={unlockedIds}
        equippedAccessories={equippedAccessories} equippedSkins={equippedSkins}
        customCharsData={customCharsData}
        sfxVolume={sfxVolume} musicVolume={musicVolume}
        settings={settings}
        charLevels={charLevels}
      />
    );
  }

  if (sport === 'ctf') {
    return (
      <CaptureTheFlag
        onExit={() => setSport(null)}
        onAward={onAward}
        unlockedIds={unlockedIds}
        equippedAccessories={equippedAccessories} equippedSkins={equippedSkins}
        customCharsData={customCharsData}
        sfxVolume={sfxVolume} musicVolume={musicVolume}
        settings={settings}
        charLevels={charLevels}
      />
    );
  }

  if (sport === 'dodgeball') {
    return (
      <DodgeballMode
        onExit={() => setSport(null)}
        onAward={onAward}
        unlockedIds={unlockedIds} favoriteId={favoriteId}
        equippedAccessories={equippedAccessories} equippedSkins={equippedSkins}
        customCharsData={customCharsData} customNumberMap={customNumberMap}
        sfxVolume={sfxVolume} musicVolume={musicVolume}
        settings={settings} charLevels={charLevels}
        equippedElements={equippedElements} onEquipElement={onEquipElement}
        charMastery={charMastery}
        equippedEmotes={equippedEmotes}
      />
    );
  }

  if (sport === 'zipline') {
    return (
      <Ziplining
        onExit={() => setSport(null)}
        onAward={onAward}
        unlockedIds={unlockedIds}
        equippedAccessories={equippedAccessories} equippedSkins={equippedSkins}
        customCharsData={customCharsData}
        sfxVolume={sfxVolume} musicVolume={musicVolume}
        settings={settings} charLevels={charLevels}
        equippedElements={equippedElements} onEquipElement={onEquipElement}
      />
    );
  }

  if (sport === 'banger') {
    return (
      <BangerMode
        onExit={() => setSport(null)}
        onAward={onAward}
        unlockedIds={unlockedIds} favoriteId={favoriteId}
        equippedAccessories={equippedAccessories} equippedSkins={equippedSkins}
        customCharsData={customCharsData} customNumberMap={customNumberMap}
        sfxVolume={sfxVolume} musicVolume={musicVolume}
        settings={settings} charLevels={charLevels}
        equippedElements={equippedElements} onEquipElement={onEquipElement}
        charMastery={charMastery}
        equippedEmotes={equippedEmotes}
      />
    );
  }

  if (sport && GAME_COMPONENTS[sport]) {
    const Game = GAME_COMPONENTS[sport];
    return (
      <SportsShell
        sport={sport}
        unlockedIds={unlockedIds} favoriteId={favoriteId}
        equippedAccessories={equippedAccessories} equippedSkins={equippedSkins}
        settings={settings} charLevels={charLevels} equippedElements={equippedElements} onEquipElement={onEquipElement}
        sfxVolume={sfxVolume} musicVolume={musicVolume}
        GameComponent={Game}
        onAward={onAward}
        onEnd={(r) => { setSport(null); onEnd?.(r); }}
        onShop={onShop}
        onExit={() => setSport(null)}
        customCharsData={customCharsData} customNumberMap={customNumberMap}
        charMastery={charMastery}
        equippedEmotes={equippedEmotes}
      />
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-3xl">
      <div className="flex justify-between items-center w-full">
        <h2 className="text-2xl font-heading text-accent tracking-wider">SPORTS</h2>
        <button onClick={onBack} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-heading text-sm hover:opacity-80"><GameIcon emoji="←" size={14} /> MENU</button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full">
        {SPORTS.map(s => (
          <button key={s.id} onClick={() => setSport(s.id)}
            className="flex flex-col items-center gap-2 p-5 rounded-xl border-2 border-border bg-card hover:border-accent hover:bg-accent/10 transition hover:scale-[1.03] shadow-lg">
            <span className="text-5xl">{s.emoji}</span>
            <span className="font-heading text-lg tracking-wider" style={{ color: s.color }}>{s.name.toUpperCase()}</span>
            {s.subtitle && <span className="font-heading text-[9px] tracking-widest text-accent uppercase">Element 6 Original</span>}
            <span className="text-[10px] text-muted-foreground font-body text-center leading-tight">{s.desc}</span>
          </button>
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground font-body text-center max-w-xl">
        Every sport awards XP, has its own leaderboard column, and supports Quick Match + Tournament mode.
        Pick a sport, choose your fighters (Random works for P1, P2, and CPU), and win!
      </p>
      {onCustomRoom && (
        <div className="w-full mt-1">
          <p className="text-xs font-heading text-muted-foreground mb-2 text-center">PLAY WITH FRIENDS (LAN)</p>
          <div className="flex gap-2 flex-wrap justify-center">
            {SPORTS.filter(s => ['soccer', 'volleyball', 'baseball', 'banger'].includes(s.id)).map(s => (
              <button key={s.id} onClick={() => onCustomRoom(s.id)}
                className="px-4 py-2 bg-primary/20 border border-primary text-primary rounded-lg font-heading text-xs hover:bg-primary hover:text-primary-foreground transition">
                {s.emoji} {s.name.toUpperCase()} ROOM
              </button>
            ))}
          </div>
          <p className="text-[9px] text-muted-foreground font-body text-center mt-1">Create a room, invite friends via code, add bots, and play together.</p>
        </div>
      )}
      {onOnlinePlay && (
        <div className="w-full mt-1">
          <p className="text-xs font-heading text-muted-foreground mb-2 text-center">PLAY ONLINE</p>
          <div className="flex gap-2 flex-wrap justify-center">
            {SPORTS.map(s => (
              <button key={s.id} onClick={() => onOnlinePlay(s.id)}
                className="px-4 py-2 bg-accent/20 border border-accent text-accent rounded-lg font-heading text-xs hover:bg-accent hover:text-accent-foreground transition">
                {s.emoji} {s.name.toUpperCase()}
              </button>
            ))}
          </div>
          <p className="text-[9px] text-muted-foreground font-body text-center mt-1">Match up with players online. Host-authoritative sync for smooth play.</p>
        </div>
      )}
    </div>
  );
}