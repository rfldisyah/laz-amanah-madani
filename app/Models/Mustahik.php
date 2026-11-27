<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Mustahik extends Model
{
    protected $table = 'mustahik';

    protected $primaryKey = 'id_mustahik';

    public $timestamps = false;

    protected $fillable = [
        'nik',
        'nama_lengkap',
        'id_asnaf',
        'id_verifikator',
        'alamat_kecamatan',
        'status_kelayakan',
        'tgl_verifikasi',
        'tgl_kedaluwarsa',
    ];

    protected function casts(): array
    {
        return [
            'id_mustahik' => 'integer',
            'id_asnaf' => 'integer',
            'id_verifikator' => 'integer',
            'tgl_verifikasi' => 'date',
            'tgl_kedaluwarsa' => 'date',
        ];
    }

    public function asnaf(): BelongsTo
    {
        return $this->belongsTo(Asnaf::class, 'id_asnaf', 'id_asnaf');
    }

    public function verifikator(): BelongsTo
    {
        return $this->belongsTo(Pengguna::class, 'id_verifikator', 'id_pengguna');
    }

    public function survei(): HasMany
    {
        return $this->hasMany(SurveiVerifikasiMustahik::class, 'id_mustahik', 'id_mustahik');
    }
}
