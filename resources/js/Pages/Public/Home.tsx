import { useGSAP } from '@gsap/react';
import { AnimatePresence, motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowDown, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import DistribusiAsnafChart from '@/Components/zakat/DistribusiAsnafChart';
import KalkulatorZakat from '@/Components/zakat/KalkulatorZakat';
import RekeningDirectory from '@/Components/zakat/RekeningDirectory';
import TabelTransparansiPublik from '@/Components/zakat/TabelTransparansiPublik';
import PublicLayout from '@/Layouts/PublicLayout';
import { formatRupiah, KATEGORI_INDUK_LABELS } from '@/lib/formatters';
import type {
    LaporanPublikZis,
    PorsiAsnaf,
    RekapIndukDana,
    RekeningLembaga,
} from '@/types/database';

gsap.registerPlugin(ScrollTrigger, useGSAP);

interface HomeProps {
    rekapDana: RekapIndukDana[];
    porsiAsnaf: PorsiAsnaf[];
    laporanPublik: LaporanPublikZis[];
    rekeningResmi: RekeningLembaga[];
}

export default function Home({
    rekapDana,
    porsiAsnaf,
    laporanPublik,
    rekeningResmi,
}: HomeProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [salurkanModalOpen, setSalurkanModalOpen] = useState(false);

    const totals = useMemo(() => {
        return rekapDana.reduce(
            (acc, row) => ({
                terhimpun: acc.terhimpun + (Number(row.total_terhimpun) || 0),
                tersalurkan: acc.tersalurkan + (Number(row.total_tersalurkan) || 0),
                saldo: acc.saldo + (Number(row.saldo_tersedia) || 0),
            }),
            { terhimpun: 0, tersalurkan: 0, saldo: 0 },
        );
    }, [rekapDana]);

    useGSAP(
        () => {
            if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                return;
            }

            gsap.from('.gsap-hero-item', {
                y: 20,
                opacity: 0,
                duration: 0.65,
                stagger: 0.1,
                ease: 'power2.out',
                clearProps: 'transform,opacity',
            });

            gsap.from('.gsap-rekap-card', {
                y: 24,
                opacity: 0,
                duration: 0.55,
                stagger: 0.12,
                ease: 'power2.out',
                clearProps: 'transform,opacity',
                scrollTrigger: {
                    trigger: '.gsap-rekap-grid',
                    start: 'top 85%',
                    once: true,
                },
            });
        },
        { scope: containerRef },
    );

    useEffect(() => {
        if (!salurkanModalOpen) {
            return;
        }
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setSalurkanModalOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [salurkanModalOpen]);

    return (
        <PublicLayout title="Portal Transparansi ZIS Kota Pekanbaru">
            <div ref={containerRef}>
                {/* Hero Section */}
                <section className="py-16 sm:py-24 border-b border-laz-gold/30">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                        <div className="lg:col-span-7 space-y-6">
                            <h1 className="gsap-hero-item text-3xl sm:text-5xl font-bold tracking-tight text-laz-forest leading-[1.15]">
                                Amanah Pengelolaan Zakat, Infak, dan Wakaf Kota Pekanbaru.
                            </h1>
                            <p className="gsap-hero-item text-base sm:text-lg text-laz-muted max-w-2xl leading-relaxed">
                                Setiap rupiah terhimpun dicatat pada rekening terpisah sesuai akad syariah, diawasi batas maksimal hak Amil 12,5%, dan disalurkan kepada 8 golongan Asnaf yang terverifikasi.
                            </p>

                            <div className="gsap-hero-item flex flex-wrap items-center gap-4 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setSalurkanModalOpen(true)}
                                    className="min-h-11 px-6 py-3 rounded-[var(--radius-button)] bg-laz-forest hover:bg-laz-forest-hover text-laz-surface font-semibold text-sm transition-colors"
                                >
                                    Salurkan Zakat &amp; Infak
                                </button>
                                <a
                                    href="#transparansi"
                                    className="min-h-11 px-6 py-3 rounded-[var(--radius-button)] bg-laz-surface hover:bg-laz-cream border border-laz-gold/60 text-laz-forest font-semibold text-sm inline-flex items-center gap-2 transition-colors"
                                >
                                    <span>Cek Laporan Transparansi</span>
                                    <ArrowDown className="w-4 h-4" aria-hidden="true" />
                                </a>
                            </div>
                        </div>

                        <div className="lg:col-span-5 gsap-hero-item bg-laz-surface rounded-[var(--radius-card)] border border-laz-gold/40 p-6 sm:p-8 space-y-6">
                            <div className="pb-4 border-b border-laz-gold/25">
                                <p className="text-xs font-semibold uppercase tracking-wider text-laz-sage">
                                    Ringkasan Kas Lembaga (Real-Time)
                                </p>
                                <p className="mt-2 text-3xl font-bold font-mono tabular-nums text-laz-forest">
                                    {formatRupiah(totals.saldo)}
                                </p>
                                <p className="mt-1 text-xs text-laz-muted">
                                    Total saldo tersedia lintas akad (Zakat, Infak &amp; Sedekah, Wakaf)
                                </p>
                            </div>

                            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-4 rounded-[var(--radius-button)] bg-laz-cream/70 border border-laz-gold/25">
                                    <dt className="text-xs text-laz-muted">Total Terhimpun</dt>
                                    <dd className="mt-1 text-base font-bold font-mono tabular-nums text-laz-sage">
                                        {formatRupiah(totals.terhimpun)}
                                    </dd>
                                </div>
                                <div className="p-4 rounded-[var(--radius-button)] bg-laz-cream/70 border border-laz-gold/25">
                                    <dt className="text-xs text-laz-muted">Total Tersalurkan</dt>
                                    <dd className="mt-1 text-base font-bold font-mono tabular-nums text-laz-forest">
                                        {formatRupiah(totals.tersalurkan)}
                                    </dd>
                                </div>
                            </dl>
                        </div>
                    </div>
                </section>

                {/* Rekapitulasi per Akad */}
                <section className="py-20 bg-laz-surface border-b border-laz-gold/30">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
                        <div className="max-w-2xl">
                            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-laz-forest">
                                Pemisahan Dana Berdasarkan Akad
                            </h2>
                            <p className="mt-2 text-sm sm:text-base text-laz-muted">
                                Sistem basis data menolak pencampuran dana antar-akad. Berikut posisi saldo aktif dari view publik v_rekap_induk_dana.
                            </p>
                        </div>

                        <div className="gsap-rekap-grid grid grid-cols-1 md:grid-cols-3 gap-6">
                            {rekapDana.map((item) => (
                                <article
                                    key={item.kategori_induk}
                                    className="gsap-rekap-card bg-laz-cream/55 rounded-[var(--radius-card)] border border-laz-gold/40 p-6 space-y-4"
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <h3 className="text-base font-bold text-laz-forest">
                                            {KATEGORI_INDUK_LABELS[item.kategori_induk]}
                                        </h3>
                                        <span className="px-2.5 py-0.5 rounded-[var(--radius-badge)] bg-laz-surface border border-laz-gold/40 text-xs font-mono tabular-nums text-laz-muted">
                                            {item.jumlah_kantong_dana} kantong
                                        </span>
                                    </div>

                                    <div>
                                        <p className="text-xs text-laz-muted">Saldo Tersedia</p>
                                        <p className="mt-1 text-2xl font-bold font-mono tabular-nums text-laz-forest">
                                            {formatRupiah(item.saldo_tersedia)}
                                        </p>
                                    </div>

                                    <dl className="pt-3 border-t border-laz-gold/25 grid grid-cols-2 gap-3 text-xs">
                                        <div>
                                            <dt className="text-laz-muted">Terhimpun</dt>
                                            <dd className="mt-0.5 font-mono tabular-nums font-semibold text-laz-sage">
                                                {formatRupiah(item.total_terhimpun)}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="text-laz-muted">Tersalurkan</dt>
                                            <dd className="mt-0.5 font-mono tabular-nums font-semibold text-laz-forest">
                                                {formatRupiah(item.total_tersalurkan)}
                                            </dd>
                                        </div>
                                    </dl>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Direktori Rekening Resmi */}
                <section id="rekening" className="py-24 border-b border-laz-gold/30">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
                        <div className="max-w-2xl">
                            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-laz-forest">
                                Direktori Rekening Resmi Lembaga
                            </h2>
                            <p className="mt-2 text-sm sm:text-base text-laz-muted">
                                Pastikan transfer hanya ditujukan ke nomor rekening resmi atas nama LAZ Amanah Madani sesuai jenis akad dana Anda.
                            </p>
                        </div>

                        <RekeningDirectory rekeningResmi={rekeningResmi} />
                    </div>
                </section>

                {/* Kalkulator Zakat */}
                <section id="kalkulator" className="py-24 bg-laz-surface border-b border-laz-gold/30">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
                        <div className="max-w-2xl">
                            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-laz-forest">
                                Kalkulator Zakat Interaktif
                            </h2>
                            <p className="mt-2 text-sm sm:text-base text-laz-muted">
                                Hitung perkiraan kewajiban Zakat Penghasilan atau Zakat Maal dengan nisab setara 85 gram emas sebelum menyalurkan ke rekening Zakat resmi.
                            </p>
                        </div>

                        <KalkulatorZakat onOpenSalurkan={() => setSalurkanModalOpen(true)} />
                    </div>
                </section>

                {/* Transparansi Publik: 8 Asnaf & Tabel Tersamar */}
                <section id="transparansi" className="py-24">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
                        <div className="max-w-2xl">
                            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-laz-forest">
                                Portal Transparansi Penyaluran Publik
                            </h2>
                            <p className="mt-2 text-sm sm:text-base text-laz-muted">
                                Data diaudit langsung melalui koneksi khusus baca-saja (usr_laz_laporan) untuk menjamin akuntabilitas publik dan privasi mustahik.
                            </p>
                        </div>

                        <DistribusiAsnafChart porsiAsnaf={porsiAsnaf} />
                        <TabelTransparansiPublik laporanPublik={laporanPublik} />
                    </div>
                </section>
            </div>

            {/* Modal Informasi Rekening Resmi */}
            <AnimatePresence>
                {salurkanModalOpen && (
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="modal-salurkan-title"
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSalurkanModalOpen(false)}
                            className="fixed inset-0 bg-laz-forest/55"
                        />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.97, y: 8 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.97, y: 8 }}
                            transition={{ duration: 0.2 }}
                            className="relative z-10 w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-laz-surface rounded-[var(--radius-card)] border border-laz-gold/40 p-6 sm:p-8 shadow-xl space-y-6"
                        >
                            <div className="flex items-start justify-between gap-4 pb-4 border-b border-laz-gold/25">
                                <div>
                                    <h3
                                        id="modal-salurkan-title"
                                        className="text-xl font-bold text-laz-forest"
                                    >
                                        Salurkan Zakat, Infak &amp; Wakaf
                                    </h3>
                                    <p className="mt-1 text-sm text-laz-muted">
                                        Pilih rekening resmi sesuai akad agar pencatatan mutasi dana tercatat akurat.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setSalurkanModalOpen(false)}
                                    aria-label="Tutup modal rekening"
                                    className="min-h-11 min-w-11 flex items-center justify-center rounded-[var(--radius-button)] text-laz-forest hover:bg-laz-cream"
                                >
                                    <X className="w-5 h-5" aria-hidden="true" />
                                </button>
                            </div>

                            <RekeningDirectory rekeningResmi={rekeningResmi} />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </PublicLayout>
    );
}
