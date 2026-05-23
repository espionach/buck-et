## Plan

1. **Keep the placeholder mounted until media is actually ready**
   - Update `SidequestPhoto` so the pulsing placeholder stays visible behind/over the media while the image/video source resolves and the media finishes loading.
   - Avoid the current sequence where the placeholder disappears as soon as a URL is resolved, before the browser has rendered the image.

2. **Fade media in smoothly**
   - Render the image/video immediately after the URL is resolved, but start it at `opacity-0`.
   - On `onLoad` for images and `onLoadedData`/`onLoadedMetadata` for videos, transition media to full opacity while fading out the placeholder.

3. **Apply the same behavior everywhere quest media appears**
   - Quest cards and quest details already share `SidequestPhoto`, so this will cover both.
   - Update `MediaViewer` fullscreen slides with the same placeholder-under-media fade-in pattern so swiping fullscreen media does not flash or jump.

4. **Preserve layout size and current visuals**
   - Keep existing media dimensions, rounded corners, video play overlays, and fullscreen viewer controls unchanged.
   - Only change the loading behavior to remove the placeholder-disappear-then-image-appear glitch.