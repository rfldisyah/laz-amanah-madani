import { useGSAP } from '@gsap/react';
import { AnimatePresence, motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowDown, Calculator, Calendar, ChevronDown, Eye, HandHeart, Landmark, ReceiptText, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import DistribusiAsnafChart from '@/Components/zakat/DistribusiAsnafChart';
import KalkulatorZakat from '@/Components/zakat/KalkulatorZakat';
import RekeningDirectory from '@/Components/zakat/RekeningDirectory';
import TabelTransparansiPublik from '@/Components/zakat/TabelTransparansiPublik';
import PublicLayout from '@/Layouts/PublicLayout';
import { formatRupiah, formatTanggalId, KATEGORI_INDUK_LABELS } from '@/lib/formatters';
import type {
    JenisDana,
    LaporanPublikZis,
    PorsiAsnaf,
    Program,
    RekapIndukDana,
    RekeningLembaga,
} from '@/types/database';

gsap.registerPlugin(ScrollTrigger, useGSAP);

type ProgramAktifRow = Program & {
    jenis_dana?: Pick<JenisDana, 'id_jenis_dana' | 'kode_dana' | 'nama_dana' | 'kategori_induk'>;
};

interface HomeProps {
    rekapDana: RekapIndukDana[];
    porsiAsnaf: PorsiAsnaf[];
    laporanPublik: LaporanPublikZis[];
    rekeningResmi: RekeningLembaga[];
    programAktif: ProgramAktifRow[];
}

const DONOR_STEPS = [
    {
        step: '01',
        title: 'Hitung Kewajiban Zakat',
        desc: 'Gunakan Kalkulator Zakat untuk menghitung Zakat Penghasilan atau Maal sesuai nisab 85 gram emas.',
        href: '#kalkulator',
        cta: 'Buka Kalkulator',
        icon: Calculator,
    },
    {
        step: '02',
        title: 'Pilih Rekening Resmi Sesuai Akad',
        desc: 'Salin nomor rekening BSI atau BRK Syariah berdasarkan akad Zakat, Infak/Sedekah, atau Wakaf.',
        href: '#rekening',
        cta: 'Lihat Rekening',
        icon: Landmark,
    },
    {
        step: '03',
        title: 'Setor & Terima Kuitansi Resmi',
        desc: 'Lakukan transfer atau setoran di gerai LAZ Amanah Madani untuk dicatat ke kantong dana resmi.',
        href: '#rekening',
        cta: 'Salurkan Sekarang',
        icon: ReceiptText,
    },
    {
        step: '04',
        title: 'Pantau Penyaluran Real-Time',
        desc: 'Periksa grafik distribusi 8 Asnaf dan riwayat penyaluran pada Portal Transparansi Publik.',
        href: '#transparansi',
        cta: 'Cek Transparansi',
        icon: Eye,
    },
] as const;

const FAQ_ITEMS = [
    {
        q: 'Mengapa nomor rekening dipisah antara Zakat, Infak/Sedekah, dan Wakaf?',
        a: 'Sesuai ketentuan syariah, dana Zakat hanya boleh disalurkan kepada 8 golongan asnaf yang berhak, sedangkan Infak/Sedekah dan Wakaf memiliki peruntukan akad masing-masing agar tidak bercampur.',
    },
    {
        q: 'Apa yang dimaksud dengan batas kuota Hak Amil maksimal 12,5%?',
        a: 'LAZ Amanah Madani membatasi alokasi operasional Amil maksimal 12,5% dari total penghimpunan zakat agar porsi terbesar tetap diterima oleh mustahik yang membutuhkan.',
    },
    {
        q: 'Mengapa NIK dan nama mustahik pada tabel transparansi disamarkan?',
        a: 'Penyamaran sebagian karakter NIK dan nama dilakukan untuk melindungi privasi dan menjaga martabat penerima bantuan, sembari tetap menampilkan bukti penyaluran secara terbuka.',
    },
    {
        q: 'Bagaimana cara menyalurkan dana atau meminta bukti kuitansi resmi?',
        a: 'Anda dapat mentransfer ke salah satu rekening resmi pada direktori di atas atau datang langsung ke kantor layanan LAZ Amanah Madani Kota Pekanbaru untuk pencatatan dan penerbitan kuitansi resmi.',
    },
] as const;

export default function Home({
    rekapDana,
    porsiAsnaf,
    laporanPublik,
    rekeningResmi,
    programAktif,
}: HomeProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [salurkanModalOpen, setSalurkanModalOpen] = useState(false);
    const [programModalOpen, setProgramModalOpen] = useState(false);
    const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

    const impactStats = useMemo(() => {
        const totalPenerima = porsiAsnaf.reduce((sum, item) => sum + Number(item.jumlah_penerima || 0), 0);
        const totalKantong = rekapDana.reduce((sum, item) => sum + Number(item.jumlah_kantong_dana || 0), 0);
        return {
            totalPenerima,
            totalProgram: programAktif.length,
            totalKantong,
        };
    }, [porsiAsnaf, programAktif.length, rekapDana]);

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
        if (!salurkanModalOpen && !programModalOpen) {
            return;
        }

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setSalurkanModalOpen(false);
                setProgramModalOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [salurkanModalOpen, programModalOpen]);

    const renderProgramCard = (prog: ProgramAktifRow) => (
        <article
            key={prog.id_program}
            className="rounded-[var(--radius-card)] border border-laz-gold/35 bg-laz-cream/40 p-6 flex flex-col justify-between gap-5"
        >
            <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-semibold text-laz-muted">
                        {prog.kode_program}
                    </span>
                    {prog.jenis_dana && (
                        <span className="px-2.5 py-0.5 rounded-full bg-laz-surface border border-laz-gold/40 text-xs font-semibold text-laz-forest whitespace-nowrap">
                            {KATEGORI_INDUK_LABELS[prog.jenis_dana.kategori_induk]}
                        </span>
                    )}
                </div>

                <h3 className="text-base font-bold text-laz-forest leading-snug">
                    {prog.nama_program}
                </h3>

                {prog.jenis_dana && (
                    <p className="text-xs text-laz-muted">
                        Sumber Dana: {prog.jenis_dana.nama_dana}
                    </p>
                )}
            </div>

            <div className="pt-4 border-t border-laz-gold/25 space-y-4">
                <div className="flex items-center justify-between gap-3 text-xs">
                    <div>
                        <p className="text-laz-muted">Target Penghimpunan</p>
                        <p className="mt-0.5 font-mono text-sm font-bold text-laz-forest">
                            {formatRupiah(prog.target_dana)}
                        </p>
                    </div>
                    <div className="text-right text-laz-muted inline-flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>{formatTanggalId(prog.tgl_mulai)}</span>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => {
                        setProgramModalOpen(false);
                        setSalurkanModalOpen(true);
                    }}
                    className="w-full min-h-11 inline-flex items-center justify-center gap-2 rounded-[var(--radius-button)] bg-laz-forest hover:bg-laz-forest-hover text-laz-surface text-xs font-semibold transition-colors"
                >
                    <HandHeart className="w-4 h-4 text-laz-gold" aria-hidden="true" />
                    <span>Salurkan ke Program Ini</span>
                </button>
            </div>
        </article>
    );

    return (
        <PublicLayout title="Portal Publik">
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
                                Setiap pilar akad dikelola secara terpisah sesuai syariah. Berikut ringkasan posisi saldo aktif lembaga secara real-time.
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

                {/* Etalase Program Penyaluran Aktif */}
                <section id="program" className="scroll-mt-20 py-24 bg-laz-surface border-b border-laz-gold/30">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
                        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                            <div className="max-w-2xl">
                                <p className="text-xs font-semibold uppercase tracking-widest text-laz-sage">
                                    Program Pemberdayaan &amp; Sosial
                                </p>
                                <h2 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-laz-forest">
                                    Program Penyaluran Aktif
                                </h2>
                                <p className="mt-2 text-sm sm:text-base text-laz-muted">
                                    Seluruh program aktif terikat langsung pada kantong dana dan akad masing-masing di Kota Pekanbaru dan Riau.
                                </p>
                            </div>

                            <div className="grid grid-cols-3 gap-3 sm:gap-4 shrink-0">
                                <div className="rounded-[var(--radius-button)] border border-laz-gold/35 bg-laz-cream/60 px-4 py-3 text-center">
                                    <p className="font-mono text-lg sm:text-xl font-bold text-laz-forest">
                                        {impactStats.totalPenerima}
                                    </p>
                                    <p className="text-[11px] font-medium text-laz-muted">Penerima</p>
                                </div>
                                <div className="rounded-[var(--radius-button)] border border-laz-gold/35 bg-laz-cream/60 px-4 py-3 text-center">
                                    <p className="font-mono text-lg sm:text-xl font-bold text-laz-forest">
                                        {impactStats.totalProgram}
                                    </p>
                                    <p className="text-[11px] font-medium text-laz-muted">Program Aktif</p>
                                </div>
                                <div className="rounded-[var(--radius-button)] border border-laz-gold/35 bg-laz-cream/60 px-4 py-3 text-center">
                                    <p className="font-mono text-lg sm:text-xl font-bold text-laz-forest">
                                        {impactStats.totalKantong}
                                    </p>
                                    <p className="text-[11px] font-medium text-laz-muted">Kantong Dana</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {programAktif.slice(0, 3).map(renderProgramCard)}
                        </div>

                        {programAktif.length > 3 && (
                            <div className="flex justify-center pt-2">
                                <button
                                    type="button"
                                    onClick={() => setProgramModalOpen(true)}
                                    className="min-h-11 px-6 py-2.5 rounded-[var(--radius-button)] border border-laz-gold/60 bg-laz-cream/70 hover:bg-laz-cream text-laz-forest text-sm font-semibold transition-colors"
                                >
                                    Lihat Semua Program ({programAktif.length})
                                </button>
                            </div>
                        )}
                    </div>
                </section>

                {/* Direktori Rekening Resmi */}
                <section id="rekening" className="scroll-mt-20 py-24 border-b border-laz-gold/30">
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
                <section id="kalkulator" className="scroll-mt-20 py-24 bg-laz-surface border-b border-laz-gold/30">
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

                {/* Panduan & Tata Cara Donatur */}
                <section id="panduan" className="scroll-mt-20 py-24 bg-laz-cream border-b border-laz-gold/30">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
                        <div className="max-w-2xl">
                            <p className="text-xs font-semibold uppercase tracking-widest text-laz-sage">
                                Panduan Muzaki &amp; Donatur
                            </p>
                            <h2 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-laz-forest">
                                Tata Cara Menunaikan ZISWAF
                            </h2>
                            <p className="mt-2 text-sm sm:text-base text-laz-muted">
                                Empat langkah sederhana untuk menunaikan zakat, infak, sedekah, atau wakaf sekaligus memantau penyalurannya secara transparan.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                            {DONOR_STEPS.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <div
                                        key={item.step}
                                        className="bg-laz-surface rounded-[var(--radius-card)] border border-laz-gold/35 p-6 flex flex-col justify-between gap-5"
                                    >
                                        <div>
                                            <div className="flex items-center justify-between">
                                                <span className="font-mono text-xs font-bold tracking-wider text-laz-sage bg-laz-cream px-2.5 py-1 rounded-full border border-laz-gold/30">
                                                    LANGKAH {item.step}
                                                </span>
                                                <Icon className="w-5 h-5 text-laz-forest" aria-hidden="true" />
                                            </div>
                                            <h3 className="mt-4 text-base font-bold text-laz-forest">
                                                {item.title}
                                            </h3>
                                            <p className="mt-2 text-sm leading-relaxed text-laz-muted">
                                                {item.desc}
                                            </p>
                                        </div>

                                        {item.step === '03' ? (
                                            <button
                                                type="button"
                                                onClick={() => setSalurkanModalOpen(true)}
                                                className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-button)] border border-laz-gold/50 bg-laz-cream/60 hover:bg-laz-cream px-4 py-2 text-xs font-semibold text-laz-forest transition-colors"
                                            >
                                                {item.cta}
                                            </button>
                                        ) : (
                                            <a
                                                href={item.href}
                                                className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-button)] border border-laz-gold/50 bg-laz-cream/60 hover:bg-laz-cream px-4 py-2 text-xs font-semibold text-laz-forest transition-colors"
                                            >
                                                {item.cta}
                                            </a>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* FAQ Accordion */}
                        <div className="bg-laz-surface rounded-[var(--radius-card)] border border-laz-gold/35 p-6 sm:p-8">
                            <h3 className="text-lg font-bold text-laz-forest">
                                Pertanyaan Umum (FAQ)
                            </h3>
                            <div className="mt-4 divide-y divide-laz-gold/25">
                                {FAQ_ITEMS.map((faq, idx) => {
                                    const isOpen = openFaqIndex === idx;
                                    return (
                                        <div key={faq.q} className="py-3">
                                            <button
                                                type="button"
                                                onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                                                aria-expanded={isOpen}
                                                className="w-full min-h-11 flex items-center justify-between gap-4 text-left text-sm sm:text-base font-semibold text-laz-forest hover:text-laz-sage transition-colors py-1"
                                            >
                                                <span>{faq.q}</span>
                                                <ChevronDown
                                                    className={`w-4 h-4 shrink-0 text-laz-muted transition-transform duration-200 ${
                                                        isOpen ? 'rotate-180 text-laz-forest' : ''
                                                    }`}
                                                    aria-hidden="true"
                                                />
                                            </button>
                                            <AnimatePresence initial={false}>
                                                {isOpen && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.2 }}
                                                        className="overflow-hidden"
                                                    >
                                                        <p className="pt-2 pb-1 text-sm leading-relaxed text-laz-muted">
                                                            {faq.a}
                                                        </p>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Transparansi Publik: 8 Asnaf & Tabel Tersamar */}
                <section id="transparansi" className="scroll-mt-20 py-24">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
                        <div className="max-w-2xl">
                            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-laz-forest">
                                Portal Transparansi Penyaluran Publik
                            </h2>
                            <p className="mt-2 text-sm sm:text-base text-laz-muted">
                                Laporan disajikan langsung dari catatan penyaluran resmi dengan penyamaran identitas penerima demi menjaga akuntabilitas publik dan martabat mustahik.
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
                            data-lenis-prevent
                            initial={{ opacity: 0, scale: 0.97, y: 8 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.97, y: 8 }}
                            transition={{ duration: 0.2 }}
                            className="relative z-10 w-full max-w-2xl max-h-[85vh] overflow-y-auto overscroll-contain bg-laz-surface rounded-[var(--radius-card)] border border-laz-gold/40 p-6 sm:p-8 shadow-xl space-y-6"
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

                            <p className="text-xs leading-relaxed text-laz-muted border-t border-laz-gold/25 pt-4">
                                Setelah melakukan transfer, silakan konfirmasikan setoran Anda melalui layanan gerai LAZ Amanah Madani Kota Pekanbaru untuk pencatatan transaksi dan penerbitan kuitansi resmi.
                            </p>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modal Semua Program Aktif */}
            <AnimatePresence>
                {programModalOpen && (
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="modal-program-title"
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setProgramModalOpen(false)}
                            className="fixed inset-0 bg-laz-forest/55"
                        />

                        <motion.div
                            data-lenis-prevent
                            initial={{ opacity: 0, scale: 0.97, y: 8 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.97, y: 8 }}
                            transition={{ duration: 0.2 }}
                            className="relative z-10 w-full max-w-5xl max-h-[85vh] overflow-y-auto overscroll-contain bg-laz-surface rounded-[var(--radius-card)] border border-laz-gold/40 p-6 sm:p-8 shadow-xl space-y-6"
                        >
                            <div className="flex items-start justify-between gap-4 pb-4 border-b border-laz-gold/25">
                                <div>
                                    <h3
                                        id="modal-program-title"
                                        className="text-xl font-bold text-laz-forest"
                                    >
                                        Semua Program Penyaluran Aktif ({programAktif.length})
                                    </h3>
                                    <p className="mt-1 text-sm text-laz-muted">
                                        Pilih program yang ingin Anda dukung untuk melihat rekening resmi sesuai akadnya.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setProgramModalOpen(false)}
                                    aria-label="Tutup modal daftar program"
                                    className="min-h-11 min-w-11 flex items-center justify-center rounded-[var(--radius-button)] text-laz-forest hover:bg-laz-cream"
                                >
                                    <X className="w-5 h-5" aria-hidden="true" />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                {programAktif.map(renderProgramCard)}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </PublicLayout>
    );
}
