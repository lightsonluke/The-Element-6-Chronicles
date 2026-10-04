Water Fluid FIXED — runtime crash fix

This is a minimal correction of the previous Water_Fire_Restored_Water_Fluid_FIXED_BUILD_SAFE package.

Fixes:
- Corrected a runtime typo in getGen1AttackPose: wease(...) -> ease(...).
- Restored the legacy Fire Super burst helper used by the restored Fire animation.
- No Water animation redesign.
- No Fire animation redesign.
- No renderer/camera changes.

Replace only:
- gen1AttackAnims.js
- fighter.js
- attackSpecs.js
