import { LoaderCircle } from "lucide-react";
import type { ReactNode, Ref } from "react";
import { cx } from "../utils/cn.js";
import { FeedbackIcon, type FeedbackTone } from "./FeedbackIcon.js";

export type TopMessageKind = "info" | "success" | "warning" | "error" | "reconnecting";
export type TopMessagePlacement = "inline" | "overlay" | "fixed";

export type TopMessageProps = {
  kind?: TopMessageKind;
  placement?: TopMessagePlacement;
  title?: ReactNode;
  children?: ReactNode;
  meta?: ReactNode;
  state?: "open" | "closed";
  ref?: Ref<HTMLDivElement>;
  className?: string;
};

export function TopMessage({
  kind = "info",
  placement = "inline",
  title,
  children,
  meta,
  state = "open",
  ref,
  className,
}: TopMessageProps) {
  return (
    <div
      ref={ref}
      className={cx(
        "lui-top-message",
        `lui-top-message--${kind}`,
        `lui-top-message--${placement}`,
        className,
      )}
      role={kind === "error" ? "alert" : "status"}
      aria-live={kind === "error" ? "assertive" : "polite"}
      data-top-message-kind={kind}
      data-state={state}
    >
      <span className="lui-top-message__icon" aria-hidden="true">
        {kind === "reconnecting" ? (
          <LoaderCircle className="lui-top-message__spinner" />
        ) : (
          <FeedbackIcon tone={feedbackTone(kind)} />
        )}
      </span>
      <span className="lui-top-message__content">
        {title ? <strong>{title}</strong> : null}
        {children ? <span>{children}</span> : null}
        {meta ? <small>{meta}</small> : null}
      </span>
    </div>
  );
}

function feedbackTone(kind: Exclude<TopMessageKind, "reconnecting">): FeedbackTone {
  return kind === "error" ? "danger" : kind;
}
