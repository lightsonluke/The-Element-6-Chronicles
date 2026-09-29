import React, { useEffect, useState } from 'react';

export default function ClanTournamentPanel({ supabase, myClan, onGrantTokens }) {
  const [reward, setReward] = useState(null);
  const [week, setWeek] = useState(null);
  const [monthly, setMonthly] = useState([]);
  const [completedBattles, setCompletedBattles] = useState(0);
  const [championshipEligible, setChampionshipEligible] = useState(false);
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const { error: ensureError } = await supabase.rpc('element6_ensure_clan_tournament_current_period');
      if (ensureError) throw ensureError;

      const weeklyQuery = supabase
        .from('element6_clan_tournament_weekly')
        .select('*')
        .order('starts_at', { ascending: false })
        .limit(1);
      if (myClan?.id) weeklyQuery.eq('user_clan_id', myClan.id);

      const [{ data: w, error: we }, { data: m, error: me }] = await Promise.all([
        weeklyQuery.maybeSingle(),
        supabase
          .from('element6_clan_tournament_monthly')
          .select('rank,clan_id,clan_name,clan_tag,tournament_points,monthly_xp,monthly_wins,qualified,month_key')
          .eq('month_key', new Date().toISOString().slice(0, 7))
          .order('rank', { ascending: true })
          .limit(100),
      ]);
      if (we) throw we;
      if (me) throw me;

      let matchup = w || null;
      if (matchup?.clan_a_id || matchup?.clan_b_id) {
        const ids = [matchup.clan_a_id, matchup.clan_b_id].filter(Boolean);
        const { data: clans, error: ce } = await supabase
          .from('element6_clans')
          .select('id,name,tag,icon_url')
          .in('id', ids);
        if (ce) throw ce;
        const byId = Object.fromEntries((clans || []).map(c => [c.id, c]));
        matchup = { ...matchup, clan_a: byId[matchup.clan_a_id] || null, clan_b: byId[matchup.clan_b_id] || null };
      }

      setWeek(matchup);
      setMonthly(m || []);

      if (myClan?.id) {
        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);
        const { data: battles, error: be } = await supabase
          .from('element6_clan_tournament_matchups')
          .select('id,week_key,status,completed_at,clan_a_id,clan_b_id')
          .eq('status', 'complete')
          .or(`clan_a_id.eq.${myClan.id},clan_b_id.eq.${myClan.id}`);
        if (be) throw be;
        const now = Date.now();
        const count = (battles || []).filter(b => {
          if (!b.completed_at || new Date(b.completed_at).getTime() > now) return false;
          const completed = new Date(b.completed_at);
          return completed >= monthStart;
        }).length;
        setCompletedBattles(count);
        const mine = (m || []).find(r => r.clan_id === myClan.id);
        setChampionshipEligible(count >= 4 && Number(mine?.rank) === 1);
      } else {
        setCompletedBattles(0);
        setChampionshipEligible(false);
      }
    } catch (e) {
      setNotice(e?.message || 'Tournament data could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  const claimReward = async () => {
    try {
      const { data, error } = await supabase.rpc('element6_claim_clan_tournament_reward');
      if (error) throw error;
      if (data?.claimed) {
        await onGrantTokens?.(Number(data.tokens || 0));
        setReward(data);
        setNotice(`Monthly championship reward claimed: ${Number(data.tokens || 0).toLocaleString()} tokens.`);
        await refresh();
      } else if (data?.reason === 'already_claimed') {
        setNotice('This month’s championship reward was already claimed.');
      } else if (data?.reason === 'need_four_weekly_battles') {
        setNotice(`Complete ${Math.max(0, 4 - Number(data.completed_battles || 0))} more weekly clan battle${Number(data.completed_battles || 0) === 3 ? '' : 's'} first.`);
      } else if (data?.reason === 'not_winner') {
        setNotice('Your clan has not finished first in this month’s championship standings.');
      }
    } catch (e) {
      setNotice(e?.message || 'Reward could not be claimed.');
    }
  };

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 30000);
    return () => clearInterval(t);
  }, [supabase, myClan?.id]);

  const aName = week?.clan_a?.name || (week?.clan_a_id ? 'Unknown Clan' : '—');
  const bName = week?.clan_b?.name || (week?.clan_b_id ? 'Unknown Clan' : 'BYE');

  return <section className="space-y-4">
    <div className="rounded-2xl border bg-card p-5">
      <div className="flex justify-between items-start gap-3">
        <div><h2 className="font-heading text-xl">CLAN TOURNAMENTS</h2><p className="text-xs text-muted-foreground mt-1">Every week, clans are randomly paired. The clan that earns more XP during that week wins the matchup.</p></div>
        <button onClick={refresh} className="rounded-lg bg-secondary px-3 py-2 text-xs">REFRESH</button>
      </div>
      {loading ? <p className="mt-4 text-sm text-muted-foreground">Loading tournament…</p> : week ? <div className="mt-4 rounded-xl bg-secondary/50 p-4">
        <div className="text-xs text-muted-foreground">WEEK {week.week_key}</div>
        <div className="mt-2 grid grid-cols-2 gap-3">
          <div className={`rounded-xl border p-3 ${week.winner_clan_id === week.clan_a_id ? 'border-accent' : ''}`}><b>{aName}</b><div className="text-xs">{Number(week.clan_a_xp || 0).toLocaleString()} XP</div></div>
          <div className={`rounded-xl border p-3 ${week.winner_clan_id === week.clan_b_id ? 'border-accent' : ''}`}><b>{bName}</b><div className="text-xs">{Number(week.clan_b_xp || 0).toLocaleString()} XP</div></div>
        </div>
        <div className="mt-3 text-xs text-muted-foreground">{week.status === 'complete' ? `Winner: ${week.winner_clan_id === week.clan_a_id ? aName : bName}` : week.status === 'bye' ? `${aName} receives a bye.` : 'Matchup is active — XP updates as the week progresses.'}</div>
      </div> : <p className="mt-4 text-sm text-muted-foreground">Join a clan to participate.</p>}
    </div>

    <div className="rounded-2xl border bg-card p-5"><h3 className="font-heading">MONTHLY TOP 100</h3><p className="text-xs text-muted-foreground mt-1">The top 100 clans by tournament performance qualify for the monthly championship table.</p><div className="mt-3 overflow-auto"><table className="w-full text-xs"><thead><tr className="text-left text-muted-foreground"><th className="p-2">#</th><th className="p-2">Clan</th><th className="p-2">Points</th><th className="p-2">Monthly XP</th></tr></thead><tbody>{monthly.map(r => <tr key={r.clan_id} className="border-t"><td className="p-2">{r.rank}</td><td className="p-2 font-semibold">{r.clan_name || 'Unknown Clan'} <span className="text-muted-foreground">[{r.clan_tag || '—'}]</span></td><td className="p-2">{r.tournament_points}</td><td className="p-2">{Number(r.monthly_xp || 0).toLocaleString()}</td></tr>)}</tbody></table></div></div>

    {myClan && championshipEligible && !reward && <button onClick={claimReward} className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground">CLAIM MONTHLY CHAMPIONSHIP REWARD</button>}
    {myClan && completedBattles < 4 && <p className="text-xs text-muted-foreground">Monthly championship reward unlocks after 4 completed weekly clan battles. Completed this month: {completedBattles}/4.</p>}
    {reward && <p className="text-xs text-accent">Reward claimed: {Number(reward.tokens || 0).toLocaleString()} tokens.</p>}
    {notice && <p className="text-xs text-destructive">{notice}</p>}
  </section>;
}
