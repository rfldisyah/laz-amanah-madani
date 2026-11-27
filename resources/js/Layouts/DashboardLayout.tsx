import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    BookOpen,
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

    const renderNavItems = (isCollapsed: boolean, onNavigate?: () => void) => (
        <div className="space-y-6">
            {navGroups.map((group) => (
                <div key={group.groupLabel}>
                    {!isCollapsed && (
                        <p className="px-3 mb-2 text-xs font-medium uppercase tracking-wider text-laz-gold/80 truncate">
                            {group.groupLabel}
                        </p>
                    )}
                    <div className="space-y-1.5">
                        {group.items.map((item) => {
                            const Icon = item.icon;
                            const isActive = item.href ? currentUrl.startsWith(item.href) && item.href !== '/' : false;

                            if (item.comingSoon || !item.href) {
                                return (
                                    <div
                                        key={item.id}
                                        aria-disabled="true"
                                        title={`${item.label} (Segera hadir)`}
                                        className={`flex items-center ${
                                            isCollapsed ? 'justify-center px-2' : 'justify-between px-3'
                                        } py-2.5 min-h-11 rounded-[var(--radius-button)] text-laz-cream/50 text-sm cursor-not-allowed`}
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
                                    } py-2.5 min-h-11 rounded-[var(--radius-button)] text-sm font-medium transition-colors ${
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

    return (
        <div className="min-h-screen bg-laz-cream text-laz-forest flex">
            <Head title={title} />

            {/* Desktop Sidebar */}
            <aside
                aria-label="Navigasi Operasional"
                className={`hidden lg:flex lg:flex-col bg-laz-forest text-laz-cream shrink-0 border-r border-laz-gold/20 transition-[width] duration-200 ${
                    collapsed ? 'lg:w-20' : 'lg:w-72'
                }`}
            >
                <div className="px-4 py-5 border-b border-laz-gold/20 flex items-center justify-between gap-2">
                    {!collapsed && (
                        <div className="flex items-center gap-3 min-w-0">
                            <img
                                src="/images/logo-laz.png"
                                alt="Logo LAZ Amanah Madani"
                                className="h-12 w-12 rounded-xl bg-laz-cream p-1 object-contain shrink-0"
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

                <nav className="flex-1 px-3 py-6 overflow-y-auto" aria-label="Menu Utama">
                    {renderNavItems(collapsed)}
                </nav>

                {user && (
                    <div className="p-3 border-t border-laz-gold/20 space-y-3">
                        {!collapsed && (
                            <div className="px-3 py-2.5 rounded-[var(--radius-button)] bg-laz-forest-hover/80 border border-laz-gold/20">
                                <p className="text-sm font-semibold text-laz-surface truncate">
                                    {user.nama_lengkap}
                                </p>
                                <p className="text-xs text-laz-gold mt-0.5 truncate">{roleLabel}</p>
                                <p className="text-xs text-laz-cream/70 mt-0.5 truncate">{user.jabatan}</p>
                            </div>
                        )}

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
                                    className="h-11 w-11 rounded-xl bg-laz-cream p-1 object-contain shrink-0"
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
