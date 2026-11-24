import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cx } from "../utils/cn.js";
import { translateUiSource } from "../i18n";

export type ButtonVariant = "primary" | "secondary" | "danger" | "danger-ghost" | "ghost" | "text";
export type ButtonSize = "small" | "medium" | "large";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  focusTone?: "default" | "neutral";
  busy?: boolean;
  fullWidth?: boolean;
  shape?: "rounded" | "ticket";
  icon?: ReactNode;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    className,
    variant = "secondary",
    size = "medium",
    focusTone = "default",
    busy = false,
    fullWidth = false,
    shape = "rounded",
    children,
    icon,
    disabled,
    type = "button",
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || busy}
      className={cx(
        "lui-button",
        `lui-button--${variant}`,
        `lui-button--${size}`,
        focusTone === "neutral" && "lui-button--neutral-focus",
        `lui-button--${shape}`,
        fullWidth && "lui-button--full-width",
        busy && "lui-button--busy",
        className,
      )}
      aria-busy={busy || undefined}
      {...props}
      aria-label={
        busy ? (props["aria-label"] ?? translateUiSource("正在加载")) : props["aria-label"]
      }
    >
      <span className="lui-button__content" aria-hidden={busy || undefined}>
        {icon}{children}
      </span>
      {busy ? <span className="lui-button__spinner" aria-hidden="true" /> : null}
    </button>
  );
});
