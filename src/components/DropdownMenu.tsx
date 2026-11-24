import { Check, ChevronRight } from "lucide-react";
import { Fragment, type KeyboardEvent, type ReactElement, type ReactNode, useEffect, useState } from "react";
import { translateUiSource } from "../i18n";
import { cx } from "../utils/cn.js";
import { Popover } from "./Popover.js";
import { DisclosureChevron } from "./DisclosureChevron.js";
import { OverlayScrollArea } from "./OverlayScrollArea.js";

export type DropdownMenuItem = {
  id: string;
  label: string;
  className?: string;
  icon?: ReactNode;
  description?: ReactNode;
  disabledReason?: ReactNode;
  groupId?: string;
  groupLabel?: ReactNode;
  separatorBefore?: boolean;
  tone?: "neutral" | "danger";
  danger?: boolean;
  disabled?: boolean;
  checked?: boolean;
  children?: readonly DropdownMenuItem[];
};

export type DropdownMenuProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  label: string;
  items: readonly DropdownMenuItem[];
  onSelect: (id: string) => void;
  trigger?: ReactElement;
  disabled?: boolean;
  anchorClassName?: string;
  panelClassName?: string;
  animatePresence?: boolean;
  overlayScroll?: boolean;
  matchTriggerWidth?: boolean;
  align?: "start" | "center" | "end";
  contentSized?: boolean;
  selectionMode?: "action" | "single";
  portalled?: boolean;
  header?: ReactNode;
  contextMenu?: boolean;
  side?: "bottom" | "right";
};

export function DropdownMenu({
  open,
  onOpenChange,
  label,
  items,
  onSelect,
  trigger,
  disabled,
  anchorClassName,
  panelClassName,
  animatePresence,
  overlayScroll = false,
  matchTriggerWidth = false,
  align = "start",
  contentSized = false,
  selectionMode = "action",
  portalled = true,
  header,
  contextMenu = false,
  side = "bottom",
}: DropdownMenuProps) {
  const defaultTrigger = (
    <button type="button" className="lui-menu-trigger" disabled={disabled} aria-label={label}>
      <span>{label}</span>
      <DisclosureChevron expanded={open} />
    </button>
  );
  const onMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const targets = Array.from(
      event.currentTarget.querySelectorAll<HTMLButtonElement>(
        ':is([role="menuitem"], [role="menuitemradio"]):not(:disabled)',
      ),
    );
    const currentTarget = (event.target as Element).closest?.(
      ':is([role="menuitem"], [role="menuitemradio"])',
    );
    const current = targets.indexOf(currentTarget as HTMLButtonElement);
    const direction = event.key === "ArrowDown" ? 1 : event.key === "ArrowUp" ? -1 : 0;
    if (targets.length === 0) return;
    if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      targets[event.key === "Home" ? 0 : targets.length - 1]?.focus();
      return;
    }
    if (!direction) return;
    event.preventDefault();
    targets[(current + direction + targets.length) % targets.length]?.focus();
  };
  const menu = (
    <div className="lui-dropdown-menu" role="menu" aria-label={label} onKeyDown={onMenuKeyDown}>
      {header ? (
        <>
          <div className="lui-dropdown-menu__header">{header}</div>
          {items.length ? <hr className="lui-dropdown-menu__separator" /> : null}
        </>
      ) : null}
      {items.map((item, index) => {
        const danger = item.tone === "danger" || item.danger;
        const className = cx(
          "lui-dropdown-menu__item",
          item.className,
          danger && "lui-dropdown-menu__item--danger",
          item.checked && "is-checked",
        );
        const selectItem = () => {
          onSelect(item.id);
          onOpenChange(false);
        };
        const previous = items[index - 1];
        const groupChanged = Boolean(
          item.groupLabel &&
            (index === 0 ||
              (item.groupId
                ? previous?.groupId !== item.groupId
                : previous?.groupLabel !== item.groupLabel)),
        );
        const prefix = (
          <>
            {item.separatorBefore || (groupChanged && index > 0) ? (
              <hr className="lui-dropdown-menu__separator" />
            ) : null}
            {groupChanged ? (
              <div className="lui-dropdown-menu__group-label" role="presentation">
                {item.groupLabel}
              </div>
            ) : null}
          </>
        );
        const description = item.disabledReason ?? item.description;
        if (item.children) {
          return <Fragment key={item.id}>{prefix}<DropdownSubmenu
            item={item} className={className} onSelect={onSelect}
            parentOpen={open} animatePresence={animatePresence} overlayScroll={overlayScroll}
              panelClassName={overlayScroll ? panelClassName : undefined} selectionMode={selectionMode}
            compact={contextMenu || panelClassName === "lui-context-menu"}
            onClose={() => onOpenChange(false)}
          /></Fragment>;
        }
        if (selectionMode === "single") {
          return (
            <Fragment key={item.id}>
              {prefix}
              <button
                type="button"
                role="menuitemradio"
                aria-checked={Boolean(item.checked)}
                disabled={item.disabled || Boolean(item.disabledReason)}
                className={className}
                onClick={selectItem}
              >
                <span className="lui-dropdown-menu__radio" aria-hidden="true">
                  <i />
                </span>
                <span className="lui-dropdown-menu__copy">
                  <span className="lui-dropdown-menu__label">{item.label}</span>
                  {description ? (
                    <small className="lui-dropdown-menu__description">{description}</small>
                  ) : null}
                </span>
              </button>
            </Fragment>
          );
        }
        return (
          <Fragment key={item.id}>
            {prefix}
            <button
              type="button"
              role="menuitem"
              disabled={item.disabled || Boolean(item.disabledReason)}
              className={className}
              onClick={selectItem}
            >
              {item.icon ? <span className="lui-dropdown-menu__icon">{item.icon}</span> : null}
              <span className="lui-dropdown-menu__copy">
                <span className="lui-dropdown-menu__label">{item.label}</span>
                {description ? (
                  <small className="lui-dropdown-menu__description">{description}</small>
                ) : null}
              </span>
              {item.checked ? <Check aria-label={translateUiSource("已选择")} /> : null}
            </button>
          </Fragment>
        );
      })}
    </div>
  );
  return (
    <Popover
      open={open}
      onOpenChange={(next) => { if (!disabled || !next) onOpenChange(next); }}
      trigger={trigger ?? defaultTrigger}
      label={label}
      align={align}
      matchTriggerWidth={matchTriggerWidth}
      contentSized={contentSized}
      portalled={portalled}
      animatePresence={animatePresence}
      contextMenu={contextMenu}
      side={side}
      className={cx(contextMenu && "lui-context-menu", overlayScroll && "lui-dropdown-popover", panelClassName)}
      {...(anchorClassName ? { anchorClassName } : {})}
    >
      {overlayScroll ? <OverlayScrollArea>{menu}</OverlayScrollArea> : menu}
    </Popover>
  );
}


function DropdownSubmenu({ item, className, onSelect, onClose, compact, parentOpen, animatePresence,
  overlayScroll, panelClassName, selectionMode }: {
  item: DropdownMenuItem; className: string; onSelect: (id: string) => void; onClose: () => void;
  compact: boolean; parentOpen: boolean; animatePresence?: boolean;
  overlayScroll: boolean; panelClassName?: string; selectionMode: 'action' | 'single';
}) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!parentOpen) setOpen(false);
  }, [parentOpen]);
  return <DropdownMenu
    open={parentOpen && open} onOpenChange={setOpen} label={item.label} animatePresence={animatePresence}
    side="right" contentSized items={item.children ?? []} overlayScroll={overlayScroll} selectionMode={selectionMode}
    panelClassName={cx(compact && "lui-context-menu", panelClassName)}
    onSelect={(id) => { onSelect(id); onClose(); }}
    trigger={<button type="button" role="menuitem" className={className}
      disabled={item.disabled}
      onPointerEnter={() => { if (!item.disabled) setOpen(true); }}
      onClick={(event) => { if (open) event.preventDefault(); }}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight") { event.preventDefault(); setOpen(true); }
        if (event.key === "ArrowLeft") { event.preventDefault(); setOpen(false); }
      }}>
      {item.icon ? <span className="lui-dropdown-menu__icon">{item.icon}</span> : null}
      <span className="lui-dropdown-menu__copy"><span className="lui-dropdown-menu__label">{item.label}</span></span>
      <ChevronRight aria-hidden="true" />
    </button>}
  />;
}
