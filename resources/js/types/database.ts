export type PeranPengguna =
    | 'admin_sistem'
    | 'verifikator'
    | 'petugas_penghimpunan'
    | 'manajer_penyaluran';

export type KategoriInduk = 'ZAKAT' | 'INFAK_SEDEKAH' | 'WAKAF';

export type TipeMuzaki = 'PERORANGAN' | 'LEMBAGA';

export type StatusKelayakan =
    | 'BELUM_VERIFIKASI'
    | 'LAYAK'
    | 'TIDAK_LAYAK'
    | 'KEDALUWARSA';

export type HasilVerifikasi = 'LAYAK' | 'TIDAK_LAYAK';

export type MetodeBayar = 'TUNAI' | 'TRANSFER_BANK' | 'QRIS' | 'POTONG_GAJI';

export type StatusValidasi = 'SAH' | 'BATAL';

export type StatusPenyaluran = 'DRAFT' | 'DISETUJUI' | 'DISALURKAN' | 'DITOLAK';

export type StatusProgram = 'AKTIF' | 'SELESAI' | 'DITUTUP';

export type JenisMutasi = 'MASUK' | 'KELUAR';

export type AksiAudit = 'INSERT' | 'UPDATE' | 'DELETE';

export interface Pengguna {
    id_pengguna: number;
    nama_lengkap: string;
    username: string;
    peran: PeranPengguna;
    jabatan: string;
    is_aktif: boolean;
}

export interface Asnaf {
    id_asnaf: number;
    kode_asnaf: string;
    nama_asnaf: string;
    deskripsi: string | null;
    maks_persen: string;
}

export interface JenisDana {
    id_jenis_dana: number;
    parent_id: number | null;
    kode_dana: string;
    nama_dana: string;
    kategori_induk: KategoriInduk;
    is_terikat: boolean;
    is_aktif: boolean;
}

export interface RekeningLembaga {
    id_rekening: number;
    nomor_rekening: string;
    nama_bank: string;
    atas_nama: string;
    kategori_induk: KategoriInduk;
    is_aktif: boolean;
}

export interface SaldoDana {
    id_saldo: number;
    id_jenis_dana: number;
    saldo_aktif: string;
    total_masuk: string;
    total_keluar: string;
    updated_at: string;
}

export interface Program {
    id_program: number;
    id_jenis_dana: number;
    kode_program: string;
    nama_program: string;
    target_dana: string;
    tgl_mulai: string;
    tgl_selesai: string | null;
    status_program: StatusProgram;
}

export interface Muzaki {
    id_muzaki: number;
    kode_muzaki: string;
    nama_muzaki: string;
    tipe_muzaki: TipeMuzaki;
    nik_npwp: string | null;
    no_hp: string | null;
    alamat: string | null;
}

export interface Mustahik {
    id_mustahik: number;
    nik: string;
    nama_lengkap: string;
    id_asnaf: number;
    id_verifikator: number | null;
    alamat_kecamatan: string;
    status_kelayakan: StatusKelayakan;
    tgl_verifikasi: string | null;
    tgl_kedaluwarsa: string | null;
}

export interface SurveiVerifikasiMustahik {
    id_survei: number;
    id_mustahik: number;
    id_verifikator: number;
    id_asnaf_rekom: number;
    tgl_survei: string;
    skor_kelayakan: number;
    hasil_verifikasi: HasilVerifikasi;
    catatan_survei: string | null;
}

export interface Penghimpunan {
    id_penghimpunan: number;
    nomor_kuitansi: string;
    id_muzaki: number;
    id_jenis_dana: number;
    id_rekening: number;
    id_petugas: number;
    tgl_setor: string;
    nominal: string;
    metode_bayar: MetodeBayar;
    status_validasi: StatusValidasi;
}

export interface Penyaluran {
    id_penyaluran: number;
    nomor_sk_salur: string;
    id_program: number;
    id_jenis_dana: number;
    id_rekening: number;
    id_pengaju: number;
    id_penyetuju: number | null;
    tgl_pengajuan: string;
    tgl_disetujui: string | null;
    tgl_disalurkan: string | null;
    total_nominal: string;
    status_penyaluran: StatusPenyaluran;
}

export interface DetailPenyaluran {
    id_detail_salur: number;
    id_penyaluran: number;
    id_mustahik: number;
    id_asnaf_saat_salur: number;
    nominal_diterima: string;
    keterangan_bantuan: string | null;
}

export interface MutasiDana {
    id_mutasi: number;
    waktu_mutasi: string;
    id_jenis_dana: number;
    id_rekening: number;
    jenis_mutasi: JenisMutasi;
    nomor_referensi: string;
    nominal_mutasi: string;
    saldo_sebelum: string;
    saldo_sesudah: string;
    keterangan: string | null;
}

export interface LogAudit {
    id_audit: number;
    waktu_kejadian: string;
    nama_tabel: string;
    id_record: string;
    aksi: AksiAudit;
    kolom_berubah: string;
    nilai_lama: string | null;
    nilai_baru: string | null;
    dilakukan_oleh: string;
}

export interface LaporanPublikZis {
    nomor_sk_salur: string;
    nama_program: string;
    kategori_induk: KategoriInduk;
    sumber_dana: string;
    kecamatan_penerima: string;
    golongan_asnaf: string;
    nik_tersamar: string | null;
    nama_mustahik_tersamar: string | null;
    nominal_diterima: string;
    keterangan_bantuan: string | null;
    tanggal_penyaluran: string | null;
}

export interface PeringkatMuzaki {
    id_muzaki: number;
    kode_muzaki: string;
    nama_muzaki: string;
    tipe_muzaki: TipeMuzaki;
    frekuensi_setor: number;
    total_donasi: string;
    setor_terakhir: string | null;
}

export interface PorsiAsnaf {
    id_asnaf: number;
    kode_asnaf: string;
    nama_asnaf: string;
    batas_maks_persen: string;
    jumlah_penerima: number;
    total_disalurkan: string;
    persentase_terhadap_zakat: string | null;
}

export interface RekapIndukDana {
    kategori_induk: KategoriInduk;
    jumlah_kantong_dana: number;
    total_terhimpun: string;
    total_tersalurkan: string;
    saldo_tersedia: string;
}

export interface SharedPageProps {
    [key: string]: unknown;
    auth: {
        user: Pengguna | null;
    };
    flash: {
        success?: string;
        error?: string;
    };
    errors: Record<string, string>;
}
