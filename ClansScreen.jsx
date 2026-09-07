import React, { useEffect, useMemo, useState } from 'react';

/**
 * Element 6 Clans
 *
 * Props:
 *   supabase       - your existing Supabase client
 *   onBack         - returns to Home
 *   tokenBalance   - current token count from the existing game economy
 *   onSpendTokens  - async (amount) => true/false; MUST atomically deduct from your existing economy
 *   onGrantTokens  - optional async (amount) => true/false for clan tier rewards
 *   currentUserId  - optional; otherwise read supabase.auth.getUser()
 *   formatElo      - optional formatter for your existing ELO UI
 */
const CREATE_COST = 30000;

const TIERS = [
  { tier: 0, xp: 0, days: 0, reward: 0 },
  { tier: 1, xp: 1, days: 0, reward: 500 },
  { tier: 2, xp: 75, days: 7, reward: 1000 },
  { tier: 3, xp: 250, days: 21, reward: 1500 },
  { tier: 4, xp: 550, days: 45, reward: 2500 },
  { tier: 5, xp: 1000, days: 75, reward: 3500 },
  { tier: 6, xp: 1600, days: 110, reward: 5000 },
  { tier: 7, xp: 2400, days: 150, reward: 7000 },
  { tier: 8, xp: 3400, days: 200, reward: 9000 },
  { tier: 9, xp: 4700, days: 270, reward: 12000 },
  { tier: 10, xp: 6500, days: 365, reward: 20000 },
];

const ROLE_ORDER = { member: 1, officer: 2, lieutenant: 3, leader: 4 };

function safeError(error) {
  return error?.message || 'Something went wrong.';
}

function tierProgress(clan) {
  const next = TIERS.find(t => t.tier === Math.min(10, (clan?.tier || 0) + 1));
  if (!next || clan?.tier >= 10) return { next: null, percent: 100 };
  return {
    next,
    percent: Math.min(100, Math.round(((clan?.xp || 0) / Math.max(1, next.xp)) * 100)),
  };
}

export default function ClansScreen({
  supabase,
  onBack,
  tokenBalance = 0,
  onSpendTokens,
  onGrantTokens,
  currentUserId,
  formatElo = value => String(value ?? 1000),
}) {
  const [userId, setUserId] = useState(currentUserId || null);
  const [view, setView] = useState('browse');
  const [search, setSearch] = useState('');
  const [clans, setClans] = useState([]);
  const [myClan, setMyClan] = useState(null);
  const [members, setMembers] = useState([]);
  const [applications, setApplications] = useState([]);
  const [messages, setMessages] = useState([]);
  const [leaderThreads, setLeaderThreads] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [selectedClan, setSelectedClan] = useState(null);
  const [eloRows, setEloRows] = useState([]);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const [createForm, setCreateForm] = useState({ name: '', tag: '', bio: '', icon: '' });
  const [applyText, setApplyText] = useState('');
  const [chatText, setChatText] = useState('');
  const [meetingForm, setMeetingForm] = useState({ clanId: '', title: '', notes: '', scheduledAt: '' });

  const isLeader = myClan?.myRole === 'leader';

  async function getUid() {
    if (userId) return userId;
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    setUserId(data.user?.id || null);
    return data.user?.id || null;
  }

  async function refresh() {
    if (!supabase) return;
    setBusy(true);
    try {
      const uid = await getUid();
      const [{ data: clanRows, error: clanError }, { data: mine, error: mineError }] = await Promise.all([
        supabase.from('element6_clans').select('*').order('tier', { ascending: false }).order('xp', { ascending: false }),
        supabase.from('element6_clan_members').select('clan_id,role,element6_clans(*)').eq('user_id', uid).maybeSingle(),
      ]);
      if (clanError) throw clanError;
      if (mineError) throw mineError;

      setClans(clanRows || []);
      if (mine?.element6_clans) {
        setMyClan({ ...mine.element6_clans, myRole: mine.role });
        await loadClan(mine.element6_clans);
      } else {
        setMyClan(null);
        setMembers([]);
        setApplications([]);
        setMessages([]);
        setEloRows([]);
      }
    } catch (e) {
      setNotice(safeError(e));
    } finally {
      setBusy(false);
    }
  }

  async function loadClan(clan) {
    if (!clan) return;
    const uid = await getUid();

    const [{ data: ms, error: me }, { data: apps, error: ae }, eloResult] = await Promise.all([
      supabase
        .from('element6_clan_members')
        .select('user_id,role,joined_at,player_profiles(username)')
        .eq('clan_id', clan.id)
        .order('joined_at', { ascending: true }),
      supabase
        .from('element6_clan_applications')
        .select('id,user_id,message,status,created_at,player_profiles(username)')
        .eq('clan_id', clan.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: true }),
      supabase.rpc('element6_get_clan_member_elo', { p_clan_id: clan.id }),
    ]);

    if (me) throw me;
    if (ae) throw ae;
    if (eloResult.error) throw eloResult.error;

    setMembers(ms || []);
    setApplications(isLeader ? (apps || []) : []);
    setEloRows(eloResult.data || []);

    const { data: chat, error: ce } = await supabase
      .from('element6_clan_chat_messages')
      .select('id,clan_id,user_id,body,created_at,player_profiles(username)')
      .eq('clan_id', clan.id)
      .order('created_at', { ascending: false })
      .limit(100);
    if (ce) throw ce;
    setMessages((chat || []).reverse());

    const { data: meetingRows } = await supabase
      .from('element6_clan_meetings')
      .select('*')
      .or(`organizer_clan_id.eq.${clan.id},invited_clan_id.eq.${clan.id}`)
      .order('scheduled_at', { ascending: true })
      .limit(50);
    setMeetings(meetingRows || []);

    if (isLeader) {
      const { data: threads } = await supabase
        .from('element6_clan_leader_threads')
        .select('*')
        .or(`clan_a_id.eq.${clan.id},clan_b_id.eq.${clan.id}`)
        .order('created_at', { ascending: false });
      setLeaderThreads(threads || []);
    }

    if (uid) setSelectedClan(clan);
  }

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    if (!supabase || !myClan?.id) return;

    const channel = supabase
      .channel(`element6-clan-${myClan.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'element6_clan_chat_messages', filter: `clan_id=eq.${myClan.id}` }, () => loadClan(myClan))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'element6_clan_applications', filter: `clan_id=eq.${myClan.id}` }, () => loadClan(myClan))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'element6_clan_meetings' }, () => loadClan(myClan))
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [myClan?.id]);

  const filteredClans = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clans;
    return clans.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.tag.toLowerCase().includes(q)
    );
  }, [clans, search]);

  async function createClan() {
    if (tokenBalance < CREATE_COST) {
      setNotice(`You need ${CREATE_COST.toLocaleString()} tokens to create a clan.`);
      return;
    }
    if (!onSpendTokens) {
      setNotice('Your existing token economy needs to be connected to onSpendTokens before clan creation can be enabled.');
      return;
    }

    setBusy(true);
    try {
      const spent = await onSpendTokens(CREATE_COST);
      if (!spent) throw new Error('Token purchase failed or you do not have enough tokens.');

      const { data, error } = await supabase.rpc('element6_create_clan', {
        p_name: createForm.name,
        p_tag: createForm.tag,
        p_bio: createForm.bio,
        p_icon_url: createForm.icon || null,
      });
      if (error) {
        // If SQL creation failed after the economy was charged, the app should
        // refund through the existing economy callback rather than silently
        // losing tokens.
        try { await onGrantTokens?.(CREATE_COST); } catch {}
        throw error;
      }

      setNotice(`Clan ${data.name} created!`);
      setCreateForm({ name: '', tag: '', bio: '', icon: '' });
      await refresh();
      setView('mine');
    } catch (e) {
      setNotice(safeError(e));
    } finally {
      setBusy(false);
    }
  }

  async function applyToClan(clanId) {
    setBusy(true);
    try {
      const { error } = await supabase.rpc('element6_apply_to_clan', {
        p_clan_id: clanId,
        p_message: applyText,
      });
      if (error) throw error;
      setApplyText('');
      setNotice('Application sent. The clan leader must approve it.');
    } catch (e) {
      setNotice(safeError(e));
    } finally {
      setBusy(false);
    }
  }

  async function reviewApplication(id, approve) {
    setBusy(true);
    try {
      const { error } = await supabase.rpc('element6_review_clan_application', {
        p_application_id: id,
        p_approve: approve,
      });
      if (error) throw error;
      await refresh();
    } catch (e) {
      setNotice(safeError(e));
    } finally {
      setBusy(false);
    }
  }

  async function leaveClan() {
    if (!window.confirm('Leave this clan? You will lose clan access until you rejoin.')) return;
    try {
      const { error } = await supabase.rpc('element6_leave_clan');
      if (error) throw error;
      setNotice('You left the clan.');
      await refresh();
      setView('browse');
    } catch (e) { setNotice(safeError(e)); }
  }

  async function transferOwnership(user) {
    if (!window.confirm(`Transfer leadership to ${user.username || 'this member'}?`)) return;
    try {
      const { error } = await supabase.rpc('element6_transfer_clan_ownership', { p_new_owner: user.user_id });
      if (error) throw error;
      await refresh();
    } catch (e) { setNotice(safeError(e)); }
  }

  async function disbandClan() {
    if (!window.confirm('Disband this clan permanently? This cannot be undone.')) return;
    try {
      const { error } = await supabase.rpc('element6_disband_clan');
      if (error) throw error;
      setNotice('Clan disbanded.');
      await refresh();
      setView('browse');
    } catch (e) { setNotice(safeError(e)); }
  }

  async function setMemberRole(userIdToChange, role) {
    try {
      const { error } = await supabase.rpc('element6_set_clan_member_role', {
        p_member: userIdToChange,
        p_role: role,
      });
      if (error) throw error;
      await refresh();
    } catch (e) { setNotice(safeError(e)); }
  }

  async function sendChat() {
    const body = chatText.trim();
    if (!body || !myClan) return;
    try {
      const uid = await getUid();
      const { error } = await supabase.from('element6_clan_chat_messages').insert({
        clan_id: myClan.id, user_id: uid, body
      });
      if (error) throw error;
      setChatText('');
    } catch (e) { setNotice(safeError(e)); }
  }

  async function claimTierReward(tier) {
    if (!myClan || tier > myClan.tier || !onGrantTokens) return;
    setBusy(true);
    try {
      const { data: already } = await supabase
        .from('element6_clan_reward_claims')
        .select('tier')
        .eq('clan_id', myClan.id)
        .eq('user_id', userId)
        .eq('tier', tier)
        .maybeSingle();
      if (already) throw new Error('You already claimed this clan reward.');

      const reward = TIERS.find(t => t.tier === tier)?.reward || 0;
      if (!(await onGrantTokens(reward))) throw new Error('Could not grant the reward.');

      const { error } = await supabase.from('element6_clan_reward_claims').insert({
        clan_id: myClan.id, user_id: userId, tier
      });
      if (error) throw error;
      setNotice(`Claimed ${reward.toLocaleString()} tokens for Tier ${tier}.`);
    } catch (e) { setNotice(safeError(e)); }
    finally { setBusy(false); }
  }

  async function createMeeting() {
    if (!isLeader) return;
    try {
      const { error } = await supabase.from('element6_clan_meetings').insert({
        organizer_clan_id: myClan.id,
        invited_clan_id: meetingForm.clanId,
        title: meetingForm.title,
        notes: meetingForm.notes,
        scheduled_at: meetingForm.scheduledAt,
        created_by: userId,
      });
      if (error) throw error;
      setMeetingForm({ clanId: '', title: '', notes: '', scheduledAt: '' });
      setNotice('Meeting scheduled.');
      await loadClan(myClan);
    } catch (e) { setNotice(safeError(e)); }
  }

  return (
    <div className="min-h-full w-full bg-background text-foreground p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-4">
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/30 bg-card/90 p-4">
          <div>
            <div className="font-heading text-2xl tracking-wider text-accent">CLANS</div>
            <div className="text-xs text-muted-foreground">Build a team. Climb from Tier 0 to Tier 10.</div>
          </div>
          <div className="flex items-center gap-2">
            {myClan && <span className="rounded-xl bg-accent/10 px-3 py-2 text-xs">YOUR CLAN: <b>{myClan.tag}</b> · TIER {myClan.tier}</span>}
            <button onClick={onBack} className="rounded-lg bg-secondary px-4 py-2 text-sm">← BACK</button>
          </div>
        </header>

        {notice && <button onClick={() => setNotice('')} className="w-full rounded-xl border border-primary/20 bg-card p-3 text-left text-sm">{notice}</button>}

        <nav className="grid grid-cols-2 gap-2 md:grid-cols-5">
          {[
            ['browse','Browse Clans'],
            ['mine','My Clan'],
            ['applications','Applications'],
            ['meetings','Meetings'],
            ['create','Create Clan'],
          ].map(([id,label]) => (
            <button key={id} onClick={() => setView(id)} className={`rounded-xl px-3 py-3 text-sm font-semibold ${view === id ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>
              {label}
            </button>
          ))}
        </nav>

        {view === 'browse' && (
          <section className="space-y-3">
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search clan name or tag..." className="w-full rounded-xl border bg-card px-4 py-3" />
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {filteredClans.map(c => {
                const p = tierProgress(c);
                return (
                  <article key={c.id} className="rounded-2xl border bg-card p-4">
                    <div className="flex gap-3">
                      <img src={c.icon_url || '/favicon.ico'} alt="" className="h-12 w-12 rounded-xl object-cover border" />
                      <div className="min-w-0 flex-1">
                        <div className="font-heading text-lg">{c.name}</div>
                        <div className="text-xs text-muted-foreground">[{c.tag}] · Tier {c.tier}</div>
                      </div>
                    </div>
                    <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{c.bio || 'No clan bio yet.'}</p>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary"><div className="h-full bg-primary" style={{width:`${p.percent}%`}} /></div>
                    <div className="mt-1 text-[11px] text-muted-foreground">{c.xp.toLocaleString()} XP</div>
                    <button onClick={() => { setSelectedClan(c); setView('details'); }} className="mt-3 w-full rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground">View Clan</button>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {view === 'details' && selectedClan && (
          <section className="rounded-2xl border bg-card p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div><h2 className="font-heading text-xl">{selectedClan.name} [{selectedClan.tag}]</h2><p className="text-sm text-muted-foreground">{selectedClan.bio}</p></div>
              {!myClan && <button onClick={() => applyToClan(selectedClan.id)} className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground">Apply to Join</button>}
            </div>
            <div className="rounded-xl bg-secondary/60 p-3">
              <div className="font-semibold">Tier {selectedClan.tier} · {selectedClan.xp.toLocaleString()} XP</div>
              <div className="text-xs text-muted-foreground">Tier 10 requires 365 days minimum plus the highest activity threshold.</div>
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              {eloRows.map(r => (
                <div key={r.user_id} className="rounded-xl border p-3">
                  <div className="flex justify-between"><b>{r.username}</b><span className="text-xs">{r.role}</span></div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                    <span>Ranked: {formatElo(r.ranked_rating)} ({r.ranked_wins}-{r.ranked_losses})</span>
                    <span>Soccer: {formatElo(r.soccer_rating)} ({r.soccer_wins}-{r.soccer_losses})</span>
                    <span>Volleyball: {formatElo(r.volleyball_rating)} ({r.volleyball_wins}-{r.volleyball_losses})</span>
                    <span>Dodgeball: {formatElo(r.dodgeball_rating)} ({r.dodgeball_wins}-{r.dodgeball_losses})</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {view === 'create' && !myClan && (
          <section className="mx-auto max-w-2xl rounded-2xl border bg-card p-5 space-y-4">
            <h2 className="font-heading text-xl">CREATE CLAN</h2>
            <p className="text-sm text-muted-foreground">Creation costs {CREATE_COST.toLocaleString()} tokens. New clans begin at Tier 0.</p>
            <input value={createForm.name} onChange={e=>setCreateForm({...createForm,name:e.target.value})} placeholder="Clan name" className="w-full rounded-xl border bg-background px-4 py-3" />
            <input value={createForm.tag} onChange={e=>setCreateForm({...createForm,tag:e.target.value})} placeholder="Clan tag (2-6 characters)" className="w-full rounded-xl border bg-background px-4 py-3" />
            <textarea value={createForm.bio} onChange={e=>setCreateForm({...createForm,bio:e.target.value})} placeholder="Clan bio" className="w-full rounded-xl border bg-background px-4 py-3 min-h-24" />
            <div>
              <label className="text-sm font-semibold">Clan icon (must be exactly 1×1)</label>
              <input type="file" accept="image/*" className="mt-2 w-full" onChange={e => {
                const f=e.target.files?.[0]; if(!f) return;
                const img=new Image();
                img.onload=()=> {
                  if(img.width!==1 || img.height!==1){ setNotice('Clan icon must be exactly 1×1 pixels.'); return; }
                  const reader=new FileReader();
                  reader.onload=()=>setCreateForm(x=>({...x,icon:String(reader.result)}));
                  reader.readAsDataURL(f);
                };
                img.src=URL.createObjectURL(f);
              }} />
            </div>
            <button disabled={busy || tokenBalance < CREATE_COST} onClick={createClan} className="w-full rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground disabled:opacity-50">
              Create for {CREATE_COST.toLocaleString()} Tokens
            </button>
          </section>
        )}

        {view === 'mine' && myClan && (
          <section className="space-y-4">
            <div className="rounded-2xl border bg-card p-5">
              <div className="flex justify-between">
                <div><h2 className="font-heading text-2xl">{myClan.name}</h2><p className="text-sm text-muted-foreground">[{myClan.tag}] · Tier {myClan.tier}</p></div>
                <div className="text-right"><div className="font-heading text-lg">{myClan.xp.toLocaleString()} XP</div><div className="text-xs text-muted-foreground">365-day minimum to Tier 10</div></div>
              </div>
              <div className="mt-3 h-3 overflow-hidden rounded-full bg-secondary"><div className="h-full bg-primary" style={{width:`${tierProgress(myClan).percent}%`}} /></div>
            </div>

            <div className="rounded-2xl border bg-card p-4">
              <h3 className="font-heading">CLAN CHAT</h3>
              <div className="mt-3 max-h-80 space-y-2 overflow-auto rounded-xl bg-background p-3">
                {messages.map(m=><div key={m.id}><b>{m.player_profiles?.username || 'Player'}:</b> <span>{m.body}</span></div>)}
              </div>
              <div className="mt-3 flex gap-2"><input value={chatText} onChange={e=>setChatText(e.target.value)} onKeyDown={e=>e.key==='Enter'&&sendChat()} placeholder="Message your clan..." className="flex-1 rounded-lg border bg-background px-3 py-2" /><button onClick={sendChat} className="rounded-lg bg-primary px-4 text-primary-foreground">Send</button></div>
            </div>

            <div className="rounded-2xl border bg-card p-4">
              <h3 className="font-heading">CLAN MEMBERS + ELO</h3>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                {eloRows.map(r=><div key={r.user_id} className="rounded-xl border p-3"><div className="flex justify-between"><b>{r.username}</b><span className="text-xs">{r.role}</span></div><div className="text-xs mt-2">Ranked {formatElo(r.ranked_rating)} · Soccer {formatElo(r.soccer_rating)} · Volleyball {formatElo(r.volleyball_rating)} · Dodgeball {formatElo(r.dodgeball_rating)}</div></div>)}
              </div>
            </div>

            {isLeader && <div className="rounded-2xl border bg-card p-4">
              <h3 className="font-heading">LEADER CONTROLS</h3>
              <div className="mt-3 space-y-3">
                {members.map(m=> <div key={m.user_id} className="flex flex-wrap items-center gap-2 rounded-xl border p-3">
                  <span className="flex-1">{m.player_profiles?.username || m.user_id} · {m.role}</span>
                  {m.user_id!==userId && <><select value={m.role} onChange={e=>setMemberRole(m.user_id,e.target.value)} className="rounded-lg border bg-background px-2 py-1"><option value="member">Member</option><option value="officer">Officer</option><option value="lieutenant">Lieutenant</option></select><button onClick={()=>transferOwnership({user_id:m.user_id,username:m.player_profiles?.username})} className="rounded-lg bg-secondary px-2 py-1 text-xs">Transfer</button></>}
                </div>)}
                <button onClick={disbandClan} className="rounded-lg bg-destructive px-4 py-2 text-sm text-destructive-foreground">Disband Clan</button>
                <button onClick={leaveClan} className="rounded-lg bg-secondary px-4 py-2 text-sm">Leave</button>
              </div>
            </div>}
            {!isLeader && <button onClick={leaveClan} className="rounded-lg bg-secondary px-4 py-2">Leave Clan</button>}
          </section>
        )}

        {view === 'applications' && isLeader && (
          <section className="rounded-2xl border bg-card p-4 space-y-3">
            <h2 className="font-heading">JOIN APPLICATIONS</h2>
            {applications.map(a=><div key={a.id} className="rounded-xl border p-3"><div><b>{a.player_profiles?.username || a.user_id}</b><p className="text-sm text-muted-foreground">{a.message || 'No message.'}</p></div><div className="mt-2 flex gap-2"><button onClick={()=>reviewApplication(a.id,true)} className="rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground">Approve</button><button onClick={()=>reviewApplication(a.id,false)} className="rounded-lg bg-secondary px-3 py-2 text-sm">Reject</button></div></div>)}
            {!applications.length && <p className="text-sm text-muted-foreground">No pending applications.</p>}
          </section>
        )}

        {view === 'meetings' && myClan && (
          <section className="space-y-4">
            {isLeader && <div className="rounded-2xl border bg-card p-4">
              <h2 className="font-heading">SCHEDULE CLAN MEETING</h2>
              <div className="grid gap-2 mt-3">
                <select value={meetingForm.clanId} onChange={e=>setMeetingForm({...meetingForm,clanId:e.target.value})} className="rounded-lg border bg-background px-3 py-2"><option value="">Choose another clan</option>{clans.filter(c=>c.id!==myClan.id).map(c=><option key={c.id} value={c.id}>{c.name} [{c.tag}]</option>)}</select>
                <input value={meetingForm.title} onChange={e=>setMeetingForm({...meetingForm,title:e.target.value})} placeholder="Meeting title" className="rounded-lg border bg-background px-3 py-2" />
                <textarea value={meetingForm.notes} onChange={e=>setMeetingForm({...meetingForm,notes:e.target.value})} placeholder="Notes" className="rounded-lg border bg-background px-3 py-2" />
                <input type="datetime-local" value={meetingForm.scheduledAt} onChange={e=>setMeetingForm({...meetingForm,scheduledAt:e.target.value})} className="rounded-lg border bg-background px-3 py-2" />
                <button onClick={createMeeting} disabled={!meetingForm.clanId || !meetingForm.title || !meetingForm.scheduledAt} className="rounded-lg bg-primary px-3 py-2 text-primary-foreground disabled:opacity-50">Schedule Meeting</button>
              </div>
            </div>}
            <div className="rounded-2xl border bg-card p-4">
              <h2 className="font-heading">MEETINGS</h2>
              <div className="mt-3 space-y-2">{meetings.map(m=><div key={m.id} className="rounded-xl border p-3"><b>{m.title}</b><div className="text-xs text-muted-foreground">{new Date(m.scheduled_at).toLocaleString()}</div><p className="text-sm">{m.notes}</p><span className="text-xs">{m.status}</span></div>)}</div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
