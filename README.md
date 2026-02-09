# Sistem Presensi IoT dengan RFID

Aplikasi web sistem presensi berbasis IoT menggunakan ESP32 dengan RFID Reader RC522.

## 🛠️ Technology Stack

- **Frontend:** React 18 + Vite + Tailwind CSS
- **Backend:** Node.js + Express.js
- **Database:** MySQL (XAMPP)
- **ORM:** Sequelize

## 📁 Struktur Proyek

```
presensi_rfid/
├── backend/          # Express.js API Server
│   ├── config/       # Database configuration
│   ├── controllers/  # Request handlers
│   ├── models/       # Sequelize models
│   ├── routes/       # API routes
│   ├── middleware/   # Multer upload
│   └── uploads/      # Foto anggota
│
├── frontend/         # React Vite App
│   └── src/
│       ├── components/  # UI components
│       ├── pages/       # Page components
│       └── services/    # API service
│
└── database/         # SQL schema
```

## 🚀 Cara Menjalankan

### 1. Persiapan Database

1. Pastikan XAMPP MySQL berjalan di port 3306
2. Buka phpMyAdmin atau MySQL CLI
3. Jalankan script di `database/schema.sql`

### 2. Jalankan Backend

```bash
cd backend
npm install
npm run dev
```

Server berjalan di `http://localhost:5000`

### 3. Jalankan Frontend

```bash
cd frontend
npm install
npm run dev
```

Aplikasi berjalan di `http://localhost:5173`

## 📡 IoT Endpoint

ESP32 mengirim data ke:

```
POST http://[SERVER-IP]:5000/api/iot/scan
Content-Type: application/json

{
  "rfid_uid": "A1B2C3D4",
  "device_id": "GATE1"
}
```

### Response

**Sukses Clock-In:**
```json
{
  "success": true,
  "action": "clock_in",
  "message": "Selamat datang, Ahmad Fauzi!",
  "data": {
    "member": { "id": 1, "name": "Ahmad Fauzi", ... },
    "time": "07:55:00",
    "status": "ONTIME"
  }
}
```

**Sukses Clock-Out:**
```json
{
  "success": true,
  "action": "clock_out",
  "message": "Sampai jumpa, Ahmad Fauzi!",
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "error": "CARD_NOT_FOUND",
  "message": "Kartu tidak terdaftar dalam sistem"
}
```

## ⏰ Konfigurasi

Edit file `backend/.env`:

```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_NAME=presensi_rfid
DB_USER=root
DB_PASSWORD=
LATE_THRESHOLD=08:00:00
```

## 📖 API Endpoints

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/api/iot/scan` | Scan kartu dari ESP32 |
| GET | `/api/members` | List semua anggota |
| POST | `/api/members` | Tambah anggota baru |
| PUT | `/api/members/:id` | Update anggota |
| DELETE | `/api/members/:id` | Hapus anggota |
| GET | `/api/cards` | List semua kartu |
| POST | `/api/cards` | Daftarkan kartu baru |
| PUT | `/api/cards/:id/pair` | Pasangkan kartu dengan anggota |
| GET | `/api/attendance` | Log kehadiran dengan filter |
| GET | `/api/attendance/stats` | Statistik hari ini |
| GET | `/api/attendance/today` | Live feed hari ini |

## 📸 Fitur

- ✅ Dashboard dengan statistik real-time
- ✅ Live feed presensi (auto-refresh 5 detik)
- ✅ Manajemen anggota dengan upload foto
- ✅ Registrasi dan pairing kartu RFID
- ✅ Laporan dengan filter tanggal
- ✅ Export data ke CSV
- ✅ Deteksi keterlambatan otomatis
