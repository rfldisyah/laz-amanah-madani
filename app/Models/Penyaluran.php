<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Penyaluran extends Model
{
    protected $table = 'penyaluran';

    protected $primaryKey = 'id_penyaluran';

    public $timestamps = false;

    protected $fillable = [
        'nomor_sk_salur',
        'id_program',
        'id_jenis_dana',
        'id_rekening',
        'id_pengaju',
        'id_penyetuju',
        'tgl_pengajuan',
        'tgl_disetujui',
        'tgl_disalurkan',
        'total_nominal',
        'status_penyaluran',
    ];

    protected function casts(): array
    {
        return [
            'id_penyaluran' => 'integer',
            'id_program' => 'integer',
            'id_jenis_dana' => 'integer',
            'id_rekening' => 'integer',
            'id_pengaju' => 'integer',
            'id_penyetuju' => 'integer',
            'tgl_pengajuan' => 'datetime',
            'tgl_disetujui' => 'datetime',
            'tgl_disalurkan' => 'datetime',
            'total_nominal' => 'decimal:2',
        ];
    }

    public function program(): BelongsTo
    {
        return $this->belongsTo(Program::class, 'id_program', 'id_program');
    }

    public function jenisDana(): BelongsTo
    {
        return $this->belongsTo(JenisDana::class, 'id_jenis_dana', 'id_jenis_dana');
    }

    public function rekening(): BelongsTo
    {
        return $this->belongsTo(RekeningLembaga::class, 'id_rekening', 'id_rekening');
    }

    public function pengaju(): BelongsTo
    {
        return $this->belongsTo(Pengguna::class, 'id_pengaju', 'id_pengguna');
    }

    public function penyetuju(): BelongsTo
    {
        return $this->belongsTo(Pengguna::class, 'id_penyetuju', 'id_pengguna');
    }

    public function details(): HasMany
    {
        return $this->hasMany(DetailPenyaluran::class, 'id_penyaluran', 'id_penyaluran');
    }
}
