import { X } from "lucide-react";
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { cx } from "../utils/cn.js";
import { IconButton } from "./IconButton.js";
import "../styles/components/tag-field.css";

export type TagFieldProps = {
  label: string;
  name: string;
  defaultValue: readonly string[];
  parseInput: (text: string) => readonly string[] | null;
  serializeValues: (values: readonly string[]) => string;
  invalidMessage: string;
  removeLabel: (value: string) => string;
  onValidationError?: (message: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

type TagDraft = { values: readonly string[]; text: string };

/** Chips and draft share one model; the named native field includes an uncommitted draft. */
export function TagField({
  label,
  name,
  defaultValue,
  parseInput,
  serializeValues,
  invalidMessage,
  removeLabel,
  onValidationError,
  placeholder,
  disabled = false,
  className,
}: TagFieldProps) {
  const id = useId();
  const labelId = `${id}-label`;
  const [draft, setDraft] = useState<TagDraft>(() => ({
    values: parseInput(serializeValues(defaultValue)) ?? [...defaultValue],
    text: "",
  }));
  const current = useRef(draft);
  const initial = useRef<TagDraft>(draft);
  const input = useRef<HTMLInputElement>(null);
  const serialized = useRef<HTMLInputElement>(null);
  const composing = useRef(false);
  const selectDraft = useRef(false);
  const rawText = useCallback(
    (value: TagDraft) => serializeValues([...value.values, ...(value.text ? [value.text] : [])]),
    [serializeValues],
  );
  const parsed = parseInput(rawText(draft));
  const invalid = parsed === null;

  const replace = useCallback(
    (next: TagDraft, notify = true) => {
      current.current = next;
      setDraft(next);
      const raw = rawText(next);
      const values = parseInput(raw);
      if (serialized.current) {
        serialized.current.value = values === null ? raw : serializeValues(values);
      }
      input.current?.setCustomValidity(values === null ? invalidMessage : "");
      if (values !== null) onValidationError?.(null);
      // Native FormData/dirty handlers must see the new value during this action,
      // including chip deletion (which has no text-input event of its own).
      if (notify) serialized.current?.dispatchEvent(new Event("input", { bubbles: true }));
    },
    [invalidMessage, onValidationError, parseInput, rawText, serializeValues],
  );

  const commit = useCallback(() => {
    const next = current.current;
    const values = parseInput(rawText(next));
    if (values === null) {
      input.current?.setCustomValidity(invalidMessage);
      onValidationError?.(invalidMessage);
      return false;
    }
    replace({ values, text: "" });
    return true;
  }, [invalidMessage, onValidationError, parseInput, rawText, replace]);

  useLayoutEffect(() => {
    input.current?.setCustomValidity(invalid ? invalidMessage : "");
    if (selectDraft.current && input.current) {
      selectDraft.current = false;
      input.current.focus();
      input.current.setSelectionRange(0, draft.text.length);
    }
  }, [draft.text, invalid, invalidMessage]);

  useEffect(() => {
    const form = input.current?.form;
    if (!form) return;
    const beforeSubmit = (event: Event) => {
      if (disabled) return;
      if (composing.current || !commit()) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    const reset = () => replace(initial.current, false);
    form.addEventListener("submit", beforeSubmit, true);
    form.addEventListener("reset", reset);
    return () => {
      form.removeEventListener("submit", beforeSubmit, true);
      form.removeEventListener("reset", reset);
    };
  }, [commit, disabled, replace]);

  return (
    <div className={cx("lui-field lui-tag-field", className)}>
      <label id={labelId} className="lui-field__label" htmlFor={id}>
        {label}
      </label>
      <label
        htmlFor={id}
        className={cx(
          "lui-field__control lui-tag-field__control",
          invalid && "lui-field__control--invalid",
        )}
        data-disabled={disabled || undefined}
      >
        {draft.values.map((value, index) => (
          <span className="lui-tag-field__chip" key={value}>
            <span className="lui-tag-field__value">{value}</span>
            <IconButton
              type="button"
              label={removeLabel(value)}
              tooltip={false}
              size="small"
              className="lui-tag-field__remove"
              disabled={disabled}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                replace({
                  ...current.current,
                  values: current.current.values.filter((_, item) => item !== index),
                });
                input.current?.focus();
              }}
              onKeyDown={(event) => {
                if (event.key === "Delete" || event.key === "Backspace") {
                  event.preventDefault();
                  replace({
                    ...current.current,
                    values: current.current.values.filter((_, item) => item !== index),
                  });
                  input.current?.focus();
                }
              }}
            >
              <X aria-hidden="true" />
            </IconButton>
          </span>
        ))}
        <input
          ref={input}
          id={id}
          type="text"
          className="lui-tag-field__input"
          value={draft.text}
          disabled={disabled}
          placeholder={placeholder}
          aria-labelledby={labelId}
          aria-invalid={invalid || undefined}
          onChange={(event) => replace({ ...current.current, text: event.currentTarget.value })}
          onCompositionStart={() => {
            composing.current = true;
          }}
          onCompositionEnd={(event) => {
            composing.current = false;
            replace({ ...current.current, text: event.currentTarget.value });
          }}
          onKeyDown={(event) => {
            if (composing.current || event.nativeEvent.isComposing || event.keyCode === 229) return;
            if (event.key === "Enter") {
              event.preventDefault();
              commit();
            } else if (
              event.key === "Backspace" &&
              !current.current.text &&
              current.current.values.length
            ) {
              event.preventDefault();
              const values = current.current.values;
              selectDraft.current = true;
              replace({ values: values.slice(0, -1), text: values[values.length - 1]! });
            }
          }}
          onPaste={(event) => {
            const text = event.clipboardData.getData("text/plain");
            if (!text.includes("#")) return;
            event.preventDefault();
            const node = event.currentTarget;
            const merged =
              node.value.slice(0, node.selectionStart ?? 0) +
              text +
              node.value.slice(node.selectionEnd ?? node.value.length);
            const next = { ...current.current, text: merged };
            const values = parseInput(rawText(next));
            replace(values === null ? next : { values, text: "" });
          }}
          onBlur={() => {
            if (!composing.current) commit();
          }}
        />
      </label>
      <input
        ref={serialized}
        type="hidden"
        name={name}
        value={parsed === null ? rawText(draft) : serializeValues(parsed)}
        disabled={disabled}
      />
    </div>
  );
}
