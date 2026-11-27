<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RekeningLembaga extends Model
{
    protected $table = 'rekening_lembaga';

    protected $primaryKey = 'id_rekening';

    public $timestamps = false;

    protected $fillable = [
        'nomor_rekening',
        'nama_bank',
        'atas_nama',
        'kategori_induk',
        'is_aktif',
    ];

    protected function casts(): array
    {
        return [
            'id_rekening' => 'integer',
            'is_aktif' => 'boolean',
        ];
    }
}
