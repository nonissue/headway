# Project migration

2026-09-19 · whole-project migration from legacy new-york wrappers to @base-ui/react 1.8.0.

## Migrated

Button, Dialog, Popover and ScrollArea. Each component has its own report and commit. Existing custom classes were preserved instead of replacing legacy wrappers with a different visual preset.

## Dependencies and registry

Removed all direct @radix-ui dependencies. Vaul and cmdk are intentionally retained under the migration skill; their transitive Radix dependencies are not a claim of fully eliminating Radix from node_modules. The user requested future components use Base UI, so components.json now targets base-nova. This changes future registry additions only and does not restyle existing wrappers.

## Consumer sweep

Desktop triggers use render, station search uses initialFocus, the About dialog test double accepts render, and the PWA ScrollArea selector uses data-slot. Remaining asChild/autofocus-event consumers are Vaul-owned mobile drawers. The obsolete Near you indicator was removed following picker review.

## Validation

Baseline production build passed. Post-migration production build passed with SENTRY_UPLOAD=false; no Sentry upload. All 108 tests across 20 files pass. TypeScript and whitespace checks pass. Browser inspection covered the Base UI desktop station picker, search, About dialog, and the retained mobile picker. Popover currently has no app consumers; its inert Anchor compatibility export is flagged in its component report.

Local .codex/config.toml contains a credential and is ignored rather than committed. AGENTS.md and the existing picker refinements were included in the prerequisite checkpoint.

## Remaining Radix wrappers

0 wrappers remain on Radix, derived from searching src/components/ui for radix-ui and @radix-ui imports. Vaul drawer and cmdk command remain intentionally untouched.
