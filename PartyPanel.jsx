import db from './localBackend';

import React, { useState, useEffect } from 'react';

import { sfx } from './sfx.js';
import GameIcon from "./GameIcon.jsx";

// Party panel — shows party members and lets host invite more players from the hub.
export default function PartyPanel({ userId, username, serverCode, hubPlayers, onClose }) {
  const [party, setParty] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const list = await db.entities.Party.filter({ member_ids: userId });
      // Filter manually since member_ids is an array
      const mine = (list || []).filter(p => (p.member_ids || []).includes(userId));
      setParty(mine[0] || null);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 5000);
    return () => clearInterval(t);
  }, [userId]);

  // Subscribe to party updates
  useEffect(() => {
    const unsub = db.entities.Party.subscribe(() => { refresh(); });
    return () => unsub?.();
  }, []);

  const createParty = async () => {
    try {
      const created = await db.entities.Party.create({
        host_user_id: userId,
        host_username: username,
        name: `${username}'s Party`,
        member_ids: [userId],
        member_names: [username],
        hub_server: serverCode || '',
      });
      setParty(created);
      sfx.purchaseSuccess();
    } catch { sfx.warning(); }
  };

  const leaveParty = async () => {
    if (!party) return;
    try {
      const newIds = (party.member_ids || []).filter(id => id !== userId);
      const newNames = (party.member_names || []).filter(n => n !== username);
      if (newIds.length === 0) {
        await db.entities.Party.delete(party.id);
      } else {
        await db.entities.Party.update(party.id, { member_ids: newIds, member_names: newNames });
      }
      setParty(null);
      sfx.click();
    } catch {}
  };

  const invitePlayer = async (player) => {
    if (!party) return;
    try {
      await db.entities.PartyInvite.create({
        from_user_id: userId,
        to_user_id: player.id,
        from_username: username,
        to_username: player.name || player.username || 'Player',
        party_id: party.id,
        party_name: party.name,
        status: 'pending',
      });
      sfx.purchaseSuccess();
    } catch { sfx.warning(); }
  };

  const otherPlayers = (hubPlayers || []).filter(p => p.id !== userId && !(party?.member_ids || []).includes(p.id));

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center" onClick={onClose}>
      <div className="bg-card border-2 border-primary rounded-xl p-5 w-[460px] max-w-[94%] max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-heading text-base text-accent"><GameIcon emoji="👥" size={14} /> PARTY</h3>
          <button onClick={onClose} className="text-xs text-muted-foreground"><GameIcon emoji="✕" size={14} /></button>
        </div>

        {loading ? (
          <p className="text-[10px] text-muted-foreground">Loading…</p>
        ) : !party ? (
          <div className="text-center py-6">
            <p className="text-xs text-muted-foreground mb-4">You're not in a party. Create one to invite friends!</p>
            <button onClick={createParty} className="px-5 py-2 bg-accent text-accent-foreground rounded font-heading text-sm">+ CREATE PARTY</button>
          </div>
        ) : (
          <>
            <p className="font-heading text-sm text-foreground mb-1">{party.name}</p>
            <p className="text-[10px] text-muted-foreground mb-3">{(party.member_ids || []).length} member(s)</p>
            <div className="space-y-1.5 mb-4">
              {(party.member_names || []).map((name, i) => (
                <div key={i} className="flex items-center gap-2 bg-muted/30 border border-border rounded-lg px-2.5 py-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="font-heading text-xs text-foreground flex-1">{name}</span>
                  {party.member_ids?.[i] === party.host_user_id && <span className="text-[8px] text-accent font-heading">HOST</span>}
                </div>
              ))}
            </div>
            {otherPlayers.length > 0 && (
              <>
                <p className="text-[10px] font-heading text-primary mb-1">INVITE FROM SERVER:</p>
                <div className="space-y-1 max-h-40 overflow-y-auto mb-3">
                  {otherPlayers.map(p => (
                    <div key={p.id} className="flex items-center gap-2 bg-muted/20 border border-border rounded-lg px-2.5 py-1.5">
                      <span className="font-heading text-xs text-foreground flex-1">{p.name || p.username || 'Player'}</span>
                      <button onClick={() => invitePlayer(p)} className="px-2 py-1 bg-accent text-accent-foreground rounded font-heading text-[9px]">+ INVITE</button>
                    </div>
                  ))}
                </div>
              </>
            )}
            <button onClick={leaveParty} className="w-full px-3 py-1.5 bg-destructive text-destructive-foreground rounded font-heading text-xs">LEAVE PARTY</button>
          </>
        )}
      </div>
    </div>
  );
}