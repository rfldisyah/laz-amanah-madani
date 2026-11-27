# Product Requirements Document (PRD)
**Nama Proyek:** Sistem Informasi Manajemen & Transparansi ZIS — LAZ Amanah Madani Kota Pekanbaru  
**Database Inti:** `db_laz_amanah_madani` (MariaDB / MySQL 8.0+)  
**Tech Stack:** Laravel 11, Inertia.js, React 18 (TypeScript), Tailwind CSS, Motion (`framer-motion`), GSAP (`@gsap/react`), Lenis (`lenis`)  

---

## 1. Ringkasan Eksekutif & Visi Produk
Aplikasi web ini adalah antarmuka operasional dan portal transparansi publik resmi untuk **Lembaga Amil Zakat (LAZ) Amanah Madani tingkat Kota Pekanbaru**. Sistem ini mengadopsi arsitektur **Database-Centric**, di mana seluruh aturan kepatuhan syariah, pemisahan rekening akad, kuota maksimal hak Amil (12,5%), kelayakan mustahik 1 tahun, dan penguncian saldo anti-minus (`FOR UPDATE`) dieksekusi langsung oleh Stored Procedure dan Trigger di dalam `db_laz_amanah_madani`.

---

## 2. Identitas Visual & Design System (Minimalist Modern Light Mode)
Antarmuka mengutamakan kesan **bersih, menenangkan, modern, dan terpercaya** dengan mode terang (*light-mode first*) menggunakan palet warna berikut:

| Token Peran | Nama Warna | Kode Hex | Penggunaan Utama |
| :--- | :--- | :--- | :--- |
| **Background Utama** | Warm Alabaster / Cream | `#F5F0E6` | Latar belakang utama kanvas halaman agar nyaman dibaca |
| **Primary / Brand** | Deep Forest Emerald | `#1E3B2F` | Teks utama (*headings*), tombol CTA utama, sidebar, kartu saldo utama |
| **Secondary / Sage** | Olive Sage Green | `#7F8C6A` | Badge status `LAYAK`/`DISETUJUI`, grafik pertumbuhan dana, aksen sekunder |
| **Accent / Gold** | Warm Sand Gold | `#C8B48A` | Highlight angka statistik, garis pembatas halus, indikator kuota 8 Asnaf |
| **Surface Card** | Pure Soft White | `#FFFFFF` | Kartu tabel/form di atas kanvas `#F5F0E6` dengan border `#C8B48A/30` |

### Prinsip Tipografi & Gerak (Motion Design)
* **Tipografi:** `Plus Jakarta Sans` untuk judul modern dan `Inter` / `JetBrains Mono` (tabular-nums) untuk nominal Rupiah dan nomor rekening agar sejajar rapi.
* **Lenis Smooth Scroll:** Diterapkan pada halaman publik (*Landing Page* & *Transparansi*) untuk pengalaman *scrolling* yang halus.
* **GSAP (`ScrollTrigger`):** Digunakan untuk animasi *counter-up* statistik dana terhimpun/tersalurkan, *pinned storytelling* alur kerja ZIS, dan *stagger reveal* kartu program.
* **Motion (`framer-motion`):** Digunakan untuk transisi halaman Inertia, mikro-interaksi tombol, modal verifikasi, dan animasi pergantian tab role.

---

## 3. Halaman Publik (Landing Page & Portal Transparansi)
Halaman awal saat pengunjung (masyarakat/muzaki) membuka website tanpa perlu login operasional:

1. **Hero Section Minimalis:**
   * Headline kuat tentang amanah pengelolaan ZIS Kota Pekanbaru, tombol CTA *"Salurkan Zakat & Infak"* (membuka modal informasi rekening resmi lembaga) dan *"Cek Laporan Transparansi"*.
   * Kartu ringkasan *real-time* yang menarik data langsung dari `saldo_dana` dan `mutasi_dana`.
2. **Direktori Rekening Resmi Lembaga (`rekening_lembaga`):**
   * Menampilkan daftar nomor rekening aktif (`is_aktif = 1`) yang dikelompokkan tegas berdasarkan `kategori_induk` (**ZAKAT**, **INFAK_SEDEKAH**, **WAKAF**) — seperti BSI (`7100112233`) dan Bank Riau Kepri Syariah (`1082004455`), lengkap dengan fitur *1-click copy* nomor rekening dan edukasi bahwa sistem menolak pencampuran dana antar-akad.
3. **Dashboard Transparansi Publik (`v_laporan_publik_zis`):**
   * **Statistik Penghimpunan vs Penyaluran:** Grafik batang/donat distribusi per kategori dana dan per 8 golongan Asnaf (`Fakir`, `Miskin`, `Amil <= 12.5%`, `Mualaf`, `Riqab`, `Gharimin`, `Fisabilillah`, `Ibnu Sabil`).
   * **Tabel Riwayat Penyaluran Tersamar:** Menampilkan daftar penyaluran berstatus `DISALURKAN` langsung dari database view `v_laporan_publik_zis`, di mana NIK dan nama lengkap mustahik otomatis tersamar (`****`) untuk menjaga martabat penerima manfaat.
4. **Kalkulator Zakat Interaktif (Client-Side):**
   * Kalkulator cepat untuk menghitung Zakat Penghasilan/Profesi dan Zakat Maal (nisab 85 gram emas) yang langsung mengarahkan pengguna ke rekening Zakat yang tepat.

---

## 4. Fitur Operasional Internal (4 Role-Based Access Control)
Akses ke `/dashboard` dibatasi hanya untuk staf internal yang terdaftar di tabel `pengguna` sesuai perannya:

### A. `petugas_penghimpunan` (Front-Office & Layanan Muzaki)
* **Manajemen Muzaki (`muzaki`):** Tambah dan cari data donatur bertipe `PERORANGAN` (validasi 16 digit NIK) atau `LEMBAGA` (validasi NPWP perusahaan/instansi).
* **Pencatatan Penghimpunan (`CALL sp_catat_penghimpunan`):** Form pencatatan setoran dana (`TUNAI` di gerai atau `TRANSFER` bank). Dropdown `id_rekening` otomatis memfilter rekening sesuai `jenis_dana` yang dipilih agar terhindar dari penolakan trigger.
* **Penyusunan Draft Penyaluran (`penyaluran` & `detail_penyaluran`):** Membuat pengajuan SK Penyaluran baru (`DRAFT`) untuk suatu `program`, lalu menambahkan daftar mustahik penerima.

### B. `verifikator` (Tim Survei Lapangan)
* **Pendaftaran Calon Mustahik (`mustahik`):** Input biodata warga Pekanbaru beserta klasifikasi `id_asnaf` (status default otomatis `BELUM_VERIFIKASI`).
* **Input Berita Acara Survei (`CALL sp_verifikasi_mustahik`):** Form keputusan hasil survei lapangan (`LAYAK` berlaku 1 tahun atau `TIDAK_LAYAK`) beserta catatan survei. Otomatis mengisi `survei_verifikasi_mustahik`, memperbarui `mustahik`, dan mencatat ke `log_audit`.

### C. `manajer_penyaluran` (Pimpinan & Otorisator)
* **Persetujuan SK (`CALL sp_setujui_penyaluran`):** Meninjau daftar SK berstatus `DRAFT`, memeriksa rincian penerima dan kuota Amil (`<= 12.5%`), lalu mengesahkannya menjadi `DISETUJUI` (mengisi `id_penyetuju` yang wajib berbeda dengan `id_pengaju`).
* **Eksekusi Pencairan Dana (`CALL sp_cairkan_penyaluran`):** Mencairkan SK berstatus `DISETUJUI` menjadi `DISALURKAN`. Menjalankan *pessimistic locking* (`FOR UPDATE`) pada `saldo_dana` dan mencatat jurnal `KELUAR` ke `mutasi_dana`.

### D. `admin_sistem` (Administrator IT & Auditor)
* **Master Data Management:** Kelola data `pengguna`, `program`, `jenis_dana`, dan `rekening_lembaga`.
* **Buku Besar Terpartisi (`mutasi_dana`):** Eksplorasi mutasi kas dengan filter tahun partisi (`2024`, `2025`, `2026+`) untuk memanfaatkan *partition pruning*.
* **Audit Trail (`log_audit`):** Antarmuka *read-only* (tanpa tombol edit/hapus) untuk memantau seluruh aktivitas sensitif sistem.

---

## 5. Persyaratan Teknis & Keamanan
1. **Dilarang Bypass Stored Procedure:** Controller Laravel **tidak boleh** melakukan `INSERT`/`UPDATE` langsung pada transaksi inti (`penghimpunan`, `verifikasi`, `persetujuan`, `pencairan`). Wajib menggunakan `DB::statement('CALL sp_...(...)')` di dalam blok `try-catch` untuk menangkap pesan `SIGNAL SQLSTATE '45000'` dari MySQL/MariaDB dan menampilkannya sebagai notifikasi error yang ramah di UI React.
2. **Koneksi Database Terpisah untuk Publik:** Endpoint halaman depan & transparansi mengambil data menggunakan kredensial koneksi `mysql_publik` (`usr_laz_laporan`) yang hanya memiliki hak `SELECT` pada view publik dan tabel agregasi aman.