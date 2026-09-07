ELEMENT 6 - CLAN SOCIAL + MANAGEMENT FIX

Targeted package only. It does NOT replace the whole game.

FILES
- ClansScreen.jsx
- Supabase-clan-social-management-FIX.sql

UI / GAMEPLAY CHANGES
1. Clan applications can be approved/rejected by:
   - Leader
   - Lieutenant
   - Officer
2. Clan chat shows the sender's clan rank ABOVE their username.
3. Members tab added to the Clans screen.
4. Members tab shows every member's:
   - Username
   - Clan rank
   - Ranked ELO
   - Soccer ELO
   - Volleyball ELO
   - Dodgeball ELO
   - Personal clan XP contribution
5. Leader can:
   - Change member/officer/lieutenant ranks
   - Remove members
   - Transfer ownership
6. Lieutenant can:
   - Promote Member -> Officer only
   - Remove non-leader members
   - Schedule clan meetings
   - Review applications
7. Officer can review applications, but cannot manage member ranks, remove members, transfer ownership, or schedule meetings.

SUPABASE
Run Supabase-clan-social-management-FIX.sql after your existing clan SQL and the previous clan social/members/ELO migration.

The migration is designed to be rerunnable and keeps privileged changes behind authenticated RPCs.

PROVEN FOUNDER
- The included ClansScreen keeps the Proven Founder requirement at 50 wins + 15 hours playtime.
