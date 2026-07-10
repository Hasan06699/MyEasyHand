# Build stage
FROM node:20-bookworm-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

# Production stage
FROM node:20-bookworm-slim AS production

WORKDIR /app

ENV NODE_ENV=production

RUN groupadd -g 1001 nodejs && useradd -m -u 1001 -g nodejs nodejs

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist

RUN mkdir -p uploads && chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 5050

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5050/api/v1/health || exit 1

CMD ["node", "dist/server.js"]
