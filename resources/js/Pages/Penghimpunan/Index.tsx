import { Link, useForm, usePage } from '@inertiajs/react';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { type FormEvent, useMemo } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { formatRupiah, formatTanggalId, KATEGORI_INDUK_LABELS } from '@/lib/formatters';
import type {
    JenisDana,
    KategoriInduk,
    MetodeBayar,
    Muzaki,
    Paginator,
    Pengguna,
    Penghimpunan,
    RekeningLembaga,
    SharedPageProps,
} from '@/types/database';

interface PenghimpunanRow extends Penghimpunan {
    muzaki?: Pick<Muzaki, 'id_muzaki' | 'kode_muzaki' | 'nama_muzaki' | 'tipe_muzaki'>;
    jenis_dana?: Pick<JenisDana, 'id_jenis_dana' | 'kode_dana' | 'nama_dana' | 'kategori_induk'>;
    rekening?: Pick<RekeningLembaga, 'id_rekening' | 'nomor_rekening' | 'nama_bank' | 'kategori_induk'>;
    petugas?: Pick<Pengguna, 'id_pengguna' | 'nama_lengkap'>;
}

interface PenghimpunanIndexProps {
    riwayat: Paginator<PenghimpunanRow>;
    muzakiOptions: Pick<Muzaki, 'id_muzaki' | 'kode_muzaki' | 'nama_muzaki' | 'tipe_muzaki' | 'nik_npwp'>[];
    jenisDanaList: Pick<JenisDana, 'id_jenis_dana' | 'kode_dana' | 'nama_dana' | 'kategori_induk' | 'is_terikat'>[];
    rekeningList: Pick<RekeningLembaga, 'id_rekening' | 'nomor_rekening' | 'nama_bank' | 'atas_nama' | 'kategori_induk'>[];
    suggestedReceipt: string;
}

const METODE_OPTIONS: { value: MetodeBayar; label: string }[] = [
    { value: 'TRANSFER_BANK', label: 'Transfer Bank Syariah' },
    { value: 'TUNAI', label: 'Tunai Gerai' },
    { value: 'QRIS', label: 'QRIS Lembaga' },
    { value: 'POTONG_GAJI', label: 'Potong Gaji Mitra' },
];

function getLocalDatetimeDefault(): string {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - offset).toISOString().slice(0, 16);
}

export default function PenghimpunanIndex({
    riwayat,
    muzakiOptions,
    jenisDanaList,
    rekeningList,
    suggestedReceipt,
}: PenghimpunanIndexProps) {
    const { flash, errors: pageErrors } = usePage<SharedPageProps>().props;

    const { data, setData, post, processing, errors } = useForm({
        nomor_kuitansi: suggestedReceipt,
        id_muzaki: muzakiOptions[0]?.id_muzaki ? String(muzakiOptions[0].id_muzaki) : '',
        id_jenis_dana: '',
        id_rekening: '',
        tgl_setor: getLocalDatetimeDefault(),
        nominal: '',
        metode_bayar: 'TRANSFER_BANK' as MetodeBayar,
    });

    const selectedJenisDana = useMemo(
        () => jenisDanaList.find((j) => String(j.id_jenis_dana) === data.id_jenis_dana) ?? null,
        [jenisDanaList, data.id_jenis_dana],
    );

    const filteredRekening = useMemo(() => {
        if (!selectedJenisDana) {
            return [];
        }
        return rekeningList.filter(
            (rek) => rek.kategori_induk === selectedJenisDana.kategori_induk,
        );
    }, [rekeningList, selectedJenisDana]);

    const handleJenisDanaChange = (nextJenisId: string) => {
        const nextJenis = jenisDanaList.find((j) => String(j.id_jenis_dana) === nextJenisId);
        const matchingRekening = nextJenis
            ? rekeningList.filter((r) => r.kategori_induk === nextJenis.kategori_induk)
            : [];

        setData((prev) => ({
            ...prev,
            id_jenis_dana: nextJenisId,
            id_rekening: matchingRekening[0] ? String(matchingRekening[0].id_rekening) : '',
        }));
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        post('/penghimpunan', {
            preserveScroll: true,
        });
    };

    const dbError = pageErrors.db_error;

    return (
        <DashboardLayout title="Penghimpunan">
            <div className="space-y-8">
                {flash.success && (
                    <div
                        role="status"
                        className="flex items-start gap-2.5 p-4 rounded-[var(--radius-button)] bg-laz-sage/15 border border-laz-sage/40 text-laz-forest text-sm"
                    >
                        <CheckCircle2 className="w-4 h-4 mt-0.5 text-laz-sage shrink-0" aria-hidden="true" />
                        <span>{flash.success}</span>
                    </div>
                )}

                {dbError && (
                    <div
                        role="alert"
                        className="flex items-start gap-2.5 p-4 rounded-[var(--radius-button)] bg-laz-danger/10 border border-laz-danger/35 text-laz-danger text-sm"
                    >
                        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
                        <div>
                            <p className="font-semibold">Penolakan Validasi Basis Data (SQLSTATE)</p>
                            <p className="mt-0.5">{dbError}</p>
                        </div>
                    </div>
                )}

                {/* Form Pencatatan via sp_catat_penghimpunan */}
                <section
                    aria-labelledby="form-penghimpunan-heading"
                    className="bg-laz-surface rounded-[var(--radius-card)] border border-laz-gold/35 p-6 sm:p-8"
                >
                    <div className="pb-5 border-b border-laz-gold/25 flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <h3 id="form-penghimpunan-heading" className="text-lg font-bold text-laz-forest">
                                Formulir Setoran Masuk
                            </h3>
                            <p className="mt-1 text-sm text-laz-muted">
                                Mencatat transaksi masuk, memperbarui saldo kantong dana, dan membuat jurnal mutasi kas secara otomatis.
                            </p>
                        </div>
                        <Link
                            href="/muzaki"
                            className="min-h-11 px-4 py-2 rounded-[var(--radius-button)] border border-laz-gold/50 bg-laz-cream hover:bg-laz-gold/25 text-xs font-semibold text-laz-forest inline-flex items-center"
                        >
                            Kelola Data Muzaki
                        </Link>
                    </div>

                    <form onSubmit={handleSubmit} className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label htmlFor="nomor_kuitansi" className="block text-sm font-medium text-laz-forest mb-1.5">
                                Nomor Kuitansi
                            </label>
                            <input
                                id="nomor_kuitansi"
                                type="text"
                                required
                                value={data.nomor_kuitansi}
                                onChange={(e) => setData('nomor_kuitansi', e.target.value)}
                                className="w-full min-h-11 px-3.5 py-2 rounded-[var(--radius-button)] border border-laz-gold/50 bg-laz-surface font-mono text-sm text-laz-forest focus:border-laz-forest focus:outline-none"
                            />
                            {errors.nomor_kuitansi && (
                                <p className="mt-1 text-xs text-laz-danger">{errors.nomor_kuitansi}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="tgl_setor" className="block text-sm font-medium text-laz-forest mb-1.5">
                                Waktu Setoran
                            </label>
                            <input
                                id="tgl_setor"
                                type="datetime-local"
                                required
                                value={data.tgl_setor}
                                onChange={(e) => setData('tgl_setor', e.target.value)}
                                className="w-full min-h-11 px-3.5 py-2 rounded-[var(--radius-button)] border border-laz-gold/50 bg-laz-surface font-mono text-sm text-laz-forest focus:border-laz-forest focus:outline-none"
                            />
                        </div>

                        <div>
                            <label htmlFor="id_muzaki" className="block text-sm font-medium text-laz-forest mb-1.5">
                                Muzaki (Donatur)
                            </label>
                            <select
                                id="id_muzaki"
                                required
                                value={data.id_muzaki}
                                onChange={(e) => setData('id_muzaki', e.target.value)}
                                className="w-full min-h-11 px-3.5 py-2 rounded-[var(--radius-button)] border border-laz-gold/50 bg-laz-surface text-sm text-laz-forest focus:border-laz-forest focus:outline-none"
                            >
                                <option value="">Pilih muzaki...</option>
                                {muzakiOptions.map((m) => (
                                    <option key={m.id_muzaki} value={m.id_muzaki}>
                                        {m.kode_muzaki} - {m.nama_muzaki} ({m.tipe_muzaki})
                                    </option>
                                ))}
                            </select>
                            {errors.id_muzaki && (
                                <p className="mt-1 text-xs text-laz-danger">{errors.id_muzaki}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="metode_bayar" className="block text-sm font-medium text-laz-forest mb-1.5">
                                Metode Pembayaran
                            </label>
                            <select
                                id="metode_bayar"
                                required
                                value={data.metode_bayar}
                                onChange={(e) => setData('metode_bayar', e.target.value as MetodeBayar)}
                                className="w-full min-h-11 px-3.5 py-2 rounded-[var(--radius-button)] border border-laz-gold/50 bg-laz-surface text-sm text-laz-forest focus:border-laz-forest focus:outline-none"
                            >
                                {METODE_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label htmlFor="id_jenis_dana" className="block text-sm font-medium text-laz-forest mb-1.5">
                                Jenis Dana &amp; Akad Syariah
                            </label>
                            <select
                                id="id_jenis_dana"
                                required
                                value={data.id_jenis_dana}
                                onChange={(e) => handleJenisDanaChange(e.target.value)}
                                className="w-full min-h-11 px-3.5 py-2 rounded-[var(--radius-button)] border border-laz-gold/50 bg-laz-surface text-sm text-laz-forest focus:border-laz-forest focus:outline-none"
                            >
                                <option value="">Pilih jenis dana ZIS...</option>
                                {jenisDanaList.map((j) => (
                                    <option key={j.id_jenis_dana} value={j.id_jenis_dana}>
                                        [{KATEGORI_INDUK_LABELS[j.kategori_induk as KategoriInduk]}] {j.nama_dana}
                                    </option>
                                ))}
                            </select>
                            {errors.id_jenis_dana && (
                                <p className="mt-1 text-xs text-laz-danger">{errors.id_jenis_dana}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="id_rekening" className="block text-sm font-medium text-laz-forest mb-1.5">
                                Rekening Tujuan (Otomatis Sesuai Akad)
                            </label>
                            <select
                                id="id_rekening"
                                required
                                disabled={!selectedJenisDana}
                                value={data.id_rekening}
                                onChange={(e) => setData('id_rekening', e.target.value)}
                                className="w-full min-h-11 px-3.5 py-2 rounded-[var(--radius-button)] border border-laz-gold/50 bg-laz-surface text-sm text-laz-forest disabled:bg-laz-cream/60 focus:border-laz-forest focus:outline-none"
                            >
                                <option value="">
                                    {selectedJenisDana
                                        ? 'Pilih rekening sesuai akad...'
                                        : 'Pilih jenis dana terlebih dahulu'}
                                </option>
                                {filteredRekening.map((r) => (
                                    <option key={r.id_rekening} value={r.id_rekening}>
                                        {r.nama_bank} - {r.nomor_rekening}
                                    </option>
                                ))}
                            </select>
                            {selectedJenisDana && (
                                <p className="mt-1.5 text-xs text-laz-muted flex items-center gap-1.5">
                                    <Info className="w-3.5 h-3.5 text-laz-sage shrink-0" aria-hidden="true" />
                                    <span>
                                        Menampilkan rekening khusus akad {KATEGORI_INDUK_LABELS[selectedJenisDana.kategori_induk]}.
                                    </span>
                                </p>
                            )}
                            {errors.id_rekening && (
                                <p className="mt-1 text-xs text-laz-danger">{errors.id_rekening}</p>
                            )}
                        </div>

                        <div className="md:col-span-2">
                            <label htmlFor="nominal" className="block text-sm font-medium text-laz-forest mb-1.5">
                                Nominal Setoran (Rp)
                            </label>
                            <input
                                id="nominal"
                                type="number"
                                min="1000"
                                step="100"
                                required
                                value={data.nominal}
                                onChange={(e) => setData('nominal', e.target.value)}
                                placeholder="Contoh: 2500000"
                                className="w-full min-h-11 px-3.5 py-2 rounded-[var(--radius-button)] border border-laz-gold/50 bg-laz-surface font-mono tabular-nums text-base font-semibold text-laz-forest focus:border-laz-forest focus:outline-none"
                            />
                            {errors.nominal && (
                                <p className="mt-1 text-xs text-laz-danger">{errors.nominal}</p>
                            )}
                        </div>

                        <div className="md:col-span-2 pt-2 flex justify-end">
                            <button
                                type="submit"
                                disabled={processing}
                                className="min-h-11 px-6 py-2.5 rounded-[var(--radius-button)] bg-laz-forest hover:bg-laz-forest-hover disabled:opacity-60 text-laz-surface text-sm font-semibold transition-colors"
                            >
                                {processing ? 'Menjalankan Stored Procedure...' : 'Catat Setoran Penghimpunan'}
                            </button>
                        </div>
                    </form>
                </section>

                {/* Riwayat Penghimpunan */}
                <section
                    aria-labelledby="riwayat-penghimpunan-heading"
                    className="bg-laz-surface rounded-[var(--radius-card)] border border-laz-gold/35 overflow-hidden"
                >
                    <div className="p-6 border-b border-laz-gold/25">
                        <h3 id="riwayat-penghimpunan-heading" className="text-base font-bold text-laz-forest">
                            Riwayat Transaksi Penghimpunan Terbaru
                        </h3>
                        <p className="mt-1 text-sm text-laz-muted">
                            Diurutkan dari kuitansi terbaru (paginasi 15 baris per halaman).
                        </p>
                    </div>

                    {riwayat.data.length === 0 ? (
                        <div className="p-8 text-center text-sm text-laz-muted">
                            Belum ada transaksi penghimpunan tercatat.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-sm">
                                <thead>
                                    <tr className="bg-laz-cream/70 border-b border-laz-gold/30 text-xs font-semibold uppercase tracking-wider text-laz-muted">
                                        <th className="py-3.5 px-5">Kuitansi &amp; Tanggal</th>
                                        <th className="py-3.5 px-5">Muzaki</th>
                                        <th className="py-3.5 px-5">Jenis Dana &amp; Rekening</th>
                                        <th className="py-3.5 px-5">Metode</th>
                                        <th className="py-3.5 px-5 text-right">Nominal</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-laz-gold/20">
                                    {riwayat.data.map((row) => (
                                        <tr
                                            key={row.id_penghimpunan}
                                            className="hover:bg-laz-cream/50 transition-colors"
                                        >
                                            <td className="py-4 px-5 whitespace-nowrap">
                                                <p className="font-mono font-semibold text-laz-forest">
                                                    {row.nomor_kuitansi}
                                                </p>
                                                <p className="text-xs text-laz-muted mt-0.5">
                                                    {formatTanggalId(row.tgl_setor)}
                                                </p>
                                            </td>
                                            <td className="py-4 px-5">
                                                <p className="font-semibold text-laz-forest">
                                                    {row.muzaki?.nama_muzaki ?? '-'}
                                                </p>
                                                <p className="text-xs font-mono text-laz-muted mt-0.5">
                                                    {row.muzaki?.kode_muzaki ?? ''}
                                                </p>
                                            </td>
                                            <td className="py-4 px-5">
                                                <p className="font-medium text-laz-forest">
                                                    {row.jenis_dana?.nama_dana ?? '-'}
                                                </p>
                                                <p className="text-xs text-laz-muted mt-0.5">
                                                    {row.rekening?.nama_bank ?? '-'} ({row.rekening?.nomor_rekening ?? '-'})
                                                </p>
                                            </td>
                                            <td className="py-4 px-5 whitespace-nowrap">
                                                <span className="px-2.5 py-1 rounded-[var(--radius-badge)] bg-laz-cream border border-laz-gold/40 text-xs font-semibold text-laz-forest">
                                                    {row.metode_bayar}
                                                </span>
                                            </td>
                                            <td className="py-4 px-5 whitespace-nowrap text-right font-mono tabular-nums font-bold text-laz-sage">
                                                {formatRupiah(row.nominal)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {riwayat.last_page > 1 && (
                        <div className="px-5 py-4 border-t border-laz-gold/25 flex items-center justify-between text-xs text-laz-muted">
                            <span>
                                Halaman {riwayat.current_page} dari {riwayat.last_page} (total {riwayat.total} transaksi)
                            </span>
                            <div className="flex items-center gap-2">
                                {riwayat.prev_page_url && (
                                    <Link
                                        href={riwayat.prev_page_url}
                                        className="min-h-11 px-4 inline-flex items-center rounded-[var(--radius-button)] border border-laz-gold/40 bg-laz-cream text-laz-forest font-semibold"
                                    >
                                        Sebelumnya
                                    </Link>
                                )}
                                {riwayat.next_page_url && (
                                    <Link
                                        href={riwayat.next_page_url}
                                        className="min-h-11 px-4 inline-flex items-center rounded-[var(--radius-button)] border border-laz-gold/40 bg-laz-cream text-laz-forest font-semibold"
                                    >
                                        Berikutnya
                                    </Link>
                                )}
                            </div>
                        </div>
                    )}
                </section>
            </div>
        </DashboardLayout>
    );
}
