<?php

namespace Tests\Feature;

use App\Models\JenisDana;
use App\Models\Muzaki;
use App\Models\Pengguna;
use App\Models\RekeningLembaga;
use Tests\TestCase;

class PenghimpunanMuzakiTest extends TestCase
{
    public function test_role_access_is_restricted_to_petugas_penghimpunan_and_admin(): void
    {
        $verifikator = Pengguna::query()->where('username', 'farhan.verif')->firstOrFail();
        $manajer = Pengguna::query()->where('username', 'hendra.manajer')->firstOrFail();
        $petugas = Pengguna::query()->where('username', 'rizky.himpun')->firstOrFail();
        $admin = Pengguna::query()->where('username', 'ahmad.admin')->firstOrFail();

        $this->actingAs($verifikator)->get('/muzaki')->assertForbidden();
        $this->actingAs($manajer)->get('/penghimpunan')->assertForbidden();

        $this->actingAs($petugas)->get('/muzaki')->assertOk();
        $this->actingAs($petugas)->get('/penghimpunan')->assertOk();
        $this->actingAs($admin)->get('/penghimpunan')->assertOk();
    }

    public function test_muzaki_crud_validates_nik_and_persists_cleanly(): void
    {
        $petugas = Pengguna::query()->where('username', 'rizky.himpun')->firstOrFail();

        $this->actingAs($petugas)
            ->post('/muzaki', [
                'nama_muzaki' => 'Test Invalid NIK',
                'tipe_muzaki' => 'PERORANGAN',
                'nik_npwp' => '12345',
            ])
            ->assertSessionHasErrors('nik_npwp');

        $uniqueNik = '147199'.random_int(1000000000, 9999999999);
        $uniqueNik = substr($uniqueNik, 0, 16);

        $this->actingAs($petugas)
            ->post('/muzaki', [
                'nama_muzaki' => 'Uji Muzaki Pekanbaru',
                'tipe_muzaki' => 'PERORANGAN',
                'nik_npwp' => $uniqueNik,
                'no_hp' => '081200001111',
                'alamat' => 'Jl. Arifin Ahmad, Pekanbaru',
            ])
            ->assertSessionHas('success');

        $created = Muzaki::query()->where('nik_npwp', $uniqueNik)->firstOrFail();

        $this->actingAs($petugas)
            ->put("/muzaki/{$created->id_muzaki}", [
                'nama_muzaki' => 'Uji Muzaki Pekanbaru Updated',
                'tipe_muzaki' => 'PERORANGAN',
                'nik_npwp' => $uniqueNik,
            ])
            ->assertSessionHas('success');

        $this->actingAs($petugas)
            ->delete("/muzaki/{$created->id_muzaki}")
            ->assertSessionHas('success');

        $this->assertNull(Muzaki::query()->find($created->id_muzaki));
    }

    public function test_penghimpunan_rejects_mismatched_akad_via_sql_trigger(): void
    {
        $petugas = Pengguna::query()->where('username', 'rizky.himpun')->firstOrFail();
        $muzaki = Muzaki::query()->firstOrFail();
        $jenisZakat = JenisDana::query()->where('kategori_induk', 'ZAKAT')->firstOrFail();
        $rekeningInfak = RekeningLembaga::query()->where('kategori_induk', 'INFAK_SEDEKAH')->firstOrFail();

        $response = $this->actingAs($petugas)
            ->from('/penghimpunan')
            ->post('/penghimpunan', [
                'nomor_kuitansi' => 'KWT-TEST-MISMATCH-'.time(),
                'id_muzaki' => $muzaki->id_muzaki,
                'id_jenis_dana' => $jenisZakat->id_jenis_dana,
                'id_rekening' => $rekeningInfak->id_rekening,
                'tgl_setor' => now()->format('Y-m-d H:i:s'),
                'nominal' => 500000,
                'metode_bayar' => 'TRANSFER_BANK',
            ]);

        $response->assertRedirect('/penghimpunan');
        $response->assertSessionHasErrors('db_error');
    }
}
