# syntax=docker/dockerfile:1

# 1. Builder Stage
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Copy ONLY package manifest files to guarantee Docker layer caching
COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./

# Install dependencies using cache mount and skip postinstall scripts
RUN --mount=type=cache,target=/root/.npm \
  if [ -f package-lock.json ]; then npm ci --ignore-scripts --prefer-offline --no-audit --no-fund; \
  elif [ -f yarn.lock ]; then yarn --frozen-lockfile --ignore-scripts --prefer-offline; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile --ignore-scripts; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Copy prisma schema and generate client separately
COPY prisma ./prisma
RUN npx prisma generate

# Copy source code (files in .dockerignore like database and uploads are skipped)
COPY . .

# Build Next.js with all cores enabled and 4GB memory
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS="--max-old-space-size=4096"

RUN --mount=type=cache,target=/app/.next/cache \
  if [ -f package-lock.json ]; then npm run build; \
  elif [ -f yarn.lock ]; then yarn build; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm run build; \
  else echo "Lockfile not found." && exit 1; \
  fi

# 2. Production Runner Stage
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN apk add --no-cache openssl

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copy standalone build
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

RUN mkdir -p /app/public/uploads /app/prisma/data/uploads /tmp/uploads && \
    chown -R nextjs:nodejs /app/public /app/prisma /tmp/uploads && \
    chmod -R 777 /app/public /app/prisma /tmp/uploads

USER nextjs

EXPOSE 3040

ENV PORT=3040
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
