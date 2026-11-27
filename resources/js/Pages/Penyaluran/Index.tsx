import { type FormEventHandler, useEffect, useMemo, useState } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    AlertCircle,
    CheckCircle,
    FilePlus2,
    Filter,
    Info,
    Search,
    Users,
    X,
} from 'lucide-react';

import DashboardLayout from '@/Layouts/DashboardLayout';
import {
    formatRupiah,
    formatTanggalId,
    KATEGORI_INDUK_LABELS,
} from '@/lib/formatters';
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

type ProgramAktifItem = Program & {
    jenis_dana?: Pick<
        JenisDana,
        'id_jenis_dana' | 'kode_dana' | 'nama_dana' | 'kategori_induk'
    >;
};

type MustahikLayakItem = Pick<
    Mustahik,
    | 'id_mustahik'
    | 'nik'
    | 'nama_lengkap'
    | 'id_asnaf'
    | 'alamat_kecamatan'
    | 'status_kelayakan'
    | 'tgl_kedaluwarsa'
> & {
    asnaf?: Pick<Asnaf, 'id_asnaf' | 'kode_asnaf' | 'nama_asnaf'>;
};

interface PenyaluranIndexProps {
    penyaluran: Paginator<PenyaluranRow>;
    programAktif: ProgramAktifItem[];
    rekeningAktif: RekeningLembaga[];
    mustahikLayak: MustahikLayakItem[];
    amilInfo: {
        sisa_kuota_bulan_ini: string;
        batas_maks_persen: string;
        persentase_terhadap_zakat: string;
        total_disalurkan: string;
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

function Modal({
    open,
    onClose,
    title,
    titleId,
    wide = false,
    children,
}: {
    open: boolean;
    onClose: () => void;
    title: string;
    titleId: string;
    wide?: boolean;
    children: React.ReactNode;
}) {
    useEffect(() => {
        if (!open) return;
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [open, onClose]);

    return (
        <AnimatePresence>
            {open && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby={titleId}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                >
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        aria-hidden="true"
                        className="fixed inset-0 bg-laz-forest/55"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.97, y: 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.97, y: 8 }}
                        transition={{ duration: 0.2 }}
                        className={`relative z-10 w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} rounded-[var(--radius-card)] border border-laz-gold/40 bg-laz-surface shadow-xl`}
                    >
                        <div className="flex items-center justify-between border-b border-laz-gold/25 px-6 py-4">
                            <h2
                                id={titleId}
                                className="text-lg font-bold text-laz-forest"
                            >
                                {title}
                            </h2>
                            <button
                                type="button"
                                onClick={onClose}
                                aria-label="Tutup dialog"
                                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-[var(--radius-button)] text-laz-muted transition-colors hover:bg-laz-cream hover:text-laz-forest"
                            >
                                <X className="h-5 w-5" aria-hidden="true" />
                            </button>
                        </div>
                        <div className="max-h-[78vh] overflow-y-auto px-6 py-5">
                            {children}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

function ModalBuatDraftSk({
    open,
    onClose,
    programAktif,
    rekeningAktif,
}: {
    open: boolean;
    onClose: () => void;
    programAktif: ProgramAktifItem[];
    rekeningAktif: RekeningLembaga[];
}) {
    const today = new Date().toISOString().slice(0, 10);
    const { data, setData, post, processing, errors, reset } = useForm({
        nomor_sk_salur: '',
        id_program: '',
        id_rekening: '',
        tgl_pengajuan: today,
    });

    const selectedProgram = useMemo(
        () =>
            programAktif.find(
                (p) => String(p.id_program) === data.id_program,
            ) ?? null,
        [programAktif, data.id_program],
    );

    const filteredRekening = useMemo(() => {
        if (!selectedProgram?.jenis_dana) return [];
        const kat = selectedProgram.jenis_dana.kategori_induk;
        return rekeningAktif.filter((r) => r.kategori_induk === kat);
    }, [selectedProgram, rekeningAktif]);

    const handleProgramChange = (programId: string) => {
        setData((prev) => ({
            ...prev,
            id_program: programId,
            id_rekening: '',
        }));
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/penyaluran', {
            onSuccess: handleClose,
        });
    };

    return (
        <Modal
            open={open}
            onClose={handleClose}
            title="Buat Draft SK Penyaluran"
            titleId="modal-draft-sk-title"
        >
            <form onSubmit={submit} className="space-y-4">
                <div>
                    <label
                        htmlFor="id_program"
                        className="mb-1.5 block text-sm font-semibold text-laz-forest"
                    >
                        Program Penyaluran Aktif
                    </label>
                    <select
                        id="id_program"
                        value={data.id_program}
                        onChange={(e) => handleProgramChange(e.target.value)}
                        className="min-h-11 w-full rounded-[var(--radius-button)] border border-laz-gold/45 bg-laz-cream/50 px-4 py-2.5 text-sm text-laz-forest focus:border-laz-forest focus:outline-none focus:ring-2 focus:ring-laz-forest/15"
                    >
                        <option value="">-- Pilih Program Aktif --</option>
                        {programAktif.map((p) => (
                            <option key={p.id_program} value={p.id_program}>
                                {p.kode_program} — {p.nama_program}
                            </option>
                        ))}
                    </select>
                    {errors.id_program && (
                        <p className="mt-1 text-xs text-laz-danger">
                            {errors.id_program}
                        </p>
                    )}
                </div>

                {selectedProgram?.jenis_dana && (
                    <div className="rounded-[var(--radius-button)] border border-laz-sage/35 bg-laz-cream px-4 py-3 text-xs text-laz-forest">
                        <span className="font-semibold">
                            Kantong Dana Terikat:
                        </span>{' '}
                        {selectedProgram.jenis_dana.kode_dana} —{' '}
                        {selectedProgram.jenis_dana.nama_dana} (
                        {
                            KATEGORI_INDUK_LABELS[
                                selectedProgram.jenis_dana.kategori_induk
                            ]
                        }
                        )
                    </div>
                )}

                <div>
                    <label
                        htmlFor="id_rekening"
                        className="mb-1.5 block text-sm font-semibold text-laz-forest"
                    >
                        Rekening Sumber Pencairan
                    </label>
                    <select
                        id="id_rekening"
                        value={data.id_rekening}
                        disabled={!selectedProgram}
                        onChange={(e) => setData('id_rekening', e.target.value)}
                        className="min-h-11 w-full rounded-[var(--radius-button)] border border-laz-gold/45 bg-laz-cream/50 px-4 py-2.5 text-sm text-laz-forest focus:border-laz-forest focus:outline-none focus:ring-2 focus:ring-laz-forest/15 disabled:opacity-60"
                    >
                        <option value="">
                            {selectedProgram
                                ? '-- Pilih Rekening Sesuai Akad --'
                                : '-- Pilih Program Terlebih Dahulu --'}
                        </option>
                        {filteredRekening.map((r) => (
                            <option key={r.id_rekening} value={r.id_rekening}>
                                {r.nama_bank} ({r.nomor_rekening})
                            </option>
                        ))}
                    </select>
                    {errors.id_rekening && (
                        <p className="mt-1 text-xs text-laz-danger">
                            {errors.id_rekening}
                        </p>
                    )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <label
                            htmlFor="nomor_sk_salur"
                            className="mb-1.5 block text-sm font-semibold text-laz-forest"
                        >
                            Nomor SK (opsional)
                        </label>
                        <input
                            id="nomor_sk_salur"
                            type="text"
                            maxLength={35}
                            value={data.nomor_sk_salur}
                            onChange={(e) =>
                                setData('nomor_sk_salur', e.target.value)
                            }
                            placeholder="Otomatis jika kosong"
                            className="min-h-11 w-full rounded-[var(--radius-button)] border border-laz-gold/45 bg-laz-cream/50 px-4 py-2.5 font-mono text-sm text-laz-forest placeholder:text-laz-muted/70 focus:border-laz-forest focus:outline-none focus:ring-2 focus:ring-laz-forest/15"
                        />
                        {errors.nomor_sk_salur && (
                            <p className="mt-1 text-xs text-laz-danger">
                                {errors.nomor_sk_salur}
                            </p>
                        )}
                    </div>

                    <div>
                        <label
                            htmlFor="tgl_pengajuan"
                            className="mb-1.5 block text-sm font-semibold text-laz-forest"
                        >
                            Tanggal Pengajuan
                        </label>
                        <input
                            id="tgl_pengajuan"
                            type="date"
                            value={data.tgl_pengajuan}
                            onChange={(e) =>
                                setData('tgl_pengajuan', e.target.value)
                            }
                            className="min-h-11 w-full rounded-[var(--radius-button)] border border-laz-gold/45 bg-laz-cream/50 px-4 py-2.5 text-sm text-laz-forest focus:border-laz-forest focus:outline-none focus:ring-2 focus:ring-laz-forest/15"
                        />
                        {errors.tgl_pengajuan && (
                            <p className="mt-1 text-xs text-laz-danger">
                                {errors.tgl_pengajuan}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <button
                        type="button"
                        onClick={handleClose}
                        className="min-h-11 rounded-[var(--radius-button)] border border-laz-gold/45 px-5 py-2.5 text-sm font-semibold text-laz-muted transition-colors hover:bg-laz-cream hover:text-laz-forest"
                    >
                        Batal
                    </button>
                    <button
                        type="submit"
                        disabled={processing}
                        className="min-h-11 rounded-[var(--radius-button)] bg-laz-forest px-5 py-2.5 text-sm font-semibold text-laz-surface transition-colors hover:bg-laz-forest-hover disabled:opacity-60"
                    >
                        {processing ? 'Menyimpan…' : 'Simpan Draft SK'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

function ModalDetailPenyaluran({
    open,
    onClose,
    sk,
    mustahikLayak,
    sisaKuotaAmil,
}: {
    open: boolean;
    onClose: () => void;
    sk: PenyaluranRow | null;
    mustahikLayak: MustahikLayakItem[];
    sisaKuotaAmil: string;
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        id_mustahik: '',
        nominal_diterima: '',
        keterangan_bantuan: '',
    });

    const selectedMustahik = useMemo(
        () =>
            mustahikLayak.find(
                (m) => String(m.id_mustahik) === data.id_mustahik,
            ) ?? null,
        [mustahikLayak, data.id_mustahik],
    );

    const isAmilSelected = selectedMustahik?.asnaf?.kode_asnaf === 'AMIL';
    const isZakatSk = sk?.jenis_dana?.kategori_induk === 'ZAKAT';
    const nominalVal = parseFloat(data.nominal_diterima) || 0;
    const sisaAmilVal = parseFloat(sisaKuotaAmil) || 0;
    const exceedsAmilQuota =
        isZakatSk && isAmilSelected && nominalVal > sisaAmilVal;

    const handleClose = () => {
        reset();
        onClose();
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        if (!sk) return;
        post(`/penyaluran/${sk.id_penyaluran}/detail`, {
            preserveScroll: true,
            onSuccess: () => {
                reset();
            },
        });
    };

    return (
        <Modal
            open={open}
            onClose={handleClose}
            title={
                sk
                    ? `Rincian Penerima — ${sk.nomor_sk_salur}`
                    : 'Rincian Penerima'
            }
            titleId="modal-detail-sk-title"
            wide
        >
            {sk && (
                <div className="space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-button)] border border-laz-gold/35 bg-laz-cream px-4 py-3">
                        <div>
                            <p className="text-sm font-bold text-laz-forest">
                                {sk.program?.nama_program ?? '—'}
                            </p>
                            <p className="mt-0.5 text-xs text-laz-muted">
                                {sk.jenis_dana?.nama_dana ?? '—'} •{' '}
                                {sk.rekening
                                    ? `${sk.rekening.nama_bank} (${sk.rekening.nomor_rekening})`
                                    : '—'}
                            </p>
                        </div>
                        <div className="text-right">
                            <StatusSkBadge status={sk.status_penyaluran} />
                            <p className="mt-1 font-mono text-sm font-bold text-laz-forest">
                                {formatRupiah(sk.total_nominal)}
                            </p>
                        </div>
                    </div>

                    {sk.status_penyaluran === 'DRAFT' && (
                        <form
                            onSubmit={submit}
                            className="space-y-4 rounded-[var(--radius-button)] border border-laz-sage/35 bg-laz-cream/40 p-4"
                        >
                            <h3 className="text-sm font-bold text-laz-forest">
                                Tambah Penerima (Hanya Mustahik Layak & Aktif)
                            </h3>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label
                                        htmlFor="detail_id_mustahik"
                                        className="mb-1.5 block text-xs font-semibold text-laz-forest"
                                    >
                                        Mustahik Terverifikasi Layak
                                    </label>
                                    <select
                                        id="detail_id_mustahik"
                                        value={data.id_mustahik}
                                        onChange={(e) =>
                                            setData(
                                                'id_mustahik',
                                                e.target.value,
                                            )
                                        }
                                        className="min-h-11 w-full rounded-[var(--radius-button)] border border-laz-gold/45 bg-laz-surface px-3 py-2 text-sm text-laz-forest focus:border-laz-forest focus:outline-none focus:ring-2 focus:ring-laz-forest/15"
                                    >
                                        <option value="">
                                            -- Pilih Mustahik --
                                        </option>
                                        {mustahikLayak.map((m) => (
                                            <option
                                                key={m.id_mustahik}
                                                value={m.id_mustahik}
                                            >
                                                {m.nama_lengkap} (
                                                {m.asnaf?.kode_asnaf ?? 'ASNAF'}
                                                )
                                            </option>
                                        ))}
                                    </select>
                                    {errors.id_mustahik && (
                                        <p className="mt-1 text-xs text-laz-danger">
                                            {errors.id_mustahik}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label
                                        htmlFor="nominal_diterima"
                                        className="mb-1.5 block text-xs font-semibold text-laz-forest"
                                    >
                                        Nominal Bantuan (Rp)
                                    </label>
                                    <input
                                        id="nominal_diterima"
                                        type="number"
                                        min={1000}
                                        step={1000}
                                        value={data.nominal_diterima}
                                        onChange={(e) =>
                                            setData(
                                                'nominal_diterima',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="500000"
                                        className="min-h-11 w-full rounded-[var(--radius-button)] border border-laz-gold/45 bg-laz-surface px-3 py-2 font-mono text-sm text-laz-forest focus:border-laz-forest focus:outline-none focus:ring-2 focus:ring-laz-forest/15"
                                    />
                                    {errors.nominal_diterima && (
                                        <p className="mt-1 text-xs text-laz-danger">
                                            {errors.nominal_diterima}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {isZakatSk && isAmilSelected && (
                                <div
                                    className={`rounded-[var(--radius-button)] border px-3 py-2 text-xs ${
                                        exceedsAmilQuota
                                            ? 'border-laz-danger/40 bg-laz-danger/10 text-laz-danger'
                                            : 'border-laz-warning/40 bg-laz-warning/10 text-laz-warning'
                                    }`}
                                >
                                    Asnaf AMIL terdeteksi. Sisa kuota Amil
                                    bulan ini (maks. 12,5%):{' '}
                                    <span className="font-mono font-bold">
                                        {formatRupiah(sisaKuotaAmil)}
                                    </span>
                                    {exceedsAmilQuota &&
                                        ' — Nominal melebihi sisa kuota dan akan ditolak trigger SQL.'}
                                </div>
                            )}

                            <div>
                                <label
                                    htmlFor="keterangan_bantuan"
                                    className="mb-1.5 block text-xs font-semibold text-laz-forest"
                                >
                                    Keterangan Bantuan
                                </label>
                                <input
                                    id="keterangan_bantuan"
                                    type="text"
                                    maxLength={150}
                                    value={data.keterangan_bantuan}
                                    onChange={(e) =>
                                        setData(
                                            'keterangan_bantuan',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Contoh: Paket sembako & bantuan tunai"
                                    className="min-h-11 w-full rounded-[var(--radius-button)] border border-laz-gold/45 bg-laz-surface px-3 py-2 text-sm text-laz-forest focus:border-laz-forest focus:outline-none focus:ring-2 focus:ring-laz-forest/15"
                                />
                                {errors.keterangan_bantuan && (
                                    <p className="mt-1 text-xs text-laz-danger">
                                        {errors.keterangan_bantuan}
                                    </p>
                                )}
                            </div>

                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="min-h-11 rounded-[var(--radius-button)] bg-laz-forest px-5 py-2 text-sm font-semibold text-laz-surface transition-colors hover:bg-laz-forest-hover disabled:opacity-60"
                                >
                                    {processing
                                        ? 'Menambahkan…'
                                        : 'Tambah ke Rincian SK'}
                                </button>
                            </div>
                        </form>
                    )}

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
                                    <th className="px-4 py-2.5 text-left font-semibold text-laz-forest">
                                        Keterangan
                                    </th>
                                    <th className="px-4 py-2.5 text-right font-semibold text-laz-forest">
                                        Nominal
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-laz-gold/20">
                                {!sk.details || sk.details.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="px-4 py-6 text-center text-laz-muted"
                                        >
                                            Belum ada rincian penerima pada SK
                                            ini.
                                        </td>
                                    </tr>
                                ) : (
                                    sk.details.map((d) => (
                                        <tr key={d.id_detail_salur}>
                                            <td className="px-4 py-2.5">
                                                <p className="font-semibold text-laz-forest">
                                                    {d.mustahik?.nama_lengkap ??
                                                        '—'}
                                                </p>
                                                <p className="font-mono text-xs text-laz-muted">
                                                    {d.mustahik?.nik ?? ''}
                                                </p>
                                            </td>
                                            <td className="px-4 py-2.5 text-laz-muted">
                                                {d.asnaf?.kode_asnaf ?? '—'}
                                            </td>
                                            <td className="px-4 py-2.5 text-laz-muted">
                                                {d.keterangan_bantuan ?? '—'}
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
            )}
        </Modal>
    );
}

export default function PenyaluranIndex({
    penyaluran,
    programAktif,
    rekeningAktif,
    mustahikLayak,
    amilInfo,
    filters,
}: PenyaluranIndexProps) {
    const { props } = usePage<SharedPageProps>();
    const flash = props.flash;
    const pageErrors = props.errors;

    const [modalDraft, setModalDraft] = useState(false);
    const [selectedSkId, setSelectedSkId] = useState<number | null>(null);

    const [localSearch, setLocalSearch] = useState(filters.search);
    const [localStatus, setLocalStatus] = useState(filters.status);

    const selectedSk = useMemo(
        () =>
            penyaluran.data.find((item) => item.id_penyaluran === selectedSkId) ??
            null,
        [penyaluran.data, selectedSkId],
    );

    const applyFilters = () => {
        router.get(
            '/penyaluran',
            { search: localSearch, status: localStatus },
            { preserveState: true, replace: true },
        );
    };

    return (
        <DashboardLayout title="Draft SK">
            <Head title="Draft SK" />

            <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-laz-forest">
                            Pengajuan SK & Rincian Penyaluran
                        </h1>
                        <p className="mt-1 text-sm text-laz-muted">
                            Pembuatan dokumen SK berstatus DRAFT dan pengisian
                            daftar penerima terverifikasi layak.
                        </p>
                    </div>
                    <motion.button
                        type="button"
                        onClick={() => setModalDraft(true)}
                        whileTap={{ scale: 0.97 }}
                        className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-button)] bg-laz-forest px-5 py-2.5 text-sm font-semibold text-laz-surface shadow-sm transition-colors hover:bg-laz-forest-hover"
                    >
                        <FilePlus2 className="h-4 w-4" aria-hidden="true" />
                        Buat Draft SK
                    </motion.button>
                </div>

                {/* Amil Quota Banner */}
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-[var(--radius-card)] border border-laz-gold/40 bg-laz-surface px-5 py-4">
                    <div className="flex items-start gap-3">
                        <Info
                            className="mt-0.5 h-5 w-5 shrink-0 text-laz-forest"
                            aria-hidden="true"
                        />
                        <div>
                            <p className="text-sm font-bold text-laz-forest">
                                Kontrol Kuota Hak Amil (Maks.{' '}
                                {amilInfo.batas_maks_persen}%)
                            </p>
                            <p className="mt-0.5 text-xs text-laz-muted">
                                Realisasi saat ini{' '}
                                <span className="font-mono font-semibold text-laz-forest">
                                    {amilInfo.persentase_terhadap_zakat}%
                                </span>{' '}
                                terhadap zakat terhimpun.
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-laz-muted">
                            Sisa Kuota Amil Bulan Ini
                        </p>
                        <p className="font-mono text-base font-bold text-laz-forest">
                            {formatRupiah(amilInfo.sisa_kuota_bulan_ini)}
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
                            placeholder="Cari nomor SK atau nama program…"
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

                <div className="overflow-hidden rounded-[var(--radius-card)] border border-laz-gold/35 bg-laz-surface">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-laz-gold/25 bg-laz-cream/60">
                                    <th className="px-4 py-3 text-left font-semibold text-laz-forest">
                                        Nomor SK / Tgl
                                    </th>
                                    <th className="px-4 py-3 text-left font-semibold text-laz-forest">
                                        Program & Dana
                                    </th>
                                    <th className="px-4 py-3 text-left font-semibold text-laz-forest">
                                        Penerima
                                    </th>
                                    <th className="px-4 py-3 text-right font-semibold text-laz-forest">
                                        Total Nominal
                                    </th>
                                    <th className="px-4 py-3 text-left font-semibold text-laz-forest">
                                        Status
                                    </th>
                                    <th className="px-4 py-3 text-left font-semibold text-laz-forest">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-laz-gold/20">
                                {penyaluran.data.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="px-4 py-10 text-center text-laz-muted"
                                        >
                                            Tidak ada dokumen SK penyaluran.
                                        </td>
                                    </tr>
                                ) : (
                                    penyaluran.data.map((item) => (
                                        <tr
                                            key={item.id_penyaluran}
                                            className="transition-colors hover:bg-laz-cream/40"
                                        >
                                            <td className="px-4 py-3">
                                                <p className="font-mono font-semibold text-laz-forest">
                                                    {item.nomor_sk_salur}
                                                </p>
                                                <p className="mt-0.5 text-xs text-laz-muted">
                                                    {formatTanggalId(
                                                        item.tgl_pengajuan,
                                                    )}
                                                </p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="font-semibold text-laz-forest">
                                                    {item.program?.nama_program ??
                                                        '—'}
                                                </p>
                                                <p className="mt-0.5 text-xs text-laz-muted">
                                                    {item.jenis_dana?.nama_dana ??
                                                        '—'}
                                                </p>
                                            </td>
                                            <td className="px-4 py-3 font-mono text-laz-muted">
                                                {item.details?.length ?? 0}{' '}
                                                orang
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono font-semibold text-laz-forest">
                                                {formatRupiah(
                                                    item.total_nominal,
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <StatusSkBadge
                                                    status={
                                                        item.status_penyaluran
                                                    }
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <motion.button
                                                    type="button"
                                                    onClick={() =>
                                                        setSelectedSkId(
                                                            item.id_penyaluran,
                                                        )
                                                    }
                                                    whileTap={{ scale: 0.97 }}
                                                    className="inline-flex min-h-11 items-center gap-1.5 rounded-[var(--radius-button)] border border-laz-gold/45 px-3.5 py-2 text-xs font-semibold text-laz-forest transition-colors hover:bg-laz-cream"
                                                >
                                                    <Users
                                                        className="h-4 w-4"
                                                        aria-hidden="true"
                                                    />
                                                    {item.status_penyaluran ===
                                                    'DRAFT'
                                                        ? 'Isi Penerima'
                                                        : 'Lihat Rincian'}
                                                </motion.button>
                                            </td>
                                        </tr>
                                    ))
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

            <ModalBuatDraftSk
                open={modalDraft}
                onClose={() => setModalDraft(false)}
                programAktif={programAktif}
                rekeningAktif={rekeningAktif}
            />
            <ModalDetailPenyaluran
                open={selectedSk !== null}
                onClose={() => setSelectedSkId(null)}
                sk={selectedSk}
                mustahikLayak={mustahikLayak}
                sisaKuotaAmil={amilInfo.sisa_kuota_bulan_ini}
            />
        </DashboardLayout>
    );
}
