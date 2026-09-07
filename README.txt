ELEMENT 6 TARGETED PACKAGE
===========================

Included:
- HeroCodex.jsx
- MeetCharacters.jsx
- characterLore.js
- ClipsScreen.jsx
- clipStorage.js

Lore:
- Uses the supplied canonical character-lore source.
- Section headings/titles are not shown as character lore.
- Hero Codex and Meet the Characters both resolve lore through characterLore.js.
- Magneto and Willow keep the supplied "not enough documented history" wording rather than inventing canon.

Clips:
- ClipsScreen now tolerates a missing/empty clips prop and can recover saved clip metadata directly from IndexedDB.
- Delete callbacks are optional and local UI state is updated immediately.
- Existing native IndexedDB storage is preserved.

QUESTS:
The daily/fight quest source files were NOT present in the uploaded code files, and I could not locate the actual Element 6 quest implementation in the accessible saved project files. I intentionally did NOT fabricate a quest patch that would pretend to register events for RegularBattle, bot ranked, Time Battle, Ranked, and Unranked without seeing those event handlers.

To make the quest portion safely, the next package needs the files that actually:
- define daily/fight quest definitions
- track quest progress
- receive match/combat/movement/emote events
- initialize each game mode

Requested quest design for that patch:
- harder objectives such as 5 signature KOs
- 5 Ground Pound KOs
- Emote-before-moving 5 times in a match
- a mix of hard, medium, and occasional easier objectives
- non-attack objectives too: movement, emotes, survival, jumps, dodges, etc.
- registration must work in offline RegularBattle, bot ranked, Time Battle, Ranked, and Unranked
- completion should be based on actual authoritative gameplay events, not UI-only counters
