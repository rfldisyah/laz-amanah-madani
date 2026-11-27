<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MutasiDana extends Model
{
    protected $table = 'mutasi_dana';

    protected $primaryKey = 'id_mutasi';

    public $timestamps = false;

    protected $fillable = [
        'waktu_mutasi',
        'id_jenis_dana',
        'id_rekening',
        'jenis_mutasi',
        'nomor_referensi',
        'nominal_mutasi',
        'saldo_sebelum',
        'saldo_sesudah',
        'keterangan',
    ];

    protected function casts(): array
    {
        return [
            'id_mutasi' => 'integer',
            'waktu_mutasi' => 'datetime',
            'id_jenis_dana' => 'integer',
            'id_rekening' => 'integer',
            'nominal_mutasi' => 'decimal:2',
            'saldo_sebelum' => 'decimal:2',
            'saldo_sesudah' => 'decimal:2',
        ];
    }

    public function jenisDana(): BelongsTo
    {
        return $this->belongsTo(JenisDana::class, 'id_jenis_dana', 'id_jenis_dana');
    }

    public function rekening(): BelongsTo
    {
        return $this->belongsTo(RekeningLembaga::class, 'id_rekening', 'id_rekening');
    }
}
