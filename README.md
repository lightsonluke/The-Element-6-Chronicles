# Element 6 feature package

This package is built against the current Element 6 project.

## Replace these project files

- `clipRecorder.js`
- `GlobalClipRecorder.jsx`
- `useClipRecorder.js`
- `StageEditor.jsx`
- `cosmetics.js`
- `Shop.jsx`
- `EquipScreen.jsx`
- `ClansScreen.jsx`
- `Game.jsx`
- `DailyQuests.jsx`
- `dailyQuests.js`
- `TeamMode.jsx`
- `StoryMode.jsx`
- `StoryBattle.jsx`
- `package.json`

## Run the clan-logo SQL

Run `Supabase-clan-logos-and-badges.sql` in the Supabase SQL editor after the existing clan SQL.

It creates the public `clan-logos` storage bucket and scoped authenticated upload/update/delete policies.

## Features in this package

1. Stage Editor FREEHAND tool with material selection and adjustable brush diameter. Freehand strokes are stored and converted into collision segments when saved, so they work in existing match consumers.
2. Modern clothing/accessory catalog: hoodies, tees, shorts, pants, jeans, caps, berets, cardigans, bracelets, necklaces, jackets, beanies, sweatpants, vests, watches, rings, bucket hats and tote bags. Each has black, white, character-main and character-accent variants.
3. Working Supabase clan logo upload + public display + dynamic `Clan Badge` accessory tied to the player's current clan.
4. Always-on 60 FPS rolling clip recording. MP4/H.264 conversion only happens when a clip is saved, with overlapping windows and previous-match windows preserved for Victory/Match Facts.
5. Controller support expanded to menu navigation, Story mode, Story battles and Team mode in addition to the game's existing controller-enabled modes. Bluetooth/wired controllers are discovered through the browser Gamepad API.
6. Account/cloud hydration is now Supabase-only. Anonymous/tab-local progress is prevented from overwriting an account during sign-in; account progress wins when it exists, and user-scoped local progress is maintained.
7. Daily quests are GOLD → SILVER → BRONZE, reset on the local calendar date at midnight, and chest rewards auto-close after about one second without an OK button.

## Important

The clip recorder uses the browser FFmpeg package at runtime for H.264 MP4 conversion. `package.json` therefore includes `@ffmpeg/ffmpeg`, `@ffmpeg/core`, and `@ffmpeg/util`. The existing GitHub Actions workflow uses `pnpm install --no-frozen-lockfile`, so it can resolve these dependencies automatically.
