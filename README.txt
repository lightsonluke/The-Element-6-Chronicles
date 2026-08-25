ELEMENT 6 — OFFLINE SOCCER + VOLLEYBALL BOT FIX

This is a two-file replacement package. No Supabase SQL is needed.

1. Unzip this download.
2. Open your GitHub repository.
3. Upload BOTH files from this folder to the repository root:
   - SoccerMode.jsx
   - VolleyballGame.jsx
4. Choose “Replace” for each existing file, then commit the changes.
5. Wait for the GitHub Pages deployment to finish, then hard-refresh the game.

What changed:
- Offline Soccer no longer renders a blank screen while its opponent state is being created.
- Volleyball team bots bump normal returns 90% of the time.
- When a bot's teammate sets the ball, that bot still jumps and spikes it.

Nothing in this package changes Online Sports, Supabase, rankings, or multiplayer.
