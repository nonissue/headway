# Deployment TODO – Reduce Fly Image Size

- Move client-only libraries (Radix UI, lucide-react, class-variance-authority, clsx, cmdk, tailwind-merge, @tailwindcss/vite) from `dependencies` to `devDependencies` in `package.json`.
- Keep only the server-side modules (`@hono/node-server`, `hono`, `better-sqlite3`, `gtfs`, `@sentry/node`) in `dependencies`; remove the unused `express`.
- Move `@sentry/vite-plugin` to `devDependencies` so `npm ci --omit=dev` skips the heavy CLI in production.
- After reshuffling, run `npm install` to refresh `package-lock.json`, then commit both files.
- Optional: add `npm prune --omit=dev --omit=optional` in the Dockerfile after `npm ci --omit=dev` for extra trimming.
- Rebuild locally (plain `npm install`, `npm run build`) to make sure dev commands still work, then redeploy via `fly deploy`.

Do this after the current session. Remember to clear Fly’s build cache if the image size does not drop as expected.
