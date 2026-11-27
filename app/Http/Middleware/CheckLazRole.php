<?php

namespace App\Http\Middleware;

use App\Models\Pengguna;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class CheckLazRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user instanceof Pengguna) {
            return redirect()->route('login');
        }

        if (! $user->is_aktif) {
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect()->route('login')->withErrors([
                'username' => 'Akun staf Anda sedang dinonaktifkan. Hubungi Administrator Sistem.',
            ]);
        }

        if ($roles !== [] && ! $user->hasRole(...$roles)) {
            abort(403, 'Akses ditolak. Peran Anda tidak memiliki otorisasi untuk halaman ini.');
        }

        return $next($request);
    }
}
