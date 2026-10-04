Water + Fire Gen-I restore / attack-physics correction

- Restores Fire Hero attack visuals and smooth Super from Fire_Hero_All_Attacks_Optimized_Smooth_Super.
- Keeps Water Hero native flowing-water animations and directional limb poses.
- Water and Fire reference release timing: 4-beat moves 42 ticks, 6-beat Down Heavy 63 ticks, 7-beat Super 74 ticks.
- Water Down Heavy supports two phase-specific hits.
- Hitboxes are authored to the visible effect paths, not generic rectangles.
- Knockback profiles follow the visual attack direction.
- Gen-I charge/hold remains the established 180-frame (3 second) window because the supplied frame sheets specify release beats, not charge duration.
- No renderer/camera replacement.
