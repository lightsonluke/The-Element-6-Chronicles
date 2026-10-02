ELEMENT 6 — FOCUSED REPLACEMENT PACKAGE

Replace the included files at the repository root. Run Supabase-Element6-focused-fixes.sql in the Supabase SQL editor after the existing World Stages and clan tournament migrations.

Changes: volleyball canvas is centered relative to its fixed host; World Stages adds authenticated persistent likes and deduplicates repeated stage rows; the existing StageEditor auto-publish flow is included unchanged for new creator-made stages; soccer AI no longer randomly reverses movement during attacks; the monthly Top 100 UI filters out repeated clan rows and stale months; badge data images are uploaded to the clan-logos Storage bucket before the URL is saved via the existing RPC.

Important: SQL migrations are required for persistent likes and Storage permissions. Badge uploads require the existing element6_update_clan_badge(text) RPC from Supabase-clan-tournaments-badge-FIX.sql. This package does not include secrets or dependencies.
