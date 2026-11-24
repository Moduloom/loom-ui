import {prefersReducedMotion} from '../utils/reducedMotion.js';

export type ThemeOrigin = { x: number; y: number };

let lastPointer: ThemeOrigin | undefined;
let pointerListening = false;
let paletteSwitchEpoch = 0;

export function rememberThemePointer() {
  if (pointerListening || typeof window === "undefined") return;
  pointerListening = true;
  window.addEventListener(
    "pointerdown",
    (event) => {
      lastPointer = { x: event.clientX, y: event.clientY };
    },
    true,
  );
}

function resolveOrigin(origin?: ThemeOrigin): ThemeOrigin {
  if (origin) return origin;
  if (lastPointer) return lastPointer;
  const el = document.activeElement;
  if (el instanceof HTMLElement) {
    const box = el.getBoundingClientRect();
    if (box.width || box.height) {
      return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
    }
  }
  return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
}

function revealRadius(x: number, y: number) {
  return Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
}

export function withInstantPalette(apply: () => void) {
  if (typeof document === "undefined") {
    apply();
    return;
  }
  const root = document.documentElement;
  paletteSwitchEpoch += 1;
  const epoch = paletteSwitchEpoch;
  root.classList.add("lui-palette-switching");
  apply();
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (epoch === paletteSwitchEpoch) root.classList.remove("lui-palette-switching");
    });
  });
}

export const THEME_REVEAL_MS = 560;
export const ACCENT_REVEAL_MS = 180;

export function revealPaletteChange(
  paint: () => void,
  origin?: ThemeOrigin,
  options?: { duration?: number },
): Promise<void> {
  if (typeof document === "undefined") {
    paint();
    return Promise.resolve();
  }
  rememberThemePointer();
  const reducedMotion = prefersReducedMotion();
  const start = document.startViewTransition?.bind(document);
  if (!start || reducedMotion) {
    paint();
    return Promise.resolve();
  }
  const duration = options?.duration ?? THEME_REVEAL_MS;
  const point = resolveOrigin(origin);
  const radius = revealRadius(point.x, point.y);
  const root = document.documentElement;
  root.dataset.luiThemeReveal = duration < 400 ? "fast" : "true";
  const transition = start(paint);
  void transition.ready
    .then(() => {
      root.animate(
        {
          clipPath: [
            `circle(0px at ${point.x}px ${point.y}px)`,
            `circle(${radius}px at ${point.x}px ${point.y}px)`,
          ],
        },
        {
          duration,
          easing: "cubic-bezier(0.22, 0.08, 0.16, 1)",
          pseudoElement: "::view-transition-new(root)",
        },
      );
    })
    .catch(() => undefined);
  return transition.finished.finally(() => {
    delete root.dataset.luiThemeReveal;
  });
}

