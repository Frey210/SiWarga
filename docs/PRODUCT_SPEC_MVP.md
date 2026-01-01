# Product Spec – RW Admin Web App (MVP)

## 1. Goal
Aplikasi administrasi RW berbasis web (mobile-first) untuk:
- Pengajuan surat pengantar dan layanan administrasi warga
- Verifikasi dan persetujuan oleh Admin RW
- Pengelolaan data dasar warga untuk keperluan administrasi

---

## 2. Roles
- WARGA
- ADMIN_RW

---

## 3. Data Warga (Mandatory)

Setiap akun WARGA **WAJIB** memiliki data berikut:

- Nama lengkap (sesuai KTP)
- Nomor HP / WhatsApp aktif
- NIK (16 digit)
- Nomor Kartu Keluarga (KK)
- Email (untuk login)
- Role (WARGA / ADMIN_RW)

Data ini digunakan untuk:
- Otomatisasi pengisian surat pengantar
- Validasi administratif oleh RW
- Arsip data warga

---

## 4. MVP User Stories

### WARGA
1) Saya dapat register dan login.
2) Saya mengisi dan menyimpan data identitas warga (nama, NIK, KK, no HP).
3) Saya dapat mengajukan permohonan **surat pengantar**.
4) Saya dapat mengunggah dokumen persyaratan.
5) Saya dapat melihat status dan catatan pengajuan.
6) Saya dapat memperbaiki pengajuan jika diminta revisi.

### ADMIN_RW
1) Saya dapat melihat data warga pemohon.
2) Saya dapat memverifikasi kelengkapan dokumen.
3) Saya dapat mengubah status pengajuan (review / revisi / approve / reject).
4) Saya dapat memberi catatan administratif.
5) Saya dapat melihat riwayat tindakan (audit log).

---

## 5. Jenis Layanan Surat Pengantar (MVP)

MVP **hanya mendukung surat pengantar umum**, antara lain:

1) Surat Pengantar Pembuatan / Perpanjangan KTP
2) Surat Pengantar Pembuatan / Perubahan KK
3) Surat Pengantar Domisili
4) Surat Pengantar SKCK
5) Surat Pengantar Nikah
6) Surat Pengantar Usaha (UMKM)
7) Surat Pengantar Tidak Mampu (opsional)

---

## 6. Workflow Status
- SUBMITTED
- IN_REVIEW
- NEED_REVISION
- APPROVED
- REJECTED

---

## 7. Definition of Done (MVP)
- Data warga lengkap dan tervalidasi
- Pengajuan surat pengantar berjalan end-to-end
- Admin dapat memverifikasi dokumen
- Status dan catatan terlihat oleh warga
