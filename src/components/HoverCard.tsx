import {
  forwardRef,
  isValidElement,
  useEffect,
  useState,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
} from "react";
import { cx } from "../utils/cn.js";
import { Popover, type PopoverHandle } from "./Popover.js";

export type HoverCardProps = {
  label: string;
  trigger: ReactElement;
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  openDelay?: number;
  closeDelay?: number;
  side?: "bottom" | "right";
  align?: "start" | "center" | "end";
  offset?: number;
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
};

export type HoverCardHandle = PopoverHandle;

/**
 * Hover-preview popover built on the shared popover layer: opens on hover or
 * keyboard focus, keeps open while the pointer rests inside the content,
 * closes on trigger activation or Escape (restoring focus to the trigger)
 * and never moves focus into the card on its own.
 */
export const HoverCard = forwardRef<HoverCardHandle, HoverCardProps>(function HoverCard(
  {
    label,
    trigger,
    children,
    open,
    onOpenChange,
    openDelay = 180,
    closeDelay = 140,
    side = "right",
    align = "center",
    offset,
    disabled = false,
    className,
    style,
  },
  forwardedRef,
) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = open ?? internalOpen;
  const change = (next: boolean) => {
    if (open === undefined) setInternalOpen(next);
    onOpenChange?.(next);
  };
  useEffect(() => {
    if (disabled) change(false);
  }, [disabled]);
  if (disabled || !isValidElement(trigger)) return <>{trigger}</>;
  return (
    <Popover
      ref={forwardedRef}
      open={isOpen}
      onOpenChange={change}
      trigger={trigger}
      label={label}
      side={side}
      align={align}
      offset={offset}
      className={cx("lui-hover-card", className)}
      style={style}
      triggerAction="hover"
      autoFocus={false}
      escapeRestoresFocus
      openDelay={openDelay}
      closeDelay={closeDelay}
    >
      {children}
    </Popover>
  );
});
