# popover

2026-09-19 · engine (legacy new-york) · migrated to Base UI Popover.

## Changed

- src/components/ui/popover.tsx:2 replaces Radix with Base UI and introduces Portal > Positioner > Popup. All four positioning props are forwarded to Positioner. Existing panel styling survives with Base UI transition attributes and transform-origin variable.
- Leftover scan for radix-ui/@radix-ui is clean.

## Left alone

No current app consumers use Popover. Vaul and cmdk are unrelated and retained.

## Behavior changes

PopoverAnchor is an inert div because Base UI has no matching Anchor part; it has no consumers in this project. Use Positioner's anchor option for future detached anchoring.

## Verify by hand

When introducing a consumer, check trigger toggle, outside press, Escape, focus return and placement on all viewport edges. Current migration checks wrapper types and the absence of app consumers.
