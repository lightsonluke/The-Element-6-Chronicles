// Custom Backdrop — manages a user-uploaded backdrop image that replaces the
// procedural stage background (Split City, etc.) in all game modes.
// Singleton Image object, cached and reused across all canvases.
// Supports PNG, JPG, JPEG, GIF (animated), and WEBP.

let _image = null;
let _url = null;

// Load (or clear) the custom backdrop from a URL.
// Passing null/empty clears it; passing the same URL as before is a no-op.
export function setCustomBackdropUrl(url) {
  if (!url) { clearCustomBackdrop(); return; }
  if (url === _url && _image) return; // already loaded
  _url = url;
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = url;
  img.onload = () => { _image = img; };
  img.onerror = () => { _image = null; _url = null; };
  _image = img; // set immediately so drawImage can use it once loaded
}

// Returns the loaded Image if ready, or null if not set / not yet loaded / errored.
export function getCustomBackdropImage() {
  if (!_image) return null;
  if (!_image.complete || _image.naturalWidth === 0) return null;
  return _image;
}

// Remove the custom backdrop entirely — reverts to procedural stage backgrounds.
export function clearCustomBackdrop() {
  _image = null;
  _url = null;
}