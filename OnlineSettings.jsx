import React, { useState, useEffect } from 'react';
import { music } from './music.js';
import { sfx } from './sfx.js';
import GameIcon from "./GameIcon.jsx";

function Toggle({ on, onClick }) {
  return (
    <button onClick={onClick} className={`w-12 h-6 rounded-full transition relative ${on ? 'bg-accent' : 'bg-muted'}`}>
      <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${on ? 'left-6' : 'left-0.5'}`} />
    </button>
  );
}

export default function OnlineSettings({ onBack, settings = {}, onSave }) {
  const [local, setLocal] = useState(settings);

  const apply = (patch) => {
    const next = { ...local, ...patch };
    setLocal(next);
    onSave?.(next);
    if (next.sfxVolume != null) sfx.setVolume(next.sfxVolume);
  };

  useEffect(() => { music.play('menu'); return () => music.stop(); }, []);

  return (
    <div className="w-full max-w-2xl flex flex-col gap-4 max-h-[85vh] overflow-y-auto pr-1">
      <div className="flex justify-between items-center sticky top-0 z-10 bg-background/80 backdrop-blur py-2 -mx-1 px-1">
        <h2 className="text-2xl font-heading text-accent tracking-wider"><GameIcon emoji="🌐" size={14} /> ONLINE &amp; LAN</h2>
        <button onClick={onBack} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-heading text-sm hover:opacity-80"><GameIcon emoji="←" size={14} /> BACK</button>
      </div>

      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-heading text-sm text-primary mb-3">MATCHMAKING</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-body text-muted-foreground">Region:</span>
            <select value={local.region || 'auto'} onChange={e => apply({ region: e.target.value })} className="px-3 py-1.5 bg-secondary text-secondary-foreground rounded text-xs font-body">
              <option value="auto">Auto</option><option value="na">North America</option><option value="eu">Europe</option><option value="sa">South America</option><option value="asia">Asia</option><option value="oce">Oceania</option><option value="afr">Africa</option>
            </select>
          </div>
          <div className="flex items-center justify-between"><span className="text-xs font-body text-muted-foreground">Preferred match mode:</span>
            <select value={local.preferredMatchMode || 'unranked'} onChange={e => apply({ preferredMatchMode: e.target.value })} className="px-3 py-1.5 bg-secondary text-secondary-foreground rounded text-xs font-body">
              <option value="ranked">Ranked</option><option value="unranked">Unranked</option><option value="soccer">Soccer</option>
            </select>
          </div>
          <div className="flex items-center justify-between"><span className="text-xs font-body text-muted-foreground">Auto-accept matchmaking:</span><Toggle on={local.autoAcceptMatchmaking === true} onClick={() => apply({ autoAcceptMatchmaking: !local.autoAcceptMatchmaking })} /></div>
          <div className="flex items-center justify-between"><span className="text-xs font-body text-muted-foreground">Allow cross-region matches:</span><Toggle on={local.crossRegion === true} onClick={() => apply({ crossRegion: !local.crossRegion })} /></div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-heading text-sm text-primary mb-3">OPPONENT</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between"><span className="text-xs font-body text-muted-foreground">Show opponent ping:</span><Toggle on={local.showPing !== false} onClick={() => apply({ showPing: !local.showPing })} /></div>
          <div className="flex items-center justify-between"><span className="text-xs font-body text-muted-foreground">Mute opponent emotes:</span><Toggle on={local.muteOpponentEmotes === true} onClick={() => apply({ muteOpponentEmotes: !local.muteOpponentEmotes })} /></div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-heading text-sm text-primary mb-3">LAN (SAME WI-FI)</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between"><span className="text-xs font-body text-muted-foreground">LAN auto-discovery:</span><Toggle on={local.lanDiscovery !== false} onClick={() => apply({ lanDiscovery: !local.lanDiscovery })} /></div>
          <p className="text-[10px] text-muted-foreground font-body">Create or join a room with a friend on the same network. Supported modes: Fight, Soccer, Volleyball, Baseball.</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-5"><p className="text-[10px] text-muted-foreground font-body">Preferences are saved automatically.</p></div>
    </div>
  );
}