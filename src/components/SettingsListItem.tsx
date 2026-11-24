import type { ReactNode, Ref } from "react";
import { cx } from "../utils/cn.js";
import { Pressable, type PressableProps } from "./Pressable.js";

export type SettingsListItemProps = Omit<PressableProps, "children" | "pressed"> & {
  title: ReactNode;
  description?: ReactNode;
  leading?: ReactNode;
  trailing?: ReactNode;
  selected?: boolean;
  density?: "comfortable" | "compact";
  actionRef?: Ref<HTMLButtonElement>;
};

export function SettingsListItem({
  title,
  description,
  leading,
  trailing,
  selected,
  density = "comfortable",
  className,
  actionRef,
  ...props
}: SettingsListItemProps) {
  return (
    <Pressable
      {...props}
      ref={actionRef}
      {...(selected === undefined ? {} : { pressed: selected })}
      className={cx(
        "lui-settings-list-item grid w-full items-center gap-x-3 rounded-lui-sm px-3 py-2.5 text-left text-lui-fg-soft transition-colors hover:bg-lui-overlay-hover focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-lui-focus data-[selected=true]:bg-lui-overlay-selected",
        density === "compact" ? "min-h-lui-touch" : "min-h-lui-settings-item",
        leading ? "grid-cols-[auto_minmax(0,1fr)_auto]" : "grid-cols-[minmax(0,1fr)_auto]",
        className,
      )}
      data-selected={selected || undefined}
    >
      {leading ? <span className="grid shrink-0 place-items-center">{leading}</span> : null}
      <span className="grid min-w-0 gap-1">
        <strong className="truncate text-sm font-semibold leading-lui-control text-lui-fg">
          {title}
        </strong>
        {description ? (
          <span className="truncate text-lui-compact leading-lui-compact text-lui-fg-muted">
            {description}
          </span>
        ) : null}
      </span>
      {trailing ? (
        <span className="flex shrink-0 items-center text-lui-compact leading-lui-compact text-lui-fg-muted">
          {trailing}
        </span>
      ) : null}
    </Pressable>
  );
}
