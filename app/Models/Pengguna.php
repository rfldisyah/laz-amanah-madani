<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;

class Pengguna extends Authenticatable
{
    protected $table = 'pengguna';

    protected $primaryKey = 'id_pengguna';

    public $timestamps = false;

    protected $fillable = [
        'nama_lengkap',
        'username',
        'peran',
        'jabatan',
        'is_aktif',
    ];

    protected function casts(): array
    {
        return [
            'id_pengguna' => 'integer',
            'is_aktif' => 'boolean',
        ];
    }

    // Table pengguna has no remember_token column in db_laz_amanah_madani.
    public function getRememberTokenName(): ?string
    {
        return null;
    }

    public function hasRole(string ...$roles): bool
    {
        return in_array($this->peran, $roles, true);
    }
}
