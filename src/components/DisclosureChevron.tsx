import { type AnimationEvent, useLayoutEffect, useRef, useState } from "react";
import { cx } from "../utils/cn.js";

export type DisclosureChevronProps = {
  expanded: boolean;
  className?: string;
};

type ChevronMotion = "opening" | "closing" | null;

/** A compact two-stroke chevron for controls that disclose vertical content. */
export function DisclosureChevron({ expanded, className }: DisclosureChevronProps) {
  const previousExpanded = useRef(expanded);
  const [motion, setMotion] = useState<ChevronMotion>(null);

  useLayoutEffect(() => {
    if (previousExpanded.current === expanded) return;
    previousExpanded.current = expanded;
    setMotion(expanded ? "opening" : "closing");
  }, [expanded]);

  const finishMotion = (event: AnimationEvent<SVGPathElement>) => {
    if (event.currentTarget.dataset.stroke === "left") setMotion(null);
  };

  return (
    <svg
      className={cx("lui-disclosure-chevron", className)}
      viewBox="0 0 20 20"
      width="20"
      height="20"
      fill="none"
      aria-hidden="true"
      data-expanded={expanded ? "true" : "false"}
      data-motion={motion ?? undefined}
    >
      <path
        className="lui-disclosure-chevron__stroke lui-disclosure-chevron__joined"
        d="M4.8 6.8 8.85 10.15 Q10 11.9 11.15 10.15 L15.2 6.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        className="lui-disclosure-chevron__stroke lui-disclosure-chevron__motion-stroke lui-disclosure-chevron__stroke--left"
        data-stroke="left"
        d="M4.8 6.8 10 11.05"
        pathLength="1"
        strokeLinecap="round"
        strokeLinejoin="round"
        onAnimationEnd={finishMotion}
      />
      <path
        className="lui-disclosure-chevron__stroke lui-disclosure-chevron__motion-stroke lui-disclosure-chevron__stroke--right"
        data-stroke="right"
        d="M15.2 6.8 10 11.05"
        pathLength="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
