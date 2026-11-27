<?php

namespace Tests\Feature;

use App\Models\Asnaf;
use App\Models\Mustahik;
use App\Models\Pengguna;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class MustahikVerifikasiTest extends TestCase
{
    public function test_role_access_restricted_to_verifikator_and_admin(): void
    {
        $petugas = Pengguna::query()->where('username', 'rizky.himpun')->firstOrFail();
        $manajer = Pengguna::query()->where('username', 'hendra.manajer')->firstOrFail();
        $verifikator = Pengguna::query()->where('username', 'farhan.verif')->firstOrFail();
        $admin = Pengguna::query()->where('username', 'ahmad.admin')->firstOrFail();

        $this->actingAs($petugas)->get('/mustahik')->assertForbidden();
        $this->actingAs($manajer)->get('/mustahik')->assertForbidden();

        $this->actingAs($verifikator)->get('/mustahik')->assertOk();
        $this->actingAs($admin)->get('/mustahik')->assertOk();
    }

    public function test_mustahik_registration_validates_nik_and_persists_with_belum_verifikasi(): void
    {
        $verifikator = Pengguna::query()->where('username', 'farhan.verif')->firstOrFail();
        $asnaf = Asnaf::query()->first();

        // 15-digit NIK harus ditolak
        $this->actingAs($verifikator)
            ->post('/mustahik', [
                'nik' => '123456789012345',
                'nama_lengkap' => 'Uji Mustahik',
                'id_asnaf' => $asnaf->id_asnaf,
                'alamat_kecamatan' => 'Payung Sekaki',
            ])
            ->assertSessionHasErrors('nik');

        // NIK valid 16 digit harus berhasil
        $nik16 = '3471' . str_pad((string) random_int(100000000000, 999999999999), 12, '0', STR_PAD_LEFT);

        $this->actingAs($verifikator)
            ->post('/mustahik', [
                'nik' => $nik16,
                'nama_lengkap' => 'Uji Mustahik Pekanbaru',
                'id_asnaf' => $asnaf->id_asnaf,
                'alamat_kecamatan' => 'Payung Sekaki',
            ])
            ->assertSessionHas('success');

        $created = Mustahik::query()->where('nik', $nik16)->firstOrFail();
        $this->assertSame('BELUM_VERIFIKASI', $created->status_kelayakan);

        // Cleanup
        $created->delete();
    }

    public function test_duplicate_nik_is_rejected(): void
    {
        $verifikator = Pengguna::query()->where('username', 'farhan.verif')->firstOrFail();
        $asnaf = Asnaf::query()->first();

        $nik16 = '3471' . str_pad((string) random_int(100000000000, 999999999999), 12, '0', STR_PAD_LEFT);

        $payload = [
            'nik' => $nik16,
            'nama_lengkap' => 'Duplikat Mustahik',
            'id_asnaf' => $asnaf->id_asnaf,
            'alamat_kecamatan' => 'Marpoyan Damai',
        ];

        // Pertama berhasil
        $this->actingAs($verifikator)->post('/mustahik', $payload)->assertSessionHas('success');

        // Kedua harus ditolak karena NIK sudah ada
        $this->actingAs($verifikator)->post('/mustahik', $payload)->assertSessionHasErrors('nik');

        // Cleanup
        Mustahik::query()->where('nik', $nik16)->delete();
    }

    public function test_sp_verifikasi_mustahik_sets_layak_status(): void
    {
        $verifikator = Pengguna::query()->where('username', 'farhan.verif')->firstOrFail();
        $asnaf = Asnaf::query()->first();

        // Daftarkan mustahik baru
        $nik16 = '3471' . str_pad((string) random_int(100000000000, 999999999999), 12, '0', STR_PAD_LEFT);

        $this->actingAs($verifikator)
            ->post('/mustahik', [
                'nik' => $nik16,
                'nama_lengkap' => 'Target Survei Layak',
                'id_asnaf' => $asnaf->id_asnaf,
                'alamat_kecamatan' => 'Tampan',
            ])
            ->assertSessionHas('success');

        $mustahik = Mustahik::query()->where('nik', $nik16)->firstOrFail();
        $this->assertSame('BELUM_VERIFIKASI', $mustahik->status_kelayakan);

        // Lakukan survei → LAYAK
        $this->actingAs($verifikator)
            ->post("/mustahik/{$mustahik->id_mustahik}/verifikasi", [
                'id_asnaf_rekom' => $asnaf->id_asnaf,
                'tgl_survei' => now()->toDateString(),
                'skor_kelayakan' => 80,
                'hasil_verifikasi' => 'LAYAK',
                'catatan_survei' => 'Kondisi baik, tanggungan 3 orang.',
            ])
            ->assertSessionHas('success');

        // Status harus berubah ke LAYAK di database
        $mustahik->refresh();
        $this->assertSame('LAYAK', $mustahik->status_kelayakan);
        $this->assertNotNull($mustahik->tgl_verifikasi);
        $this->assertNotNull($mustahik->tgl_kedaluwarsa);

        // Cleanup: hapus survei dan mustahik
        DB::table('survei_verifikasi_mustahik')->where('id_mustahik', $mustahik->id_mustahik)->delete();
        $mustahik->delete();
    }
}
