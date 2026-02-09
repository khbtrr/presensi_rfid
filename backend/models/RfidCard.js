/**
 * Model: RfidCard
 * Tabel kartu RFID yang terhubung dengan anggota
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const RfidCard = sequelize.define('RfidCard', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    uid_code: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: {
            msg: 'UID kartu sudah terdaftar'
        },
        validate: {
            notEmpty: { msg: 'UID tidak boleh kosong' }
        }
    },
    member_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'members',
            key: 'id'
        }
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'rfid_cards',
    timestamps: true,
    updatedAt: false // Kartu tidak perlu updated_at
});

module.exports = RfidCard;
