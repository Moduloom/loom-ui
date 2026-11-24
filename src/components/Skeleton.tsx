import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { cx } from "../utils/cn.js";

export type SkeletonProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: "text" | "circle" | "rectangle";
  width?: CSSProperties["width"];
  height?: CSSProperties["height"];
};

export function Skeleton({
  variant = "text",
  width,
  height,
  className,
  style,
  ...props
}: SkeletonProps) {
  return (
    <span
      {...props}
      className={cx("lui-skeleton", `lui-skeleton--${variant}`, className)}
      style={{
        ...style,
        ...(width !== undefined ? { width } : {}),
        ...(height !== undefined ? { height } : {}),
      }}
      aria-hidden="true"
    />
  );
}

export function SkeletonGroup({
  label,
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement> & { label: string; children: ReactNode }) {
  return (
    <div {...props} className={cx("lui-skeleton-group", className)} role="status" aria-label={label}>
      {children}
    </div>
  );
}

export function SkeletonList({
  count,
  avatar = false,
  className,
}: {
  count: number;
  avatar?: boolean;
  className?: string;
}) {
  return (
    <div className={cx("lui-skeleton-list", className)} aria-hidden="true">
      {Array.from({ length: Math.max(0, count) }, (_, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static presentation rows have no identity or state
        <div className="lui-skeleton-list__row" key={index}>
          {avatar ? <Skeleton variant="circle" className="lui-skeleton-list__avatar" /> : null}
          <span className="lui-skeleton-list__copy">
            <Skeleton width={`${62 + (index % 3) * 9}%`} />
            <Skeleton width={`${38 + (index % 2) * 13}%`} />
          </span>
        </div>
      ))}
    </div>
  );
}
