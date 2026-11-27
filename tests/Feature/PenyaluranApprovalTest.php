<?php

namespace Tests\Feature;

use App\Models\DetailPenyaluran;
use App\Models\Mustahik;
use App\Models\Pengguna;
use App\Models\Penyaluran;
use App\Models\Program;
use App\Models\RekeningLembaga;
use App\Models\SaldoDana;
use Tests\TestCase;

class PenyaluranApprovalTest extends TestCase
{
    public function test_role_access_restricted_to_manajer_and_admin(): void
    {
        $petugas = Pengguna::query()->where('username', 'rizky.himpun')->firstOrFail();
        $verifikator = Pengguna::query()->where('username', 'farhan.verif')->firstOrFail();
        $manajer = Pengguna::query()->where('username', 'hendra.manajer')->firstOrFail();
        $admin = Pengguna::query()->where('username', 'ahmad.admin')->firstOrFail();

        $this->actingAs($petugas)->get('/penyaluran/otorisasi')->assertForbidden();
        $this->actingAs($verifikator)->get('/penyaluran/otorisasi')->assertForbidden();

        $this->actingAs($manajer)->get('/penyaluran/otorisasi')->assertOk();
        $this->actingAs($admin)->get('/penyaluran/otorisasi')->assertOk();
    }

    public function test_sp_setujui_penyaluran_enforces_different_approver_and_approves_draft(): void
    {
        $admin = Pengguna::query()->where('username', 'ahmad.admin')->firstOrFail();
        $manajer = Pengguna::query()->where('username', 'hendra.manajer')->firstOrFail();

        $programZakat = Program::query()
            ->where('status_program', 'AKTIF')
            ->whereHas('jenisDana', fn ($q) => $q->where('kategori_induk', 'ZAKAT'))
            ->firstOrFail();

        $rekeningZakat = RekeningLembaga::query()
            ->where('kategori_induk', 'ZAKAT')
            ->where('is_aktif', true)
            ->firstOrFail();

        $mustahikLayak = Mustahik::query()
            ->where('status_kelayakan', 'LAYAK')
            ->whereDate('tgl_kedaluwarsa', '>=', now()->toDateString())
            ->whereHas('asnaf', fn ($q) => $q->where('kode_asnaf', '!=', 'AMIL'))
            ->firstOrFail();

        $nomorSk = 'SK-TEST-APP-' . random_int(1000, 9999);
        $this->actingAs($admin)
            ->post('/penyaluran', [
                'nomor_sk_salur' => $nomorSk,
                'id_program' => $programZakat->id_program,
                'id_rekening' => $rekeningZakat->id_rekening,
                'tgl_pengajuan' => now()->toDateString(),
            ])
            ->assertSessionHas('success');

        $sk = Penyaluran::query()->where('nomor_sk_salur', $nomorSk)->firstOrFail();

        $this->actingAs($admin)
            ->post("/penyaluran/{$sk->id_penyaluran}/detail", [
                'id_mustahik' => $mustahikLayak->id_mustahik,
                'nominal_diterima' => 150000,
                'keterangan_bantuan' => 'Uji approval',
            ])
            ->assertSessionHas('success');

        // Self-approval oleh pengaju harus ditolak oleh sp_setujui_penyaluran
        $this->actingAs($admin)
            ->post("/penyaluran/{$sk->id_penyaluran}/setujui")
            ->assertSessionHasErrors('db_error');

        // Pencairan sebelum DISETUJUI harus ditolak SOP
        $this->actingAs($manajer)
            ->post("/penyaluran/{$sk->id_penyaluran}/cairkan")
            ->assertSessionHasErrors('db_error');

        // Pengesahan oleh Manajer Penyaluran berbeda harus berhasil
        $this->actingAs($manajer)
            ->post("/penyaluran/{$sk->id_penyaluran}/setujui")
            ->assertSessionHas('success');

        $sk->refresh();
        $this->assertSame('DISETUJUI', $sk->status_penyaluran);
        $this->assertSame($manajer->id_pengguna, $sk->id_penyetuju);

        DetailPenyaluran::query()->where('id_penyaluran', $sk->id_penyaluran)->delete();
        $sk->delete();
    }

    public function test_sp_cairkan_penyaluran_prevents_negative_saldo(): void
    {
        $petugas = Pengguna::query()->where('username', 'rizky.himpun')->firstOrFail();
        $manajer = Pengguna::query()->where('username', 'hendra.manajer')->firstOrFail();

        $programZakat = Program::query()
            ->where('status_program', 'AKTIF')
            ->whereHas('jenisDana', fn ($q) => $q->where('kategori_induk', 'ZAKAT'))
            ->firstOrFail();

        $rekeningZakat = RekeningLembaga::query()
            ->where('kategori_induk', 'ZAKAT')
            ->where('is_aktif', true)
            ->firstOrFail();

        $mustahikLayak = Mustahik::query()
            ->where('status_kelayakan', 'LAYAK')
            ->whereDate('tgl_kedaluwarsa', '>=', now()->toDateString())
            ->whereHas('asnaf', fn ($q) => $q->where('kode_asnaf', '!=', 'AMIL'))
            ->firstOrFail();

        $saldoAktif = (float) SaldoDana::query()
            ->where('id_jenis_dana', $programZakat->id_jenis_dana)
            ->value('saldo_aktif');

        $nomorSk = 'SK-TEST-OVER-' . random_int(1000, 9999);
        $this->actingAs($petugas)
            ->post('/penyaluran', [
                'nomor_sk_salur' => $nomorSk,
                'id_program' => $programZakat->id_program,
                'id_rekening' => $rekeningZakat->id_rekening,
                'tgl_pengajuan' => now()->toDateString(),
            ])
            ->assertSessionHas('success');

        $sk = Penyaluran::query()->where('nomor_sk_salur', $nomorSk)->firstOrFail();

        $this->actingAs($petugas)
            ->post("/penyaluran/{$sk->id_penyaluran}/detail", [
                'id_mustahik' => $mustahikLayak->id_mustahik,
                'nominal_diterima' => $saldoAktif + 10000000,
                'keterangan_bantuan' => 'Uji anti minus saldo',
            ])
            ->assertSessionHas('success');

        $this->actingAs($manajer)
            ->post("/penyaluran/{$sk->id_penyaluran}/setujui")
            ->assertSessionHas('success');

        // Pencairan melebihi saldo aktif harus ditolak dengan row-level lock trigger
        $this->actingAs($manajer)
            ->post("/penyaluran/{$sk->id_penyaluran}/cairkan")
            ->assertSessionHasErrors('db_error');

        $sk->refresh();
        $this->assertSame('DISETUJUI', $sk->status_penyaluran);

        DetailPenyaluran::query()->where('id_penyaluran', $sk->id_penyaluran)->delete();
        $sk->delete();
    }
}
