<?php

namespace Tests\Feature;

use App\Models\DetailPenyaluran;
use App\Models\Mustahik;
use App\Models\Pengguna;
use App\Models\Penyaluran;
use App\Models\Program;
use App\Models\RekeningLembaga;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class PenyaluranDraftTest extends TestCase
{
    public function test_role_access_restricted_to_petugas_verifikator_and_admin(): void
    {
        $manajer = Pengguna::query()->where('username', 'hendra.manajer')->firstOrFail();
        $petugas = Pengguna::query()->where('username', 'rizky.himpun')->firstOrFail();
        $verifikator = Pengguna::query()->where('username', 'farhan.verif')->firstOrFail();
        $admin = Pengguna::query()->where('username', 'ahmad.admin')->firstOrFail();

        $this->actingAs($manajer)->get('/penyaluran')->assertForbidden();
        $this->actingAs($petugas)->get('/penyaluran')->assertOk();
        $this->actingAs($verifikator)->get('/penyaluran')->assertOk();
        $this->actingAs($admin)->get('/penyaluran')->assertOk();
    }

    public function test_draft_sk_creation_enforces_matching_rekening_and_creates_draft(): void
    {
        $petugas = Pengguna::query()->where('username', 'rizky.himpun')->firstOrFail();
        $programZakat = Program::query()
            ->where('status_program', 'AKTIF')
            ->whereHas('jenisDana', fn ($q) => $q->where('kategori_induk', 'ZAKAT'))
            ->firstOrFail();

        $rekeningInfak = RekeningLembaga::query()
            ->where('kategori_induk', 'INFAK_SEDEKAH')
            ->where('is_aktif', true)
            ->firstOrFail();

        $rekeningZakat = RekeningLembaga::query()
            ->where('kategori_induk', 'ZAKAT')
            ->where('is_aktif', true)
            ->firstOrFail();

        $nomorMismatch = 'SK-TEST-MISMATCH-' . random_int(1000, 9999);
        $this->actingAs($petugas)
            ->post('/penyaluran', [
                'nomor_sk_salur' => $nomorMismatch,
                'id_program' => $programZakat->id_program,
                'id_rekening' => $rekeningInfak->id_rekening,
                'tgl_pengajuan' => now()->toDateString(),
            ])
            ->assertSessionHasErrors('db_error');

        $nomorValid = 'SK-TEST-DRAFT-' . random_int(1000, 9999);
        $this->actingAs($petugas)
            ->post('/penyaluran', [
                'nomor_sk_salur' => $nomorValid,
                'id_program' => $programZakat->id_program,
                'id_rekening' => $rekeningZakat->id_rekening,
                'tgl_pengajuan' => now()->toDateString(),
            ])
            ->assertSessionHas('success');

        $sk = Penyaluran::query()->where('nomor_sk_salur', $nomorValid)->firstOrFail();
        $this->assertSame('DRAFT', $sk->status_penyaluran);
        $this->assertSame('0.00', (string) $sk->total_nominal);

        $sk->delete();
    }

    public function test_detail_penyaluran_validates_layak_mustahik_and_amil_quota_trigger(): void
    {
        $petugas = Pengguna::query()->where('username', 'rizky.himpun')->firstOrFail();
        $programZakat = Program::query()
            ->where('status_program', 'AKTIF')
            ->whereHas('jenisDana', fn ($q) => $q->where('kategori_induk', 'ZAKAT'))
            ->firstOrFail();
        $rekeningZakat = RekeningLembaga::query()
            ->where('kategori_induk', 'ZAKAT')
            ->where('is_aktif', true)
            ->firstOrFail();

        $nomorSk = 'SK-TEST-DTL-' . random_int(1000, 9999);
        $this->actingAs($petugas)
            ->post('/penyaluran', [
                'nomor_sk_salur' => $nomorSk,
                'id_program' => $programZakat->id_program,
                'id_rekening' => $rekeningZakat->id_rekening,
                'tgl_pengajuan' => now()->toDateString(),
            ])
            ->assertSessionHas('success');

        $sk = Penyaluran::query()->where('nomor_sk_salur', $nomorSk)->firstOrFail();

        $mustahikLayak = Mustahik::query()
            ->where('status_kelayakan', 'LAYAK')
            ->whereDate('tgl_kedaluwarsa', '>=', now()->toDateString())
            ->whereHas('asnaf', fn ($q) => $q->where('kode_asnaf', '!=', 'AMIL'))
            ->firstOrFail();

        $this->actingAs($petugas)
            ->post("/penyaluran/{$sk->id_penyaluran}/detail", [
                'id_mustahik' => $mustahikLayak->id_mustahik,
                'nominal_diterima' => 250000,
                'keterangan_bantuan' => 'Bantuan uji layak',
            ])
            ->assertSessionHas('success');

        $sk->refresh();
        $this->assertSame('250000.00', (string) $sk->total_nominal);

        $mustahikBelumVerif = Mustahik::query()
            ->where('status_kelayakan', 'BELUM_VERIFIKASI')
            ->first();

        if ($mustahikBelumVerif) {
            $this->actingAs($petugas)
                ->post("/penyaluran/{$sk->id_penyaluran}/detail", [
                    'id_mustahik' => $mustahikBelumVerif->id_mustahik,
                    'nominal_diterima' => 100000,
                    'keterangan_bantuan' => 'Harus ditolak trigger syariah',
                ])
                ->assertSessionHasErrors('db_error');
        }

        $amilMustahik = Mustahik::query()
            ->where('status_kelayakan', 'LAYAK')
            ->whereDate('tgl_kedaluwarsa', '>=', now()->toDateString())
            ->whereHas('asnaf', fn ($q) => $q->where('kode_asnaf', 'AMIL'))
            ->first();

        if ($amilMustahik) {
            $sisa = (float) DB::selectOne('SELECT fn_sisa_kuota_amil(YEAR(CURDATE()), MONTH(CURDATE())) AS sisa')->sisa;
            $this->actingAs($petugas)
                ->post("/penyaluran/{$sk->id_penyaluran}/detail", [
                    'id_mustahik' => $amilMustahik->id_mustahik,
                    'nominal_diterima' => $sisa + 500000,
                    'keterangan_bantuan' => 'Harus ditolak kuota amil',
                ])
                ->assertSessionHasErrors('db_error');
        }

        DetailPenyaluran::query()->where('id_penyaluran', $sk->id_penyaluran)->delete();
        $sk->delete();
    }
}
