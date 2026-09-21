# Headway project notes

Updated 2026-09-20. This records the current design decisions and session results;
older mockups and QA captures are historical references, not the current specification.

## Product and design direction

The visual reference is Massimo Vignelli's NYC subway graphic design: clear
typography, restrained rules, consistent alignment, and coloured line monograms.
The primary use is checking departures on a phone before leaving home, often
choosing a train in the next 45 minutes rather than simply catching the next one.
Keep later departures easy to scan; avoid an oversized next-train countdown.

The user likes the overall result and wants to see it during normal multi-line
service before making more substantial visual changes. During this session,
Corona showed Metro-only service; the user confirmed an ETS Capital Line weekend
closure. That was session context, not a permanent restriction or inferred UI bug.

## Accepted UI decisions

- Two equal, independently scrolling direction panes; a terminus uses one pane.
  Keep the flex sizing and `min-height: 0` constraints that let both panes fit.
- Compact departure rows, with modest emphasis on the first upcoming train.
  Clock time sits to the left of countdown; both use monospaced numerals.
  Upcoming countdowns use `12mins` with no space; zero minutes displays `Now`.
  There are no redundant “at” and “in” labels.
- Visible direction headings/rails were removed to reclaim vertical space;
  accessible headings remain. Direction arrows were subsequently removed from
  the local preview. Destination names now lead each row, followed by the line
  badge with an 8px gap and adjusted optical alignment. This follows the user's
  observation that Edmonton riders read terminal destinations first, as on ETS
  station boards. Filled circles and diamond-framed arrows were also rejected.
- The board abbreviates “NAIT Blatchford Market” to “NAIT / Blatchford”. The full
  destination remains available as a title; schedule identity is unchanged.
- Line filter buttons occupy simple rectangular header cells. Both lines are
  shown by default; selecting one isolates it and toggling it off restores both.
  There is no separate All button.
- Footer controls use an aligned grid, with a strong top rule and a thin bottom
  border above the phone's safe-area space. The About surface and station picker
  follow the same compact, square-edged treatment.
- Station picker: aligned names on the left, line monograms beside the favourite
  control on the right, and a line-name legend beneath search. Current selection
  uses a check rather than an extra text subtitle. Favourites precede stations
  ordered by distance when location is available, otherwise alphabetically.
  Distances are not walking-time estimates.
- No visible Stations heading or dedicated close button in the mobile picker.
  Retain the drag handle and overlay dismissal, plus accessible labelling.
  The search-clear control only clears the query.

## Schedule behaviour and safeguards

- Times are scheduled, not live predictions. Show the latest past departure
  subtly for up to ten minutes (inclusive), clearly distinct from upcoming trains.
  Recent labels are `Now`, `-1 min`, `-2 mins`, etc. Keep this recent context
  when the upcoming board falls back to the next service window.
- The normal lookahead is four hours. When the whole station has no upcoming
  trains in that window, search through the end of the next configured service
  day and show four hours from the earliest actual departure. This can include
  later service today; it is not an unconditional jump to tomorrow.
- Preserve absolute `scheduled_at` values for clocks, countdowns, ordering, and
  overlapping GTFS service dates. Calendar exceptions, times beyond 24:00/48:00,
  and DST are covered in [GTFS time-window verification](qa/gtfs-time-boundaries.md).
- `ui-overhaul-pre-next-service` tags `584c44e`, the UI checkpoint before fallback
  work. It retains the old time-query behaviour, so it is not a timing bug fix.

## Latest release and verification

- Release `ad11a2b`: larger standalone arrows, footer bottom border, and scrolling
  refinements. Pushed to `develop` and `main`; deployed successfully to
  [headway.andy.ws](https://headway.andy.ws) via
  [Fly Deploy run 35508375839](https://github.com/nonissue/headway/actions/runs/35508375839).
- Production health returned 200 and the live CSS contained all three changes.
  The release build and 13 targeted departure/footer tests passed. The preceding
  full overhaul release passed all 150 tests; the full suite was not rerun for
  this CSS-only follow-up.
- Mobile browser checks covered light/dark appearance, independent pane scrolling,
  no horizontal overflow, and an unobscured final row at the bottom.
- The fade now shortens continuously near the end using Base UI overflow values,
  instead of switching the mask off abruptly. Departure panes use
  `overscroll-behavior: none`. These target the reported iPhone flick-at-bottom
  stutter; the cause and on-device resolution are not yet confirmed.

## Local checkpoint verification

- All 155 tests across 23 files passed with `npx vitest run --coverage.enabled=false`.
- `SENTRY_UPLOAD=false npm run build` passed, including TypeScript compilation.
- Browser inspection confirmed the muted previous departure and corrected
  clock/countdown spacing. The preview had retained an old Vite-generated
  stylesheet (48px countdown column and old unit gap) alongside the new JSX.
  Reloading alone did not clear it; touching `src/globals.css` triggered a
  rebuild and delivered the current 64px column with no unit gap. No additional
  visual code changes were necessary. If the next session sees mismatched
  visuals, inspect the delivered styles against source before changing layout.
- This does not resolve or establish the cause of the deferred fetch error.

## Tailwind migration

The recent redesign's component styling now lives in Tailwind utilities in the
owning components. `src/globals.css` is reduced from 829 to 143 lines. No large
`@apply` aliases or additional stylesheet were introduced.

- Migrated the app shell, departure rows/panes, header/filter controls, footer,
  About surface, station picker, and loading/error/empty states.
- Retained theme tokens and document/safe-area base rules, the overflow-driven
  scroll mask, and reduced-motion policy in CSS. The subsequent Base UI drawer
  migration removed the Vaul exceptions (see [drawer migration](../.migration/drawer.md)).
  The remaining effects stay together with explanatory comments; forcing
  them into long arbitrary utilities would make maintenance harder.
- Added a `board` toggle variant and used the existing Tailwind-aware `cn`
  helper so joined-toggle defaults no longer need global CSS overrides.
- Preserved the 360px breakpoint, `min-h-0` flex constraints, line colours,
  overnight column widths, typography, and drawer dismissal behaviour.
- Verified the build and 155 tests. Compared before/after screenshots and computed
  styles using deterministic API fixtures in Chrome at 360px, 390px, and 900px:
  board, filters, About, picker/search, dark theme, and overnight service.
- Physical iPhone flicks, software keyboard, and VoiceOver remain unverified.
  No deployment was performed as part of this migration.

## Deferred local refresh error

The user reported “Failed to fetch departures” after switching away and back
in local Codex and Safari previews. Production occurrence is unknown. Local
nearby and selected-station API checks succeeded during investigation; the
original failure was not reproduced reliably.

A supplied terminal screenshot shows Vite invalidating `src/main.tsx` because
its `mountApp` export is incompatible with Fast Refresh; it exports both `App`
and `mountApp`. Test-file edits also triggered page reloads. This is evidence
of a development reload issue, not proof of the API error's cause.

The user explicitly deferred the investigation. Speculative focus-refresh
handler changes and their tests were removed before this checkpoint. No HMR
fix or App/entry-point split was applied. Do not treat this issue as resolved
or restart the investigation as part of the styling migration unless asked.

## Follow-ups

- Test fast flicks at the bottom of both panes on a physical iPhone, including
  Safari and installed PWA usage. Also check the footer's safe-area border.
- Review the destination-first rows during normal Capital and Metro service.
  The badge relocation and arrow removal are local changes, not part of the
  deployed `ad11a2b` release.
- Physical-device VoiceOver and software-keyboard behaviour remain unverified.

## Repository and deployment continuity

- The default working branch is `develop`. Keep release commits on both
  `develop` and `main`: pushes to `main` deploy, while the weekly GTFS refresh
  starts from `develop` and fast-forwards `main` before deploying.
- Branch cleanup removed the completed redesign branch and stale tracking/PR
  references. `design-refresh` was retained because it has three unmerged
  prototype commits. Eight remote Dependabot branches had open PRs at cleanup;
  recheck their status before removing them.
- Direct shadcn primitives and the mobile drawer now use Base UI. The shadcn
  and migration skills are checked into `.agents/skills/`.
- Vitest has automatic UI/browser opening disabled. For a local validation build
  without sourcemap uploads, use `SENTRY_UPLOAD=false npm run build`.
- `.dockerignore` excludes local environment files, agent configuration and Git
  metadata from remote build context. Preserve those exclusions.

The initial [design QA record](../design-qa.md) and
[station-picker review](qa/station-picker/initial-review.md) retain historical
evidence; their earlier typography, rails, pills, and close-button descriptions
are superseded by the decisions above.
