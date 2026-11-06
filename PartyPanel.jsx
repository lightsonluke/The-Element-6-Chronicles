import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabaseClient.js';
import { sfx } from './sfx.js';
import GameIcon from './GameIcon.jsx';
import { getTitleById } from './profileTitles.js';

// The Community Hub uses the same server-owned party state as the Party page.
// Never mutate a browser-side Party entity: membership and capacity are decided
// atomically by the party RPCs.
export default function PartyPanel({ userId, username, hubPlayers = [], onClose }) {
  const [party, setParty] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const { data, error: rpcError } = await supabase.rpc('element6_get_party_presence');
      if (rpcError) throw rpcError;
      const nextParty = data?.party || null;
      setParty(nextParty);
      setMembers(data?.members || nextParty?.members || []);
      setError('');
    } catch (e) {
      setError(e?.message || 'Could not load the current party.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 3500);
    return () => clearInterval(timer);
  }, [refresh]);

  const run = async (operation, successMessage) => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const result = await operation();
      if (result?.error) throw result.error;
      if (successMessage) sfx.purchaseSuccess();
      await refresh();
    } catch (e) {
      setError(e?.message || 'The party action could not be completed.');
      sfx.warning();
    } finally {
      setBusy(false);
    }
  };

  const createParty = () => run(() => supabase.rpc('element6_create_party', {
    p_public: false,
    p_name: `${username || 'Player'}'s Party`,
  }), true);

  const leaveParty = () => {
    if (!party?.id) return;
    return run(() => supabase.rpc('element6_leave_party', { p_party_id: party.id }), true);
  };

  const invitePlayer = player => {
    if (!party?.id || !player?.id || player.id === userId) return;
    return run(() => supabase.rpc('element6_send_party_invite', {
      p_party_id: party.id,
      p_to_user: player.id,
    }), true);
  };

  const copyCode = async () => {
    if (!party?.party_code) return;
    try {
      await navigator.clipboard.writeText(party.party_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setError('Could not copy the party code. Select and copy it manually.');
    }
  };

  const otherPlayers = hubPlayers.filter(p => p.id && p.id !== userId && !(party?.members || []).some(m => m.user_id === p.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3" onClick={onClose}>
      <section role="dialog" aria-modal="true" aria-label="Party" className="w-[min(36rem,96vw)] max-h-[88dvh] overflow-y-auto rounded-3xl border border-primary/60 bg-card p-5 shadow-2xl" onClick={e => e.stopPropagation()}>
        <header className="mb-4 flex items-center justify-between gap-3">
          <div><p className="font-heading text-base text-accent"><GameIcon icon="users" size={16} /> PARTY</p><p className="mt-1 text-xs text-muted-foreground">Your group is shared with the Party screen and online lobbies.</p></div>
          <button type="button" onClick={onClose} aria-label="Close party" className="grid h-11 w-11 place-items-center rounded-full bg-secondary"><GameIcon icon="close" size={16} /></button>
        </header>

        {error && <p role="alert" className="mb-3 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">{error}</p>}
        {loading ? <p className="py-8 text-center text-sm text-muted-foreground">Loading party…</p> : !party ? (
          <div className="rounded-2xl border border-border bg-background/50 p-5 text-center">
            <p className="text-sm text-muted-foreground">You are not in a party.</p>
            <button type="button" disabled={busy} onClick={createParty} className="mt-4 min-h-12 rounded-full bg-primary px-6 font-heading text-sm text-primary-foreground disabled:opacity-50">CREATE PARTY</button>
          </div>
        ) : (
          <>
            <div className="rounded-2xl border border-primary/30 bg-primary/10 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><h3 className="font-heading text-lg text-foreground">{party.name}</h3><p className="mt-1 text-xs text-muted-foreground">{party.member_count || members.length} / 8 members · {party.is_public ? 'Public' : 'Invite only'}</p></div>
                <div className="flex items-center gap-2"><code className="rounded-lg bg-background/80 px-3 py-2 font-heading tracking-[.2em] text-primary">{party.party_code}</code><button type="button" onClick={copyCode} className="min-h-11 rounded-full bg-secondary px-3 text-xs"><GameIcon icon="copy" size={14} /> {copied ? 'COPIED' : 'COPY'}</button></div>
              </div>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {members.map(member => <div key={member.user_id} className="flex min-h-16 items-center gap-3 rounded-2xl border border-border bg-background/55 px-3 py-2">
                <span aria-hidden="true" className={`h-3 w-3 shrink-0 rounded-full ${member.app_status === 'offline' ? 'bg-muted-foreground/50' : 'bg-emerald-400'}`} />
                <span className="min-w-0 flex-1"><strong className="block truncate text-sm">{member.username || 'Player'}{member.user_id === userId && <small className="ml-2 text-muted-foreground">YOU</small>}</strong>{member.title && <small className="block truncate text-[10px] text-primary" title={getTitleById(member.title)?.name || member.title}>{getTitleById(member.title)?.name || member.title}</small>}<small className="text-xs text-muted-foreground">{member.current_mode ? `Playing ${member.current_mode}` : member.app_status || 'In party'}</small></span>
                {member.user_id === party.host_user_id && <span className="rounded-full border border-primary/50 px-2 py-1 font-heading text-[9px] text-primary">HOST</span>}
              </div>)}
            </div>

            <div className="mt-4 rounded-2xl border border-border p-3">
              <div className="mb-2 flex items-center justify-between"><h4 className="font-heading text-xs text-primary">INVITE FROM THIS HUB</h4><span className="text-[10px] text-muted-foreground">{Math.max(0, 8 - (party.member_count || members.length))} open slots</span></div>
              <div className="max-h-36 space-y-1 overflow-y-auto">
                {otherPlayers.length ? otherPlayers.map(player => <div key={player.id} className="flex items-center gap-2 rounded-xl bg-secondary/40 p-2"><span className="min-w-0 flex-1 truncate text-xs">{player.name || player.username || 'Player'}</span><button type="button" disabled={busy || (party.member_count || members.length) >= 8} onClick={() => invitePlayer(player)} className="min-h-10 rounded-full bg-primary/20 px-3 text-[10px] font-heading text-primary disabled:opacity-40">INVITE</button></div>) : <p className="py-3 text-center text-xs text-muted-foreground">No other players are visible in this Hub server.</p>}
              </div>
            </div>
            <button type="button" disabled={busy} onClick={leaveParty} className="mt-4 min-h-11 rounded-full border border-destructive/40 px-4 text-xs font-heading text-destructive disabled:opacity-50">LEAVE PARTY</button>
          </>
        )}
      </section>
    </div>
  );
}
