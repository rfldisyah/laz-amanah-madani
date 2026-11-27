import { useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    BookOpenCheck,
    CheckCircle2,
    ClipboardCheck,
    Database,
    FileCheck2,
    HandCoins,
    ShieldAlert,
} from 'lucide-react';

import DashboardLayout from '@/Layouts/DashboardLayout';
import type { PeranPengguna, SharedPageProps } from '@/types/database';

interface RoleGuide {
    role: PeranPengguna;
    label: string;
    ringkasan: string;
    langkah: {
        judul: string;
        deskripsi: string;
        href?: string;
        cta?: string;
    }[];
}

const ROLE_GUIDES: RoleGuide[] = [
    {
        role: 'petugas_penghimpunan',
        label: 'Petugas Penghimpunan',
        ringkasan:
            'Mengelola data donatur (muzaki), mencatat setoran masuk sesuai akad, serta mengajukan Draft SK penyaluran.',
        langkah: [
            {
                judul: '1. Daftarkan atau Periksa Data Muzaki',
                deskripsi:
                    'Pastikan donatur terdaftar pada menu Data Muzaki (NIK 16 digit untuk Perorangan atau NPWP 15–16 digit untuk Lembaga).',
                href: '/muzaki',
                cta: 'Buka Data Muzaki',
            },
            {
                judul: '2. Catat Setoran ZISWAF Masuk',
                deskripsi:
                    'Pilih muzaki, jenis dana (Zakat/Infak/Wakaf), dan rekening tujuan yang sesuai akadnya. Sistem otomatis memperbarui saldo dan buku besar.',
                href: '/penghimpunan',
                cta: 'Catat Penghimpunan',
            },
            {
                judul: '3. Ajukan Draft SK & Daftar Penerima',
                deskripsi:
                    'Buat SK berstatus DRAFT berdasarkan program aktif, lalu masukkan mustahik berstatus LAYAK ke rincian penerima.',
                href: '/penyaluran',
                cta: 'Draft SK Penyaluran',
            },
        ],
    },
    {
        role: 'verifikator',
        label: 'Tim Survei & Verifikasi',
        ringkasan:
            'Mendaftarkan calon penerima bantuan dan mengesahkan kelayakan mustahik berdasarkan berita acara survei lapangan.',
        langkah: [
            {
                judul: '1. Daftarkan Calon Mustahik Baru',
                deskripsi:
                    'Input NIK 16 digit, nama lengkap, golongan asnaf awal, dan kecamatan. Status awal otomatis BELUM_VERIFIKASI.',
                href: '/mustahik',
                cta: 'Buka Mustahik & Survei',
            },
            {
                judul: '2. Lakukan Survei & Input Berita Acara',
                deskripsi:
                    'Klik tombol Survei pada baris mustahik, isi rekomendasi asnaf, skor kelayakan (0–100), dan keputusan LAYAK atau TIDAK_LAYAK.',
                href: '/mustahik',
                cta: 'Input Berita Acara',
            },
            {
                judul: '3. Masa Berlaku & Draft SK',
                deskripsi:
                    'Status LAYAK berlaku selama 1 tahun sejak tanggal survei. Mustahik yang layak dapat langsung dimasukkan ke Draft SK penyaluran.',
                href: '/penyaluran',
                cta: 'Lihat Draft SK',
            },
        ],
    },
    {
        role: 'manajer_penyaluran',
        label: 'Manajer Penyaluran',
        ringkasan:
            'Memeriksa rincian penerima pada SK DRAFT, mengesahkan SK penyaluran, dan mengeksekusi pencairan dana secara aman.',
        langkah: [
            {
                judul: '1. Periksa Rincian Penerima SK',
                deskripsi:
                    'Buka menu Otorisasi & Pencairan, lalu klik Rincian untuk memeriksa daftar mustahik dan total nominal dibandingkan saldo kantong dana.',
                href: '/penyaluran/otorisasi',
                cta: 'Buka Otorisasi SK',
            },
            {
                judul: '2. Sahkan SK (DRAFT → DISETUJUI)',
                deskripsi:
                    'Klik Setujui SK. Sesuai aturan kontrol internal, pengesah harus berbeda dengan petugas yang mengajukan SK tersebut.',
                href: '/penyaluran/otorisasi',
                cta: 'Proses Persetujuan',
            },
            {
                judul: '3. Cairkan Dana (DISETUJUI → DISALURKAN)',
                deskripsi:
                    'Klik Cairkan Dana setelah SK disetujui. Sistem mengunci baris saldo agar tidak pernah minus dan mencatat mutasi keluar otomatis.',
                href: '/penyaluran/otorisasi',
                cta: 'Eksekusi Pencairan',
            },
        ],
    },
    {
        role: 'admin_sistem',
        label: 'Administrator Sistem',
        ringkasan:
            'Mengelola data master lembaga, menelusuri buku besar mutasi kas per partisi tahun, serta memantau log audit sistem.',
        langkah: [
            {
                judul: '1. Kelola Master Program, Rekening & Staf',
                deskripsi:
                    'Tambah program baru, aktif/nonaktifkan rekening bank lembaga atau jenis dana, serta kelola akun staf internal.',
                href: '/admin/master',
                cta: 'Master Data Lembaga',
            },
            {
                judul: '2. Telusuri Buku Besar Terpartisi',
                deskripsi:
                    'Gunakan filter partisi tahun (2024, 2025, 2026, 2027+) untuk meninjau arus kas masuk dan keluar secara cepat.',
                href: '/admin/mutasi',
                cta: 'Buku Besar Terpartisi',
            },
            {
                judul: '3. Pantau Audit Trail (Read-Only)',
                deskripsi:
                    'Periksa rekam jejak perubahan tabel sensitif (INSERT/UPDATE/DELETE) yang dicatat otomatis oleh sistem tanpa dapat diubah.',
                href: '/admin/audit',
                cta: 'Buka Audit Trail',
            },
        ],
    },
];

const GUARDRAILS = [
    {
        title: 'Pemisahan Rekening & Akad',
        desc: 'Setoran atau pencairan Zakat tidak boleh memakai rekening Infak/Wakaf (dan sebaliknya).',
    },
    {
        title: 'Syarat Mustahik Layak & Aktif',
        desc: 'Dana Zakat hanya dapat disalurkan kepada mustahik berstatus LAYAK yang masa surveinya belum kedaluwarsa.',
    },
    {
        title: 'Kuota Hak Amil Maksimal 12,5%',
        desc: 'Penyaluran untuk golongan AMIL otomatis ditolak apabila melebihi 12,5% dari zakat terhimpun pada periode berjalan.',
    },
    {
        title: 'Pengaju ≠ Penyetuju & Anti-Minus Saldo',
        desc: 'Pembuat Draft SK tidak boleh mengesahkan SK-nya sendiri, dan pencairan ditolak jika saldo kantong dana tidak mencukupi.',
    },
];

export default function Panduan() {
    const { auth } = usePage<SharedPageProps>().props;
    const defaultRole: PeranPengguna = auth.user?.peran ?? 'petugas_penghimpunan';
    const [selectedRole, setSelectedRole] = useState<PeranPengguna>(defaultRole);

    const activeGuide =
        ROLE_GUIDES.find((g) => g.role === selectedRole) ?? ROLE_GUIDES[0];

    const roleIcons: Record<PeranPengguna, typeof HandCoins> = {
        petugas_penghimpunan: HandCoins,
        verifikator: ClipboardCheck,
        manajer_penyaluran: FileCheck2,
        admin_sistem: Database,
    };

    return (
        <DashboardLayout title="Panduan">
            <Head title="Panduan" />

            <div className="space-y-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-laz-forest">
                            Panduan Operasional &amp; Tata Cara Sistem
                        </h1>
                        <p className="mt-1 text-sm text-laz-muted">
                            Alur kerja standar dan aturan otomatis sistem LAZ Amanah Madani Kota Pekanbaru untuk setiap peran staf.
                        </p>
                    </div>
                    <span className="inline-flex items-center gap-2 rounded-full border border-laz-gold/45 bg-laz-surface px-4 py-2 text-xs font-semibold text-laz-forest">
                        <BookOpenCheck className="h-4 w-4 text-laz-sage" aria-hidden="true" />
                        SOP Operasional Internal
                    </span>
                </div>

                {/* Role Selector Tabs */}
                <div
                    role="tablist"
                    aria-label="Panduan berdasarkan peran"
                    className="flex flex-wrap gap-2 rounded-[var(--radius-card)] border border-laz-gold/35 bg-laz-surface p-2"
                >
                    {ROLE_GUIDES.map((guide) => {
                        const Icon = roleIcons[guide.role];
                        const isActive = guide.role === selectedRole;
                        return (
                            <button
                                key={guide.role}
                                type="button"
                                role="tab"
                                aria-selected={isActive}
                                onClick={() => setSelectedRole(guide.role)}
                                className={`inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-button)] px-4 py-2 text-sm font-semibold transition-colors ${
                                    isActive
                                        ? 'bg-laz-forest text-laz-surface'
                                        : 'text-laz-muted hover:bg-laz-cream hover:text-laz-forest'
                                }`}
                            >
                                <Icon className="h-4 w-4" aria-hidden="true" />
                                <span>{guide.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Active Role Guide */}
                <section className="rounded-[var(--radius-card)] border border-laz-gold/35 bg-laz-surface p-6 space-y-6">
                    <div className="border-b border-laz-gold/25 pb-4">
                        <h2 className="text-lg font-bold text-laz-forest">
                            Alur Kerja: {activeGuide.label}
                        </h2>
                        <p className="mt-1 text-sm text-laz-muted">
                            {activeGuide.ringkasan}
                        </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                        {activeGuide.langkah.map((step) => (
                            <div
                                key={step.judul}
                                className="rounded-[var(--radius-button)] border border-laz-gold/35 bg-laz-cream/55 p-5 flex flex-col justify-between gap-4"
                            >
                                <div>
                                    <h3 className="text-sm font-bold text-laz-forest">
                                        {step.judul}
                                    </h3>
                                    <p className="mt-2 text-sm leading-relaxed text-laz-muted">
                                        {step.deskripsi}
                                    </p>
                                </div>

                                {step.href && step.cta && (
                                    <Link
                                        href={step.href}
                                        className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-button)] border border-laz-gold/45 bg-laz-surface hover:bg-laz-cream px-4 py-2 text-xs font-semibold text-laz-forest transition-colors"
                                    >
                                        {step.cta}
                                    </Link>
                                )}
                            </div>
                        ))}
                    </div>
                </section>

                {/* Guardrails */}
                <section className="rounded-[var(--radius-card)] border border-laz-gold/35 bg-laz-surface p-6 space-y-4">
                    <div className="flex items-center gap-2.5">
                        <ShieldAlert className="h-5 w-5 text-laz-warning" aria-hidden="true" />
                        <h2 className="text-base font-bold text-laz-forest">
                            Aturan Otomatis Sistem (Mengapa Transaksi Bisa Ditolak?)
                        </h2>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        {GUARDRAILS.map((rule) => (
                            <div
                                key={rule.title}
                                className="flex items-start gap-3 rounded-[var(--radius-button)] border border-laz-gold/25 bg-laz-cream/40 p-4"
                            >
                                <CheckCircle2
                                    className="mt-0.5 h-5 w-5 shrink-0 text-laz-sage"
                                    aria-hidden="true"
                                />
                                <div>
                                    <p className="text-sm font-semibold text-laz-forest">
                                        {rule.title}
                                    </p>
                                    <p className="mt-1 text-xs leading-relaxed text-laz-muted">
                                        {rule.desc}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </DashboardLayout>
    );
}
