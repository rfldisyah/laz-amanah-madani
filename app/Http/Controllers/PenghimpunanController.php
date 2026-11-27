<?php

namespace App\Http\Controllers;

use App\Models\JenisDana;
use App\Models\Muzaki;
use App\Models\Penghimpunan;
use App\Models\RekeningLembaga;
use App\Support\DatabaseErrorHelper;
use Carbon\Carbon;
use Illuminate\Database\QueryException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class PenghimpunanController extends Controller
{
    public function muzakiIndex(Request $request): Response
    {
        $search = trim((string) $request->query('search', ''));
        $tipe = (string) $request->query('tipe', 'SEMUA');

        $muzaki = Muzaki::query()
            ->when($search !== '', function ($query) use ($search): void {
                $query->where(function ($sub) use ($search): void {
                    $sub->where('nama_muzaki', 'like', "%{$search}%")
                        ->orWhere('kode_muzaki', 'like', "%{$search}%")
                        ->orWhere('nik_npwp', 'like', "%{$search}%");
                });
            })
            ->when(in_array($tipe, ['PERORANGAN', 'LEMBAGA'], true), function ($query) use ($tipe): void {
                $query->where('tipe_muzaki', $tipe);
            })
            ->orderByDesc('id_muzaki')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Muzaki/Index', [
            'muzaki' => $muzaki,
            'filters' => [
                'search' => $search,
                'tipe' => $tipe,
            ],
        ]);
    }

    public function muzakiStore(Request $request): RedirectResponse
    {
        $validated = $this->validateMuzaki($request);

        $kodeMuzaki = ($validated['kode_muzaki'] ?? null) ?: $this->generateKodeMuzaki();

        try {
            Muzaki::query()->create([
                'kode_muzaki' => $kodeMuzaki,
                'nama_muzaki' => $validated['nama_muzaki'],
                'tipe_muzaki' => $validated['tipe_muzaki'],
                'nik_npwp' => $validated['nik_npwp'],
                'no_hp' => $validated['no_hp'] ?? null,
                'alamat' => $validated['alamat'] ?? null,
            ]);
        } catch (QueryException $exception) {
            return back()->withErrors([
                'db_error' => DatabaseErrorHelper::extractMessage($exception),
            ]);
        }

        return back()->with('success', "Data muzaki {$validated['nama_muzaki']} berhasil ditambahkan.");
    }

    public function muzakiUpdate(Request $request, Muzaki $muzaki): RedirectResponse
    {
        $validated = $this->validateMuzaki($request, $muzaki->id_muzaki);

        try {
            $muzaki->update([
                'nama_muzaki' => $validated['nama_muzaki'],
                'tipe_muzaki' => $validated['tipe_muzaki'],
                'nik_npwp' => $validated['nik_npwp'],
                'no_hp' => $validated['no_hp'] ?? null,
                'alamat' => $validated['alamat'] ?? null,
            ]);
        } catch (QueryException $exception) {
            return back()->withErrors([
                'db_error' => DatabaseErrorHelper::extractMessage($exception),
            ]);
        }

        return back()->with('success', "Data muzaki {$muzaki->nama_muzaki} berhasil diperbarui.");
    }

    public function muzakiDestroy(Muzaki $muzaki): RedirectResponse
    {
        try {
            $muzaki->delete();
        } catch (QueryException $exception) {
            return back()->withErrors([
                'db_error' => 'Muzaki tidak dapat dihapus karena sudah memiliki riwayat transaksi penghimpunan.',
            ]);
        }

        return back()->with('success', "Data muzaki {$muzaki->nama_muzaki} berhasil dihapus.");
    }

    public function index(Request $request): Response
    {
        $search = trim((string) $request->query('search', ''));

        $riwayat = Penghimpunan::query()
            ->with([
                'muzaki:id_muzaki,kode_muzaki,nama_muzaki,tipe_muzaki',
                'jenisDana:id_jenis_dana,kode_dana,nama_dana,kategori_induk',
                'rekening:id_rekening,nomor_rekening,nama_bank,kategori_induk',
                'petugas:id_pengguna,nama_lengkap',
            ])
            ->when($search !== '', function ($query) use ($search): void {
                $query->where('nomor_kuitansi', 'like', "%{$search}%")
                    ->orWhereHas('muzaki', function ($sub) use ($search): void {
                        $sub->where('nama_muzaki', 'like', "%{$search}%");
                    });
            })
            ->orderByDesc('id_penghimpunan')
            ->paginate(15)
            ->withQueryString();

        $muzakiOptions = Muzaki::query()
            ->orderByDesc('id_muzaki')
            ->limit(100)
            ->get(['id_muzaki', 'kode_muzaki', 'nama_muzaki', 'tipe_muzaki', 'nik_npwp']);

        $jenisDanaList = JenisDana::query()
            ->where('is_aktif', true)
            ->orderBy('kategori_induk')
            ->orderBy('id_jenis_dana')
            ->get(['id_jenis_dana', 'kode_dana', 'nama_dana', 'kategori_induk', 'is_terikat']);

        $rekeningList = RekeningLembaga::query()
            ->where('is_aktif', true)
            ->orderBy('kategori_induk')
            ->orderBy('id_rekening')
            ->get(['id_rekening', 'nomor_rekening', 'nama_bank', 'atas_nama', 'kategori_induk']);

        $suggestedReceipt = 'KWT-ZIS-'.now()->format('YmdHis');

        return Inertia::render('Penghimpunan/Index', [
            'riwayat' => $riwayat,
            'muzakiOptions' => $muzakiOptions,
            'jenisDanaList' => $jenisDanaList,
            'rekeningList' => $rekeningList,
            'suggestedReceipt' => $suggestedReceipt,
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'nomor_kuitansi' => ['required', 'string', 'max:35'],
            'id_muzaki' => ['required', 'integer', 'exists:muzaki,id_muzaki'],
            'id_jenis_dana' => ['required', 'integer', 'exists:jenis_dana,id_jenis_dana'],
            'id_rekening' => ['required', 'integer', 'exists:rekening_lembaga,id_rekening'],
            'tgl_setor' => ['required', 'date'],
            'nominal' => ['required', 'numeric', 'min:1000'],
            'metode_bayar' => ['required', Rule::in(['TUNAI', 'TRANSFER_BANK', 'QRIS', 'POTONG_GAJI'])],
        ], [
            'nomor_kuitansi.required' => 'Nomor kuitansi wajib diisi.',
            'id_muzaki.required' => 'Pilih muzaki terlebih dahulu.',
            'id_jenis_dana.required' => 'Pilih jenis dana ZIS terlebih dahulu.',
            'id_rekening.required' => 'Pilih rekening tujuan terlebih dahulu.',
            'nominal.min' => 'Nominal setoran minimal Rp 1.000.',
        ]);

        $tglSetor = Carbon::parse($validated['tgl_setor'])->format('Y-m-d H:i:s');
        $idPetugas = (int) $request->user()->id_pengguna;

        try {
            DB::statement(
                'CALL sp_catat_penghimpunan(?, ?, ?, ?, ?, ?, ?, ?)',
                [
                    $validated['nomor_kuitansi'],
                    (int) $validated['id_muzaki'],
                    (int) $validated['id_jenis_dana'],
                    (int) $validated['id_rekening'],
                    $idPetugas,
                    $tglSetor,
                    (float) $validated['nominal'],
                    $validated['metode_bayar'],
                ],
            );
        } catch (QueryException $exception) {
            return back()->withErrors([
                'db_error' => DatabaseErrorHelper::extractMessage($exception),
            ])->withInput();
        }

        return back()->with('success', "Setoran {$validated['nomor_kuitansi']} berhasil dicatat melalui sp_catat_penghimpunan.");
    }

    private function validateMuzaki(Request $request, ?int $ignoreId = null): array
    {
        $tipe = (string) $request->input('tipe_muzaki');

        return $request->validate([
            'kode_muzaki' => [
                'nullable',
                'string',
                'max:25',
                Rule::unique('muzaki', 'kode_muzaki')->ignore($ignoreId, 'id_muzaki'),
            ],
            'nama_muzaki' => ['required', 'string', 'max:120'],
            'tipe_muzaki' => ['required', Rule::in(['PERORANGAN', 'LEMBAGA'])],
            'nik_npwp' => [
                'required',
                'string',
                $tipe === 'PERORANGAN' ? 'digits:16' : 'regex:/^[0-9.\-]{15,20}$/',
                Rule::unique('muzaki', 'nik_npwp')->ignore($ignoreId, 'id_muzaki'),
            ],
            'no_hp' => ['nullable', 'string', 'max:20'],
            'alamat' => ['nullable', 'string', 'max:200'],
        ], [
            'nama_muzaki.required' => 'Nama muzaki wajib diisi.',
            'nik_npwp.required' => $tipe === 'PERORANGAN' ? 'NIK 16 digit wajib diisi.' : 'NPWP lembaga wajib diisi.',
            'nik_npwp.digits' => 'NIK muzaki perorangan harus tepat 16 digit angka.',
            'nik_npwp.regex' => 'Format NPWP lembaga harus 15 hingga 20 karakter angka/tanda baca.',
            'nik_npwp.unique' => 'NIK / NPWP sudah terdaftar pada muzaki lain.',
        ]);
    }

    private function generateKodeMuzaki(): string
    {
        $nextNumber = ((int) Muzaki::query()->max('id_muzaki')) + 1;

        return sprintf('MZK-PKU-%05d', $nextNumber);
    }
}
