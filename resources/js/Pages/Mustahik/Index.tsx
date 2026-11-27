import { type FormEventHandler, useEffect, useState } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    AlertCircle,
    CheckCircle,
    ClipboardCheck,
    Filter,
    Search,
    UserPlus,
    X,
} from 'lucide-react';

import DashboardLayout from '@/Layouts/DashboardLayout';
import { formatTanggalId } from '@/lib/formatters';
import type {
    Asnaf,
    HasilVerifikasi,
    Mustahik,
    Paginator,
    Pengguna,
    SharedPageProps,
    StatusKelayakan,
    SurveiVerifikasiMustahik,
} from '@/types/database';

type MustahikRow = Mustahik & {
    asnaf?: Pick<Asnaf, 'id_asnaf' | 'kode_asnaf' | 'nama_asnaf'>;
    verifikator?: Pick<Pengguna, 'id_pengguna' | 'nama_lengkap'>;
};

type SurveiRow = SurveiVerifikasiMustahik & {
    mustahik?: Pick<Mustahik, 'id_mustahik' | 'nik' | 'nama_lengkap'>;
    verifikator?: Pick<Pengguna, 'id_pengguna' | 'nama_lengkap'>;
    asnaf_rekomendasi?: Pick<Asnaf, 'id_asnaf' | 'kode_asnaf' | 'nama_asnaf'>;
};

interface MustahikIndexProps {
    mustahik: Paginator<MustahikRow>;
    asnafList: Asnaf[];
    riwayatSurvei: SurveiRow[];
    filters: { search: string; status: string; id_asnaf: string };
}

const STATUS_CONFIG: Record<
    StatusKelayakan,
    { label: string; className: string }
> = {
    BELUM_VERIFIKASI: {
        label: 'Belum Verifikasi',
        className: 'bg-laz-warning/15 text-laz-warning border border-laz-warning/35',
    },
    LAYAK: {
        label: 'Layak',
        className: 'bg-laz-sage/20 text-laz-forest border border-laz-sage/40',
    },
    TIDAK_LAYAK: {
        label: 'Tidak Layak',
        className: 'bg-laz-danger/10 text-laz-danger border border-laz-danger/35',
    },
    KEDALUWARSA: {
        label: 'Kedaluwarsa',
        className: 'bg-laz-muted/15 text-laz-muted border border-laz-muted/35',
    },
};

function StatusBadge({ status }: { status: StatusKelayakan }) {
    const cfg = STATUS_CONFIG[status];
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
    children,
}: {
    open: boolean;
    onClose: () => void;
    title: string;
    titleId: string;
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
                        className="relative z-10 w-full max-w-lg rounded-[var(--radius-card)] border border-laz-gold/40 bg-laz-surface shadow-xl"
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
                        <div className="max-h-[75vh] overflow-y-auto px-6 py-5">
                            {children}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

function ModalDaftarMustahik({
    open,
    onClose,
    asnafList,
}: {
    open: boolean;
    onClose: () => void;
    asnafList: Asnaf[];
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        nik: '',
        nama_lengkap: '',
        id_asnaf: '',
        alamat_kecamatan: '',
    });

    const handleClose = () => {
        reset();
        onClose();
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/mustahik', {
            onSuccess: handleClose,
        });
    };

    return (
        <Modal
            open={open}
            onClose={handleClose}
            title="Daftar Calon Mustahik"
            titleId="modal-daftar-mustahik-title"
        >
            <form onSubmit={submit} className="space-y-4">
                <div>
                    <label
                        htmlFor="nik"
                        className="mb-1.5 block text-sm font-semibold text-laz-forest"
                    >
                        NIK (16 digit)
                    </label>
                    <input
                        id="nik"
                        type="text"
                        inputMode="numeric"
                        maxLength={16}
                        value={data.nik}
                        onChange={(e) =>
                            setData('nik', e.target.value.replace(/\D/g, ''))
                        }
                        placeholder="1471xxxxxxxxxxxx"
                        className="min-h-11 w-full rounded-[var(--radius-button)] border border-laz-gold/45 bg-laz-cream/50 px-4 py-2.5 font-mono text-sm text-laz-forest placeholder:text-laz-muted/70 focus:border-laz-forest focus:outline-none focus:ring-2 focus:ring-laz-forest/15"
                    />
                    {errors.nik && (
                        <p className="mt-1 text-xs text-laz-danger">
                            {errors.nik}
                        </p>
                    )}
                </div>

                <div>
                    <label
                        htmlFor="nama_lengkap"
                        className="mb-1.5 block text-sm font-semibold text-laz-forest"
                    >
                        Nama Lengkap
                    </label>
                    <input
                        id="nama_lengkap"
                        type="text"
                        value={data.nama_lengkap}
                        onChange={(e) =>
                            setData('nama_lengkap', e.target.value)
                        }
                        placeholder="Sesuai KTP"
                        className="min-h-11 w-full rounded-[var(--radius-button)] border border-laz-gold/45 bg-laz-cream/50 px-4 py-2.5 text-sm text-laz-forest placeholder:text-laz-muted/70 focus:border-laz-forest focus:outline-none focus:ring-2 focus:ring-laz-forest/15"
                    />
                    {errors.nama_lengkap && (
                        <p className="mt-1 text-xs text-laz-danger">
                            {errors.nama_lengkap}
                        </p>
                    )}
                </div>

                <div>
                    <label
                        htmlFor="id_asnaf"
                        className="mb-1.5 block text-sm font-semibold text-laz-forest"
                    >
                        Golongan Asnaf (sementara)
                    </label>
                    <select
                        id="id_asnaf"
                        value={data.id_asnaf}
                        onChange={(e) => setData('id_asnaf', e.target.value)}
                        className="min-h-11 w-full rounded-[var(--radius-button)] border border-laz-gold/45 bg-laz-cream/50 px-4 py-2.5 text-sm text-laz-forest focus:border-laz-forest focus:outline-none focus:ring-2 focus:ring-laz-forest/15"
                    >
                        <option value="">-- Pilih Golongan --</option>
                        {asnafList.map((a) => (
                            <option key={a.id_asnaf} value={a.id_asnaf}>
                                {a.kode_asnaf} — {a.nama_asnaf}
                            </option>
                        ))}
                    </select>
                    {errors.id_asnaf && (
                        <p className="mt-1 text-xs text-laz-danger">
                            {errors.id_asnaf}
                        </p>
                    )}
                </div>

                <div>
                    <label
                        htmlFor="alamat_kecamatan"
                        className="mb-1.5 block text-sm font-semibold text-laz-forest"
                    >
                        Kecamatan
                    </label>
                    <input
                        id="alamat_kecamatan"
                        type="text"
                        value={data.alamat_kecamatan}
                        onChange={(e) =>
                            setData('alamat_kecamatan', e.target.value)
                        }
                        placeholder="Contoh: Payung Sekaki"
                        className="min-h-11 w-full rounded-[var(--radius-button)] border border-laz-gold/45 bg-laz-cream/50 px-4 py-2.5 text-sm text-laz-forest placeholder:text-laz-muted/70 focus:border-laz-forest focus:outline-none focus:ring-2 focus:ring-laz-forest/15"
                    />
                    {errors.alamat_kecamatan && (
                        <p className="mt-1 text-xs text-laz-danger">
                            {errors.alamat_kecamatan}
                        </p>
                    )}
                </div>

                <div className="rounded-[var(--radius-button)] border border-laz-gold/35 bg-laz-cream px-4 py-3 text-xs text-laz-muted">
                    Status awal:{' '}
                    <span className="font-semibold text-laz-warning">
                        BELUM_VERIFIKASI
                    </span>
                    . Survei lapangan dilakukan setelah pendaftaran.
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
                        {processing ? 'Menyimpan…' : 'Daftarkan'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

function ModalSurvei({
    open,
    onClose,
    mustahik,
    asnafList,
}: {
    open: boolean;
    onClose: () => void;
    mustahik: MustahikRow | null;
    asnafList: Asnaf[];
}) {
    const today = new Date().toISOString().slice(0, 10);
    const { data, setData, post, processing, errors, reset } = useForm<{
        id_asnaf_rekom: string;
        tgl_survei: string;
        skor_kelayakan: string;
        hasil_verifikasi: HasilVerifikasi | '';
        catatan_survei: string;
    }>({
        id_asnaf_rekom: '',
        tgl_survei: today,
        skor_kelayakan: '75',
        hasil_verifikasi: 'LAYAK',
        catatan_survei: '',
    });

    useEffect(() => {
        if (mustahik) {
            setData((prev) => ({
                ...prev,
                id_asnaf_rekom: String(mustahik.id_asnaf),
                tgl_survei: prev.tgl_survei || today,
            }));
        }
    }, [mustahik, setData, today]);

    const handleClose = () => {
        reset();
        onClose();
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        if (!mustahik) return;
        post(`/mustahik/${mustahik.id_mustahik}/verifikasi`, {
            onSuccess: handleClose,
        });
    };

    const skor = parseInt(data.skor_kelayakan, 10) || 0;

    return (
        <Modal
            open={open}
            onClose={handleClose}
            title="Berita Acara Survei Lapangan"
            titleId="modal-survei-mustahik-title"
        >
            {mustahik && (
                <div className="mb-5 rounded-[var(--radius-button)] border border-laz-sage/35 bg-laz-cream px-4 py-3">
                    <p className="text-sm font-bold text-laz-forest">
                        {mustahik.nama_lengkap}
                    </p>
                    <p className="mt-0.5 font-mono text-xs text-laz-muted">
                        NIK: {mustahik.nik}
                    </p>
                    <div className="mt-2">
                        <StatusBadge status={mustahik.status_kelayakan} />
                    </div>
                </div>
            )}

            <form onSubmit={submit} className="space-y-4">
                <div>
                    <label
                        htmlFor="id_asnaf_rekom"
                        className="mb-1.5 block text-sm font-semibold text-laz-forest"
                    >
                        Rekomendasi Golongan Asnaf
                    </label>
                    <select
                        id="id_asnaf_rekom"
                        value={data.id_asnaf_rekom}
                        onChange={(e) =>
                            setData('id_asnaf_rekom', e.target.value)
                        }
                        className="min-h-11 w-full rounded-[var(--radius-button)] border border-laz-gold/45 bg-laz-cream/50 px-4 py-2.5 text-sm text-laz-forest focus:border-laz-forest focus:outline-none focus:ring-2 focus:ring-laz-forest/15"
                    >
                        <option value="">-- Pilih Golongan --</option>
                        {asnafList.map((a) => (
                            <option key={a.id_asnaf} value={a.id_asnaf}>
                                {a.kode_asnaf} — {a.nama_asnaf}
                            </option>
                        ))}
                    </select>
                    {errors.id_asnaf_rekom && (
                        <p className="mt-1 text-xs text-laz-danger">
                            {errors.id_asnaf_rekom}
                        </p>
                    )}
                </div>

                <div>
                    <label
                        htmlFor="tgl_survei"
                        className="mb-1.5 block text-sm font-semibold text-laz-forest"
                    >
                        Tanggal Survei
                    </label>
                    <input
                        id="tgl_survei"
                        type="date"
                        value={data.tgl_survei}
                        onChange={(e) => setData('tgl_survei', e.target.value)}
                        className="min-h-11 w-full rounded-[var(--radius-button)] border border-laz-gold/45 bg-laz-cream/50 px-4 py-2.5 text-sm text-laz-forest focus:border-laz-forest focus:outline-none focus:ring-2 focus:ring-laz-forest/15"
                    />
                    {errors.tgl_survei && (
                        <p className="mt-1 text-xs text-laz-danger">
                            {errors.tgl_survei}
                        </p>
                    )}
                </div>

                <div>
                    <label
                        htmlFor="skor_kelayakan"
                        className="mb-1.5 flex items-center justify-between text-sm font-semibold text-laz-forest"
                    >
                        <span>Skor Kelayakan</span>
                        <span
                            className={`font-mono text-base font-bold ${skor >= 60 ? 'text-laz-forest' : 'text-laz-danger'}`}
                        >
                            {skor}
                        </span>
                    </label>
                    <input
                        id="skor_kelayakan"
                        type="range"
                        min={0}
                        max={100}
                        step={1}
                        value={data.skor_kelayakan}
                        onChange={(e) =>
                            setData('skor_kelayakan', e.target.value)
                        }
                        className="w-full accent-laz-forest"
                    />
                    <div className="mt-1 flex justify-between text-xs text-laz-muted">
                        <span>0 (Tidak Layak)</span>
                        <span>100 (Sangat Layak)</span>
                    </div>
                    {errors.skor_kelayakan && (
                        <p className="mt-1 text-xs text-laz-danger">
                            {errors.skor_kelayakan}
                        </p>
                    )}
                </div>

                <div>
                    <fieldset>
                        <legend className="mb-2 text-sm font-semibold text-laz-forest">
                            Keputusan Kelayakan
                        </legend>
                        <div className="flex gap-5">
                            {(['LAYAK', 'TIDAK_LAYAK'] as HasilVerifikasi[]).map(
                                (val) => (
                                    <label
                                        key={val}
                                        className="flex min-h-11 cursor-pointer items-center gap-2"
                                    >
                                        <input
                                            type="radio"
                                            name="hasil_verifikasi"
                                            value={val}
                                            checked={
                                                data.hasil_verifikasi === val
                                            }
                                            onChange={() =>
                                                setData(
                                                    'hasil_verifikasi',
                                                    val,
                                                )
                                            }
                                            className="accent-laz-forest"
                                        />
                                        <span
                                            className={`text-sm font-semibold ${val === 'LAYAK' ? 'text-laz-forest' : 'text-laz-danger'}`}
                                        >
                                            {val === 'LAYAK'
                                                ? 'Layak (Berlaku 1 Tahun)'
                                                : 'Tidak Layak'}
                                        </span>
                                    </label>
                                ),
                            )}
                        </div>
                    </fieldset>
                    {errors.hasil_verifikasi && (
                        <p className="mt-1 text-xs text-laz-danger">
                            {errors.hasil_verifikasi}
                        </p>
                    )}
                </div>

                <div>
                    <label
                        htmlFor="catatan_survei"
                        className="mb-1.5 flex items-center justify-between text-sm font-semibold text-laz-forest"
                    >
                        <span>Catatan Survei</span>
                        <span className="text-xs font-normal text-laz-muted">
                            {data.catatan_survei.length}/200
                        </span>
                    </label>
                    <textarea
                        id="catatan_survei"
                        rows={3}
                        maxLength={200}
                        value={data.catatan_survei}
                        onChange={(e) =>
                            setData('catatan_survei', e.target.value)
                        }
                        placeholder="Kondisi tempat tinggal, tanggungan keluarga, dll."
                        className="w-full resize-none rounded-[var(--radius-button)] border border-laz-gold/45 bg-laz-cream/50 px-4 py-2.5 text-sm text-laz-forest placeholder:text-laz-muted/70 focus:border-laz-forest focus:outline-none focus:ring-2 focus:ring-laz-forest/15"
                    />
                    {errors.catatan_survei && (
                        <p className="mt-1 text-xs text-laz-danger">
                            {errors.catatan_survei}
                        </p>
                    )}
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
                        {processing ? 'Menyimpan…' : 'Simpan Berita Acara'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

export default function MustahikIndex({
    mustahik,
    asnafList,
    riwayatSurvei,
    filters,
}: MustahikIndexProps) {
    const { props } = usePage<SharedPageProps>();
    const flash = props.flash;
    const pageErrors = props.errors;

    const [modalDaftar, setModalDaftar] = useState(false);
    const [modalSurvei, setModalSurvei] = useState<MustahikRow | null>(null);

    const [localSearch, setLocalSearch] = useState(filters.search);
    const [localStatus, setLocalStatus] = useState(filters.status);
    const [localAsnaf, setLocalAsnaf] = useState(filters.id_asnaf);

    const applyFilters = () => {
        router.get(
            '/mustahik',
            {
                search: localSearch,
                status: localStatus,
                id_asnaf: localAsnaf,
            },
            { preserveState: true, replace: true },
        );
    };

    return (
        <DashboardLayout title="Mustahik">
            <Head title="Mustahik" />

            <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-laz-forest">
                            Mustahik & Survei Lapangan
                        </h1>
                        <p className="mt-1 text-sm text-laz-muted">
                            Pendataan calon penerima bantuan 8 asnaf dan berita
                            acara verifikasi lapangan.
                        </p>
                    </div>
                    <motion.button
                        type="button"
                        onClick={() => setModalDaftar(true)}
                        whileTap={{ scale: 0.97 }}
                        className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-button)] bg-laz-forest px-5 py-2.5 text-sm font-semibold text-laz-surface shadow-sm transition-colors hover:bg-laz-forest-hover"
                    >
                        <UserPlus className="h-4 w-4" aria-hidden="true" />
                        Daftar Mustahik Baru
                    </motion.button>
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
                            placeholder="Cari nama, NIK, kecamatan…"
                            className="min-h-11 w-full rounded-[var(--radius-button)] border border-laz-gold/45 bg-laz-cream/50 py-2.5 pl-9 pr-4 text-sm text-laz-forest placeholder:text-laz-muted/70 focus:border-laz-forest focus:outline-none focus:ring-2 focus:ring-laz-forest/15"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <Filter
                            className="h-4 w-4 text-laz-muted"
                            aria-hidden="true"
                        />
                        <select
                            aria-label="Filter status kelayakan"
                            value={localStatus}
                            onChange={(e) => setLocalStatus(e.target.value)}
                            className="min-h-11 rounded-[var(--radius-button)] border border-laz-gold/45 bg-laz-cream/50 px-3 py-2.5 text-sm text-laz-forest focus:border-laz-forest focus:outline-none focus:ring-2 focus:ring-laz-forest/15"
                        >
                            <option value="SEMUA">Semua Status</option>
                            <option value="BELUM_VERIFIKASI">
                                Belum Verifikasi
                            </option>
                            <option value="LAYAK">Layak</option>
                            <option value="TIDAK_LAYAK">Tidak Layak</option>
                            <option value="KEDALUWARSA">Kedaluwarsa</option>
                        </select>
                    </div>

                    <div>
                        <select
                            aria-label="Filter golongan asnaf"
                            value={localAsnaf}
                            onChange={(e) => setLocalAsnaf(e.target.value)}
                            className="min-h-11 rounded-[var(--radius-button)] border border-laz-gold/45 bg-laz-cream/50 px-3 py-2.5 text-sm text-laz-forest focus:border-laz-forest focus:outline-none focus:ring-2 focus:ring-laz-forest/15"
                        >
                            <option value="">Semua Asnaf</option>
                            {asnafList.map((a) => (
                                <option key={a.id_asnaf} value={a.id_asnaf}>
                                    {a.kode_asnaf} — {a.nama_asnaf}
                                </option>
                            ))}
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
                                        Nama / NIK
                                    </th>
                                    <th className="px-4 py-3 text-left font-semibold text-laz-forest">
                                        Asnaf
                                    </th>
                                    <th className="px-4 py-3 text-left font-semibold text-laz-forest">
                                        Kecamatan
                                    </th>
                                    <th className="px-4 py-3 text-left font-semibold text-laz-forest">
                                        Status
                                    </th>
                                    <th className="px-4 py-3 text-left font-semibold text-laz-forest">
                                        Berlaku s/d
                                    </th>
                                    <th className="px-4 py-3 text-left font-semibold text-laz-forest">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-laz-gold/20">
                                {mustahik.data.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="px-4 py-10 text-center text-laz-muted"
                                        >
                                            Tidak ada data mustahik sesuai
                                            filter.
                                        </td>
                                    </tr>
                                ) : (
                                    mustahik.data.map((m) => (
                                        <tr
                                            key={m.id_mustahik}
                                            className="transition-colors hover:bg-laz-cream/40"
                                        >
                                            <td className="px-4 py-3">
                                                <p className="font-semibold text-laz-forest">
                                                    {m.nama_lengkap}
                                                </p>
                                                <p className="mt-0.5 font-mono text-xs text-laz-muted">
                                                    {m.nik}
                                                </p>
                                            </td>
                                            <td className="px-4 py-3 text-laz-muted">
                                                {m.asnaf
                                                    ? `${m.asnaf.kode_asnaf} — ${m.asnaf.nama_asnaf}`
                                                    : '—'}
                                            </td>
                                            <td className="px-4 py-3 text-laz-muted">
                                                {m.alamat_kecamatan}
                                            </td>
                                            <td className="px-4 py-3">
                                                <StatusBadge
                                                    status={m.status_kelayakan}
                                                />
                                            </td>
                                            <td className="px-4 py-3 text-laz-muted">
                                                {m.tgl_kedaluwarsa
                                                    ? formatTanggalId(
                                                          m.tgl_kedaluwarsa,
                                                      )
                                                    : '—'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <motion.button
                                                    type="button"
                                                    onClick={() =>
                                                        setModalSurvei(m)
                                                    }
                                                    whileTap={{ scale: 0.97 }}
                                                    className="inline-flex min-h-11 items-center gap-1.5 rounded-[var(--radius-button)] border border-laz-gold/45 px-3.5 py-2 text-xs font-semibold text-laz-forest transition-colors hover:bg-laz-cream"
                                                >
                                                    <ClipboardCheck
                                                        className="h-4 w-4"
                                                        aria-hidden="true"
                                                    />
                                                    Survei
                                                </motion.button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {mustahik.last_page > 1 && (
                        <div className="flex items-center justify-between border-t border-laz-gold/25 px-5 py-4 text-xs text-laz-muted">
                            <span>
                                Halaman {mustahik.current_page} dari{' '}
                                {mustahik.last_page} (total {mustahik.total}{' '}
                                mustahik)
                            </span>
                            <div className="flex items-center gap-2">
                                {mustahik.prev_page_url && (
                                    <Link
                                        href={mustahik.prev_page_url}
                                        className="inline-flex min-h-11 items-center rounded-[var(--radius-button)] border border-laz-gold/40 bg-laz-cream px-4 font-semibold text-laz-forest"
                                    >
                                        Sebelumnya
                                    </Link>
                                )}
                                {mustahik.next_page_url && (
                                    <Link
                                        href={mustahik.next_page_url}
                                        className="inline-flex min-h-11 items-center rounded-[var(--radius-button)] border border-laz-gold/40 bg-laz-cream px-4 font-semibold text-laz-forest"
                                    >
                                        Berikutnya
                                    </Link>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="overflow-hidden rounded-[var(--radius-card)] border border-laz-gold/35 bg-laz-surface">
                    <div className="border-b border-laz-gold/25 px-6 py-4">
                        <h2 className="text-base font-bold text-laz-forest">
                            Riwayat Survei Terbaru
                        </h2>
                        <p className="mt-0.5 text-xs text-laz-muted">
                            15 berita acara survei terakhir dari{' '}
                            <span className="font-mono">
                                sp_verifikasi_mustahik
                            </span>
                        </p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-laz-gold/25 bg-laz-cream/60">
                                    <th className="px-4 py-3 text-left font-semibold text-laz-forest">
                                        Mustahik
                                    </th>
                                    <th className="px-4 py-3 text-left font-semibold text-laz-forest">
                                        Verifikator
                                    </th>
                                    <th className="px-4 py-3 text-left font-semibold text-laz-forest">
                                        Asnaf Rekom.
                                    </th>
                                    <th className="px-4 py-3 text-left font-semibold text-laz-forest">
                                        Tgl Survei
                                    </th>
                                    <th className="px-4 py-3 text-left font-semibold text-laz-forest">
                                        Skor
                                    </th>
                                    <th className="px-4 py-3 text-left font-semibold text-laz-forest">
                                        Hasil
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-laz-gold/20">
                                {riwayatSurvei.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="px-4 py-8 text-center text-laz-muted"
                                        >
                                            Belum ada survei yang dilakukan.
                                        </td>
                                    </tr>
                                ) : (
                                    riwayatSurvei.map((s) => (
                                        <tr
                                            key={s.id_survei}
                                            className="transition-colors hover:bg-laz-cream/40"
                                        >
                                            <td className="px-4 py-3">
                                                <p className="font-semibold text-laz-forest">
                                                    {s.mustahik?.nama_lengkap ??
                                                        '—'}
                                                </p>
                                                <p className="mt-0.5 font-mono text-xs text-laz-muted">
                                                    {s.mustahik?.nik ?? ''}
                                                </p>
                                            </td>
                                            <td className="px-4 py-3 text-laz-muted">
                                                {s.verifikator?.nama_lengkap ??
                                                    '—'}
                                            </td>
                                            <td className="px-4 py-3 text-laz-muted">
                                                {s.asnaf_rekomendasi
                                                    ? `${s.asnaf_rekomendasi.kode_asnaf} — ${s.asnaf_rekomendasi.nama_asnaf}`
                                                    : '—'}
                                            </td>
                                            <td className="px-4 py-3 text-laz-muted">
                                                {formatTanggalId(s.tgl_survei)}
                                            </td>
                                            <td className="px-4 py-3 font-mono font-semibold text-laz-forest">
                                                {s.skor_kelayakan}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                                        s.hasil_verifikasi ===
                                                        'LAYAK'
                                                            ? 'border border-laz-sage/40 bg-laz-sage/20 text-laz-forest'
                                                            : 'border border-laz-danger/35 bg-laz-danger/10 text-laz-danger'
                                                    }`}
                                                >
                                                    {s.hasil_verifikasi ===
                                                    'LAYAK'
                                                        ? 'Layak'
                                                        : 'Tidak Layak'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <ModalDaftarMustahik
                open={modalDaftar}
                onClose={() => setModalDaftar(false)}
                asnafList={asnafList}
            />
            <ModalSurvei
                open={modalSurvei !== null}
                onClose={() => setModalSurvei(null)}
                mustahik={modalSurvei}
                asnafList={asnafList}
            />
        </DashboardLayout>
    );
}
