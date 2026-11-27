import { Head, Link, router, usePage } from '@inertiajs/react';
import { LogOut, Menu, ShieldCheck, Wallet, X } from 'lucide-react';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import type { PeranPengguna, SharedPageProps } from '@/types/database';

interface DashboardLayoutProps {
    title: string;
    children: ReactNode;
}

const ROLE_LABELS: Record<PeranPengguna, string> = {
    admin_sistem: 'Administrator Sistem',
    verifikator: 'Tim Survei & Verifikasi',
    petugas_penghimpunan: 'Petugas Penghimpunan',
    manajer_penyaluran: 'Manajer Penyaluran',
};

export default function DashboardLayout({ title, children }: DashboardLayoutProps) {
    const { auth } = usePage<SharedPageProps>().props;
    const user = auth.user;
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const menuButtonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (!mobileMenuOpen) {
            return;
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setMobileMenuOpen(false);
                menuButtonRef.current?.focus();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [mobileMenuOpen]);

    const handleLogout = () => {
        router.post('/logout');
    };

    const roleLabel = user ? ROLE_LABELS[user.peran] : '';

    return (
        <div className="min-h-screen bg-laz-cream text-laz-forest flex">
            <Head title={title} />

            {/* Desktop Sidebar */}
            <aside
                aria-label="Navigasi Operasional"
                className="hidden lg:flex lg:w-72 lg:flex-col bg-laz-forest text-laz-cream shrink-0 border-r border-laz-gold/20"
            >
                <div className="px-6 py-6 border-b border-laz-gold/20">
                    <p className="text-xs font-medium tracking-wider uppercase text-laz-gold">
                        LAZ Amanah Madani
                    </p>
                    <h1 className="mt-1 text-lg font-semibold tracking-tight text-laz-surface">
                        Kota Pekanbaru
                    </h1>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-6" aria-label="Menu Utama">
                    <div>
                        <p className="px-3 mb-2 text-xs font-medium uppercase tracking-wider text-laz-gold/80">
                            Operasional
                        </p>
                        <Link
                            href="/dashboard"
                            className="flex items-center gap-3 px-3 py-3 min-h-11 rounded-[var(--radius-button)] bg-laz-forest-hover text-laz-surface font-medium border border-laz-gold/30"
                        >
                            <Wallet className="w-4 h-4 text-laz-gold shrink-0" aria-hidden="true" />
                            <span>Ringkasan Dana</span>
                        </Link>
                    </div>
                </nav>

                {user && (
                    <div className="p-4 border-t border-laz-gold/20 space-y-3">
                        <div className="px-3 py-2.5 rounded-[var(--radius-button)] bg-laz-forest-hover/80 border border-laz-gold/20">
                            <p className="text-sm font-semibold text-laz-surface truncate">
                                {user.nama_lengkap}
                            </p>
                            <p className="text-xs text-laz-gold mt-0.5 truncate">{roleLabel}</p>
                            <p className="text-xs text-laz-cream/70 mt-0.5 truncate">{user.jabatan}</p>
                        </div>

                        <button
                            type="button"
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 min-h-11 rounded-[var(--radius-button)] border border-laz-gold/35 text-laz-cream hover:bg-laz-forest-hover transition-colors text-sm font-medium"
                        >
                            <LogOut className="w-4 h-4" aria-hidden="true" />
                            <span>Keluar Sesi</span>
                        </button>
                    </div>
                )}
            </aside>

            {/* Mobile Drawer */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 z-50 lg:hidden flex">
                    <div
                        className="fixed inset-0 bg-laz-forest/50"
                        onClick={() => setMobileMenuOpen(false)}
                        aria-hidden="true"
                    />
                    <aside
                        aria-label="Menu Mobile"
                        className="relative w-72 max-w-[85vw] bg-laz-forest text-laz-cream flex flex-col h-full shadow-xl"
                    >
                        <div className="px-5 py-4 border-b border-laz-gold/20 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium uppercase tracking-wider text-laz-gold">
                                    LAZ Amanah Madani
                                </p>
                                <p className="text-base font-semibold text-laz-surface">
                                    Kota Pekanbaru
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setMobileMenuOpen(false);
                                    menuButtonRef.current?.focus();
                                }}
                                aria-label="Tutup menu navigasi"
                                className="p-2.5 min-h-11 min-w-11 flex items-center justify-center rounded-[var(--radius-button)] text-laz-cream hover:bg-laz-forest-hover"
                            >
                                <X className="w-5 h-5" aria-hidden="true" />
                            </button>
                        </div>

                        <nav className="flex-1 px-4 py-5 space-y-2">
                            <Link
                                href="/dashboard"
                                onClick={() => setMobileMenuOpen(false)}
                                className="flex items-center gap-3 px-3 py-3 min-h-11 rounded-[var(--radius-button)] bg-laz-forest-hover text-laz-surface font-medium border border-laz-gold/30"
                            >
                                <Wallet className="w-4 h-4 text-laz-gold" aria-hidden="true" />
                                <span>Ringkasan Dana</span>
                            </Link>
                        </nav>

                        {user && (
                            <div className="p-4 border-t border-laz-gold/20 space-y-3">
                                <div className="px-3 py-2 rounded-[var(--radius-button)] bg-laz-forest-hover/80">
                                    <p className="text-sm font-semibold text-laz-surface truncate">
                                        {user.nama_lengkap}
                                    </p>
                                    <p className="text-xs text-laz-gold mt-0.5">{roleLabel}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleLogout}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 min-h-11 rounded-[var(--radius-button)] border border-laz-gold/35 text-laz-cream hover:bg-laz-forest-hover text-sm font-medium"
                                >
                                    <LogOut className="w-4 h-4" aria-hidden="true" />
                                    <span>Keluar Sesi</span>
                                </button>
                            </div>
                        )}
                    </aside>
                </div>
            )}

            {/* Main Content Column */}
            <div className="flex-1 flex flex-col min-w-0">
                <header className="bg-laz-surface border-b border-laz-gold/30 px-4 sm:px-8 py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <button
                            ref={menuButtonRef}
                            type="button"
                            onClick={() => setMobileMenuOpen(true)}
                            aria-label="Buka menu navigasi"
                            aria-expanded={mobileMenuOpen}
                            className="lg:hidden p-2.5 min-h-11 min-w-11 flex items-center justify-center rounded-[var(--radius-button)] border border-laz-gold/40 text-laz-forest hover:bg-laz-cream"
                        >
                            <Menu className="w-5 h-5" aria-hidden="true" />
                        </button>
                        <h2 className="text-lg sm:text-xl font-semibold text-laz-forest truncate">
                            {title}
                        </h2>
                    </div>

                    {user && (
                        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius-badge)] bg-laz-cream border border-laz-gold/40 text-xs font-medium text-laz-forest">
                            <ShieldCheck className="w-3.5 h-3.5 text-laz-sage" aria-hidden="true" />
                            <span>{roleLabel}</span>
                        </div>
                    )}
                </header>

                <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
