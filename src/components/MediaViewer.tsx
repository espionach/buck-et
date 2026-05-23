import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { getSidequestPhotoUrl } from "@/lib/uploads";
import { cn } from "@/lib/utils";
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

const Slide = ({ src }: { src: string }) => {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    setUrl(null);
    getSidequestPhotoUrl(src).then((u) => {
      if (!cancelled) setUrl(u);
    });
    return () => {
      cancelled = true;
    };
  }, [src]);

  if (!url) {
    return <div className="w-full h-full flex items-center justify-center text-white/60 text-sm">Loading…</div>;
  }
  return isVideoSrc(src) ? (
    <video
      src={url}
      className="max-h-[90vh] max-w-full object-contain"
      controls
      autoPlay
      playsInline
    />
  ) : (
    <img src={url} alt="" className="max-h-[90vh] max-w-full object-contain" />
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "max-w-none w-screen h-screen p-0 border-0 bg-black/95 rounded-none translate-x-[-50%] translate-y-[-50%]",
          "flex items-center justify-center"
        )}
      >
        <Carousel
          className="w-full h-full"
          opts={{ startIndex, loop: sources.length > 1 }}
          setApi={setApi}
        >
          <CarouselContent className="h-screen ml-0">
            {sources.map((src, i) => (
              <CarouselItem
                key={i}
                className="pl-0 h-screen flex items-center justify-center"
              >
                <Slide src={src} />
              </CarouselItem>
            ))}
          </CarouselContent>
          {sources.length > 1 && (
            <>
              <CarouselPrevious className="left-4 h-10 w-10 bg-white/10 text-white border-white/20 hover:bg-white/20" />
              <CarouselNext className="right-4 h-10 w-10 bg-white/10 text-white border-white/20 hover:bg-white/20" />
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/80 text-xs bg-black/40 rounded-full px-3 py-1">
                {current + 1} / {sources.length}
              </div>
            </>
          )}
        </Carousel>
      </DialogContent>
    </Dialog>
  );
};

export default MediaViewer;
