const canvasStates = new WeakMap();
const BACKDROP_CLASS = 'el6-gameplay-backdrop';
const BACKDROP_RESOLUTION = 0.32;

function getLogicalSize(canvas) {
  const width = Number(canvas.dataset.e6LogicalWidth || canvas.getAttribute('width') || canvas.width) || 1280;
  const height = Number(canvas.dataset.e6LogicalHeight || canvas.getAttribute('height') || canvas.height) || 720;
  return { width, height };
}

function readTransform(args) {
  if (args.length === 1 && args[0] && typeof args[0] === 'object') {
    const m = args[0];
    return [m.a ?? 1, m.b ?? 0, m.c ?? 0, m.d ?? 1, m.e ?? 0, m.f ?? 0];
  }
  return [args[0] ?? 1, args[1] ?? 0, args[2] ?? 0, args[3] ?? 1, args[4] ?? 0, args[5] ?? 0];
}

function coverBackdrop(state) {
  if (!state.backdropCtx || !state.canvas.width || !state.canvas.height) return;
  const { canvas, backdrop, backdropCtx, viewport } = state;
  const sourceX = viewport.offsetX * viewport.dpr;
  const sourceY = viewport.offsetY * viewport.dpr;
  const sourceWidth = state.logical.width * viewport.scale * viewport.dpr;
  const sourceHeight = state.logical.height * viewport.scale * viewport.dpr;
  if (sourceWidth <= 0 || sourceHeight <= 0) return;

  const coverScale = Math.max(backdrop.width / sourceWidth, backdrop.height / sourceHeight);
  const drawWidth = sourceWidth * coverScale;
  const drawHeight = sourceHeight * coverScale;
  backdropCtx.setTransform(1, 0, 0, 1, 0, 0);
  backdropCtx.clearRect(0, 0, backdrop.width, backdrop.height);
  backdropCtx.fillStyle = '#06040f';
  backdropCtx.fillRect(0, 0, backdrop.width, backdrop.height);
  backdropCtx.drawImage(
    canvas,
    sourceX, sourceY, sourceWidth, sourceHeight,
    (backdrop.width - drawWidth) / 2,
    (backdrop.height - drawHeight) / 2,
    drawWidth, drawHeight,
  );
}

function scheduleBackdrop(state) {
  if (state.backdropScheduled || !state.backdropCtx) return;
  state.backdropScheduled = true;
  requestAnimationFrame(() => {
    state.backdropScheduled = false;
    if (!state.disposed) coverBackdrop(state);
  });
}

function setViewportTransform(state) {
  const { scale, offsetX, offsetY, dpr } = state.viewport;
  state.rawSetTransform(scale * dpr, 0, 0, scale * dpr, offsetX * dpr, offsetY * dpr);
}

function installCanvas(canvas) {
  if (!canvas || canvas.classList.contains(BACKDROP_CLASS)) return () => {};
  const prior = canvasStates.get(canvas);
  if (prior) {
    prior.references += 1;
    return () => releaseCanvas(canvas, prior);
  }

  const logical = getLogicalSize(canvas);
  canvas.dataset.e6LogicalWidth = String(logical.width);
  canvas.dataset.e6LogicalHeight = String(logical.height);
  const context = canvas.getContext('2d');
  if (!context) return () => {};

  const parent = canvas.parentElement;
  const backdrop = canvas.ownerDocument.createElement('canvas');
  backdrop.className = BACKDROP_CLASS;
  backdrop.setAttribute('aria-hidden', 'true');
  backdrop.tabIndex = -1;
  if (parent) parent.insertBefore(backdrop, canvas);

  const state = {
    canvas, context, parent, backdrop, backdropCtx: backdrop.getContext('2d'), logical,
    references: 1, disposed: false, backdropScheduled: false, viewport: null,
    savedStyle: canvas.getAttribute('style'),
    savedBackdrop: parent?.style.getPropertyValue('--el6-gameplay-backdrop') || '',
    savedBackdropPriority: parent?.style.getPropertyPriority('--el6-gameplay-backdrop') || '',
    savedWidth: canvas.getAttribute('width'), savedHeight: canvas.getAttribute('height'),
  };

  state.rawSetTransform = context.setTransform.bind(context);
  state.rawClearRect = context.clearRect.bind(context);
  state.originalMethods = { setTransform: context.setTransform, resetTransform: context.resetTransform, clearRect: context.clearRect };
  state.drawingMethods = {};
  for (const name of ['fill', 'stroke', 'fillRect', 'strokeRect', 'fillText', 'strokeText', 'drawImage', 'putImageData']) {
    if (typeof context[name] !== 'function') continue;
    const original = context[name];
    state.drawingMethods[name] = original;
    context[name] = function responsiveDrawMethod(...args) {
      const result = original.apply(this, args);
      scheduleBackdrop(state);
      return result;
    };
  }

  context.setTransform = function setLogicalTransform(...args) {
    if (!state.viewport) return state.rawSetTransform(...readTransform(args));
    const [a, b, c, d, e, f] = readTransform(args);
    const { scale, offsetX, offsetY, dpr } = state.viewport;
    return state.rawSetTransform(
      scale * dpr * a,
      scale * dpr * b,
      scale * dpr * c,
      scale * dpr * d,
      scale * dpr * e + offsetX * dpr,
      scale * dpr * f + offsetY * dpr,
    );
  };
  context.resetTransform = function resetLogicalTransform() {
    if (state.viewport) setViewportTransform(state);
    else state.rawSetTransform(1, 0, 0, 1, 0, 0);
  };
  context.clearRect = function clearLogicalFrame(x, y, width, height) {
    const fullLogicalClear = Number(x) === 0 && Number(y) === 0 &&
      Number(width) >= logical.width - 1 && Number(height) >= logical.height - 1;
    if (fullLogicalClear && state.viewport) {
      state.rawSetTransform(1, 0, 0, 1, 0, 0);
      const result = state.rawClearRect(0, 0, canvas.width, canvas.height);
      setViewportTransform(state);
      scheduleBackdrop(state);
      return result;
    }
    const result = state.rawClearRect(x, y, width, height);
    scheduleBackdrop(state);
    return result;
  };

  const computedBackground = getComputedStyle(canvas);
  const backgroundImage = computedBackground.backgroundImage;
  const backgroundColor = computedBackground.backgroundColor;
  canvas.style.setProperty('background', 'transparent', 'important');
  if (parent) {
    const originalBackground = backgroundImage !== 'none' ? backgroundImage :
      (backgroundColor !== 'rgba(0, 0, 0, 0)' ? backgroundColor : '');
    if (originalBackground) parent.style.setProperty('--el6-gameplay-backdrop', originalBackground);
  }

  const updateViewport = () => {
    if (state.disposed) return;
    const rect = canvas.getBoundingClientRect();
    const cssWidth = Math.max(1, rect.width || window.visualViewport?.width || window.innerWidth || logical.width);
    const cssHeight = Math.max(1, rect.height || window.visualViewport?.height || window.innerHeight || logical.height);
    const dpr = Math.max(1, Math.min(2, Number(window.devicePixelRatio) || 1));
    const backingWidth = Math.max(1, Math.round(cssWidth * dpr));
    const backingHeight = Math.max(1, Math.round(cssHeight * dpr));
    if (canvas.width !== backingWidth) canvas.width = backingWidth;
    if (canvas.height !== backingHeight) canvas.height = backingHeight;

    const scale = Math.min(cssWidth / logical.width, cssHeight / logical.height);
    const offsetX = (cssWidth - logical.width * scale) / 2;
    const offsetY = (cssHeight - logical.height * scale) / 2;
    const worldWidth = cssWidth / scale;
    const worldHeight = cssHeight / scale;
    state.viewport = {
      cssWidth, cssHeight, dpr, scale, offsetX, offsetY,
      worldWidth, worldHeight,
      worldLeft: (logical.width - worldWidth) / 2,
      worldTop: (logical.height - worldHeight) / 2,
      logicalWidth: logical.width,
      logicalHeight: logical.height,
      aspectRatio: cssWidth / cssHeight,
    };
    canvas.__e6Viewport = state.viewport;
    const backdropWidth = Math.max(1, Math.round(backingWidth * BACKDROP_RESOLUTION));
    const backdropHeight = Math.max(1, Math.round(backingHeight * BACKDROP_RESOLUTION));
    if (backdrop.width !== backdropWidth) backdrop.width = backdropWidth;
    if (backdrop.height !== backdropHeight) backdrop.height = backdropHeight;
    const rectForCoordinates = canvas.getBoundingClientRect();
    state.rawSetTransform(scale * dpr, 0, 0, scale * dpr, offsetX * dpr, offsetY * dpr);
    const toWorld = (clientX, clientY) => ({
      x: (clientX - rectForCoordinates.left - offsetX) / scale,
      y: (clientY - rectForCoordinates.top - offsetY) / scale,
    });
    const toClient = (x, y) => ({
      x: rectForCoordinates.left + offsetX + x * scale,
      y: rectForCoordinates.top + offsetY + y * scale,
    });
    state.viewport.clientToWorld = toWorld;
    state.viewport.worldToClient = toClient;
    state.viewport.visibleBounds = {
      left: state.viewport.worldLeft,
      top: state.viewport.worldTop,
      right: state.viewport.worldLeft + worldWidth,
      bottom: state.viewport.worldTop + worldHeight,
    };
    scheduleBackdrop(state);
  };

  state.updateViewport = updateViewport;
  state.resizeObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateViewport) : null;
  state.resizeObserver?.observe(canvas);
  state.onWindowResize = updateViewport;
  window.addEventListener('resize', updateViewport, { passive: true });
  window.visualViewport?.addEventListener('resize', updateViewport, { passive: true });
  window.addEventListener('orientationchange', updateViewport, { passive: true });
  updateViewport();
  canvasStates.set(canvas, state);
  return () => releaseCanvas(canvas, state);
}

function releaseCanvas(canvas, state) {
  if (!state || state.disposed) return;
  state.references -= 1;
  if (state.references > 0) return;
  state.disposed = true;
  state.resizeObserver?.disconnect();
  window.removeEventListener('resize', state.onWindowResize);
  window.visualViewport?.removeEventListener('resize', state.onWindowResize);
  window.removeEventListener('orientationchange', state.onWindowResize);
  const { context, originalMethods, drawingMethods, parent, backdrop } = state;
  context.setTransform = originalMethods.setTransform;
  context.resetTransform = originalMethods.resetTransform;
  context.clearRect = originalMethods.clearRect;
  Object.entries(drawingMethods).forEach(([name, original]) => { context[name] = original; });
  if (parent) {
    if (state.savedBackdrop) parent.style.setProperty('--el6-gameplay-backdrop', state.savedBackdrop, state.savedBackdropPriority);
    else parent.style.removeProperty('--el6-gameplay-backdrop');
  }
  if (state.savedStyle === null) canvas.removeAttribute('style');
  else canvas.setAttribute('style', state.savedStyle);
  if (state.savedWidth === null) canvas.removeAttribute('width');
  else canvas.setAttribute('width', state.savedWidth);
  if (state.savedHeight === null) canvas.removeAttribute('height');
  else canvas.setAttribute('height', state.savedHeight);
  delete canvas.__e6Viewport;
  delete canvas.dataset.e6LogicalWidth;
  delete canvas.dataset.e6LogicalHeight;
  backdrop.remove();
  canvasStates.delete(canvas);
}

/** Install responsive backing stores for every gameplay canvas in a shared host. */
export function observeResponsiveCanvasHost(host) {
  if (!host) return () => {};
  const releases = new Map();
  const sync = () => {
    const live = new Set([...host.querySelectorAll('canvas')].filter(canvas => !canvas.classList.contains(BACKDROP_CLASS)));
    for (const [canvas, release] of releases) {
      if (!live.has(canvas)) { release(); releases.delete(canvas); }
    }
    live.forEach(canvas => { if (!releases.has(canvas)) releases.set(canvas, installCanvas(canvas)); });
  };
  const observer = typeof MutationObserver !== 'undefined' ? new MutationObserver(sync) : null;
  observer?.observe(host, { childList: true, subtree: true });
  sync();
  return () => {
    observer?.disconnect();
    releases.forEach(release => release());
    releases.clear();
  };
}

/** Install the responsive transform for a gameplay canvas outside the shared host. */
export function observeResponsiveCanvas(canvas) {
  return installCanvas(canvas);
}
