import type { FormHTMLAttributes, HTMLAttributes } from "react";
import { cx } from "../utils/cn.js";

export function FormStack({ className, ...props }: FormHTMLAttributes<HTMLFormElement>) {
  return <form {...props} className={cx("lui-form-stack", className)} />;
}

/** Fields use explicit shared spacing, independent of support text. */
export function FormFieldGroup({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cx("lui-form-field-group", className)} />;
}

export function FormOptions({
  className,
  align = "between",
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  align?: "between" | "end";
}) {
  return (
    <div
      {...props}
      className={cx("lui-form-options", align === "end" && "lui-form-options--end", className)}
    />
  );
}
