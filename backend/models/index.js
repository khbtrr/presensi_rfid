/**
 * Models Index
 * Mengatur relasi antar model dan export
 */
const { sequelize } = require('../config/database');
const Member = require('./Member');
const RfidCard = require('./RfidCard');
const AttendanceLog = require('./AttendanceLog');

// ============================================
// Definisi Relasi / Associations
// ============================================

// Member memiliki banyak RfidCard
Member.hasMany(RfidCard, {
    foreignKey: 'member_id',
    as: 'cards'
});

// RfidCard dimiliki oleh satu Member
RfidCard.belongsTo(Member, {
    foreignKey: 'member_id',
    as: 'member'
});

// Member memiliki banyak AttendanceLog
Member.hasMany(AttendanceLog, {
    foreignKey: 'member_id',
    as: 'attendances'
});

// AttendanceLog dimiliki oleh satu Member
AttendanceLog.belongsTo(Member, {
    foreignKey: 'member_id',
    as: 'member'
});

// ============================================
// Sync Database (untuk development)
// ============================================
const syncDatabase = async (force = false) => {
    try {
        await sequelize.sync({ force, alter: !force });
        console.log('✅ Database synchronized successfully.');
    } catch (error) {
        console.error('❌ Error synchronizing database:', error.message);
    }
};

module.exports = {
    sequelize,
    Member,
    RfidCard,
    AttendanceLog,
    syncDatabase
};
