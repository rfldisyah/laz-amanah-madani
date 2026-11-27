<?php

use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\MustahikVerifikasiController;
use App\Http\Controllers\PenghimpunanController;
use App\Http\Controllers\PenyaluranController;
use App\Http\Controllers\Public\LandingTransparansiController;
use Illuminate\Support\Facades\Route;

Route::get('/', LandingTransparansiController::class)->name('home');

Route::middleware('guest')->group(function (): void {
    Route::get('/login', [LoginController::class, 'create'])->name('login');
    Route::post('/login', [LoginController::class, 'store'])->name('login.store');
});

Route::middleware(['auth', 'laz.role:admin_sistem,verifikator,petugas_penghimpunan,manajer_penyaluran'])->group(function (): void {
    Route::post('/logout', [LoginController::class, 'destroy'])->name('logout');
    Route::get('/dashboard', DashboardController::class)->name('dashboard');
});

Route::middleware(['auth', 'laz.role:petugas_penghimpunan,admin_sistem'])->group(function (): void {
    Route::get('/muzaki', [PenghimpunanController::class, 'muzakiIndex'])->name('muzaki.index');
    Route::post('/muzaki', [PenghimpunanController::class, 'muzakiStore'])->name('muzaki.store');
    Route::put('/muzaki/{muzaki}', [PenghimpunanController::class, 'muzakiUpdate'])->name('muzaki.update');
    Route::delete('/muzaki/{muzaki}', [PenghimpunanController::class, 'muzakiDestroy'])->name('muzaki.destroy');

    Route::get('/penghimpunan', [PenghimpunanController::class, 'index'])->name('penghimpunan.index');
    Route::post('/penghimpunan', [PenghimpunanController::class, 'store'])->name('penghimpunan.store');
});

Route::middleware(['auth', 'laz.role:verifikator,admin_sistem'])->group(function (): void {
    Route::get('/mustahik', [MustahikVerifikasiController::class, 'index'])->name('mustahik.index');
    Route::post('/mustahik', [MustahikVerifikasiController::class, 'store'])->name('mustahik.store');
    Route::post('/mustahik/{mustahik}/verifikasi', [MustahikVerifikasiController::class, 'verify'])->name('mustahik.verify');
});

Route::middleware(['auth', 'laz.role:petugas_penghimpunan,verifikator,admin_sistem'])->group(function (): void {
    Route::get('/penyaluran', [PenyaluranController::class, 'index'])->name('penyaluran.index');
    Route::post('/penyaluran', [PenyaluranController::class, 'store'])->name('penyaluran.store');
    Route::post('/penyaluran/{penyaluran}/detail', [PenyaluranController::class, 'addDetail'])->name('penyaluran.detail.store');
});
