# 1. Builder Stage
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Copy package files and prisma schema
COPY package.json package-lock.json ./
COPY prisma ./prisma

# Install dependencies cleanly (runs postinstall prisma generate)
RUN npm ci --prefer-offline --no-audit --no-fund

# Copy source code
COPY . .

# Build Next.js with safe memory limit for VPS
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS="--max-old-space-size=1536"

RUN npm run build

# 2. Production Runner Stage
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN apk add --no-cache libc6-compat openssl

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
