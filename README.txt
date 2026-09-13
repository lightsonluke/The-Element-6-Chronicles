ELEMENT 6 — CLOTHING LIMB CONNECTIONS + CLIP SAVE + CLAN BADGE FIX

Replace these files in the CURRENT project:
- clipRecorder.js
- cosmetics.js
- Shop.jsx
- ClansScreen.jsx
- Game.jsx
- package.json
- pnpm-lock.yaml

What this fixes:

1) Clothing limb connections
- Hoodies, cardigans, jackets and tees now draw sleeves from the actual animated shoulder positions and rotate with armAngleL/armAngleR.
- Hoodies, cardigans and jackets extend slightly beyond the animated arm length.
- Vests, pants, jeans, shorts and sweatpants are also attached to the animated body/leg pose.
- Caps, berets, beanies, bucket hats, bracelets, watches and necklaces are included.
- Colorways include black, white, character main color and character accent color.

2) Clan Badge
- Adds a FREE "Clan Badge" accessory and puts it at the top of the accessory shop list.
- The badge uses the player's current clan icon on the chest.
- Clan logo is cached globally so the badge works outside the Clans screen.
- Clan upload validation now accepts normal PNG/JPG/WEBP/GIF images from 16x16 through 1024x1024, up to 2 MB. The old 1x1 restriction is removed.

3) Clips
- Keeps the game canvas recorder continuously active at 60 FPS.
- Finished 30-second windows are stored as raw recording data first; they are NOT sent through FFmpeg automatically when a window expires.
- FFmpeg only runs when the player actually saves a clip.
- New recording windows start immediately after a window finishes.
- Save conversion no longer blocks recording.
- Uses the bundled @ffmpeg/ffmpeg browser API and @ffmpeg/util instead of injecting the broken UMD runtime script.
- MP4 output is H.264/yuv420p/faststart for normal editor compatibility.

IMPORTANT:
- The project must install the new package dependencies from package.json/pnpm-lock.yaml before building.
- FFmpeg core is loaded at clip-save time from jsDelivr using toBlobURL; the recorder itself does not depend on FFmpeg to keep recording.
- This package does NOT use browser screen capture/getDisplayMedia().
