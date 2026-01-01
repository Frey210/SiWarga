# RW Admin Web App

Phase 0 skeleton for FastAPI + Postgres + React + Vite + Tailwind with Docker Compose.

## Dev Validation

1. Copy env file.
   - `copy .env.example .env`
2. Start backend and db.
   - `docker compose -f docker-compose.dev.yml up --build`
3. Start frontend.
   - `cd frontend`
   - `npm install`
   - `npm run dev`
4. Open the Vite URL in the browser and verify the page shows `status: ok`.
   - Health endpoint: `GET /api/health`

## Prod Validation

1. Copy env file.
   - `copy .env.example .env`
2. Build and start all services.
   - `docker compose -f docker-compose.prod.yml up -d --build`
3. Open `http://<pi-ip>:8080` and verify the page shows `status: ok`.
   - Health endpoint: `GET /api/health`
4. Cloudflare Tunnel uses `TUNNEL_TOKEN` to expose the `web` service.