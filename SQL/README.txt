Apply Supabase-custom-room-policy-and-settings-fix.sql after the existing party and Custom Room SQL setup. It replaces the self-referencing element6_party_members RLS policies that cause the infinite-recursion error, and adds server-side validation for Custom Room settings.

Apply Supabase-table-match-settings.sql after the Table setup migrations. It adds the host-only Table match-settings RPC used by TheTableLobby.

The SQL scripts expect the existing Element 6 party, online_custom_rooms, and Table tables. They are migrations for an existing installation, not standalone schema setup.
