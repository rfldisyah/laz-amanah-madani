import { Head, useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { AlertCircle, KeyRound } from 'lucide-react';
import { type FormEvent } from 'react';

interface LoginProps {
    requiresPasscode: boolean;
}

export default function Login({ requiresPasscode }: LoginProps) {
    const { data, setData, post, processing, errors } = useForm({
        username: '',
        kode_akses: '',
    });

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        post('/login');
    };

    return (
        <div className="min-h-screen bg-laz-cream text-laz-forest flex flex-col justify-between px-4 py-8 sm:px-6 lg:px-8">
            <Head title="Masuk Staf Internal" />

            <header className="max-w-md w-full mx-auto pt-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-laz-sage">
                    LAZ Amanah Madani Kota Pekanbaru
                </p>
            </header>

            <main className="max-w-md w-full mx-auto my-auto py-8">
                <motion.section
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    aria-labelledby="login-heading"
                    className="bg-laz-surface rounded-[var(--radius-card)] border border-laz-gold/35 p-6 sm:p-8 shadow-sm"
                >
                    <div className="flex items-start gap-3.5 pb-6 border-b border-laz-gold/25">
                        <img
                            src="/images/logo-laz.png"
                            alt="Logo LAZ Amanah Madani"
                            className="w-16 h-16 object-contain shrink-0"
                        />
                        <div>
                            <h1 id="login-heading" className="text-xl font-bold tracking-tight text-laz-forest">
                                Portal Operasional Staf
                            </h1>
                            <p className="mt-1 text-sm text-laz-muted">
                                Masuk menggunakan username staf yang terdaftar pada sistem internal.
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate>
                        {(errors.username || errors.kode_akses) && (
                            <div
                                role="alert"
                                className="flex items-start gap-2.5 p-3.5 rounded-[var(--radius-button)] bg-laz-danger/10 border border-laz-danger/30 text-laz-danger text-sm"
                            >
                                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
                                <div>
                                    {errors.username && <p>{errors.username}</p>}
                                    {errors.kode_akses && <p>{errors.kode_akses}</p>}
                                </div>
                            </div>
                        )}

                        <div>
                            <label
                                htmlFor="username"
                                className="block text-sm font-medium text-laz-forest mb-1.5"
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
                                placeholder="Contoh: ahmad.admin"
                                className="w-full min-h-11 px-3.5 py-2.5 rounded-[var(--radius-button)] bg-laz-surface border border-laz-gold/50 text-laz-forest placeholder:text-laz-muted/60 focus:border-laz-forest focus:outline-none text-sm"
                            />
                        </div>

                        {requiresPasscode && (
                            <div>
                                <label
                                    htmlFor="kode_akses"
                                    className="block text-sm font-medium text-laz-forest mb-1.5"
                                >
                                    Kode Akses Internal
                                </label>
                                <div className="relative">
                                    <input
                                        id="kode_akses"
                                        name="kode_akses"
                                        type="password"
                                        required
                                        value={data.kode_akses}
                                        onChange={(e) => setData('kode_akses', e.target.value)}
                                        placeholder="Masukkan kode akses"
                                        className="w-full min-h-11 pl-3.5 pr-10 py-2.5 rounded-[var(--radius-button)] bg-laz-surface border border-laz-gold/50 text-laz-forest placeholder:text-laz-muted/60 focus:border-laz-forest focus:outline-none text-sm"
                                    />
                                    <KeyRound
                                        className="w-4 h-4 text-laz-muted absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                                        aria-hidden="true"
                                    />
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full min-h-11 px-5 py-2.5 rounded-[var(--radius-button)] bg-laz-forest hover:bg-laz-forest-hover disabled:opacity-60 text-laz-surface font-semibold text-sm transition-colors"
                        >
                            {processing ? 'Memverifikasi Akses...' : 'Masuk ke Dashboard'}
                        </button>
                    </form>
                </motion.section>
            </main>

            <footer className="max-w-md w-full mx-auto pb-2 text-xs text-laz-muted">
                <p>Akses terbatas untuk staf resmi LAZ Amanah Madani Kota Pekanbaru.</p>
            </footer>
        </div>
    );
}
