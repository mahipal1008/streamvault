FROM node:20-alpine AS base

RUN apk add --no-cache \
  python3 \
  py3-pip \
  ffmpeg \
  curl \
  && pip3 install --break-system-packages yt-dlp

WORKDIR /app

# Copy workspace manifests first for layer caching
COPY package.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/

RUN npm install --workspaces --ignore-scripts

COPY packages/shared ./packages/shared
COPY apps/api ./apps/api
COPY tsconfig.base.json ./

RUN npm run build --workspace=packages/shared
RUN npm run build --workspace=apps/api

WORKDIR /app/apps/api

EXPOSE 3001

CMD ["node", "dist/server.js"]
