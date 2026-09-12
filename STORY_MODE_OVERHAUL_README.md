# Element 6 — Story Mode Overhaul

This package replaces the existing StoryMode survival/mining presentation with the requested five-Book story campaign structure while preserving the game's existing character rendering and battle engine.

## Files to replace/add

- Replace `StoryMode.jsx` with the package version.
- Replace `StorySaveSlots.jsx` with the package version if the app still uses the old save-slot component.
- Replace `StoryBattle.jsx` with the package version so story battles can force their assigned stage, story stock count, story timer, and narrative-loss result.
- `StoryBattle-3.jsx` is patched with the same stage/story-battle compatibility if that is the version currently imported by your app.
- Add `storyModeOverhaul.js`.
- Add `StoryCharacterSelect.jsx`.
- Add `StoryNewsreelCutscene.jsx`.
- Add `StorySettingsOverlay.jsx`.
- Add `StoryEpilogue.jsx`.

## What changed

### Save files
Three independent Story Mode save slots are presented first every time Story Mode opens. Occupied slots show the selected hero's existing in-game color, nickname/codename, and weighted completion percentage. Delete has confirmation.

Story saves are stored under `element6_story_slots_v2`. An older active Story progress object is automatically migrated into the first empty slot if no v2 slots exist.

### New save flow
Create -> character picker -> 19-second 1920s newsreel cold open -> Book I.

The character picker only enables heroes already present in `unlockedIds`. It attempts to group heroes using their existing generation metadata; it does not create or modify hero designs.

### Five Books
The campaign data in `storyModeOverhaul.js` contains Books I–V, their hubs, gimmicks, story beats, match encounters, stage assignments, and progression order from the supplied design document.

### Role substitution
The selected hero remains the actual playable model/moveset. A deterministic role assignment is calculated per Book from existing hero metadata and the supplied Anchor/Secondary/fallback rules. Canon-locked beats are explicitly marked and remain canon-specific.

### Exploration
Story exploration is now a 2D platforming presentation with:

- large floating, non-breakable platforms;
- biome-specific painted-style parallax layers;
- ambient particles;
- vertical/branch-like platform layouts;
- minimal exploration HUD;
- shard pickups;
- story beat nodes;
- match gates;
- a recurring bounty board.

The player's character is rendered through the existing `drawStickman`, `getCharRenderColor`, skin parts, and accessory systems. No replacement character artwork is introduced.

### Story matches
Story fights use the existing `StoryBattle` fighter engine. `StoryBattle.jsx` now honors an explicit story `stageId`, story stock count, story timer, and narrative-loss matches. This prevents a single-villain story encounter from silently reverting to the villain's default stage.

### Progress
The completion percentage uses the requested five buckets:

- 30% story beats/cutscenes
- 30% mainline match victories
- 20% non-villain/rival/trial wins
- 15% sidegrounds/collectibles
- 5% Book gimmick objectives

### Shards / Residue
Shards are rare story pickups. Bounty fights award Residue instead. The current implementation intentionally keeps Shards as whole-number progression currency rather than using the old story-mode coin economy.

## Important integration note

The uploaded files did not include the application's top-level component that owns the main `STORY MODE` button and routes into Story Mode. Therefore this package does not invent changes to an unseen parent component.

If your main app already renders `<StoryMode ... />` when the Story Mode button is clicked, replacing the files above is sufficient for the new StoryMode entry screen to take over.

If the main app separately renders `StorySaveSlots` before mounting `StoryMode`, either remove that duplicate outer save screen or route the Story Mode button directly to the new `StoryMode` component. The new `StoryMode` owns its own three-slot screen.

## Character-design guarantee

The overhaul does not redefine any hero appearance. Player rendering continues to consume the existing hero objects, color resolver, skin parts, accessories, and `drawStickman` renderer. Existing character IDs and movesets remain the source of truth.
