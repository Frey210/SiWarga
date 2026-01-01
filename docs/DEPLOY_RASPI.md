# Deployment on Raspberry Pi

## 1. Target Environment
- Raspberry Pi 4 or 5
- Raspberry Pi OS 64-bit
- Docker and Docker Compose plugin installed

---

## 2. Prepare Environment
```bash
sudo apt update
sudo apt install docker.io docker-compose-plugin -y
sudo usermod -aG docker $USER
reboot
```

---

## 3. Configure Environment
```bash
cp .env.example .env
```

Environment variables:
- POSTGRES_USER
- POSTGRES_PASSWORD
- POSTGRES_DB
- DATABASE_URL
- JWT_SECRET
- JWT_ALGORITHM
- JWT_EXPIRES_MINUTES
- UPLOADS_DIR
- TUNNEL_TOKEN

Set `TUNNEL_TOKEN` in `.env` for Cloudflare Tunnel.

---

## 4. Build and Run (Production)
```bash
docker compose -f docker-compose.prod.yml up -d --build
```

---

## 5. Uploads Volume
Uploads are planned to live in the `uploads_data` Docker volume mounted at `/app/uploads` in the backend.
Backup this volume before any migrations to persistent storage.

---

## 6. Verify
Open `http://<pi-ip>:8080` and confirm the UI shows `status: ok`.
