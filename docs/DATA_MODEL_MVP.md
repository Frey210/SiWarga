# Data Model - MVP

## 1. User (Warga & Admin)

Fields:
- id
- email (unique)
- password_hash
- role: WARGA | ADMIN_RW
- full_name (string)
- phone_number (string)
- nik (string, 16 digit)
- kk_number (string)
- created_at
- updated_at

Rules:
- Data identitas wajib untuk WARGA
- ADMIN_RW boleh memiliki data minimal (tanpa NIK/KK)

---

## 2. Submission (Pengajuan Surat)

Fields:
- id
- user_id (pemohon)
- type (string)
- payload (JSON detail tambahan)
- status (enum)
- created_at
- updated_at

---

## 3. SubmissionFile (Dokumen Persyaratan)

Fields:
- id
- submission_id
- document_type (string)
- original_name
- stored_name
- mime_type
- size_bytes
- created_at

---

## 4. ApprovalLog

Fields:
- id
- submission_id
- actor_user_id (ADMIN_RW)
- action
- note
- created_at