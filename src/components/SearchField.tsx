import { Search, X } from "lucide-react";
import {
  forwardRef,
  type InputHTMLAttributes,
  useEffect,
  useImperativeHandle,
  useId,
  useRef,
} from "react";
import { translateUiSource } from "../i18n";
import { cx } from "../utils/cn.js";
import { IconButton } from "./IconButton.js";
import { FieldLayout } from "./FieldLayout.js";

export type SearchFieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "size" | "onChange"
> & {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  mode?: "standard" | "compact" | "expandable";
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  clearLabel?: string;
  collapseWhenEmpty?: boolean;
  labelHidden?: boolean;
  hint?: string;
  supportLines?: 1 | 2;
  containerClassName?: string;
};

export const SearchField = forwardRef<HTMLInputElement, SearchFieldProps>(function SearchField(
  {
    label,
    value,
    onValueChange,
    mode = "standard",
    expanded = mode !== "expandable",
    onExpandedChange,
    clearLabel = translateUiSource("清除搜索"),
    collapseWhenEmpty = true,
    labelHidden = true,
    hint,
    supportLines,
    containerClassName,
    id: providedId,
    className,
    disabled,
    onBlur,
    onKeyDown,
    ...props
  },
  forwardedRef,
) {
  const generatedId = useId();
  const id = providedId ?? generatedId;
  const inputRef = useRef<HTMLInputElement>(null);
  const expandFocusRequested = useRef(false);
  useImperativeHandle(forwardedRef, () => inputRef.current as HTMLInputElement);

  useEffect(() => {
    if (mode !== "expandable" || !expanded || !expandFocusRequested.current) return;
    const frame = requestAnimationFrame(() => {
      expandFocusRequested.current = false;
      inputRef.current?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [expanded, mode]);

  if (mode === "expandable" && !expanded) {
    return (
      <IconButton
        className={cx("lui-search-field__collapsed", className)}
        label={label}
        disabled={disabled}
        onClick={() => {
          expandFocusRequested.current = true;
          onExpandedChange?.(true);
        }}
      >
        <Search aria-hidden="true" />
      </IconButton>
    );
  }

  const control = (
    <search
      aria-label={label}
      className={cx(
        "lui-search-field",
        mode === "compact" && "lui-search-field--compact",
        mode === "expandable" && "lui-search-field--expandable",
        disabled && "is-disabled",
        className,
      )}
    >
      <Search className="lui-search-field__icon" aria-hidden="true" />
      <input
        {...props}
        ref={inputRef}
        id={id}
        type="search"
        value={value}
        disabled={disabled}
        aria-label={label}
        aria-describedby={
          [props["aria-describedby"], hint ? `${id}-support` : null]
            .filter(Boolean)
            .join(" ") || undefined
        }
        onChange={(event) => onValueChange(event.currentTarget.value)}
        onBlur={(event) => {
          onBlur?.(event);
          if (
            mode === "expandable" &&
            collapseWhenEmpty &&
            !event.currentTarget.value &&
            !event.defaultPrevented
          ) {
            onExpandedChange?.(false);
          }
        }}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (event.defaultPrevented) return;
          if (mode === "expandable" && event.key === "Escape") {
            event.preventDefault();
            if (value) onValueChange("");
            else onExpandedChange?.(false);
            return;
          }
          if (event.key !== "Enter" || event.nativeEvent.isComposing || event.repeat) return;
          const form = event.currentTarget.form ?? event.currentTarget.closest("form");
          if (!form) return;
          event.preventDefault();
          form.requestSubmit();
        }}
      />
      {value ? (
        <IconButton
          className="lui-search-field__clear"
          label={clearLabel}
          tooltip={false}
          size="small"
          disabled={disabled}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            onValueChange("");
            inputRef.current?.focus({ preventScroll: true });
          }}
        >
          <X aria-hidden="true" />
        </IconButton>
      ) : null}
    </search>
  );
  return !labelHidden || hint || supportLines ? (
    <FieldLayout
      controlId={id}
      label={label}
      labelHidden={labelHidden}
      hint={hint}
      supportLines={supportLines}
      className={containerClassName}
    >
      {control}
    </FieldLayout>
  ) : control;
});
