# Kopi Teras — Sistem Pemesanan Mandiri (Self-Order) Web QR Code

Aplikasi web *self-order* berbasis pemindaian QR Code di meja untuk kafe **Kopi Teras** (operasional 24 jam). Dirancang **zero-friction** bagi pelanggan (tanpa instalasi aplikasi dan tanpa registrasi/login) serta dilengkapi dashboard real-time untuk **Kasir**, **Dapur (KDS)**, dan **Admin / Manajer**.

---

## Tech Stack
* **Framework:** Next.js 15 (App Router, React 19, TypeScript)
* **Styling & UI:** Tailwind CSS v4 + komponen berbasis Radix UI (`shadcn/ui`) + Lucide Icons
* **Database & ORM:** MySQL + Prisma ORM
* **State & Real-Time Polling:** Zustand (`persist` ke `localStorage`) + SWR (polling 3 detik)
* **Autentikasi Staf:** JWT (`jose`) via `httpOnly` cookie + `bcryptjs`
* **QR Code Generator:** `qrcode` (preview, cetak lembar A4, & unduh stiker PNG)

---

## Fitur Utama

### 1. Pelanggan (Mobile-First)
* **Validasi Meja (`/order/[tableId]`):** Mengunci nomor meja (`IN-01`, `OUT-05`, dst.) dan menampilkan halaman informasi ramah bila QR meja tidak valid atau sedang dinonaktifkan.
* **Katalog & Keranjang Tahan Gangguan Sinyal:** Filter kategori (`Promo`, `Coffee`, `Non-Coffee`, `Snack`, `Main Course`), pencarian menu, tombol cepat catatan (*less sugar*, *less ice*, dll.), serta keranjang yang tersimpan di `localStorage` via Zustand.
* **Checkout QRIS Statis (`/order/[tableId]/checkout`):** Tampilan QRIS Statis Kopi Teras (bisa diunduh pelanggan), kompresi gambar bukti bayar otomatis di sisi browser (hemat kuota di area outdoor), dan validasi form sebelum kirim pesanan.
* **Tracking Status Real-Time (`/order/[tableId]/status/[orderId]`):** Pembaruan otomatis tiap 3 detik (`PENDING_VERIFICATION` → `PROCESSING` → `READY` / `CANCELLED`) lengkap dengan bunyi bel & getar saat pesanan siap diambil di konter (*Self-Pickup*).

### 2. Dashboard Kasir (`/dashboard/cashier`)
* **Audio Alert Otomatis:** Membunyikan bel (`HTML5 Audio API`) setiap kali pesanan `PENDING_VERIFICATION` baru masuk.
* **Verifikasi Bukti Bayar:** Pratinjau foto bukti bayar (klik untuk memperbesar), tombol **Konfirmasi Lunas** (`PROCESSING`) dan **Batalkan** (`CANCELLED`).
* **Cetak Struk Thermal Otomatis (`58mm` / `80mm`):** Saat kasir menekan **Konfirmasi Lunas**, dialog cetak struk (`@media print` + `window.print()`) langsung terbuka dan pesanan diteruskan ke layar Dapur.

### 3. Dashboard Dapur / KDS (`/dashboard/kitchen`)
* **Antrean FIFO:** Menampilkan pesanan berstatus `PROCESSING` secara berurutan (First In, First Out) lengkap dengan nomor meja, durasi tunggu, kuantitas, dan sorotan catatan item.
* **Panggil Pelanggan:** Tombol **Pesanan Selesai** mengubah status menjadi `READY` dan memicu notifikasi pengambilan di layar HP pelanggan dalam ≤ 5 detik.

### 4. Dashboard Admin / Manajer (`/dashboard/admin`)
* **CRUD Menu & Promo/Bundling:** Tambah, edit, hapus menu, unggah foto menu, serta atur harga promo.
* **Toggle Stok Instan:** Ubah status **Tersedia / Habis** (`isAvailable`) secara instan dengan *optimistic update*.
* **Manajemen Meja & Generator QR Code:** Tambah/nonaktifkan meja, sesuaikan URL dasar aplikasi, unduh stiker PNG siap cetak per meja, atau cetak seluruh QR Code meja aktif sekaligus.

---

## Cara Menjalankan Proyek

### 1. Prasyarat
* **Node.js** ≥ 20
* **MySQL** / **MariaDB** aktif (mis. via Laragon, XAMPP, atau MySQL Server)

### 2. Konfigurasi Environment
Salin `.env.example` menjadi `.env` lalu sesuaikan `DATABASE_URL` dengan kredensial MySQL Anda:

```env
DATABASE_URL="mysql://root:password@localhost:3306/kopi_teras"
AUTH_SECRET="ganti-dengan-string-acak-minimal-32-karakter"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_QRIS_IMAGE="/qris-placeholder.svg"
```

> **Mengganti QRIS Asli:** Simpan gambar QRIS Statis Kopi Teras di `public/qris-kopi-teras.png`, lalu ubah `NEXT_PUBLIC_QRIS_IMAGE="/qris-kopi-teras.png"`.

### 3. Instalasi, Push Skema & Seed Data Dummy
```bash
npm install
npm run db:setup
```

Perintah `npm run db:setup` akan menjalankan `prisma db push` (membuat tabel di MySQL) dan `prisma db seed` (mengisi 14 meja Indoor/Outdoor, 24 menu + paket promo Kopi Teras, serta 3 akun staf).

### 4. Jalankan Server Development
```bash
npm run dev
```
Untuk diakses oleh HP pelanggan di jaringan Wi-Fi lokal kafe:
```bash
npm run dev:lan
```

---

## Akun Staf Bawaan (`/login`)

| Role | Username | Password | Halaman Tujuan |
| :--- | :--- | :--- | :--- |
| **Kasir** | `kasir` | `kasir123` | `/dashboard/cashier` |
| **Dapur (KDS)** | `dapur` | `dapur123` | `/dashboard/kitchen` |
| **Admin / Manajer** | `admin` | `admin123` | `/dashboard/admin` |
