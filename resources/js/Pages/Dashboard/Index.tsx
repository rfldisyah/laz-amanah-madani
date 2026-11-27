import DashboardLayout from '@/Layouts/DashboardLayout';
import type { KategoriInduk, RekapIndukDana, SharedPageProps } from '@/types/database';
import { usePage } from '@inertiajs/react';

interface DashboardIndexProps {
    rekapDana: RekapIndukDana[];
}

const KATEGORI_LABELS: Record<KategoriInduk, string> = {
    ZAKAT: 'Dana Zakat',
    INFAK_SEDEKAH: 'Infak & Sedekah',
    WAKAF: 'Dana Wakaf',
};

function formatRupiah(nominal: string): string {
    const value = Number(nominal);
    if (Number.isNaN(value)) {
        return 'Rp 0';
    }
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
}

export default function DashboardIndex({ rekapDana }: DashboardIndexProps) {
    const { auth } = usePage<SharedPageProps>().props;
    const user = auth.user;

    return (
        <DashboardLayout title="Ringkasan Operasional">
            <div className="space-y-8">
                <section
                    aria-labelledby="welcome-heading"
                    className="bg-laz-surface rounded-[var(--radius-card)] border border-laz-gold/35 p-6"
                >
                    <p className="text-xs font-semibold uppercase tracking-wider text-laz-sage">
                        Sesi Aktif
                    </p>
                    <h3 id="welcome-heading" className="mt-1 text-xl font-bold text-laz-forest">
                        {user?.nama_lengkap}
                    </h3>
                    <p className="mt-1 text-sm text-laz-muted">
                        {user?.jabatan} ({user?.username})
                    </p>
                </section>

                <section aria-labelledby="rekap-heading" className="space-y-4">
                    <div>
                        <h3 id="rekap-heading" className="text-base font-semibold text-laz-forest">
                            Rekapitulasi Saldo per Kategori Akad
                        </h3>
                        <p className="text-sm text-laz-muted">
                            Data langsung dari view v_rekap_induk_dana dengan pemisahan akad syariah.
                        </p>
                    </div>

                    {rekapDana.length === 0 ? (
                        <div className="bg-laz-surface rounded-[var(--radius-card)] border border-laz-gold/35 p-6 text-sm text-laz-muted">
                            Belum ada data saldo dana pada v_rekap_induk_dana. Catat transaksi penghimpunan pertama untuk menampilkan rekapitulasi.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {rekapDana.map((item) => (
                                <article
                                    key={item.kategori_induk}
                                    className="bg-laz-surface rounded-[var(--radius-card)] border border-laz-gold/35 p-6 space-y-4"
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <h4 className="text-sm font-semibold text-laz-forest">
                                            {KATEGORI_LABELS[item.kategori_induk]}
                                        </h4>
                                        <span className="px-2.5 py-0.5 rounded-[var(--radius-badge)] bg-laz-cream border border-laz-gold/40 text-xs font-mono tabular-nums text-laz-muted">
                                            {item.jumlah_kantong_dana} kantong
                                        </span>
                                    </div>

                                    <div>
                                        <p className="text-xs text-laz-muted">Saldo Tersedia</p>
                                        <p className="mt-1 text-2xl font-bold font-mono tabular-nums text-laz-forest">
                                            {formatRupiah(item.saldo_tersedia)}
                                        </p>
                                    </div>

                                    <dl className="pt-3 border-t border-laz-gold/25 grid grid-cols-2 gap-3 text-xs">
                                        <div>
                                            <dt className="text-laz-muted">Terhimpun</dt>
                                            <dd className="mt-0.5 font-mono tabular-nums font-medium text-laz-sage">
                                                {formatRupiah(item.total_terhimpun)}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="text-laz-muted">Tersalurkan</dt>
                                            <dd className="mt-0.5 font-mono tabular-nums font-medium text-laz-forest">
                                                {formatRupiah(item.total_tersalurkan)}
                                            </dd>
                                        </div>
                                    </dl>
                                </article>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </DashboardLayout>
    );
}
