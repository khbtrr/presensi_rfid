/**
 * Routes: IoT
 * Endpoint untuk perangkat ESP32 dengan RFID Reader
 */
const express = require('express');
const router = express.Router();
const {
    scanCard,
    getStatus,
    scanForRegister,
    getLastScanned,
    clearLastScanned
} = require('../controllers/iotController');

// POST /api/iot/scan - Menerima scan kartu dari ESP32 (mode presensi)
router.post('/scan', scanCard);

// GET /api/iot/status - Cek status endpoint
router.get('/status', getStatus);

// POST /api/iot/scan-register - Menerima scan kartu untuk mode registrasi
router.post('/scan-register', scanForRegister);

// GET /api/iot/last-scanned - Mengambil UID terakhir yang di-scan (polling frontend)
router.get('/last-scanned', getLastScanned);

// POST /api/iot/clear-scanned - Menghapus UID terakhir setelah berhasil register
router.post('/clear-scanned', clearLastScanned);

module.exports = router;
