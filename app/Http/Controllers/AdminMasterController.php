<?php

namespace App\Http\Controllers;

use App\Models\JenisDana;
use App\Models\LogAudit;
use App\Models\MutasiDana;
use App\Models\Pengguna;
use App\Models\Program;
use App\Models\RekeningLembaga;
use App\Support\DatabaseErrorHelper;
use Illuminate\Database\QueryException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class AdminMasterController extends Controller
{
    public function masterIndex(): Response
    {
        $programList = Program::query()
            ->with('jenisDana:id_jenis_dana,kode_dana,nama_dana,kategori_induk')
            ->orderByDesc('id_program')
            ->get();

        $rekeningList = RekeningLembaga::query()
            ->orderBy('kategori_induk')
            ->orderBy('nama_bank')
            ->get();

        $jenisDanaList = JenisDana::query()
            ->with([
                'parent:id_jenis_dana,kode_dana,nama_dana',
                'saldo:id_jenis_dana,saldo_aktif',
            ])
            ->orderBy('kategori_induk')
            ->orderBy('kode_dana')
            ->get();

        $penggunaList = Pengguna::query()
            ->orderBy('peran')
            ->orderBy('nama_lengkap')
            ->get();

        return Inertia::render('Admin/MasterData', [
            'programList' => $programList,
            'rekeningList' => $rekeningList,
            'jenisDanaList' => $jenisDanaList,
            'penggunaList' => $penggunaList,
        ]);
    }

    public function programStore(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'id_jenis_dana' => ['required', 'integer', 'exists:jenis_dana,id_jenis_dana'],
            'kode_program' => ['required', 'string', 'max:25', 'unique:program,kode_program'],
            'nama_program' => ['required', 'string', 'max:120'],
            'target_dana' => ['required', 'numeric', 'min:0'],
            'tgl_mulai' => ['required', 'date'],
            'tgl_selesai' => ['nullable', 'date', 'after_or_equal:tgl_mulai'],
            'status_program' => ['required', Rule::in(['AKTIF', 'SELESAI', 'DITUTUP'])],
        ]);

        try {
            Program::query()->create($validated);
        } catch (QueryException $exception) {
            return back()->withErrors([
                'db_error' => DatabaseErrorHelper::extractMessage($exception),
            ]);
        }

        return back()->with('success', "Program {$validated['kode_program']} berhasil ditambahkan.");
    }

    public function programUpdate(Request $request, Program $program): RedirectResponse
    {
        $validated = $request->validate([
            'nama_program' => ['required', 'string', 'max:120'],
            'target_dana' => ['required', 'numeric', 'min:0'],
            'tgl_selesai' => ['nullable', 'date'],
            'status_program' => ['required', Rule::in(['AKTIF', 'SELESAI', 'DITUTUP'])],
        ]);

        try {
            $program->update($validated);
        } catch (QueryException $exception) {
            return back()->withErrors([
                'db_error' => DatabaseErrorHelper::extractMessage($exception),
            ]);
        }

        return back()->with('success', "Program {$program->kode_program} berhasil diperbarui.");
    }

    public function rekeningStore(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'nomor_rekening' => ['required', 'string', 'max:30', 'unique:rekening_lembaga,nomor_rekening'],
            'nama_bank' => ['required', 'string', 'max:60'],
            'atas_nama' => ['required', 'string', 'max:100'],
            'kategori_induk' => ['required', Rule::in(['ZAKAT', 'INFAK_SEDEKAH', 'WAKAF'])],
        ]);

        try {
            RekeningLembaga::query()->create([
                ...$validated,
                'is_aktif' => true,
            ]);
        } catch (QueryException $exception) {
            return back()->withErrors([
                'db_error' => DatabaseErrorHelper::extractMessage($exception),
            ]);
        }

        return back()->with('success', "Rekening {$validated['nama_bank']} ({$validated['nomor_rekening']}) berhasil ditambahkan.");
    }

    public function rekeningToggle(RekeningLembaga $rekening): RedirectResponse
    {
        try {
            $rekening->update(['is_aktif' => ! $rekening->is_aktif]);
        } catch (QueryException $exception) {
            return back()->withErrors([
                'db_error' => DatabaseErrorHelper::extractMessage($exception),
            ]);
        }

        $state = $rekening->is_aktif ? 'diaktifkan' : 'dinonaktifkan';

        return back()->with('success', "Rekening {$rekening->nomor_rekening} berhasil {$state}.");
    }

    public function jenisDanaToggle(JenisDana $jenisDana): RedirectResponse
    {
        try {
            $jenisDana->update(['is_aktif' => ! $jenisDana->is_aktif]);
        } catch (QueryException $exception) {
            return back()->withErrors([
                'db_error' => DatabaseErrorHelper::extractMessage($exception),
            ]);
        }

        $state = $jenisDana->is_aktif ? 'diaktifkan' : 'dinonaktifkan';

        return back()->with('success', "Jenis dana {$jenisDana->kode_dana} berhasil {$state}.");
    }

    public function penggunaStore(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'nama_lengkap' => ['required', 'string', 'max:100'],
            'username' => ['required', 'string', 'max:50', 'alpha_dash', 'unique:pengguna,username'],
            'password' => ['nullable', 'string', 'min:6', 'max:100'],
            'peran' => ['required', Rule::in(['admin_sistem', 'verifikator', 'petugas_penghimpunan', 'manajer_penyaluran'])],
            'jabatan' => ['required', 'string', 'max:80'],
        ]);

        $prefix = strtolower((string) strtok($validated['username'], '.'));
        $rawPassword = filled($validated['password'] ?? null)
            ? (string) $validated['password']
            : "{$prefix}123";

        try {
            Pengguna::query()->create([
                'nama_lengkap' => $validated['nama_lengkap'],
                'username' => $validated['username'],
                'password' => $rawPassword,
                'peran' => $validated['peran'],
                'jabatan' => $validated['jabatan'],
                'is_aktif' => true,
            ]);
        } catch (QueryException $exception) {
            return back()->withErrors([
                'db_error' => DatabaseErrorHelper::extractMessage($exception),
            ]);
        }

        return back()->with('success', "Pengguna {$validated['username']} berhasil ditambahkan.");
    }

    public function penggunaToggle(Request $request, Pengguna $pengguna): RedirectResponse
    {
        if ((int) $request->user()->id_pengguna === (int) $pengguna->id_pengguna) {
            return back()->withErrors([
                'db_error' => 'Anda tidak dapat menonaktifkan akun Anda sendiri yang sedang aktif.',
            ]);
        }

        try {
            $pengguna->update(['is_aktif' => ! $pengguna->is_aktif]);
        } catch (QueryException $exception) {
            return back()->withErrors([
                'db_error' => DatabaseErrorHelper::extractMessage($exception),
            ]);
        }

        $state = $pengguna->is_aktif ? 'diaktifkan' : 'dinonaktifkan';

        return back()->with('success', "Akun {$pengguna->username} berhasil {$state}.");
    }

    public function mutasiIndex(Request $request): Response
    {
        $tahun = (string) $request->query('tahun', '2026');
        $jenisMutasi = (string) $request->query('jenis_mutasi', 'SEMUA');
        $idJenisDana = (string) $request->query('id_jenis_dana', '');
        $search = trim((string) $request->query('search', ''));

        $mutasi = MutasiDana::query()
            ->with([
                'jenisDana:id_jenis_dana,kode_dana,nama_dana,kategori_induk',
                'rekening:id_rekening,nama_bank,nomor_rekening',
            ])
            ->when(in_array($tahun, ['2024', '2025', '2026'], true), function ($query) use ($tahun): void {
                $query->whereBetween('waktu_mutasi', [
                    "{$tahun}-01-01 00:00:00",
                    "{$tahun}-12-31 23:59:59",
                ]);
            })
            ->when($tahun === '2027+', function ($query): void {
                $query->where('waktu_mutasi', '>=', '2027-01-01 00:00:00');
            })
            ->when(in_array($jenisMutasi, ['MASUK', 'KELUAR'], true), function ($query) use ($jenisMutasi): void {
                $query->where('jenis_mutasi', $jenisMutasi);
            })
            ->when($idJenisDana !== '' && ctype_digit($idJenisDana), function ($query) use ($idJenisDana): void {
                $query->where('id_jenis_dana', (int) $idJenisDana);
            })
            ->when($search !== '', function ($query) use ($search): void {
                $query->where(function ($sub) use ($search): void {
                    $sub->where('nomor_referensi', 'like', "%{$search}%")
                        ->orWhere('keterangan', 'like', "%{$search}%");
                });
            })
            ->orderByDesc('waktu_mutasi')
            ->orderByDesc('id_mutasi')
            ->paginate(20)
            ->withQueryString();

        $partitions = collect(DB::select("
            SELECT PARTITION_NAME, PARTITION_DESCRIPTION, TABLE_ROWS
            FROM information_schema.PARTITIONS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'mutasi_dana'
            ORDER BY PARTITION_ORDINAL_POSITION
        "))->map(fn (object $row): array => [
            'name' => (string) $row->PARTITION_NAME,
            'description' => (string) $row->PARTITION_DESCRIPTION,
            'rows' => (int) $row->TABLE_ROWS,
        ]);

        $jenisDanaList = JenisDana::query()
            ->orderBy('kode_dana')
            ->get(['id_jenis_dana', 'kode_dana', 'nama_dana']);

        return Inertia::render('Admin/BukuBesar', [
            'mutasi' => $mutasi,
            'partitions' => $partitions,
            'jenisDanaList' => $jenisDanaList,
            'filters' => [
                'tahun' => $tahun,
                'jenis_mutasi' => $jenisMutasi,
                'id_jenis_dana' => $idJenisDana,
                'search' => $search,
            ],
        ]);
    }

    public function auditIndex(Request $request): Response
    {
        $search = trim((string) $request->query('search', ''));
        $aksi = (string) $request->query('aksi', 'SEMUA');

        $logs = LogAudit::query()
            ->when(in_array($aksi, ['INSERT', 'UPDATE', 'DELETE'], true), function ($query) use ($aksi): void {
                $query->where('aksi', $aksi);
            })
            ->when($search !== '', function ($query) use ($search): void {
                $query->where(function ($sub) use ($search): void {
                    $sub->where('nama_tabel', 'like', "%{$search}%")
                        ->orWhere('kolom_berubah', 'like', "%{$search}%")
                        ->orWhere('dilakukan_oleh', 'like', "%{$search}%")
                        ->orWhere('id_record', 'like', "%{$search}%");
                });
            })
            ->orderByDesc('id_audit')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Admin/AuditTrail', [
            'logs' => $logs,
            'filters' => [
                'search' => $search,
                'aksi' => $aksi,
            ],
        ]);
    }
}
