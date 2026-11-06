Run the SQL files in the included party/Custom Room/Table migration order. The newest additions are:

1. Supabase-custom-room-policy-and-settings-fix.sql — run last among party and Custom Room policies. Replaces recursive element6_party_members RLS and validates room settings.
2. Supabase-table-match-settings.sql — run after Table setup; installs the host-only Table match-settings RPC.

Supabase-custom-room-policy-and-settings-fix.sql expects the existing public.element6_party_members and public.online_custom_rooms tables. Supabase-table-match-settings.sql expects public.element6_table_tournaments.
