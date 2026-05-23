import { useEffect, useState } from "react";
import { getSidequestPhotoUrl } from "@/lib/uploads";
import { cn } from "@/lib/utils";
import { isVideoSrc } from "@/components/MediaViewer";

interface SidequestPhotoProps {
  /** A storage path inside the sidequest-photos bucket, OR a legacy data:/http(s) URL. */
  src: string;
  alt?: string;
  className?: string;
  /** Render as <video> instead of <img>. Auto-detects from src for legacy data: URLs. */
  asVideo?: boolean;
}

/**
 * Resolves a sidequest photo path to a signed URL and renders it.
 * Falls back transparently for legacy base64/full URL entries.
 */
const SidequestPhoto = ({ src, alt = "Photo", className, asVideo }: SidequestPhotoProps) => {
  const [resolved, setResolved] = useState<string | null>(null);

  const renderAsVideo = asVideo ?? isVideoSrc(src);

  useEffect(() => {
    let cancelled = false;
    setResolved(null);
    getSidequestPhotoUrl(src).then((url) => {
      if (!cancelled) setResolved(url);
    });
    return () => {
      cancelled = true;
    };
  }, [src]);

  if (!resolved) {
    return <div className={cn("bg-muted animate-pulse", className)} aria-label="Loading photo" />;
  }

  return renderAsVideo ? (
    <video src={resolved} className={className} muted controls />
  ) : (
    <img src={resolved} alt={alt} className={className} />
  );
};

export default SidequestPhoto;
