# UI Spec - MVP

## Warga

### Register / Login
- Register form: email, password, full name, phone, NIK, KK
- Login form: email, password

### Profile / Data Warga
- Full Name
- Phone / WhatsApp
- NIK
- Nomor KK
- Email (readonly)

Data ini:
- Wajib diisi sebelum membuat pengajuan
- Ditampilkan pada detail pengajuan admin

---

### Dashboard
- List pengajuan (status, type)
- Tombol New Submission

---

### New Submission
- Pilih jenis surat
- Form tambahan (textarea)
- Checklist dokumen persyaratan (textarea list)
- Upload dokumen dilakukan di detail setelah submit

---

### Submission Detail
- Status + last action note
- Daftar file
- Upload dokumen (document type + file)

---

## Admin
- List semua submissions
- Detail: identitas warga, dokumen, payload
- Action buttons (set in review / approve / reject / request revision) + note
- Logs list