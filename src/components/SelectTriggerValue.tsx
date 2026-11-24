import { cx } from "../utils/cn.js";

/** Reserve label width without letting hidden labels increase the trigger height. */
export function SelectTriggerValue({
  value,
  labels,
  placeholder = false,
}: {
  value: string | undefined;
  labels: readonly string[];
  placeholder?: boolean;
}) {
  return (
    <span className="lui-select__content">
      <span
        className={cx("lui-select__value", placeholder && "lui-select__value--placeholder")}
        title={value}
      >
        {value}
      </span>
      <span className="lui-select__measure" aria-hidden="true">
        {Array.from(new Set(labels)).map((label) => (
          <span key={label}>{label}</span>
        ))}
      </span>
    </span>
  );
}
