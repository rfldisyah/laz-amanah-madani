import { Head, Link, router, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    BookOpen,
    Calendar,
    ChevronLeft,
    ChevronRight,
    ClipboardCheck,
    Database,
    ExternalLink,
    FileCheck2,
    FileSpreadsheet,
    HandCoins,
    HelpCircle,
    History,
    LogOut,
    Menu,
    ShieldCheck,
    Users,
    Wallet,
    X,
} from 'lucide-react';
import { type ComponentType, type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import type { PeranPengguna, SharedPageProps } from '@/types/database';

interface DashboardLayoutProps {
    title: string;
    children: ReactNode;
}

interface NavItem {
    id: string;
    label: string;
    href?: string;
    icon: ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
    comingSoon?: boolean;
}

interface NavGroup {
    groupLabel: string;
    items: NavItem[];
}

const ROLE_LABELS: Record<PeranPengguna, string> = {
    admin_sistem: 'Administrator Sistem',
    verifikator: 'Tim Survei & Verifikasi',
    petugas_penghimpunan: 'Petugas Penghimpunan',
    manajer_penyaluran: 'Manajer Penyaluran',
};

function getRoleNavItems(peran: PeranPengguna): NavItem[] {
    switch (peran) {
        case 'petugas_penghimpunan':
            return [
                { id: 'muzaki', label: 'Data Muzaki', href: '/muzaki', icon: Users },
                { id: 'penghimpunan', label: 'Catat Penghimpunan', href: '/penghimpunan', icon: HandCoins },
                { id: 'draft-sk', label: 'Draft SK Penyaluran', href: '/penyaluran', icon: FileSpreadsheet },
            ];
        case 'verifikator':
            return [
                { id: 'mustahik', label: 'Mustahik & Survei', href: '/mustahik', icon: ClipboardCheck },
                { id: 'draft-sk', label: 'Draft SK Penyaluran', href: '/penyaluran', icon: FileSpreadsheet },
            ];
        case 'manajer_penyaluran':
            return [
                { id: 'otorisasi-sk', label: 'Otorisasi & Pencairan', href: '/penyaluran/otorisasi', icon: FileCheck2 },
            ];
        case 'admin_sistem':
            return [
                { id: 'muzaki', label: 'Data Muzaki', href: '/muzaki', icon: Users },
                { id: 'penghimpunan', label: 'Catat Penghimpunan', href: '/penghimpunan', icon: HandCoins },
                { id: 'mustahik', label: 'Mustahik & Survei', href: '/mustahik', icon: ClipboardCheck },
                { id: 'draft-sk', label: 'Draft SK Penyaluran', href: '/penyaluran', icon: FileSpreadsheet },
                { id: 'otorisasi-sk', label: 'Otorisasi & Pencairan', href: '/penyaluran/otorisasi', icon: FileCheck2 },
                { id: 'master', label: 'Master Data Lembaga', href: '/admin/master', icon: Database },
                { id: 'mutasi', label: 'Buku Besar Terpartisi', href: '/admin/mutasi', icon: BookOpen },
                { id: 'audit', label: 'Audit Trail', href: '/admin/audit', icon: History },
            ];
    }
}

export default function DashboardLayout({ title, children }: DashboardLayoutProps) {
    const { auth } = usePage<SharedPageProps>().props;
    const user = auth.user;
    const currentUrl = usePage().url;

    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
    const menuButtonRef = useRef<HTMLButtonElement>(null);

    const navGroups = useMemo<NavGroup[]>(() => {
        const groups: NavGroup[] = [
            {
                groupLabel: 'Ringkasan',
                items: [
                    { id: 'dashboard', label: 'Ringkasan Saldo', href: '/dashboard', icon: Wallet },
                    { id: 'panduan', label: 'Panduan Sistem', href: '/dashboard/panduan', icon: HelpCircle },
                    { id: 'public-portal', label: 'Portal Publik', href: '/', icon: ExternalLink },
                ],
            },
        ];

        if (user) {
            groups.push({
                groupLabel: ROLE_LABELS[user.peran],
                items: getRoleNavItems(user.peran),
            });
        }

        return groups;
    }, [user]);

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

    const renderNavItems = (isCollapsed: boolean, onNavigate?: () => void) => {
        const pathname = currentUrl.split('?')[0];

        return (
            <div className="space-y-5">
                {navGroups.map((group) => (
                    <div key={group.groupLabel}>
                        {!isCollapsed && (
                            <p className="px-3 mb-2 text-[11px] font-medium uppercase tracking-wider text-laz-gold/80 truncate">
                                {group.groupLabel}
                            </p>
                        )}
                        <div className="space-y-1">
                            {group.items.map((item) => {
                                const Icon = item.icon;
                                const isActive = item.href
                                    ? item.href === '/dashboard' || item.href === '/penyaluran'
                                        ? pathname === item.href
                                        : pathname === item.href || pathname.startsWith(`${item.href}/`)
                                    : false;

                                if (item.comingSoon || !item.href) {
                                    return (
                                        <div
                                            key={item.id}
                                            aria-disabled="true"
                                            title={`${item.label} (Segera hadir)`}
                                            className={`flex items-center ${
                                                isCollapsed ? 'justify-center px-2' : 'justify-between px-3'
                                            } py-2 min-h-9 rounded-[var(--radius-button)] text-laz-cream/50 text-sm cursor-not-allowed`}
                                        >
                                            <span className="flex items-center gap-3 min-w-0">
                                                <Icon className="w-4 h-4 shrink-0" aria-hidden={true} />
                                                {!isCollapsed && <span className="truncate">{item.label}</span>}
                                            </span>
                                            {!isCollapsed && (
                                                <span className="px-2 py-0.5 rounded-[var(--radius-badge)] border border-laz-gold/25 text-[10px] font-medium uppercase tracking-wider text-laz-gold/75 shrink-0">
                                                    Segera
                                                </span>
                                            )}
                                        </div>
                                    );
                                }

                                return (
                                    <Link
                                        key={item.id}
                                        href={item.href}
                                        onClick={onNavigate}
                                        aria-label={isCollapsed ? item.label : undefined}
                                        title={isCollapsed ? item.label : undefined}
                                        className={`flex items-center gap-3 ${
                                            isCollapsed ? 'justify-center px-2' : 'px-3'
                                        } py-2 min-h-9 rounded-[var(--radius-button)] text-sm font-medium transition-colors ${
                                            isActive
                                                ? 'bg-laz-forest-hover text-laz-surface border border-laz-gold/35'
                                                : 'text-laz-cream/85 hover:bg-laz-forest-hover/70 hover:text-laz-surface'
                                        }`}
                                    >
                                        <Icon
                                            className={`w-4 h-4 shrink-0 ${isActive ? 'text-laz-gold' : 'text-laz-cream/75'}`}
                                            aria-hidden={true}
                                        />
                                        {!isCollapsed && <span className="truncate">{item.label}</span>}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-laz-cream text-laz-forest flex">
            <Head title={title} />

            {/* Desktop Sidebar */}
            <aside
                aria-label="Navigasi Operasional"
                className={`hidden lg:flex lg:flex-col lg:sticky lg:top-0 lg:h-screen bg-laz-forest text-laz-cream shrink-0 border-r border-laz-gold/20 transition-[width] duration-200 ${
                    collapsed ? 'lg:w-20' : 'lg:w-72'
                }`}
            >
                <div className="px-4 py-3.5 border-b border-laz-gold/20 flex items-center justify-between gap-2">
                    {!collapsed && (
                        <div className="flex items-center gap-3 min-w-0">
                            <img
                                src="/images/logo-laz.png"
                                alt="Logo LAZ Amanah Madani"
                                className="h-11 w-11 object-contain shrink-0"
                            />
                            <div className="min-w-0">
                                <p className="text-xs font-medium tracking-wider uppercase text-laz-gold truncate">
                                    LAZ Amanah Madani
                                </p>
                                <h1 className="mt-0.5 text-base font-semibold tracking-tight text-laz-surface truncate">
                                    Kota Pekanbaru
                                </h1>
                            </div>
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={() => setCollapsed((prev) => !prev)}
                        aria-label={collapsed ? 'Perluas sidebar navigasi' : 'Ciutkan sidebar navigasi'}
                        aria-expanded={!collapsed}
                        className="min-h-11 min-w-11 flex items-center justify-center rounded-[var(--radius-button)] text-laz-cream/85 hover:bg-laz-forest-hover transition-colors shrink-0"
                    >
                        {collapsed ? (
                            <ChevronRight className="w-4 h-4" aria-hidden="true" />
                        ) : (
                            <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                        )}
                    </button>
                </div>

                <nav className="flex-1 px-3 pt-5 pb-4 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Menu Utama">
                    {renderNavItems(collapsed)}
                </nav>

                {user && (
                    <div className="p-3 border-t border-laz-gold/20">
                        <button
                            type="button"
                            onClick={handleLogout}
                            aria-label="Keluar Sesi"
                            title={collapsed ? 'Keluar Sesi' : undefined}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 min-h-11 rounded-[var(--radius-button)] border border-laz-gold/35 text-laz-cream hover:bg-laz-forest-hover transition-colors text-sm font-medium"
                        >
                            <LogOut className="w-4 h-4 shrink-0" aria-hidden="true" />
                            {!collapsed && <span>Keluar Sesi</span>}
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
                        <div className="px-5 py-4 border-b border-laz-gold/20 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-3 min-w-0">
                                <img
                                    src="/images/logo-laz.png"
                                    alt="Logo LAZ Amanah Madani"
                                    className="h-11 w-11 object-contain shrink-0"
                                />
                                <div className="min-w-0">
                                    <p className="text-xs font-medium uppercase tracking-wider text-laz-gold truncate">
                                        LAZ Amanah Madani
                                    </p>
                                    <p className="text-base font-semibold text-laz-surface truncate">
                                        Kota Pekanbaru
                                    </p>
                                </div>
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

                        <nav className="flex-1 px-4 py-5 overflow-y-auto">
                            {renderNavItems(false, () => setMobileMenuOpen(false))}
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
                <header className="sticky top-0 z-30 bg-laz-surface/95 backdrop-blur-xs border-b border-laz-gold/30 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
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
                        <div className="flex items-center gap-3 shrink-0">
                            <span className="hidden xl:inline-flex items-center gap-1.5 text-xs font-medium text-laz-muted">
                                <Calendar className="w-3.5 h-3.5 text-laz-sage" aria-hidden="true" />
                                <span>
                                    {new Intl.DateTimeFormat('id-ID', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric',
                                    }).format(new Date())}
                                </span>
                            </span>

                            <span className="hidden xl:block h-5 w-px bg-laz-gold/35" aria-hidden="true" />

                            <Link
                                href="/dashboard/panduan"
                                aria-label="Panduan Sistem"
                                title="Panduan Sistem"
                                className="inline-flex h-10 items-center gap-1.5 px-3 rounded-[var(--radius-button)] border border-laz-gold/40 bg-laz-cream/60 hover:bg-laz-cream text-xs font-semibold text-laz-forest transition-colors"
                            >
                                <HelpCircle className="w-4 h-4 text-laz-sage" aria-hidden="true" />
                                <span className="hidden md:inline">Panduan</span>
                            </Link>

                            <span className="hidden sm:block h-6 w-px bg-laz-gold/35" aria-hidden="true" />

                            <div className="hidden sm:flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-laz-forest text-laz-gold flex items-center justify-center shrink-0">
                                    <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                                </div>
                                <div className="leading-tight text-left">
                                    <p className="text-xs font-bold text-laz-forest">
                                        {user.nama_lengkap}
                                    </p>
                                    <p className="mt-0.5 text-[11px] text-laz-muted">
                                        {user.jabatan}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </header>

                <motion.main
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.22, ease: 'easeOut' }}
                    className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto"
                >
                    {children}
                </motion.main>
            </div>
        </div>
    );
}
