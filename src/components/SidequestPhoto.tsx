import { useEffect, useState, useCallback } from "react";
import { Play } from "lucide-react";
import { getSidequestPhotoUrl } from "@/lib/uploads";
import { cn } from "@/lib/utils";
import { isVideoSrc } from "@/components/MediaViewer";

interface SidequestPhotoProps {
  src: string;
  alt?: string;
  className?: string;
  asVideo?: boolean;
  thumbnail?: boolean;
}

// Module-level caches so remounting a media element for a source we've
// already resolved/loaded doesn't briefly flash a pulsing placeholder.
const urlCache = new Map<string, string>();
const loadedCache = new Set<string>();

const SidequestPhoto = ({ src, alt = "Photo", className, asVideo, thumbnail }: SidequestPhotoProps) => {
  const [resolved, setResolved] = useState<string | null>(() => urlCache.get(src) ?? null);
  const [loaded, setLoaded] = useState<boolean>(() => loadedCache.has(src));
  const renderAsVideo = asVideo ?? isVideoSrc(src);

  useEffect(() => {
    const cached = urlCache.get(src) ?? null;
    setResolved(cached);
    setLoaded(loadedCache.has(src));
    if (cached) return;
    let cancelled = false;
    getSidequestPhotoUrl(src).then((url) => {
      if (cancelled || !url) return;
      urlCache.set(src, url);
      setResolved(url);
    });
    return () => {
      cancelled = true;
    };
  }, [src]);

  const markLoaded = useCallback(() => {
    loadedCache.add(src);
    setLoaded(true);
  }, [src]);

  // Ref callbacks handle the case where a cached <img>/<video> completes
  // loading before React attaches onLoad handlers.
  const imgRef = useCallback(
    (node: HTMLImageElement | null) => {
      if (node && node.complete && node.naturalWidth > 0) markLoaded();
    },
    [markLoaded, resolved]
  );

  const videoRef = useCallback(
    (node: HTMLVideoElement | null) => {
      if (node && node.readyState >= 1) markLoaded();
    },
    [markLoaded, resolved]
  );

  // Only show the placeholder while we genuinely have nothing to display.
  // Once loaded, we unmount it entirely so it can't re-trigger animations.
  const showPlaceholder = !loaded;
  const placeholder = showPlaceholder ? (
    <div
      className="absolute inset-0 bg-muted animate-pulse"
      aria-hidden
    />
  ) : null;

  if (renderAsVideo && thumbnail) {
    return (
      <div className={cn("relative overflow-hidden bg-muted", className)}>
        {resolved && (
          <video
            ref={videoRef}
            src={resolved}
            className="w-full h-full object-cover pointer-events-none"
            muted
            playsInline
            preload="metadata"
            onLoadedData={markLoaded}
            onLoadedMetadata={markLoaded}
            onCanPlay={markLoaded}
            onError={markLoaded}
          />
        )}
        {placeholder}
        {loaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
            <div className="bg-black/60 rounded-full p-3">
              <Play className="w-6 h-6 text-white fill-white" />
            </div>
          </div>
        )}
      </div>
    );
  }

  if (renderAsVideo) {
    return (
      <div className={cn("relative overflow-hidden bg-muted", className)}>
        {resolved && (
          <video
            ref={videoRef}
            src={resolved}
            className="w-full h-full"
            muted
            controls
            onLoadedData={markLoaded}
            onLoadedMetadata={markLoaded}
            onCanPlay={markLoaded}
            onError={markLoaded}
          />
        )}
        {placeholder}
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden bg-muted", className)}>
      {resolved && (
        <img
          ref={imgRef}
          src={resolved}
          alt={alt}
          className="w-full h-full object-cover"
          onLoad={markLoaded}
          onError={markLoaded}
        />
      )}
      {placeholder}
    </div>
  );
};

export default SidequestPhoto;
