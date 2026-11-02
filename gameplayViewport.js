let activeViewportLeases = 0;

/** Lock the document to the gameplay viewport until all live renderers unmount. */
export function acquireGameplayViewport() {
  if (typeof document === 'undefined' || !document.documentElement || !document.body) return () => {};
  activeViewportLeases += 1;
  document.documentElement.classList.add('el6-gameplay-active');
  document.body.classList.add('el6-gameplay-active');

  let released = false;
  return () => {
    if (released) return;
    released = true;
    activeViewportLeases = Math.max(0, activeViewportLeases - 1);
    if (activeViewportLeases === 0) {
      document.documentElement.classList.remove('el6-gameplay-active');
      document.body.classList.remove('el6-gameplay-active');
    }
  };
}
