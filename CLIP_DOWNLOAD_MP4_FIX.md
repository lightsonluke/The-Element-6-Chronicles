# Clip download MP4 fix

- Recording remains native WebM.
- Saved clips remain WebM in IndexedDB.
- The Clips tab previews the saved WebM directly.
- Clicking SAVE MP4 starts FFmpeg conversion at download time.
- The button shows CONVERTING while FFmpeg runs.
- The downloaded file is a real `video/mp4` Blob, not a renamed WebM.
- If conversion fails, no fake `.mp4` is downloaded; the WebM remains stored so the player can retry.
- No stage, camera, bot, gameplay, or recording-capture behavior is changed by this package.
