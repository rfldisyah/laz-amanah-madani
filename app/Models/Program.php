<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Program extends Model
{
    protected $table = 'program';

    protected $primaryKey = 'id_program';

    public $timestamps = false;

    protected $fillable = [
        'id_jenis_dana',
        'kode_program',
        'nama_program',
        'target_dana',
        'tgl_mulai',
        'tgl_selesai',
        'status_program',
    ];

    protected function casts(): array
    {
        return [
            'id_program' => 'integer',
            'id_jenis_dana' => 'integer',
            'target_dana' => 'decimal:2',
            'tgl_mulai' => 'date',
            'tgl_selesai' => 'date',
        ];
    }

    public function jenisDana(): BelongsTo
    {
        return $this->belongsTo(JenisDana::class, 'id_jenis_dana', 'id_jenis_dana');
    }
}
