import { Link, router, useForm, usePage } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { type FormEvent, useEffect, useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import type { Muzaki, Paginator, SharedPageProps, TipeMuzaki } from '@/types/database';

interface MuzakiIndexProps {
    muzaki: Paginator<Muzaki>;
    filters: {
        search: string;
        tipe: string;
    };
}

export default function MuzakiIndex({ muzaki, filters }: MuzakiIndexProps) {
    const { flash, errors: pageErrors } = usePage<SharedPageProps>().props;

    const [search, setSearch] = useState(filters.search);
    const [tipeFilter, setTipeFilter] = useState(filters.tipe || 'SEMUA');
    const [modalOpen, setModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Muzaki | null>(null);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        kode_muzaki: '',
        nama_muzaki: '',
        tipe_muzaki: 'PERORANGAN' as TipeMuzaki,
        nik_npwp: '',
        no_hp: '',
        alamat: '',
    });

    useEffect(() => {
        if (!modalOpen) {
            return;
        }
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setModalOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [modalOpen]);

    const applyFilter = (nextSearch: string, nextTipe: string) => {
        router.get(
            '/muzaki',
            { search: nextSearch, tipe: nextTipe },
            { preserveState: true, replace: true },
        );
    };

    const openCreateModal = () => {
        setEditingItem(null);
        clearErrors();
        reset();
        setModalOpen(true);
    };

    const openEditModal = (item: Muzaki) => {
        setEditingItem(item);
        clearErrors();
        setData({
            kode_muzaki: item.kode_muzaki,
            nama_muzaki: item.nama_muzaki,
            tipe_muzaki: item.tipe_muzaki,
            nik_npwp: item.nik_npwp ?? '',
            no_hp: item.no_hp ?? '',
            alamat: item.alamat ?? '',
        });
        setModalOpen(true);
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (editingItem) {
            put(`/muzaki/${editingItem.id_muzaki}`, {
                onSuccess: () => setModalOpen(false),
            });
            return;
        }
        post('/muzaki', {
            onSuccess: () => setModalOpen(false),
        });
    };

    const handleDelete = (item: Muzaki) => {
        if (!window.confirm(`Hapus data muzaki "${item.nama_muzaki}"?`)) {
            return;
        }
        router.delete(`/muzaki/${item.id_muzaki}`, {
            preserveScroll: true,
        });
    };

    return (
        <DashboardLayout title="Data Muzaki">
            <div className="space-y-6">
                {flash.success && (
                    <div
                        role="status"
                        className="flex items-start gap-2.5 p-4 rounded-[var(--radius-button)] bg-laz-sage/15 border border-laz-sage/40 text-laz-forest text-sm"
                    >
                        <CheckCircle2 className="w-4 h-4 mt-0.5 text-laz-sage shrink-0" aria-hidden="true" />
                        <span>{flash.success}</span>
                    </div>
                )}

                {pageErrors.db_error && (
                    <div
                        role="alert"
                        className="flex items-start gap-2.5 p-4 rounded-[var(--radius-button)] bg-laz-danger/10 border border-laz-danger/35 text-laz-danger text-sm"
                    >
                        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
                        <span>{pageErrors.db_error}</span>
                    </div>
                )}

                {/* Filter & Tambah */}
                <div className="bg-laz-surface rounded-[var(--radius-card)] border border-laz-gold/35 p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            applyFilter(search, tipeFilter);
                        }}
                        className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1"
                    >
                        <div className="relative flex-1 max-w-md">
                            <Search
                                className="w-4 h-4 text-laz-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                                aria-hidden="true"
                            />
                            <input
                                type="search"
                                aria-label="Cari nama, kode, atau NIK/NPWP muzaki"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari nama, kode, atau NIK/NPWP..."
                                className="w-full min-h-11 pl-10 pr-3.5 py-2 rounded-[var(--radius-button)] border border-laz-gold/50 bg-laz-surface text-sm text-laz-forest focus:border-laz-forest focus:outline-none"
                            />
                        </div>

                        <select
                            aria-label="Filter tipe muzaki"
                            value={tipeFilter}
                            onChange={(e) => {
                                setTipeFilter(e.target.value);
                                applyFilter(search, e.target.value);
                            }}
                            className="min-h-11 px-3.5 py-2 rounded-[var(--radius-button)] border border-laz-gold/50 bg-laz-surface text-sm font-medium text-laz-forest focus:border-laz-forest focus:outline-none"
                        >
                            <option value="SEMUA">Semua Tipe</option>
                            <option value="PERORANGAN">Perorangan (NIK)</option>
                            <option value="LEMBAGA">Lembaga (NPWP)</option>
                        </select>

                        <button
                            type="submit"
                            className="min-h-11 px-4 py-2 rounded-[var(--radius-button)] border border-laz-gold/50 bg-laz-cream hover:bg-laz-gold/25 text-sm font-semibold text-laz-forest transition-colors"
                        >
                            Cari
                        </button>
                    </form>

                    <button
                        type="button"
                        onClick={openCreateModal}
                        className="min-h-11 px-5 py-2.5 rounded-[var(--radius-button)] bg-laz-forest hover:bg-laz-forest-hover text-laz-surface text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors"
                    >
                        <Plus className="w-4 h-4" aria-hidden="true" />
                        <span>Tambah Muzaki</span>
                    </button>
                </div>

                {/* Tabel Muzaki */}
                <div className="bg-laz-surface rounded-[var(--radius-card)] border border-laz-gold/35 overflow-hidden">
                    {muzaki.data.length === 0 ? (
                        <div className="p-8 text-center text-sm text-laz-muted">
                            Tidak ada data muzaki yang sesuai dengan pencarian Anda.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-sm">
                                <thead>
                                    <tr className="bg-laz-cream/70 border-b border-laz-gold/30 text-xs font-semibold uppercase tracking-wider text-laz-muted">
                                        <th className="py-3.5 px-5">Kode &amp; Nama Muzaki</th>
                                        <th className="py-3.5 px-5">Tipe</th>
                                        <th className="py-3.5 px-5">NIK / NPWP</th>
                                        <th className="py-3.5 px-5">Kontak &amp; Alamat</th>
                                        <th className="py-3.5 px-5 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-laz-gold/20">
                                    {muzaki.data.map((item) => (
                                        <tr
                                            key={item.id_muzaki}
                                            className="hover:bg-laz-cream/50 transition-colors"
                                        >
                                            <td className="py-4 px-5">
                                                <p className="font-semibold text-laz-forest">
                                                    {item.nama_muzaki}
                                                </p>
                                                <p className="text-xs font-mono text-laz-muted mt-0.5">
                                                    {item.kode_muzaki}
                                                </p>
                                            </td>
                                            <td className="py-4 px-5 whitespace-nowrap">
                                                <span className="px-2.5 py-1 rounded-[var(--radius-badge)] bg-laz-cream border border-laz-gold/40 text-xs font-semibold text-laz-forest">
                                                    {item.tipe_muzaki}
                                                </span>
                                            </td>
                                            <td className="py-4 px-5 whitespace-nowrap font-mono tabular-nums text-xs text-laz-forest">
                                                {item.nik_npwp ?? '-'}
                                            </td>
                                            <td className="py-4 px-5 max-w-xs">
                                                <p className="text-xs font-mono text-laz-forest">
                                                    {item.no_hp ?? '-'}
                                                </p>
                                                <p className="text-xs text-laz-muted truncate mt-0.5">
                                                    {item.alamat ?? '-'}
                                                </p>
                                            </td>
                                            <td className="py-4 px-5 whitespace-nowrap text-right">
                                                <div className="inline-flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => openEditModal(item)}
                                                        aria-label={`Edit ${item.nama_muzaki}`}
                                                        className="min-h-11 min-w-11 px-3 inline-flex items-center justify-center rounded-[var(--radius-button)] border border-laz-gold/40 hover:bg-laz-cream text-laz-forest"
                                                    >
                                                        <Pencil className="w-4 h-4" aria-hidden="true" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(item)}
                                                        aria-label={`Hapus ${item.nama_muzaki}`}
                                                        className="min-h-11 min-w-11 px-3 inline-flex items-center justify-center rounded-[var(--radius-button)] border border-laz-danger/35 hover:bg-laz-danger/10 text-laz-danger"
                                                    >
                                                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {muzaki.last_page > 1 && (
                        <div className="px-5 py-4 border-t border-laz-gold/25 flex items-center justify-between text-xs text-laz-muted">
                            <span>
                                Halaman {muzaki.current_page} dari {muzaki.last_page} (total {muzaki.total} muzaki)
                            </span>
                            <div className="flex items-center gap-2">
                                {muzaki.prev_page_url && (
                                    <Link
                                        href={muzaki.prev_page_url}
                                        className="min-h-11 px-4 inline-flex items-center rounded-[var(--radius-button)] border border-laz-gold/40 bg-laz-cream text-laz-forest font-semibold"
                                    >
                                        Sebelumnya
                                    </Link>
                                )}
                                {muzaki.next_page_url && (
                                    <Link
                                        href={muzaki.next_page_url}
                                        className="min-h-11 px-4 inline-flex items-center rounded-[var(--radius-button)] border border-laz-gold/40 bg-laz-cream text-laz-forest font-semibold"
                                    >
                                        Berikutnya
                                    </Link>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Tambah / Edit Muzaki */}
            <AnimatePresence>
                {modalOpen && (
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="muzaki-modal-title"
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setModalOpen(false)}
                            className="fixed inset-0 bg-laz-forest/55"
                        />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.97, y: 8 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.97, y: 8 }}
                            transition={{ duration: 0.2 }}
                            className="relative z-10 w-full max-w-lg bg-laz-surface rounded-[var(--radius-card)] border border-laz-gold/40 p-6 shadow-xl space-y-5"
                        >
                            <div className="flex items-center justify-between pb-3 border-b border-laz-gold/25">
                                <h3 id="muzaki-modal-title" className="text-lg font-bold text-laz-forest">
                                    {editingItem ? 'Edit Data Muzaki' : 'Tambah Muzaki Baru'}
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => setModalOpen(false)}
                                    aria-label="Tutup modal muzaki"
                                    className="min-h-11 min-w-11 flex items-center justify-center rounded-[var(--radius-button)] text-laz-forest hover:bg-laz-cream"
                                >
                                    <X className="w-5 h-5" aria-hidden="true" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label htmlFor="tipe_muzaki" className="block text-sm font-medium text-laz-forest mb-1">
                                        Tipe Muzaki
                                    </label>
                                    <select
                                        id="tipe_muzaki"
                                        value={data.tipe_muzaki}
                                        onChange={(e) => setData('tipe_muzaki', e.target.value as TipeMuzaki)}
                                        className="w-full min-h-11 px-3.5 py-2 rounded-[var(--radius-button)] border border-laz-gold/50 bg-laz-surface text-sm text-laz-forest focus:border-laz-forest focus:outline-none"
                                    >
                                        <option value="PERORANGAN">Perorangan (NIK 16 Digit)</option>
                                        <option value="LEMBAGA">Lembaga / Perusahaan (NPWP)</option>
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="nama_muzaki" className="block text-sm font-medium text-laz-forest mb-1">
                                        Nama Lengkap / Nama Lembaga
                                    </label>
                                    <input
                                        id="nama_muzaki"
                                        type="text"
                                        required
                                        value={data.nama_muzaki}
                                        onChange={(e) => setData('nama_muzaki', e.target.value)}
                                        placeholder={data.tipe_muzaki === 'PERORANGAN' ? 'Nama lengkap sesuai KTP' : 'Nama perusahaan atau instansi'}
                                        className="w-full min-h-11 px-3.5 py-2 rounded-[var(--radius-button)] border border-laz-gold/50 bg-laz-surface text-sm text-laz-forest focus:border-laz-forest focus:outline-none"
                                    />
                                    {errors.nama_muzaki && (
                                        <p className="mt-1 text-xs text-laz-danger">{errors.nama_muzaki}</p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="nik_npwp" className="block text-sm font-medium text-laz-forest mb-1">
                                        {data.tipe_muzaki === 'PERORANGAN' ? 'NIK (16 Digit)' : 'NPWP Lembaga'}
                                    </label>
                                    <input
                                        id="nik_npwp"
                                        type="text"
                                        required
                                        value={data.nik_npwp}
                                        onChange={(e) => setData('nik_npwp', e.target.value)}
                                        placeholder={data.tipe_muzaki === 'PERORANGAN' ? '1471010101900001' : '01.234.567.8-211.000'}
                                        className="w-full min-h-11 px-3.5 py-2 rounded-[var(--radius-button)] border border-laz-gold/50 bg-laz-surface font-mono text-sm text-laz-forest focus:border-laz-forest focus:outline-none"
                                    />
                                    {errors.nik_npwp && (
                                        <p className="mt-1 text-xs text-laz-danger">{errors.nik_npwp}</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="no_hp" className="block text-sm font-medium text-laz-forest mb-1">
                                            Nomor HP
                                        </label>
                                        <input
                                            id="no_hp"
                                            type="text"
                                            value={data.no_hp}
                                            onChange={(e) => setData('no_hp', e.target.value)}
                                            placeholder="0812xxxxxxxx"
                                            className="w-full min-h-11 px-3.5 py-2 rounded-[var(--radius-button)] border border-laz-gold/50 bg-laz-surface font-mono text-sm text-laz-forest focus:border-laz-forest focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="alamat" className="block text-sm font-medium text-laz-forest mb-1">
                                            Alamat Pekanbaru
                                        </label>
                                        <input
                                            id="alamat"
                                            type="text"
                                            value={data.alamat}
                                            onChange={(e) => setData('alamat', e.target.value)}
                                            placeholder="Jl. Sudirman, Pekanbaru"
                                            className="w-full min-h-11 px-3.5 py-2 rounded-[var(--radius-button)] border border-laz-gold/50 bg-laz-surface text-sm text-laz-forest focus:border-laz-forest focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="pt-3 flex items-center justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setModalOpen(false)}
                                        className="min-h-11 px-4 py-2 rounded-[var(--radius-button)] border border-laz-gold/50 bg-laz-cream text-sm font-semibold text-laz-forest"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="min-h-11 px-5 py-2 rounded-[var(--radius-button)] bg-laz-forest hover:bg-laz-forest-hover disabled:opacity-60 text-laz-surface text-sm font-semibold"
                                    >
                                        {processing ? 'Menyimpan...' : 'Simpan Data'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </DashboardLayout>
    );
}
