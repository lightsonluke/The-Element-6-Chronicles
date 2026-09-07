Element 6 Chronicles — Custom Rooms Auth Fix v1

ONLY replacement:
- CustomRoomLobby.jsx

Fix:
- Custom Rooms now reads the real signed-in Supabase user instead of relying on the localBackend auth profile.
- Waits for/updates from Supabase auth state changes so a valid session is not incorrectly shown as "Not signed in".
- Keeps the existing localBackend fallback for offline/local profiles.
- No other gameplay mode, matchmaking mode, SQL file, or component is included or changed.

Install:
Replace the project's CustomRoomLobby.jsx with the included file.
