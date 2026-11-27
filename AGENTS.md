# AGENTS.md — Pedoman Arsitektur & Pengembangan AI Agent

Dokumen ini adalah panduan wajib bagi AI Coding Assistant (Claude, Cursor, Antigravity, Copilot) saat menulis, memodifikasi, atau melakukan refactoring kode pada proyek **LAZ Amanah Madani Kota Pekanbaru**.

---

## 1. Konteks Proyek & Aturan Emas Database
* **Nama Database:** `db_laz_amanah_madani` (Sudah eksis dan memiliki struktur 14 tabel, Stored Procedures, Triggers, Views, dan Partisi `mutasi_dana` tahun 2024–2026+).
* **JANGAN PERNAH membuat Laravel Migrations baru yang mengubah/menimpa skema tabel inti** tanpa izin eksplisit, karena struktur RDBMS sudah dikunci dengan constraint dan trigger tingkat lanjut.
* **Prinsip Database-Centric:** Logika bisnis kritis berada di RDBMS, bukan di PHP.
  * Untuk mencatat uang masuk $\rightarrow$ panggil `CALL sp_catat_penghimpunan(...)`.
  * Untuk memverifikasi mustahik $\rightarrow$ panggil `CALL sp_verifikasi_mustahik(...)`.
  * Untuk menyetujui SK penyaluran $\rightarrow$ panggil `CALL sp_setujui_penyaluran(...)`.
  * Untuk mencairkan dana $\rightarrow$ panggil `CALL sp_cairkan_penyaluran(...)`.
* **Penanganan Error SQLSTATE:** Selalu tangkap `Illuminate\Database\QueryException` saat memanggil Stored Procedure atau `INSERT` ke `detail_penyaluran`. Ekstrak pesan error kustom dari trigger/procedure (misal: *"Kuota hak amil melebihi 12.5%"* atau *"Mustahik belum diverifikasi / kedaluwarsa"*) dan kembalikan via `back()->withErrors(['db_error' => $cleanMessage])`.

---

## 2. Konvensi Tech Stack & Struktur Direktori
* **Backend:** Laravel 11 (PHP 8.2+), menggunakan Inertia.js (`inertiajs/inertia-laravel`).
* **Frontend:** React 18 + TypeScript (`.tsx`), Tailwind CSS, Lucide React Icons.
* **Animasi:**
  * `lenis` (smooth scrolling khusus layout publik).
  * `gsap` + `@gsap/react` (animasi scroll-triggered, counter statistik, hero reveal).
  * `framer-motion` (transisi komponen, modal, tab, micro-interactions).

### Struktur Folder Wajib
```text
app/
├── Http/
│   ├── Controllers/
│   │   ├── Public/LandingTransparansiController.php
│   │   ├── PenghimpunanController.php
│   │   ├── MustahikVerifikasiController.php
│   │   ├── PenyaluranController.php
│   │   └── AdminMasterController.php
│   └── Middleware/CheckLazRole.php
├── Models/ (Gunakan $timestamps = false jika tabel tidak punya created_at/updated_at standar Laravel)
resources/js/
├── Layouts/
│   ├── PublicLayout.tsx       # Menggunakan Lenis Smooth Scroll + Navbar Minimalis
│   └── DashboardLayout.tsx    # Sidebar #1E3B2F + Topbar bersih tanpa Lenis berat
├── Components/
│   ├── ui/                    # Komponen dasar bertema palet #1E3B2F, #7F8C6A, #C8B48A, #F5F0E6
│   ├── motion/                # Wrapper reusable untuk GSAP & Framer Motion
│   └── zakat/                 # Kartu Rekening, Tabel Transparansi, Badge Status Asnaf
├── Pages/
│   ├── Public/Home.tsx        # Landing Page + Portal Transparansi Publik
│   ├── Auth/Login.tsx
│   └── Dashboard/...
└── types/
    └── database.ts            # Interface TypeScript presisi sesuai kolom db_laz_amanah_madani