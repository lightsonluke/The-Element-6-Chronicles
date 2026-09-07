/*
  TARGETED REPLACEMENT FOR THE CURRENT "CLAN MILESTONE REWARDS" PANEL
  in ClansScreen.jsx.

  Add these state values near the other useState declarations:

    const [tierRewards, setTierRewards] = useState([]);
    const [tierRewardClaims, setTierRewardClaims] = useState([]);
    const [tierMilestonesReached, setTierMilestonesReached] = useState([]);

  Add this helper function inside ClansScreen:
*/

async function loadTierProgressData(clanId) {
  if (!supabase || !clanId) return;

  const [rewardsResult, claimsResult, reachedResult] = await Promise.all([
    supabase
      .from('element6_clan_rewards')
      .select('tier,token_reward,label')
      .order('tier', { ascending: true }),
    supabase
      .from('element6_clan_reward_claims')
      .select('tier')
      .eq('clan_id', clanId)
      .eq('user_id', userId),
    supabase
      .from('element6_clan_milestone_reached')
      .select('milestone_key,tier,milestone_type,xp_threshold,element6_clan_milestone_rewards(milestone_key,token_reward,shikigami_id,accessory_id,label)')
      .eq('clan_id', clanId),
  ]);

  if (!rewardsResult.error) setTierRewards(rewardsResult.data || []);
  if (!claimsResult.error) setTierRewardClaims(claimsResult.data || []);
  if (!reachedResult.error) setTierMilestonesReached(reachedResult.data || []);
}

/*
  In refresh(), after myClan is identified and loadClan() is called, also call:

    await loadTierProgressData(mine.element6_clans.id);

  Then replace the current Tier/MILESTONE card inside view === 'mine' with the JSX below.
*/

{(() => {
  const tier = Math.max(0, Math.min(10, Number(myClan?.tier || 0)));
  const currentXp = Number(myClan?.xp || 0);
  const lifetimeXp = Number(myClan?.lifetime_xp ?? currentXp);
  const currentTierDef = TIERS.find(t => t.tier === tier) || TIERS[0];
  const nextTierDef = tier < 10 ? TIERS.find(t => t.tier === tier + 1) : null;
  const nextReward = tier < 10
    ? tierRewards.find(r => Number(r.tier) === tier + 1)
    : null;
  const claimedTiers = new Set(tierRewardClaims.map(r => Number(r.tier)));
  const reachedMilestones = new Map(
    tierMilestonesReached.map(r => [r.milestone_key, r])
  );

  const xpStart = Number(currentTierDef.xp || 0);
  const xpTarget = nextTierDef ? Number(nextTierDef.xp || 0) : xpStart;
  const xpIntoTier = tier >= 10
    ? Math.max(0, currentXp - xpStart)
    : Math.max(0, currentXp - xpStart);
  const xpNeededInTier = nextTierDef
    ? Math.max(1, xpTarget - xpStart)
    : 1;
  const progressPercent = tier >= 10
    ? 100
    : Math.min(100, Math.max(0, Math.round((xpIntoTier / xpNeededInTier) * 100)));

  const formatXp = value => Number(value || 0).toLocaleString();
  const currentMilestoneKey = `tier${tier}_full`;
  const currentMilestone = tier > 0 ? reachedMilestones.get(currentMilestoneKey) : null;
  const nextMilestoneKey = nextTierDef ? `tier${nextTierDef.tier}_full` : null;
  const nextMilestone = nextMilestoneKey ? reachedMilestones.get(nextMilestoneKey) : null;

  return (
    <div className="rounded-2xl border bg-card p-5 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold tracking-[0.25em] text-muted-foreground">CLAN PROGRESSION</div>
          <h2 className="mt-1 font-heading text-3xl text-accent">TIER {tier}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {tier >= 10 ? 'Final clan milestone reached.' : `Next tier: Tier ${nextTierDef?.tier}`}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-right">
          <div className="rounded-xl bg-secondary/50 px-4 py-3">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Current XP</div>
            <div className="mt-1 font-heading text-lg">
              {formatXp(currentXp)}{nextTierDef ? ` / ${formatXp(nextTierDef.xp)}` : ''}
            </div>
          </div>
          <div className="rounded-xl bg-secondary/50 px-4 py-3">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Lifetime XP</div>
            <div className="mt-1 font-heading text-lg">{formatXp(lifetimeXp)}</div>
          </div>
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            {tier >= 10
              ? 'Tier 10 complete'
              : `${formatXp(xpIntoTier)} / ${formatXp(xpNeededInTier)} XP toward Tier ${nextTierDef?.tier}`}
          </span>
          <b>{progressPercent}%</b>
        </div>
        <div className="h-4 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="relative pt-3">
        <div className="absolute left-2 right-2 top-[30px] h-1 rounded-full bg-secondary" />
        <div
          className="absolute left-2 top-[30px] h-1 rounded-full bg-primary transition-all duration-500"
          style={{ width: `calc(${Math.max(0, Math.min(100, (tier / 10) * 100))}% - 4px)` }}
        />

        <div className="relative grid grid-cols-11 gap-1">
          {TIERS.map(t => {
            const isCurrent = t.tier === tier;
            const isComplete = t.tier <= tier;
            const reward = tierRewards.find(r => Number(r.tier) === t.tier);
            const claimed = claimedTiers.has(t.tier);
            const milestoneFull = reachedMilestones.get(`tier${t.tier}_full`);

            return (
              <div key={t.tier} className="flex min-w-0 flex-col items-center">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-[11px] font-bold transition-all ${
                    isCurrent
                      ? 'scale-110 border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/30'
                      : isComplete
                        ? 'border-primary/70 bg-primary/15 text-primary'
                        : 'border-border bg-secondary text-muted-foreground'
                  }`}
                >
                  {isComplete ? '✓' : t.tier}
                </div>

                <div className={`mt-2 text-[10px] font-semibold ${isCurrent ? 'text-primary' : 'text-muted-foreground'}`}>
                  T{t.tier}
                </div>

                {t.tier > 0 && reward && (
                  <div
                    title={`${reward.label}: ${Number(reward.token_reward || 0).toLocaleString()} tokens`}
                    className={`mt-1 h-2.5 w-2.5 rounded-full border ${
                      claimed
                        ? 'border-primary bg-primary'
                        : milestoneFull
                          ? 'border-accent bg-accent'
                          : 'border-muted-foreground/50 bg-secondary'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border bg-secondary/30 p-4">
          <div className="text-[10px] font-bold tracking-wider text-muted-foreground">CURRENT TIER</div>
          <div className="mt-1 font-heading text-xl">Tier {tier}</div>
          <div className="mt-1 text-xs text-muted-foreground">
            {tier >= 10 ? 'All tier rewards are unlocked.' : `${formatXp(currentXp)} total current XP`}
          </div>
          {currentMilestone && (
            <div className="mt-2 text-xs text-primary">✓ Completion milestone reached</div>
          )}
        </div>

        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
          <div className="text-[10px] font-bold tracking-wider text-primary">NEXT REWARD</div>
          {nextReward ? (
            <>
              <div className="mt-1 font-heading text-xl">Tier {nextTierDef.tier}</div>
              <div className="mt-1 text-sm">{nextReward.label}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                {Number(nextReward.token_reward || 0).toLocaleString()} tokens
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                Unlocks at {formatXp(nextTierDef.xp)} XP and the required clan age.
              </div>
            </>
          ) : (
            <div className="mt-1 text-sm font-semibold">Tier 10 Final Milestone</div>
          )}
          {nextMilestone && <div className="mt-2 text-xs text-accent">✓ Milestone already reached</div>}
        </div>

        <div className="rounded-xl border bg-secondary/30 p-4">
          <div className="text-[10px] font-bold tracking-wider text-muted-foreground">LIFETIME TOTAL</div>
          <div className="mt-1 font-heading text-xl">{formatXp(lifetimeXp)} XP</div>
          <div className="mt-1 text-xs text-muted-foreground">
            Lifetime XP never resets when the clan tiers up.
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-secondary/40 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="font-semibold">REWARDS</div>
            <div className="text-xs text-muted-foreground">Filled dots are claimed rewards. Accent dots are reached milestones.</div>
          </div>
          <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground">
            <span className="inline-flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-full border border-primary bg-primary" /> Claimed</span>
            <span className="inline-flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-full border border-accent bg-accent" /> Reached</span>
            <span className="inline-flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-full border border-muted-foreground/50 bg-secondary" /> Locked</span>
          </div>
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {tierRewards.map(r => {
            const rTier = Number(r.tier);
            const claimed = claimedTiers.has(rTier);
            const reached = rTier <= tier || !!reachedMilestones.get(`tier${rTier}_full`);
            return (
              <div key={rTier} className={`rounded-lg border p-3 ${rTier === tier ? 'border-primary bg-primary/10' : ''}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold">Tier {rTier}</span>
                  <span className={`text-[10px] ${claimed ? 'text-primary' : reached ? 'text-accent' : 'text-muted-foreground'}`}>
                    {claimed ? 'CLAIMED' : reached ? 'REACHED' : 'LOCKED'}
                  </span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{r.label}</div>
                <div className="mt-1 text-xs font-semibold">{Number(r.token_reward || 0).toLocaleString()} tokens</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
})()}
