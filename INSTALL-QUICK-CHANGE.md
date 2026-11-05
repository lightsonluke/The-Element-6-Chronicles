# The Chronicles quick change bundle

This is a patch, not a full game archive. Copy each file into the same relative path in the game source. The included public/favicon.png is the supplied logo; public/assets/e6-home-menu-background.png is the menu background referenced by MainMenu.jsx. Emoji defaults and the old gift notification glyph were removed. The character-select component retains its Match Settings control.

## Supabase setup

The new account-save and transfer scripts depend on the existing user_progress, player_profiles, player_friend_requests, player_direct_messages, and element6_trade_gifts tables. If those tables are not already installed, apply the project's existing Supabase-account-progress-FIX.sql, Supabase-social-setup.sql, Supabase-community-chat-setup.sql, and Supabase-element6-online-social-room-clan-fixes.sql first. Then run:

1. Supabase-Element6-Account-Save-Safety.sql
2. Supabase-Element6-Transfer-Safety.sql

Gifts and trades remain pending until accepted. Don't deploy the frontend transfer changes without applying the transfer migration.

## Scope and remaining work

This patch updates the supplied logo/title, menu entry points and controller navigation, screen transition timing, Baseball's active selections/routes and clan-match XP allowlist, transfer flows, and stale cloud-save handling. It includes six designed 2027 Battle Pass season banner images and maps those titles to the banner assets in EventsScreen.jsx.

The 2027 season calendar and exact 50-tier rewards, holiday reward tracks, server-authoritative event claims and title ownership/display are not wired into the existing generated events.js system yet. Authentication, cross-device saves, and trade/gift flows also need live multi-account Supabase verification after the migrations are applied.

Build verification could not run in the provided environment because dependencies were absent and the package registry could not be reached.
