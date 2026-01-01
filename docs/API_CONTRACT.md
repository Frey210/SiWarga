# API Contract - MVP

## Base URL
- Development: /api (proxied to http://localhost:8000)
- Production: /api

---

## Auth
POST /auth/register
- body: { email, password, full_name, phone_number, nik, kk_number }
- register always creates role=WARGA

POST /auth/login
- body: { email, password }
- response: { access_token, token_type }

GET /auth/me
- header: Authorization: Bearer <token>
- response includes profile fields

---

## Submissions (WARGA)
POST /submissions
- body: { type, payload }

GET /submissions
- list own (query: status, type)

GET /submissions/{id}
- detail own + files + last_action

POST /submissions/{id}/files
- multipart: document_type + file

---

## Admin Submissions (ADMIN_RW)
GET /admin/submissions
- query: status, type, q

GET /admin/submissions/{id}

POST /submissions/{id}/actions
- body: { action, note }
- action: SET_IN_REVIEW | APPROVE | REJECT | REQUEST_REVISION

---

## Files
GET /files/{id}
- authorized owner or admin

---

## Health
GET /health