<?php

namespace Tests\Feature;

use App\Models\Pengguna;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class DashboardOverviewTest extends TestCase
{
    public function test_dashboard_overview_returns_saldo_dana_and_amil_quota(): void
    {
        $admin = Pengguna::query()->where('username', 'ahmad.admin')->firstOrFail();

        $response = $this->actingAs($admin)->get('/dashboard');

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Dashboard/Index')
            ->has('rekapDana', 3)
            ->has('kantongSaldo')
            ->where('amilQuota.kode_asnaf', 'AMIL')
            ->where('amilQuota.batas_maks_persen', '12.50')
            ->has('ringkasanOperasional.sk_draft')
            ->has('ringkasanOperasional.mustahik_belum_verifikasi')
        );
    }

    public function test_all_four_internal_roles_can_access_dashboard(): void
    {
        $usernames = [
            'ahmad.admin',
            'farhan.verif',
            'rizky.himpun',
            'hendra.manajer',
        ];

        foreach ($usernames as $username) {
            $user = Pengguna::query()->where('username', $username)->firstOrFail();

            $this->actingAs($user)
                ->get('/dashboard')
                ->assertOk();
        }
    }
}
