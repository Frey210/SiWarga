# Deployment Runbook

## Dev
1) cp .env.example .env
2) docker compose -f docker-compose.dev.yml up -d --build
3) Run migrations:
   - docker compose -f docker-compose.dev.yml exec backend alembic upgrade head
4) cd frontend && npm i && npm run dev
5) Open http://localhost:5173
6) Verify /api/health OK

## Prod (Pi)
1) cp .env.example .env (set JWT_SECRET, TUNNEL_TOKEN)
2) docker compose -f docker-compose.prod.yml up -d --build
3) Run migrations:
   - docker compose -f docker-compose.prod.yml exec backend alembic upgrade head
4) Open http://<pi-ip>:8080
5) Verify /api/health, login, submissions flow
6) Tunnel hostname should map to web service

## Backup
- pg_dump (db)
- tar uploads volume