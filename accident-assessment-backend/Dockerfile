# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first (layer cache optimization)
COPY package*.json ./
RUN npm ci --only=production=false

# Copy source and build
COPY tsconfig*.json ./
COPY src ./src
RUN npm run build

# Prune dev dependencies
RUN npm prune --production

# ── Stage 2: Production ───────────────────────────────────────────────────────
FROM node:20-alpine AS production

# Security: run as non-root
RUN addgroup -g 1001 -S nestjs && \
    adduser  -u 1001 -S nestjs -G nestjs

WORKDIR /app

# Copy built artifacts
COPY --from=builder --chown=nestjs:nestjs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nestjs /app/dist         ./dist
COPY --from=builder --chown=nestjs:nestjs /app/package.json ./

# Upload directory
RUN mkdir -p uploads && chown nestjs:nestjs uploads

USER nestjs

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/v1/health || exit 1

CMD ["node", "dist/main"]