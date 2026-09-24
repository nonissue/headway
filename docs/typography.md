# Typography

## Direction

Headway uses **Geist** for interface text and destinations, and **Geist Mono**
for departure clocks and countdowns. Both are self-hosted webfonts, so the
selected families and weights are available across devices.

The reference remains Swiss public-information design, particularly Massimo
Vignelli's NYC subway graphics: direct language, strong alignment, restrained
rules, and a clear hierarchy. The fonts support that structure. Avoid decorative
letterforms, oversized countdowns, and unnecessary differences between rows.

The station establishes context; destinations lead the board; countdowns are the
primary timing cue and clocks are quieter supporting information. All upcoming
rows share the same size, destination weight, badge size, and height. Only the
next countdown in each direction receives a modest weight increase, determined
after line filtering and recalculated as scheduled times pass. Past departures
are removed; there is no separate history row or post-departure grace period.

Mixed destinations exposed a weakness in graduated row sizes: the same station
label changed appearance according to its position, competing with the variation
already present in line colours and destination lengths. Keep upcoming rows
uniform instead of reintroducing the earlier three-step size hierarchy.

Use size and weight together, with restrained differences. Avoid making clock
times compete with destinations: upcoming clocks use regular weight and the
existing `muted-foreground` colour in both themes.

Helvetica paired well with Söhne Mono in the comparisons. The complete Geist
pairing was selected for its appearance and consistent delivery across devices.
Söhne, Martian Mono, Archivo, and Inter were explored but are not dependencies.
Earlier comparison mockups are exploratory references, not the implementation.

## Current hierarchy

The row owns the type size and line height. Destinations use Geist; clocks and
countdowns use Geist Mono. Upcoming destinations are 18px, countdowns are 16px,
and clocks are 14px: each numerical element sits one Tailwind size step below
the preceding element. The selected station remains 24px / 700.

| Row | Destination size | Destination weight | Clock weight | Countdown number weight | Badge diameter |
| --- | --- | --- | --- | --- | --- |
| Next | `text-lg` / 18px | 500 | 400 | 500 | 20.25px |
| Other upcoming | `text-lg` / 18px | 500 | 400 | 400 | 20.25px |

All rows use `leading-tight` (1.25). Every upcoming row has a minimum height of
56px. Vertical padding can make a row taller;
destination text stays on one line.

The line badge sits to the **left** of the destination, vertically centred in a
fixed `w-6` (24px) column. Destination text therefore shares one left edge
across every row. The `proportional` variant of `LineBadge` uses a diameter
of `1.125em` and fallback icon size of `0.85em`. Letter sizes are deliberately
whole pixels: 12px for all rows. Badge tracking
is reset to normal, independently of destination tracking. `text-box: trim-both cap alphabetic` centres the capital-height box;
browsers without text-box support retain ordinary flex centring. These rules
live together in `src/globals.css`. The badge cannot shrink.

Destinations use `truncate` inside their own text column, showing
an ellipsis when space runs out. The full destination remains in the DOM for
assistive technology and in the existing `title` attribute for pointer hover.

Rows remain flat. Header filter badges retain their independent fixed sizing.

The `mins` suffix remains regular weight (400), with no inserted space:
`12mins`. A zero-minute countdown displays `Now`. Next-service rows use the same
uniform row treatment, with elapsed hours and minutes in the countdown.
The word `Now` uses Geist sans at the exact scheduled instant; numerical
countdowns retain Geist Mono. Once that instant passes, the row is removed on
the next clock update. There is no small-caps treatment or new Due window.

Clock and countdown text use natural letter spacing and tabular numerals. Each
direction's list defines a grid with a flexible destination column and two
`max-content` numerical columns. Rows use `grid-cols-subgrid` to share those
columns, allowing larger text, three-digit counts, and overnight labels to size
the columns without fixed pixel widths. A shared `gap-3` (12px) keeps the
destination clear of the clock, with longer destinations truncated inside their
own column.
Both direction panes must remain visible and scroll independently, including
on narrow phones.

`DepartureRow` in `DeparturesTable.tsx` is the single source for row typography.
Keep child overrides limited to numerical font family, weight, and the smaller
countdown and clock sizes. Use standard Tailwind size and line-height utilities;
do not reintroduce repeated
`text-[15px]` or `leading-[1.2]` values. The proportional badge ratios and shared
grid structure are deliberate component rules, not per-row adjustments.

## Installation and integration

The dependencies are `@fontsource-variable/geist` and
`@fontsource-variable/geist-mono`, locked to 5.3.0 in the initial release.
Normal `npm install` or `npm ci` installs them with the rest of the project.
The original installation command was:

```sh
npm install @fontsource-variable/geist @fontsource-variable/geist-mono
```

Vercel's convenient `geist/font/sans` and `geist/font/mono` exports use Next.js
font helpers. This project uses Vite, so it consumes the font assets directly
through Fontsource instead. npm is a build-time delivery mechanism: visitors
do not download packages or contact npm.

| Resource | Responsibility |
| --- | --- |
| [`src/fonts.css`](../src/fonts.css) | Two `@font-face` declarations referencing the packages' Latin upright variable WOFF2 files. Each supports weights 100–900 with `font-display: swap`. |
| [`src/globals.css`](../src/globals.css) | Imports the font stylesheet and sets `--font-sans`, `--font-display`, and `--font-mono`, retaining system fallbacks. |
| [`index.html`](../index.html) | Preloads the same two WOFF2 files with `as="font"`, the WOFF2 MIME type, and `crossorigin`. Vite rewrites the package paths to hashed production URLs. |
| [`DeparturesTable.tsx`](../src/components/DeparturesTable.tsx) | Applies the numerical family, weights, and departure-state hierarchy. |
| [`LineBadge.tsx`](../src/components/LineBadge.tsx) | Renders the line identity before the destination; the proportional variant inherits row sizing. |
| [`StationPicker.tsx`](../src/components/StationPicker.tsx) | Uses the shared sans family, including the station trigger; it no longer hard-codes Helvetica. |
| [`src/server.ts`](../src/server.ts) | Successful font responses beneath `/assets/` receive `Cache-Control: public, max-age=31536000, immutable`. |
| [`vite.config.ts`](../vite.config.ts) | Includes WOFF2 files in the existing service worker's precache alongside the application assets. |

Do not import the packages' entire default stylesheets unless additional scripts
or styles are required: the current declarations intentionally include only the
two Latin upright faces. The separate [`public/offline.html`](../public/offline.html)
fallback remains a lightweight page using system fonts.

## Loading and performance

The initial production build emits two font files:

- Geist: **29,400 bytes**.
- Geist Mono: **23,128 bytes**.
- Combined: **52,528 bytes**, approximately **52.5 KB**.

These are measured file sizes, not a page-speed benchmark. The fonts add no
runtime JavaScript and require no external font service. Preloads start their
downloads before the browser discovers their use in the interface.
`font-display: swap` allows fallback text to appear while they load; a font swap
can still alter text metrics. It is not a guarantee of zero layout shift.

Content hashes change when font contents change, making long-lived caching safe.
The PWA precaches the files for subsequent use; its normal update flow installs
new asset versions. Keep preload and CSS references pointed at the same files
to avoid duplicate downloads, and preserve the existing service worker rather
than adding another font-specific one.

## Verification when changing fonts

With the Vite development server running, open
`http://localhost:5173/docs/qa/departure-typography/` for a fixed-time board with
alternating Capital/Metro lines and destinations in both directions. The
[preview source](qa/departure-typography/preview.tsx) renders the real departure
component with fixture data, including three-digit countdowns. It
requires no system-clock changes and is not an entry point in the production
build. Keep it as a representative layout check alongside the live board.

1. Run the tests and production build. For local builds without Sentry uploads:
   `npm run test -- --run --coverage.enabled=false` and
   `SENTRY_UPLOAD=false npm run build`.
2. Confirm that the built HTML, CSS, and service-worker precache reference the
   same two hashed WOFF2 files, without `/node_modules/` URLs in production HTML.
3. Check font responses for HTTP 200, `font/woff2`, and immutable caching. Missing
   assets must return 404 rather than cached HTML or a successful font response.
4. Check mixed Capital/Metro destinations, next, and overnight rows at
   phone widths, including
   three-digit countdowns, colons, `Now`, and truncated destination labels. Check
   badge letter centring and the partially faded bottom row in dark mode. Verify
   that passed departures disappear and the next train gains emphasis. Check
   the station picker and About surface in both themes.
5. After deployment, verify the release's actual asset URLs and live departures.
   An already-open PWA may need its normal service-worker update before it shows
   the new release. Browser emulation does not replace physical iPhone testing.

## External resources

- [CSS capital-height trimming and browser support](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/text-box)
- [Geist source and design background](https://github.com/vercel/geist-font)
- [Vercel's Next.js package documentation](https://github.com/vercel/geist-font/tree/main/packages/next)
- [Fontsource installation with Vite and other bundlers](https://fontsource.org/docs/getting-started/install)
- [Fontsource preloading guidance](https://fontsource.org/docs/getting-started/preload)
- [Geist on Fontsource](https://fontsource.org/fonts/geist)
- [Geist Mono on Fontsource](https://fontsource.org/fonts/geist-mono)

Font licence information is included in the installed packages' `LICENSE` files.
