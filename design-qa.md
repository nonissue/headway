# Departure board design QA

Historical initial-overhaul QA result: passed within the scope below.

**Superseded in part by subsequent refinements.** See [current project notes](docs/project-notes.md)
for the deployed design and remaining device checks. The large hero countdowns,
direction rails, All pill, muted clock times, and footer described here are earlier
iterations; the screenshots and test counts below belong to that initial pass.

## Visual truth and comparison evidence

- Source: `/var/folders/b7/3_t4lsrx3_b46ksvmg_pyq_00000gn/T/codex-clipboard-41aa2258-c09d-482b-a76b-b95340c3026e.png` (1516 × 1462 px), plus supplied `01b Split Hero Preview.html` and design README.
- Implementation: `http://localhost:5173/`, real ETS schedule, Corona station, All lines, both themes. The reference uses illustrative daytime departures; the implementation captures evening Metro service. Route badges reflect the actual trip, including Metro trips to Century Park.
- Primary viewport: 393 × 812 CSS px, screenshots 393 × 812 px (1×).
- Normalization: source app regions start at x=144 (dark) / x=807 (light), y=145, width=602, height=1235. Resized proportionally to 393 × 806 px, excluding surrounding canvas and most simulated device chrome. The remaining bottom device curve/home indicator belongs to the reference only.
- Side-by-side full-view evidence: `docs/qa/departures/comparison-dark.png` and `comparison-light.png` (802 × 812 px): source left, implementation right. Both composites were opened and compared.
- Implementation captures: `mobile-dark.png`, `mobile-light.png`, `mobile-320.png`, `desktop-dark.png`, `picker-light.png`, `desktop-picker.png`, `valley-terminus.png`, and `error-recovery.png`, all under `docs/qa/departures/`.
- Focused review: masthead/filter states, hero rows, clock/countdown columns, direction rails and footer were directly readable at 1× in the normalized comparisons. No additional magnified region was needed.

## Comparison history and resolved findings

1. **P1: browser filters changed appearance without filtering departures.** Newly optimized Base UI toggle/group entries had inconsistent contexts during development. Prebundling them together fixed the browser behaviour. Verified Capital filtering empties both Corona panes for the current loaded Metro-only schedule, and All restores both lists. The selected pill now matches the reference's inverse treatment.
2. **P2: filter geometry and acronym casing.** Initial pills were too circular and the feed displayed “Nait”. Adjusted to 32px visual pills with extended hit areas, and normalized NAIT without changing destination identity. Final dark/light comparisons show the corrected presentation.
3. **P1: the real Mill Woods terminus showed terminating arrivals as departures.** Existing station-name matching ignored “Station” but not “Stop”. Normalizing both suffixes removes those arrivals. The Valley headsign “Downtown” now receives the Northbound heading. `valley-terminus.png` confirms one full-height outbound pane; refresh retains Mill Woods.
4. **Development-only root warning.** Repeated entry-module hot reloads created duplicate React roots. Root reuse now survives HMR. The final loaded app is usable with no new application errors during the interaction pass; older restart/HMR errors remain in the browser's retained log history.

## Required fidelity surfaces

- **Typography:** native Helvetica Neue / Helvetica / Arial stack, bold mixed-case destinations, tabular countdowns, tracked uppercase direction rails. Hero destinations use 22px text and 52px countdowns; smaller rows use 14px and 22px. Long real destinations wrap instead of losing identifying words. The 320px breakpoint uses 20px/46px hero typography.
- **Spacing/layout:** equal independently scrolling panes, fixed 34px left direction rails, thin row rules, stronger inter-pane divider, compact masthead. The reference's phone hardware and fake alert are omitted. A 53px footer retains existing About/theme/refresh controls; this deliberately reduces each pane's height. A terminus uses the available space for its single outbound direction. Desktop centres a 640px board.
- **Colours/tokens:** near-black #0E0E0E and warm white #F2EFE6, restrained borders and muted clock times, semantic Capital blue / Metro amber / Valley green. No destination-coloured rows or gradients.
- **Image/assets:** no raster artwork is required. Lucide icons and shadcn badges represent the design's UI symbols; no fake status bar, handset or home indicator is rendered by the app.
- **Copy/content:** Canadian spelling; scheduled-time attribution remains visible. Real feed membership and absolute scheduled timestamps replace illustrative metadata. There is no invented live-delay banner. Empty states explain recovery/filtering. Missing location uses an alphabetical picker without claiming proximity.

## Interaction and engineering checks

- All/Capital/Metro filter states, empty filtered directions, automatic next matching hero row.
- Picker search, selection, mobile sheet presentation and desktop Escape dismissal; prior approved no-close-button/legend layout preserved.
- Refresh preserves a manually selected Valley station and does not request location again.
- Independent scroll confirmed at 320 × 640: north viewport scrolled to 586px while south remained at 0. Document scroll width remained 320px; footer bottom remained 640px.
- Desktop board/dialog reviewed at 1000 × 850; mobile reviewed at 393 × 812 and 320 × 640.
- Loading and API-error recovery inspected during local server restarts. An unanswered location prompt now falls back after ten seconds (also covered by a regression test).
- Unit/integration suite: 120 tests passing across 22 files. Covers GTFS date/time conversion, after-midnight and DST service dates, trip-to-line metadata, expired departures, filters, selection/refresh and fallback.
- Production build passes, including TypeScript and PWA generation, with `SENTRY_UPLOAD=false` so validation does not upload source maps.

## Residual test gaps

No physical iPhone/Safari, VoiceOver or on-device software-keyboard session was available. Browser viewport checks do not substitute for those. No actionable P0/P1/P2 differences remain within the verified implementation scope.

## Implementation checklist

- [x] Migrate direct Radix wrappers and commit a clean checkpoint before visual work.
- [x] Implement reference-based main board using real schedule data.
- [x] Resolve visual/functional findings and compare revised captures.
- [x] Preserve the station picker interaction decisions.
- [x] Verify tests, production build, narrow layout, both themes and primary interactions.

The earlier station-picker-only QA record is retained in `docs/qa/station-picker/initial-review.md` as historical evidence; subsequent user-requested refinements supersede its initial visible-close/current-subtitle descriptions.
