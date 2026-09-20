# dialog

2026-09-19 · engine (legacy new-york) · migrated to Base UI Dialog.

## Changed

- src/components/ui/dialog.tsx:4 uses Base UI Backdrop/Popup, transition lifecycle attributes, and render composition while retaining custom styling.
- src/components/StationPicker.tsx desktop trigger uses render; initialFocus targets search.
- src/components/AboutDialog.tsx desktop trigger uses render with the existing AboutTrigger.
- Leftover scan for radix-ui/@radix-ui in the dialog wrapper is clean.

## Left alone

src/components/ui/drawer.tsx and mobile DrawerTrigger asChild belong to Vaul and are intentionally unchanged. Command remains cmdk and inherits this shared dialog wrapper.

## Behavior changes

Base UI retains the popup during CSS exit transitions and uses initialFocus/finalFocus instead of Radix autofocus events. Its default touch focus goes to the popup; the desktop station picker explicitly focuses search as before.

## Verify by hand

At desktop width, open station search, filter/select, press Escape and tap the backdrop. Confirm focus returns to the trigger. Open About and confirm Close/Escape dismiss it; check mobile drawers still work.
