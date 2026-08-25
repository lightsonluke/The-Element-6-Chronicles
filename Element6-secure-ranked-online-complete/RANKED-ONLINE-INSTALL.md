# Ranked + unranked online installation

## 1. Run the database setup

1. Open Supabase.
2. Open **SQL Editor** and choose **New query**.
3. Open `Supabase-ranked-online-setup.sql` from this package.
4. Copy the file's **entire contents** into the query box. Do not type only the
   filename.
5. Press **Run** once. The script is safe to run again if necessary.

This creates the global queue, online matches, protected ratings, result
reports, security rules, Realtime support, and all required RPC functions.

## 2. Upload the replacement files

Upload the contents of this ZIP to the repository root. Allow GitHub to replace
files with the same names. Keep the `rollback` folder as a folder.

## 3. Test with two accounts

1. Wait for GitHub Actions to finish successfully.
2. Open the deployed game normally and sign into account A.
3. Open a private/incognito window and sign into a different account B.
4. Choose the same mode: **Online Ranked** or **Online Unranked**.
5. Pick characters and search on both accounts.
6. Play a complete match. Press `F3` to show rollback diagnostics.

For a normal ranked finish, both clients submit the same confirmed frame and
checksum. Supabase changes ELO only when both reports match. A player who uses
the Forfeit button receives a server-side loss. Unranked never changes ELO.

This prevents one ordinary browser from awarding itself rating. Fully
tamper-proof competitive play would still require an authoritative game server
or server-side replay validation; two modified clients could theoretically
collude. That is a later production-hardening step.

