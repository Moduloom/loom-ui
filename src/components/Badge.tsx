import type { HTMLAttributes } from "react";
import { cx } from "../utils/cn.js";

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: "neutral" | "positive" | "warning" | "danger" | "info";
};

export function Badge({ tone = "neutral", children, className, ...props }: BadgeProps) {
  return (
    <span className={cx("lui-badge", `lui-badge--${tone}`, className)} {...props}>
      {children}
    </span>
  );
}
