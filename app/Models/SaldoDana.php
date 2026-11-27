<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SaldoDana extends Model
{
    protected $table = 'saldo_dana';

    protected $primaryKey = 'id_saldo';

    public $timestamps = false;

    protected $fillable = [
        'id_jenis_dana',
        'saldo_aktif',
        'total_masuk',
        'total_keluar',
        'updated_at',
    ];

    protected function casts(): array
    {
        return [
            'id_saldo' => 'integer',
            'id_jenis_dana' => 'integer',
            'saldo_aktif' => 'decimal:2',
            'total_masuk' => 'decimal:2',
            'total_keluar' => 'decimal:2',
            'updated_at' => 'datetime',
        ];
    }

    public function jenisDana(): BelongsTo
    {
        return $this->belongsTo(JenisDana::class, 'id_jenis_dana', 'id_jenis_dana');
    }
}
