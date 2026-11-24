import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import {
  isValidElement,
  type ReactElement,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import { isTooltipFocusSuppressed } from "../hooks/focusRestore.js";

export type TooltipProps = {
  children: ReactNode;
  label: string;
  side?: "top" | "right" | "bottom" | "left";
  disabled?: boolean;
};

export function Tooltip({ children, label, side = "top", disabled = false }: TooltipProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);

  if (disabled || !isValidElement(children)) return <>{children}</>;
  return (
    <TooltipPrimitive.Provider delayDuration={350}>
      <TooltipPrimitive.Root
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setOpen(false);
            return;
          }
          const trigger = triggerRef.current;
          if (
            trigger &&
            !isTooltipFocusSuppressed(trigger) &&
            (trigger.matches(":hover") || trigger.matches(":focus-visible"))
          ) {
            setOpen(true);
          }
        }}
      >
        <TooltipPrimitive.Trigger ref={triggerRef} asChild>
          {children as ReactElement}
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content className="lui-tooltip" side={side} sideOffset={7}>
            {label}
            <TooltipPrimitive.Arrow className="lui-tooltip__arrow" asChild>
              <svg aria-hidden="true">
                <path className="lui-tooltip__arrow-fill" d="M0 -2H30V0L15 10Z" />
                <path className="lui-tooltip__arrow-outline" d="M0 0L15 10L30 0" />
              </svg>
            </TooltipPrimitive.Arrow>
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
