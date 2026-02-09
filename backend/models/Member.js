/**
 * Model: Member
 * Tabel master data anggota
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Member = sequelize.define('Member', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nrp: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: {
            msg: 'NRP sudah terdaftar'
        },
        validate: {
            notEmpty: { msg: 'NRP tidak boleh kosong' }
        }
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'Nama tidak boleh kosong' }
        }
    },
    class: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    photo_path: {
        type: DataTypes.STRING(255),
        allowNull: true
    }
}, {
    tableName: 'members',
    timestamps: true
});

module.exports = Member;
