ELEMENT 6 — WORLD SCORES + ADVANCED PLATFORM MOTION PATCH

Replace only the files in this package in the repository.

WORLD LEADERBOARDS
- Parkour, Ziplining, and Rock Climbing all submit their completed personal bests through submit_element6_world_score().
- The included SQL guarantees public.element6_world_scores exists with the three supported modes and installs the authoritative RPC.
- Parkour and Ziplining keep higher scores; Rock Climbing keeps lower completion times.
- Scores are tied to the authenticated Supabase user, so the browser does not choose another user's account.

IMPORTANT:
Run element6-world-scores-persistence.sql in the Supabase SQL Editor once. The React files alone cannot create the database RPC/table.

STAGE EDITOR PLATFORM MOTION
- Maximum platform motion distance increased from 500 to 1500 (3x).
- Added ONE-WAY motion.
- One-way motion supports 8 directions: left, right, up, down, and the four diagonals.
- A one-way platform travels to its destination and stays there instead of returning.
- Added optional SECOND MOTION to a platform.
- A platform can now combine two independent movement directions, such as horizontal + vertical, producing diagonal/compound movement.
- The second motion has its own type, direction, distance, and speed.
- Existing horizontal/vertical/static motion remains supported.
- Runtime movement and stage previews understand the new motion data.
