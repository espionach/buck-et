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
    return (
      <div
        className={cn(
          "bg-muted flex flex-col items-center justify-center text-muted-foreground text-xs",
          className
        )}
        aria-label="Loading photo"
      >
        <span>Loading…</span>
      </div>
    );
  }


  if (renderAsVideo) {
    if (thumbnail) {
      return (
        <div className={cn("relative overflow-hidden bg-black", className)}>
          <video
            src={resolved}
            className="w-full h-full object-cover pointer-events-none"
            muted
            playsInline
            preload="metadata"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <div className="bg-black/60 rounded-full p-3">
              <Play className="w-6 h-6 text-white fill-white" />
            </div>
          </div>
        </div>
      );
    }
    return <video src={resolved} className={cn("transition-opacity duration-300", className)} muted controls />;
  }

  return <img src={resolved} alt={alt} className={cn("transition-opacity duration-300", className)} />;
};

export default SidequestPhoto;

