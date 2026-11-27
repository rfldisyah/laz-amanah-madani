# DESIGN.md — Sistem Desain & Aturan Styling UI/UX
**Proyek:** LAZ Amanah Madani Kota Pekanbaru (`db_laz_amanah_madani`)  
**Framework CSS:** Tailwind CSS v4 (`@theme` block di `resources/css/app.css`)  
**Filosofi Visual:** *Minimalist Islamic Editorial, Clean Light-Mode, High-Trust Financial Clarity*

---

## 1. Filosofi Desain & Arah Estetika
Antarmuka **LAZ Amanah Madani** menghindari tampilan portal pemerintah yang kaku atau dashboard admin penuh warna mencolok. Desain mengadopsi gaya **Editorial Finansial Syariah Modern** yang tenang, bersih, dan berwibawa:
* **Light-Mode Exclusive:** Menggunakan latar belakang kertas krem hangat (`#F5F0E6`) yang tidak melelahkan mata, dipadukan dengan kartu putih bersih (`#FFFFFF`) dan kontras teks hijau hutan gelap (`#1E3B2F`).
* **Breathing Room (*Whitespace* Generous):** Jarak antar-section pada *Landing Page* minimal `py-24` (`96px`), dan padding dalam kartu dashboard minimal `p-6` (`24px`) agar data finansial serta tabel audit terasa lapang dan mudah dipindai.
* **Precision Financial Typography:** Seluruh angka nominal Rupiah, nomor rekening BSI/BRK Syariah, dan persentase kuota Amil (`12,5%`) wajib menggunakan `tabular-nums` dan font monospace bersih agar kolom angka sejajar vertikal dengan presisi.

---

## 2. Sistem Warna & Token Tailwind v4 (`@theme`)

Seluruh komponen **dilarang** menggunakan warna bawaan Tailwind seperti `blue-*`, `indigo-*`, `purple-*`, atau `slate-*` mentah. Wajib menggunakan token kustom berikut yang didefinisikan di `resources/css/app.css`:

| Nama Token | Kode Hex | Peran & Aturan Penggunaan |
| :--- | :--- | :--- |
| `--color-laz-forest` | `#1E3B2F` | **Primary Brand & Teks Utama:** Sidebar dashboard, tombol CTA utama, kartu saldo utama, teks heading, dan ikon aktif. |
| `--color-laz-forest-hover` | `#152B22` | **Primary Hover:** State `:hover` pada tombol dan tautan utama `#1E3B2F`. |
| `--color-laz-sage` | `#7F8C6A` | **Secondary / Positif:** Badge status `LAYAK` & `DISETUJUI`, grafik pertumbuhan dana, indikator verifikasi berhasil. |
| `--color-laz-gold` | `#C8B48A` | **Accent / Highlight:** Border halus kartu (`border-laz-gold/35`), highlight angka statistik penting, indikator kategori `ZAKAT`, progress bar kuota Amil. |
| `--color-laz-cream` | `#F5F0E6` | **Canvas Background:** Latar belakang utama halaman (`body`), latar belakang selang-seling section publik, dan hover row tabel. |
| `--color-laz-surface` | `#FFFFFF` | **Card & Modal Surface:** Permukaan kartu data, form input, modal konfirmasi, dan header tabel sticky. |
| `--color-laz-muted` | `#5C6B61` | **Secondary Text:** Label form, deskripsi sub-heading, timestamp transaksi, dan metadata audit. |
| `--color-laz-danger` | `#9E3B33` | **Semantic Error / Ditolak:** Status `TIDAK_LAYAK`, alert pelanggaran trigger SQL (misal: kuota Amil > 12,5%), dan validasi gagal (merah bata hangat agar harmonis dengan palet bumi). |
| `--color-laz-warning` | `#B8863B` | **Semantic Pending:** Status `BELUM_VERIFIKASI` dan SK berstatus `DRAFT`. |

### Konfigurasi Wajib `resources/css/app.css`
```css
@import "tailwindcss";

@theme {
    --color-laz-forest: #1E3B2F;
    --color-laz-forest-hover: #152B22;
    --color-laz-sage: #7F8C6A;
    --color-laz-gold: #C8B48A;
    --color-laz-cream: #F5F0E6;
    --color-laz-surface: #FFFFFF;
    --color-laz-muted: #5C6B61;
    --color-laz-danger: #9E3B33;
    --color-laz-warning: #B8863B;

    --font-sans: "Plus Jakarta Sans", "Inter", ui-sans-serif, system-ui, sans-serif;
    --font-mono: "JetBrains Mono", ui-monospace, SFMono-Regular, monospace;

    --radius-card: 1rem;       /* 16px - Sudut kartu modern lembut */
    --radius-button: 0.75rem;  /* 12px - Sudut tombol presisi */
    --radius-badge: 9999px;    /* Pill shape untuk status */
}

@layer base {
    html {
        background-color: var(--color-laz-cream);
        color: var(--color-laz-forest);
        font-family: var(--font-sans);
        -webkit-font-smoothing: antialiased;
    }

    ::selection {
        background-color: var(--color-laz-gold);
        color: var(--color-laz-forest);
    }
}