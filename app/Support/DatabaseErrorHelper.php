<?php

namespace App\Support;

use Illuminate\Database\QueryException;

class DatabaseErrorHelper
{
    public static function extractMessage(QueryException $exception): string
    {
        if (isset($exception->errorInfo[2]) && is_string($exception->errorInfo[2]) && $exception->errorInfo[2] !== '') {
            return $exception->errorInfo[2];
        }

        return 'Terjadi kesalahan aturan basis data saat memproses transaksi.';
    }
}
