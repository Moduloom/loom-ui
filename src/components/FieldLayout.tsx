import type { ReactNode } from "react";
import { cx } from "../utils/cn.js";

export function FieldLayout({
  controlId,
  label,
  labelHidden = false,
  hint,
  error,
  supportLines,
  className,
  children,
}: {
  controlId: string;
  label: string;
  labelHidden?: boolean;
  hint?: string | undefined;
  error?: string | undefined;
  supportLines?: 1 | 2 | undefined;
  className?: string | undefined;
  children: ReactNode;
}) {
  return (
    <div className={cx("lui-field", className)}>
      <label
        className={cx("lui-field__label", labelHidden && "lui-field__label--hidden")}
        htmlFor={controlId}
      >
        {label}
      </label>
      {children}
      {error || hint || supportLines ? (
        <small
          id={`${controlId}-support`}
          aria-hidden={!error && !hint ? true : undefined}
          className={cx(
            "lui-field__support",
            error && "lui-field__support--error",
            supportLines === 1 && "lui-field__support--one-line",
            supportLines === 2 && "lui-field__support--two-lines",
          )}
        >
          {error || hint}
        </small>
      ) : null}
    </div>
  );
}
