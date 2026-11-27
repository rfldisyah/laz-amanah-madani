<?php

namespace App\Http\Controllers;

use App\Models\Asnaf;
use App\Models\Mustahik;
use App\Models\SurveiVerifikasiMustahik;
use App\Support\DatabaseErrorHelper;
use Carbon\Carbon;
use Illuminate\Database\QueryException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class MustahikVerifikasiController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->query('search', ''));
        $status = (string) $request->query('status', 'SEMUA');
        $asnafId = (string) $request->query('id_asnaf', '');

        $mustahik = Mustahik::query()
            ->with([
                'asnaf:id_asnaf,kode_asnaf,nama_asnaf',
                'verifikator:id_pengguna,nama_lengkap',
            ])
            ->when($search !== '', function ($query) use ($search): void {
                $query->where(function ($sub) use ($search): void {
                    $sub->where('nama_lengkap', 'like', "%{$search}%")
                        ->orWhere('nik', 'like', "%{$search}%")
                        ->orWhere('alamat_kecamatan', 'like', "%{$search}%");
                });
            })
            ->when(in_array($status, ['BELUM_VERIFIKASI', 'LAYAK', 'TIDAK_LAYAK', 'KEDALUWARSA'], true), function ($query) use ($status): void {
                $query->where('status_kelayakan', $status);
            })
            ->when($asnafId !== '' && ctype_digit($asnafId), function ($query) use ($asnafId): void {
                $query->where('id_asnaf', (int) $asnafId);
            })
            ->orderByRaw("FIELD(status_kelayakan, 'BELUM_VERIFIKASI', 'LAYAK', 'KEDALUWARSA', 'TIDAK_LAYAK')")
            ->orderByDesc('id_mustahik')
            ->paginate(15)
            ->withQueryString();

        $asnafList = Asnaf::query()
            ->orderBy('id_asnaf')
            ->get(['id_asnaf', 'kode_asnaf', 'nama_asnaf', 'maks_persen']);

        $riwayatSurvei = SurveiVerifikasiMustahik::query()
            ->with([
                'mustahik:id_mustahik,nik,nama_lengkap',
                'verifikator:id_pengguna,nama_lengkap',
                'asnafRekomendasi:id_asnaf,kode_asnaf,nama_asnaf',
            ])
            ->orderByDesc('id_survei')
            ->limit(15)
            ->get();

        return Inertia::render('Mustahik/Index', [
            'mustahik' => $mustahik,
            'asnafList' => $asnafList,
            'riwayatSurvei' => $riwayatSurvei,
            'filters' => [
                'search' => $search,
                'status' => $status,
                'id_asnaf' => $asnafId,
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'nik' => ['required', 'digits:16', 'unique:mustahik,nik'],
            'nama_lengkap' => ['required', 'string', 'max:120'],
            'id_asnaf' => ['required', 'integer', 'exists:asnaf,id_asnaf'],
            'alamat_kecamatan' => ['required', 'string', 'max:100'],
        ], [
            'nik.required' => 'NIK 16 digit wajib diisi.',
            'nik.digits' => 'NIK mustahik harus tepat 16 digit angka.',
            'nik.unique' => 'NIK sudah terdaftar pada data mustahik.',
            'nama_lengkap.required' => 'Nama lengkap mustahik wajib diisi.',
            'id_asnaf.required' => 'Pilih golongan asnaf terlebih dahulu.',
            'alamat_kecamatan.required' => 'Alamat kecamatan wajib diisi.',
        ]);

        try {
            Mustahik::query()->create([
                'nik' => $validated['nik'],
                'nama_lengkap' => $validated['nama_lengkap'],
                'id_asnaf' => (int) $validated['id_asnaf'],
                'id_verifikator' => null,
                'alamat_kecamatan' => $validated['alamat_kecamatan'],
                'status_kelayakan' => 'BELUM_VERIFIKASI',
                'tgl_verifikasi' => null,
                'tgl_kedaluwarsa' => null,
            ]);
        } catch (QueryException $exception) {
            return back()->withErrors([
                'db_error' => DatabaseErrorHelper::extractMessage($exception),
            ]);
        }

        return back()->with('success', "Calon mustahik {$validated['nama_lengkap']} berhasil didaftarkan (BELUM_VERIFIKASI).");
    }

    public function verify(Request $request, Mustahik $mustahik): RedirectResponse
    {
        $validated = $request->validate([
            'id_asnaf_rekom' => ['required', 'integer', 'exists:asnaf,id_asnaf'],
            'tgl_survei' => ['required', 'date'],
            'skor_kelayakan' => ['required', 'integer', 'min:0', 'max:100'],
            'hasil_verifikasi' => ['required', Rule::in(['LAYAK', 'TIDAK_LAYAK'])],
            'catatan_survei' => ['nullable', 'string', 'max:200'],
        ], [
            'id_asnaf_rekom.required' => 'Pilih rekomendasi golongan asnaf.',
            'tgl_survei.required' => 'Tanggal survei wajib diisi.',
            'skor_kelayakan.min' => 'Skor kelayakan minimal 0.',
            'skor_kelayakan.max' => 'Skor kelayakan maksimal 100.',
            'hasil_verifikasi.required' => 'Pilih keputusan kelayakan.',
        ]);

        $tglSurvei = Carbon::parse($validated['tgl_survei'])->format('Y-m-d');
        $idVerifikator = (int) $request->user()->id_pengguna;

        try {
            DB::statement(
                'CALL sp_verifikasi_mustahik(?, ?, ?, ?, ?, ?, ?)',
                [
                    (int) $mustahik->id_mustahik,
                    $idVerifikator,
                    (int) $validated['id_asnaf_rekom'],
                    $tglSurvei,
                    (int) $validated['skor_kelayakan'],
                    $validated['hasil_verifikasi'],
                    $validated['catatan_survei'] ?? '',
                ],
            );
        } catch (QueryException $exception) {
            return back()->withErrors([
                'db_error' => DatabaseErrorHelper::extractMessage($exception),
            ]);
        }

        return back()->with(
            'success',
            "Berita acara survei untuk {$mustahik->nama_lengkap} ({$validated['hasil_verifikasi']}) berhasil disimpan melalui sp_verifikasi_mustahik.",
        );
    }
}
