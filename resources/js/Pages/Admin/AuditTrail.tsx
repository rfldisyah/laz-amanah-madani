import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Filter, Lock, Search } from 'lucide-react';

import DashboardLayout from '@/Layouts/DashboardLayout';
import { formatTanggalId } from '@/lib/formatters';
import type { AksiAudit, LogAudit, Paginator } from '@/types/database';

interface AuditTrailProps {
    logs: Paginator<LogAudit>;
    filters: { search: string; aksi: string };
}

const AKSI_STYLES: Record<AksiAudit, string> = {
    INSERT: 'border border-laz-sage/40 bg-laz-sage/20 text-laz-forest',
    UPDATE: 'border border-laz-warning/35 bg-laz-warning/15 text-laz-warning',
    DELETE: 'border border-laz-danger/35 bg-laz-danger/10 text-laz-danger',
};

export default function AuditTrail({ logs, filters }: AuditTrailProps) {
    const [search, setSearch] = useState(filters.search);
    const [aksi, setAksi] = useState(filters.aksi);

    const applyFilters = () => {
        router.get(
            '/admin/audit',
            { search, aksi },
            { preserveState: true, replace: true },
        );
    };

    return (
        <DashboardLayout title="Audit Trail">
            <Head title="Audit Trail" />

            <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-laz-forest">
                            Audit Trail Sistem (Read-Only)
                        </h1>
                        <p className="mt-1 text-sm text-laz-muted">
                            Rekam jejak perubahan tabel sensitif yang dicatat
                            otomatis oleh trigger RDBMS.
                        </p>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-laz-gold/45 bg-laz-cream px-4 py-2 text-xs font-semibold text-laz-forest">
                        <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                        Mode Auditor (Tidak Dapat Diubah/Hapus)
                    </div>
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
                            placeholder="Cari nama tabel, kolom, aktor, atau ID record…"
                            className="min-h-11 w-full rounded-[var(--radius-button)] border border-laz-gold/45 bg-laz-cream/50 py-2.5 pl-9 pr-4 text-sm text-laz-forest"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <Filter
                            className="h-4 w-4 text-laz-muted"
                            aria-hidden="true"
                        />
                        <select
                            aria-label="Filter aksi audit"
                            value={aksi}
                            onChange={(e) => setAksi(e.target.value)}
                            className="min-h-11 rounded-[var(--radius-button)] border border-laz-gold/45 bg-laz-cream/50 px-3 py-2 text-sm text-laz-forest"
                        >
                            <option value="SEMUA">Semua Aksi</option>
                            <option value="INSERT">INSERT</option>
                            <option value="UPDATE">UPDATE</option>
                            <option value="DELETE">DELETE</option>
                        </select>
                    </div>

                    <button
                        type="button"
                        onClick={applyFilters}
                        className="min-h-11 rounded-[var(--radius-button)] border border-laz-gold/45 bg-laz-cream px-4 py-2 text-sm font-semibold text-laz-forest hover:bg-laz-sage/20"
                    >
                        Terapkan
                    </button>
                </div>

                {/* Read-only Audit Table */}
                <div className="overflow-hidden rounded-[var(--radius-card)] border border-laz-gold/35 bg-laz-surface">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-laz-gold/25 bg-laz-cream/60">
                                    <th className="px-4 py-3 text-left font-semibold text-laz-forest">
                                        Waktu Kejadian
                                    </th>
                                    <th className="px-4 py-3 text-left font-semibold text-laz-forest">
                                        Tabel / Record
                                    </th>
                                    <th className="px-4 py-3 text-left font-semibold text-laz-forest">
                                        Aksi
                                    </th>
                                    <th className="px-4 py-3 text-left font-semibold text-laz-forest">
                                        Kolom & Perubahan
                                    </th>
                                    <th className="px-4 py-3 text-left font-semibold text-laz-forest">
                                        Eksekutor DB
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-laz-gold/20">
                                {logs.data.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="px-4 py-10 text-center text-laz-muted"
                                        >
                                            Tidak ada log audit sesuai filter.
                                        </td>
                                    </tr>
                                ) : (
                                    logs.data.map((log) => (
                                        <tr
                                            key={log.id_audit}
                                            className="hover:bg-laz-cream/40"
                                        >
                                            <td className="px-4 py-3 text-xs text-laz-muted">
                                                {formatTanggalId(
                                                    log.waktu_kejadian,
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="font-mono font-semibold text-laz-forest">
                                                    {log.nama_tabel}
                                                </p>
                                                <p className="font-mono text-xs text-laz-muted">
                                                    ID: {log.id_record}
                                                </p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`inline-flex rounded-full px-2.5 py-0.5 font-mono text-xs font-semibold ${AKSI_STYLES[log.aksi]}`}
                                                >
                                                    {log.aksi}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="font-mono text-xs font-semibold text-laz-forest">
                                                    {log.kolom_berubah}
                                                </p>
                                                <p className="mt-0.5 font-mono text-xs text-laz-muted">
                                                    {log.nilai_lama ?? 'NULL'} →{' '}
                                                    {log.nilai_baru ?? 'NULL'}
                                                </p>
                                            </td>
                                            <td className="px-4 py-3 font-mono text-xs text-laz-muted">
                                                {log.dilakukan_oleh}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {logs.last_page > 1 && (
                        <div className="flex items-center justify-between border-t border-laz-gold/25 px-5 py-4 text-xs text-laz-muted">
                            <span>
                                Halaman {logs.current_page} dari{' '}
                                {logs.last_page} (total {logs.total} entri)
                            </span>
                            <div className="flex items-center gap-2">
                                {logs.prev_page_url && (
                                    <Link
                                        href={logs.prev_page_url}
                                        className="inline-flex min-h-11 items-center rounded-[var(--radius-button)] border border-laz-gold/40 bg-laz-cream px-4 font-semibold text-laz-forest"
                                    >
                                        Sebelumnya
                                    </Link>
                                )}
                                {logs.next_page_url && (
                                    <Link
                                        href={logs.next_page_url}
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
