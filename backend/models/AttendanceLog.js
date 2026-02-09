/**
 * Model: AttendanceLog
 * Tabel log kehadiran harian anggota
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AttendanceLog = sequelize.define('AttendanceLog', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    member_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'members',
            key: 'id'
        }
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    clock_in: {
        type: DataTypes.TIME,
        allowNull: true
    },
    clock_out: {
        type: DataTypes.TIME,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('ONTIME', 'LATE'),
        defaultValue: 'ONTIME'
    }
}, {
    tableName: 'attendance_logs',
    timestamps: true,
    updatedAt: false,
    indexes: [
        {
            unique: true,
            fields: ['member_id', 'date'],
            name: 'unique_member_date'
        }
    ]
});

module.exports = AttendanceLog;
