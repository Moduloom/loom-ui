import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cx } from "../utils/cn.js";
import { Tooltip } from "./Tooltip.js";

export type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  tooltip?: string | false;
  children: ReactNode;
  pressed?: boolean | undefined;
  size?: "small" | "medium" | "large";
  tone?: "neutral" | "brand" | "danger" | "danger-ghost";
};

export function IconButton({
  label,
  tooltip = false,
  children,
  className,
  pressed,
  size = "medium",
  tone = "neutral",
  ...props
}: IconButtonProps) {
  const button = (
    <button
      type="button"
      title={label}
      className={cx(
        "lui-icon-button",
        `lui-icon-button--${size}`,
        `lui-icon-button--${tone}`,
        className,
      )}
      aria-label={label}
      aria-pressed={pressed}
      {...props}
    >
      {children}
    </button>
  );
  if (tooltip === false) return button;
  return <Tooltip label={tooltip ?? label}>{button}</Tooltip>;
}
