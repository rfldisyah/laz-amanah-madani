import { Head, Link, useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    AlertCircle,
    ArrowLeft,
    CheckCircle2,
    Eye,
    EyeOff,
    ShieldCheck,
} from 'lucide-react';
import { type FormEvent, useState } from 'react';

const PILLARS = [
    {
        title: 'Pemisahan Akad Syariah',
        desc: 'Rekening dan kantong saldo Zakat, Infak/Sedekah, dan Wakaf terpisah secara ketat di level database.',
    },
    {
        title: 'Verifikasi 8 Asnaf Layak',
        desc: 'Penyaluran zakat hanya diproses bagi mustahik terverifikasi layak dengan masa berlaku survei 1 tahun.',
    },
    {
        title: 'Transparansi & Audit Trail',
        desc: 'Kontrol hak Amil maksimal 12,5% serta pencatatan mutasi kas terpartisi dan jejak audit otomatis.',
    },
];

export default function Login() {
    const [showPassword, setShowPassword] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        username: '',
        password: '',
    });

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        post('/login');
    };

    return (
        <div className="min-h-screen bg-laz-cream text-laz-forest flex flex-col justify-between px-4 py-6 sm:px-6 lg:px-8">
            <Head title="Login Staf" />

            <header className="max-w-5xl w-full mx-auto pt-2 flex items-center justify-between gap-4">
                <Link
                    href="/"
                    className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-laz-forest hover:text-laz-sage transition-colors rounded-[var(--radius-button)] px-2 -ml-2"
                >
                    <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                    <span>Kembali ke Portal Publik</span>
                </Link>

                <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-laz-sage">
                    <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                    Akses Internal
                </span>
            </header>

            <main className="max-w-5xl w-full mx-auto my-auto py-6">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="grid grid-cols-1 lg:grid-cols-12 rounded-[var(--radius-card)] overflow-hidden border border-laz-gold/40 bg-laz-surface shadow-sm"
                >
                    {/* Sisi Kiri: Form Login */}
                    <section
                        aria-labelledby="login-heading"
                        className="lg:col-span-6 p-6 sm:p-10 flex flex-col justify-center"
                    >
                        <div className="flex items-center gap-4 pb-6 border-b border-laz-gold/25">
                            <img
                                src="/images/logo-laz.png"
                                alt="Logo LAZ Amanah Madani"
                                className="w-16 h-16 object-contain shrink-0"
                            />
                            <div>
                                <h1
                                    id="login-heading"
                                    className="text-xl sm:text-2xl font-bold tracking-tight text-laz-forest"
                                >
                                    Portal Operasional Staf
                                </h1>
                                <p className="mt-1 text-sm text-laz-muted">
                                    Masuk menggunakan akun staf resmi yang terdaftar pada sistem.
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate>
                            {(errors.username || errors.password) && (
                                <div
                                    role="alert"
                                    className="flex items-start gap-2.5 p-3.5 rounded-[var(--radius-button)] bg-laz-danger/10 border border-laz-danger/30 text-laz-danger text-sm"
                                >
                                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
                                    <div>
                                        {errors.username && <p>{errors.username}</p>}
                                        {errors.password && <p>{errors.password}</p>}
                                    </div>
                                </div>
                            )}

                            <div>
                                <label
                                    htmlFor="username"
                                    className="block text-sm font-semibold text-laz-forest mb-1.5"
                                >
                                    Username Staf
                                </label>
                                <input
                                    id="username"
                                    name="username"
                                    type="text"
                                    autoComplete="username"
                                    required
                                    value={data.username}
                                    onChange={(e) => setData('username', e.target.value)}
                                    placeholder="Contoh: nama.staf"
                                    className="w-full min-h-11 px-4 py-2.5 rounded-[var(--radius-button)] bg-laz-cream/40 border border-laz-gold/50 text-laz-forest placeholder:text-laz-muted/65 focus:border-laz-forest focus:bg-laz-surface focus:outline-none focus:ring-2 focus:ring-laz-forest/15 text-sm transition-colors"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="password"
                                    className="block text-sm font-semibold text-laz-forest mb-1.5"
                                >
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        id="password"
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        autoComplete="current-password"
                                        required
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        placeholder="Masukkan password staf"
                                        className="w-full min-h-11 pl-4 pr-12 py-2.5 rounded-[var(--radius-button)] bg-laz-cream/40 border border-laz-gold/50 text-laz-forest placeholder:text-laz-muted/65 focus:border-laz-forest focus:bg-laz-surface focus:outline-none focus:ring-2 focus:ring-laz-forest/15 text-sm transition-colors"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((prev) => !prev)}
                                        aria-label={
                                            showPassword
                                                ? 'Sembunyikan password'
                                                : 'Tampilkan password'
                                        }
                                        aria-pressed={showPassword}
                                        className="absolute right-0.5 top-1/2 -translate-y-1/2 min-h-11 min-w-11 inline-flex items-center justify-center rounded-[var(--radius-button)] text-laz-muted hover:text-laz-forest transition-colors"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="w-4 h-4" aria-hidden="true" />
                                        ) : (
                                            <Eye className="w-4 h-4" aria-hidden="true" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full min-h-11 px-5 py-2.5 rounded-[var(--radius-button)] bg-laz-forest hover:bg-laz-forest-hover disabled:opacity-60 text-laz-surface font-semibold text-sm transition-colors"
                            >
                                {processing ? 'Memverifikasi Akses…' : 'Masuk ke Dashboard'}
                            </button>
                        </form>
                    </section>

                    {/* Sisi Kanan: Panel Informasi LAZ Amanah Madani */}
                    <aside
                        aria-label="Informasi Lembaga"
                        className="lg:col-span-6 bg-laz-forest text-laz-cream p-6 sm:p-10 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-laz-gold/25"
                    >
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-widest text-laz-gold">
                                Lembaga Amil Zakat
                            </p>
                            <h2 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-laz-surface">
                                LAZ Amanah Madani
                                <span className="block text-lg sm:text-xl font-medium text-laz-gold mt-1">
                                    Kota Pekanbaru
                                </span>
                            </h2>
                            <p className="mt-4 text-sm leading-relaxed text-laz-cream/85">
                                Sistem manajemen penghimpunan, verifikasi mustahik, dan penyaluran dana Zakat, Infak, Sedekah, serta Wakaf yang amanah, akuntabel, dan sesuai syariah.
                            </p>

                            <ul className="mt-8 space-y-4">
                                {PILLARS.map((item) => (
                                    <li key={item.title} className="flex items-start gap-3">
                                        <CheckCircle2
                                            className="w-5 h-5 text-laz-gold shrink-0 mt-0.5"
                                            aria-hidden="true"
                                        />
                                        <div>
                                            <p className="text-sm font-semibold text-laz-surface">
                                                {item.title}
                                            </p>
                                            <p className="text-xs leading-relaxed text-laz-cream/75 mt-0.5">
                                                {item.desc}
                                            </p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="mt-8 pt-5 border-t border-laz-gold/20 text-xs text-laz-cream/70">
                            <p>
                                Seluruh aktivitas pencatatan dana diawasi oleh prosedur RDBMS dan tercatat dalam log audit sistem.
                            </p>
                        </div>
                    </aside>
                </motion.div>
            </main>

            <footer className="max-w-5xl w-full mx-auto pb-2 text-xs text-laz-muted text-center sm:text-left">
                <p>Akses terbatas untuk staf resmi LAZ Amanah Madani Kota Pekanbaru.</p>
            </footer>
        </div>
    );
}
