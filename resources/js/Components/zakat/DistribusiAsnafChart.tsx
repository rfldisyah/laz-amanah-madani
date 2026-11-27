import { ShieldCheck } from 'lucide-react';
import { formatRupiah } from '@/lib/formatters';
import type { PorsiAsnaf } from '@/types/database';

interface DistribusiAsnafChartProps {
    porsiAsnaf: PorsiAsnaf[];
}

export default function DistribusiAsnafChart({ porsiAsnaf }: DistribusiAsnafChartProps) {
    const maxNominal = Math.max(
        1,
        ...porsiAsnaf.map((item) => Number(item.total_disalurkan) || 0),
    );
    const amil = porsiAsnaf.find((item) => item.kode_asnaf === 'AMIL');

    return (
        <div className="bg-laz-surface rounded-[var(--radius-card)] border border-laz-gold/35 p-6 sm:p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-5 border-b border-laz-gold/25">
                <div>
                    <h3 className="text-lg font-bold text-laz-forest">
                        Distribusi Dana Zakat per 8 Golongan Asnaf
                    </h3>
                    <p className="mt-1 text-sm text-laz-muted">
                        Proporsi penyaluran dana zakat sesuai 8 golongan asnaf dengan pengawasan kuota syariah.
                    </p>
                </div>

                {amil && (
                    <div className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-[var(--radius-button)] bg-laz-cream border border-laz-gold/50 text-xs">
                        <ShieldCheck className="w-4 h-4 text-laz-sage shrink-0" aria-hidden="true" />
                        <span className="text-laz-forest font-medium">
                            Porsi Amil saat ini:{' '}
                            <strong className="font-mono tabular-nums">
                                {Number(amil.persentase_terhadap_zakat ?? 0).toFixed(2)}%
                            </strong>{' '}
                            (batas maks{' '}
                            <span className="font-mono tabular-nums">
                                {Number(amil.batas_maks_persen).toFixed(1)}%
                            </span>
                            )
                        </span>
                    </div>
                )}
            </div>

            {porsiAsnaf.length === 0 ? (
                <p className="text-sm text-laz-muted">
                    Belum ada data distribusi asnaf yang tercatat.
                </p>
            ) : (
                <div className="space-y-4">
                    {porsiAsnaf.map((item) => {
                        const nominal = Number(item.total_disalurkan) || 0;
                        const widthPercent = nominal > 0 ? Math.max(2, (nominal / maxNominal) * 100) : 0;
                        const isAmil = item.kode_asnaf === 'AMIL';

                        return (
                            <div key={item.id_asnaf} className="space-y-1.5">
                                <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-laz-forest">
                                            {item.nama_asnaf}
                                        </span>
                                        <span className="text-xs text-laz-muted font-mono tabular-nums">
                                            ({item.jumlah_penerima} penerima)
                                        </span>
                                    </div>

                                    <div className="flex items-baseline gap-3 font-mono tabular-nums text-xs sm:text-sm">
                                        <span className="font-semibold text-laz-forest">
                                            {formatRupiah(item.total_disalurkan)}
                                        </span>
                                        <span className="text-laz-muted w-16 text-right">
                                            {Number(item.persentase_terhadap_zakat ?? 0).toFixed(2)}%
                                        </span>
                                    </div>
                                </div>

                                <div className="h-2.5 w-full rounded-full bg-laz-cream overflow-hidden border border-laz-gold/25">
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${
                                            isAmil ? 'bg-laz-gold' : 'bg-laz-forest'
                                        }`}
                                        style={{ width: `${widthPercent}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
