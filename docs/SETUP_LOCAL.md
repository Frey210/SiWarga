# Local Development Setup

## 1. Prerequisites
- Node.js >= 18
- Docker and Docker Compose
- Git
- VSCode (recommended)

---

## 2. Clone Repository
```bash
git clone <repo-url>
cd E-Gov
```

---

## 3. Configure Environment
Copy the example env file and adjust if needed.

```bash
copy .env.example .env
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

Uploads folder:
- Local dev path: `backend/uploads`
- Container path: `/app/uploads`

---

## 4. Start Backend and Database
```bash
docker compose -f docker-compose.dev.yml up -d --build
```

Run migrations:
```bash
docker compose -f docker-compose.dev.yml exec backend alembic upgrade head
```

---

## 5. Start Frontend
In a new terminal:

```bash
cd frontend
npm install
npm run dev
```

---

## 6. Verify Health
Open the Vite URL in the browser and confirm the UI shows `status: ok`.

---

## 7. Auth Testing (curl)
Register (WARGA only):
```bash
curl -X POST http://localhost:8000/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"warga@rw.local\",\"password\":\"secret\",\"full_name\":\"Budi\",\"phone_number\":\"08123456789\",\"nik\":\"1234567890123456\",\"kk_number\":\"1234567890123456\"}"
```

Login:
```bash
curl -X POST http://localhost:8000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"warga@rw.local\",\"password\":\"secret\"}"
```

Me (use access_token from login):
```bash
curl http://localhost:8000/api/auth/me ^
  -H "Authorization: Bearer <token>"
```

---

## 8. Submissions Testing (curl)
Create submission (WARGA token):
```bash
curl -X POST http://localhost:8000/api/submissions ^
  -H "Authorization: Bearer <token>" ^
  -H "Content-Type: application/json" ^
  -d "{\"type\":\"Surat Pengantar KTP\",\"payload\":{\"note\":\"Test\",\"checklist\":[\"KTP\",\"KK\"]}}"
```

List own:
```bash
curl http://localhost:8000/api/submissions ^
  -H "Authorization: Bearer <token>"
```

Detail (own):
```bash
curl http://localhost:8000/api/submissions/<id> ^
  -H "Authorization: Bearer <token>"
```

Upload file:
```bash
curl -X POST http://localhost:8000/api/submissions/<id>/files ^
  -H "Authorization: Bearer <token>" ^
  -F "document_type=KTP" ^
  -F "file=@C:\\path\\to\\file.pdf"
```

Download file:
```bash
curl http://localhost:8000/api/files/<file_id> ^
  -H "Authorization: Bearer <token>" -O
```

---

## 9. Admin Actions (curl)
Admin list:
```bash
curl http://localhost:8000/api/admin/submissions ^
  -H "Authorization: Bearer <admin_token>"
```

Admin detail:
```bash
curl http://localhost:8000/api/admin/submissions/<id> ^
  -H "Authorization: Bearer <admin_token>"
```

Set in review:
```bash
curl -X POST http://localhost:8000/api/submissions/<id>/actions ^
  -H "Authorization: Bearer <admin_token>" ^
  -H "Content-Type: application/json" ^
  -d "{\"action\":\"SET_IN_REVIEW\",\"note\":\"Checking\"}"
```

Approve:
```bash
curl -X POST http://localhost:8000/api/submissions/<id>/actions ^
  -H "Authorization: Bearer <admin_token>" ^
  -H "Content-Type: application/json" ^
  -d "{\"action\":\"APPROVE\",\"note\":\"OK\"}"
```

Request revision:
```bash
curl -X POST http://localhost:8000/api/submissions/<id>/actions ^
  -H "Authorization: Bearer <admin_token>" ^
  -H "Content-Type: application/json" ^
  -d "{\"action\":\"REQUEST_REVISION\",\"note\":\"Fix file\"}"
```