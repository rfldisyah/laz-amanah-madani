<?php

namespace Tests\Feature;

use App\Models\Pengguna;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class FoundationAuthTest extends TestCase
{
    public function test_guest_is_redirected_from_dashboard_to_login(): void
    {
        $response = $this->get('/dashboard');

        $response->assertRedirect('/login');
    }

    public function test_active_staff_can_login_and_access_dashboard(): void
    {
        $response = $this->post('/login', [
            'username' => 'ahmad.admin',
        ]);

        $response->assertRedirect('/dashboard');
        $this->assertAuthenticated();

        $dashboard = $this->get('/dashboard');
        $dashboard->assertOk();
    }

    public function test_unknown_username_is_rejected_on_login(): void
    {
        $response = $this->from('/login')->post('/login', [
            'username' => 'tidak.ada.user',
        ]);

        $response->assertRedirect('/login');
        $response->assertSessionHasErrors('username');
        $this->assertGuest();
    }

    public function test_check_laz_role_middleware_enforces_role_boundaries(): void
    {
        Route::middleware(['web', 'auth', 'laz.role:manajer_penyaluran'])
            ->get('/_test-manajer-only', fn () => response('ok'));

        $verifikator = Pengguna::query()->where('username', 'farhan.verif')->firstOrFail();

        $this->actingAs($verifikator)
            ->get('/_test-manajer-only')
            ->assertForbidden();

        $manajer = Pengguna::query()->where('username', 'hendra.manajer')->firstOrFail();

        $this->actingAs($manajer)
            ->get('/_test-manajer-only')
            ->assertOk();
    }

    public function test_staff_can_logout(): void
    {
        $admin = Pengguna::query()->where('username', 'ahmad.admin')->firstOrFail();

        $response = $this->actingAs($admin)->post('/logout');

        $response->assertRedirect('/login');
        $this->assertGuest();
    }
}
