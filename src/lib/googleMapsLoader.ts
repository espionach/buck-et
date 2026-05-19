// Loads the Google Maps JS API exactly once and resolves when ready.
let loadPromise: Promise<any> | null = null;

export function loadGoogleMaps(): Promise<any> {
  if (typeof window === "undefined") return Promise.reject(new Error("No window"));
  if ((window as any).google?.maps) return Promise.resolve((window as any).google);
  if (loadPromise) return loadPromise;

  const key = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY as string | undefined;
  const channel = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID as string | undefined;
  if (!key) return Promise.reject(new Error("Google Maps browser key missing"));

  loadPromise = new Promise((resolve, reject) => {
    const cbName = `__gmapsCb_${Math.random().toString(36).slice(2)}`;
    (window as any)[cbName] = () => {
      const g = (window as any).google;
      delete (window as any)[cbName];
      if (g?.maps) resolve(g);
      else reject(new Error("Google Maps failed to initialize"));
    };
    const params = new URLSearchParams({
      key,
      loading: "async",
      callback: cbName,
      ...(channel ? { channel } : {}),
    });
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      delete (window as any)[cbName];
      loadPromise = null;
      reject(new Error("Failed to load Google Maps script"));
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}