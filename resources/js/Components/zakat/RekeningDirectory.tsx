import { AnimatePresence, motion } from 'framer-motion';
import { Check, Copy, Landmark } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { KATEGORI_INDUK_LABELS } from '@/lib/formatters';
import type { KategoriInduk, RekeningLembaga } from '@/types/database';

interface RekeningDirectoryProps {
    rekeningResmi: RekeningLembaga[];
}

const KATEGORI_ORDER: KategoriInduk[] = ['ZAKAT', 'INFAK_SEDEKAH', 'WAKAF'];

const KATEGORI_DESKRIPSI: Record<KategoriInduk, string> = {
    ZAKAT: 'Khusus penerimaan Zakat Maal, Zakat Penghasilan, dan Zakat Fitrah. Terpisah penuh dari dana non-zakat.',
    INFAK_SEDEKAH: 'Penghimpunan Infak, Sedekah umum, dan dana kemanusiaan yang fleksibel untuk program sosial.',
    WAKAF: 'Rekening amanah Wakaf uang dan aset produktif yang pokok dananya dijaga kekal.',
};

export default function RekeningDirectory({ rekeningResmi }: RekeningDirectoryProps) {
    const [activeKategori, setActiveKategori] = useState<KategoriInduk>('ZAKAT');
    const [copiedId, setCopiedId] = useState<number | null>(null);
    const [copiedNomor, setCopiedNomor] = useState<string | null>(null);
    const copyTimerRef = useRef<number | null>(null);

    const grouped = useMemo(() => {
        return KATEGORI_ORDER.reduce<Record<KategoriInduk, RekeningLembaga[]>>(
            (acc, kat) => {
                acc[kat] = rekeningResmi.filter((r) => r.kategori_induk === kat);
                return acc;
            },
            { ZAKAT: [], INFAK_SEDEKAH: [], WAKAF: [] },
        );
    }, [rekeningResmi]);

    const currentList = grouped[activeKategori];

    const copyTextWithFallback = async (text: string): Promise<boolean> => {
        if (navigator.clipboard && window.isSecureContext) {
            try {
                await navigator.clipboard.writeText(text);
                return true;
            } catch {
                // Fallback ke textarea di bawah
            }
        }

        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.top = '-9999px';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();

        let ok = false;
        try {
            ok = document.execCommand('copy');
        } catch {
            ok = false;
        } finally {
            document.body.removeChild(textarea);
        }

        return ok;
    };

    const handleCopy = async (idRekening: number, nomorRekening: string) => {
        const copied = await copyTextWithFallback(nomorRekening);
        if (!copied) {
            return;
        }

        if (copyTimerRef.current !== null) {
            window.clearTimeout(copyTimerRef.current);
        }

        setCopiedId(idRekening);
        setCopiedNomor(nomorRekening);

        copyTimerRef.current = window.setTimeout(() => {
            setCopiedId(null);
            setCopiedNomor(null);
        }, 2500);
    };

    return (
        <div className="space-y-6">
            <div
                role="tablist"
                aria-label="Kategori Akad Rekening"
                className="inline-flex flex-wrap gap-2 p-1.5 rounded-[var(--radius-card)] bg-laz-cream border border-laz-gold/40"
            >
                {KATEGORI_ORDER.map((kat) => {
                    const isActive = activeKategori === kat;
                    return (
                        <button
                            key={kat}
                            type="button"
                            role="tab"
                            aria-selected={isActive}
                            onClick={() => setActiveKategori(kat)}
                            className={`relative min-h-11 px-4 py-2 rounded-[var(--radius-button)] text-sm font-semibold transition-colors ${
                                isActive
                                    ? 'text-laz-surface'
                                    : 'text-laz-forest hover:text-laz-sage'
                            }`}
                        >
                            {isActive && (
                                <motion.span
                                    layoutId="rekening-active-tab"
                                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                                    className="absolute inset-0 rounded-[var(--radius-button)] bg-laz-forest"
                                />
                            )}
                            <span className="relative z-10">{KATEGORI_INDUK_LABELS[kat]}</span>
                        </button>
                    );
                })}
            </div>

            <p className="text-sm text-laz-muted max-w-2xl">
                {KATEGORI_DESKRIPSI[activeKategori]}
            </p>

            {currentList.length === 0 ? (
                <div className="bg-laz-surface rounded-[var(--radius-card)] border border-laz-gold/35 p-6 text-sm text-laz-muted">
                    Belum ada rekening aktif terdaftar untuk kategori {KATEGORI_INDUK_LABELS[activeKategori]}.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {currentList.map((rek) => {
                        const isCopied = copiedId === rek.id_rekening;
                        return (
                            <article
                                key={rek.id_rekening}
                                className="bg-laz-surface rounded-[var(--radius-card)] border border-laz-gold/35 p-6 flex flex-col justify-between gap-5"
                            >
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="w-10 h-10 rounded-[var(--radius-button)] bg-laz-cream border border-laz-gold/40 text-laz-forest flex items-center justify-center shrink-0">
                                            <Landmark className="w-5 h-5" aria-hidden="true" />
                                        </div>

                                        <span className="px-2.5 py-1 rounded-[var(--radius-badge)] bg-laz-cream border border-laz-gold/40 text-xs font-semibold text-laz-forest whitespace-nowrap shrink-0">
                                            {KATEGORI_INDUK_LABELS[rek.kategori_induk]}
                                        </span>
                                    </div>

                                    <div className="min-w-0">
                                        <h3 className="text-base font-bold text-laz-forest leading-snug">
                                            {rek.nama_bank}
                                        </h3>
                                        <p className="text-sm text-laz-muted mt-1 leading-relaxed">
                                            a.n. {rek.atas_nama}
                                        </p>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-laz-gold/25 flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <p className="text-xs text-laz-muted">Nomor Rekening / Kanal</p>
                                        <p className="mt-0.5 text-xl font-bold font-mono tabular-nums tracking-tight text-laz-forest">
                                            {rek.nomor_rekening}
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => handleCopy(rek.id_rekening, rek.nomor_rekening)}
                                        className={`min-h-11 px-4 py-2 rounded-[var(--radius-button)] border text-sm font-semibold inline-flex items-center gap-2 transition-colors ${
                                            isCopied
                                                ? 'bg-laz-sage border-laz-sage text-laz-surface'
                                                : 'bg-laz-cream hover:bg-laz-gold/25 border-laz-gold/50 text-laz-forest'
                                        }`}
                                    >
                                        {isCopied ? (
                                            <>
                                                <Check className="w-4 h-4" aria-hidden="true" />
                                                <span>Tersalin</span>
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="w-4 h-4" aria-hidden="true" />
                                                <span>Salin Nomor</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}

            <AnimatePresence>
                {copiedNomor && (
                    <motion.div
                        role="status"
                        aria-live="polite"
                        initial={{ opacity: 0, y: 16, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 12, scale: 0.96 }}
                        transition={{ duration: 0.2 }}
                        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] inline-flex items-center gap-2.5 rounded-full bg-laz-forest text-laz-surface border border-laz-gold/45 px-5 py-2.5 text-sm font-medium shadow-lg whitespace-nowrap"
                    >
                        <Check className="w-4 h-4 text-laz-gold shrink-0" aria-hidden="true" />
                        <span>
                            No. rekening <span className="font-mono font-semibold">{copiedNomor}</span> disalin
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
