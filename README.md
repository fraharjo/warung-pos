# Warung POS — Aplikasi Kasir, Pesanan & Stok

Aplikasi kasir (Point of Sale) modern berbasis **Next.js (App Router) + Tailwind CSS** untuk warung, kafe, dan usaha kuliner UMKM. Siap jalan lokal tanpa setup database, dan siap deploy gratis di **Vercel + Neon PostgreSQL**.

## Fitur Utama

- **2 Role Login (Kasir & Admin)**
  - **Kasir** (`kasir` / `kasir123`): Layar order cepat dengan filter kategori & pencarian menu, dukungan pembayaran **Tunai** (hitung kembalian otomatis) dan **QRIS**, cetak struk termal ukuran **58mm / 80mm**, serta riwayat transaksi harian.
  - **Admin** (`admin` / `admin123`):
    - **Laporan Penjualan:** Ringkasan omzet harian/rentang tanggal, metode pembayaran (Tunai vs QRIS), grafik tren omzet harian, serta rekap jumlah terjual per menu & kategori.
    - **Stok Menu:** Pelacakan stok otomatis untuk menu pilihan, penambahan/penyesuaian stok, serta riwayat keluar-masuk stok dengan paginasi.
    - **Daftar Pesanan & Pembatalan:** Filter berdasarkan tanggal dan metode pembayaran; pembatalan pesanan khusus Admin yang otomatis mengembalikan stok.
    - **Menu, Kategori & Harga:** Kelola kategori kustom, tambah/edit/hapus menu, atur status aktif/nonaktif, dan ubah urutan kartu menu di layar kasir (drag-and-drop atau tombol naik/turun).
    - **Pengaturan General & Pengguna:** Ubah nama usaha, logo toko, alamat, nomor telepon, footer struk, serta kelola akun admin & kasir.

## Cara Menjalankan di Lokal

```bash
npm install
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.
Secara default tanpa file `.env`, data tersimpan otomatis di `.local-data/db.json` sehingga bisa langsung dicoba.

## Cara Deploy Gratis ke Vercel + Neon PostgreSQL

1. Push repository ini ke GitHub.
2. Masuk ke [vercel.com](https://vercel.com) → **Add New Project** → import repository GitHub.
3. Di dashboard project Vercel, buka tab **Storage** → **Create Database** → pilih **Neon (Serverless Postgres)** → hubungkan ke project (otomatis mengisi `DATABASE_URL`).
4. Tambahkan environment variable `AUTH_SECRET` di **Settings → Environment Variables** dengan string acak panjang (minimal 32 karakter).
5. Klik **Redeploy**. Saat pertama kali diakses, tabel database serta akun & data awal akan terbuat secara otomatis.
6. Login sebagai `admin` / `admin123` lalu segera ganti password dan sesuaikan nama/logo usaha di menu **Pengaturan**.
