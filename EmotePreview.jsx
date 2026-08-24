import React, { useRef, useEffect } from 'react';
import { drawStickman } from './renderer.js';
import { getEmoteById } from './emotes.js';

// Preview canvas that shows a character performing an emote animation.
export default function EmotePreview({ emoteId, char, size = 64 }) {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current; if (!c || !char) return;
    const ctx = c.getContext('2d'); let f = 0; let r = true;
    const emote = getEmoteById(emoteId);
    if (!emote) return;
    const totalFrames = emote.duration + 30;
    const loop = () => {
      if (!r) return; f++;
      ctx.clearRect(0, 0, size, size);
      ctx.fillStyle = '#111128'; ctx.fillRect(0, 0, size, size);
      const cyclePos = (f % totalFrames) / totalFrames;
      const emoteData = { id: emoteId, progress: cyclePos, timer: 0, maxTimer: emote.duration };
      drawStickman(ctx, size / 2, size * 0.78, char.color, 1, f, 0.75, char.isSpirit, 'idle', char, null, false, null, emoteData);
      requestAnimationFrame(loop);
    };
    loop();
    return () => { r = false; };
  }, [emoteId, char, size]);
  return <canvas ref={ref} width={size} height={size} className="rounded-lg" />;
}