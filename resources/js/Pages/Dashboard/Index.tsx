import { useGSAP } from '@gsap/react';
import { usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ShieldAlert, ShieldCheck } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { formatRupiah, formatTanggalId, KATEGORI_INDUK_LABELS } from '@/lib/formatters';
import type {
    KantongSaldoItem,
    KategoriInduk,
    PorsiAsnaf,
    RekapIndukDana,
    RingkasanOperasional,
    SharedPageProps,
} from '@/types/database';

gsap.registerPlugin(useGSAP);

interface DashboardIndexProps {
    rekapDana: RekapIndukDana[];
    kantongSaldo: KantongSaldoItem[];
    amilQuota: PorsiAsnaf | null;
    ringkasanOperasional: RingkasanOperasional;
}

type KategoriFilter = 'SEMUA' | KategoriInduk;

const FILTER_OPTIONS: { value: KategoriFilter; label: string }[] = [
    { value: 'SEMUA', label: 'Semua Akad' },
    { value: 'ZAKAT', label: 'Zakat' },
    { value: 'INFAK_SEDEKAH', label: 'Infak & Sedekah' },
    { value: 'WAKAF', label: 'Wakaf' },
];

export default function DashboardIndex({
    rekapDana,
    kantongSaldo,
    amilQuota,
    ringkasanOperasional,
}: DashboardIndexProps) {
    const { auth } = usePage<SharedPageProps>().props;
    const user = auth.user;
    const containerRef = useRef<HTMLDivElement>(null);
    const [kategoriFilter, setKategoriFilter] = useState<KategoriFilter>('SEMUA');

    useGSAP(
        () => {
            if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                return;
            }

            gsap.from('.gsap-dash-card', {
                y: 14,
                opacity: 0,
                duration: 0.45,
                stagger: 0.06,
                ease: 'power2.out',
                clearProps: 'transform,opacity',
            });

            gsap.from('.gsap-amil-bar', {
                scaleX: 0,
                transformOrigin: 'left center',
                duration: 0.7,
                delay: 0.2,
                ease: 'power2.out',
                clearProps: 'transform',
            });
        },
        { scope: containerRef },
    );

    const filteredKantong = useMemo(() => {
        if (kategoriFilter === 'SEMUA') {
            return kantongSaldo;
        }
        return kantongSaldo.filter((item) => item.kategori_induk === kategoriFilter);
    }, [kantongSaldo, kategoriFilter]);

    const amilPersen = Number(amilQuota?.persentase_terhadap_zakat ?? 0);
    const amilMaks = Number(amilQuota?.batas_maks_persen ?? 12.5);
    const amilRasioBar = amilMaks > 0 ? Math.min(100, (amilPersen / amilMaks) * 100) : 0;
    const amilStatus =
        amilPersen > amilMaks
            ? 'MELEBIHI'
            : amilPersen >= amilMaks * 0.8
              ? 'MENDEKATI'
              : 'AMAN';

    return (
        <DashboardLayout title="Dashboard">
            <div ref={containerRef} className="space-y-8">
                {/* Identitas Staf & Antrian Operasional Nyata */}
                <section
                    aria-labelledby="executive-header"
                    className="grid grid-cols-1 lg:grid-cols-12 gap-6"
                >
                    <div className="gsap-dash-card lg:col-span-5 bg-laz-surface rounded-[var(--radius-card)] border border-laz-gold/35 p-6 flex flex-col justify-between gap-4">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-laz-sage">
                                Sesi Operasional Aktif
                            </p>
                            <h3 id="executive-header" className="mt-1 text-xl font-bold text-laz-forest">
                                {user?.nama_lengkap}
                            </h3>
                            <p className="mt-1 text-sm text-laz-muted">
                                {user?.jabatan}
                            </p>
                        </div>

                        <div className="pt-4 border-t border-laz-gold/25 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                            <div>
                                <p className="text-laz-muted">SK Draft</p>
                                <p className="mt-0.5 text-lg font-bold font-mono tabular-nums text-laz-warning">
                                    {ringkasanOperasional.sk_draft}
                                </p>
                            </div>
                            <div>
                                <p className="text-laz-muted">SK Siap Cair</p>
                                <p className="mt-0.5 text-lg font-bold font-mono tabular-nums text-laz-sage">
                                    {ringkasanOperasional.sk_disetujui}
                                </p>
                            </div>
                            <div>
                                <p className="text-laz-muted">Mustahik Antre</p>
                                <p className="mt-0.5 text-lg font-bold font-mono tabular-nums text-laz-forest">
                                    {ringkasanOperasional.mustahik_belum_verifikasi}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Indikator Kuota Hak Amil 12.5% */}
                    <div className="gsap-dash-card lg:col-span-7 bg-laz-surface rounded-[var(--radius-card)] border border-laz-gold/35 p-6 flex flex-col justify-between gap-5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-laz-muted">
                                    Pengawasan Kuota Syariah
                                </p>
                                <h3 className="mt-1 text-lg font-bold text-laz-forest">
                                    Batas Kuota Hak Amil (Maksimal 12,5%)
                                </h3>
                            </div>

                            <span
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-[var(--radius-badge)] text-xs font-semibold border ${
                                    amilStatus === 'MELEBIHI'
                                        ? 'bg-laz-danger/10 border-laz-danger/40 text-laz-danger'
                                        : amilStatus === 'MENDEKATI'
                                          ? 'bg-laz-warning/10 border-laz-warning/40 text-laz-warning'
                                          : 'bg-laz-sage/15 border-laz-sage/40 text-laz-forest'
                                }`}
                            >
                                {amilStatus === 'MELEBIHI' ? (
                                    <ShieldAlert className="w-3.5 h-3.5" aria-hidden="true" />
                                ) : (
                                    <ShieldCheck className="w-3.5 h-3.5 text-laz-sage" aria-hidden="true" />
                                )}
                                <span>
                                    {amilStatus === 'MELEBIHI'
                                        ? 'Melebihi Kuota'
                                        : amilStatus === 'MENDEKATI'
                                          ? 'Mendekati Batas'
                                          : 'Dalam Batas Aman'}
                                </span>
                            </span>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-baseline justify-between text-sm">
                                <span className="text-laz-muted">
                                    Realisasi Penyaluran Amil terhadap Zakat
                                </span>
                                <span className="font-mono tabular-nums font-bold text-laz-forest">
                                    {amilPersen.toFixed(2)}% / {amilMaks.toFixed(2)}%
                                </span>
                            </div>

                            <div
                                role="progressbar"
                                aria-valuenow={Number(amilPersen.toFixed(2))}
                                aria-valuemin={0}
                                aria-valuemax={amilMaks}
                                aria-label="Persentase kuota hak amil"
                                className="h-3 w-full rounded-full bg-laz-cream border border-laz-gold/30 overflow-hidden"
                            >
                                <div
                                    className={`gsap-amil-bar h-full rounded-full transition-all duration-500 ${
                                        amilStatus === 'MELEBIHI'
                                            ? 'bg-laz-danger'
                                            : amilStatus === 'MENDEKATI'
                                              ? 'bg-laz-warning'
                                              : 'bg-laz-gold'
                                    }`}
                                    style={{ width: `${Math.max(2, amilRasioBar)}%` }}
                                />
                            </div>
                        </div>

                        <div className="pt-3 border-t border-laz-gold/25 flex flex-wrap items-center justify-between gap-4 text-xs text-laz-muted">
                            <span>
                                Total disalurkan ke Amil:{' '}
                                <strong className="font-mono tabular-nums text-laz-forest">
                                    {formatRupiah(amilQuota?.total_disalurkan ?? '0')}
                                </strong>
                            </span>
                            <span>
                                Sisa ruang kuota:{' '}
                                <strong className="font-mono tabular-nums text-laz-sage">
                                    {Math.max(0, amilMaks - amilPersen).toFixed(2)}%
                                </strong>
                            </span>
                        </div>
                    </div>
                </section>

                {/* Rekap 3 Kategori Induk */}
                <section aria-labelledby="rekap-heading" className="space-y-4">
                    <div>
                        <h3 id="rekap-heading" className="text-base font-bold text-laz-forest">
                            Saldo Induk per Kategori Akad
                        </h3>
                        <p className="text-sm text-laz-muted">
                            Agregasi real-time pemisahan rekening Zakat, Infak &amp; Sedekah, dan Wakaf.
                        </p>
                    </div>

                    {rekapDana.length === 0 ? (
                        <div className="bg-laz-surface rounded-[var(--radius-card)] border border-laz-gold/35 p-6 text-sm text-laz-muted">
                            Belum ada data rekapitulasi saldo akad.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {rekapDana.map((item) => (
                                <motion.article
                                    key={item.kategori_induk}
                                    whileHover={{ y: -2 }}
                                    transition={{ duration: 0.18 }}
                                    className="gsap-dash-card bg-laz-surface rounded-[var(--radius-card)] border border-laz-gold/35 p-6 space-y-4"
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <h4 className="text-sm font-bold text-laz-forest">
                                            {KATEGORI_INDUK_LABELS[item.kategori_induk]}
                                        </h4>
                                        <span className="px-2.5 py-0.5 rounded-[var(--radius-badge)] bg-laz-cream border border-laz-gold/40 text-xs font-mono tabular-nums text-laz-muted">
                                            {item.jumlah_kantong_dana} kantong
                                        </span>
                                    </div>

                                    <div>
                                        <p className="text-xs text-laz-muted">Saldo Aktif</p>
                                        <p className="mt-1 text-2xl font-bold font-mono tabular-nums text-laz-forest">
                                            {formatRupiah(item.saldo_tersedia)}
                                        </p>
                                    </div>

                                    <dl className="pt-3 border-t border-laz-gold/25 grid grid-cols-2 gap-3 text-xs">
                                        <div>
                                            <dt className="text-laz-muted">Total Masuk</dt>
                                            <dd className="mt-0.5 font-mono tabular-nums font-semibold text-laz-sage">
                                                {formatRupiah(item.total_terhimpun)}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="text-laz-muted">Total Keluar</dt>
                                            <dd className="mt-0.5 font-mono tabular-nums font-semibold text-laz-forest">
                                                {formatRupiah(item.total_tersalurkan)}
                                            </dd>
                                        </div>
                                    </dl>
                                </motion.article>
                            ))}
                        </div>
                    )}
                </section>

                {/* Rincian Kantong Saldo (saldo_dana) */}
                <section aria-labelledby="kantong-heading" className="bg-laz-surface rounded-[var(--radius-card)] border border-laz-gold/35 overflow-hidden">
                    <div className="p-6 border-b border-laz-gold/25 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div>
                            <h3 id="kantong-heading" className="text-base font-bold text-laz-forest">
                                Rincian Kantong Saldo Dana
                            </h3>
                            <p className="mt-1 text-sm text-laz-muted">
                                Daftar seluruh kantong dana aktif beserta akumulasi mutasi masuk dan keluar.
                            </p>
                        </div>

                        <div
                            role="tablist"
                            aria-label="Filter Kantong Saldo per Akad"
                            className="inline-flex flex-wrap gap-1.5 p-1 rounded-[var(--radius-card)] bg-laz-cream border border-laz-gold/40"
                        >
                            {FILTER_OPTIONS.map((opt) => {
                                const isActive = kategoriFilter === opt.value;
                                return (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        role="tab"
                                        aria-selected={isActive}
                                        onClick={() => setKategoriFilter(opt.value)}
                                        className={`relative min-h-11 px-3.5 py-1.5 rounded-[var(--radius-button)] text-xs font-semibold transition-colors ${
                                            isActive
                                                ? 'text-laz-surface'
                                                : 'text-laz-forest hover:text-laz-sage'
                                        }`}
                                    >
                                        {isActive && (
                                            <motion.span
                                                layoutId="kantong-filter-tab"
                                                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                                                className="absolute inset-0 rounded-[var(--radius-button)] bg-laz-forest"
                                            />
                                        )}
                                        <span className="relative z-10">{opt.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {filteredKantong.length === 0 ? (
                        <div className="p-8 text-center text-sm text-laz-muted">
                            Tidak ada kantong saldo aktif pada kategori akad yang dipilih.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-sm">
                                <thead>
                                    <tr className="bg-laz-cream/70 border-b border-laz-gold/30 text-xs font-semibold uppercase tracking-wider text-laz-muted">
                                        <th className="py-3.5 px-5">Kode &amp; Nama Kantong</th>
                                        <th className="py-3.5 px-5">Kategori Akad</th>
                                        <th className="py-3.5 px-5">Sifat</th>
                                        <th className="py-3.5 px-5 text-right">Total Masuk</th>
                                        <th className="py-3.5 px-5 text-right">Total Keluar</th>
                                        <th className="py-3.5 px-5 text-right">Saldo Aktif</th>
                                        <th className="py-3.5 px-5 text-right">Diperbarui</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-laz-gold/20">
                                    {filteredKantong.map((row) => (
                                        <motion.tr
                                            key={row.id_saldo}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ duration: 0.18 }}
                                            className="hover:bg-laz-cream/50 transition-colors"
                                        >
                                            <td className="py-4 px-5 min-w-[220px]">
                                                <p className="font-semibold text-laz-forest">
                                                    {row.nama_dana}
                                                </p>
                                                <p className="text-xs font-mono text-laz-muted mt-0.5">
                                                    {row.kode_dana}
                                                </p>
                                            </td>
                                            <td className="py-4 px-5 whitespace-nowrap">
                                                <span className="px-2.5 py-1 rounded-[var(--radius-badge)] bg-laz-cream border border-laz-gold/40 text-xs font-semibold text-laz-forest">
                                                    {KATEGORI_INDUK_LABELS[row.kategori_induk]}
                                                </span>
                                            </td>
                                            <td className="py-4 px-5 whitespace-nowrap text-xs text-laz-muted">
                                                {row.is_terikat ? 'Terikat (Muqayyadah)' : 'Tidak Terikat'}
                                            </td>
                                            <td className="py-4 px-5 whitespace-nowrap text-right font-mono tabular-nums text-laz-sage font-medium">
                                                {formatRupiah(row.total_masuk)}
                                            </td>
                                            <td className="py-4 px-5 whitespace-nowrap text-right font-mono tabular-nums text-laz-muted">
                                                {formatRupiah(row.total_keluar)}
                                            </td>
                                            <td className="py-4 px-5 whitespace-nowrap text-right font-mono tabular-nums font-bold text-laz-forest">
                                                {formatRupiah(row.saldo_aktif)}
                                            </td>
                                            <td className="py-4 px-5 whitespace-nowrap text-right text-xs text-laz-muted">
                                                {formatTanggalId(row.updated_at)}
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </div>
        </DashboardLayout>
    );
}
