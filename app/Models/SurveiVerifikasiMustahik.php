<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SurveiVerifikasiMustahik extends Model
{
    protected $table = 'survei_verifikasi_mustahik';

    protected $primaryKey = 'id_survei';

    public $timestamps = false;

    protected $fillable = [
        'id_mustahik',
        'id_verifikator',
        'id_asnaf_rekom',
        'tgl_survei',
        'skor_kelayakan',
        'hasil_verifikasi',
        'catatan_survei',
    ];

    protected function casts(): array
    {
        return [
            'id_survei' => 'integer',
            'id_mustahik' => 'integer',
            'id_verifikator' => 'integer',
            'id_asnaf_rekom' => 'integer',
            'tgl_survei' => 'date',
            'skor_kelayakan' => 'integer',
        ];
    }

    public function mustahik(): BelongsTo
    {
        return $this->belongsTo(Mustahik::class, 'id_mustahik', 'id_mustahik');
    }

    public function verifikator(): BelongsTo
    {
        return $this->belongsTo(Pengguna::class, 'id_verifikator', 'id_pengguna');
    }

    public function asnafRekomendasi(): BelongsTo
    {
        return $this->belongsTo(Asnaf::class, 'id_asnaf_rekom', 'id_asnaf');
    }
}
