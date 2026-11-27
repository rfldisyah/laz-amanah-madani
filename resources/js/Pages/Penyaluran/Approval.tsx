import { useEffect, useMemo, useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    AlertCircle,
    Banknote,
    CheckCircle,
    CheckSquare,
    Eye,
    Filter,
    Search,
    ShieldAlert,
    X,
} from 'lucide-react';

import DashboardLayout from '@/Layouts/DashboardLayout';
import { formatRupiah, formatTanggalId } from '@/lib/formatters';
import type {
    Asnaf,
    DetailPenyaluran,
    JenisDana,
    Mustahik,
    Paginator,
    Pengguna,
    Penyaluran,
    Program,
    RekeningLembaga,
    SharedPageProps,
    StatusPenyaluran,
} from '@/types/database';

type DetailRow = DetailPenyaluran & {
    mustahik?: Pick<
        Mustahik,
        'id_mustahik' | 'nik' | 'nama_lengkap' | 'alamat_kecamatan'
    >;
    asnaf?: Pick<Asnaf, 'id_asnaf' | 'kode_asnaf' | 'nama_asnaf'>;
};

type PenyaluranRow = Penyaluran & {
    program?: Pick<
        Program,
        'id_program' | 'id_jenis_dana' | 'kode_program' | 'nama_program' | 'status_program'
    >;
    jenis_dana?: Pick<
        JenisDana,
        'id_jenis_dana' | 'kode_dana' | 'nama_dana' | 'kategori_induk'
    >;
    rekening?: Pick<
        RekeningLembaga,
        'id_rekening' | 'nama_bank' | 'nomor_rekening' | 'atas_nama' | 'kategori_induk'
    >;
    pengaju?: Pick<Pengguna, 'id_pengguna' | 'nama_lengkap'>;
    penyetuju?: Pick<Pengguna, 'id_pengguna' | 'nama_lengkap'> | null;
    details?: DetailRow[];
};

interface ApprovalProps {
    penyaluran: Paginator<PenyaluranRow>;
    saldoMap: Record<number, string>;
    ringkasanStatus: {
        draft: number;
        disetujui: number;
        disalurkan: number;
    };
    filters: { search: string; status: string };
}

const STATUS_SK_CONFIG: Record<
    StatusPenyaluran,
    { label: string; className: string }
> = {
    DRAFT: {
        label: 'Draft',
        className: 'bg-laz-warning/15 text-laz-warning border border-laz-warning/35',
    },
    DISETUJUI: {
        label: 'Disetujui',
        className: 'bg-laz-gold/25 text-laz-forest border border-laz-gold/50',
    },
    DISALURKAN: {
        label: 'Disalurkan',
        className: 'bg-laz-sage/20 text-laz-forest border border-laz-sage/40',
    },
    DITOLAK: {
        label: 'Ditolak',
        className: 'bg-laz-danger/10 text-laz-danger border border-laz-danger/35',
    },
};

function StatusSkBadge({ status }: { status: StatusPenyaluran }) {
    const cfg = STATUS_SK_CONFIG[status];
    return (
        <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.className}`}
        >
            {cfg.label}
        </span>
    );
}

export default function PenyaluranApproval({
    penyaluran,
    saldoMap,
    ringkasanStatus,
    filters,
}: ApprovalProps) {
    const { props } = usePage<SharedPageProps>();
    const currentUser = props.auth.user;
    const flash = props.flash;
    const pageErrors = props.errors;

    const [localSearch, setLocalSearch] = useState(filters.search);
    const [localStatus, setLocalStatus] = useState(filters.status);
    const [inspectSkId, setInspectSkId] = useState<number | null>(null);
    const [confirmAction, setConfirmAction] = useState<{
        type: 'approve' | 'cairkan';
        sk: PenyaluranRow;
    } | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const inspectSk = useMemo(
        () =>
            penyaluran.data.find((item) => item.id_penyaluran === inspectSkId) ??
            null,
        [penyaluran.data, inspectSkId],
    );

    useEffect(() => {
        if (!inspectSk && !confirmAction) return;
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setInspectSkId(null);
                setConfirmAction(null);
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [inspectSk, confirmAction]);

    const applyFilters = () => {
        router.get(
            '/penyaluran/otorisasi',
            { search: localSearch, status: localStatus },
            { preserveState: true, replace: true },
        );
    };

    const executeConfirmedAction = () => {
        if (!confirmAction || submitting) return;
        const { type, sk } = confirmAction;
        const endpoint =
            type === 'approve'
                ? `/penyaluran/${sk.id_penyaluran}/setujui`
                : `/penyaluran/${sk.id_penyaluran}/cairkan`;

        setSubmitting(true);
        router.post(
            endpoint,
            {},
            {
                preserveScroll: true,
                onFinish: () => {
                    setSubmitting(false);
                    setConfirmAction(null);
                },
            },
        );
    };

    return (
        <DashboardLayout title="Otorisasi & Pencairan SK">
            <Head title="Otorisasi & Pencairan SK" />

            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-laz-forest">
                        Otorisasi Pimpinan & Pencairan Dana
                    </h1>
                    <p className="mt-1 text-sm text-laz-muted">
                        Pemeriksaan SK berstatus DRAFT, pengesahan via{' '}
                        <span className="font-mono">sp_setujui_penyaluran</span>
                        , dan pencairan dana via{' '}
                        <span className="font-mono">sp_cairkan_penyaluran</span>
                        .
                    </p>
                </div>

                {/* Summary Cards */}
                <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-[var(--radius-card)] border border-laz-gold/35 bg-laz-surface p-5">
                        <p className="text-xs font-semibold uppercase tracking-wide text-laz-muted">
                            Menunggu Persetujuan
                        </p>
                        <p className="mt-2 font-mono text-2xl font-bold text-laz-warning">
                            {ringkasanStatus.draft} SK
                        </p>
                    </div>
                    <div className="rounded-[var(--radius-card)] border border-laz-gold/35 bg-laz-surface p-5">
                        <p className="text-xs font-semibold uppercase tracking-wide text-laz-muted">
                            Siap Dicairkan
                        </p>
                        <p className="mt-2 font-mono text-2xl font-bold text-laz-forest">
                            {ringkasanStatus.disetujui} SK
                        </p>
                    </div>
                    <div className="rounded-[var(--radius-card)] border border-laz-gold/35 bg-laz-surface p-5">
                        <p className="text-xs font-semibold uppercase tracking-wide text-laz-muted">
                            Telah Disalurkan
                        </p>
                        <p className="mt-2 font-mono text-2xl font-bold text-laz-sage">
                            {ringkasanStatus.disalurkan} SK
                        </p>
                    </div>
                </div>

                <AnimatePresence>
                    {flash?.success && (
                        <motion.div
                            key="flash-success"
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="flex items-start gap-3 rounded-[var(--radius-card)] border border-laz-sage/45 bg-laz-sage/15 px-4 py-3"
                        >
                            <CheckCircle
                                className="mt-0.5 h-5 w-5 shrink-0 text-laz-forest"
                                aria-hidden="true"
                            />
                            <p className="text-sm font-medium text-laz-forest">
                                {flash.success}
                            </p>
                        </motion.div>
                    )}
                    {pageErrors?.db_error && (
                        <motion.div
                            key="flash-error"
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="flex items-start gap-3 rounded-[var(--radius-card)] border border-laz-danger/35 bg-laz-danger/10 px-4 py-3"
                        >
                            <AlertCircle
                                className="mt-0.5 h-5 w-5 shrink-0 text-laz-danger"
                                aria-hidden="true"
                            />
                            <p className="text-sm font-medium text-laz-danger">
                                {pageErrors.db_error}
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Filters */}
                <div className="flex flex-wrap items-end gap-3 rounded-[var(--radius-card)] border border-laz-gold/35 bg-laz-surface p-4">
                    <div className="relative min-w-52 flex-1">
                        <Search
                            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-laz-muted"
                            aria-hidden="true"
                        />
                        <input
                            type="search"
                            value={localSearch}
                            onChange={(e) => setLocalSearch(e.target.value)}
                            onKeyDown={(e) =>
                                e.key === 'Enter' && applyFilters()
                            }
                            placeholder="Cari nomor SK atau program…"
                            className="min-h-11 w-full rounded-[var(--radius-button)] border border-laz-gold/45 bg-laz-cream/50 py-2.5 pl-9 pr-4 text-sm text-laz-forest placeholder:text-laz-muted/70 focus:border-laz-forest focus:outline-none focus:ring-2 focus:ring-laz-forest/15"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <Filter
                            className="h-4 w-4 text-laz-muted"
                            aria-hidden="true"
                        />
                        <select
                            aria-label="Filter status SK"
                            value={localStatus}
                            onChange={(e) => setLocalStatus(e.target.value)}
                            className="min-h-11 rounded-[var(--radius-button)] border border-laz-gold/45 bg-laz-cream/50 px-3 py-2.5 text-sm text-laz-forest focus:border-laz-forest focus:outline-none focus:ring-2 focus:ring-laz-forest/15"
                        >
                            <option value="SEMUA">Semua Status</option>
                            <option value="DRAFT">Draft</option>
                            <option value="DISETUJUI">Disetujui</option>
                            <option value="DISALURKAN">Disalurkan</option>
                            <option value="DITOLAK">Ditolak</option>
                        </select>
                    </div>

                    <button
                        type="button"
                        onClick={applyFilters}
                        className="min-h-11 rounded-[var(--radius-button)] border border-laz-gold/45 bg-laz-cream px-4 py-2.5 text-sm font-semibold text-laz-forest transition-colors hover:bg-laz-sage/20"
                    >
                        Terapkan
                    </button>
                </div>

                {/* Table */}
                <div className="overflow-hidden rounded-[var(--radius-card)] border border-laz-gold/35 bg-laz-surface">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-laz-gold/25 bg-laz-cream/60">
                                    <th className="px-4 py-3 text-left font-semibold text-laz-forest">
                                        Nomor SK / Pengaju
                                    </th>
                                    <th className="px-4 py-3 text-left font-semibold text-laz-forest">
                                        Program & Saldo Kantong
                                    </th>
                                    <th className="px-4 py-3 text-right font-semibold text-laz-forest">
                                        Total SK
                                    </th>
                                    <th className="px-4 py-3 text-left font-semibold text-laz-forest">
                                        Status
                                    </th>
                                    <th className="px-4 py-3 text-left font-semibold text-laz-forest">
                                        Otorisasi & Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-laz-gold/20">
                                {penyaluran.data.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="px-4 py-10 text-center text-laz-muted"
                                        >
                                            Tidak ada dokumen SK ditemukan.
                                        </td>
                                    </tr>
                                ) : (
                                    penyaluran.data.map((item) => {
                                        const saldoKantong =
                                            saldoMap[item.id_jenis_dana] ?? '0';
                                        const isSelfSubmitted =
                                            currentUser?.id_pengguna ===
                                            item.id_pengaju;

                                        return (
                                            <tr
                                                key={item.id_penyaluran}
                                                className="transition-colors hover:bg-laz-cream/40"
                                            >
                                                <td className="px-4 py-3">
                                                    <p className="font-mono font-semibold text-laz-forest">
                                                        {item.nomor_sk_salur}
                                                    </p>
                                                    <p className="mt-0.5 text-xs text-laz-muted">
                                                        Pengaju:{' '}
                                                        {item.pengaju
                                                            ?.nama_lengkap ??
                                                            '—'}
                                                    </p>
                                                    <p className="text-xs text-laz-muted">
                                                        {formatTanggalId(
                                                            item.tgl_pengajuan,
                                                        )}
                                                    </p>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <p className="font-semibold text-laz-forest">
                                                        {item.program
                                                            ?.nama_program ??
                                                            '—'}
                                                    </p>
                                                    <p className="mt-0.5 text-xs text-laz-muted">
                                                        {item.jenis_dana
                                                            ?.nama_dana ?? '—'}{' '}
                                                        • Saldo:{' '}
                                                        <span className="font-mono font-semibold text-laz-forest">
                                                            {formatRupiah(
                                                                saldoKantong,
                                                            )}
                                                        </span>
                                                    </p>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <p className="font-mono font-bold text-laz-forest">
                                                        {formatRupiah(
                                                            item.total_nominal,
                                                        )}
                                                    </p>
                                                    <p className="text-xs text-laz-muted">
                                                        {item.details?.length ??
                                                            0}{' '}
                                                        penerima
                                                    </p>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <StatusSkBadge
                                                        status={
                                                            item.status_penyaluran
                                                        }
                                                    />
                                                    {item.penyetuju && (
                                                        <p className="mt-1 text-xs text-laz-muted">
                                                            Oleh:{' '}
                                                            {
                                                                item.penyetuju
                                                                    .nama_lengkap
                                                            }
                                                        </p>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setInspectSkId(
                                                                    item.id_penyaluran,
                                                                )
                                                            }
                                                            className="inline-flex min-h-11 items-center gap-1.5 rounded-[var(--radius-button)] border border-laz-gold/45 px-3 py-2 text-xs font-semibold text-laz-forest transition-colors hover:bg-laz-cream"
                                                        >
                                                            <Eye
                                                                className="h-4 w-4"
                                                                aria-hidden="true"
                                                            />
                                                            Rincian
                                                        </button>

                                                        {item.status_penyaluran ===
                                                            'DRAFT' && (
                                                            <motion.button
                                                                type="button"
                                                                whileTap={{
                                                                    scale: 0.97,
                                                                }}
                                                                onClick={() =>
                                                                    setConfirmAction(
                                                                        {
                                                                            type: 'approve',
                                                                            sk: item,
                                                                        },
                                                                    )
                                                                }
                                                                title={
                                                                    isSelfSubmitted
                                                                        ? 'Pengaju tidak boleh menyetujui SK sendiri (guardrail SP)'
                                                                        : 'Sahkan SK'
                                                                }
                                                                className="inline-flex min-h-11 items-center gap-1.5 rounded-[var(--radius-button)] bg-laz-forest px-3.5 py-2 text-xs font-semibold text-laz-surface transition-colors hover:bg-laz-forest-hover"
                                                            >
                                                                <CheckSquare
                                                                    className="h-4 w-4"
                                                                    aria-hidden="true"
                                                                />
                                                                Setujui SK
                                                            </motion.button>
                                                        )}

                                                        {item.status_penyaluran ===
                                                            'DISETUJUI' && (
                                                            <motion.button
                                                                type="button"
                                                                whileTap={{
                                                                    scale: 0.97,
                                                                }}
                                                                onClick={() =>
                                                                    setConfirmAction(
                                                                        {
                                                                            type: 'cairkan',
                                                                            sk: item,
                                                                        },
                                                                    )
                                                                }
                                                                className="inline-flex min-h-11 items-center gap-1.5 rounded-[var(--radius-button)] bg-laz-sage px-3.5 py-2 text-xs font-semibold text-laz-surface transition-opacity hover:opacity-90"
                                                            >
                                                                <Banknote
                                                                    className="h-4 w-4"
                                                                    aria-hidden="true"
                                                                />
                                                                Cairkan Dana
                                                            </motion.button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {penyaluran.last_page > 1 && (
                        <div className="flex items-center justify-between border-t border-laz-gold/25 px-5 py-4 text-xs text-laz-muted">
                            <span>
                                Halaman {penyaluran.current_page} dari{' '}
                                {penyaluran.last_page} (total {penyaluran.total}{' '}
                                SK)
                            </span>
                            <div className="flex items-center gap-2">
                                {penyaluran.prev_page_url && (
                                    <Link
                                        href={penyaluran.prev_page_url}
                                        className="inline-flex min-h-11 items-center rounded-[var(--radius-button)] border border-laz-gold/40 bg-laz-cream px-4 font-semibold text-laz-forest"
                                    >
                                        Sebelumnya
                                    </Link>
                                )}
                                {penyaluran.next_page_url && (
                                    <Link
                                        href={penyaluran.next_page_url}
                                        className="inline-flex min-h-11 items-center rounded-[var(--radius-button)] border border-laz-gold/40 bg-laz-cream px-4 font-semibold text-laz-forest"
                                    >
                                        Berikutnya
                                    </Link>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Rincian SK */}
            <AnimatePresence>
                {inspectSk && (
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="modal-inspect-sk-title"
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setInspectSkId(null)}
                            aria-hidden="true"
                            className="fixed inset-0 bg-laz-forest/55"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.97, y: 8 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.97, y: 8 }}
                            transition={{ duration: 0.2 }}
                            className="relative z-10 w-full max-w-2xl rounded-[var(--radius-card)] border border-laz-gold/40 bg-laz-surface shadow-xl"
                        >
                            <div className="flex items-center justify-between border-b border-laz-gold/25 px-6 py-4">
                                <h2
                                    id="modal-inspect-sk-title"
                                    className="text-lg font-bold text-laz-forest"
                                >
                                    Rincian SK — {inspectSk.nomor_sk_salur}
                                </h2>
                                <button
                                    type="button"
                                    onClick={() => setInspectSkId(null)}
                                    aria-label="Tutup rincian SK"
                                    className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-[var(--radius-button)] text-laz-muted hover:bg-laz-cream hover:text-laz-forest"
                                >
                                    <X className="h-5 w-5" aria-hidden="true" />
                                </button>
                            </div>
                            <div className="max-h-[75vh] space-y-4 overflow-y-auto px-6 py-5">
                                <div className="rounded-[var(--radius-button)] border border-laz-gold/30 bg-laz-cream px-4 py-3 text-xs text-laz-forest">
                                    <p className="font-bold">
                                        {inspectSk.program?.nama_program ?? '—'}
                                    </p>
                                    <p className="mt-1 text-laz-muted">
                                        Rekening:{' '}
                                        {inspectSk.rekening
                                            ? `${inspectSk.rekening.nama_bank} (${inspectSk.rekening.nomor_rekening})`
                                            : '—'}{' '}
                                        • Total:{' '}
                                        <span className="font-mono font-bold text-laz-forest">
                                            {formatRupiah(
                                                inspectSk.total_nominal,
                                            )}
                                        </span>
                                    </p>
                                </div>

                                <div className="overflow-hidden rounded-[var(--radius-button)] border border-laz-gold/30">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-laz-gold/25 bg-laz-cream/60">
                                                <th className="px-4 py-2.5 text-left font-semibold text-laz-forest">
                                                    Mustahik
                                                </th>
                                                <th className="px-4 py-2.5 text-left font-semibold text-laz-forest">
                                                    Asnaf
                                                </th>
                                                <th className="px-4 py-2.5 text-right font-semibold text-laz-forest">
                                                    Nominal
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-laz-gold/20">
                                            {!inspectSk.details ||
                                            inspectSk.details.length === 0 ? (
                                                <tr>
                                                    <td
                                                        colSpan={3}
                                                        className="px-4 py-6 text-center text-laz-muted"
                                                    >
                                                        Belum ada penerima.
                                                    </td>
                                                </tr>
                                            ) : (
                                                inspectSk.details.map((d) => (
                                                    <tr
                                                        key={d.id_detail_salur}
                                                    >
                                                        <td className="px-4 py-2.5">
                                                            <p className="font-semibold text-laz-forest">
                                                                {d.mustahik
                                                                    ?.nama_lengkap ??
                                                                    '—'}
                                                            </p>
                                                            <p className="font-mono text-xs text-laz-muted">
                                                                {d.mustahik
                                                                    ?.nik ?? ''}
                                                            </p>
                                                        </td>
                                                        <td className="px-4 py-2.5 text-laz-muted">
                                                            {d.asnaf
                                                                ?.kode_asnaf ??
                                                                '—'}
                                                        </td>
                                                        <td className="px-4 py-2.5 text-right font-mono font-semibold text-laz-forest">
                                                            {formatRupiah(
                                                                d.nominal_diterima,
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modal Konfirmasi Setujui / Cairkan */}
            <AnimatePresence>
                {confirmAction && (
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="modal-confirm-sk-title"
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() =>
                                !submitting && setConfirmAction(null)
                            }
                            aria-hidden="true"
                            className="fixed inset-0 bg-laz-forest/55"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.97, y: 8 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.97, y: 8 }}
                            transition={{ duration: 0.2 }}
                            className="relative z-10 w-full max-w-md rounded-[var(--radius-card)] border border-laz-gold/40 bg-laz-surface p-6 shadow-xl"
                        >
                            <div className="flex items-start gap-3">
                                <ShieldAlert
                                    className="mt-0.5 h-6 w-6 shrink-0 text-laz-warning"
                                    aria-hidden="true"
                                />
                                <div>
                                    <h2
                                        id="modal-confirm-sk-title"
                                        className="text-lg font-bold text-laz-forest"
                                    >
                                        {confirmAction.type === 'approve'
                                            ? 'Konfirmasi Pengesahan SK'
                                            : 'Konfirmasi Pencairan Dana'}
                                    </h2>
                                    <p className="mt-2 text-sm text-laz-muted">
                                        {confirmAction.type === 'approve'
                                            ? `Anda akan mengesahkan SK ${confirmAction.sk.nomor_sk_salur} senilai ${formatRupiah(confirmAction.sk.total_nominal)} melalui sp_setujui_penyaluran.`
                                            : `Anda akan mencairkan dana SK ${confirmAction.sk.nomor_sk_salur} senilai ${formatRupiah(confirmAction.sk.total_nominal)} melalui sp_cairkan_penyaluran. Saldo kantong dana akan dipotong dan dicatat ke buku besar mutasi_dana.`}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end gap-3">
                                <button
                                    type="button"
                                    disabled={submitting}
                                    onClick={() => setConfirmAction(null)}
                                    className="min-h-11 rounded-[var(--radius-button)] border border-laz-gold/45 px-5 py-2.5 text-sm font-semibold text-laz-muted hover:bg-laz-cream hover:text-laz-forest disabled:opacity-60"
                                >
                                    Batal
                                </button>
                                <button
                                    type="button"
                                    disabled={submitting}
                                    onClick={executeConfirmedAction}
                                    className="min-h-11 rounded-[var(--radius-button)] bg-laz-forest px-5 py-2.5 text-sm font-semibold text-laz-surface hover:bg-laz-forest-hover disabled:opacity-60"
                                >
                                    {submitting
                                        ? 'Memproses…'
                                        : confirmAction.type === 'approve'
                                          ? 'Ya, Sahkan SK'
                                          : 'Ya, Cairkan Dana'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </DashboardLayout>
    );
}
