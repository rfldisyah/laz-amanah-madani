import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowDownLeft, ArrowUpRight, Filter, Layers, Search } from 'lucide-react';

import DashboardLayout from '@/Layouts/DashboardLayout';
import { formatRupiah, formatTanggalId } from '@/lib/formatters';
import type {
    JenisDana,
    MutasiDana,
    Paginator,
    RekeningLembaga,
} from '@/types/database';

type MutasiRow = MutasiDana & {
    jenis_dana?: Pick<
        JenisDana,
        'id_jenis_dana' | 'kode_dana' | 'nama_dana' | 'kategori_induk'
    >;
    rekening?: Pick<
        RekeningLembaga,
        'id_rekening' | 'nama_bank' | 'nomor_rekening'
    >;
};

interface PartitionMeta {
    name: string;
    description: string;
    rows: number;
}

interface BukuBesarProps {
    mutasi: Paginator<MutasiRow>;
    partitions: PartitionMeta[];
    jenisDanaList: Pick<JenisDana, 'id_jenis_dana' | 'kode_dana' | 'nama_dana'>[];
    filters: {
        tahun: string;
        jenis_mutasi: string;
        id_jenis_dana: string;
        search: string;
    };
}

export default function BukuBesar({
    mutasi,
    partitions,
    jenisDanaList,
    filters,
}: BukuBesarProps) {
    const [tahun, setTahun] = useState(filters.tahun);
    const [jenisMutasi, setJenisMutasi] = useState(filters.jenis_mutasi);
    const [idJenisDana, setIdJenisDana] = useState(filters.id_jenis_dana);
    const [search, setSearch] = useState(filters.search);

    const applyFilters = (overrideTahun?: string) => {
        const nextTahun = overrideTahun ?? tahun;
        if (overrideTahun) setTahun(overrideTahun);

        router.get(
            '/admin/mutasi',
            {
                tahun: nextTahun,
                jenis_mutasi: jenisMutasi,
                id_jenis_dana: idJenisDana,
                search,
            },
            { preserveState: true, replace: true },
        );
    };

    return (
        <DashboardLayout title="Buku Besar">
            <Head title="Buku Besar" />

            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-laz-forest">
                        Buku Besar Mutasi Dana (Partitioned)
                    </h1>
                    <p className="mt-1 text-sm text-laz-muted">
                        Penjelajah riwayat mutasi kas yang dikelompokkan
                        berdasarkan tahun transaksi (2024, 2025, 2026+).
                    </p>
                </div>

                {/* Partition Overview Cards */}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {partitions.map((p) => {
                        const targetYear =
                            p.name === 'p2024'
                                ? '2024'
                                : p.name === 'p2025'
                                  ? '2025'
                                  : p.name === 'p2026'
                                    ? '2026'
                                    : '2027+';
                        const isSelected = tahun === targetYear;

                        return (
                            <button
                                key={p.name}
                                type="button"
                                onClick={() => applyFilters(targetYear)}
                                className={`flex items-center justify-between rounded-[var(--radius-card)] border p-4 text-left transition-colors ${
                                    isSelected
                                        ? 'border-laz-forest bg-laz-forest text-laz-surface'
                                        : 'border-laz-gold/35 bg-laz-surface text-laz-forest hover:bg-laz-cream'
                                }`}
                            >
                                <div>
                                    <div className="flex items-center gap-1.5 text-xs font-mono opacity-80">
                                        <Layers
                                            className="h-3.5 w-3.5"
                                            aria-hidden="true"
                                        />
                                        {p.name}
                                    </div>
                                    <p className="mt-1 text-base font-bold">
                                        Partisi {targetYear}
                                    </p>
                                </div>
                                <div className="text-right font-mono text-sm font-semibold">
                                    {p.rows.toLocaleString('id-ID')} baris
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Filter Bar */}
                <div className="flex flex-wrap items-end gap-3 rounded-[var(--radius-card)] border border-laz-gold/35 bg-laz-surface p-4">
                    <div className="relative min-w-52 flex-1">
                        <Search
                            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-laz-muted"
                            aria-hidden="true"
                        />
                        <input
                            type="search"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) =>
                                e.key === 'Enter' && applyFilters()
                            }
                            placeholder="Cari nomor referensi atau keterangan…"
                            className="min-h-11 w-full rounded-[var(--radius-button)] border border-laz-gold/45 bg-laz-cream/50 py-2.5 pl-9 pr-4 text-sm text-laz-forest"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <Filter
                            className="h-4 w-4 text-laz-muted"
                            aria-hidden="true"
                        />
                        <select
                            aria-label="Filter tahun partisi"
                            value={tahun}
                            onChange={(e) => setTahun(e.target.value)}
                            className="min-h-11 rounded-[var(--radius-button)] border border-laz-gold/45 bg-laz-cream/50 px-3 py-2 text-sm text-laz-forest"
                        >
                            <option value="2026">Partisi 2026</option>
                            <option value="2025">Partisi 2025</option>
                            <option value="2024">Partisi 2024</option>
                            <option value="2027+">Partisi 2027+</option>
                            <option value="SEMUA">Semua Tahun</option>
                        </select>
                    </div>

                    <select
                        aria-label="Filter jenis mutasi"
                        value={jenisMutasi}
                        onChange={(e) => setJenisMutasi(e.target.value)}
                        className="min-h-11 rounded-[var(--radius-button)] border border-laz-gold/45 bg-laz-cream/50 px-3 py-2 text-sm text-laz-forest"
                    >
                        <option value="SEMUA">Semua Mutasi</option>
                        <option value="MASUK">Mutasi Masuk</option>
                        <option value="KELUAR">Mutasi Keluar</option>
                    </select>

                    <select
                        aria-label="Filter jenis dana"
                        value={idJenisDana}
                        onChange={(e) => setIdJenisDana(e.target.value)}
                        className="min-h-11 rounded-[var(--radius-button)] border border-laz-gold/45 bg-laz-cream/50 px-3 py-2 text-sm text-laz-forest"
                    >
                        <option value="">Semua Kantong Dana</option>
                        {jenisDanaList.map((jd) => (
                            <option
                                key={jd.id_jenis_dana}
                                value={jd.id_jenis_dana}
                            >
                                {jd.kode_dana} — {jd.nama_dana}
                            </option>
                        ))}
                    </select>

                    <button
                        type="button"
                        onClick={() => applyFilters()}
                        className="min-h-11 rounded-[var(--radius-button)] border border-laz-gold/45 bg-laz-cream px-4 py-2 text-sm font-semibold text-laz-forest hover:bg-laz-sage/20"
                    >
                        Terapkan
                    </button>
                </div>

                {/* Ledger Table */}
                <div className="overflow-hidden rounded-[var(--radius-card)] border border-laz-gold/35 bg-laz-surface">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-laz-gold/25 bg-laz-cream/60">
                                    <th className="px-4 py-3 text-left font-semibold text-laz-forest">
                                        Waktu & Referensi
                                    </th>
                                    <th className="px-4 py-3 text-left font-semibold text-laz-forest">
                                        Kantong Dana / Bank
                                    </th>
                                    <th className="px-4 py-3 text-left font-semibold text-laz-forest">
                                        Arus
                                    </th>
                                    <th className="px-4 py-3 text-right font-semibold text-laz-forest">
                                        Nominal
                                    </th>
                                    <th className="px-4 py-3 text-right font-semibold text-laz-forest">
                                        Saldo Sesudah
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-laz-gold/20">
                                {mutasi.data.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="px-4 py-10 text-center text-laz-muted"
                                        >
                                            Tidak ada catatan mutasi pada
                                            partisi/filter ini.
                                        </td>
                                    </tr>
                                ) : (
                                    mutasi.data.map((m) => (
                                        <tr
                                            key={`${m.id_mutasi}-${m.waktu_mutasi}`}
                                            className="hover:bg-laz-cream/40"
                                        >
                                            <td className="px-4 py-3">
                                                <p className="font-mono font-semibold text-laz-forest">
                                                    {m.nomor_referensi}
                                                </p>
                                                <p className="mt-0.5 text-xs text-laz-muted">
                                                    {formatTanggalId(
                                                        m.waktu_mutasi,
                                                    )}
                                                </p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="font-semibold text-laz-forest">
                                                    {m.jenis_dana?.nama_dana ??
                                                        '—'}
                                                </p>
                                                <p className="mt-0.5 text-xs text-laz-muted">
                                                    {m.rekening
                                                        ? `${m.rekening.nama_bank} (${m.rekening.nomor_rekening})`
                                                        : '—'}
                                                </p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                                        m.jenis_mutasi ===
                                                        'MASUK'
                                                            ? 'border border-laz-sage/40 bg-laz-sage/20 text-laz-forest'
                                                            : 'border border-laz-warning/35 bg-laz-warning/15 text-laz-warning'
                                                    }`}
                                                >
                                                    {m.jenis_mutasi ===
                                                    'MASUK' ? (
                                                        <ArrowDownLeft
                                                            className="h-3.5 w-3.5"
                                                            aria-hidden="true"
                                                        />
                                                    ) : (
                                                        <ArrowUpRight
                                                            className="h-3.5 w-3.5"
                                                            aria-hidden="true"
                                                        />
                                                    )}
                                                    {m.jenis_mutasi}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono font-semibold text-laz-forest">
                                                {formatRupiah(m.nominal_mutasi)}
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono text-laz-muted">
                                                {formatRupiah(m.saldo_sesudah)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {mutasi.last_page > 1 && (
                        <div className="flex items-center justify-between border-t border-laz-gold/25 px-5 py-4 text-xs text-laz-muted">
                            <span>
                                Halaman {mutasi.current_page} dari{' '}
                                {mutasi.last_page} (total{' '}
                                {mutasi.total.toLocaleString('id-ID')} mutasi)
                            </span>
                            <div className="flex items-center gap-2">
                                {mutasi.prev_page_url && (
                                    <Link
                                        href={mutasi.prev_page_url}
                                        className="inline-flex min-h-11 items-center rounded-[var(--radius-button)] border border-laz-gold/40 bg-laz-cream px-4 font-semibold text-laz-forest"
                                    >
                                        Sebelumnya
                                    </Link>
                                )}
                                {mutasi.next_page_url && (
                                    <Link
                                        href={mutasi.next_page_url}
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
        </DashboardLayout>
    );
}
