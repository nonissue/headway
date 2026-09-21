# Releasing Headway

Read the current diff and repository state before starting. The default working
branch is `develop`. Release commits belong on both `develop` and `main`: the
weekly GTFS refresh starts from `develop`, while `.github/workflows/fly-deploy.yml`
builds `main` and deploys to Fly.io. Recheck that configuration when it changes.

## Prepare

Update the existing guides and `docs/project-notes.md` to reflect the accepted
implementation. Keep rejected experiments out of the code; retain useful QA
fixtures under `docs/qa/`, with a link from the relevant guide. Keep agent
instructions as pointers rather than duplicating style or release details.

Run the full suite and a production build:

```sh
npm run test -- --run --coverage.enabled=false
SENTRY_UPLOAD=false npm run build
git diff --check
```

The local build flag skips Sentry sourcemap uploads; CI handles its own build.
The Dockerfile copies prebuilt `dist/`, so a manual deployment must also build
first. Avoid changing GTFS data as part of a visual release unless requested.

For departure layout changes, use the [typography QA preview](typography.md#verification-when-changing-fonts)
with mixed lines, long destinations, recent departures, and narrow viewports.
The preview fixes both schedule data and `now`; changing the device clock is
unnecessary and can make a live client disagree with the server. Check both
direction panes and destination truncation. The preview is development-only,
not a production build entry, and is excluded from coverage metrics.

## Publish

Fetch remote state and review divergence before committing or pushing. Stage
reviewed files. With a clean `develop` release commit that fast-forwards both
remote branches, push `develop` and `develop:main` (an atomic push can update
both together). If either branch has concurrent changes, reconcile them first;
do not force-push. Keep the local `main` branch aligned without discarding work.

A push to `main` starts Fly Deploy. Follow the run for the release commit rather
than issuing a second manual deployment. Completion means the workflow and Fly
health checks succeed, not merely that Git accepted the push.

## Verify production

Check `https://headway.andy.ws/api/health`, the live departures API, and the board.
Confirm the served HTML references the new build's assets. For typography changes,
check the WOFF2 responses and caching as described in the typography guide.
Confirm the QA HTML/TSX files were not emitted into `dist/client`.

If an existing tab still shows old styling, compare its assets with the served
HTML and allow the existing PWA update flow to finish before judging the release.
Do not introduce a second service worker. Record any physical-device checks that
remain unverified, and report the release commit and deployment result to the user.
