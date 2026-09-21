# Typography

## Direction

Headway uses **Geist** for interface text and destinations, and **Geist Mono**
for departure clocks and countdowns. Both are self-hosted webfonts, so the
selected families and weights are available across devices.

The reference remains Swiss public-information design, particularly Massimo
Vignelli's NYC subway graphics: direct language, strong alignment, restrained
rules, and a clear hierarchy. The fonts support that structure. Avoid decorative
letterforms, oversized countdowns, and unnecessary differences between rows.

The station establishes context; destinations lead the board; clocks and
countdowns provide the timing. The first upcoming destination is bold, while its
numbers use medium weight. The user explicitly preferred this lighter numerical
emphasis after finding bold Geist Mono too strong. Colour and type size were not
changed as part of that weight adjustment.

Helvetica paired well with Söhne Mono in the comparisons. The complete Geist
pairing was selected for its appearance and consistent delivery across devices.
Söhne, Martian Mono, Archivo, and Inter were explored but are not dependencies.
Earlier comparison mockups are exploratory references, not the implementation.

## Current hierarchy

These values describe the current implementation, rather than defining a new
set of reusable design tokens. Weights are CSS numeric weights.

| Role | Family | Size | Weight |
| --- | --- | --- | --- |
| Selected station | Geist | 24px | 700 |
| Upcoming destination | Geist | 15px | 500 |
| First upcoming destination | Geist | 18px | 700 |
| Recently departed destination | Geist | 14px | 400 |
| Upcoming clock | Geist Mono | 15px | 400 |
| Upcoming countdown number | Geist Mono | 15px | 600 |
| First upcoming clock and countdown | Geist Mono | 16px | 500 |
| Recently departed clock and label | Geist Mono | 12px | 400 |

The `mins` suffix remains regular weight (400), with no inserted space:
`12mins`. A zero-minute countdown displays `Now`. Next-service rows use medium
clock and countdown weights, with elapsed hours and minutes in the countdown.

Clock and countdown text use natural letter spacing and tabular numerals.
Rows have shared column widths within each direction: 48px for the clock,
68px for the countdown, and 96px for the overnight countdown variant. Do not
shrink the destination by adding extra numerical emphasis. Long destinations
may wrap at narrow widths; both direction panes must remain visible and scroll
independently.

The component still contains inherited arbitrary sizes, tracking, and `1.2`
line-height values. Their repetition is not an endorsed styling pattern. For
future cleanup, establish shared typography on the row, prefer the standard
Tailwind scale, and limit child overrides to meaningful state differences.
Introduce a named token only where a deliberate custom value is necessary.
Verify visual changes separately; that cleanup is not part of this font release.

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

1. Run the tests and production build. For local builds without Sentry uploads:
   `npm run test -- --run --coverage.enabled=false` and
   `SENTRY_UPLOAD=false npm run build`.
2. Confirm that the built HTML, CSS, and service-worker precache reference the
   same two hashed WOFF2 files, without `/node_modules/` URLs in production HTML.
3. Check font responses for HTTP 200, `font/woff2`, and immutable caching. Missing
   assets must return 404 rather than cached HTML or a successful font response.
4. Check normal, next, recent, and overnight rows at phone widths, including
   three-digit countdowns, colons, `Now`, and long destination labels. Check the
   station picker and About surface in light and dark themes.
5. After deployment, verify the release's actual asset URLs and live departures.
   An already-open PWA may need its normal service-worker update before it shows
   the new release. Browser emulation does not replace physical iPhone testing.

## External resources

- [Geist source and design background](https://github.com/vercel/geist-font)
- [Vercel's Next.js package documentation](https://github.com/vercel/geist-font/tree/main/packages/next)
- [Fontsource installation with Vite and other bundlers](https://fontsource.org/docs/getting-started/install)
- [Fontsource preloading guidance](https://fontsource.org/docs/getting-started/preload)
- [Geist on Fontsource](https://fontsource.org/fonts/geist)
- [Geist Mono on Fontsource](https://fontsource.org/fonts/geist-mono)

Font licence information is included in the installed packages' `LICENSE` files.
