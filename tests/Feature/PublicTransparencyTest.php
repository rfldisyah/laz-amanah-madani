<?php

namespace Tests\Feature;

use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PublicTransparencyTest extends TestCase
{
    public function test_public_landing_page_loads_without_authentication(): void
    {
        $response = $this->get('/');

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Public/Home')
            ->has('rekapDana', 3)
            ->has('porsiAsnaf', 8)
            ->has('laporanPublik')
            ->has('rekeningResmi')
        );
    }

    public function test_public_laporan_masks_mustahik_identity(): void
    {
        $response = $this->get('/');

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Public/Home')
            ->where('laporanPublik.0.nik_tersamar', fn (string $nik) => str_contains($nik, '*'))
            ->where('laporanPublik.0.nama_mustahik_tersamar', fn (string $nama) => str_contains($nama, '*'))
        );
    }
}
