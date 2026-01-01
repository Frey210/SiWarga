# System Architecture - RW Admin Web App

## 1. Overview
RW Admin Web App adalah aplikasi administrasi RW berbasis web dengan pendekatan mobile-first,
dibangun menggunakan FastAPI (backend) dan React (frontend), serta di-deploy secara mandiri di
Raspberry Pi menggunakan Docker dan Cloudflare Tunnel.

Target utama:
- Warga RW (akses via HP)
- Admin RW (akses via HP / desktop)

---

## 2. High-Level Architecture

Client (Browser / Mobile)
        |
        v
Cloudflare Tunnel (HTTPS)
        |
        v
Nginx (Reverse Proxy + Static Frontend)
        |
        +--> /api/*  -> FastAPI Backend
        |
        +--> /       -> React Static Files
                          |
                          v
                     PostgreSQL Database
                     File Storage (Uploads)

---

## 3. Components

### 3.1 Frontend
- React + Vite + Tailwind
- Mobile-first UI
- Static build served by Nginx
- API access via relative path `/api`

### 3.2 Backend
- FastAPI
- REST API
- JWT-based authentication
- SQLAlchemy ORM + Alembic migrations

### 3.3 Database
- PostgreSQL
- Docker volume for persistence

### 3.4 Reverse Proxy
- Nginx
- Serve frontend
- Proxy `/api/*` to backend service

### 3.5 Tunnel
- Cloudflare Tunnel
- No port forwarding required
- Public domain/subdomain exposure

---

## 4. Environment Separation

### Development
- Backend + DB via Docker Compose
- Frontend via Vite dev server
- API base path: `/api` (proxied to `http://localhost:8000`)

### Production
- Semua service via Docker Compose
- Frontend static via Nginx
- API base path: `/api`
- Public access via Cloudflare Tunnel

---

## 5. Design Principles
- Mobile-first
- Simplicity over complexity
- Clear role-based access
- Auditability (log tindakan admin)
- Self-hosted and low-cost