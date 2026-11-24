import { forwardRef, type TextareaHTMLAttributes, useId } from "react";
import { TextareaInput } from "./Input.js";
import { cx } from "../utils/cn.js";

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  labelHidden?: boolean;
  hint?: string;
  error?: string;
  containerClassName?: string;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  {
    label,
    labelHidden = false,
    hint,
    error,
    containerClassName,
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
    <label className={cx("lui-field", containerClassName)} htmlFor={id}>
      <span className={cx("lui-field__label", labelHidden && "lui-field__label--hidden")}>
        {label}
      </span>
      <TextareaInput
        {...props}
        ref={ref}
        id={id}
        className={cx("lui-textarea", error && "lui-textarea--invalid", className)}
        aria-invalid={Boolean(error) || props["aria-invalid"] || undefined}
        aria-describedby={
          [props["aria-describedby"], hint || error ? supportId : null]
            .filter(Boolean)
            .join(" ") || undefined
        }
      />
      {error || hint ? (
        <small
          id={supportId}
          className={cx("lui-field__support", error && "lui-field__support--error")}
        >
          {error || hint}
        </small>
      ) : null}
    </label>
  );
});
