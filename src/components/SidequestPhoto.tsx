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

const SidequestPhoto = ({ src, alt = "Photo", className, asVideo, thumbnail }: SidequestPhotoProps) => {
  const [resolved, setResolved] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const renderAsVideo = asVideo ?? isVideoSrc(src);

  useEffect(() => {
    let cancelled = false;
    setResolved(null);
    setLoaded(false);
    getSidequestPhotoUrl(src).then((url) => {
      if (!cancelled) setResolved(url);
    });
    return () => {
      cancelled = true;
    };
  }, [src]);

  // Ref callbacks handle the case where a cached <img>/<video> completes
  // loading before React attaches onLoad handlers.
  const imgRef = useCallback((node: HTMLImageElement | null) => {
    if (node && node.complete && node.naturalWidth > 0) {
      setLoaded(true);
    }
  }, [resolved]);

  const videoRef = useCallback((node: HTMLVideoElement | null) => {
    if (node && node.readyState >= 1) {
      setLoaded(true);
    }
  }, [resolved]);

  const placeholder = (
    <div
      className={cn(
        "absolute inset-0 bg-muted animate-pulse transition-opacity duration-300",
        loaded ? "opacity-0 pointer-events-none" : "opacity-100"
      )}
      aria-hidden={loaded}
    />
  );

  if (renderAsVideo && thumbnail) {
    return (
      <div className={cn("relative overflow-hidden bg-muted", className)}>
        {resolved && (
          <video
            ref={videoRef}
            src={resolved}
            className={cn(
              "w-full h-full object-cover pointer-events-none transition-opacity duration-300",
              loaded ? "opacity-100" : "opacity-0"
            )}
            muted
            playsInline
            preload="metadata"
            onLoadedData={() => setLoaded(true)}
            onLoadedMetadata={() => setLoaded(true)}
            onCanPlay={() => setLoaded(true)}
            onError={() => setLoaded(true)}
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
            className={cn(
              "w-full h-full transition-opacity duration-300",
              loaded ? "opacity-100" : "opacity-0"
            )}
            muted
            controls
            onLoadedData={() => setLoaded(true)}
            onLoadedMetadata={() => setLoaded(true)}
            onCanPlay={() => setLoaded(true)}
            onError={() => setLoaded(true)}
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
          className={cn(
            "w-full h-full object-cover transition-opacity duration-300",
            loaded ? "opacity-100" : "opacity-0"
          )}
          onLoad={() => setLoaded(true)}
          onError={() => setLoaded(true)}
        />
      )}
      {placeholder}
    </div>
  );
};

export default SidequestPhoto;
