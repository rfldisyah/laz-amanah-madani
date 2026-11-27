<?php

namespace App\Http\Controllers;

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

        return Inertia::render('Dashboard/Index', [
            'rekapDana' => $rekapDana,
        ]);
    }
}
