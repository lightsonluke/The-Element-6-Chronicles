import React, { useState } from 'react';
import GameIcon from './GameIcon.jsx';
import PartyScreen from './PartyScreen.jsx';

const ITEMS = [
  ['ranked','ONLINE RANKED','1v1 ranked fights'],
  ['unranked','ONLINE UNRANKED','1v1 unranked fights'],
  ['sports','ONLINE SPORTS','Soccer, volleyball, dodgeball and Banger'],
  ['thetable','THE TABLE','8-player elimination fight tournament'],
  ['battleroyale','BATTLE ROYALE','Large online survival fight'],
  ['customrooms','CUSTOM ROOMS','Create or join custom rooms'],
  ['party','PARTY','Build an 8-player party and queue together'],
  ['lan','LAN PLAY','Play over your local network'],
  ['friends','FRIENDS','Manage friends and invites'],
  ['chat','CHAT','Message other players'],
  ['elo','ELO','View online ratings'],
];

export default function OnlineHubScreen({ onBack, onNavigate, initialTab = null }) {
  const [party, setParty] = useState(initialTab === 'party');
  if (party) return <PartyScreen onBack={() => setParty(false)} onQueueMode={mode => { setParty(false); onNavigate?.(mode); }} />;

  return (
    <div className="w-full max-w-5xl flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="px-4 py-2 bg-secondary rounded-lg font-heading text-sm"><GameIcon emoji="←" size={14}/> BACK</button>
        <div className="text-center"><h2 className="text-3xl font-heading text-accent">ONLINE</h2><p className="text-xs text-muted-foreground">ALL ONLINE MODES</p></div>
        <div className="w-20"/>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {ITEMS.map(([id,label,desc]) => (
          <button key={id} onClick={() => id === 'party' ? setParty(true) : onNavigate?.(id)}
            className="text-left rounded-xl border-2 border-border bg-card p-4 hover:border-accent hover:bg-accent/10 transition">
            <div className="font-heading text-primary">{label}</div>
            <div className="text-xs text-muted-foreground mt-1">{desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
