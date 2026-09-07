ELEMENT 6 — CLAN MATCH XP FIX

This targeted patch fixes clan tier XP so completed matches actually contribute to the clan's shared XP.

Wired completion paths:
- Offline Regular Battle
- Bot Ranked
- Time Battle
- Online Ranked
- Online Unranked
- Offline Soccer / Volleyball / Dodgeball
- Online Soccer / Volleyball / Dodgeball
- Online Banger
- Battle Royale

Important behavior:
- XP is awarded only after a match is completed, not when matchmaking starts.
- A clan match has a stable match ID whenever the mode provides one.
- Supabase de-duplicates the same completed match at the clan level, so if two members of the same clan play each other, the clan does NOT receive double XP for that one match.
- A member outside a clan gets no clan XP.
- The existing clan tier age requirements remain in place.

Run the included Supabase-clans.sql migration/update in the same Supabase project. The SQL changes the clan activity uniqueness rule so one completed match contributes once per clan.
