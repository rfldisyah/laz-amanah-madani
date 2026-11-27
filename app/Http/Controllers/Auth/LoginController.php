<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Pengguna;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class LoginController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('Auth/Login');
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'username' => ['required', 'string', 'max:50'],
            'password' => ['required', 'string'],
        ], [
            'username.required' => 'Username staf wajib diisi.',
            'password.required' => 'Password wajib diisi.',
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

        if (! $pengguna->password || ! Hash::check($validated['password'], (string) $pengguna->password)) {
            return back()->withErrors([
                'password' => 'Password yang Anda masukkan tidak sesuai.',
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
