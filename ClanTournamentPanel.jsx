import React, { useEffect, useState } from 'react';

export default function ClanTournamentPanel({ supabase, myClan, onGrantTokens }) {
  const [reward, setReward] = useState(null);
  const [weeklyRewards, setWeeklyRewards] = useState([]);
  const [week, setWeek] = useState(null);
  const [monthly, setMonthly] = useState([]);
  const [completedWeeks, setCompletedWeeks] = useState(0);
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);

  const collectWeeklyRewards = async () => {
    if (!supabase || !myClan?.id) return;
    try {
      const { data, error } = await supabase.rpc('element6_claim_pending_clan_weekly_rewards');
      if (error) throw error;
      const rewards = Array.isArray(data) ? data : [];
      let total = 0;
      for (const r of rewards) {
        const tokens = Math.max(0, Number(r?.tokens) || 0);
        total += tokens;
        if (tokens > 0) await onGrantTokens?.(tokens);
      }
      if (rewards.length) {
        setWeeklyRewards(prev => [...prev, ...rewards]);
        setNotice(`Weekly clan battle reward received: ${total.toLocaleString()} tokens based on your contribution.`);
      }
    } catch (e) {
      // Reward sync must never block the tournament screen.
      console.warn('[Clan Tournament] Weekly reward sync failed:', e);
    }
  };

  const refresh = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const { error: ensureError } = await supabase.rpc('element6_ensure_clan_tournament_current_period');
      if (ensureError) throw ensureError;
      await collectWeeklyRewards();
      const weeklyQuery = supabase.from('element6_clan_tournament_weekly').select('*,clan_a:element6_clans!clan_a_id(id,name,tag,icon_url),clan_b:element6_clans!clan_b_id(id,name,tag,icon_url)').order('starts_at',{ascending:false}).limit(1);
      if (myClan?.id) weeklyQuery.eq('user_clan_id', myClan.id);
      const [{data:w,error:we},{data:m,error:me},{data:weeks,error:ce}] = await Promise.all([
        weeklyQuery.maybeSingle(),
        supabase.from('element6_clan_tournament_monthly').select('rank,clan_id,clan_name,clan_tag,tournament_points,monthly_xp,monthly_wins,qualified,month_key').order('rank',{ascending:true}).limit(100),
        supabase.from('element6_clan_tournament_weeks').select('week_key,starts_at,ends_at').order('starts_at',{ascending:false}).limit(20)
      ]);
      if(we) throw we; if(me) throw me;
      if(!ce) {
        const now = Date.now();
        const previousMonth = new Date(); previousMonth.setMonth(previousMonth.getMonth()-1);
        const pm = `${previousMonth.getFullYear()}-${String(previousMonth.getMonth()+1).padStart(2,'0')}`;
        setCompletedWeeks((weeks||[]).filter(x => String(x.starts_at||'').slice(0,7)===pm && new Date(x.ends_at).getTime()<=now).length);
      }
      setWeek(w||null); setMonthly(m||[]);
    } catch(e){ setNotice(e?.message||'Tournament data could not be loaded.'); } finally { setLoading(false); }
  };

  const claimReward = async () => {
    try {
      const {data,error}=await supabase.rpc('element6_claim_clan_tournament_reward');
      if(error) throw error;
      if(data?.claimed){
        await onGrantTokens?.(Number(data.tokens||0));
        setReward(data);
        setNotice(`Monthly championship reward claimed (contribution-scaled): ${Number(data.tokens||0).toLocaleString()} tokens.`);
      } else if(data?.reason==='already_claimed') setNotice('This month’s championship reward was already claimed.');
      else if(data?.reason==='not_four_weeks') setNotice(`Monthly championship reward unlocks after 4 completed weekly clan battles (${Number(data.completed_weeks||0)}/4).`);
      else if(data?.reason==='not_winner') setNotice('Your clan did not win the monthly championship.');
    } catch(e){ setNotice(e?.message||'Reward could not be claimed.'); }
  };

  useEffect(()=>{ refresh(); const t=setInterval(refresh,30000); return()=>clearInterval(t); },[supabase,myClan?.id]);

  return <section className="space-y-4">
    <div className="rounded-2xl border bg-card p-5">
      <div className="flex justify-between items-start gap-3"><div><h2 className="font-heading text-xl">CLAN TOURNAMENTS</h2><p className="text-xs text-muted-foreground mt-1">Every week, clans are randomly paired. The clan that earns more XP during that week wins the matchup. The winning clan gets a weekly reward pool of 1,000 tokens per clan member, split among members by their individual XP contribution.</p></div><button onClick={refresh} className="rounded-lg bg-secondary px-3 py-2 text-xs">REFRESH</button></div>
      {loading ? <p className="mt-4 text-sm text-muted-foreground">Loading tournament…</p> : week ? <div className="mt-4 rounded-xl bg-secondary/50 p-4"><div className="text-xs text-muted-foreground">WEEK {week.week_key}</div><div className="mt-2 grid grid-cols-2 gap-3"><div className={`rounded-xl border p-3 ${week.winner_clan_id===week.clan_a_id?'border-accent':''}`}><b>{week.clan_a?.name||'Clan A'}</b><div className="text-xs">{Number(week.clan_a_xp||0).toLocaleString()} XP</div></div><div className={`rounded-xl border p-3 ${week.winner_clan_id===week.clan_b_id?'border-accent':''}`}><b>{week.clan_b?.name||'Clan B'}</b><div className="text-xs">{Number(week.clan_b_xp||0).toLocaleString()} XP</div></div></div><div className="mt-3 text-xs text-muted-foreground">{week.status==='complete' ? `Winner: ${week.winner_clan_id===week.clan_a_id?week.clan_a?.name:week.clan_b?.name}` : 'Matchup is active.'}</div></div> : <p className="mt-4 text-sm text-muted-foreground">Join a clan to participate.</p>}
      {weeklyRewards.length > 0 && <div className="mt-3 rounded-xl border border-accent/30 bg-accent/5 p-3 text-xs"><b>WEEKLY REWARDS</b><div className="mt-1 space-y-1">{weeklyRewards.slice(-3).map((r,i)=><div key={`${r.week_key}-${i}`}>Week {r.week_key}: <b>{Number(r.tokens||0).toLocaleString()} tokens</b> ({(Number(r.xp_share||0)*100).toFixed(1)}% of clan XP)</div>)}</div></div>}
    </div>
    <div className="rounded-2xl border bg-card p-5"><h3 className="font-heading">MONTHLY TOP 100</h3><p className="text-xs text-muted-foreground mt-1">The top 100 clans by tournament performance qualify for the monthly championship table. Tournament token rewards are scaled by each member's share of their clan's XP for that tournament period.</p><div className="mt-3 overflow-auto"><table className="w-full text-xs"><thead><tr className="text-left text-muted-foreground"><th className="p-2">#</th><th className="p-2">Clan</th><th className="p-2">Points</th><th className="p-2">Monthly XP</th></tr></thead><tbody>{monthly.map(r=><tr key={r.clan_id} className="border-t"><td className="p-2">{r.rank}</td><td className="p-2 font-semibold">{r.clan_name} <span className="text-muted-foreground">[{r.clan_tag}]</span></td><td className="p-2">{r.tournament_points}</td><td className="p-2">{Number(r.monthly_xp||0).toLocaleString()}</td></tr>)}</tbody></table></div></div>
    {myClan && completedWeeks >= 4 && <button onClick={claimReward} className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground">CLAIM MONTHLY CHAMPIONSHIP REWARD</button>}
    {myClan && completedWeeks < 4 && <p className="text-xs text-muted-foreground text-center">Monthly championship reward unlocks after 4 completed weekly clan battles.</p>}
    {reward && <p className="text-xs text-accent">Reward claimed: {Number(reward.tokens||0).toLocaleString()} tokens.</p>}
    {notice && <p className="text-xs text-destructive">{notice}</p>}
  </section>;
}
