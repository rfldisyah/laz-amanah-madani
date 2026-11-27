import type { KategoriInduk } from '@/types/database';

export const KATEGORI_INDUK_LABELS: Record<KategoriInduk, string> = {
    ZAKAT: 'Zakat',
    INFAK_SEDEKAH: 'Infak & Sedekah',
    WAKAF: 'Wakaf',
};

export function formatRupiah(nominal: string | number): string {
    const value = typeof nominal === 'number' ? nominal : Number(nominal);
    if (Number.isNaN(value)) {
        return 'Rp 0';
    }
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
}

export function formatTanggalId(dateStr: string | null): string {
    if (!dateStr) {
        return '-';
    }
    const parsed = new Date(dateStr);
    if (Number.isNaN(parsed.getTime())) {
        return dateStr;
    }
    return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }).format(parsed);
}
