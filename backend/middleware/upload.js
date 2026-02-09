/**
 * Middleware: Upload Handler
 * Menggunakan Multer untuk upload file foto
 */
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Pastikan folder uploads ada
const uploadDir = path.join(__dirname, '../uploads/photos');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Konfigurasi storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Format: member_<timestamp>_<random>.<ext>
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `member_${uniqueSuffix}${ext}`);
    }
});

// Filter file - hanya gambar
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Format file tidak didukung. Gunakan: JPG, PNG, GIF, atau WebP'), false);
    }
};

// Middleware upload
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // Max 5MB
    }
});

module.exports = upload;
