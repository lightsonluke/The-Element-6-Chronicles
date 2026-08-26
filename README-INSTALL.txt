ELEMENT 6 — SHOP, SOCIAL, AND ONLINE INPUT UPDATE

Install this as ONE replacement package. It contains only files that replace
matching files at the ROOT of your GitHub repository (plus rollback/).

1. In Supabase, open SQL Editor -> New query.
2. Open Supabase-username-everywhere.sql in this package.
3. Copy its CONTENTS (not its filename) into Supabase and press Run.
4. Unzip this package.
5. Open your GitHub repository -> Add file -> Upload files.
6. Upload EVERY .jsx/.js file from this package to the repository ROOT.
   Upload the rollback folder itself so rollback/rollbackSession.js replaces
   the matching file if GitHub asks.
7. Let GitHub replace files with the same names, then commit.
8. Wait for the GitHub Pages build to finish before testing.

What this package changes:
- A new eight-page shop: Featured, Accessories, Emotes, Shikigami, Profile,
  Battle Pass, Tokens, Support Element 6. No skin products are shown.
- Clear product prices, large RANDOM bundle cards, Battle Pass reward tracks,
  token packs, supporter packs, and Custom Content slots.
- Sports back navigation safety (prevents the Sports page back-button crash).
- Soccer, 1v1 Volleyball, and Dodgeball online use the existing real sport
  components. Each browser reads only its own keyboard/controller in online
  matches; remote player input comes through the match transport.
- Username updates synchronize to Supabase and the saved social/leaderboard
  display-name copies. New names are used in online locations after refresh.
- YouTube and Discord links in About the Game.
- Community Hub public-server browser, Random/Public/Private creation, and a
  visible current-server code. Private PRV servers never appear publicly.

Important payment note:
The storefront and checkout buttons are ready for product IDs, but taking
real card payments still requires your Stripe Checkout function/webhook to be
configured in Supabase. Until that is connected, the game correctly shows its
existing checkout-not-ready notice and does not grant paid items for free.

Do not upload the README or the SQL file to GitHub; run the SQL in Supabase.
