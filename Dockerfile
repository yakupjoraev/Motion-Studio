# syntax=docker/dockerfile:1.7
#
# The image DEVOPS.md § Docker specifies: multi-stage, standalone Next output, non-root.
#
# The stage order is the caching contract. Manifests are copied before the source, so editing a
# component re-runs the build and not the install — which is the difference between a twenty-second
# rebuild and a four-minute one.
FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /app

FROM base AS deps
# The manifests only. `packages` arrives as a directory rather than through a glob: Docker flattens
# `packages/*/package.json` into one destination file, which leaves pnpm with no workspace to resolve
# `workspace:*` against.
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/web/package.json apps/web/
COPY packages packages
# `--filter web...` is the app and its dependencies only: `e2e` declares Playwright, and installing it
# would download three browsers into a layer nothing runs them from.
# `--ignore-scripts` because the only postinstall in the graph is lefthook's, and a container has no
# git hooks to install.
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --filter web... --ignore-scripts

FROM base AS builder
# The whole installed tree, not just the root `node_modules`: pnpm puts a `node_modules` beside every
# workspace package, and `pnpm build --filter=web` refuses to run in a package that has none.
COPY --from=deps /app ./
# Source over the top. `node_modules` is in `.dockerignore`, so this cannot undo the install above.
COPY . .
# `MS_STANDALONE` is what turns on `output: 'standalone'` — see `apps/web/next.config.ts` for why it
# is a flag rather than the default.
ENV NEXT_TELEMETRY_DISABLED=1 MS_STANDALONE=1
RUN pnpm build --filter=web

FROM base AS runner
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001
# The standalone output carries its own pruned `node_modules`; `static` and `public` are the two
# directories Next expects beside it and does not trace into the bundle.
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public
USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
  CMD wget -qO- http://localhost:3000/api/health || exit 1
CMD ["node", "apps/web/server.js"]
