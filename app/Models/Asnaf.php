<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Asnaf extends Model
{
    protected $table = 'asnaf';

    protected $primaryKey = 'id_asnaf';

    public $timestamps = false;

    protected $fillable = [
        'kode_asnaf',
        'nama_asnaf',
        'deskripsi',
        'maks_persen',
    ];

    protected function casts(): array
    {
        return [
            'id_asnaf' => 'integer',
            'maks_persen' => 'decimal:2',
        ];
    }
}
