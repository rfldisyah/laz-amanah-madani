<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Muzaki extends Model
{
    protected $table = 'muzaki';

    protected $primaryKey = 'id_muzaki';

    public $timestamps = false;

    protected $fillable = [
        'kode_muzaki',
        'nama_muzaki',
        'tipe_muzaki',
        'nik_npwp',
        'no_hp',
        'alamat',
    ];

    protected function casts(): array
    {
        return [
            'id_muzaki' => 'integer',
        ];
    }
}
