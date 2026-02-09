/**
 * Konfigurasi Database - Sequelize Connection
 * Menggunakan MySQL dengan XAMPP
 */
const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
    process.env.DB_NAME || 'presensi_rfid',
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD || '',
    {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        dialect: 'mysql',
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        timezone: '+07:00', // WIB
        pool: {
            max: 10,
            min: 0,
            acquire: 30000,
            idle: 10000
        },
        define: {
            timestamps: true,
            underscored: true, // Gunakan snake_case untuk kolom
            createdAt: 'created_at',
            updatedAt: 'updated_at'
        }
    }
);

// Test koneksi database
const testConnection = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Database connection established successfully.');
    } catch (error) {
        console.error('❌ Unable to connect to database:', error.message);
        process.exit(1);
    }
};

module.exports = { sequelize, testConnection };
