# Station picker design QA

Scope: first implementation of the station picker from the supplied screenshots; main departures overhaul remains a subsequent change.

final result: passed

## Evidence

- Reference: supplied `codex-clipboard-09a87ff4-1728-49e2-8d62-99ec69a3f1bf.png`, open dark picker. Reviewed together with the implementation screenshot. Reference includes a scaled phone frame and surrounding explanatory text; comparison is of the app-owned sheet, not the canvas or simulated device chrome.
- Mobile viewport: 394 × 863 CSS pixels, captures at 394 × 863 pixels.
- `docs/qa/station-picker/mobile-dark.png`: resting sheet with a test favourite.
- `docs/qa/station-picker/mobile-light.png`: equivalent light theme.
- `docs/qa/station-picker/desktop-light.png`: centred dialog at 1100 × 900.
- Test favourite removed and original station/theme restored after verification.

## Findings resolved

- Fixed default sheet geometry: Vaul calculates snap offsets relative to viewport height. The 92vh content uses snap points 0.83 and 1 to present 75vh and 92vh visible sheets. Measured resting top: 215.76px in an 863px viewport.
- Fixed Close and trigger selectors: Radix/Vaul change the button's data-slot when composing with asChild.
- Reserved the translated-offscreen part of the lower snap so the last station and explanatory note remain reachable. Verified by scrolling to University.

## Fidelity review

- Typography: Helvetica system stack, bold station names, tracked section headings, mixed-case names. Names wrap instead of losing distinguishing information. Current station uses a subtitle instead of the reference's small inline tag.
- Layout: solid rounded sheet, fixed header/search, independently scrolling rows, separate 44px favourite buttons. Drag expansion and search expansion verified. The existing departures screen remains visible behind the blurred overlay.
- Colours: near-black/warm off-white, muted separators, amber favourites, blue Capital/amber Metro/green Valley badges. Light mode uses the warm paper palette and darker favourite colour.
- Icons: existing Lucide library for search, star, clear and location; no raster assets needed.
- Copy/data: Canadian spelling. Live GTFS route membership replaces illustrative route badges. Neighbourhoods, walking times and fictitious freshness signals are omitted. Actual device location enables straight-line distance display/sorting; fallback coordinates do not claim proximity. Without device location the list is alphabetical. Real station set includes Valley Line.

## Verification

- Browser: opening, Close, focus returning to trigger, search, clearing search, favourites without selection/dismissal, drag expansion, scrolling to final row, selection of 102 St and return to Corona with corresponding departures, mobile light/dark, desktop layout.
- Automated: 108 tests passed; TypeScript and production build passed. Tests cover mobile focus/expansion, storage corruption/unavailability, favourite persistence/removal, search/empty states, selection, distance ordering, fallback-location distinction, and GTFS line membership.
- Remaining device check: physical iPhone keyboard, safe areas and touch gestures in installed PWA mode. Desktop browser testing cannot certify those conditions.

## Build side effect

The repository's existing Sentry plugin uploaded source maps during the build despite an empty SENTRY_AUTH_TOKEN environment override. No app deployment was run.
