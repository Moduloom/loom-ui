import { useEffect, useState } from "react";
import { cx } from "../utils/cn.js";
import { avatarInitial, avatarToneIndex } from "./avatarTone.js";

export type AvatarProps = {
  name: string;
  seed?: string | null | undefined;
  src?: string | null | undefined;
  size?: "xsmall" | "small" | "medium" | "large" | "stage";
  className?: string | undefined;
  statusLabel?: string;
  fallbackMode?: "image" | "initial";
};

const loadedAvatarSources = new Map<string, true>();
const maxRememberedAvatars = 256;

export function clearAvatarLoadMemory(): void {
  loadedAvatarSources.clear();
}

function rememberLoadedAvatar(source: string): void {
  loadedAvatarSources.delete(source);
  loadedAvatarSources.set(source, true);
  while (loadedAvatarSources.size > maxRememberedAvatars) {
    loadedAvatarSources.delete(loadedAvatarSources.keys().next().value!);
  }
}

export function Avatar({
  name,
  seed,
  src,
  size = "medium",
  className,
  statusLabel,
  fallbackMode = "image",
}: AvatarProps) {
  const fallback = avatarInitial(name);
  const tone = String(avatarToneIndex(seed ?? name));
  const imageSource = src ?? null;
  const identity = seed ?? name;
  const [displayed, setDisplayed] = useState<{ identity: string; src: string } | null>(() =>
    imageSource && loadedAvatarSources.has(imageSource) ? { identity, src: imageSource } : null,
  );
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const displayedSource = imageSource && displayed?.identity === identity ? displayed.src : null;
  const imageLoaded = Boolean(displayedSource);

  useEffect(() => {
    if (imageSource && loadedAvatarSources.has(imageSource)) {
      setDisplayed({ identity, src: imageSource });
    }
  }, [identity, imageSource]);
  const imageFailed = Boolean(imageSource && failedSource === imageSource);
  const showFallback = !displayedSource || (fallbackMode === "initial" && !imageLoaded);
  return (
    <span
      className={cx(
        "lui-avatar",
        `lui-avatar--${size}`,
        imageLoaded && "lui-avatar--image-loaded",
        className,
      )}
      role="img"
      aria-label={statusLabel ? `${name}，${statusLabel}` : name}
    >
      {showFallback ? (
        <span className="lui-avatar-tone lui-avatar__fallback" data-tone={tone}>
          {fallback}
        </span>
      ) : null}
      {displayedSource ? (
        <img
          className="lui-avatar__current"
          src={displayedSource}
          alt=""
          draggable={false}
          onError={() => {
            setDisplayed(null);
            setFailedSource(displayedSource);
          }}
        />
      ) : null}
      {imageSource && imageSource !== displayedSource && !imageFailed ? (
        <img
          className="lui-avatar__incoming"
          src={imageSource}
          alt=""
          draggable={false}
          onLoad={() => {
            rememberLoadedAvatar(imageSource);
            setDisplayed({ identity, src: imageSource });
            setFailedSource(null);
          }}
          onError={() => setFailedSource(imageSource)}
        />
      ) : null}
    </span>
  );
}
