import type { ReactNode } from "react";

export function ProfileSection({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="lui-profile-section">
      <h3 className="lui-profile-section-label">{label}</h3>
      {children}
    </section>
  );
}
