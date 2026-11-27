import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { formatRupiah, formatTanggalId, KATEGORI_INDUK_LABELS } from '@/lib/formatters';
import type { KategoriInduk, LaporanPublikZis } from '@/types/database';

interface TabelTransparansiPublikProps {
    laporanPublik: LaporanPublikZis[];
}

type FilterKategori = 'SEMUA' | KategoriInduk;

export default function TabelTransparansiPublik({
    laporanPublik,
}: TabelTransparansiPublikProps) {
    const [kategori, setKategori] = useState<FilterKategori>('SEMUA');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredRows = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return laporanPublik.filter((row) => {
            if (kategori !== 'SEMUA' && row.kategori_induk !== kategori) {
                return false;
            }
            if (!q) {
                return true;
            }
            return (
                row.nama_program.toLowerCase().includes(q) ||
                row.kecamatan_penerima.toLowerCase().includes(q) ||
                row.golongan_asnaf.toLowerCase().includes(q) ||
                row.nomor_sk_salur.toLowerCase().includes(q)
            );
        });
    }, [laporanPublik, kategori, searchQuery]);

    return (
        <div className="bg-laz-surface rounded-[var(--radius-card)] border border-laz-gold/35 overflow-hidden">
            <div className="p-6 border-b border-laz-gold/25 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <h3 className="text-lg font-bold text-laz-forest">
                        Riwayat Penyaluran Dana
                    </h3>
                    <p className="mt-1 text-sm text-laz-muted">
                        Identitas NIK dan nama lengkap mustahik disamarkan otomatis oleh view database untuk menjaga martabat penerima manfaat.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="relative">
                        <Search
                            className="w-4 h-4 text-laz-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                            aria-hidden="true"
                        />
                        <input
                            type="search"
                            aria-label="Cari program atau kecamatan penerima"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari program atau kecamatan..."
                            className="w-full sm:w-64 min-h-11 pl-10 pr-3.5 py-2 rounded-[var(--radius-button)] border border-laz-gold/50 bg-laz-surface text-sm text-laz-forest placeholder:text-laz-muted/70 focus:border-laz-forest focus:outline-none"
                        />
                    </div>

                    <select
                        aria-label="Filter kategori dana"
                        value={kategori}
                        onChange={(e) => setKategori(e.target.value as FilterKategori)}
                        className="min-h-11 px-3.5 py-2 rounded-[var(--radius-button)] border border-laz-gold/50 bg-laz-surface text-sm font-medium text-laz-forest focus:border-laz-forest focus:outline-none"
                    >
                        <option value="SEMUA">Semua Kategori</option>
                        <option value="ZAKAT">Zakat</option>
                        <option value="INFAK_SEDEKAH">Infak & Sedekah</option>
                        <option value="WAKAF">Wakaf</option>
                    </select>
                </div>
            </div>

            {filteredRows.length === 0 ? (
                <div className="p-8 text-center space-y-3">
                    <p className="text-sm text-laz-muted">
                        {laporanPublik.length === 0
                            ? 'Belum ada data penyaluran berstatus DISALURKAN pada portal publik.'
                            : 'Tidak ada data penyaluran yang cocok dengan pencarian atau filter kategori.'}
                    </p>
                    {laporanPublik.length > 0 && (
                        <button
                            type="button"
                            onClick={() => {
                                setKategori('SEMUA');
                                setSearchQuery('');
                            }}
                            className="min-h-11 px-4 py-2 rounded-[var(--radius-button)] border border-laz-gold/50 bg-laz-cream text-sm font-semibold text-laz-forest hover:bg-laz-gold/25"
                        >
                            Reset Filter
                        </button>
                    )}
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                        <thead>
                            <tr className="bg-laz-cream/70 border-b border-laz-gold/30 text-xs font-semibold uppercase tracking-wider text-laz-muted">
                                <th className="py-3.5 px-5">Tanggal & SK</th>
                                <th className="py-3.5 px-5">Program & Akad</th>
                                <th className="py-3.5 px-5">Kecamatan</th>
                                <th className="py-3.5 px-5">Asnaf</th>
                                <th className="py-3.5 px-5">Mustahik Tersamar</th>
                                <th className="py-3.5 px-5 text-right">Nominal</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-laz-gold/20">
                            {filteredRows.map((row, idx) => (
                                <tr
                                    key={`${row.nomor_sk_salur}-${row.nik_tersamar ?? idx}`}
                                    className="hover:bg-laz-cream/50 transition-colors"
                                >
                                    <td className="py-4 px-5 whitespace-nowrap">
                                        <p className="font-medium text-laz-forest">
                                            {formatTanggalId(row.tanggal_penyaluran)}
                                        </p>
                                        <p className="text-xs font-mono text-laz-muted mt-0.5">
                                            {row.nomor_sk_salur}
                                        </p>
                                    </td>
                                    <td className="py-4 px-5 min-w-[220px]">
                                        <p className="font-semibold text-laz-forest">
                                            {row.nama_program}
                                        </p>
                                        <p className="text-xs text-laz-muted mt-0.5">
                                            {KATEGORI_INDUK_LABELS[row.kategori_induk]} ({row.sumber_dana})
                                        </p>
                                    </td>
                                    <td className="py-4 px-5 whitespace-nowrap text-laz-forest">
                                        {row.kecamatan_penerima}
                                    </td>
                                    <td className="py-4 px-5 whitespace-nowrap">
                                        <span className="px-2.5 py-1 rounded-[var(--radius-badge)] bg-laz-sage/15 text-laz-forest text-xs font-semibold">
                                            {row.golongan_asnaf}
                                        </span>
                                    </td>
                                    <td className="py-4 px-5 whitespace-nowrap font-mono text-xs text-laz-muted">
                                        <p className="font-semibold text-laz-forest">
                                            {row.nama_mustahik_tersamar ?? '****'}
                                        </p>
                                        <p className="mt-0.5">{row.nik_tersamar ?? '****************'}</p>
                                    </td>
                                    <td className="py-4 px-5 whitespace-nowrap text-right font-mono tabular-nums font-bold text-laz-forest">
                                        {formatRupiah(row.nominal_diterima)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
