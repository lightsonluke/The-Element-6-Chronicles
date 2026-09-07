ELEMENT 6 — TARGETED CLAN TIER UPGRADE

This package only changes the clan progression/tier UI and lifetime XP tracking.
It does not replace the whole clan system.

1. Run Element6-clan-tier-upgrade.sql in the Supabase SQL Editor.

2. In ClansScreen.jsx add these state declarations near the existing useState calls:

const [tierRewards, setTierRewards] = useState([]);
const [tierRewardClaims, setTierRewardClaims] = useState([]);
const [tierMilestonesReached, setTierMilestonesReached] = useState([]);

3. Add the loadTierProgressData() helper from ClansScreen-tier-section.jsx inside ClansScreen.

4. In refresh(), after loading the current clan, call:

await loadTierProgressData(mine.element6_clans.id);

5. Replace ONLY the existing top tier/milestone card inside the `view === 'mine'` section with the JSX in ClansScreen-tier-section.jsx.

The new panel shows:
- current tier
- current XP / next-tier XP
- lifetime total XP
- progress bar
- Tier 1–10 markers
- reward markers
- claimed/reached/locked states
- current tier highlight
- next reward
- Tier 10 final milestone

The SQL preserves the existing tier XP and progression behavior. Lifetime XP is backfilled from element6_clan_activity_events and then increases with every future clan XP award through the existing authoritative RPC.
