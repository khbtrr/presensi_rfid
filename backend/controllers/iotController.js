/**
 * Controller: IoT
 * Menangani request dari perangkat ESP32 dengan RFID Reader
 * 
 * ENDPOINT UTAMA: POST /api/iot/scan
 * - Menerima UID kartu dari ESP32
 * - Menentukan apakah ini clock-in atau clock-out
 * - Mengembalikan status untuk buzzer ESP32
 */
const { RfidCard, Member, AttendanceLog } = require('../models');
const { Op } = require('sequelize');

// Batas waktu terlambat (default 08:00:00)
const LATE_THRESHOLD = process.env.LATE_THRESHOLD || '08:00:00';

/**
 * Helper: Mendapatkan waktu sekarang dalam format HH:mm:ss
 */
const getCurrentTime = () => {
    const now = new Date();
    return now.toTimeString().split(' ')[0]; // HH:mm:ss
};

/**
 * Helper: Mendapatkan tanggal hari ini dalam format YYYY-MM-DD
 */
const getTodayDate = () => {
    const now = new Date();
    return now.toISOString().split('T')[0]; // YYYY-MM-DD
};

/**
 * Helper: Cek apakah waktu sudah melewati batas terlambat
 */
const isLate = (timeString) => {
    return timeString > LATE_THRESHOLD;
};

/**
 * POST /api/iot/scan
 * Menerima scan kartu dari ESP32
 * 
 * Request Body:
 * {
 *   "rfid_uid": "XXYYZZ",
 *   "device_id": "GATE1"  // Optional, untuk logging
 * }
 * 
 * Response:
 * - Success clock-in:  { success: true, action: "clock_in", member: {...}, status: "ONTIME"|"LATE" }
 * - Success clock-out: { success: true, action: "clock_out", member: {...} }
 * - Card not found:    { success: false, error: "CARD_NOT_FOUND" }
 * - Card inactive:     { success: false, error: "CARD_INACTIVE" }
 * - Already completed: { success: false, error: "ALREADY_COMPLETED" }
 */
const scanCard = async (req, res) => {
    try {
        const { rfid_uid, device_id } = req.body;

        // Validasi input
        if (!rfid_uid) {
            return res.status(400).json({
                success: false,
                error: 'INVALID_REQUEST',
                message: 'rfid_uid diperlukan'
            });
        }

        console.log(`[IoT] Scan received - UID: ${rfid_uid}, Device: ${device_id || 'unknown'}`);

        // ============================================
        // STEP 1: Cari kartu berdasarkan UID
        // ============================================
        const card = await RfidCard.findOne({
            where: { uid_code: rfid_uid.toUpperCase() },
            include: [{
                model: Member,
                as: 'member',
                attributes: ['id', 'nrp', 'name', 'class', 'photo_path']
            }]
        });

        // Kartu tidak ditemukan
        if (!card) {
            console.log(`[IoT] Card not found: ${rfid_uid}`);
            return res.status(404).json({
                success: false,
                error: 'CARD_NOT_FOUND',
                message: 'Kartu tidak terdaftar dalam sistem'
            });
        }

        // Kartu tidak aktif
        if (!card.is_active) {
            console.log(`[IoT] Card inactive: ${rfid_uid}`);
            return res.status(403).json({
                success: false,
                error: 'CARD_INACTIVE',
                message: 'Kartu telah dinonaktifkan'
            });
        }

        // Kartu belum di-pair dengan member
        if (!card.member_id || !card.member) {
            console.log(`[IoT] Card not paired: ${rfid_uid}`);
            return res.status(400).json({
                success: false,
                error: 'CARD_NOT_PAIRED',
                message: 'Kartu belum dipasangkan dengan anggota'
            });
        }

        const member = card.member;
        const today = getTodayDate();
        const currentTime = getCurrentTime();

        // ============================================
        // STEP 2: Cek attendance hari ini
        // ============================================
        let attendance = await AttendanceLog.findOne({
            where: {
                member_id: member.id,
                date: today
            }
        });

        // ============================================
        // STEP 3: Proses Clock-In atau Clock-Out
        // ============================================
        if (!attendance) {
            // CLOCK-IN: Belum ada record hari ini
            const status = isLate(currentTime) ? 'LATE' : 'ONTIME';

            attendance = await AttendanceLog.create({
                member_id: member.id,
                date: today,
                clock_in: currentTime,
                status: status
            });

            console.log(`[IoT] Clock-IN: ${member.name} at ${currentTime} - ${status}`);

            return res.json({
                success: true,
                action: 'clock_in',
                message: `Selamat datang, ${member.name}!`,
                data: {
                    member: {
                        id: member.id,
                        nrp: member.nrp,
                        name: member.name,
                        class: member.class
                    },
                    time: currentTime,
                    status: status
                }
            });

        } else if (!attendance.clock_out) {
            // CLOCK-OUT: Sudah clock-in, belum clock-out
            await attendance.update({
                clock_out: currentTime
            });

            console.log(`[IoT] Clock-OUT: ${member.name} at ${currentTime}`);

            return res.json({
                success: true,
                action: 'clock_out',
                message: `Sampai jumpa, ${member.name}!`,
                data: {
                    member: {
                        id: member.id,
                        nrp: member.nrp,
                        name: member.name,
                        class: member.class
                    },
                    time: currentTime,
                    clock_in: attendance.clock_in,
                    clock_out: currentTime
                }
            });

        } else {
            // ALREADY COMPLETED: Sudah clock-in dan clock-out
            console.log(`[IoT] Already completed: ${member.name}`);

            return res.status(400).json({
                success: false,
                error: 'ALREADY_COMPLETED',
                message: 'Presensi hari ini sudah lengkap (masuk & pulang)',
                data: {
                    member: {
                        id: member.id,
                        name: member.name
                    },
                    clock_in: attendance.clock_in,
                    clock_out: attendance.clock_out
                }
            });
        }

    } catch (error) {
        console.error('[IoT] Error:', error);
        return res.status(500).json({
            success: false,
            error: 'SERVER_ERROR',
            message: 'Terjadi kesalahan server'
        });
    }
};

/**
 * GET /api/iot/status
 * Cek status endpoint IoT (untuk testing koneksi ESP32)
 */
const getStatus = async (req, res) => {
    res.json({
        success: true,
        message: 'IoT endpoint aktif',
        server_time: new Date().toISOString(),
        late_threshold: LATE_THRESHOLD
    });
};

module.exports = {
    scanCard,
    getStatus
};
