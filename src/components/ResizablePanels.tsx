import {
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  useRef,
} from "react";
import { cx } from "../utils/cn.js";

export type ResizablePanelGroupProps = {
  start: ReactNode;
  end: ReactNode;
  size: number;
  minSize: number;
  maxSize: number;
  onSizeChange: (size: number) => void;
  onSizeCommit?: (size: number) => void;
  onSizePreview?: (size: number) => void;
  syncCssVariable?: string;
  direction?: "horizontal" | "vertical";
  resizablePanel?: "start" | "end";
  resizeLabel: string;
  startLabel?: string;
  endLabel?: string;
  step?: number;
  disabled?: boolean;
  hideHandle?: boolean;
  className?: string;
};

export function ResizablePanelGroup({
  start,
  end,
  size,
  minSize,
  maxSize,
  onSizeChange,
  onSizeCommit,
  onSizePreview,
  syncCssVariable,
  direction = "horizontal",
  resizablePanel = "start",
  resizeLabel,
  startLabel,
  endLabel,
  step = 8,
  disabled = false,
  hideHandle = false,
  className,
}: ResizablePanelGroupProps) {
  const groupRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    pointerId: number;
    origin: number;
    size: number;
    lastSize: number;
  } | null>(null);
  const boundedSize = clampSize(size, minSize, maxSize);
  const displayedSize = dragRef.current?.lastSize ?? boundedSize;
  const style = { "--lui-resizable-panel-size": `${displayedSize}px` } as CSSProperties;
  const axis = direction === "horizontal" ? "x" : "y";
  const growDirection = resizablePanel === "start" ? 1 : -1;

  const applyPreview = (nextSize: number) => {
    const rounded = `${Math.round(nextSize)}px`;
    groupRef.current?.style.setProperty("--lui-resizable-panel-size", rounded);
    if (syncCssVariable) {
      document.documentElement.style.setProperty(syncCssVariable, rounded);
    }
    onSizePreview?.(nextSize);
  };

  const setResizing = (active: boolean) => {
    const group = groupRef.current;
    if (group) {
      if (active) group.dataset.resizing = "";
      else delete group.dataset.resizing;
    }
    if (active) document.documentElement.dataset.panelResizing = direction;
    else delete document.documentElement.dataset.panelResizing;
  };

  const onPointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (disabled || event.button !== 0) return;
    dragRef.current = {
      pointerId: event.pointerId,
      origin: axis === "x" ? event.clientX : event.clientY,
      size: displayedSize,
      lastSize: displayedSize,
    };
    setResizing(true);
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
  };

  const onPointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const current = axis === "x" ? event.clientX : event.clientY;
    const nextSize = clampSize(
      drag.size + (current - drag.origin) * growDirection,
      minSize,
      maxSize,
    );
    drag.lastSize = nextSize;
    applyPreview(nextSize);
  };

  const finishPointerResize = (event: PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const nextSize = drag.lastSize;
    dragRef.current = null;
    setResizing(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    applyPreview(nextSize);
    onSizeChange(nextSize);
    onSizeCommit?.(nextSize);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const decreaseKey = direction === "horizontal" ? "ArrowLeft" : "ArrowUp";
    const increaseKey = direction === "horizontal" ? "ArrowRight" : "ArrowDown";
    let next: number | null = null;
    if (event.key === "Home") next = minSize;
    if (event.key === "End") next = maxSize;
    if (event.key === decreaseKey) next = displayedSize - step * growDirection;
    if (event.key === increaseKey) next = displayedSize + step * growDirection;
    if (next === null) return;
    event.preventDefault();
    const bounded = clampSize(next, minSize, maxSize);
    applyPreview(bounded);
    onSizeChange(bounded);
    onSizeCommit?.(bounded);
  };

  return (
    <div
      ref={groupRef}
      className={cx(
        "lui-resizable-panels",
        `lui-resizable-panels--${direction}`,
        `lui-resizable-panels--resize-${resizablePanel}`,
        className,
      )}
      style={style}
    >
      <div
        className="lui-resizable-panels__panel"
        {...(startLabel ? { "aria-label": startLabel, role: "region" as const } : {})}
      >
        {start}
      </div>
      <div
        className="lui-resizable-panels__panel"
        {...(endLabel ? { "aria-label": endLabel, role: "region" as const } : {})}
      >
        {end}
      </div>
      {hideHandle ? null : (
        <>
          {/* biome-ignore lint/a11y/useSemanticElements: interactive splitter follows the ARIA separator pattern */}
          <button
            type="button"
            className="lui-resizable-panels__handle"
            role="separator"
            aria-label={resizeLabel}
            aria-orientation={direction === "horizontal" ? "vertical" : "horizontal"}
            aria-valuemin={minSize}
            aria-valuemax={maxSize}
            aria-valuenow={Math.round(displayedSize)}
            disabled={disabled}
            onPointerDown={onPointerDown}
            onKeyDown={onKeyDown}
            onPointerMove={onPointerMove}
            onPointerUp={finishPointerResize}
            onPointerCancel={finishPointerResize}
          >
            <span className="lui-resizable-panels__handle-line" aria-hidden="true" />
          </button>
        </>
      )}
    </div>
  );
}

function clampSize(size: number, minSize: number, maxSize: number): number {
  return Math.min(Math.max(size, Math.min(minSize, maxSize)), Math.max(minSize, maxSize));
}
