# Power abilities (77) — implemented

One authored ability per character, driven by `mvPower.js`. "2nd press" = a second power-button press (or hold) changes the outcome.

| Character | Ability | 2nd press | Cooldown | What it does |
|---|---|---|---|---|
| g1_thunder | Lightning Relay | yes | 8.0s | mark → optional dash along it; opponent touching the mark triggers a small hit and removes it |
| g1_fire | Phoenix Kickback | no | 9.0s | diagonal flame kick; hit = impact, miss = brief slower fall |
| g1_water | Tide Surf | no | 8.0s | moving water platform you can ride, angle down, or jump off |
| g1_grass | Seedling Spring | no | 9.0s | seed → plant (launches you, or tosses an opponent standing on it) |
| g1_ice | Glacier Skate | no | 9.0s | frozen strip → fast slide; opponents on it slide but keep steering |
| g2_renji | Iron Anchor | yes | 9.0s | Throws an anchor on a chain; if it hits a solid surface he reels himself in, press again to retract it (the returning anchor can hit one opponent). Chain breaks if he is hit; cannot attach to players. |
| g2_kaito | Ember Afterimage | no | 8.0s | dash leaves a flame silhouette that repeats the slash 0.5 s later |
| g2_hana | Water Mirror | yes | 7.0s | reflects ONE projectile at a shallow angle; otherwise a second press bursts it forward as a wave |
| g2_daigo | Faultline Step | no | 9.0s | crack races along connected ground; at an edge it rises into a stone step; passing under a foe bumps them |
| g2_suzu | Wind Thread | yes | 9.0s | Fires a wind ribbon; if it attaches to a wall/platform, press again to zip to the point. A miss disperses; one attempt per cooldown. |
| g2_mai | Shadow Swap | yes | 7.0s | Leaves a shadow and dashes; press again within 2 s to swap with it. Striking the shadow cancels the swap; cannot be placed offstage. |
| g2_osamu | Echo Return | no | 7.0s | pulse out (reveals), pulse back (ring interrupts ONE projectile or weak attack) |
| g2_yui | Starlight Beacon | yes | 8.0s | beacon shields nearby allies; second press: dash to it and give a final pulse |
| g2_ibuki | Hollow Exchange | yes | 8.0s | two orbs; second press swaps with the far one; bursts can heal Ibuki (capped, once) |
| g2_nishikawa | Marionette Line | yes | 9.0s | Thread attaches to the first surface; swing on it (rope-constrained) or press again to pull in. Touching a foe tugs them sideways. Breaks on a strong hit, limited duration. |
| g2_itto | Severing Dash | no | 10.0s | visible still draw pose, then ONE dash-cut through a single opponent or projectile |
| g2_twinfoxes | Foxfire Relay | yes | 8.0s | orb out; second press swaps with the visible orb location, orb bursts once |
| g2_utsuro | Fragment Harvest | no | 8.0s | slow fragment steals a strict-capped bit of super charge from a foe; a wall gives much less |
| g3_takeshi | Sand Serpent | no | 9.0s | moving sand ridge you can ride; bursts into a serpent column at its end; never carries you offstage |
| g3_aiko | Bone Scaffold | yes | 8.0s | temporary bone platform; second press shatters it into a forward fan of fragments |
| g3_haru | Prism Split | no | 7.0s | prism splits Haru's NEXT projectile into two weaker ones (up / down) |
| g3_chiyo | Venom Molt | yes | 9.0s | shell poisons anyone touching it for 1.5 s; second press detonates it early |
| g3_emi | Blood Thread | yes | 8.0s | Blood tether: a surface hit pulls Emi to it; an opponent hit takes a little damage and Emi is pulled a short way toward them (nobody is dragged). One use per tether. |
| g3_nozomi | Thorn Vault | yes | 8.0s | vine at feet + diagonal vault; in the air, a second press curls the vine to the nearest platform edge as ONE landing point |
| g3_masaru | Ash Rebirth | no | 8.0s | ash slide (no invincibility) → reform with a small upward burst; hit while sliding = forced early reform |
| g3_ryo | Mist Double | yes | 7.0s | Leaves a mist copy and dashes; press again within 2 s to return to it (never farther than the dash). Copy vanishes if struck. |
| g3_souta | Cinder Rocket | no | 9.0s | diagonal rocket in the held direction; a wall redirects you DOWN (no bounce chains, no jump reset) |
| g3_ogata | Extraction Harpoon | yes | 9.0s | Harpoon attaches to a surface; press again to reel in. Hitting an opponent staggers them, then retracts without dragging. |
| g3_kanenobu | Golden Standard | yes | 9.0s | Plants a golden standard (grounded only); press again within its radius to flash back to it. Returning gives no invulnerability. |
| g4_cobalt | Launch Barrier | yes | 9.0s | visual-only for 1 s, then launches forward as a pushing wall (never traps against a boundary) |
| g4_cyan | Cyclone Rail | yes | 9.0s | curved wind stream: ride it, then press again to burst out in the held direction |
| g4_onyx | Shadow Route | yes | 8.0s | throw a marker onto the nearest surface ahead; second press travels along a shadow route to it |
| g4_gold | Radiant Relay | no | 8.0s | light orb bounces ONCE; reaching an ally shields them; returning to Gold boosts his next jump (solo: small shield instead) |
| g4_vermilion | Flame Circuit | no | 9.0s | arc of fire; ignites after 0.6 s and launches him forward — an opponent touching the arc makes it flare early |
| g4_umber | Seismic Listening | yes | 8.0s | crouch + outline grounded foes; second press: a small upward tremor under ONE marked position (visible warning first) |
| g4_graphite | Resonance Skate | yes | 8.0s | vibrating rail you ride; jump off any time, or collapse it into a sonic burst behind you |
| g4_daichi | Magnetic Reversal | yes | 8.0s | disc sticks to a wall/platform, polarity flips at 0.5 s: pull toward it, then push away |
| g4_renko | Crimson Ring | yes | 8.0s | ring drifts forward; jump through it for a speed burst + a second jump-like impulse (once); second press collapses it into a short-range strike |
| yellow | Enhance | no | 10.0s | exactly 3 s, no second press, no refresh |
| blue | Tide Wheel | yes | 9.0s | wheel rolls along the ground, pushes foes, can be ridden; second press freezes it into an ice platform |
| purple | Smoke Ascent | no | 10.0s | dissolve, reappear 0.6 s later ~4.5 heights higher; cannot attack in between, cannot leave the stage |
| orange | Portal Skip | yes | 8.0s | portal flies diagonally up and hangs 3 s; second press teleports to it (cancelled if hit during the wind-up) |
| green | Mountain Step | yes | 9.0s | raise a slab (0.5 s), hop on it, or press again to tilt + slide it; breaks after 3 s or a heavy hit |
| pink | Psychic Orbit | yes | 8.0s | up to 3 debris orbit 4 s; power again throws them; JUMP sends them straight down and cushions the landing |
| grey | Fortress Fold | yes | 9.0s | two angled walls form a V; step inside and fold them inward to launch forward — foes caught between are pushed OUT |
| turquoise | Predator Morph | yes | 10.0s | 2.5 s beast form: faster, clings to walls (drains the form), leaps away; second press ends it with ONE claw swipe |
| olive | Giant's Reach | yes | 9.0s | Enlarged arm grabs a platform edge and pulls him in; press again to release into a forward swing. At close range it swats an opponent instead. |
| copper | Borrowed Second | yes | 8.0s | Marks a clock at his position; he moves normally for 1.2 s, press again to return there. Does not undo damage; hard control interrupts the return. |
| emerald | Phase Stitch | no | 8.0s | phase through ONE nearby surface (fails safely if too thick / blocked); route outline shows 0.3 s first |
| pearl | Sonar Bounce | no | 8.0s | arrow bounces off the nearest surface ONCE; each impact pings & reveals foes; the second impact is a small shockwave |
| red | Inferno Uppercut | no | 9.0s | upward spinning slash; a hit lifts Red, a miss fizzles with recovery; never resets jumps |
| lavender | Solid-Air Staircase | no | 0.5s | two short-lived air steps; a new pair needs the old one gone and (in the air) is limited per airtime |
| amber | Legion Switch | yes | 7.0s | Leaves a damage-less clone and dashes; press again within 2 s to swap with it. Clone is visible and destructible. |
| black | Thunder Rod | yes | 9.0s | rod sticks to a platform; 0.7 s later lightning strikes it; before that you may dash to it ONCE |
| magenta | Glue Swing | yes | 9.0s | Glue glob: a surface hit makes a stretchy strand to swing on (1.5 s, jump/attack/press releases); an opponent hit is slowed, not immobilised. |
| indigo | Gravity Sling | no | 9.0s | orb bends nearby movement for 1 s; JUMP to sling around it (launch set by your position) — never auto-drags anyone offstage |
| maroon | Energy Capacitor | yes | 8.0s | HOLD to charge (slows you) and release to fire forward; pressing again while charging fires DOWN with a small upward recoil |
| crimson | Element 6 Rift | no | 7.0s | rift in front: Crimson's NEXT energy attack enters it and exits a second opening at a different angle |
| scarlet | Spectral Hand | yes | 8.0s | hand rises from below a nearby platform after a clear warning; a second press redirects it to another point |
| white | Featherfall Glide | no | 9.0s | angle down to speed up, up to slow the fall — no extra jumps, no invulnerability, never gains altitude; jump ends it with a burst |
| silver | Living Alloy | yes | 9.0s | metallic anchor ≤1 s (resists knockback, can't walk); second press releases a short forward slide |
| corpent | Venom King's Gambit | yes | 10.0s | Throws two venom daggers that land on the ground; press again and a spectral cobra surges between them, leaving a poison path (capped damage) — foes can jump it, Corpent crosses safely. |
| magneto | Iron Orbit | yes | 9.0s | 6 fragments orbit; deflect up to 3 small projectiles (not melee); power again launches the rest forward |
| willow | Heartwood Reclamation | yes | 10.0s | seed → root (clear growth warning); power again: roots erupt in a fan + a brief raised platform (cannot seal anyone in) |
| cable | Circuit Hijack | yes | 8.0s | node redirects the next eligible projectile back toward its sender; second press detonates it instead; destructible |
| snodvor | Permafrost Lock | yes | 9.0s | shard makes a frost patch (foes slide but steer); power again → short ice pillar, no stun-lock |
| kirsten | Phoenix Brand | yes | 9.0s | flame bird leaves a brand on the surface it reaches; second press sweeps a phoenix flame across the brand (no tracking, once per target) |
| volt | Harmonic Break | yes | 8.0s | three expanding rings; power again collapses them into one concentrated burst; each foe can take damage only once per use |
| temple | Ruin Reversal | yes | 9.0s | broken stone arch: brief cover (blocks projectiles, never traps); power again shatters it into a forward fan |
| nightmare | Dream Fracture | yes | 9.0s | two silhouettes (one real, with a clear cue); power again sends the real one through with ONE shadow slash |
| hazel | Webline Slingshot | yes | 9.0s | web between two valid surfaces: jump to sling forward along it; power again snaps it into a fan of sticky strands |
| whami | Elixir Overdrive | yes | 10.0s | exactly 3 s of one fixed boost (no stacking); power again splashes the remaining elixir and ends the buff |
| controller | Puppet Dominion | yes | 8.0s | three strings tug foes (never full control); power again snaps them into a converging strike |
| evil | Void Singularity | yes | 10.0s | sphere gently pulls foes (never offstage, no repeated ticks); power again collapses it after a visible 0.3 s warning |
| life | Worldroot Recall | yes | 10.0s | seed → roots make a platform; power again calls them back in a bloom that shoves foes away and shields nearby allies |
| death | The Final Interval | yes | 10.0s | grey sphere slowly draws foes in; power again collapses it into a ring of silence that cancels WEAK attacks and pushes away (heavies still work) |
| mercy | Equilibrium Bloom | yes | 10.0s | floating ring protects allies inside; power again collapses it into a balanced wave (no invulnerability, no stacking) |
