import { forwardRef, type InputHTMLAttributes, useId } from "react";
import { cx } from "../utils/cn.js";
import { Input } from "./Input.js";
import { FieldLayout } from "./FieldLayout.js";

export type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
  label: string;
  labelHidden?: boolean;
  hint?: string;
  error?: string;
  supportLines?: 1 | 2;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  containerClassName?: string;
  variant?: "outlined" | "underline" | "borderless";
  layout?: "stacked" | "inline";
};

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  {
    label,
    labelHidden = false,
    hint,
    error,
    supportLines,
    leading,
    trailing,
    containerClassName,
    variant = "outlined",
    layout = "stacked",
    className,
    id: providedId,
    ...props
  },
  ref,
) {
  const generatedId = useId();
  const id = providedId ?? generatedId;
  const supportId = `${id}-support`;
  return (
    <FieldLayout
      controlId={id}
      label={label}
      labelHidden={labelHidden}
      hint={hint}
      error={error}
      supportLines={supportLines}
      className={cx(
        `lui-field--${variant}`,
        layout === "inline" && "lui-field--inline",
        containerClassName,
      )}
    >
      <label htmlFor={id} className={cx("lui-field__control", error && "lui-field__control--invalid")}>
        {leading ? <span className="lui-field__leading">{leading}</span> : null}
        <Input
          {...props}
          ref={ref}
          id={id}
          className={cx("lui-text-field", className)}
          aria-invalid={Boolean(error) || props["aria-invalid"] || undefined}
          aria-describedby={
            [props["aria-describedby"], hint || error ? supportId : null]
              .filter(Boolean)
              .join(" ") || undefined
          }
        />
        {trailing ? <span className="lui-field__trailing">{trailing}</span> : null}
      </label>
    </FieldLayout>
  );
});
