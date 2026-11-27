<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LogAudit extends Model
{
    protected $table = 'log_audit';

    protected $primaryKey = 'id_audit';

    public $timestamps = false;

    protected $fillable = [
        'waktu_kejadian',
        'nama_tabel',
        'id_record',
        'aksi',
        'kolom_berubah',
        'nilai_lama',
        'nilai_baru',
        'dilakukan_oleh',
    ];

    protected function casts(): array
    {
        return [
            'id_audit' => 'integer',
            'waktu_kejadian' => 'datetime',
        ];
    }
}
