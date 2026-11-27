<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Penghimpunan extends Model
{
    protected $table = 'penghimpunan';

    protected $primaryKey = 'id_penghimpunan';

    public $timestamps = false;

    protected $fillable = [
        'nomor_kuitansi',
        'id_muzaki',
        'id_jenis_dana',
        'id_rekening',
        'id_petugas',
        'tgl_setor',
        'nominal',
        'metode_bayar',
        'status_validasi',
    ];

    protected function casts(): array
    {
        return [
            'id_penghimpunan' => 'integer',
            'id_muzaki' => 'integer',
            'id_jenis_dana' => 'integer',
            'id_rekening' => 'integer',
            'id_petugas' => 'integer',
            'tgl_setor' => 'datetime',
            'nominal' => 'decimal:2',
        ];
    }

    public function muzaki(): BelongsTo
    {
        return $this->belongsTo(Muzaki::class, 'id_muzaki', 'id_muzaki');
    }

    public function jenisDana(): BelongsTo
    {
        return $this->belongsTo(JenisDana::class, 'id_jenis_dana', 'id_jenis_dana');
    }

    public function rekening(): BelongsTo
    {
        return $this->belongsTo(RekeningLembaga::class, 'id_rekening', 'id_rekening');
    }

    public function petugas(): BelongsTo
    {
        return $this->belongsTo(Pengguna::class, 'id_petugas', 'id_pengguna');
    }
}
