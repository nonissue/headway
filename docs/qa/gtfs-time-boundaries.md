# GTFS time-window verification — 2026-09-20

The station board now selects trips by absolute departure instant across overlapping
service dates. It does not use the GTFS library's `start_time` filter, because that
filter compares arrival time. Calendar membership and service exceptions remain
handled by the installed GTFS library.

Clock labels and countdowns both use `scheduled_at`. GTFS service durations retain
their original values, including times beyond 24:00 and 48:00, and are anchored at
local noon minus twelve elapsed hours on the service date.

## Regression coverage

`src/lib/stop-utils.integration.test.ts` exercises the installed GTFS library with
a real in-memory SQLite database. Cases cover:

- Late-night and morning services sharing one four-hour window.
- Arrival before the window with departure still ahead.
- The three-minute recent-departure boundary across 05:00.
- Service durations longer than 48 hours and repeated daily trip IDs.
- Calendar removals and added service dates, including exceptions-only feeds.
- Untimed intermediate stops.
- Spring-forward departures and both autumn 01:30 occurrences.
- Result limits after merging and ordering service dates.
- Station-wide fallback, year rollover, later service today, and no published service.

The fallback only runs when no platform has an upcoming departure. It searches
through the end of the next configured service day, takes the earliest actual
departure, and displays four hours from that point. It does not search indefinitely
through unpublished or suspended service days.

## Checks completed

- Full test suite: 145 tests passed.
- Production client/server build passed with Sentry upload disabled.
- The original 16 boundary integration cases plus three timestamp tests also
  passed with the process timezone set to UTC.
- Current ETS feed: compared all stations at ten overnight/morning instants on
  September 20. Of the 245 cases with expected upcoming service, none omitted an
  expected departure. The same audit found seven failing cases before the fix.
- Browser: refreshed Corona on the real clock and checked the mobile layout.

The feed comparison is a sampled audit of the locally installed feed, not a claim
that every possible GTFS feed or instant has been tested.

## Rollback checkpoint

`ui-overhaul-pre-next-service` tags commit `584c44e`, the UI refinement state before
next-service fallback work. That checkpoint passed its original 129 tests and
production build; it intentionally retains the older time-query behaviour.
