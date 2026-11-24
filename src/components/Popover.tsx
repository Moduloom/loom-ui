import {
  type CSSProperties,
  cloneElement,
  createContext,
  type FocusEvent,
  forwardRef,
  type KeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
  type ReactNode,
  type RefObject,
  useEffect,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useContext,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { isTooltipFocusSuppressed, restoreFocusWithoutTooltip } from "../hooks/focusRestore.js";
import { cx } from "../utils/cn.js";
import { findOverlayScrollport, measureOverlayContentHeight } from "./OverlayScrollArea.js";

export type PopoverProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: ReactElement;
  children: ReactNode;
  label?: string;
  align?: "start" | "center" | "end";
  className?: string;
  anchorClassName?: string;
  matchTriggerWidth?: boolean;
  contentSized?: boolean;
  portalled?: boolean;
  contextMenu?: boolean;
  side?: "bottom" | "right";
  style?: CSSProperties;
  offset?: number;
  openDelay?: number;
  closeDelay?: number;
  triggerAction?: "click" | "hover" | "none";
  autoFocus?: boolean;
  escapeRestoresFocus?: boolean;
  animatePresence?: boolean;
};

export type PopoverHandle = {
  dismiss: (options?: { restoreFocus?: boolean }) => void;
};

const PopoverPanelContext = createContext<string | null>(null);

export const Popover = forwardRef<PopoverHandle, PopoverProps>(function Popover({
  open,
  onOpenChange,
  trigger,
  children,
  label,
  align = "start",
  className,
  anchorClassName,
  matchTriggerWidth = false,
  contentSized = false,
  portalled = true,
  contextMenu = false,
  side = "bottom",
  style,
  offset = 6,
  openDelay = 180,
  closeDelay = 140,
  triggerAction = "click",
  autoFocus = true,
  escapeRestoresFocus = false,
  animatePresence = false,
}: PopoverProps, forwardedRef) {
  const contentId = useId();
  const [contextPoint, setContextPoint] = useState<{ x: number; y: number } | null>(null);
  const parentPopoverPanelId = useContext(PopoverPanelContext);
  const anchorRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const wasOpenRef = useRef(false);
  const onOpenChangeRef = useRef(onOpenChange);
  const openRef = useRef(open);
  useLayoutEffect(() => {
    openRef.current = open;
  }, [open]);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPointer = useRef<{ x: number; y: number } | null>(null);
  const clearHoverTimer = () => {
    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
  };
  const scheduleHoverOpen = () => {
    clearHoverTimer();
    hoverTimer.current = setTimeout(() => {
      // Re-entering the same trigger while already open must not re-emit
      // `true`; consumers treat repeated opens as a fresh reveal.
      if (openRef.current) return;
      onOpenChangeRef.current(true);
    }, openDelay);
  };
  const scheduleHoverClose = () => {
    clearHoverTimer();
    hoverTimer.current = setTimeout(() => {
      // Focus can move into a nested document without a relatedTarget reaching
      // the trigger; only close when neither focus nor pointer rests on the
      // trigger or the card anymore.
      const anchor = anchorRef.current;
      const panel = panelRef.current;
      const contains = (node: Node | null): boolean =>
        Boolean(node && ((anchor?.contains(node) ?? false) || (panel?.contains(node) ?? false)));
      if (typeof document !== "undefined") {
        if (contains(document.activeElement)) return;
        const point = lastPointer.current;
        if (point) {
          const element = document.elementFromPoint(point.x, point.y);
          if (element && contains(element)) return;
        }
      }
      onOpenChangeRef.current(false);
    }, closeDelay);
  };
  useEffect(() => clearHoverTimer, []);
  const restoreTriggerFocus = () => {
    const triggerNode = anchorRef.current?.firstElementChild;
    window.setTimeout(() => {
      if (triggerNode instanceof HTMLElement && triggerNode.isConnected) {
        restoreFocusWithoutTooltip(triggerNode);
      }
    }, 0);
  };
  useImperativeHandle(
    forwardedRef,
    () => ({
      dismiss: (options) => {
        clearHoverTimer();
        onOpenChangeRef.current(false);
        if (options?.restoreFocus) restoreTriggerFocus();
      },
    }),
    [],
  );
  const [retained, setRetained] = useState(false);
  const present = open || (animatePresence && retained);

  useLayoutEffect(() => {
    if (animatePresence && open) {
      setRetained(true);
      return;
    }
    if (!retained) return;

    const animations = animatePresence ? panelRef.current?.getAnimations() ?? [] : [];
    if (!animations.length) {
      setRetained(false);
      return;
    }

    let exiting = true;
    void Promise.allSettled(animations.map(animation => animation.finished)).then(() => {
      if (exiting) setRetained(false);
    });
    return () => { exiting = false; };
  }, [animatePresence, open, retained]);

  const [portalHost, setPortalHost] = useState<HTMLElement | null>(null);
  const [position, setPosition] = useState<CSSProperties>({ visibility: "hidden" });

  useLayoutEffect(() => {
    onOpenChangeRef.current = onOpenChange;
  }, [onOpenChange]);

  useLayoutEffect(() => {
    if (!present || !portalled || typeof document === "undefined") {
      setPortalHost(null);
      return;
    }
    // Keep popovers opened from a modal dialog inside its focus scope.
    // Portalling them to body makes inputs and nested selects impossible to
    // focus while the dialog is modal.
    setPortalHost(anchorRef.current?.closest<HTMLElement>("dialog[open]") ?? document.body);
  }, [present, portalled]);

  useLayoutEffect(() => {
    if (!open || !portalHost) return;
    const updatePosition = () => {
      const anchor = anchorRef.current?.firstElementChild;
      const panel = panelRef.current;
      if (!(anchor instanceof HTMLElement) || !panel) return;
      const actualBox = anchor.getBoundingClientRect();
      const anchorBox = contextMenu && contextPoint
        ? { left: contextPoint.x, right: contextPoint.x, top: contextPoint.y, bottom: contextPoint.y, width: 0 }
        : actualBox;
      const viewport = window.visualViewport;
      const viewportGap = 12;
      const x = viewport?.offsetLeft ?? 0;
      const y = viewport?.offsetTop ?? 0;
      const leftEdge = x + viewportGap;
      const topEdge = y + viewportGap;
      const rightEdge = x + (viewport?.width ?? window.innerWidth) - viewportGap;
      const bottomEdge = y + (viewport?.height ?? window.innerHeight) - viewportGap;
      const maxWidth = Math.max(0, rightEdge - leftEdge);
      const maxHeight = Math.max(0, bottomEdge - topEdge);

      const panelWidth = Math.min(maxWidth, matchTriggerWidth
        ? Math.max(anchorBox.width, panel.offsetWidth) : panel.offsetWidth);
      const contentHeight = measureOverlayContentHeight(panel) ??
        Math.max(panel.offsetHeight, panel.scrollHeight);
      const roomBelow = Math.max(0, bottomEdge - anchorBox.bottom - offset);
      const roomAbove = Math.max(0, anchorBox.top - offset - topEdge);
      const openAbove = contentHeight > roomBelow && roomAbove > roomBelow;
      const availableOnSide = Math.min(maxHeight, openAbove ? roomAbove : roomBelow);
      const minUsableHeight = Math.min(contentHeight, maxHeight, 48);
      const availableHeight = side === "right" || availableOnSide < minUsableHeight
        ? maxHeight : availableOnSide;
      const panelHeight = Math.min(contentHeight, availableHeight);

      let left = align === "end" ? anchorBox.right - panelWidth :
        align === "center" ? anchorBox.left + (anchorBox.width - panelWidth) / 2 : anchorBox.left;
      if (contextMenu) left = (contextPoint?.x ?? actualBox.right) + offset;

      let top = openAbove ? anchorBox.top - offset - panelHeight : anchorBox.bottom + offset;
      if (side === "right") {
        left = anchorBox.right + offset + panelWidth <= rightEdge
          ? anchorBox.right + offset : anchorBox.left - panelWidth - offset;
        top = align === "end" ? anchorBox.bottom - panelHeight :
          align === "center" ? anchorBox.top + (anchorBox.height - panelHeight) / 2 : anchorBox.top;
      }

      const next: CSSProperties = {
        position: "fixed",
        left: Math.max(leftEdge, Math.min(left, rightEdge - panelWidth)),
        top: Math.max(topEdge, Math.min(top, bottomEdge - panelHeight)),
        minWidth: matchTriggerWidth ? Math.min(anchorBox.width, maxWidth) : undefined,
        maxWidth,
        maxHeight: availableHeight,
        visibility: "visible",
      };
      setPosition(previous =>
        previous.left === next.left && previous.top === next.top &&
        previous.minWidth === next.minWidth && previous.maxWidth === next.maxWidth &&
        previous.maxHeight === next.maxHeight && previous.visibility === next.visibility
          ? previous : next,
      );
    };
    updatePosition();
    const resizeObserver =
      typeof ResizeObserver === "undefined" ? null : new ResizeObserver(updatePosition);
    const anchor = anchorRef.current?.firstElementChild;
    const observedPanel = panelRef.current;
    if (anchor instanceof Element) resizeObserver?.observe(anchor);
    if (observedPanel) {
      resizeObserver?.observe(observedPanel);
      const content = findOverlayScrollport(observedPanel)?.firstElementChild;
      if (content) resizeObserver?.observe(content);
    }
    const onAncestorScroll = (event: Event) => {
      if (event.target instanceof Node && observedPanel?.contains(event.target)) return;
      updatePosition();
    };
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", onAncestorScroll, true);
    window.visualViewport?.addEventListener("resize", updatePosition);
    window.visualViewport?.addEventListener("scroll", updatePosition);
    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", onAncestorScroll, true);
      window.visualViewport?.removeEventListener("resize", updatePosition);
      window.visualViewport?.removeEventListener("scroll", updatePosition);
    };
  }, [align, matchTriggerWidth, offset, open, portalHost, contextMenu, contextPoint, side]);

  useEffect(() => {
    if (!open) {
      clearHoverTimer();
      if (wasOpenRef.current && autoFocus) {
        const triggerNode = anchorRef.current?.firstElementChild;
        const restoreFrame = requestAnimationFrame(() => {
          if (triggerNode instanceof HTMLElement && triggerNode.isConnected) {
            restoreFocusWithoutTooltip(triggerNode);
          }
        });
        wasOpenRef.current = false;
        return () => cancelAnimationFrame(restoreFrame);
      }
      wasOpenRef.current = false;
      return;
    }
    wasOpenRef.current = true;
    const frame = autoFocus
      ? requestAnimationFrame(() => {
          const panel = panelRef.current;
          const target = panel?.querySelector<HTMLElement>(
            '[data-lui-autofocus], [aria-selected="true"]:not(:disabled), [role="menuitem"]:not(:disabled), [role="option"]:not(:disabled), button:not(:disabled), [href], input:not(:disabled), textarea:not(:disabled), select:not(:disabled)',
          );
          const editableTarget = target?.matches("input, textarea, select, [contenteditable='true']");
          (editableTarget ? panel : (target ?? panel))?.focus({ preventScroll: true });
        })
      : null;
    const closeOutside = (event: PointerEvent) => {
      if (foreignDialogContains(event.target as Node | null, panelRef.current)) return;
      const target = event.target as Node;
      if (
        !anchorRef.current?.contains(target) &&
        !panelRef.current?.contains(target) &&
        !isTargetInsideNestedPopover(target, contentId)
      ) {
        clearHoverTimer();
        onOpenChangeRef.current(false);
        if (autoFocus) restoreTriggerFocus();
      }
    };
    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (foreignDialogContains(document.activeElement, panelRef.current)) return;
      if (hasOpenChildPopover(contentId)) return;
      const nestedNativePopover = document.activeElement?.closest("[popover]:popover-open");
      if (nestedNativePopover && panelRef.current?.contains(nestedNativePopover)) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      clearHoverTimer();
      onOpenChangeRef.current(false);
      if (escapeRestoresFocus || autoFocus) restoreTriggerFocus();
    };
    const trackPointer = (event: PointerEvent) => {
      lastPointer.current = { x: event.clientX, y: event.clientY };
    };
    if (triggerAction === "hover") document.addEventListener("pointermove", trackPointer, true);
    document.addEventListener("pointerdown", closeOutside);
    window.addEventListener("keydown", closeOnEscape, true);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      if (triggerAction === "hover") document.removeEventListener("pointermove", trackPointer, true);
      document.removeEventListener("pointerdown", closeOutside);
      window.removeEventListener("keydown", closeOnEscape, true);
    };
  }, [autoFocus, contentId, escapeRestoresFocus, open]);

  const originalProps = trigger.props as {
    onClick?: (event: ReactMouseEvent<HTMLElement>) => void;
    onContextMenu?: (event: ReactMouseEvent<HTMLElement>) => void;
    onKeyDown?: (event: KeyboardEvent<HTMLElement>) => void;
    onPointerEnter?: (event: ReactPointerEvent<HTMLElement>) => void;
    onPointerLeave?: (event: ReactPointerEvent<HTMLElement>) => void;
    onFocus?: (event: FocusEvent<HTMLElement>) => void;
    onBlur?: (event: FocusEvent<HTMLElement>) => void;
    "aria-haspopup"?: boolean | "dialog" | "menu" | "listbox" | "tree" | "grid";
  };
  const hoverTriggerHandlers =
    triggerAction === "hover"
      ? {
          onPointerEnter: (event: ReactPointerEvent<HTMLElement>) => {
            originalProps.onPointerEnter?.(event);
            if (event.pointerType !== "touch") scheduleHoverOpen();
          },
          onPointerLeave: (event: ReactPointerEvent<HTMLElement>) => {
            originalProps.onPointerLeave?.(event);
            scheduleHoverClose();
          },
          onFocus: (event: FocusEvent<HTMLElement>) => {
            originalProps.onFocus?.(event);
            if (!isTooltipFocusSuppressed(event.currentTarget) && event.currentTarget.matches(":focus-visible")) {
              scheduleHoverOpen();
            }
          },
          onBlur: (event: FocusEvent<HTMLElement>) => {
            originalProps.onBlur?.(event);
            if (!panelRef.current?.contains(event.relatedTarget as Node)) scheduleHoverClose();
          },
          onClick: (event: ReactMouseEvent<HTMLElement>) => {
            originalProps.onClick?.(event);
            clearHoverTimer();
            if (!event.defaultPrevented) onOpenChange(false);
          },
        }
      : {};
  const clickTriggerHandlers =
    triggerAction === "click"
      ? {
          onContextMenu: (event: ReactMouseEvent<HTMLElement>) => {
            originalProps.onContextMenu?.(event);
            if (!contextMenu || event.defaultPrevented) return;
            event.preventDefault();
            event.stopPropagation();
            setContextPoint({ x: event.clientX, y: event.clientY });
            onOpenChange(true);
          },
          onClick: (event: ReactMouseEvent<HTMLElement>) => {
            originalProps.onClick?.(event);
            if (!contextMenu && !event.defaultPrevented) onOpenChange(!open);
          },
          onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
            originalProps.onKeyDown?.(event);
            if (
              !event.defaultPrevented &&
              !open &&
              (contextMenu
                ? event.key === "ContextMenu" || (event.shiftKey && event.key === "F10")
                : event.key === "ArrowDown" || event.key === "ArrowUp" || (side === "right" && event.key === "ArrowRight"))
            ) {
              event.preventDefault();
              if (contextMenu) setContextPoint(null);
              onOpenChange(true);
            }
          },
        }
      : {};
  const triggerElement = cloneElement(trigger, {
    "aria-expanded": open,
    "aria-controls": open ? contentId : undefined,
    "aria-haspopup": originalProps["aria-haspopup"] ?? "dialog",
    ...hoverTriggerHandlers,
    ...clickTriggerHandlers,
  } as never);

  return (
    <div
      ref={anchorRef}
      className={cx("lui-popover-anchor", `lui-popover-anchor--${align}`, anchorClassName)}
    >
      {triggerElement}
      {present
        ? renderPopoverPanel({
            contentId,
            panelRef,
            contentSized,
            className,
            label,
            position,
            portalled,
            portalHost,
            parentPopoverPanelId,
            onOpenChange,
            children,
            style,
            hover: triggerAction === "hover",
            presence: animatePresence ? (open ? "open" : "closing") : undefined,
            onPointerEnterPanel: clearHoverTimer,
            onPointerLeavePanel: scheduleHoverClose,
          })
        : null}
    </div>
  );
});

// A dialog that contains the pointer/focus but does not host this popover
// should keep handling the event itself; popovers living in the same dialog
// as the interaction must still close normally.
function foreignDialogContains(node: Node | null, home: HTMLElement | null): boolean {
  if (!node) return false;
  return Array.from(document.querySelectorAll("dialog[open]")).some(
    (dialog) => dialog.contains(node) && (!home || !dialog.contains(home)),
  );
}

function hasOpenChildPopover(parentPanelId: string) {
  return Array.from(document.querySelectorAll<HTMLElement>("[data-lui-popover-panel]")).some(
    (panel) => panel.dataset.luiPopoverParent === parentPanelId,
  );
}

function isTargetInsideNestedPopover(target: Node, ownerPanelId: string) {
  if (!(target instanceof Element)) return false;
  let panel = target.closest<HTMLElement>("[data-lui-popover-panel]");
  while (panel) {
    const parentPanelId = panel.dataset.luiPopoverParent;
    if (!parentPanelId) return false;
    if (parentPanelId === ownerPanelId) return true;
    panel = document.getElementById(parentPanelId);
  }
  return false;
}

function renderPopoverPanel({
  contentId,
  panelRef,
  contentSized,
  className,
  label,
  position,
  portalled,
  portalHost,
  parentPopoverPanelId,
  onOpenChange,
  children,
  style,
  hover,
  presence,
  onPointerEnterPanel,
  onPointerLeavePanel,
}: {
  contentId: string;
  panelRef: RefObject<HTMLDivElement | null>;
  contentSized: boolean;
  className?: string | undefined;
  label?: string | undefined;
  position: CSSProperties;
  portalled: boolean;
  portalHost: HTMLElement | null;
  parentPopoverPanelId: string | null;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  style?: CSSProperties | undefined;
  hover: boolean;
  presence?: "open" | "closing";
  onPointerEnterPanel: () => void;
  onPointerLeavePanel: () => void;
}) {
  const panel = (
    <div
      id={contentId}
      ref={panelRef}
      className={cx(
        "lui-popover",
        contentSized && "lui-popover--content-sized",
        !portalled && "lui-popover--inline",
        className,
      )}
      role="dialog"
      aria-label={label}
      inert={presence === "closing" || undefined}
      aria-hidden={presence === "closing" || undefined}
      data-lui-presence={presence}
      data-lui-popover-panel={presence === "closing" ? undefined : ""}
      data-lui-popover-parent={presence === "closing" ? undefined : parentPopoverPanelId ?? undefined}
      tabIndex={-1}
      style={portalled ? { ...position, ...style } : style}
      onPointerEnter={hover ? onPointerEnterPanel : undefined}
      onPointerLeave={hover ? onPointerLeavePanel : undefined}
      onFocus={hover ? onPointerEnterPanel : undefined}
      onBlur={
        hover
          ? (event: FocusEvent<HTMLDivElement>) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node)) onPointerLeavePanel();
            }
          : undefined
      }
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.stopPropagation();
          onOpenChange(false);
        }
      }}
    >
      <PopoverPanelContext.Provider value={contentId}>{children}</PopoverPanelContext.Provider>
    </div>
  );
  if (!portalled) return panel;
  return portalHost ? createPortal(panel, portalHost) : null;
}
