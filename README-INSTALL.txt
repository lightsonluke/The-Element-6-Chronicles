ELEMENT 6 — PAID TAB + VOLLEYBALL 2v2 UPDATE

This package restores the normal shop. Every regular shop tab remains exactly
as it was: accessories, characters, emotes, etc. still use Tokens.

ONLY the existing PAID tab changes. It receives the new paid-pack list. No new
shop navigation, category pages, or changes to Token purchasing are included.

INSTALL
1. Unzip this package.
2. In GitHub, upload the .jsx and .js files to your repository ROOT.
3. Upload the files inside rollback/ into your repository's rollback/ folder.
4. Let GitHub replace matching files, commit, and wait for deployment.

DO NOT upload BaseBallGame.jsx (it is not needed). No SQL query is needed for
this update if your online-sports SQL was already run.

VOLLEYBALL 2v2
- Uses the actual offline VolleyballGame court, physics, player rendering,
  scoring, ball, and rules instead of a generic online canvas.
- Four queued players map to four individual players: slots 0/2 are Team 1;
  slots 1/3 are Team 2.
- Every browser sends input only for its own slot. Keyboard custom bindings,
  WASD/arrow configurations, and controller slot 0 control only that one
  selected character. Other players' input comes from the network.
- Host checkpoints are exported to every player, so every screen is drawn from
  the same confirmed state. The existing rollback transport files remain in
  the package for the sports matchmaking/checksum layer.

OFFLINE BOTS
- Volleyball and Baseball already accept any valid roster character internally.
- SportsShell now draws CPU opponents/teammates from the full roster.
- Banger CPU teams and 2v2 Team Battle CPU slots can use locked characters;
  this never affects the local player's own unlocks.

PAYMENTS
The Paid tab only lists the products. Real purchases still require your Stripe
Checkout/webhook to be configured before money can be charged or items granted.
