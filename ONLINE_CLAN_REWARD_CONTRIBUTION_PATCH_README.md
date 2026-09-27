# Element 6 — Requested Update Package

This package intentionally updates only the requested systems:

- Clan tier/mid-tier/end-tier reward token amounts are scaled by the member's XP contribution for that tier.
- Existing monthly clan tournament winner reward is contribution-scaled by the member's share of that clan's tournament-month XP.
- Volleyball canvas is hard-anchored to the viewport center.
- Mobile/tablet devices automatically display touch buttons on supported gameplay screens; the old manually enabled Mobile Mode remains separate.
- Sports use the active Fight Mode keybind actions (Signature/Power/Heavy/Super Move) rather than fixed comma/period/slash assumptions. Arrow/custom movement binds are normalized too.
- Stage Editor SELECT supports copy-then-click-to-paste at the clicked location and horizontal flip via `ROTATE ↔`.
- Global document scrolling is restored while fixed match canvases remain viewport locked.
- Custom-stage match input is sanitized at the boundary to prevent malformed saved stage geometry/motion from crashing a match.

Run `Supabase-clan-reward-contribution-tier.sql` in Supabase after the existing clan migrations.
