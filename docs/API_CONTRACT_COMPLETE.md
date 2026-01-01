# API Contract (MVP)

Base path: `/api`

## Auth
### POST /auth/register
Body:
- email, password
- full_name, phone_number, nik, kk_number

Output:
- { id, email, role, full_name, phone_number, nik, kk_number }

Rules:
- register ALWAYS creates role=WARGA
- admin account created manually/seeded (not via public register)

### POST /auth/login
Body: email, password
Output:
- { access_token, token_type: "bearer" }

### GET /auth/me
Header: Authorization: Bearer <token>
Output:
- { id, email, role, full_name, phone_number, nik, kk_number }

---

## Submissions (WARGA)
### POST /submissions
Header: Authorization
Body:
- type (string)
- payload (object/json)
Output: submission object

### GET /submissions
Header: Authorization
Query (optional): status, type
Output: list of submissions (own)

### GET /submissions/{id}
Header: Authorization
Output:
- submission detail + files + last_action

### POST /submissions/{id}/files
Header: Authorization
Form-data:
- document_type
- file
Output: file metadata

---

## Admin
### GET /admin/submissions
Header: Authorization (ADMIN_RW only)
Query: status, type, q(optional)
Output: list all

### GET /admin/submissions/{id}
Header: Authorization (ADMIN_RW only)
Output: submission detail + files + logs

### POST /submissions/{id}/actions
Header: Authorization (ADMIN_RW only)
Body:
- action: "SET_IN_REVIEW" | "APPROVE" | "REJECT" | "REQUEST_REVISION"
- note: string
Output:
- { submission, log }

---

## Files
### GET /files/{id}
Header: Authorization
Rule:
- owner or ADMIN_RW only
Output:
- file stream (download/view)

---

## Health
### GET /health
Output: { status: "ok" }