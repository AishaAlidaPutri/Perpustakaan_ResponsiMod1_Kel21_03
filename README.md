# 📚 REST API Perpustakaan

REST API modern dan andal untuk mengelola data anggota perpustakaan, katalog buku, dan transaksi peminjaman buku beserta pelacakan status pengembalian dan keterlambatan secara otomatis. Dibangun menggunakan **Node.js**, **Express.js**, dan database **Supabase (PostgreSQL)**.

---

## 🎯 Deskripsi Umum & Tujuan Proyek

Proyek ini bertujuan untuk menyediakan layanan backend API yang menangani seluruh operasi inti perpustakaan, antara lain:
- **Pengelolaan Anggota (Members)**: Pendaftaran, pembaruan, dan pencatatan anggota perpustakaan.
- **Katalog Buku & Manajemen Stok (Books)**: Pengelolaan buku dengan kontrol stok *real-time*.
- **Peminjaman & Pengembalian Buku (Loans)**:
  - Validasi stok otomatis saat peminjaman (mencegah *over-borrowing* / buku dipinjam saat stok habis).
  - Pengurangan stok otomatis saat dipinjam dan pemulihan stok otomatis saat buku dikembalikan atau peminjaman dihapus.
  - Pelacakan status keterlambatan dinamis (*real-time*) berdasarkan tanggal jatuh tempo (`due_date`) dan tanggal pengembalian (`return_date`).
  - Fitur filter peminjaman berdasarkan status (`Dipinjam`, `Dikembalikan`, `Terlambat`).

---

## 🚀 Link Deployment Vercel

Aplikasi ini telah dikonfigurasi untuk siap di-deploy ke Vercel:
- **Live API URL**: [https://perpustakaan-api.vercel.app](https://perpustakaan-api.vercel.app) *(Ganti dengan URL proyek Vercel milikmu jika berbeda)*
- **Base Endpoint**: `/` (menampilkan status API dan daftar endpoint yang tersedia)

---

## 🗄️ Struktur Data / Skema Database

Database menggunakan PostgreSQL pada platform Supabase dengan 3 tabel utama yang saling berelasi:

```
+----------------+          +-------------------------+          +----------------+
|    members     |          |          loans          |          |     books      |
+----------------+          +-------------------------+          +----------------+
| id (UUID, PK)  |<----+    | id (UUID, PK)           |    +---->| id (UUID, PK)  |
| name (VARCHAR) |     +----| member_id (UUID, FK)    |    |     | title (VARCHAR)|
| email (VARCHAR)|          | book_id (UUID, FK)      |----+     | author(VARCHAR)|
| created_at     |          | loan_date (DATE)        |          | stock (INTEGER)|
+----------------+          | due_date (DATE)         |          | created_at     |
                            | return_date (DATE)      |          +----------------+
                            | status (VARCHAR)        |
                            | created_at              |
                            +-------------------------+
```

### 1. Tabel `members`
| Kolom | Tipe Data | Keterangan |
|---|---|---|
| `id` | UUID (Primary Key) | Identifier unik anggota (auto-generated) |
| `name` | VARCHAR | Nama lengkap anggota (Wajib diisi) |
| `email` | VARCHAR (Nullable) | Alamat email anggota |
| `created_at` | TIMESTAMPTZ | Waktu data dibuat |

### 2. Tabel `books`
| Kolom | Tipe Data | Keterangan |
|---|---|---|
| `id` | UUID (Primary Key) | Identifier unik buku (auto-generated) |
| `title` | VARCHAR | Judul buku (Wajib diisi) |
| `author` | VARCHAR (Nullable) | Penulis buku |
| `stock` | INTEGER | Jumlah stok buku tersedia (Nonnegatif $\ge 0$) |
| `created_at` | TIMESTAMPTZ | Waktu data dibuat |

### 3. Tabel `loans`
| Kolom | Tipe Data | Keterangan |
|---|---|---|
| `id` | UUID (Primary Key) | Identifier unik transaksi peminjaman |
| `member_id` | UUID (Foreign Key) | Merujuk ke `members.id` |
| `book_id` | UUID (Foreign Key) | Merujuk ke `books.id` |
| `loan_date` | DATE | Tanggal awal peminjaman |
| `due_date` | DATE | Batas waktu/jatuh tempo pengembalian |
| `return_date` | DATE (Nullable) | Tanggal buku dikembalikan |
| `status` | VARCHAR | Status peminjaman (`Dipinjam`, `Dikembalikan`, `Terlambat`) |
| `created_at` | TIMESTAMPTZ | Waktu data dibuat |

---

## 📌 Endpoint & Contoh Request/Response

Base URL Lokal: `http://localhost:3000`  
Header: `Content-Type: application/json`

---

### 1. Modul Members (`/members`)

#### A. Tambah Anggota (Create)
- **POST** `/members`
- **Request Body**:
```json
{
  "name": "Aisha",
  "email": "Aisha@example.com"
}
```
- **Response (201 Created)**:
```json
{
  "id": "71f5eb2b-9f88-4953-81ed-baadb5400701",
  "name": "Aisha",
  "email": "Aisha@example.com"
}
```

#### B. Ambil Semua Anggota (Read All)
- **GET** `/members`
- **Response (200 OK)**:
```json
[
  {
    "id": "71f5eb2b-9f88-4953-81ed-baadb5400701",
    "name": "Aisha",
    "email": "Aisha@example.com"
  }
]
```

#### C. Ambil Detail Anggota (Read by ID)
- **GET** `/members/:id`
- **Response (200 OK)**:
```json
{
  "id": "71f5eb2b-9f88-4953-81ed-baadb5400701",
  "name": "Aisha",
  "email": "Aisha@example.com"
}
```

#### D. Update Anggota (Update)
- **PUT** `/members/:id`
- **Request Body**:
```json
{
  "name": "Aisha Updated",
  "email": "Aishacantik@example.com"
}
```
- **Response (200 OK)**:
```json
{
  "id": "71f5eb2b-9f88-4953-81ed-baadb5400701",
  "name": "Aisha Updated",
  "email": "Aishacantik@example.com"
}
```

#### E. Hapus Anggota (Delete)
- **DELETE** `/members/:id`
- **Response (200 OK)**:
```json
{
  "message": "Anggota berhasil dihapus"
}
```

---

### 2. Modul Books (`/books`)

#### A. Tambah Buku (Create)
- **POST** `/books`
- **Request Body**:
```json
{
  "title": "Laskar Pelangi",
  "author": "Andrea Hirata",
  "stock": 5
}
```
- **Response (201 Created)**:
```json
{
  "id": "26c268c4-99e7-4b03-bc04-f223cc9898b2",
  "title": "Laskar Pelangi",
  "author": "Andrea Hirata",
  "stock": 5
}
```

#### B. Ambil Semua Buku (Read All)
- **GET** `/books`
- **Response (200 OK)**:
```json
[
  {
    "id": "26c268c4-99e7-4b03-bc04-f223cc9898b2",
    "title": "Laskar Pelangi",
    "author": "Andrea Hirata",
    "stock": 5
  }
]
```

#### C. Ambil Detail Buku (Read by ID)
- **GET** `/books/:id`
- **Response (200 OK)**:
```json
{
  "id": "26c268c4-99e7-4b03-bc04-f223cc9898b2",
  "title": "Laskar Pelangi",
  "author": "Andrea Hirata",
  "stock": 5
}
```

#### D. Update Buku / Stok Manual (Update)
- **PUT** `/books/:id`
- **Request Body**:
```json
{
  "stock": 10
}
```
- **Response (200 OK)**:
```json
{
  "id": "26c268c4-99e7-4b03-bc04-f223cc9898b2",
  "title": "Laskar Pelangi",
  "author": "Andrea Hirata",
  "stock": 10
}
```

#### E. Hapus Buku (Delete)
- **DELETE** `/books/:id`
- **Response (200 OK)**:
```json
{
  "message": "Buku berhasil dihapus"
}
```

---

### 3. Modul Loans (`/loans`)

#### A. Pinjam Buku (Create Loan)
- **POST** `/loans`
- **Request Body**:
```json
{
  "member_id": "71f5eb2b-9f88-4953-81ed-baadb5400701",
  "book_id": "26c268c4-99e7-4b03-bc04-f223cc9898b2",
  "due_date": "2026-10-25"
}
```
- **Response Sukses (201 Created)**:
*(Stok buku bersangkutan otomatis terpotong $-1$)*
```json
{
  "id": "ef32513e-4a40-47f4-9f6e-ed4d782d6637",
  "member_id": "71f5eb2b-9f88-4953-81ed-baadb5400701",
  "member_name": "Aisha",
  "book_id": "26c268c4-99e7-4b03-bc04-f223cc9898b2",
  "book_title": "Laskar Pelangi",
  "loan_date": "2026-10-10",
  "due_date": "2026-10-25",
  "return_date": null,
  "status": "Dipinjam"
}
```
- **Response Error Jika Stok Habis (400 Bad Request)**:
```json
{
  "message": "Stok buku habis"
}
```

#### B. Kembalikan Buku (Return Book)
- **POST** `/loans/:id/return`
- **Request Body**: *None*
- **Response (200 OK)**:
*(Stok buku bersangkutan otomatis bertambah kembali $+1$)*
```json
{
  "message": "Buku berhasil dikembalikan",
  "data": {
    "id": "ef32513e-4a40-47f4-9f6e-ed4d782d6637",
    "member_id": "71f5eb2b-9f88-4953-81ed-baadb5400701",
    "member_name": "Aisha",
    "book_id": "26c268c4-99e7-4b03-bc04-f223cc9898b2",
    "book_title": "Laskar Pelangi",
    "loan_date": "2026-10-10",
    "due_date": "2026-10-25",
    "return_date": "2026-10-10",
    "status": "Dikembalikan"
  }
}
```
*(Catatan: Jika dikembalikan melewati tanggal `due_date`, status otomatis menjadi `"Dikembalikan (Terlambat)"`).*

- **Response Error Jika Sudah Dikembalikan (400 Bad Request)**:
```json
{
  "message": "Buku sudah dikembalikan"
}
```

#### C. Ambil Semua Peminjaman & Filter Status
- **GET** `/loans` (Menampilkan seluruh peminjaman dengan status dinamis)
- **GET** `/loans?status=Dipinjam` (Menampilkan peminjaman yang masih aktif dipinjam)
- **GET** `/loans?status=Dikembalikan` (Menampilkan buku yang sudah dikembalikan)
- **GET** `/loans?status=Terlambat` (Menampilkan buku yang terlambat, baik yang belum dikembalikan maupun yang dikembalikan melewati tempo)

- **Contoh Response (200 OK)**:
```json
[
  {
    "id": "ef32513e-4a40-47f4-9f6e-ed4d782d6637",
    "member_id": "71f5eb2b-9f88-4953-81ed-baadb5400701",
    "member_name": "Aisha",
    "book_id": "26c268c4-99e7-4b03-bc04-f223cc9898b2",
    "book_title": "Laskar Pelangi",
    "loan_date": "2026-10-01",
    "due_date": "2026-10-05",
    "return_date": null,
    "status": "Dipinjam (Terlambat)"
  }
]
```

#### D. Ambil Detail Peminjaman (Read by ID)
- **GET** `/loans/:id`

#### E. Update Peminjaman Manual (Update)
- **PUT** `/loans/:id`
- **Request Body**:
```json
{
  "due_date": "2026-11-01"
}
```

#### F. Hapus Peminjaman Satuan (Delete)
- **DELETE** `/loans/:id`
*(Jika peminjaman yang dihapus masih berstatus aktif "Dipinjam", stok buku otomatis dipulihkan kembali).*
- **Response (200 OK)**:
```json
{
  "message": "Data peminjaman berhasil dihapus"
}
```

#### G. Hapus / Reset Seluruh Peminjaman Sekaligus
- **DELETE** `/loans`
- **Response (200 OK)**:
```json
{
  "message": "Semua data peminjaman berhasil dihapus dan stok buku dipulihkan"
}
```

---

## 🛠️ Panduan Instalasi & Menjalankan Lokal

### Prasyarat
- [Node.js](https://nodejs.org/) (versi 18.x atau yang lebih baru)
- Akun dan project [Supabase](https://supabase.com/)

### Langkah-Langkah:

1. **Clone Repository**:
   ```bash
   git clone https://github.com/AishaAlidaPutri/Perpustakaan_ResponsiMod1_Kel21_03.git
   cd Perpustakaan_ResponsiMod1_Kel21_03
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Konfigurasi Environment Variables (`.env`)**:
   Salin file template `.env.example` menjadi `.env`:
   ```bash
   cp .env.example .env
   ```
   Buka file `.env` dan masukkan kredensial Supabase Anda:
   ```env
   SUPABASE_URL=https://proyek-kamu.supabase.co
   SUPABASE_KEY=kunci-anon-supabase-kamu
   PORT=3000
   ```

4. **Konfigurasi Database Supabase**:
   Pastikan Row Level Security (RLS) pada tabel `books`, `loans`, dan `members` dinonaktifkan atau diizinkan untuk role `anon`, karena validasi hak akses dan stok ditangani langsung di level backend Express:
   ```sql
   ALTER TABLE books DISABLE ROW LEVEL SECURITY;
   ALTER TABLE loans DISABLE ROW LEVEL SECURITY;
   ALTER TABLE members DISABLE ROW LEVEL SECURITY;
   ```

5. **Jalankan Aplikasi dalam Mode Development**:
   ```bash
   npm run dev
   ```

   Server akan berjalan di: `http://localhost:3000`