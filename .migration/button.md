# button

2026-09-19 · engine (legacy new-york) · migrated to Base UI Button.

## Changed

- src/components/ui/button.tsx:2 uses the real Base UI Button primitive and its render prop; existing sizes, variants, focus styles and plain picker buttons preserved.
- src/components/ui/button.test.tsx:31 exercises custom render composition.
- package.json and package-lock.json add @base-ui/react alongside Radix during migration.
- Leftover scan for radix-ui/@radix-ui in this component is clean.

## Left alone

Vaul drawer and cmdk command are intentionally retained. Their consumers still use the composition API owned by those libraries.

## Behavior changes

Custom non-button elements use render and nativeButton=false. Base UI Button preserves button semantics; use a plain anchor with buttonVariants for navigation links.

## Verify by hand

Open the picker, toggle a favourite, select a station, and use Tab/Enter on the trigger. Confirm one DOM button per action and visible keyboard focus.
