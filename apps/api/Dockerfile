FROM node:20-alpine AS base

RUN apk add --no-cache \
  python3 \
  py3-pip \
  ffmpeg \
  curl \
  && pip3 install --break-system-packages yt-dlp \
  && npm install -g pnpm

WORKDIR /app

COPY package.json pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/

RUN pnpm install

COPY packages/shared ./packages/shared
COPY apps/api ./apps/api

RUN pnpm --filter=streamvault-shared build
RUN pnpm --filter=streamvault-api build

WORKDIR /app/apps/api

EXPOSE 3001

CMD ["node", "dist/server.js"]
