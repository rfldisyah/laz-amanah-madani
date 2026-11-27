<?php

namespace App\Http\Controllers;

use App\Models\DetailPenyaluran;
use App\Models\Mustahik;
use App\Models\Penyaluran;
use App\Models\Program;
use App\Models\RekeningLembaga;
use App\Models\SaldoDana;
use App\Support\DatabaseErrorHelper;
use Carbon\Carbon;
use Illuminate\Database\QueryException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PenyaluranController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->query('search', ''));
        $status = (string) $request->query('status', 'SEMUA');

        $penyaluran = Penyaluran::query()
            ->with([
                'program:id_program,id_jenis_dana,kode_program,nama_program,status_program',
                'jenisDana:id_jenis_dana,kode_dana,nama_dana,kategori_induk',
                'rekening:id_rekening,nama_bank,nomor_rekening,atas_nama,kategori_induk',
                'pengaju:id_pengguna,nama_lengkap',
                'penyetuju:id_pengguna,nama_lengkap',
                'details' => function ($query): void {
                    $query->with([
                        'mustahik:id_mustahik,nik,nama_lengkap,alamat_kecamatan',
                        'asnaf:id_asnaf,kode_asnaf,nama_asnaf',
                    ])->orderBy('id_detail_salur');
                },
            ])
            ->when($search !== '', function ($query) use ($search): void {
                $query->where(function ($sub) use ($search): void {
                    $sub->where('nomor_sk_salur', 'like', "%{$search}%")
                        ->orWhereHas('program', function ($prog) use ($search): void {
                            $prog->where('nama_program', 'like', "%{$search}%")
                                ->orWhere('kode_program', 'like', "%{$search}%");
                        });
                });
            })
            ->when(in_array($status, ['DRAFT', 'DISETUJUI', 'DISALURKAN', 'DITOLAK'], true), function ($query) use ($status): void {
                $query->where('status_penyaluran', $status);
            })
            ->orderByRaw("FIELD(status_penyaluran, 'DRAFT', 'DISETUJUI', 'DISALURKAN', 'DITOLAK')")
            ->orderByDesc('id_penyaluran')
            ->paginate(12)
            ->withQueryString();

        $programAktif = Program::query()
            ->with('jenisDana:id_jenis_dana,kode_dana,nama_dana,kategori_induk')
            ->where('status_program', 'AKTIF')
            ->orderBy('kode_program')
            ->get();

        $rekeningAktif = RekeningLembaga::query()
            ->where('is_aktif', true)
            ->orderBy('kategori_induk')
            ->orderBy('nama_bank')
            ->get([
                'id_rekening',
                'nama_bank',
                'nomor_rekening',
                'atas_nama',
                'kategori_induk',
                'is_aktif',
            ]);

        $today = Carbon::today()->toDateString();
        $mustahikLayak = Mustahik::query()
            ->with('asnaf:id_asnaf,kode_asnaf,nama_asnaf')
            ->where('status_kelayakan', 'LAYAK')
            ->whereNotNull('tgl_kedaluwarsa')
            ->whereDate('tgl_kedaluwarsa', '>=', $today)
            ->orderBy('nama_lengkap')
            ->get([
                'id_mustahik',
                'nik',
                'nama_lengkap',
                'id_asnaf',
                'alamat_kecamatan',
                'status_kelayakan',
                'tgl_kedaluwarsa',
            ]);

        $sisaKuotaAmil = DB::selectOne(
            'SELECT fn_sisa_kuota_amil(YEAR(CURDATE()), MONTH(CURDATE())) AS sisa',
        );

        $porsiAmil = DB::table('v_porsi_asnaf')
            ->where('kode_asnaf', 'AMIL')
            ->select([
                'batas_maks_persen',
                'total_disalurkan',
                'persentase_terhadap_zakat',
            ])
            ->first();

        return Inertia::render('Penyaluran/Index', [
            'penyaluran' => $penyaluran,
            'programAktif' => $programAktif,
            'rekeningAktif' => $rekeningAktif,
            'mustahikLayak' => $mustahikLayak,
            'amilInfo' => [
                'sisa_kuota_bulan_ini' => (string) ($sisaKuotaAmil->sisa ?? '0.00'),
                'batas_maks_persen' => (string) ($porsiAmil->batas_maks_persen ?? '12.50'),
                'persentase_terhadap_zakat' => (string) ($porsiAmil->persentase_terhadap_zakat ?? '0.00'),
                'total_disalurkan' => (string) ($porsiAmil->total_disalurkan ?? '0.00'),
            ],
            'filters' => [
                'search' => $search,
                'status' => $status,
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'nomor_sk_salur' => ['nullable', 'string', 'max:35', 'unique:penyaluran,nomor_sk_salur'],
            'id_program' => ['required', 'integer', 'exists:program,id_program'],
            'id_rekening' => ['required', 'integer', 'exists:rekening_lembaga,id_rekening'],
            'tgl_pengajuan' => ['nullable', 'date'],
        ], [
            'nomor_sk_salur.unique' => 'Nomor SK penyaluran sudah terdaftar.',
            'id_program.required' => 'Pilih program penyaluran terlebih dahulu.',
            'id_rekening.required' => 'Pilih rekening pencairan terlebih dahulu.',
        ]);

        $program = Program::query()->findOrFail((int) $validated['id_program']);
        if ($program->status_program !== 'AKTIF') {
            return back()->withErrors([
                'id_program' => 'SK penyaluran hanya dapat dibuat untuk program berstatus AKTIF.',
            ]);
        }

        $nomorSk = trim((string) ($validated['nomor_sk_salur'] ?? ''));
        if ($nomorSk === '') {
            $nomorSk = $this->generateNomorSk();
        }

        $tglPengajuan = isset($validated['tgl_pengajuan']) && $validated['tgl_pengajuan'] !== ''
            ? Carbon::parse($validated['tgl_pengajuan'])->format('Y-m-d H:i:s')
            : now()->format('Y-m-d H:i:s');

        try {
            Penyaluran::query()->create([
                'nomor_sk_salur' => $nomorSk,
                'id_program' => $program->id_program,
                'id_jenis_dana' => $program->id_jenis_dana,
                'id_rekening' => (int) $validated['id_rekening'],
                'id_pengaju' => (int) $request->user()->id_pengguna,
                'id_penyetuju' => null,
                'tgl_pengajuan' => $tglPengajuan,
                'total_nominal' => 0,
                'status_penyaluran' => 'DRAFT',
            ]);
        } catch (QueryException $exception) {
            return back()->withErrors([
                'db_error' => DatabaseErrorHelper::extractMessage($exception),
            ]);
        }

        return back()->with('success', "Draft SK penyaluran {$nomorSk} berhasil dibuat.");
    }

    public function addDetail(Request $request, Penyaluran $penyaluran): RedirectResponse
    {
        $validated = $request->validate([
            'id_mustahik' => ['required', 'integer', 'exists:mustahik,id_mustahik'],
            'nominal_diterima' => ['required', 'numeric', 'min:1000'],
            'keterangan_bantuan' => ['nullable', 'string', 'max:150'],
        ], [
            'id_mustahik.required' => 'Pilih mustahik penerima bantuan.',
            'nominal_diterima.required' => 'Nominal bantuan wajib diisi.',
            'nominal_diterima.min' => 'Nominal bantuan minimal Rp 1.000.',
        ]);

        $mustahik = Mustahik::query()->findOrFail((int) $validated['id_mustahik']);

        try {
            DetailPenyaluran::query()->create([
                'id_penyaluran' => $penyaluran->id_penyaluran,
                'id_mustahik' => $mustahik->id_mustahik,
                'id_asnaf_saat_salur' => $mustahik->id_asnaf,
                'nominal_diterima' => (float) $validated['nominal_diterima'],
                'keterangan_bantuan' => $validated['keterangan_bantuan'] ?? null,
            ]);
        } catch (QueryException $exception) {
            return back()->withErrors([
                'db_error' => DatabaseErrorHelper::extractMessage($exception),
            ]);
        }

        return back()->with(
            'success',
            "Penerima {$mustahik->nama_lengkap} berhasil ditambahkan ke SK {$penyaluran->nomor_sk_salur}.",
        );
    }

    public function approvalIndex(Request $request): Response
    {
        $search = trim((string) $request->query('search', ''));
        $status = (string) $request->query('status', 'SEMUA');

        $penyaluran = Penyaluran::query()
            ->with([
                'program:id_program,id_jenis_dana,kode_program,nama_program,status_program',
                'jenisDana:id_jenis_dana,kode_dana,nama_dana,kategori_induk',
                'rekening:id_rekening,nama_bank,nomor_rekening,atas_nama,kategori_induk',
                'pengaju:id_pengguna,nama_lengkap',
                'penyetuju:id_pengguna,nama_lengkap',
                'details' => function ($query): void {
                    $query->with([
                        'mustahik:id_mustahik,nik,nama_lengkap,alamat_kecamatan',
                        'asnaf:id_asnaf,kode_asnaf,nama_asnaf',
                    ])->orderBy('id_detail_salur');
                },
            ])
            ->when($search !== '', function ($query) use ($search): void {
                $query->where(function ($sub) use ($search): void {
                    $sub->where('nomor_sk_salur', 'like', "%{$search}%")
                        ->orWhereHas('program', function ($prog) use ($search): void {
                            $prog->where('nama_program', 'like', "%{$search}%")
                                ->orWhere('kode_program', 'like', "%{$search}%");
                        });
                });
            })
            ->when(in_array($status, ['DRAFT', 'DISETUJUI', 'DISALURKAN', 'DITOLAK'], true), function ($query) use ($status): void {
                $query->where('status_penyaluran', $status);
            })
            ->orderByRaw("FIELD(status_penyaluran, 'DRAFT', 'DISETUJUI', 'DISALURKAN', 'DITOLAK')")
            ->orderByDesc('id_penyaluran')
            ->paginate(12)
            ->withQueryString();

        $saldoMap = SaldoDana::query()
            ->get(['id_jenis_dana', 'saldo_aktif'])
            ->mapWithKeys(fn (SaldoDana $s): array => [$s->id_jenis_dana => (string) $s->saldo_aktif]);

        $ringkasanStatus = [
            'draft' => Penyaluran::query()->where('status_penyaluran', 'DRAFT')->count(),
            'disetujui' => Penyaluran::query()->where('status_penyaluran', 'DISETUJUI')->count(),
            'disalurkan' => Penyaluran::query()->where('status_penyaluran', 'DISALURKAN')->count(),
        ];

        return Inertia::render('Penyaluran/Approval', [
            'penyaluran' => $penyaluran,
            'saldoMap' => $saldoMap,
            'ringkasanStatus' => $ringkasanStatus,
            'filters' => [
                'search' => $search,
                'status' => $status,
            ],
        ]);
    }

    public function approve(Request $request, Penyaluran $penyaluran): RedirectResponse
    {
        $idPenyetuju = (int) $request->user()->id_pengguna;

        try {
            DB::statement(
                'CALL sp_setujui_penyaluran(?, ?)',
                [(int) $penyaluran->id_penyaluran, $idPenyetuju],
            );
        } catch (QueryException $exception) {
            return back()->withErrors([
                'db_error' => DatabaseErrorHelper::extractMessage($exception),
            ]);
        }

        return back()->with(
            'success',
            "SK {$penyaluran->nomor_sk_salur} berhasil disahkan (DISETUJUI) melalui sp_setujui_penyaluran.",
        );
    }

    public function cairkan(Request $request, Penyaluran $penyaluran): RedirectResponse
    {
        $idEksekutor = (int) $request->user()->id_pengguna;

        try {
            DB::statement(
                'CALL sp_cairkan_penyaluran(?, ?)',
                [(int) $penyaluran->id_penyaluran, $idEksekutor],
            );
        } catch (QueryException $exception) {
            return back()->withErrors([
                'db_error' => DatabaseErrorHelper::extractMessage($exception),
            ]);
        }

        return back()->with(
            'success',
            "Dana SK {$penyaluran->nomor_sk_salur} berhasil dicairkan (DISALURKAN) melalui sp_cairkan_penyaluran.",
        );
    }

    private function generateNomorSk(): string
    {
        $year = now()->format('Y');
        $count = Penyaluran::query()->count() + 1;

        do {
            $candidate = sprintf('SK-SALUR-%s-%03d', $year, $count);
            $exists = Penyaluran::query()->where('nomor_sk_salur', $candidate)->exists();
            $count++;
        } while ($exists);

        return $candidate;
    }
}
