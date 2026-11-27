<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Pengguna;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class LoginController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('Auth/Login', [
            'requiresPasscode' => filled(env('LAZ_STAFF_PASSCODE')),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $passcode = env('LAZ_STAFF_PASSCODE');

        $validated = $request->validate([
            'username' => ['required', 'string', 'max:50'],
            'kode_akses' => [filled($passcode) ? 'required' : 'nullable', 'string'],
        ], [
            'username.required' => 'Username staf wajib diisi.',
            'kode_akses.required' => 'Kode akses internal wajib diisi.',
        ]);

        $pengguna = Pengguna::query()
            ->where('username', $validated['username'])
            ->first();

        if (! $pengguna) {
            return back()->withErrors([
                'username' => 'Username staf tidak ditemukan di sistem.',
            ])->onlyInput('username');
        }

        if (! $pengguna->is_aktif) {
            return back()->withErrors([
                'username' => 'Akun staf ini berstatus nonaktif. Hubungi Administrator Sistem.',
            ])->onlyInput('username');
        }

        if (filled($passcode) && ! hash_equals((string) $passcode, (string) ($validated['kode_akses'] ?? ''))) {
            return back()->withErrors([
                'kode_akses' => 'Kode akses internal tidak sesuai.',
            ])->onlyInput('username');
        }

        Auth::login($pengguna);
        $request->session()->regenerate();

        return redirect()->intended(route('dashboard'));
    }

    public function destroy(Request $request): RedirectResponse
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login');
    }
}
