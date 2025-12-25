# 📊 Size Chart Generator: Deployment & Architecture Guide

This document serves as the "Source of Truth" for maintaining and deploying the Size Chart Generator. It highlights critical architectural decisions and "Gotchas" discovered during the initial setup to ensure future AI agents or developers do not repeat mistakes.

## 🚀 System Architecture

- **Frontend**: React (Vite) + Tailwind CSS.
- **OCR Engine**: Self-hosted Python/FastAPI service (Tesseract-based).
- **Infrastucture**: Docker + Docker Compose.
- **Reverse Proxy**: Caddy (Running as a "Master" gateway for multiple apps).

---

## 🌐 Netorking & Domains

| Service | Public URL | Internal Port | VPS Public IP |
| :--- | :--- | :--- | :--- |
| **OCR API** | `https://ocr.muazaoski.online` | `8000` | `51.79.161.63` |
| **Generator** | `https://chart.muazaoski.online` | `3005` | `51.79.161.63` |

### ⚠️ Critical Networking Gotchas (MUST READ)
1. **The "Localhost" Trap**: When Caddy is running inside a Docker container, `reverse_proxy localhost:PORT` will **FAIL** because it looks *inside* the Caddy container. You MUST use the **VPS Public IP** (e.g., `51.79.161.63`) or the Docker service name if they are on the same bridge network.
2. **Port Conflict**: Port `3000` is occupied by the `froggame`. The Size Chart Generator is assigned to port **`3005`**.
3. **Master Caddyfile**: The actual active Caddy configuration for this VPS is NOT in `/etc/caddy`. It is integrated into the `froggame` setup at:  
   👉 **`/opt/apps/froggame/Caddyfile`**  
   Any new subdomains must be added to *this* file and reloaded via:  
   `docker exec caddy caddy reload --config /etc/caddy/Caddyfile`

---

## 🛠 Deployment Checklist

### 1. Build Requirements (Dockerfile)
- **Node Version**: Must be **Node 20+** (currently using `node:22-alpine`). Vite will fail to build on Node 18 due to missing `node:util` exports (`styleText`).
- **SPA Configuration**: The React app is served by a lightweight Caddy instance inside its own container. Use `Caddyfile.container` to handle the `try_files` redirect for React Router. Do NOT use `RUN echo` in the Dockerfile for complex configs as it leads to escaping errors.

### 2. Updating the Frontend
1. Change code locally.
2. `git push origin main`.
3. On VPS: `git pull && docker compose up -d --build`.

### 3. Adding a New Subdomain
If you ever need to add a third site (e.g., `api.muazaoski.online`):
1. Create A Record in Cloudflare pointing to `51.79.161.63`.
2. Ensure SSL is set to **Full (Strict)** in Cloudflare.
3. Add the block to `/opt/apps/froggame/Caddyfile`.
4. Run the Caddy reload command.

---

## 🤖 AI Instructions (For future sessions)
- **DO NOT** try to install `ufw`. Use existing exposed ports.
- **DO NOT** assume `localhost` works for reverse proxies.
- **ALWAYS** check `docker logs <container_name>` if a build completes but the site shows a 522 or TLS error.
- **THE MASTER CONFIG** is at `/opt/apps/froggame/Caddyfile`. This is non-negotiable for this VPS setup.

---
*Last updated: 2025-12-25*
