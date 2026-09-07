ELEMENT 6 — CLAN MILESTONE REWARD UPDATE

This patch adds shared clan milestone rewards on top of the clan match-XP system.

WHAT IT DOES
- Every clan member who was already in the clan when a milestone is reached becomes entitled to that reward.
- Rewards trigger at the halfway point of each tier and at tier completion.
- Rewards are not just tokens: milestones also award Shikigami and cosmetic accessories.
- The reward entitlement is stored server-side in Supabase so it is not tied to one player's browser.
- The root Game automatically syncs outstanding clan rewards after sign-in.
- Opening Clans also triggers a sync.
- A member can only receive each milestone once.
- A member who joins after a milestone was reached does not retroactively receive that old milestone.
- Token/cosmetic granting is idempotent for owned cosmetics.

REWARD EXAMPLES
- Half milestones: 3,000–10,000 tokens + a Shikigami/accessory.
- Full milestones: 7,000–25,000 tokens + a Shikigami/accessory.
- Tier 10 completion is the largest reward.

FILES
- Game.jsx
- ClansScreen.jsx
- Supabase-clans.sql

IMPORTANT
Run Supabase-clans.sql in the same Supabase project used by the game before testing online clan rewards.
The SQL uses RLS and security-definer RPCs for the entitlement/claim path rather than trusting a browser-written reward row.
