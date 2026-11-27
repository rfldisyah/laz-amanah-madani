<?php

namespace App\Http\Controllers;

use App\Models\Mustahik;
use App\Models\Penyaluran;
use App\Models\Program;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(): Response
    {
        $rekapDana = DB::table('v_rekap_induk_dana')
            ->select([
                'kategori_induk',
                'jumlah_kantong_dana',
                'total_terhimpun',
                'total_tersalurkan',
                'saldo_tersedia',
            ])
            ->get();

        $kantongSaldo = DB::table('saldo_dana as s')
            ->join('jenis_dana as j', 's.id_jenis_dana', '=', 'j.id_jenis_dana')
            ->where('j.is_aktif', 1)
            ->orderBy('j.kategori_induk')
            ->orderBy('j.id_jenis_dana')
            ->get([
                's.id_saldo',
                's.id_jenis_dana',
                'j.kode_dana',
                'j.nama_dana',
                'j.kategori_induk',
                'j.is_terikat',
                's.saldo_aktif',
                's.total_masuk',
                's.total_keluar',
                's.updated_at',
            ])
            ->map(function (object $row): array {
                return [
                    'id_saldo' => (int) $row->id_saldo,
                    'id_jenis_dana' => (int) $row->id_jenis_dana,
                    'kode_dana' => $row->kode_dana,
                    'nama_dana' => $row->nama_dana,
                    'kategori_induk' => $row->kategori_induk,
                    'is_terikat' => (bool) $row->is_terikat,
                    'saldo_aktif' => (string) $row->saldo_aktif,
                    'total_masuk' => (string) $row->total_masuk,
                    'total_keluar' => (string) $row->total_keluar,
                    'updated_at' => (string) $row->updated_at,
                ];
            });

        $amilQuota = DB::table('v_porsi_asnaf')
            ->where('kode_asnaf', 'AMIL')
            ->select([
                'id_asnaf',
                'kode_asnaf',
                'nama_asnaf',
                'batas_maks_persen',
                'jumlah_penerima',
                'total_disalurkan',
                'persentase_terhadap_zakat',
            ])
            ->first();

        $ringkasanOperasional = [
            'mustahik_belum_verifikasi' => Mustahik::query()
                ->where('status_kelayakan', 'BELUM_VERIFIKASI')
                ->count(),
            'mustahik_layak' => Mustahik::query()
                ->where('status_kelayakan', 'LAYAK')
                ->count(),
            'sk_draft' => Penyaluran::query()
                ->where('status_penyaluran', 'DRAFT')
                ->count(),
            'sk_disetujui' => Penyaluran::query()
                ->where('status_penyaluran', 'DISETUJUI')
                ->count(),
            'program_aktif' => Program::query()
                ->where('status_program', 'AKTIF')
                ->count(),
        ];

        return Inertia::render('Dashboard/Index', [
            'rekapDana' => $rekapDana,
            'kantongSaldo' => $kantongSaldo,
            'amilQuota' => $amilQuota,
            'ringkasanOperasional' => $ringkasanOperasional,
        ]);
    }
}
