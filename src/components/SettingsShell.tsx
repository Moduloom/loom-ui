import type { HTMLAttributes, ReactNode, Ref } from "react";
import { cx } from "../utils/cn.js";

export function SettingsResultRegion({
  state = "content",
  children,
  className,
  ref,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  state?: "content" | "empty" | "loading";
  ref?: Ref<HTMLDivElement>;
}) {
  return (
    <div
      {...props}
      ref={ref}
      className={cx("lui-settings-result-region", className)}
      data-result-state={state}
    >
      {children}
    </div>
  );
}

export function SettingsFieldGroup({
  children,
  className,
  columns = 1,
  density = "default",
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  columns?: 1 | 2;
  density?: "default" | "compact";
}) {
  return (
    <div
      {...props}
      className={cx(
        "lui-settings-field-group",
        columns === 2 && "lui-settings-field-group--columns",
        density === "compact" && "lui-settings-field-group--compact",
        className,
      )}
    >
      {children}
    </div>
  );
}

export type SettingsNavGroupProps = HTMLAttributes<HTMLElement> & {
  label?: ReactNode;
  actions?: ReactNode;
  divided?: boolean;
};

export function SettingsNavGroup({
  label,
  actions,
  divided = false,
  children,
  className,
  ...props
}: SettingsNavGroupProps) {
  return (
    <section
      {...props}
      className={cx(
        "lui-settings-nav-group",
        divided && "lui-settings-nav-group--divided",
        className,
      )}
    >
      {label || actions ? (
        <header className="lui-settings-nav-group__header">
          {label ? <span className="lui-settings-nav-group__label">{label}</span> : null}
          {actions ? <span className="lui-settings-nav-group__actions">{actions}</span> : null}
        </header>
      ) : null}
      <div className="lui-settings-nav-group__items">{children}</div>
    </section>
  );
}

export function SettingsPreviewPanel({
  title,
  description,
  children,
  className,
  ...props
}: Omit<HTMLAttributes<HTMLElement>, "title"> & {
  title?: ReactNode;
  description?: ReactNode;
}) {
  return (
    <section {...props} className={cx("lui-settings-preview-panel", className)}>
      {title || description ? (
        <header className="lui-settings-preview-panel__header">
          {title ? <h3>{title}</h3> : null}
          {description ? <p>{description}</p> : null}
        </header>
      ) : null}
      <div className="lui-settings-preview-panel__content">{children}</div>
    </section>
  );
}
