# 📊 Size Chart Generator: Deployment & Architecture Guide

This document serves as the "Source of Truth" for maintaining and deploying the Size Chart Generator. It highlights critical architectural decisions and "Gotchas" discovered during the initial setup to ensure future AI agents or developers do not repeat mistakes.

## 🚀 System Architecture

- **Frontend**: React (Vite) + Tailwind CSS.
- **OCR Engine**: Self-hosted Python/FastAPI service (Tesseract-based) + **AI Understanding (Qwen3-VL)**.
- **Infrastructure**: Docker + Docker Compose.
- **Reverse Proxy**: Caddy (Running as a "Master" gateway for multiple apps).

---

## 🌐 Networking & Domains

| Service | Public URL | Internal Port | VPS Public IP |
| :--- | :--- | :--- | :--- |
| **OCR API** | `https://ocr.muazaoski.online` | `8000` | `51.79.161.63` |
| **Generator** | `https://chart.muazaoski.online` | `3005` | `51.79.161.63` |

---

## 📁 VPS Paths

| Path | Purpose |
|------|---------|
| `/opt/apps/ocr/SizeChartGenerator/` | Size Chart Generator source |
| `/opt/apps/ocr/` | OCR API source |
| `/opt/apps/froggame/Caddyfile` | Master Caddy config |

---

## 🧠 AI-Powered OCR (New!)

The Size Chart Generator now uses **Qwen3-VL-2B-Instruct** for AI-powered image understanding:

```
User uploads image → Qwen3-VL understands it → Returns structured JSON → Perfect size chart!
```

### API Endpoints Used:
- **AI Understanding**: `https://ocr.muazaoski.online/ocr/understand?preset=size_chart`
- **Fallback OCR**: `https://ocr.muazaoski.online/ocr/extract`

### View AI Logs:
```bash
journalctl -u qwen-vl -f
```

---

## 🛠 Deployment Checklist

### Quick Deploy (After Code Changes)

**On Windows:**
```powershell
cd G:\SizeChartGenerator\SizeChartGenerator\app
git add .
git commit -m "Your message"
git push
```

**On VPS:**
```bash
ssh debian@51.79.161.63
sudo -i
cd /opt/apps/ocr/SizeChartGenerator
git fetch origin
git reset --hard origin/main
docker compose down
docker compose build --no-cache
docker compose up -d
```

### View Logs:
```bash
docker compose logs -f size-chart-generator
```

---

### ⚠️ Critical Networking Gotchas (MUST READ)
1. **The "Localhost" Trap**: When Caddy is running inside a Docker container, `reverse_proxy localhost:PORT` will **FAIL** because it looks *inside* the Caddy container. You MUST use the **VPS Public IP** (e.g., `51.79.161.63`) or the Docker service name if they are on the same bridge network.
2. **Port Conflict**: Port `3000` is occupied by the `froggame`. The Size Chart Generator is assigned to port **`3005`**.
3. **Master Caddyfile**: The actual active Caddy configuration for this VPS is NOT in `/etc/caddy`. It is integrated into the `froggame` setup at:  
   👉 **`/opt/apps/froggame/Caddyfile`**  
   Any new subdomains must be added to *this* file and reloaded via:  
   `docker exec caddy caddy reload --config /etc/caddy/Caddyfile`

---

### Build Requirements (Dockerfile)
- **Node Version**: Must be **Node 20+** (currently using `node:22-alpine`). Vite will fail to build on Node 18 due to missing `node:util` exports (`styleText`).
- **SPA Configuration**: The React app is served by a lightweight Caddy instance inside its own container. Use `Caddyfile.container` to handle the `try_files` redirect for React Router.

---

## 🤖 AI Instructions (For future sessions)
- **DO NOT** try to install `ufw`. Use existing exposed ports.
- **DO NOT** assume `localhost` works for reverse proxies.
- **ALWAYS** check `docker logs <container_name>` if a build completes but the site shows a 522 or TLS error.
- **THE MASTER CONFIG** is at `/opt/apps/froggame/Caddyfile`. This is non-negotiable for this VPS setup.
- **Size Chart Generator path**: `/opt/apps/ocr/SizeChartGenerator/`

---
*Last updated: 2025-12-28*

