import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "../utils/cn.js";
import { Pressable, type PressableProps } from "./Pressable.js";

export function List({
  children,
  label,
  className,
  ...props
}: Omit<HTMLAttributes<HTMLUListElement>, "aria-label"> & {
  label?: string;
}) {
  return (
    <ul {...props} className={cx("m-0 grid list-none gap-2 p-0", className)} aria-label={label}>
      {children}
    </ul>
  );
}

export type ListItemContentProps = {
  leading?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  wrapDescription?: boolean;
};

export function ListItem({
  leading,
  title,
  description,
  meta,
  actions,
  children,
  wrapDescription = false,
  className,
}: ListItemContentProps & { className?: string }) {
  return (
    <li
      className={cx(
        "grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-lui-panel border border-lui-line-subtle bg-lui-surface px-3 py-2.5",
        className,
      )}
    >
      {leading ? (
        <span className="grid shrink-0 place-items-center text-lui-fg-muted">{leading}</span>
      ) : null}
      <span className="grid min-w-0 gap-0.5">
        <strong className="truncate text-sm font-semibold text-lui-fg">{title}</strong>
        {description ? (
          <span
            className={cx(
              "text-xs text-lui-fg-muted",
              wrapDescription ? "whitespace-pre-wrap break-words" : "truncate",
            )}
          >
            {description}
          </span>
        ) : null}
      </span>
      {meta || actions ? (
        <span className="flex items-center justify-end gap-2">
          {meta}
          {actions}
        </span>
      ) : null}
      {children ? <div className="col-span-full min-w-0">{children}</div> : null}
    </li>
  );
}

export function ListItemButton({
  leading,
  title,
  description,
  meta,
  actions,
  className,
  ...props
}: ListItemContentProps & PressableProps) {
  return (
    <li>
      <Pressable
        {...props}
        className={cx(
          "grid w-full min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-lui-panel border border-lui-line-subtle bg-lui-surface px-3 py-2.5 text-left transition-colors hover:border-lui-line hover:bg-lui-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lui-focus",
          className,
        )}
      >
        {leading ? (
          <span className="grid shrink-0 place-items-center text-lui-fg-muted">{leading}</span>
        ) : null}
        <span className="grid min-w-0 gap-0.5">
          <strong className="truncate text-sm font-semibold text-lui-fg">{title}</strong>
          {description ? (
            <span className="truncate text-xs text-lui-fg-muted">{description}</span>
          ) : null}
        </span>
        {meta || actions ? (
          <span className="flex items-center justify-end gap-2">
            {meta}
            {actions}
          </span>
        ) : null}
      </Pressable>
    </li>
  );
}
