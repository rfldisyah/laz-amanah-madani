<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class JenisDana extends Model
{
    protected $table = 'jenis_dana';

    protected $primaryKey = 'id_jenis_dana';

    public $timestamps = false;

    protected $fillable = [
        'parent_id',
        'kode_dana',
        'nama_dana',
        'kategori_induk',
        'is_terikat',
        'is_aktif',
    ];

    protected function casts(): array
    {
        return [
            'id_jenis_dana' => 'integer',
            'parent_id' => 'integer',
            'is_terikat' => 'boolean',
            'is_aktif' => 'boolean',
        ];
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_id', 'id_jenis_dana');
    }

    public function saldo(): HasOne
    {
        return $this->hasOne(SaldoDana::class, 'id_jenis_dana', 'id_jenis_dana');
    }
}
