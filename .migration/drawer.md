# drawer

2026-09-20 — engine migration against the current shadcn CLI reference and installed Base UI 1.8 types. Both mobile drawers migrated; Vaul removed from the dependency manifests.

## Changed

- `src/components/ui/drawer.tsx`: Base UI Root, Backdrop, Viewport, Popup, Content and VirtualKeyboardProvider; retained the existing bottom-sheet appearance and handle slot. Entry/exit transitions use Base UI state attributes.
- `src/components/StationPicker.tsx`: `render` trigger, controlled `snapPoint`, popup initial focus, Base UI swipe-ignore region, and padding from the actual snap offset. Visible resting/expanded heights remain approximately 75%/92% of the viewport.
- `src/components/AboutDialog.tsx`: `render` trigger; desktop Dialog unchanged.
- Consumer tests: updated trigger composition and Base UI's presence-only expanded attribute.
- `src/globals.css`: removed Vaul padding/animation exceptions; positioned body for Base UI's iOS backdrop.
- `package.json` and `package-lock.json`: removed Vaul using npm in a temporary directory, then applied the resulting manifests after checking for concurrent edits. Shared `node_modules` was not modified. Radix packages still needed by cmdk remain transitive dependencies.
- README and project notes: updated drawer architecture only.
- Leftover scan: no Vaul or direct Radix imports remain in `src`. Zero wrappers remain on Radix.

## Left alone

- Existing uncommitted Tailwind work and unrelated components were preserved. No shared branch switch, commit, reset, deployment, or broad formatting was performed.
- The wrapper remains scoped to Headway's bottom sheets; unused horizontal and nested-drawer registry features were not introduced.

## Behavior changes

- Base UI owns swipe physics and keyboard-aware handling. Its snap values describe visible height, so `0.75` replaces Vaul's compensated `0.83` value.
- The backdrop retains full visibility at either snap point and fades on entry/exit. It does not fade proportionally during dragging; using Base UI's raw swipe-progress opacity would hide it at the resting snap.
- Focus returns after the closing transition completes.

## Verify by hand

- Open Stations without opening the keyboard, scroll to the final note, focus search to expand, select a station, and reopen at the resting height.
- Drag the handle upward to expand and downward to dismiss. Check Escape, outside press, About's Close button, and focus return.
- On a physical iPhone, check Safari/PWA software-keyboard behaviour, safe areas, and VoiceOver. These remain unverified.

Validation: baseline and final builds passed; all 155 tests passed. Chrome at 360px and 390px verified touch scrolling, reachable list end, both snap heights, swipe expansion/dismissal, visible backdrop, Escape/outside/Close dismissal, and focus return. Desktop Dialog retained at 900px. Light/dark styling and reduced-motion dismissal also passed browser checks.
