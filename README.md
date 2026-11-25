# Kasir Ayam Bakar — POS, Pesanan & Stok

Aplikasi kasir sederhana berbasis **Next.js (App Router) + Tailwind CSS** untuk usaha jualan ayam bakar. Siap jalan lokal tanpa setup database, dan siap deploy **100% gratis di Vercel + Neon PostgreSQL**.

## Fitur Utama

- **2 Role Login (Kasir & Admin)**
  - **Kasir** (`kasir` / `kasir123`): Layar order cepat (Ayam Bakar Paha, Ayam Bakar Dada, Nasi Putih, Nasi Uduk, Es Teh Manis, Teh Tawar), hitung total order & kembalian (Tunai / QRIS), cetak struk 58mm, dan lihat riwayat transaksi hari ini.
  - **Admin** (`admin` / `admin123`):
    - **Laporan Penjualan:** Omzet harian/rentang tanggal, Tunai vs QRIS, serta rekap jumlah terjual tiap menu (berapa potong ayam, porsi nasi putih/uduk, dan gelas es teh/teh tawar yang laku).
    - **Manajemen Stok Ayam:** Pelacakan stok otomatis untuk **Ayam Bakar (Paha)** & **Ayam Bakar (Dada)**, fitur **Restock Cepat per Ekor** (`1 ekor = 2 paha + 2 dada`), penyesuaian stok rusak/gosong, serta riwayat keluar-masuk stok.
    - **Pembatalan Pesanan (Khusus Admin):** Hanya Admin yang dapat membatalkan pesanan; stok ayam otomatis kembali dan tercatat di log.
    - **Kelola Menu & Harga:** Tambah, edit, dan nonaktifkan menu kapan saja.
    - **Akun & Pengaturan Warung:** Kelola akun kasir/admin serta ubah nama warung, alamat, dan footer struk.

## Cara Menjalankan di Lokal

```bash
npm install
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.
Secara default tanpa file `.env`, data tersimpan otomatis di `.local-data/db.json` sehingga bisa langsung dicoba.

## Cara Deploy Gratis ke Vercel + Neon PostgreSQL

1. Push folder project ini ke repository GitHub.
2. Masuk ke [vercel.com](https://vercel.com) → **Add New Project** → pilih repository GitHub kamu.
3. Di dashboard project Vercel, buka tab **Storage** → **Create Database** → pilih **Neon (Serverless Postgres - Free Tier)** → hubungkan ke project.
   - Vercel akan otomatis mengisi environment variable `DATABASE_URL`.
4. Tambahkan environment variable `AUTH_SECRET` di **Settings → Environment Variables** dengan string acak panjang (minimal 32 karakter).
5. Klik **Redeploy**. Saat pertama kali diakses, tabel database serta akun & menu awal akan terbuat secara otomatis!
6. Login sebagai `admin` / `admin123` lalu segera ganti password di menu **Akun & Warung**.
