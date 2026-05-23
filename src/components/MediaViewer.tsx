import { useEffect, useState, useCallback } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { getSidequestPhotoUrl } from "@/lib/uploads";
import { usePopup } from "@/hooks/use-popup";

export const isVideoSrc = (src: string) => {
  if (src.startsWith("data:video")) return true;
  const clean = src.split("?")[0].toLowerCase();
  return /\.(mp4|mov|webm|ogg|m4v)$/.test(clean);
};

interface MediaViewerProps {
  sources: string[];
  startIndex?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Module-level caches so flipping between slides doesn't re-show the
// placeholder for media that has already loaded once this session.
const slideUrlCache = new Map<string, string>();
const slideLoadedCache = new Set<string>();

const Slide = ({ src, onClose }: { src: string; onClose: () => void }) => {
  const [url, setUrl] = useState<string | null>(() => slideUrlCache.get(src) ?? null);
  const [loaded, setLoaded] = useState<boolean>(() => slideLoadedCache.has(src));

  useEffect(() => {
    const cached = slideUrlCache.get(src) ?? null;
    setUrl(cached);
    setLoaded(slideLoadedCache.has(src));
    if (cached) return;
    let cancelled = false;
    getSidequestPhotoUrl(src).then((u) => {
      if (cancelled || !u) return;
      slideUrlCache.set(src, u);
      setUrl(u);
    });
    return () => {
      cancelled = true;
    };
  }, [src]);

  const markLoaded = useCallback(() => {
    slideLoadedCache.add(src);
    setLoaded(true);
  }, [src]);

  const isVideo = isVideoSrc(src);

  return (
    <div className="relative inline-block">
      <div className="relative w-[85vw] h-[60vh] flex items-center justify-center">
        {!loaded && (
          <div
            className="absolute inset-0 bg-muted animate-pulse rounded-lg"
            aria-hidden
          />
        )}
        {url && (isVideo ? (
          <video
            ref={(node) => { if (node && node.readyState >= 1) markLoaded(); }}
            src={url}
            className="relative max-h-[85vh] max-w-[92vw] object-contain rounded-lg shadow-2xl"
            controls
            autoPlay
            playsInline
            onLoadedData={markLoaded}
            onLoadedMetadata={markLoaded}
            onCanPlay={markLoaded}
            onError={markLoaded}
          />
        ) : (
          <img
            ref={(node) => { if (node && node.complete && node.naturalWidth > 0) markLoaded(); }}
            src={url}
            alt=""
            className="relative max-h-[85vh] max-w-[92vw] object-contain rounded-lg shadow-2xl"
            onLoad={markLoaded}
            onError={markLoaded}
          />
        ))}
      </div>
      {loaded && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-sm transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

const MediaViewer = ({ sources, startIndex = 0, open, onOpenChange }: MediaViewerProps) => {
  usePopup(open);
  const [api, setApi] = useState<CarouselApi | null>(null);
  const [current, setCurrent] = useState(startIndex);

  useEffect(() => {
    if (open && api) {
      api.scrollTo(startIndex, true);
      setCurrent(startIndex);
    }
  }, [open, startIndex, api]);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setCurrent(api.selectedScrollSnap());
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  const close = () => onOpenChange(false);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
          className="fixed inset-0 z-50 flex items-center justify-center outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
        >
          <DialogPrimitive.Title className="sr-only">Media viewer</DialogPrimitive.Title>
          <Carousel
            className="w-full"
            opts={{ startIndex, loop: sources.length > 1 }}
            setApi={setApi}
          >
            <CarouselContent className="ml-0">
              {sources.map((src, i) => (
                <CarouselItem
                  key={i}
                  className="pl-0 flex items-center justify-center"
                  onClick={(e) => {
                    if (e.target === e.currentTarget) close();
                  }}
                >
                  <Slide src={src} onClose={close} />
                </CarouselItem>
              ))}
            </CarouselContent>
            {sources.length > 1 && (
              <>
                <CarouselPrevious className="left-4 h-10 w-10 bg-white/10 text-white border-white/20 hover:bg-white/20" />
                <CarouselNext className="right-4 h-10 w-10 bg-white/10 text-white border-white/20 hover:bg-white/20" />
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/90 text-xs bg-black/50 rounded-full px-3 py-1 backdrop-blur-sm">
                  {current + 1} / {sources.length}
                </div>
              </>
            )}
          </Carousel>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};

export default MediaViewer;
