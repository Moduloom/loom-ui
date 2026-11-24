import { cx } from "../utils/cn.js";

export type CountBadgeProps = {
  count: number;
  label?: string;
  placement?: "inline" | "rail";
  size?: "default" | "compact";
  className?: string;
};

export function CountBadge({
  count,
  label,
  placement = "inline",
  size = "default",
  className,
}: CountBadgeProps) {
  if (count <= 0) return null;
  const display = count > 99 ? "99+" : String(count);
  const wide = count > 9;
  const compact = size === "compact";
  return (
    <b
      className={cx(
        "inline-grid shrink-0 place-items-center bg-lui-danger-strong font-bold not-italic leading-none text-lui-on-accent",
        compact ? "h-4.5 min-w-4.5 text-lui-micro" : "h-5 min-w-5 text-lui-micro",
        wide
          ? "rounded-lui-pill px-1.5"
          : compact
            ? "w-4.5 rounded-lui-circle px-0"
            : "w-5 rounded-lui-circle px-0",
        placement === "rail" && "border-[3px] border-lui-surface-sunken",
        className,
      )}
      role="status"
      aria-label={label}
    >
      {display}
    </b>
  );
}
