import { Head, Link, usePage } from '@inertiajs/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { Menu, X } from 'lucide-react';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import type { SharedPageProps } from '@/types/database';

gsap.registerPlugin(ScrollTrigger);

interface PublicLayoutProps {
    title: string;
    children: ReactNode;
}

const NAV_LINKS = [
    { href: '#rekening', label: 'Rekening Resmi' },
    { href: '#kalkulator', label: 'Kalkulator Zakat' },
    { href: '#transparansi', label: 'Transparansi Dana' },
] as const;

export default function PublicLayout({ title, children }: PublicLayoutProps) {
    const { auth } = usePage<SharedPageProps>().props;
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const lenisRef = useRef<Lenis | null>(null);
    const menuButtonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) {
            return;
        }

        const lenis = new Lenis({
            lerp: 0.08,
            smoothWheel: true,
        });
        lenisRef.current = lenis;

        lenis.on('scroll', ScrollTrigger.update);

        const tick = (time: number) => {
            lenis.raf(time * 1000);
        };
        gsap.ticker.add(tick);
        gsap.ticker.lagSmoothing(0);

        return () => {
            gsap.ticker.remove(tick);
            lenis.destroy();
            lenisRef.current = null;
        };
    }, []);

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

    const handleAnchorClick = (href: string) => {
        setMobileMenuOpen(false);
        const target = document.querySelector(href);
        if (target instanceof HTMLElement && lenisRef.current) {
            lenisRef.current.scrollTo(target, { offset: -72 });
        }
    };

    return (
        <div className="min-h-screen bg-laz-cream text-laz-forest flex flex-col">
            <Head title={title} />

            <header className="sticky top-0 z-40 bg-laz-cream/95 border-b border-laz-gold/30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
                    <Link
                        href="/"
                        className="flex flex-col leading-tight focus-visible:outline-2 focus-visible:outline-laz-forest rounded-sm"
                    >
                        <span className="text-xs font-semibold uppercase tracking-widest text-laz-sage">
                            LAZ Amanah Madani
                        </span>
                        <span className="text-base sm:text-lg font-bold tracking-tight text-laz-forest">
                            Kota Pekanbaru
                        </span>
                    </Link>

                    <nav aria-label="Navigasi Publik" className="hidden md:flex items-center gap-8">
                        {NAV_LINKS.map((item) => (
                            <a
                                key={item.href}
                                href={item.href}
                                onClick={() => handleAnchorClick(item.href)}
                                className="text-sm font-medium text-laz-forest hover:text-laz-sage transition-colors py-2"
                            >
                                {item.label}
                            </a>
                        ))}
                    </nav>

                    <div className="flex items-center gap-3">
                        <Link
                            href={auth.user ? '/dashboard' : '/login'}
                            className="hidden sm:inline-flex items-center justify-center min-h-11 px-4 py-2 rounded-[var(--radius-button)] border border-laz-gold/60 bg-laz-surface hover:bg-laz-cream text-laz-forest text-sm font-semibold transition-colors"
                        >
                            {auth.user ? 'Buka Dashboard' : 'Portal Staf'}
                        </Link>

                        <button
                            ref={menuButtonRef}
                            type="button"
                            onClick={() => setMobileMenuOpen(true)}
                            aria-label="Buka menu navigasi"
                            aria-expanded={mobileMenuOpen}
                            className="md:hidden min-h-11 min-w-11 flex items-center justify-center rounded-[var(--radius-button)] border border-laz-gold/50 bg-laz-surface text-laz-forest"
                        >
                            <Menu className="w-5 h-5" aria-hidden="true" />
                        </button>
                    </div>
                </div>
            </header>

            {mobileMenuOpen && (
                <div className="fixed inset-0 z-50 md:hidden flex justify-end">
                    <div
                        className="fixed inset-0 bg-laz-forest/45"
                        onClick={() => setMobileMenuOpen(false)}
                        aria-hidden="true"
                    />
                    <aside
                        aria-label="Menu Navigasi Mobile"
                        className="relative w-72 max-w-[85vw] bg-laz-surface border-l border-laz-gold/30 h-full flex flex-col p-6 shadow-xl"
                    >
                        <div className="flex items-center justify-between pb-4 border-b border-laz-gold/25">
                            <span className="text-sm font-bold text-laz-forest">Menu Utama</span>
                            <button
                                type="button"
                                onClick={() => {
                                    setMobileMenuOpen(false);
                                    menuButtonRef.current?.focus();
                                }}
                                aria-label="Tutup menu navigasi"
                                className="min-h-11 min-w-11 flex items-center justify-center rounded-[var(--radius-button)] text-laz-forest hover:bg-laz-cream"
                            >
                                <X className="w-5 h-5" aria-hidden="true" />
                            </button>
                        </div>

                        <nav className="mt-6 flex flex-col gap-2" aria-label="Tautan Mobile">
                            {NAV_LINKS.map((item) => (
                                <a
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => handleAnchorClick(item.href)}
                                    className="min-h-11 px-3 flex items-center rounded-[var(--radius-button)] text-sm font-medium text-laz-forest hover:bg-laz-cream"
                                >
                                    {item.label}
                                </a>
                            ))}
                        </nav>

                        <div className="mt-auto pt-6 border-t border-laz-gold/25">
                            <Link
                                href={auth.user ? '/dashboard' : '/login'}
                                className="w-full min-h-11 flex items-center justify-center rounded-[var(--radius-button)] bg-laz-forest text-laz-surface text-sm font-semibold"
                            >
                                {auth.user ? 'Buka Dashboard' : 'Portal Staf Internal'}
                            </Link>
                        </div>
                    </aside>
                </div>
            )}

            <main className="flex-1">{children}</main>

            <footer className="bg-laz-forest text-laz-cream border-t border-laz-gold/25">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-laz-gold">
                            LAZ Amanah Madani Kota Pekanbaru
                        </p>
                        <p className="mt-2 text-sm text-laz-cream/80 max-w-md">
                            Pengelolaan dana Zakat, Infak, Sedekah, dan Wakaf dengan pemisahan rekening akad syariah serta pelaporan publik yang menjaga martabat mustahik.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-6 text-sm">
                        {NAV_LINKS.map((item) => (
                            <a
                                key={item.href}
                                href={item.href}
                                onClick={() => handleAnchorClick(item.href)}
                                className="text-laz-cream/85 hover:text-laz-gold transition-colors"
                            >
                                {item.label}
                            </a>
                        ))}
                        <Link
                            href={auth.user ? '/dashboard' : '/login'}
                            className="text-laz-gold hover:underline font-medium"
                        >
                            {auth.user ? 'Dashboard Staf' : 'Login Staf'}
                        </Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
