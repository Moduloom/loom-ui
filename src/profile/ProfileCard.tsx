import type { ReactNode } from "react";
import { ProfileBanner } from "./ProfileBanner";

export function ProfileCard({
  layout,
  close,
  avatar,
  banner,
  bannerUrl = null,
  statusLabel,
  children,
}: {
  layout: "popout" | "detail";
  close?: ReactNode | undefined;
  avatar: ReactNode;
  banner?: ReactNode | undefined;
  bannerUrl?: string | null | undefined;
  statusLabel?: string | null | undefined;
  children: ReactNode;
}) {
  return (
    <div className={`lui-profile lui-profile-card lui-profile-card--preview lui-profile--${layout}`}>
      {layout === "popout"
        ? (banner ?? (
            <ProfileBanner
              bannerUrl={bannerUrl}
              close={close}
            />
          ))
        : null}
      <div className="lui-profile-body">
        <section className="lui-profile-panel">
          <div className="lui-profile-avatar-anchor">
            <div className="lui-profile-avatar">{avatar}</div>
            {statusLabel ? (
              <span className="lui-profile-status-bubble">{statusLabel}</span>
            ) : null}
          </div>
          {children}
        </section>
      </div>
    </div>
  );
}
