export async function toggleElementFullscreen(el) {
  try {
    if (document.fullscreenElement) { await document.exitFullscreen?.(); return false; }
    if (el?.requestFullscreen) { await el.requestFullscreen(); return true; }
  } catch {}
  return false;
}
