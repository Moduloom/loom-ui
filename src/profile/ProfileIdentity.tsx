import type { ReactNode } from "react";

export function ProfileIdentity({
  name,
  publicId,
  actions,
}: {
  name: string;
  publicId: string | null;
  actions?: ReactNode;
}) {
  return (
    <div className="lui-profile-identity">
      <div className="lui-profile-identity-copy">
        <h2 id="lui-profile-name" className="lui-profile-name">
          {name}
        </h2>
        {publicId ? <p className="lui-profile-publicId">{publicId}</p> : null}
      </div>
      {actions}
    </div>
  );
}
