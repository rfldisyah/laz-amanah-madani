<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\RekeningLembaga;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class LandingTransparansiController extends Controller
{
    public function __invoke(): Response
    {
        $publicDb = DB::connection('mysql_publik');

        $rekapDana = $publicDb->table('v_rekap_induk_dana')
            ->select([
                'kategori_induk',
                'jumlah_kantong_dana',
                'total_terhimpun',
                'total_tersalurkan',
                'saldo_tersedia',
            ])
            ->get();

        $porsiAsnaf = $publicDb->table('v_porsi_asnaf')
            ->select([
                'id_asnaf',
                'kode_asnaf',
                'nama_asnaf',
                'batas_maks_persen',
                'jumlah_penerima',
                'total_disalurkan',
                'persentase_terhadap_zakat',
            ])
            ->orderBy('id_asnaf')
            ->get();

        $laporanPublik = $publicDb->table('v_laporan_publik_zis')
            ->select([
                'nomor_sk_salur',
                'nama_program',
                'kategori_induk',
                'sumber_dana',
                'kecamatan_penerima',
                'golongan_asnaf',
                'nik_tersamar',
                'nama_mustahik_tersamar',
                'nominal_diterima',
                'keterangan_bantuan',
                'tanggal_penyaluran',
            ])
            ->orderByDesc('tanggal_penyaluran')
            ->limit(50)
            ->get();

        $rekeningResmi = RekeningLembaga::query()
            ->where('is_aktif', true)
            ->orderBy('kategori_induk')
            ->orderBy('id_rekening')
            ->get([
                'id_rekening',
                'nomor_rekening',
                'nama_bank',
                'atas_nama',
                'kategori_induk',
                'is_aktif',
            ]);

        return Inertia::render('Public/Home', [
            'rekapDana' => $rekapDana,
            'porsiAsnaf' => $porsiAsnaf,
            'laporanPublik' => $laporanPublik,
            'rekeningResmi' => $rekeningResmi,
        ]);
    }
}
