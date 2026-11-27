import { type FormEventHandler, useEffect, useState } from 'react';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    AlertCircle,
    CheckCircle,
    Database,
    Landmark,
    Layers,
    Pencil,
    Plus,
    Power,
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
    JenisDana,
    KategoriInduk,
    Pengguna,
    PeranPengguna,
    Program,
    RekeningLembaga,
    SharedPageProps,
    StatusProgram,
} from '@/types/database';

type ProgramRow = Program & {
    jenis_dana?: Pick<
        JenisDana,
        'id_jenis_dana' | 'kode_dana' | 'nama_dana' | 'kategori_induk'
    >;
};

type JenisDanaRow = JenisDana & {
    parent?: Pick<JenisDana, 'id_jenis_dana' | 'kode_dana' | 'nama_dana'> | null;
    saldo?: { id_jenis_dana: number; saldo_aktif: string } | null;
};

interface MasterDataProps {
    programList: ProgramRow[];
    rekeningList: RekeningLembaga[];
    jenisDanaList: JenisDanaRow[];
    penggunaList: Pengguna[];
}

type ActiveTab = 'program' | 'rekening' | 'jenis_dana' | 'pengguna';

const TABS: {
    id: ActiveTab;
    label: string;
    icon: typeof Layers;
}[] = [
    { id: 'program', label: 'Program Penyaluran', icon: Layers },
    { id: 'rekening', label: 'Rekening Lembaga', icon: Landmark },
    { id: 'jenis_dana', label: 'Jenis Dana & Akad', icon: Database },
    { id: 'pengguna', label: 'Pengguna Internal', icon: Users },
];

const PERAN_LABELS: Record<PeranPengguna, string> = {
    admin_sistem: 'Admin Sistem',
    verifikator: 'Verifikator',
    petugas_penghimpunan: 'Petugas Penghimpunan',
    manajer_penyaluran: 'Manajer Penyaluran',
};

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
                                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-[var(--radius-button)] text-laz-muted hover:bg-laz-cream hover:text-laz-forest"
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

export default function MasterData({
    programList,
    rekeningList,
    jenisDanaList,
    penggunaList,
}: MasterDataProps) {
    const { props } = usePage<SharedPageProps>();
    const currentUser = props.auth.user;
    const flash = props.flash;
    const pageErrors = props.errors;

    const [activeTab, setActiveTab] = useState<ActiveTab>('program');
    const [programModalOpen, setProgramModalOpen] = useState(false);
    const [editingProgram, setEditingProgram] = useState<ProgramRow | null>(null);
    const [rekeningModalOpen, setRekeningModalOpen] = useState(false);
    const [penggunaModalOpen, setPenggunaModalOpen] = useState(false);

    const programForm = useForm<{
        id_jenis_dana: string;
        kode_program: string;
        nama_program: string;
        target_dana: string;
        tgl_mulai: string;
        tgl_selesai: string;
        status_program: StatusProgram;
    }>({
        id_jenis_dana: '',
        kode_program: '',
        nama_program: '',
        target_dana: '',
        tgl_mulai: new Date().toISOString().slice(0, 10),
        tgl_selesai: '',
        status_program: 'AKTIF',
    });

    const rekeningForm = useForm<{
        nomor_rekening: string;
        nama_bank: string;
        atas_nama: string;
        kategori_induk: KategoriInduk;
    }>({
        nomor_rekening: '',
        nama_bank: '',
        atas_nama: 'LAZ Amanah Madani Pekanbaru',
        kategori_induk: 'ZAKAT',
    });

    const penggunaForm = useForm<{
        nama_lengkap: string;
        username: string;
        password: string;
        peran: PeranPengguna;
        jabatan: string;
    }>({
        nama_lengkap: '',
        username: '',
        password: '',
        peran: 'petugas_penghimpunan',
        jabatan: '',
    });

    const openNewProgramModal = () => {
        setEditingProgram(null);
        programForm.reset();
        setProgramModalOpen(true);
    };

    const openEditProgramModal = (prog: ProgramRow) => {
        setEditingProgram(prog);
        programForm.setData({
            id_jenis_dana: String(prog.id_jenis_dana),
            kode_program: prog.kode_program,
            nama_program: prog.nama_program,
            target_dana: String(prog.target_dana),
            tgl_mulai: prog.tgl_mulai ? prog.tgl_mulai.slice(0, 10) : '',
            tgl_selesai: prog.tgl_selesai ? prog.tgl_selesai.slice(0, 10) : '',
            status_program: prog.status_program,
        });
        setProgramModalOpen(true);
    };

    const submitProgram: FormEventHandler = (e) => {
        e.preventDefault();
        if (editingProgram) {
            programForm.put(`/admin/program/${editingProgram.id_program}`, {
                onSuccess: () => setProgramModalOpen(false),
            });
        } else {
            programForm.post('/admin/program', {
                onSuccess: () => setProgramModalOpen(false),
            });
        }
    };

    const submitRekening: FormEventHandler = (e) => {
        e.preventDefault();
        rekeningForm.post('/admin/rekening', {
            onSuccess: () => {
                rekeningForm.reset();
                setRekeningModalOpen(false);
            },
        });
    };

    const submitPengguna: FormEventHandler = (e) => {
        e.preventDefault();
        penggunaForm.post('/admin/pengguna', {
            onSuccess: () => {
                penggunaForm.reset();
                setPenggunaModalOpen(false);
            },
        });
    };

    return (
        <DashboardLayout title="Master Data Lembaga">
            <Head title="Master Data Lembaga" />

            <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-laz-forest">
                            Master Data Lembaga
                        </h1>
                        <p className="mt-1 text-sm text-laz-muted">
                            Pengelolaan program penyaluran, rekening lembaga,
                            jenis dana, dan akun staf internal.
                        </p>
                    </div>
                    {activeTab === 'program' && (
                        <button
                            type="button"
                            onClick={openNewProgramModal}
                            className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-button)] bg-laz-forest px-5 py-2.5 text-sm font-semibold text-laz-surface hover:bg-laz-forest-hover"
                        >
                            <Plus className="h-4 w-4" aria-hidden="true" />
                            Tambah Program
                        </button>
                    )}
                    {activeTab === 'rekening' && (
                        <button
                            type="button"
                            onClick={() => setRekeningModalOpen(true)}
                            className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-button)] bg-laz-forest px-5 py-2.5 text-sm font-semibold text-laz-surface hover:bg-laz-forest-hover"
                        >
                            <Plus className="h-4 w-4" aria-hidden="true" />
                            Tambah Rekening
                        </button>
                    )}
                    {activeTab === 'pengguna' && (
                        <button
                            type="button"
                            onClick={() => setPenggunaModalOpen(true)}
                            className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-button)] bg-laz-forest px-5 py-2.5 text-sm font-semibold text-laz-surface hover:bg-laz-forest-hover"
                        >
                            <Plus className="h-4 w-4" aria-hidden="true" />
                            Tambah Pengguna
                        </button>
                    )}
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

                {/* Tab Navigation */}
                <div
                    role="tablist"
                    aria-label="Kategori master data"
                    className="flex flex-wrap gap-2 rounded-[var(--radius-card)] border border-laz-gold/35 bg-laz-surface p-2"
                >
                    {TABS.map((tab) => {
                        const Icon = tab.icon;
                        const active = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                role="tab"
                                aria-selected={active}
                                onClick={() => setActiveTab(tab.id)}
                                className={`relative inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-button)] px-4 py-2 text-sm font-semibold transition-colors ${
                                    active
                                        ? 'bg-laz-forest text-laz-surface'
                                        : 'text-laz-muted hover:bg-laz-cream hover:text-laz-forest'
                                }`}
                            >
                                <Icon className="h-4 w-4" aria-hidden="true" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Tab Panels */}
                {activeTab === 'program' && (
                    <div className="overflow-hidden rounded-[var(--radius-card)] border border-laz-gold/35 bg-laz-surface">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-laz-gold/25 bg-laz-cream/60">
                                        <th className="px-4 py-3 text-left font-semibold text-laz-forest">
                                            Kode / Nama Program
                                        </th>
                                        <th className="px-4 py-3 text-left font-semibold text-laz-forest">
                                            Jenis Dana
                                        </th>
                                        <th className="px-4 py-3 text-right font-semibold text-laz-forest">
                                            Target Dana
                                        </th>
                                        <th className="px-4 py-3 text-left font-semibold text-laz-forest">
                                            Periode
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
                                    {programList.map((p) => (
                                        <tr
                                            key={p.id_program}
                                            className="hover:bg-laz-cream/40"
                                        >
                                            <td className="px-4 py-3">
                                                <p className="font-mono text-xs font-semibold text-laz-muted">
                                                    {p.kode_program}
                                                </p>
                                                <p className="font-semibold text-laz-forest">
                                                    {p.nama_program}
                                                </p>
                                            </td>
                                            <td className="px-4 py-3 text-laz-muted">
                                                {p.jenis_dana?.nama_dana ?? '—'}
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono font-semibold text-laz-forest">
                                                {formatRupiah(p.target_dana)}
                                            </td>
                                            <td className="px-4 py-3 text-xs text-laz-muted">
                                                {formatTanggalId(p.tgl_mulai)}
                                                {p.tgl_selesai
                                                    ? ` s/d ${formatTanggalId(p.tgl_selesai)}`
                                                    : ''}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                                        p.status_program ===
                                                        'AKTIF'
                                                            ? 'border border-laz-sage/40 bg-laz-sage/20 text-laz-forest'
                                                            : 'border border-laz-muted/35 bg-laz-muted/15 text-laz-muted'
                                                    }`}
                                                >
                                                    {p.status_program}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        openEditProgramModal(p)
                                                    }
                                                    className="inline-flex min-h-11 items-center gap-1.5 rounded-[var(--radius-button)] border border-laz-gold/45 px-3 py-2 text-xs font-semibold text-laz-forest hover:bg-laz-cream"
                                                >
                                                    <Pencil
                                                        className="h-3.5 w-3.5"
                                                        aria-hidden="true"
                                                    />
                                                    Ubah
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'rekening' && (
                    <div className="overflow-hidden rounded-[var(--radius-card)] border border-laz-gold/35 bg-laz-surface">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-laz-gold/25 bg-laz-cream/60">
                                        <th className="px-4 py-3 text-left font-semibold text-laz-forest">
                                            Bank & No. Rekening
                                        </th>
                                        <th className="px-4 py-3 text-left font-semibold text-laz-forest">
                                            Atas Nama
                                        </th>
                                        <th className="px-4 py-3 text-left font-semibold text-laz-forest">
                                            Pilar Akad
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
                                    {rekeningList.map((r) => (
                                        <tr
                                            key={r.id_rekening}
                                            className="hover:bg-laz-cream/40"
                                        >
                                            <td className="px-4 py-3">
                                                <p className="font-semibold text-laz-forest">
                                                    {r.nama_bank}
                                                </p>
                                                <p className="font-mono text-xs text-laz-muted">
                                                    {r.nomor_rekening}
                                                </p>
                                            </td>
                                            <td className="px-4 py-3 text-laz-muted">
                                                {r.atas_nama}
                                            </td>
                                            <td className="px-4 py-3 text-laz-forest">
                                                {
                                                    KATEGORI_INDUK_LABELS[
                                                        r.kategori_induk
                                                    ]
                                                }
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                                        r.is_aktif
                                                            ? 'border border-laz-sage/40 bg-laz-sage/20 text-laz-forest'
                                                            : 'border border-laz-danger/35 bg-laz-danger/10 text-laz-danger'
                                                    }`}
                                                >
                                                    {r.is_aktif
                                                        ? 'Aktif'
                                                        : 'Nonaktif'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        router.patch(
                                                            `/admin/rekening/${r.id_rekening}/toggle`,
                                                            {},
                                                            {
                                                                preserveScroll: true,
                                                            },
                                                        )
                                                    }
                                                    className="inline-flex min-h-11 items-center gap-1.5 rounded-[var(--radius-button)] border border-laz-gold/45 px-3 py-2 text-xs font-semibold text-laz-forest hover:bg-laz-cream"
                                                >
                                                    <Power
                                                        className="h-3.5 w-3.5"
                                                        aria-hidden="true"
                                                    />
                                                    {r.is_aktif
                                                        ? 'Nonaktifkan'
                                                        : 'Aktifkan'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'jenis_dana' && (
                    <div className="overflow-hidden rounded-[var(--radius-card)] border border-laz-gold/35 bg-laz-surface">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-laz-gold/25 bg-laz-cream/60">
                                        <th className="px-4 py-3 text-left font-semibold text-laz-forest">
                                            Kode & Nama Dana
                                        </th>
                                        <th className="px-4 py-3 text-left font-semibold text-laz-forest">
                                            Pilar
                                        </th>
                                        <th className="px-4 py-3 text-left font-semibold text-laz-forest">
                                            Sifat
                                        </th>
                                        <th className="px-4 py-3 text-right font-semibold text-laz-forest">
                                            Saldo Aktif
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
                                    {jenisDanaList.map((jd) => (
                                        <tr
                                            key={jd.id_jenis_dana}
                                            className="hover:bg-laz-cream/40"
                                        >
                                            <td className="px-4 py-3">
                                                <p className="font-mono text-xs text-laz-muted">
                                                    {jd.kode_dana}
                                                </p>
                                                <p className="font-semibold text-laz-forest">
                                                    {jd.nama_dana}
                                                </p>
                                            </td>
                                            <td className="px-4 py-3 text-laz-muted">
                                                {
                                                    KATEGORI_INDUK_LABELS[
                                                        jd.kategori_induk
                                                    ]
                                                }
                                            </td>
                                            <td className="px-4 py-3 text-xs text-laz-muted">
                                                {jd.is_terikat
                                                    ? 'Terikat (Muqayyad)'
                                                    : 'Bebas (Mutlaq)'}
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono font-semibold text-laz-forest">
                                                {jd.saldo
                                                    ? formatRupiah(
                                                          jd.saldo.saldo_aktif,
                                                      )
                                                    : '—'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                                        jd.is_aktif
                                                            ? 'border border-laz-sage/40 bg-laz-sage/20 text-laz-forest'
                                                            : 'border border-laz-danger/35 bg-laz-danger/10 text-laz-danger'
                                                    }`}
                                                >
                                                    {jd.is_aktif
                                                        ? 'Aktif'
                                                        : 'Nonaktif'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        router.patch(
                                                            `/admin/jenis-dana/${jd.id_jenis_dana}/toggle`,
                                                            {},
                                                            {
                                                                preserveScroll: true,
                                                            },
                                                        )
                                                    }
                                                    className="inline-flex min-h-11 items-center gap-1.5 rounded-[var(--radius-button)] border border-laz-gold/45 px-3 py-2 text-xs font-semibold text-laz-forest hover:bg-laz-cream"
                                                >
                                                    <Power
                                                        className="h-3.5 w-3.5"
                                                        aria-hidden="true"
                                                    />
                                                    {jd.is_aktif
                                                        ? 'Nonaktifkan'
                                                        : 'Aktifkan'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'pengguna' && (
                    <div className="overflow-hidden rounded-[var(--radius-card)] border border-laz-gold/35 bg-laz-surface">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-laz-gold/25 bg-laz-cream/60">
                                        <th className="px-4 py-3 text-left font-semibold text-laz-forest">
                                            Nama & Username
                                        </th>
                                        <th className="px-4 py-3 text-left font-semibold text-laz-forest">
                                            Peran RBAC
                                        </th>
                                        <th className="px-4 py-3 text-left font-semibold text-laz-forest">
                                            Jabatan
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
                                    {penggunaList.map((u) => {
                                        const isSelf =
                                            currentUser?.id_pengguna ===
                                            u.id_pengguna;
                                        return (
                                            <tr
                                                key={u.id_pengguna}
                                                className="hover:bg-laz-cream/40"
                                            >
                                                <td className="px-4 py-3">
                                                    <p className="font-semibold text-laz-forest">
                                                        {u.nama_lengkap}
                                                    </p>
                                                    <p className="font-mono text-xs text-laz-muted">
                                                        @{u.username}
                                                    </p>
                                                </td>
                                                <td className="px-4 py-3 text-laz-forest">
                                                    {PERAN_LABELS[u.peran]}
                                                </td>
                                                <td className="px-4 py-3 text-laz-muted">
                                                    {u.jabatan}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span
                                                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                                            u.is_aktif
                                                                ? 'border border-laz-sage/40 bg-laz-sage/20 text-laz-forest'
                                                                : 'border border-laz-danger/35 bg-laz-danger/10 text-laz-danger'
                                                        }`}
                                                    >
                                                        {u.is_aktif
                                                            ? 'Aktif'
                                                            : 'Nonaktif'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <button
                                                        type="button"
                                                        disabled={isSelf}
                                                        onClick={() =>
                                                            router.patch(
                                                                `/admin/pengguna/${u.id_pengguna}/toggle`,
                                                                {},
                                                                {
                                                                    preserveScroll: true,
                                                                },
                                                            )
                                                        }
                                                        className="inline-flex min-h-11 items-center gap-1.5 rounded-[var(--radius-button)] border border-laz-gold/45 px-3 py-2 text-xs font-semibold text-laz-forest hover:bg-laz-cream disabled:opacity-50"
                                                    >
                                                        <Power
                                                            className="h-3.5 w-3.5"
                                                            aria-hidden="true"
                                                        />
                                                        {isSelf
                                                            ? 'Akun Aktif'
                                                            : u.is_aktif
                                                              ? 'Nonaktifkan'
                                                              : 'Aktifkan'}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal Tambah / Edit Program */}
            <Modal
                open={programModalOpen}
                onClose={() => setProgramModalOpen(false)}
                title={editingProgram ? 'Ubah Program' : 'Tambah Program Baru'}
                titleId="modal-program-title"
            >
                <form onSubmit={submitProgram} className="space-y-4">
                    {!editingProgram && (
                        <>
                            <div>
                                <label
                                    htmlFor="prog_kode"
                                    className="mb-1.5 block text-sm font-semibold text-laz-forest"
                                >
                                    Kode Program
                                </label>
                                <input
                                    id="prog_kode"
                                    type="text"
                                    maxLength={25}
                                    value={programForm.data.kode_program}
                                    onChange={(e) =>
                                        programForm.setData(
                                            'kode_program',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="PRG-ZKT-BARU"
                                    className="min-h-11 w-full rounded-[var(--radius-button)] border border-laz-gold/45 bg-laz-cream/50 px-4 py-2 font-mono text-sm text-laz-forest"
                                />
                                {programForm.errors.kode_program && (
                                    <p className="mt-1 text-xs text-laz-danger">
                                        {programForm.errors.kode_program}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label
                                    htmlFor="prog_dana"
                                    className="mb-1.5 block text-sm font-semibold text-laz-forest"
                                >
                                    Kantong Jenis Dana
                                </label>
                                <select
                                    id="prog_dana"
                                    value={programForm.data.id_jenis_dana}
                                    onChange={(e) =>
                                        programForm.setData(
                                            'id_jenis_dana',
                                            e.target.value,
                                        )
                                    }
                                    className="min-h-11 w-full rounded-[var(--radius-button)] border border-laz-gold/45 bg-laz-cream/50 px-4 py-2 text-sm text-laz-forest"
                                >
                                    <option value="">-- Pilih Dana --</option>
                                    {jenisDanaList
                                        .filter((j) => j.is_aktif)
                                        .map((j) => (
                                            <option
                                                key={j.id_jenis_dana}
                                                value={j.id_jenis_dana}
                                            >
                                                {j.kode_dana} — {j.nama_dana}
                                            </option>
                                        ))}
                                </select>
                                {programForm.errors.id_jenis_dana && (
                                    <p className="mt-1 text-xs text-laz-danger">
                                        {programForm.errors.id_jenis_dana}
                                    </p>
                                )}
                            </div>
                        </>
                    )}

                    <div>
                        <label
                            htmlFor="prog_nama"
                            className="mb-1.5 block text-sm font-semibold text-laz-forest"
                        >
                            Nama Program
                        </label>
                        <input
                            id="prog_nama"
                            type="text"
                            maxLength={120}
                            value={programForm.data.nama_program}
                            onChange={(e) =>
                                programForm.setData(
                                    'nama_program',
                                    e.target.value,
                                )
                            }
                            className="min-h-11 w-full rounded-[var(--radius-button)] border border-laz-gold/45 bg-laz-cream/50 px-4 py-2 text-sm text-laz-forest"
                        />
                        {programForm.errors.nama_program && (
                            <p className="mt-1 text-xs text-laz-danger">
                                {programForm.errors.nama_program}
                            </p>
                        )}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label
                                htmlFor="prog_target"
                                className="mb-1.5 block text-sm font-semibold text-laz-forest"
                            >
                                Target Dana (Rp)
                            </label>
                            <input
                                id="prog_target"
                                type="number"
                                min={0}
                                value={programForm.data.target_dana}
                                onChange={(e) =>
                                    programForm.setData(
                                        'target_dana',
                                        e.target.value,
                                    )
                                }
                                className="min-h-11 w-full rounded-[var(--radius-button)] border border-laz-gold/45 bg-laz-cream/50 px-4 py-2 font-mono text-sm text-laz-forest"
                            />
                        </div>
                        <div>
                            <label
                                htmlFor="prog_status"
                                className="mb-1.5 block text-sm font-semibold text-laz-forest"
                            >
                                Status
                            </label>
                            <select
                                id="prog_status"
                                value={programForm.data.status_program}
                                onChange={(e) =>
                                    programForm.setData(
                                        'status_program',
                                        e.target.value as StatusProgram,
                                    )
                                }
                                className="min-h-11 w-full rounded-[var(--radius-button)] border border-laz-gold/45 bg-laz-cream/50 px-4 py-2 text-sm text-laz-forest"
                            >
                                <option value="AKTIF">AKTIF</option>
                                <option value="SELESAI">SELESAI</option>
                                <option value="DITUTUP">DITUTUP</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        {!editingProgram && (
                            <div>
                                <label
                                    htmlFor="prog_mulai"
                                    className="mb-1.5 block text-sm font-semibold text-laz-forest"
                                >
                                    Tanggal Mulai
                                </label>
                                <input
                                    id="prog_mulai"
                                    type="date"
                                    value={programForm.data.tgl_mulai}
                                    onChange={(e) =>
                                        programForm.setData(
                                            'tgl_mulai',
                                            e.target.value,
                                        )
                                    }
                                    className="min-h-11 w-full rounded-[var(--radius-button)] border border-laz-gold/45 bg-laz-cream/50 px-4 py-2 text-sm text-laz-forest"
                                />
                            </div>
                        )}
                        <div>
                            <label
                                htmlFor="prog_selesai"
                                className="mb-1.5 block text-sm font-semibold text-laz-forest"
                            >
                                Tanggal Selesai (opsional)
                            </label>
                            <input
                                id="prog_selesai"
                                type="date"
                                value={programForm.data.tgl_selesai}
                                onChange={(e) =>
                                    programForm.setData(
                                        'tgl_selesai',
                                        e.target.value,
                                    )
                                }
                                className="min-h-11 w-full rounded-[var(--radius-button)] border border-laz-gold/45 bg-laz-cream/50 px-4 py-2 text-sm text-laz-forest"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => setProgramModalOpen(false)}
                            className="min-h-11 rounded-[var(--radius-button)] border border-laz-gold/45 px-5 py-2 text-sm font-semibold text-laz-muted"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={programForm.processing}
                            className="min-h-11 rounded-[var(--radius-button)] bg-laz-forest px-5 py-2 text-sm font-semibold text-laz-surface"
                        >
                            Simpan
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Modal Tambah Rekening */}
            <Modal
                open={rekeningModalOpen}
                onClose={() => setRekeningModalOpen(false)}
                title="Tambah Rekening Lembaga"
                titleId="modal-rekening-title"
            >
                <form onSubmit={submitRekening} className="space-y-4">
                    <div>
                        <label
                            htmlFor="rek_bank"
                            className="mb-1.5 block text-sm font-semibold text-laz-forest"
                        >
                            Nama Bank
                        </label>
                        <input
                            id="rek_bank"
                            type="text"
                            value={rekeningForm.data.nama_bank}
                            onChange={(e) =>
                                rekeningForm.setData(
                                    'nama_bank',
                                    e.target.value,
                                )
                            }
                            placeholder="BSI / BRK Syariah"
                            className="min-h-11 w-full rounded-[var(--radius-button)] border border-laz-gold/45 bg-laz-cream/50 px-4 py-2 text-sm text-laz-forest"
                        />
                        {rekeningForm.errors.nama_bank && (
                            <p className="mt-1 text-xs text-laz-danger">
                                {rekeningForm.errors.nama_bank}
                            </p>
                        )}
                    </div>
                    <div>
                        <label
                            htmlFor="rek_nomor"
                            className="mb-1.5 block text-sm font-semibold text-laz-forest"
                        >
                            Nomor Rekening
                        </label>
                        <input
                            id="rek_nomor"
                            type="text"
                            value={rekeningForm.data.nomor_rekening}
                            onChange={(e) =>
                                rekeningForm.setData(
                                    'nomor_rekening',
                                    e.target.value,
                                )
                            }
                            className="min-h-11 w-full rounded-[var(--radius-button)] border border-laz-gold/45 bg-laz-cream/50 px-4 py-2 font-mono text-sm text-laz-forest"
                        />
                        {rekeningForm.errors.nomor_rekening && (
                            <p className="mt-1 text-xs text-laz-danger">
                                {rekeningForm.errors.nomor_rekening}
                            </p>
                        )}
                    </div>
                    <div>
                        <label
                            htmlFor="rek_atas_nama"
                            className="mb-1.5 block text-sm font-semibold text-laz-forest"
                        >
                            Atas Nama
                        </label>
                        <input
                            id="rek_atas_nama"
                            type="text"
                            value={rekeningForm.data.atas_nama}
                            onChange={(e) =>
                                rekeningForm.setData(
                                    'atas_nama',
                                    e.target.value,
                                )
                            }
                            className="min-h-11 w-full rounded-[var(--radius-button)] border border-laz-gold/45 bg-laz-cream/50 px-4 py-2 text-sm text-laz-forest"
                        />
                    </div>
                    <div>
                        <label
                            htmlFor="rek_kategori"
                            className="mb-1.5 block text-sm font-semibold text-laz-forest"
                        >
                            Pilar Akad
                        </label>
                        <select
                            id="rek_kategori"
                            value={rekeningForm.data.kategori_induk}
                            onChange={(e) =>
                                rekeningForm.setData(
                                    'kategori_induk',
                                    e.target.value as KategoriInduk,
                                )
                            }
                            className="min-h-11 w-full rounded-[var(--radius-button)] border border-laz-gold/45 bg-laz-cream/50 px-4 py-2 text-sm text-laz-forest"
                        >
                            <option value="ZAKAT">Zakat</option>
                            <option value="INFAK_SEDEKAH">
                                Infak & Sedekah
                            </option>
                            <option value="WAKAF">Wakaf</option>
                        </select>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => setRekeningModalOpen(false)}
                            className="min-h-11 rounded-[var(--radius-button)] border border-laz-gold/45 px-5 py-2 text-sm font-semibold text-laz-muted"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={rekeningForm.processing}
                            className="min-h-11 rounded-[var(--radius-button)] bg-laz-forest px-5 py-2 text-sm font-semibold text-laz-surface"
                        >
                            Simpan Rekening
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Modal Tambah Pengguna */}
            <Modal
                open={penggunaModalOpen}
                onClose={() => setPenggunaModalOpen(false)}
                title="Tambah Pengguna Internal"
                titleId="modal-pengguna-title"
            >
                <form onSubmit={submitPengguna} className="space-y-4">
                    <div>
                        <label
                            htmlFor="usr_nama"
                            className="mb-1.5 block text-sm font-semibold text-laz-forest"
                        >
                            Nama Lengkap
                        </label>
                        <input
                            id="usr_nama"
                            type="text"
                            value={penggunaForm.data.nama_lengkap}
                            onChange={(e) =>
                                penggunaForm.setData(
                                    'nama_lengkap',
                                    e.target.value,
                                )
                            }
                            className="min-h-11 w-full rounded-[var(--radius-button)] border border-laz-gold/45 bg-laz-cream/50 px-4 py-2 text-sm text-laz-forest"
                        />
                        {penggunaForm.errors.nama_lengkap && (
                            <p className="mt-1 text-xs text-laz-danger">
                                {penggunaForm.errors.nama_lengkap}
                            </p>
                        )}
                    </div>
                    <div>
                        <label
                            htmlFor="usr_username"
                            className="mb-1.5 block text-sm font-semibold text-laz-forest"
                        >
                            Username
                        </label>
                        <input
                            id="usr_username"
                            type="text"
                            value={penggunaForm.data.username}
                            onChange={(e) =>
                                penggunaForm.setData('username', e.target.value)
                            }
                            className="min-h-11 w-full rounded-[var(--radius-button)] border border-laz-gold/45 bg-laz-cream/50 px-4 py-2 font-mono text-sm text-laz-forest"
                        />
                        {penggunaForm.errors.username && (
                            <p className="mt-1 text-xs text-laz-danger">
                                {penggunaForm.errors.username}
                            </p>
                        )}
                    </div>
                    <div>
                        <label
                            htmlFor="usr_password"
                            className="mb-1.5 block text-sm font-semibold text-laz-forest"
                        >
                            Password Awal (opsional)
                        </label>
                        <input
                            id="usr_password"
                            type="password"
                            value={penggunaForm.data.password}
                            onChange={(e) =>
                                penggunaForm.setData('password', e.target.value)
                            }
                            placeholder="Kosongkan untuk default <nama>123"
                            className="min-h-11 w-full rounded-[var(--radius-button)] border border-laz-gold/45 bg-laz-cream/50 px-4 py-2 text-sm text-laz-forest"
                        />
                        {penggunaForm.errors.password && (
                            <p className="mt-1 text-xs text-laz-danger">
                                {penggunaForm.errors.password}
                            </p>
                        )}
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label
                                htmlFor="usr_peran"
                                className="mb-1.5 block text-sm font-semibold text-laz-forest"
                            >
                                Peran RBAC
                            </label>
                            <select
                                id="usr_peran"
                                value={penggunaForm.data.peran}
                                onChange={(e) =>
                                    penggunaForm.setData(
                                        'peran',
                                        e.target.value as PeranPengguna,
                                    )
                                }
                                className="min-h-11 w-full rounded-[var(--radius-button)] border border-laz-gold/45 bg-laz-cream/50 px-4 py-2 text-sm text-laz-forest"
                            >
                                <option value="petugas_penghimpunan">
                                    Petugas Penghimpunan
                                </option>
                                <option value="verifikator">Verifikator</option>
                                <option value="manajer_penyaluran">
                                    Manajer Penyaluran
                                </option>
                                <option value="admin_sistem">
                                    Admin Sistem
                                </option>
                            </select>
                        </div>
                        <div>
                            <label
                                htmlFor="usr_jabatan"
                                className="mb-1.5 block text-sm font-semibold text-laz-forest"
                            >
                                Jabatan
                            </label>
                            <input
                                id="usr_jabatan"
                                type="text"
                                value={penggunaForm.data.jabatan}
                                onChange={(e) =>
                                    penggunaForm.setData(
                                        'jabatan',
                                        e.target.value,
                                    )
                                }
                                className="min-h-11 w-full rounded-[var(--radius-button)] border border-laz-gold/45 bg-laz-cream/50 px-4 py-2 text-sm text-laz-forest"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => setPenggunaModalOpen(false)}
                            className="min-h-11 rounded-[var(--radius-button)] border border-laz-gold/45 px-5 py-2 text-sm font-semibold text-laz-muted"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={penggunaForm.processing}
                            className="min-h-11 rounded-[var(--radius-button)] bg-laz-forest px-5 py-2 text-sm font-semibold text-laz-surface"
                        >
                            Simpan Pengguna
                        </button>
                    </div>
                </form>
            </Modal>
        </DashboardLayout>
    );
}
