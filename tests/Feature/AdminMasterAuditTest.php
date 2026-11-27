<?php

namespace Tests\Feature;

use App\Models\JenisDana;
use App\Models\Pengguna;
use App\Models\Program;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdminMasterAuditTest extends TestCase
{
    public function test_admin_routes_are_restricted_to_admin_sistem(): void
    {
        $petugas = Pengguna::query()->where('username', 'rizky.himpun')->firstOrFail();
        $verifikator = Pengguna::query()->where('username', 'farhan.verif')->firstOrFail();
        $manajer = Pengguna::query()->where('username', 'hendra.manajer')->firstOrFail();
        $admin = Pengguna::query()->where('username', 'ahmad.admin')->firstOrFail();

        foreach (['/admin/master', '/admin/mutasi', '/admin/audit'] as $uri) {
            $this->actingAs($petugas)->get($uri)->assertForbidden();
            $this->actingAs($verifikator)->get($uri)->assertForbidden();
            $this->actingAs($manajer)->get($uri)->assertForbidden();
            $this->actingAs($admin)->get($uri)->assertOk();
        }
    }

    public function test_admin_can_create_program_and_cannot_deactivate_self(): void
    {
        $admin = Pengguna::query()->where('username', 'ahmad.admin')->firstOrFail();
        $jenisDana = JenisDana::query()->where('is_aktif', true)->firstOrFail();
        $kode = 'PRG-TEST-' . random_int(100, 999);

        $this->actingAs($admin)
            ->post('/admin/program', [
                'id_jenis_dana' => $jenisDana->id_jenis_dana,
                'kode_program' => $kode,
                'nama_program' => 'Program Uji Admin',
                'target_dana' => 10000000,
                'tgl_mulai' => now()->toDateString(),
                'status_program' => 'AKTIF',
            ])
            ->assertSessionHas('success');

        $program = Program::query()->where('kode_program', $kode)->firstOrFail();

        $this->actingAs($admin)
            ->patch("/admin/pengguna/{$admin->id_pengguna}/toggle")
            ->assertSessionHasErrors('db_error');

        $program->delete();
    }

    public function test_partitioned_ledger_and_readonly_audit_render_inertia_props(): void
    {
        $admin = Pengguna::query()->where('username', 'ahmad.admin')->firstOrFail();

        $this->actingAs($admin)
            ->get('/admin/mutasi?tahun=2025')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/BukuBesar')
                ->has('partitions', 4)
                ->has('mutasi.data'));

        $this->actingAs($admin)
            ->get('/admin/audit')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/AuditTrail')
                ->has('logs.data'));
    }
}
