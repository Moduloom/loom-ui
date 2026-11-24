import { AlertCircle, AlertTriangle, CheckCircle2, Info } from "lucide-react";

export type FeedbackTone = "info" | "success" | "warning" | "danger";

export function FeedbackIcon({ tone }: { tone: FeedbackTone }) {
  const Icon =
    tone === "success"
      ? CheckCircle2
      : tone === "warning"
        ? AlertTriangle
        : tone === "danger"
          ? AlertCircle
          : Info;
  return <Icon aria-hidden="true" />;
}
