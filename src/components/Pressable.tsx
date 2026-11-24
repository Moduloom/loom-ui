import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cx } from "../utils/cn.js";

export type PressableProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  busy?: boolean;
  pressed?: boolean;
};

/**
 * Behavior-only button primitive for navigation rows, cards and other controls
 * whose visual treatment belongs to a higher-level component.
 */
export const Pressable = forwardRef<HTMLButtonElement, PressableProps>(function Pressable(
  { busy = false, pressed, disabled, className, type = "button", ...props },
  ref,
) {
  return (
    <button
      {...props}
      ref={ref}
      type={type}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      aria-pressed={pressed ?? props["aria-pressed"]}
      className={cx("lui-pressable", className)}
    />
  );
});
