# Architecture – RW Admin Web App

## 1. Stack
- Backend: FastAPI + SQLAlchemy + Alembic + PostgreSQL
- Frontend: React + Vite + Tailwind
- Deployment: Docker Compose (dev/prod), Nginx reverse proxy, Cloudflare Tunnel
- Storage: Local file system via Docker volume mount (/app/uploads)

## 2. Base URL Policy (Single Source of Truth)
- Semua request API dari frontend menggunakan prefix: `/api`
- Development: Vite proxy `/api` -> backend (http://localhost:8000)
- Production: Nginx proxy `/api` -> backend container

## 3. Components & Data Flow
Browser -> (Cloudflare HTTPS) -> Nginx
- `/` serve static frontend
- `/api/*` proxy to backend
Backend -> PostgreSQL (data)
Backend -> Uploads volume (/app/uploads) (files)

## 4. Security Basics (MVP)
- JWT bearer token (access token)
- Password hashing (bcrypt)
- Role-based access check for ADMIN_RW
- File download endpoint checks authorization (owner/admin only)
- Register endpoint must not allow arbitrary role escalation

## 5. Environments
### Dev
- DB + backend via docker-compose.dev.yml
- Frontend via `npm run dev`
### Prod (Pi)
- DB + backend + web + cloudflared via docker-compose.prod.yml
- Public hostname via Cloudflare Tunnel token

## 6. Logging & Errors
- API returns consistent error shape:
  - `{ "detail": "...message..." }` for HTTP exceptions
- Minimal request logging for debugging (optional)
