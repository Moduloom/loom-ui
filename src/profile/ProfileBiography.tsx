import { ProfileSection } from "./ProfileSection";
import { translateSource } from "../labels";

export function ProfileBiography({ bio, empty = false }: { bio: string | null; empty?: boolean }) {
  if (!bio && !empty) return null;
  return (
    <ProfileSection label={translateSource("个人简介")}>
      {bio ? (
        <p className="lui-profile-bio">{bio}</p>
      ) : (
        <p className="lui-profile-bio lui-profile-bio--empty">
          {translateSource("还没有个人简介")}
        </p>
      )}
    </ProfileSection>
  );
}
