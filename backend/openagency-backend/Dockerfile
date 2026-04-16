# To use this Dockerfile, you have to set `output: 'standalone'` in your next.config.js file.
# From https://github.com/vercel/next.js/blob/canary/examples/with-docker/Dockerfile

FROM node:22.17.0-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
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
  if [ -f yarn.lock ]; then yarn run build; \
  elif [ -f package-lock.json ]; then npm run build; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm run build; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Run database migrations as part of the build so the schema is ready
# before the new container starts serving traffic.
#
# Railway builds Docker images on its own infrastructure, which means the
# builder has network access to postgres.railway.internal. Railway also
# automatically passes any ARG-declared variable from the service's
# environment as a Docker build argument, so DATABASE_URL here resolves to
# the real Postgres URL at build time.
#
# If DATABASE_URL is absent (local or CI builds without a DB) the step is
# skipped gracefully; the outer `if` check guarantees no failure.
ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL

RUN if [ -n "$DATABASE_URL" ]; then \
      echo "==> Generating initial migration (if none exist)..." && \
      if ! find src/migrations -name "*.sql" -maxdepth 1 2>/dev/null | grep -q .; then \
        NODE_OPTIONS=--no-deprecation pnpm exec payload migrate:create --name init; \
      fi && \
      echo "==> Applying pending migrations..." && \
      NODE_OPTIONS=--no-deprecation pnpm exec payload migrate --yes; \
    else \
      echo "==> DATABASE_URL not set — skipping build-time migrations"; \
    fi

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
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

# Wire up a `payload` shim so `railway ssh … "payload migrate --yes"` works.
# The payload package is present in the standalone node_modules because the
# server imports it; this shim makes the CLI entry-point accessible in PATH.
RUN printf '#!/bin/sh\ncd /app && exec node ./node_modules/payload/dist/bin.js "$@"\n' \
    > /usr/local/bin/payload && chmod +x /usr/local/bin/payload

USER nextjs

EXPOSE 8080

ENV PORT=8080

# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/next-config-js/output
CMD HOSTNAME="0.0.0.0" node server.js
