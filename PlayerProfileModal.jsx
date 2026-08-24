import db from './localBackend';

import React, { useState, useEffect } from 'react';

import { HEROES } from './heroes.js';
import { VILLAINS } from './villains.js';
import { GUARDIANS } from './guardians.js';
import { sfx } from './sfx.js';
import GameIcon from "./GameIcon.jsx";

const ALL = [...HEROES, ...VILLAINS, ...GUARDIANS];

// Player Profile modal — opened by clicking another player's nametag in the Hub.
// All actions are wired: Add Friend, DM, Invite to Party/Match, Trade, Gift,
// View Stages/Campaigns/Flyers, plus Play buttons on campaigns.
export default function PlayerProfileModal({ player, me, onClose, onPlayCampaign, onDownloadStage }) {
  const [entry, setEntry] = useState(null);
  const [view, setView] = useState('profile');
  const [stages, setStages] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [flyers, setFlyers] = useState([]);
  const [toast, setToast] = useState('');

  useEffect(() => {
    db.entities.LeaderboardEntry.filter({ user_id: player.id }).then(list => setEntry(list[0] || null)).catch(() => {});
  }, [player.id]);

  const flash = (msg) => { setToast(msg); sfx.purchaseSuccess(); setTimeout(() => setToast(''), 3000); };

  const addFriend = async () => {
    try {
      const existing = await db.entities.FriendRequest.filter({ from_user_id: me.id, to_user_id: player.id, status: 'pending' });
      if (existing[0]) { flash('Friend request already sent.'); return; }
      await db.entities.FriendRequest.create({ from_user_id: me.id, to_user_id: player.id, from_username: me.name, to_username: player.username || player.name, from_code: '', status: 'pending' });
      flash('Friend request sent!');
    } catch { sfx.warning(); flash('Could not send friend request.'); }
  };

  const dm = async () => {
    try {
      const existing = await db.entities.ChatConversation.filter({});
      const conv = (existing || []).find(c => c.type === 'dm' && c.member_ids?.length === 2 && c.member_ids.includes(me.id) && c.member_ids.includes(player.id));
      if (!conv) await db.entities.ChatConversation.create({ type: 'dm', member_ids: [me.id, player.id], member_names: [me.name, player.username || player.name] });
      flash('Direct message conversation ready.');
    } catch { sfx.warning(); flash('Could not open DM.'); }
  };

  const inviteParty = async () => {
    try {
      // Find or create the host's party
      const myParties = await db.entities.Party.filter({});
      let party = (myParties || []).find(p => (p.member_ids || []).includes(me.id));
      if (!party) {
        party = await db.entities.Party.create({
          host_user_id: me.id,
          host_username: me.name,
          name: `${me.name}'s Party`,
          member_ids: [me.id],
          member_names: [me.name],
        });
      }
      await db.entities.PartyInvite.create({
        from_user_id: me.id,
        to_user_id: player.id,
        from_username: me.name,
        to_username: player.username || player.name,
        party_id: party.id,
        party_name: party.name,
        status: 'pending',
      });
      flash(`Party invite sent to ${player.username || player.name}!`);
    } catch { sfx.warning(); flash('Could not invite to party.'); }
  };

  const inviteMatch = async () => {
    try {
      await db.entities.MatchRequest.create({ from_user_id: me.id, to_user_id: player.id, from_username: me.name, to_username: player.username || player.name, sport: '1v1', status: 'pending' });
      flash('Match invite sent!');
    } catch { sfx.warning(); flash('Could not invite to match.'); }
  };

  const trade = () => { sfx.click(); onClose?.('trade', player); };
  const gift = () => { sfx.click(); onClose?.('gift', player); };

  const loadStages = async () => {
    setView('stages');
    try { const list = await db.entities.UploadedStage.filter({ owner_user_id: player.id, is_private: false }, '-created_date', 50); setStages(list || []); } catch {}
  };
  const loadCampaigns = async () => {
    setView('campaigns');
    try { const list = await db.entities.Campaign.filter({ owner_user_id: player.id, is_public: true }, '-created_date', 50); setCampaigns(list || []); } catch {}
  };
  const loadFlyers = async () => {
    setView('flyers');
    try { const list = await db.entities.Flyer.filter({ owner_user_id: player.id, hidden: false }, '-created_date', 50); setFlyers(list || []); } catch {}
  };

  const playCampaign = (c) => { sfx.click(); onClose?.(); onPlayCampaign?.(c); };

  const downloadStage = (s) => {
    const stageData = s.stage_data || {};
    onDownloadStage?.({
      platforms: stageData.platforms || [],
      spawnPoints: stageData.spawnPoints || null,
      backdrop: stageData.backdrop || s.backdrop || 'city',
      name: s.name || 'Downloaded Stage',
      emoji: s.emoji || '🎨',
    });
    flash('Stage downloaded to your stages!');
  };

  const actions = [
    ['Add Friend', addFriend],
    ['Direct Message', dm],
    ['Invite to Party', inviteParty],
    ['Invite to Match', inviteMatch],
    ['Trade', trade],
    ['Gift', gift],
    ['View Stages', loadStages],
    ['View Campaigns', loadCampaigns],
    ['View Flyers', loadFlyers],
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center" onClick={() => onClose?.()}>
      <div className="bg-card border-2 border-accent rounded-xl p-5 w-[480px] max-w-[94%] max-h-[88vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-3">
          <div>
            <h3 className="font-heading text-base text-foreground">{player.username || player.name}</h3>
            <p className="text-[10px] text-muted-foreground">Fav: {ALL.find(c => c.id === player.charId)?.name || '?'} • {player.title || 'No title'}</p>
          </div>
          <button onClick={() => onClose?.()} className="text-xs text-muted-foreground"><GameIcon emoji="✕" size={14} /></button>
        </div>

        {toast && <p className="text-[10px] text-accent font-heading mb-2">{toast}</p>}

        {view === 'profile' && (
          <div>
            <div className="bg-muted/30 rounded-lg p-3 mb-3 grid grid-cols-2 gap-2 text-xs font-body">
              <Row label="Global Rank" v={entry ? rankName(entry.total_xp) : '—'} />
              <Row label="Total XP" v={entry?.total_xp || 0} />
              <Row label="Wins" v={entry?.wins || 0} />
              <Row label="KOs" v={entry?.combat_kills || 0} />
              <Row label="Fights" v={entry?.fight_count || 0} />
              <Row label="Soccer XP" v={entry?.soccer_xp || 0} />
              <Row label="Tennis XP" v={entry?.tennis_xp || 0} />
              <Row label="Track Best" v={entry?.track_best_time || '—'} />
            </div>
            <p className="text-[9px] font-heading text-primary mb-1">COSMETICS</p>
            <div className="bg-muted/30 rounded-lg p-2 mb-3 text-[10px] font-body text-muted-foreground">
              <p>Skin: <span className="text-foreground">{player.skin || 'Default'}</span> • Acc: <span className="text-foreground">{player.accessory || 'None'}</span> • Kill FX: <span className="text-foreground">{player.killfx || 'None'}</span> • Title: <span className="text-accent">{player.title || 'None'}</span></p>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {actions.map(([label, fn]) => (
                <button key={label} onClick={() => { fn(); }} className="px-3 py-2 bg-secondary text-secondary-foreground rounded font-heading text-xs text-left hover:bg-primary/30">{label}</button>
              ))}
            </div>
          </div>
        )}

        {view === 'stages' && (
          <BrowseList title="STAGES" items={stages} onBack={() => setView('profile')} render={s => (
            <div className="flex justify-between items-center">
              <div>
                <p className="font-heading text-xs text-foreground">{s.emoji} {s.name}</p>
                <p className="text-[9px] text-muted-foreground">Plays {s.plays || 0} • <GameIcon emoji="♥" size={14} /> {s.likes || 0}</p>
              </div>
              <button onClick={() => downloadStage(s)} className="px-2 py-1 bg-accent text-accent-foreground rounded font-heading text-[9px]"><GameIcon emoji="⬇" size={14} /> DOWNLOAD</button>
            </div>
          )} />
        )}
        {view === 'campaigns' && (
          <BrowseList title="CAMPAIGNS" items={campaigns} onBack={() => setView('profile')} render={c => (
            <div className="flex justify-between items-center">
              <div>
                <p className="font-heading text-xs text-foreground">{c.thumbnail || <GameIcon emoji="🎮" size={14} />} {c.name}</p>
                <p className="text-[9px] text-muted-foreground">{c.difficulty} • {(c.battles || []).length} battles • <GameIcon emoji="♥" size={14} /> {c.likes || 0}</p>
              </div>
              <button onClick={() => playCampaign(c)} className="px-3 py-1.5 bg-accent text-accent-foreground rounded font-heading text-[10px]"><GameIcon emoji="▶" size={14} /> PLAY</button>
            </div>
          )} />
        )}
        {view === 'flyers' && (
          <BrowseList title="FLYERS" items={flyers} onBack={() => setView('profile')} render={f => (
            <>
              <p className="font-heading text-xs text-foreground">{f.title}</p>
              <p className="text-[9px] text-muted-foreground">{f.category} • <GameIcon emoji="♥" size={14} /> {f.likes || 0}</p>
            </>
          )} emptyMsg="This player has not posted any community flyers." />
        )}
      </div>
    </div>
  );
}

function rankName(xp) {
  if (xp > 10000) return 'Elite';
  if (xp > 5000) return 'Platinum';
  if (xp > 2000) return 'Gold';
  if (xp > 500) return 'Silver';
  return 'Bronze';
}

function Row({ label, v }) { return <div className="flex justify-between"><span className="text-muted-foreground">{label}</span><span className="font-heading text-foreground">{v}</span></div>; }
function BrowseList({ title, items, render, emptyMsg, onBack }) {
  return (
    <div>
      <p className="text-[10px] font-heading text-primary mb-2">{title}</p>
      <div className="space-y-1.5 max-h-64 overflow-y-auto">
        {items.length === 0 && <p className="text-xs text-muted-foreground italic">{emptyMsg || 'None yet.'}</p>}
        {items.map(it => <div key={it.id} className="bg-muted/30 rounded-lg p-2">{render(it)}</div>)}
      </div>
      <button onClick={onBack} className="mt-3 text-[10px] text-accent"><GameIcon emoji="←" size={14} /> Back to profile</button>
    </div>
  );
}