import { type ReactNode, type RefObject, useId } from "react";
import { Button } from "./Button.js";
import { Dialog, type DialogProps } from "./Dialog.js";
import { Toast } from "./Toast.js";

export type ConfirmationDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
  body: ReactNode;
  confirmLabel: string;
  cancelLabel: string;
  children?: ReactNode;
  description?: string;
  error?: ReactNode;
  busy?: boolean;
  cancelWhileBusy?: boolean;
  busyLabel?: string;
  disabled?: boolean;
  danger?: boolean;
  size?: DialogProps["size"];
  layer?: DialogProps["layer"];
  onExitComplete?: () => void;
  className?: string;
  bodyClassName?: string;
  returnFocusTarget?: RefObject<HTMLElement | null>;
};

export function ConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  body,
  confirmLabel,
  cancelLabel,
  children,
  description,
  error,
  busy = false,
  cancelWhileBusy = false,
  busyLabel,
  disabled = false,
  danger = false,
  size = "standard",
  layer = "nested",
  onExitComplete,
  className,
  bodyClassName,
  returnFocusTarget,
}: ConfirmationDialogProps) {
  const formId = useId();
  const hasBodyContent =
    (body !== null && body !== undefined) || (children !== null && children !== undefined);
  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(next) => (!busy || cancelWhileBusy) && onOpenChange(next)}
        {...(onExitComplete ? { onExitComplete } : {})}
        title={title}
        {...(description ? { description } : {})}
        size={size}
        layer={layer}
        dismissible={!busy || cancelWhileBusy}
        {...(className ? { className } : {})}
        bodyClassName={bodyClassName ?? (hasBodyContent ? "lui-confirmation-dialog__body" : "hidden")}
        {...(returnFocusTarget ? { returnFocusTarget } : {})}
        footer={
          <>
            <Button type="button" variant="ghost" disabled={busy && !cancelWhileBusy} onClick={() => onOpenChange(false)}>
              {cancelLabel}
            </Button>
            <Button
              type="submit"
              form={formId}
              variant={danger ? "danger" : "primary"}
              busy={busy}
              aria-label={busy ? busyLabel : undefined}
              disabled={disabled || busy}
            >
              {confirmLabel}
            </Button>
          </>
        }
      >
        <form
          id={formId}
          noValidate
          className="lui-confirmation-dialog__form"
          onSubmit={(event) => {
            event.preventDefault();
            if (!busy && !disabled) onConfirm();
          }}
        >
          {body !== null && body !== undefined ? (
            <div className="lui-confirmation-dialog__copy">{body}</div>
          ) : null}
          {children}
        </form>
      </Dialog>
      <Toast open={open && Boolean(error)} tone="danger" title={error} />
    </>
  );
}
