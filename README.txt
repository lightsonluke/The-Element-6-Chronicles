ELEMENT 6 — STAGE EDITOR + GLOBAL WORLD STAGES FIX

Replace the matching files in the Element 6 project:

- StageEditor.jsx
- WorldStages.jsx (new)

Run world-stages.sql once in the same Supabase project used by Element 6.

FIXES
- Fixes the Stage Editor SEE STAGES flow by supplying the missing/working WorldStages component.
- SEE STAGES now has MY STAGES and WORLD STAGES.
- WORLD STAGES loads public stages globally instead of filtering by the current creator.
- Supports global search by stage name, creator, and description.
- Supports newest, most played, most liked, and name sorting.
- Paginates the global list so browsing remains usable with many stages.
- PLAY / IMPORT and SAVE preserve the complete stored stage_data instead of dropping fields such as KO perimeter or future stage properties.
- Defensive filtering prevents private/hidden stages from being shown.
- If the entity filter call is unavailable, World Stages falls back to the entity list call and applies the public filter client-side.

DATABASE
world-stages.sql creates/updates public.community_stages and its RLS policies.
Public stages are readable by authenticated users when is_private=false and hidden=false.
Creators can insert/update/delete their own stages.

NOTE
The app's existing cloudCommunity.js entity named UploadedStage is expected to map to the community_stages data used by the existing Stage Editor save code.
