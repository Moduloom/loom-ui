import type { ImgHTMLAttributes, ReactNode, SyntheticEvent } from "react";
import { useState } from "react";

export type ResilientImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "alt"> & {
  src?: string | null | undefined;
  alt: string;
  fallback?: ReactNode;
};

export function ResilientImage({
  src,
  alt,
  fallback = null,
  onError,
  ...props
}: ResilientImageProps) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  if (!src || failedSource === src) return fallback;
  const handleError = (event: SyntheticEvent<HTMLImageElement>) => {
    setFailedSource(src);
    onError?.(event);
  };
  return <img {...props} src={src} alt={alt} onError={handleError} />;
}
