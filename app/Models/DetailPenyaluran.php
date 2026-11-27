<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DetailPenyaluran extends Model
{
    protected $table = 'detail_penyaluran';

    protected $primaryKey = 'id_detail_salur';

    public $timestamps = false;

    protected $fillable = [
        'id_penyaluran',
        'id_mustahik',
        'id_asnaf_saat_salur',
        'nominal_diterima',
        'keterangan_bantuan',
    ];

    protected function casts(): array
    {
        return [
            'id_detail_salur' => 'integer',
            'id_penyaluran' => 'integer',
            'id_mustahik' => 'integer',
            'id_asnaf_saat_salur' => 'integer',
            'nominal_diterima' => 'decimal:2',
        ];
    }

    public function penyaluran(): BelongsTo
    {
        return $this->belongsTo(Penyaluran::class, 'id_penyaluran', 'id_penyaluran');
    }

    public function mustahik(): BelongsTo
    {
        return $this->belongsTo(Mustahik::class, 'id_mustahik', 'id_mustahik');
    }

    public function asnaf(): BelongsTo
    {
        return $this->belongsTo(Asnaf::class, 'id_asnaf_saat_salur', 'id_asnaf');
    }
}
