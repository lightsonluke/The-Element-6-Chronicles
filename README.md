# Element 6 quick update

Copy the files into the game project root, keeping folders and replacing matching files. This is a changed-files overlay, not the whole game. The supplied home backdrop and matching game favicon are included.

## Included

- Restores the supplied city background on the home menu without the extra translucent wash or ornamental lines.
- Reads cloud progress only for the currently authenticated account; signed-out play remains local.
- Adds local fight rules and player/CPU selection within the fighter counts the active fight engine supports.
- Adds configurable 8/16/32 entrant size, stocks, match timer, and CPU difficulty to offline Tournament.
- Keeps Grand Circuit's existing selectable human roster and its 32-entrant bracket.
- Adds host controls for Custom Room capacity (2–8), stocks, timer, starting damage, bot difficulty, and stage selection.
- Adds host-controlled stocks, timer, and starting damage to The Table; its existing 2–8 human rule and Honored Bot fill remain intact.
- Fixes recursive RLS evaluation on `element6_party_members` with a restricted security-definer membership helper and adds server-side room-setting validation.

Player counts remain constrained to what each current engine and server flow supports. LAN Play uses a two-device peer connection, sports modes expose their implemented formats, and party capacity remains eight; this update does not fake larger multiplayer support.

## SQL

Read `SQL/README.txt` and apply the two migrations after the existing party/Custom Room and Table setup scripts. No production build was run for this package.
