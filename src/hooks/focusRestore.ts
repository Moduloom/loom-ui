const tooltipFocusSuppression = new WeakSet<HTMLElement>();
const restoredFocusCleanup = new WeakMap<HTMLElement, () => void>();

export function isTooltipFocusSuppressed(target: HTMLElement): boolean {
  return tooltipFocusSuppression.has(target);
}

export function restoreFocusWithoutTooltip(target: HTMLElement | null | undefined): void {
  if (!target?.isConnected) return;
  restoredFocusCleanup.get(target)?.();
  tooltipFocusSuppression.add(target);
  target.dataset.luiRestoredFocus = "true";
  const clearRestoredFocus = () => {
    target.removeAttribute("data-lui-restored-focus");
    target.removeEventListener("blur", clearRestoredFocus);
    target.removeEventListener("keydown", clearRestoredFocus);
    target.removeEventListener("pointerdown", clearRestoredFocus);
    restoredFocusCleanup.delete(target);
  };
  restoredFocusCleanup.set(target, clearRestoredFocus);
  target.addEventListener("blur", clearRestoredFocus);
  target.addEventListener("keydown", clearRestoredFocus);
  target.addEventListener("pointerdown", clearRestoredFocus);
  target.focus({ preventScroll: true });
  requestAnimationFrame(() => tooltipFocusSuppression.delete(target));
}
