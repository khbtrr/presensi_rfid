/**
 * Server Entry Point
 * Sistem Presensi IoT dengan RFID
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Import database dan models
const { testConnection } = require('./config/database');
const { syncDatabase } = require('./models');

// Import routes
const iotRoutes = require('./routes/iotRoutes');
const memberRoutes = require('./routes/memberRoutes');
const cardRoutes = require('./routes/cardRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================
// Middleware
// ============================================

// CORS - Allow frontend access
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true
}));

// Parse JSON body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (uploaded photos)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Request logging (development)
if (process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
        next();
    });
}

// ============================================
// Routes
// ============================================

// API Routes
app.use('/api/iot', iotRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api/attendance', attendanceRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint tidak ditemukan'
    });
});

// Error Handler
app.use((err, req, res, next) => {
    console.error('Server Error:', err);

    // Multer error handling
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
            success: false,
            message: 'Ukuran file terlalu besar (max 5MB)'
        });
    }

    if (err.message && err.message.includes('Format file')) {
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }

    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// ============================================
// Start Server
// ============================================

const startServer = async () => {
    try {
        // Test database connection
        await testConnection();

        // Sync database models
        await syncDatabase(false); // Set true to force recreate tables

        // Start listening
        app.listen(PORT, () => {
            console.log('========================================');
            console.log('   Sistem Presensi IoT - Server');
            console.log('========================================');
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📡 IoT Endpoint: http://localhost:${PORT}/api/iot/scan`);
            console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log('========================================');
        });
    } catch (error) {
        console.error('Failed to start server:', error.message);
        process.exit(1);
    }
};

startServer();
