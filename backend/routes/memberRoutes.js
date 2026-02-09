/**
 * Routes: Member
 * CRUD endpoints untuk data anggota
 */
const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const multer = require('multer');
const path = require('path');

// Konfigurasi multer untuk import file
const importStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../uploads/imports'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'import-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const importUpload = multer({
    storage: importStorage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['.xlsx', '.xls', '.csv'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedTypes.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Format file tidak didukung. Gunakan Excel (.xlsx, .xls) atau CSV.'));
        }
    },
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

const {
    getAllMembers,
    getMemberById,
    createMember,
    updateMember,
    deleteMember,
    getClasses,
    importMembers,
    getImportTemplate
} = require('../controllers/memberController');

// GET /api/members/classes - Daftar kelas unik
router.get('/classes', getClasses);

// GET /api/members/import/template - Download template import
router.get('/import/template', getImportTemplate);

// POST /api/members/import - Import anggota dari file
router.post('/import', importUpload.single('file'), importMembers);

// GET /api/members - Semua anggota
router.get('/', getAllMembers);

// GET /api/members/:id - Anggota by ID
router.get('/:id', getMemberById);

// POST /api/members - Tambah anggota (dengan upload foto)
router.post('/', upload.single('photo'), createMember);

// PUT /api/members/:id - Update anggota
router.put('/:id', upload.single('photo'), updateMember);

// DELETE /api/members/:id - Hapus anggota
router.delete('/:id', deleteMember);

module.exports = router;

