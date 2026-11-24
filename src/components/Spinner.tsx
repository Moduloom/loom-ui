import { translateUiSource } from "../i18n";
import { cx } from "../utils/cn.js";

export function Spinner({
  label = translateUiSource("正在加载"),
  size = "medium",
}: {
  label?: string;
  size?: "small" | "medium" | "large";
}) {
  return (
    <span className={cx("lui-spinner", `lui-spinner--${size}`)} role="status" aria-label={label} />
  );
}
