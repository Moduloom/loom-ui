import type { ReactNode } from "react";
import { cx } from "../utils/cn.js";

export type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  body?: string;
  action?: ReactNode;
  compact?: boolean;
  layout?: "fill" | "content";
  className?: string;
};

export function EmptyState({
  icon,
  title,
  body,
  action,
  compact,
  layout = "fill",
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cx(
        "lui-empty-state",
        compact && "lui-empty-state--compact",
        layout === "content" && "lui-empty-state--content",
        className,
      )}
    >
      {icon ? (
        <span className="lui-empty-state__icon" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      <h2 className="lui-empty-state__title">{title}</h2>
      {body ? <p className="lui-empty-state__body">{body}</p> : null}
      {action}
    </div>
  );
}
