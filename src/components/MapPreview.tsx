import { useEffect, useRef } from "react";
import { loadGoogleMaps } from "@/lib/googleMapsLoader";

interface Props {
  lat: number;
  lng: number;
}

const MapPreview = ({ lat, lng }: Props) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then((g) => {
        if (cancelled || !containerRef.current) return;
        if (!mapRef.current) {
          mapRef.current = new g.maps.Map(containerRef.current, {
            center: { lat, lng },
            zoom: 15,
            disableDefaultUI: true,
            gestureHandling: "cooperative",
            clickableIcons: false,
          });
          markerRef.current = new g.maps.Marker({
            position: { lat, lng },
            map: mapRef.current,
          });
        } else {
          mapRef.current.setCenter({ lat, lng });
          markerRef.current.setPosition({ lat, lng });
        }
      })
      .catch(() => {
        /* preview is optional */
      });
    return () => {
      cancelled = true;
    };
  }, [lat, lng]);

  return (
    <div className="mt-2 rounded-xl overflow-hidden border border-border bg-muted">
      <div ref={containerRef} className="w-full h-[140px]" />
    </div>
  );
};

export default MapPreview;