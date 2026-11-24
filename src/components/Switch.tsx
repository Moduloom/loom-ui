import { useId } from "react";
import { cx } from "../utils/cn.js";

export type SwitchProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean | undefined;
  description?: string | undefined;
  className?: string | undefined;
  labelHidden?: boolean;
};

export function Switch({
  checked,
  onCheckedChange,
  label,
  disabled,
  description,
  className,
  labelHidden = false,
}: SwitchProps) {
  const descriptionId = useId();
  return (
    <label className={cx("lui-settings-control-row", "lui-switch-field", labelHidden && "lui-switch-field--control", className)}>
      <span className={cx("lui-settings-control-row__copy lui-switch-field__copy",labelHidden && 'lui-visually-hidden')}>
        <span className="lui-settings-control-row__title">{label}</span>
        {description ? (
          <small className="lui-settings-control-row__description" id={descriptionId}>
            {description}
          </small>
        ) : null}
      </span>
      <button
        type="button"
        role="switch"
        aria-label={label}
        aria-checked={checked}
        aria-describedby={description ? descriptionId : undefined}
        disabled={disabled}
        className="lui-settings-control-row__control lui-switch"
        onClick={() => onCheckedChange(!checked)}
      >
        <span className="lui-switch__thumb" aria-hidden="true" />
      </button>
    </label>
  );
}
