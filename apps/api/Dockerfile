# ── builder stage ──────────────────────────────────────────────────────────
FROM node:20.18.1-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json* ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/

# Use ci when a lockfile exists; fall back to install otherwise.
RUN if [ -f package-lock.json ]; then \
      npm ci --workspaces --include-workspace-root --ignore-scripts; \
    else \
      npm install --workspaces --include-workspace-root --ignore-scripts; \
    fi

COPY tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api

RUN npm run build --workspace=packages/shared \
 && npm run build --workspace=apps/api \
 && npm prune --omit=dev --workspaces --include-workspace-root

# ── runtime stage ──────────────────────────────────────────────────────────
FROM node:20.18.1-alpine AS runtime

# Runtime deps: ffmpeg, python (for yt-dlp), tini for PID 1 signal handling.
# yt-dlp pinned for reproducibility — bump deliberately, not silently.
ARG YTDLP_VERSION=2025.01.15
RUN apk add --no-cache ffmpeg python3 py3-pip tini curl \
 && pip3 install --break-system-packages "yt-dlp==${YTDLP_VERSION}" \
 && adduser -D -u 1001 app

WORKDIR /app
COPY --from=builder --chown=app:app /app/node_modules ./node_modules
COPY --from=builder --chown=app:app /app/packages ./packages
COPY --from=builder --chown=app:app /app/apps/api ./apps/api
COPY --from=builder --chown=app:app /app/package.json ./package.json

USER app
WORKDIR /app/apps/api

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -fsS http://127.0.0.1:3001/livez || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/server.js"]
