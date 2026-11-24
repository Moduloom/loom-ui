import type { ReactNode } from "react";
import { cx } from "../utils/cn.js";

export type SettingsControlRowProps = {
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
  density?: "default" | "compact";
  controlLayout?: "default" | "editor";
};

export function SettingsControlRow({
  title,
  description,
  children,
  className,
  density = "default",
  controlLayout = "default",
}: SettingsControlRowProps) {
  return (
    <div
      className={cx(
        "lui-settings-control-row",
        density === "compact" && "lui-settings-control-row--compact",
        controlLayout === "editor" && "lui-settings-control-row--editor",
        className,
      )}
    >
      <div className="lui-settings-control-row__copy">
        <span className="lui-settings-control-row__title">{title}</span>
        {description ? (
          <span className="lui-settings-control-row__description">{description}</span>
        ) : null}
      </div>
      <div className="lui-settings-control-row__control">{children}</div>
    </div>
  );
}
