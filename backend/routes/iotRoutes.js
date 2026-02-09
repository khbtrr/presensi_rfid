/**
 * Routes: IoT
 * Endpoint untuk perangkat ESP32 dengan RFID Reader
 */
const express = require('express');
const router = express.Router();
const { scanCard, getStatus } = require('../controllers/iotController');

// POST /api/iot/scan - Menerima scan kartu dari ESP32
router.post('/scan', scanCard);

// GET /api/iot/status - Cek status endpoint
router.get('/status', getStatus);

module.exports = router;
