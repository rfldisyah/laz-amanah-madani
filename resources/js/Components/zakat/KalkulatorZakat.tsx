import { Calculator } from 'lucide-react';
import { useMemo, useState } from 'react';
import { formatRupiah } from '@/lib/formatters';

interface KalkulatorZakatProps {
    onOpenSalurkan: () => void;
}

type JenisZakat = 'PENGHASILAN' | 'MAAL';

export default function KalkulatorZakat({ onOpenSalurkan }: KalkulatorZakatProps) {
    const [jenis, setJenis] = useState<JenisZakat>('PENGHASILAN');
    const [hargaEmasPerGram, setHargaEmasPerGram] = useState<string>('1500000');
    const [penghasilanBulanan, setPenghasilanBulanan] = useState<string>('');
    const [bonusBulanan, setBonusBulanan] = useState<string>('');
    const [totalHarta, setTotalHarta] = useState<string>('');
    const [utangJatuhTempo, setUtangJatuhTempo] = useState<string>('');

    const hasil = useMemo(() => {
        const hargaEmas = Math.max(0, Number(hargaEmasPerGram) || 0);
        const nisabTahunan = hargaEmas * 85;
        const nisabBulanan = nisabTahunan / 12;

        if (jenis === 'PENGHASILAN') {
            const totalMasuk =
                Math.max(0, Number(penghasilanBulanan) || 0) +
                Math.max(0, Number(bonusBulanan) || 0);
            const wajibZakat = totalMasuk >= nisabBulanan && totalMasuk > 0;
            const nominalZakat = wajibZakat ? Math.round(totalMasuk * 0.025) : 0;

            return {
                dasarHitung: totalMasuk,
                nisabBerlaku: nisabBulanan,
                labelNisab: 'Nisab Bulanan (setara 85 gr emas / 12)',
                wajibZakat,
                nominalZakat,
            };
        }

        const hartaBersih = Math.max(
            0,
            (Number(totalHarta) || 0) - (Number(utangJatuhTempo) || 0),
        );
        const wajibZakat = hartaBersih >= nisabTahunan && hartaBersih > 0;
        const nominalZakat = wajibZakat ? Math.round(hartaBersih * 0.025) : 0;

        return {
            dasarHitung: hartaBersih,
            nisabBerlaku: nisabTahunan,
            labelNisab: 'Nisab Tahunan (85 gr emas)',
            wajibZakat,
            nominalZakat,
        };
    }, [jenis, hargaEmasPerGram, penghasilanBulanan, bonusBulanan, totalHarta, utangJatuhTempo]);

    return (
        <div className="bg-laz-surface rounded-[var(--radius-card)] border border-laz-gold/35 p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 space-y-6">
                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => setJenis('PENGHASILAN')}
                        className={`min-h-11 px-4 py-2 rounded-[var(--radius-button)] text-sm font-semibold border transition-colors ${
                            jenis === 'PENGHASILAN'
                                ? 'bg-laz-forest border-laz-forest text-laz-surface'
                                : 'bg-laz-cream border-laz-gold/40 text-laz-forest hover:bg-laz-gold/20'
                        }`}
                    >
                        Zakat Penghasilan (2,5%)
                    </button>
                    <button
                        type="button"
                        onClick={() => setJenis('MAAL')}
                        className={`min-h-11 px-4 py-2 rounded-[var(--radius-button)] text-sm font-semibold border transition-colors ${
                            jenis === 'MAAL'
                                ? 'bg-laz-forest border-laz-forest text-laz-surface'
                                : 'bg-laz-cream border-laz-gold/40 text-laz-forest hover:bg-laz-gold/20'
                        }`}
                    >
                        Zakat Maal / Simpanan (2,5%)
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {jenis === 'PENGHASILAN' ? (
                        <>
                            <div>
                                <label
                                    htmlFor="calc-gaji"
                                    className="block text-sm font-medium text-laz-forest mb-1.5"
                                >
                                    Penghasilan per Bulan (Rp)
                                </label>
                                <input
                                    id="calc-gaji"
                                    type="number"
                                    min="0"
                                    inputMode="numeric"
                                    value={penghasilanBulanan}
                                    onChange={(e) => setPenghasilanBulanan(e.target.value)}
                                    placeholder="Contoh: 12000000"
                                    className="w-full min-h-11 px-3.5 py-2 rounded-[var(--radius-button)] border border-laz-gold/50 bg-laz-surface font-mono tabular-nums text-sm text-laz-forest focus:border-laz-forest focus:outline-none"
                                />
                            </div>
                            <div>
                                <label
                                    htmlFor="calc-bonus"
                                    className="block text-sm font-medium text-laz-forest mb-1.5"
                                >
                                    Tunjangan / Bonus Lain (Rp)
                                </label>
                                <input
                                    id="calc-bonus"
                                    type="number"
                                    min="0"
                                    inputMode="numeric"
                                    value={bonusBulanan}
                                    onChange={(e) => setBonusBulanan(e.target.value)}
                                    placeholder="0"
                                    className="w-full min-h-11 px-3.5 py-2 rounded-[var(--radius-button)] border border-laz-gold/50 bg-laz-surface font-mono tabular-nums text-sm text-laz-forest focus:border-laz-forest focus:outline-none"
                                />
                            </div>
                        </>
                    ) : (
                        <>
                            <div>
                                <label
                                    htmlFor="calc-harta"
                                    className="block text-sm font-medium text-laz-forest mb-1.5"
                                >
                                    Total Simpanan / Aset (Rp)
                                </label>
                                <input
                                    id="calc-harta"
                                    type="number"
                                    min="0"
                                    inputMode="numeric"
                                    value={totalHarta}
                                    onChange={(e) => setTotalHarta(e.target.value)}
                                    placeholder="Contoh: 150000000"
                                    className="w-full min-h-11 px-3.5 py-2 rounded-[var(--radius-button)] border border-laz-gold/50 bg-laz-surface font-mono tabular-nums text-sm text-laz-forest focus:border-laz-forest focus:outline-none"
                                />
                            </div>
                            <div>
                                <label
                                    htmlFor="calc-utang"
                                    className="block text-sm font-medium text-laz-forest mb-1.5"
                                >
                                    Utang Jatuh Tempo (Rp)
                                </label>
                                <input
                                    id="calc-utang"
                                    type="number"
                                    min="0"
                                    inputMode="numeric"
                                    value={utangJatuhTempo}
                                    onChange={(e) => setUtangJatuhTempo(e.target.value)}
                                    placeholder="0"
                                    className="w-full min-h-11 px-3.5 py-2 rounded-[var(--radius-button)] border border-laz-gold/50 bg-laz-surface font-mono tabular-nums text-sm text-laz-forest focus:border-laz-forest focus:outline-none"
                                />
                            </div>
                        </>
                    )}

                    <div className="sm:col-span-2">
                        <label
                            htmlFor="calc-emas"
                            className="block text-sm font-medium text-laz-forest mb-1.5"
                        >
                            Harga Referensi Emas per Gram (Rp)
                        </label>
                        <input
                            id="calc-emas"
                            type="number"
                            min="0"
                            inputMode="numeric"
                            value={hargaEmasPerGram}
                            onChange={(e) => setHargaEmasPerGram(e.target.value)}
                            className="w-full min-h-11 px-3.5 py-2 rounded-[var(--radius-button)] border border-laz-gold/50 bg-laz-cream/60 font-mono tabular-nums text-sm text-laz-forest focus:border-laz-forest focus:outline-none"
                        />
                        <p className="mt-1 text-xs text-laz-muted">
                            Nilai referensi dapat disesuaikan mengikuti harga emas Antam terkini.
                        </p>
                    </div>
                </div>
            </div>

            <div className="lg:col-span-5 bg-laz-forest text-laz-cream rounded-[var(--radius-card)] p-6 flex flex-col justify-between gap-6">
                <div className="space-y-4">
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-laz-gold">
                            Estimasi Kewajiban Zakat
                        </span>
                        <Calculator className="w-4 h-4 text-laz-gold" aria-hidden="true" />
                    </div>

                    <div>
                        <p className="text-xs text-laz-cream/75">{hasil.labelNisab}</p>
                        <p className="mt-0.5 text-sm font-mono tabular-nums font-semibold text-laz-surface">
                            {formatRupiah(hasil.nisabBerlaku)}
                        </p>
                    </div>

                    <div className="pt-4 border-t border-laz-gold/25">
                        <p className="text-xs text-laz-cream/75">Nominal Zakat (2,5%)</p>
                        <p className="mt-1 text-3xl font-bold font-mono tabular-nums text-laz-gold">
                            {formatRupiah(hasil.nominalZakat)}
                        </p>
                        <p className="mt-2 text-xs text-laz-cream/85">
                            {hasil.dasarHitung === 0
                                ? 'Masukkan nominal harta atau penghasilan untuk menghitung zakat.'
                                : hasil.wajibZakat
                                  ? 'Status: Mencapai nisab. Wajib menunaikan zakat 2,5%.'
                                  : 'Status: Belum mencapai nisab. Anda tetap dapat berinfak sesuai kemampuan.'}
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={onOpenSalurkan}
                    className="w-full min-h-11 px-4 py-2.5 rounded-[var(--radius-button)] bg-laz-gold hover:bg-laz-gold/90 text-laz-forest font-semibold text-sm transition-colors"
                >
                    Lihat Rekening Zakat Resmi
                </button>
            </div>
        </div>
    );
}
