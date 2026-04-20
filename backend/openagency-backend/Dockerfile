# To use this Dockerfile, you have to set `output: 'standalone'` in your next.config.js file.
# From https://github.com/vercel/next.js/blob/canary/examples/with-docker/Dockerfile

FROM node:22.17.0-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager.
# Prefer pnpm when its lockfile is present; this repo is pnpm-managed.
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN \
  if [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
  elif [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  else echo "Lockfile not found." && exit 1; \
  fi


# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
# ENV NEXT_TELEMETRY_DISABLED 1

# Payload requires a secret key at initialisation time, including during static
# page-data collection in `next build`. Provide a placeholder here so the build
# succeeds; the real PAYLOAD_SECRET is injected by Railway at runtime and takes
# precedence over this build-time value.
ARG PAYLOAD_SECRET=build_secret_placeholder_not_used_at_runtime
ENV PAYLOAD_SECRET=$PAYLOAD_SECRET

# Signal to generateStaticParams that we are in a build environment without a
# database. The variable is set only in this builder stage; the runner stage
# starts fresh so it will NOT be present at runtime.
ARG NEXT_BUILD_SKIP_DB=true
ENV NEXT_BUILD_SKIP_DB=$NEXT_BUILD_SKIP_DB

RUN \
  if [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm run build; \
  elif [ -f yarn.lock ]; then yarn run build; \
  elif [ -f package-lock.json ]; then npm run build; \
  else echo "Lockfile not found." && exit 1; \
  fi

# If the repo doesn't already contain migrations, generate an initial one at
# build time so the runtime container can apply it on Railway's private network.
RUN if ! find src/migrations -type f -name "*.ts" 2>/dev/null | grep -q .; then \
      NODE_OPTIONS=--no-deprecation pnpm exec payload migrate:create --name init; \
    fi

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
# Enforce remote media storage in Railway runtime. The app must not fall back to
# local filesystem uploads in production.
ENV OPENAGENCY_REQUIRE_R2_STORAGE=true
# Uncomment the following line in case you want to disable telemetry during runtime.
# ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Remove this line if you do not have this folder
COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/src ./src
COPY --from=builder --chown=nextjs:nodejs /app/tsconfig.json ./tsconfig.json
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

# Wire up a `payload` shim so `railway ssh … "payload migrate --yes"` works.
# The CLI entry-point is payload/bin.js in this package version.
RUN printf '#!/bin/sh\ncd /app && exec node ./node_modules/payload/bin.js "$@"\n' \
    > /usr/local/bin/payload && chmod +x /usr/local/bin/payload

USER nextjs

EXPOSE 8080

ENV PORT=8080

# server.js is created by next build from the standalone output.
# Regenerate the Payload import map and run migrations at container startup so
# both steps see the live Railway environment before the app begins serving.
# https://nextjs.org/docs/pages/api-reference/next-config-js/output
CMD ["sh", "-c", "NODE_OPTIONS=--no-deprecation payload generate:importmap && NODE_OPTIONS=--no-deprecation payload migrate --yes && HOSTNAME=\"0.0.0.0\" exec node server.js"]
