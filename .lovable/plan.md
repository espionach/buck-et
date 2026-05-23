## Plan

1. Update the shared quest media renderer (`SidequestPhoto`) so loading only applies before the first successful render for a given source.
   - Cache resolved URLs by source so already-seen images/videos do not briefly reset to placeholder on remount.
   - Cache loaded sources so returning to a card/profile/detail view does not re-enable pulsing or opacity transitions.
   - Keep the placeholder only while there is no rendered media yet.

2. Remove the fade/pulse behavior after media has loaded.
   - Once an image/video is ready, render it at stable full opacity.
   - Avoid resetting `loaded` to false when the same source is already known to be loaded.
   - Keep error handling from leaving an item stuck in loading state.

3. Apply the same stability rules to fullscreen media (`MediaViewer`).
   - Use the same resolved/loaded cache pattern for fullscreen slides.
   - Do not hide the media again during carousel/open-close remounts if it has already loaded.

4. Preserve the existing UI behavior.
   - No changes to layout, borders, fullscreen close button placement, carousel controls, or media sizing.
   - Only the image/video loading lifecycle changes so quest card, quest detail, profile previews, and fullscreen player stop randomly flashing or pulsing.