-- ============================================
-- Sistem Presensi IoT - Database Schema
-- MySQL Database untuk XAMPP
-- ============================================

-- Buat database jika belum ada
CREATE DATABASE IF NOT EXISTS presensi_rfid;
USE presensi_rfid;

-- ============================================
-- Tabel 1: members (Master Anggota)
-- ============================================
CREATE TABLE IF NOT EXISTS members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nrp VARCHAR(50) UNIQUE NOT NULL COMMENT 'Nomor Registrasi Pokok',
    name VARCHAR(100) NOT NULL COMMENT 'Nama lengkap anggota',
    class VARCHAR(50) COMMENT 'Kelas, misal: X-RPL-1',
    photo_path VARCHAR(255) COMMENT 'Path file foto di server',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_nrp (nrp),
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Tabel 2: rfid_cards (Kartu RFID)
-- ============================================
CREATE TABLE IF NOT EXISTS rfid_cards (
    id INT AUTO_INCREMENT PRIMARY KEY,
    uid_code VARCHAR(50) UNIQUE NOT NULL COMMENT 'UID kartu dari RFID reader',
    member_id INT COMMENT 'FK ke members, NULL jika belum dipairing',
    is_active BOOLEAN DEFAULT TRUE COMMENT 'Status aktif kartu',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE SET NULL,
    INDEX idx_uid (uid_code),
    INDEX idx_member (member_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Tabel 3: attendance_logs (Log Kehadiran)
-- ============================================
CREATE TABLE IF NOT EXISTS attendance_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    member_id INT NOT NULL COMMENT 'FK ke members',
    date DATE NOT NULL COMMENT 'Tanggal presensi YYYY-MM-DD',
    clock_in TIME COMMENT 'Waktu masuk HH:mm:ss',
    clock_out TIME COMMENT 'Waktu pulang HH:mm:ss',
    status ENUM('ONTIME', 'LATE') DEFAULT 'ONTIME' COMMENT 'Status keterlambatan',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
    UNIQUE KEY unique_member_date (member_id, date) COMMENT 'Satu entry per anggota per hari',
    INDEX idx_date (date),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Sample Data (Opsional - untuk testing)
-- ============================================
-- INSERT INTO members (nrp, name, class) VALUES
-- ('2024001', 'Ahmad Fauzi', 'X-RPL-1'),
-- ('2024002', 'Budi Santoso', 'X-RPL-1'),
-- ('2024003', 'Citra Dewi', 'X-RPL-2');

-- INSERT INTO rfid_cards (uid_code, member_id, is_active) VALUES
-- ('A1B2C3D4', 1, TRUE),
-- ('E5F6G7H8', 2, TRUE),
-- ('I9J0K1L2', 3, TRUE);
