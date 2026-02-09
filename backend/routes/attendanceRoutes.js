/**
 * Routes: Attendance
 * Endpoints untuk log kehadiran dan reporting
 */
const express = require('express');
const router = express.Router();
const {
    getAttendanceLogs,
    getTodayAttendance,
    getTodayStats,
    getMemberAttendance
} = require('../controllers/attendanceController');

// GET /api/attendance/stats - Statistik hari ini
router.get('/stats', getTodayStats);

// GET /api/attendance/today - Log hari ini (live feed)
router.get('/today', getTodayAttendance);

// GET /api/attendance/member/:memberId - Riwayat per anggota
router.get('/member/:memberId', getMemberAttendance);

// GET /api/attendance - Semua log dengan filter
router.get('/', getAttendanceLogs);

module.exports = router;
