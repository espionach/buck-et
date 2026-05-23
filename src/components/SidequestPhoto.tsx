import { useEffect, useState } from "react";
import { Play } from "lucide-react";
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
  /** When true, renders as a non-interactive thumbnail with a play overlay for videos. */
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

  // Always render the placeholder in the same box; overlay the media on top
  // and fade it in once it has actually loaded. This avoids the
  // placeholder-disappears-then-image-appears flash.
  const placeholder = (
    <div
      className={cn(
        "absolute inset-0 bg-muted animate-pulse transition-opacity duration-300",
        loaded ? "opacity-0" : "opacity-100"
      )}
      aria-hidden={loaded}
    />
  );

  if (renderAsVideo && thumbnail) {
    return (
      <div className={cn("relative overflow-hidden bg-muted", className)}>
        {resolved && (
          <video
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
          />
        )}
        {placeholder}
        {loaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
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
            src={resolved}
            className={cn(
              "w-full h-full transition-opacity duration-300",
              loaded ? "opacity-100" : "opacity-0"
            )}
            muted
            controls
            onLoadedData={() => setLoaded(true)}
            onLoadedMetadata={() => setLoaded(true)}
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
          src={resolved}
          alt={alt}
          className={cn(
            "w-full h-full object-cover transition-opacity duration-300",
            loaded ? "opacity-100" : "opacity-0"
          )}
          onLoad={() => setLoaded(true)}
        />
      )}
      {placeholder}
    </div>
  );
};

export default SidequestPhoto;
