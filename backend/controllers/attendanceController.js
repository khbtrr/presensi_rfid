/**
 * Controller: Attendance
 * Operasi untuk log kehadiran dan reporting
 */
const { AttendanceLog, Member } = require('../models');
const { Op, fn, col, literal } = require('sequelize');

/**
 * Helper: Mendapatkan tanggal hari ini
 */
const getTodayDate = () => {
    const now = new Date();
    return now.toISOString().split('T')[0];
};

/**
 * GET /api/attendance
 * Mendapatkan log kehadiran dengan filter
 */
const getAttendanceLogs = async (req, res) => {
    try {
        const {
            start_date,
            end_date,
            member_id,
            member_name,
            status,
            page = 1,
            limit = 50
        } = req.query;

        let whereClause = {};
        let memberWhereClause = {};

        // Filter tanggal
        if (start_date && end_date) {
            whereClause.date = {
                [Op.between]: [start_date, end_date]
            };
        } else if (start_date) {
            whereClause.date = {
                [Op.gte]: start_date
            };
        } else if (end_date) {
            whereClause.date = {
                [Op.lte]: end_date
            };
        }

        // Filter member
        if (member_id) {
            whereClause.member_id = member_id;
        }

        // Filter nama anggota
        if (member_name) {
            memberWhereClause.name = {
                [Op.like]: `%${member_name}%`
            };
        }

        // Filter status
        if (status && ['ONTIME', 'LATE'].includes(status.toUpperCase())) {
            whereClause.status = status.toUpperCase();
        }

        // Pagination
        const offset = (parseInt(page) - 1) * parseInt(limit);

        const { count, rows: logs } = await AttendanceLog.findAndCountAll({
            where: whereClause,
            include: [{
                model: Member,
                as: 'member',
                attributes: ['id', 'nrp', 'name', 'class', 'photo_path'],
                where: Object.keys(memberWhereClause).length > 0 ? memberWhereClause : undefined
            }],
            order: [['date', 'DESC'], ['clock_in', 'DESC']],
            limit: parseInt(limit),
            offset: offset
        });

        res.json({
            success: true,
            count: count,
            page: parseInt(page),
            totalPages: Math.ceil(count / parseInt(limit)),
            data: logs
        });

    } catch (error) {
        console.error('Error getting attendance logs:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal mengambil data kehadiran',
            error: error.message
        });
    }
};

/**
 * GET /api/attendance/today
 * Mendapatkan log kehadiran hari ini (untuk live feed)
 */
const getTodayAttendance = async (req, res) => {
    try {
        const today = getTodayDate();
        const { limit = 10 } = req.query;

        const logs = await AttendanceLog.findAll({
            where: { date: today },
            include: [{
                model: Member,
                as: 'member',
                attributes: ['id', 'nrp', 'name', 'class', 'photo_path']
            }],
            order: [['created_at', 'DESC']],
            limit: parseInt(limit)
        });

        res.json({
            success: true,
            date: today,
            count: logs.length,
            data: logs
        });

    } catch (error) {
        console.error('Error getting today attendance:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal mengambil data kehadiran hari ini',
            error: error.message
        });
    }
};

/**
 * GET /api/attendance/stats
 * Mendapatkan statistik kehadiran hari ini
 */
const getTodayStats = async (req, res) => {
    try {
        const today = getTodayDate();

        // Total hadir hari ini
        const totalPresent = await AttendanceLog.count({
            where: { date: today }
        });

        // Total tepat waktu
        const totalOnTime = await AttendanceLog.count({
            where: {
                date: today,
                status: 'ONTIME'
            }
        });

        // Total terlambat
        const totalLate = await AttendanceLog.count({
            where: {
                date: today,
                status: 'LATE'
            }
        });

        // Total sudah pulang
        const totalClockOut = await AttendanceLog.count({
            where: {
                date: today,
                clock_out: { [Op.ne]: null }
            }
        });

        // Total anggota terdaftar
        const totalMembers = await Member.count();

        res.json({
            success: true,
            date: today,
            data: {
                total_members: totalMembers,
                total_present: totalPresent,
                total_ontime: totalOnTime,
                total_late: totalLate,
                total_clock_out: totalClockOut,
                total_absent: totalMembers - totalPresent
            }
        });

    } catch (error) {
        console.error('Error getting stats:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal mengambil statistik',
            error: error.message
        });
    }
};

/**
 * GET /api/attendance/member/:memberId
 * Mendapatkan riwayat kehadiran anggota tertentu
 */
const getMemberAttendance = async (req, res) => {
    try {
        const { memberId } = req.params;
        const { month, year } = req.query;

        let whereClause = { member_id: memberId };

        // Filter bulan dan tahun jika diberikan
        if (month && year) {
            const startDate = `${year}-${month.padStart(2, '0')}-01`;
            const endMonth = parseInt(month);
            const endYear = parseInt(year);
            const lastDay = new Date(endYear, endMonth, 0).getDate();
            const endDate = `${year}-${month.padStart(2, '0')}-${lastDay}`;

            whereClause.date = {
                [Op.between]: [startDate, endDate]
            };
        }

        const logs = await AttendanceLog.findAll({
            where: whereClause,
            order: [['date', 'DESC']]
        });

        // Statistik
        const stats = {
            total: logs.length,
            ontime: logs.filter(l => l.status === 'ONTIME').length,
            late: logs.filter(l => l.status === 'LATE').length
        };

        res.json({
            success: true,
            member_id: memberId,
            stats: stats,
            data: logs
        });

    } catch (error) {
        console.error('Error getting member attendance:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal mengambil riwayat kehadiran',
            error: error.message
        });
    }
};

module.exports = {
    getAttendanceLogs,
    getTodayAttendance,
    getTodayStats,
    getMemberAttendance
};
