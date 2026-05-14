# StreamVault

> Universal content downloader — 1000+ sites, up to 8K HDR, AES-256-GCM encrypted, zero logs.

## Features

- 🎬 Download from YouTube, TikTok, Instagram, X, Reddit, Vimeo, Twitch, SoundCloud and 1000+ more via **yt-dlp**
- 🔐 **AES-256-GCM** end-to-end re-encryption — key only ever lives in your browser
- 🌐 **Two-lane egress** — Direct (fast) + Residential Proxy (geo-bypass)
- 📺 Up to **8K + HDR**, multi-audio tracks, subtitles (soft/hard/sidecar)
- 🚫 **Zero data stored** — no DB, no logs, no accounts, no cookies
- ⚡ Real-time download progress via SSE
- 💾 File System Access API for large files (bypasses browser RAM limit)

## Tech Stack

| Layer | Choice |
|---|---|
| Frontend | Next.js 15 · React 19 · TypeScript · Tailwind 3.4 · Framer Motion |
| Backend | Fastify 5 · TypeScript · Node 20 |
| Extraction | yt-dlp + ffmpeg |
| Encryption | AES-256-GCM (Node crypto + Web Crypto API) |
| Deploy | Render (Docker for API, Node for web) |

## Quick Start

```bash
# Prerequisites: pnpm, Node 20+, Python 3, yt-dlp, ffmpeg

git clone <repo>
cd streamvault
pnpm install

cp .env.example .env
# Edit .env — set PROXY_URL if you have a residential proxy

pnpm dev
# API → http://localhost:3001
# Web → http://localhost:3000
```

## Environment Variables

| Variable | Description | Required |
|---|---|---|
| `PORT` | API server port (default 3001) | No |
| `ALLOWED_ORIGIN` | Frontend URL for CORS | Yes (prod) |
| `PROXY_URL` | `http://user:pass@host:port` residential proxy | No |
| `API_KEY` | Secret for internal auth (optional) | No |
| `API_URL` | API URL for Next.js rewrites | Yes (prod) |

## Architecture

```
Browser (Next.js)
  └─ TLS 1.3 + AES-256-GCM re-encryption
      └─ Fastify API (Render)
          ├─ Lane A: Direct  (default)
          └─ Lane B: Residential Proxy (geo-bypass)
              └─ yt-dlp + ffmpeg subprocess
                  └─ Target site (never sees user IP)
```

## CIA Triad

- **Confidentiality**: Key generated server-side, sent to client once, never stored. Double encryption: TLS + AES-GCM.
- **Integrity**: Per-chunk AEAD authentication tags. Client verifies before saving.
- **Availability**: Health-scored lane selection, auto-failover, proxy retry on geo-block.

## Deploy to Render

```bash
# Uses render.yaml blueprint
render deploy
```

Set env vars `ALLOWED_ORIGIN`, `API_URL`, and optionally `PROXY_URL` in Render dashboard.

## Legal

Personal use only. You are responsible for complying with copyright law and platform terms of service. See `/legal`.
