# scroll-area

2026-09-19 · engine (legacy new-york) · migrated to Base UI ScrollArea.

## Changed

- src/components/ui/scroll-area.tsx:2 uses Base UI Root/Viewport/Content/Scrollbar/Thumb/Corner. The thumb uses Base UI's measured sizing. Hover/scroll visibility uses the new data attributes.
- src/globals.css changes the iOS PWA viewport selector to the stable data-slot attribute.
- Leftover scan for radix-ui/@radix-ui is clean in both files.

## Left alone

DeparturesTable already uses only shared ScrollArea props and needs no API changes. Vaul's station list remains independently scrollable and unchanged.

## Behavior changes

Scrollbar visibility is now controlled by CSS using Base UI hovering/scrolling attributes; the obsolete Radix type and scrollHideDelay props have no consumers.

## Verify by hand

Scroll each departures pane independently with mouse, touch and keyboard. Check the thumb stays correctly sized and the direction heading stays fixed.
