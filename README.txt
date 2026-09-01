ELEMENT 6 — ALL ITEM / HAZARD INTERACTION PATCH

Replace the matching files at the repository root.

CHANGES
- All Stage Editor items now use the shared hazard-interaction system.
- The Ball item is included in the same system; it is no longer treated as a special-case object.
- Items can interact with fire, electric zones, moving hazards, water, portals, catapults, and wind.
- Stage-material hazards such as lava, acid, tar, water, quicksand, and snow also affect items.
- Catapults apply their configured launch direction to items that enter them.
- Existing platform/object physics remains in place.

No database migration is required for this patch.
