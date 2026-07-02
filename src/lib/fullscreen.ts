// Fires the fullscreen request synchronously inside the click's user-gesture
// window, before Next's client-side navigation swaps the page content — the
// exam runner mounts already fullscreen, so no "enter full screen" prompt.
export function requestFullscreenOnNavigate() {
  const el = document.documentElement;
  if (!document.fullscreenElement && el.requestFullscreen) {
    el.requestFullscreen().catch(() => {});
  }
}
