import { Head, Link, usePage } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { ArrowUp, LayoutDashboard, LogIn, Menu, X } from 'lucide-react';
import { type MouseEvent, type ReactNode, useEffect, useRef, useState } from 'react';
import type { SharedPageProps } from '@/types/database';

gsap.registerPlugin(ScrollTrigger);

interface PublicLayoutProps {
    title: string;
    children: ReactNode;
}

const NAV_LINKS = [
    { href: '#program', label: 'Program' },
    { href: '#rekening', label: 'Rekening Resmi' },
    { href: '#kalkulator', label: 'Kalkulator Zakat' },
    { href: '#panduan', label: 'Tata Cara' },
    { href: '#transparansi', label: 'Transparansi Dana' },
] as const;

type NavHref = (typeof NAV_LINKS)[number]['href'];

export default function PublicLayout({ title, children }: PublicLayoutProps) {
    const { auth } = usePage<SharedPageProps>().props;
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [activeSection, setActiveSection] = useState<NavHref | null>(null);
    const [showBackToTop, setShowBackToTop] = useState(false);
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
        const updateScrollState = () => {
            const scrollY = window.scrollY;
            setShowBackToTop(scrollY > 320);

            if (scrollY < 180) {
                setActiveSection(null);
                return;
            }

            const nearBottom =
                window.innerHeight + scrollY >= document.documentElement.scrollHeight - 40;
            if (nearBottom) {
                setActiveSection('#transparansi');
                return;
            }

            let current: NavHref | null = null;
            for (const item of NAV_LINKS) {
                const el = document.querySelector(item.href);
                if (el instanceof HTMLElement && el.getBoundingClientRect().top <= 140) {
                    current = item.href;
                }
            }
            setActiveSection(current);
        };

        updateScrollState();
        window.addEventListener('scroll', updateScrollState, { passive: true });
        return () => window.removeEventListener('scroll', updateScrollState);
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

    const scrollToTarget = (href: string) => {
        const target = document.querySelector(href);
        if (!(target instanceof HTMLElement)) {
            return;
        }

        if (NAV_LINKS.some((link) => link.href === href)) {
            setActiveSection(href as NavHref);
        }

        if (lenisRef.current) {
            lenisRef.current.scrollTo(target, { offset: -72 });
        } else {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const handleAnchorClick = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
        event.preventDefault();
        setMobileMenuOpen(false);
        scrollToTarget(href);
    };

    const handleMainClick = (event: MouseEvent<HTMLElement>) => {
        const target = event.target;
        if (!(target instanceof Element)) {
            return;
        }

        const anchor = target.closest('a[href^="#"]');
        if (!(anchor instanceof HTMLAnchorElement)) {
            return;
        }

        const href = anchor.getAttribute('href');
        if (href && href.length > 1) {
            event.preventDefault();
            scrollToTarget(href);
        }
    };

    const handleScrollTop = () => {
        setActiveSection(null);
        if (lenisRef.current) {
            lenisRef.current.scrollTo(0);
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    return (
        <div className="min-h-screen bg-laz-cream text-laz-forest flex flex-col">
            <Head title={title} />

            <header className="sticky top-0 z-40 bg-laz-cream/95 border-b border-laz-gold/30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
                    <Link
                        href="/"
                        className="flex items-center gap-3 focus-visible:outline-2 focus-visible:outline-laz-forest rounded-sm"
                    >
                        <img
                            src="/images/logo-laz.png"
                            alt="Logo LAZ Amanah Madani"
                            className="h-12 w-12 object-contain shrink-0"
                        />
                        <div className="flex flex-col leading-tight">
                            <span className="text-xs font-semibold uppercase tracking-widest text-laz-sage">
                                LAZ Amanah Madani
                            </span>
                            <span className="text-base sm:text-lg font-bold tracking-tight text-laz-forest">
                                Kota Pekanbaru
                            </span>
                        </div>
                    </Link>

                    <nav aria-label="Navigasi Publik" className="hidden md:flex items-center gap-8">
                        {NAV_LINKS.map((item) => {
                            const isActive = activeSection === item.href;
                            return (
                                <a
                                    key={item.href}
                                    href={item.href}
                                    onClick={(e) => handleAnchorClick(e, item.href)}
                                    aria-current={isActive ? 'location' : undefined}
                                    className={`relative text-sm font-medium transition-colors py-2 ${
                                        isActive
                                            ? 'text-laz-forest font-semibold'
                                            : 'text-laz-forest/80 hover:text-laz-forest'
                                    }`}
                                >
                                    {item.label}
                                    {isActive && (
                                        <motion.span
                                            layoutId="public-nav-underline"
                                            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                                            className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-laz-forest"
                                        />
                                    )}
                                </a>
                            );
                        })}
                    </nav>

                    <div className="flex items-center gap-3">
                        <Link
                            href={auth.user ? '/dashboard' : '/login'}
                            className="hidden sm:inline-flex items-center justify-center gap-2 min-h-11 px-4 py-2 rounded-[var(--radius-button)] bg-laz-forest hover:bg-laz-forest-hover text-laz-surface text-sm font-semibold shadow-sm transition-colors"
                        >
                            {auth.user ? (
                                <LayoutDashboard className="w-4 h-4 text-laz-gold" aria-hidden="true" />
                            ) : (
                                <LogIn className="w-4 h-4 text-laz-gold" aria-hidden="true" />
                            )}
                            <span>{auth.user ? 'Buka Dashboard' : 'Portal Staf'}</span>
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
                        aria-label="Menu Mobile"
                        className="relative w-72 max-w-[85vw] bg-laz-surface h-full p-6 flex flex-col border-l border-laz-gold/30 shadow-xl"
                    >
                        <div className="flex items-center justify-between pb-4 border-b border-laz-gold/25">
                            <span className="text-sm font-bold text-laz-forest">Menu Navigasi</span>
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

                        <nav className="mt-6 flex flex-col gap-2">
                            {NAV_LINKS.map((item) => {
                                const isActive = activeSection === item.href;
                                return (
                                    <a
                                        key={item.href}
                                        href={item.href}
                                        onClick={(e) => handleAnchorClick(e, item.href)}
                                        className={`min-h-11 px-3 flex items-center rounded-[var(--radius-button)] text-sm font-medium ${
                                            isActive
                                                ? 'bg-laz-cream text-laz-forest font-semibold border-l-2 border-laz-forest'
                                                : 'text-laz-forest hover:bg-laz-cream'
                                        }`}
                                    >
                                        {item.label}
                                    </a>
                                );
                            })}
                        </nav>

                        <div className="mt-auto pt-6 border-t border-laz-gold/25">
                            <Link
                                href={auth.user ? '/dashboard' : '/login'}
                                className="w-full min-h-11 flex items-center justify-center gap-2 rounded-[var(--radius-button)] bg-laz-forest hover:bg-laz-forest-hover text-laz-surface text-sm font-semibold transition-colors"
                            >
                                {auth.user ? (
                                    <LayoutDashboard className="w-4 h-4 text-laz-gold" aria-hidden="true" />
                                ) : (
                                    <LogIn className="w-4 h-4 text-laz-gold" aria-hidden="true" />
                                )}
                                <span>{auth.user ? 'Buka Dashboard' : 'Portal Staf Internal'}</span>
                            </Link>
                        </div>
                    </aside>
                </div>
            )}

            <main className="flex-1" onClick={handleMainClick}>
                {children}
            </main>

            <AnimatePresence>
                {showBackToTop && (
                    <motion.button
                        type="button"
                        initial={{ opacity: 0, y: 16, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 16, scale: 0.9 }}
                        transition={{ duration: 0.2 }}
                        onClick={handleScrollTop}
                        aria-label="Kembali ke atas"
                        title="Kembali ke atas"
                        className="fixed bottom-6 right-6 z-40 min-h-11 min-w-11 h-12 w-12 rounded-full bg-laz-forest hover:bg-laz-forest-hover text-laz-surface border border-laz-gold/40 shadow-lg flex items-center justify-center transition-colors"
                    >
                        <ArrowUp className="w-5 h-5" aria-hidden="true" />
                    </motion.button>
                )}
            </AnimatePresence>

            <footer className="bg-laz-forest text-laz-cream border-t border-laz-gold/25">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="flex items-start gap-3.5">
                        <img
                            src="/images/logo-laz.png"
                            alt="Logo LAZ Amanah Madani"
                            className="h-14 w-14 object-contain shrink-0"
                        />
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-widest text-laz-gold">
                                LAZ Amanah Madani Kota Pekanbaru
                            </p>
                            <p className="mt-1.5 text-sm text-laz-cream/80 max-w-md">
                                Pengelolaan dana Zakat, Infak, Sedekah, dan Wakaf dengan pemisahan rekening akad syariah serta pelaporan publik yang menjaga martabat mustahik.
                            </p>
                            <p className="mt-3 text-xs text-laz-cream/65">
                                Layanan ZISWAF Kota Pekanbaru, Riau &bull; &copy; {new Date().getFullYear()} LAZ Amanah Madani
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-6 text-sm">
                        {NAV_LINKS.map((item) => (
                            <a
                                key={item.href}
                                href={item.href}
                                onClick={(e) => handleAnchorClick(e, item.href)}
                                className="text-laz-cream/85 hover:text-laz-gold transition-colors"
                            >
                                {item.label}
                            </a>
                        ))}
                        <Link
                            href={auth.user ? '/dashboard' : '/login'}
                            className="text-laz-gold hover:text-laz-cream transition-colors font-medium"
                        >
                            {auth.user ? 'Dashboard Staf' : 'Login Staf'}
                        </Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
