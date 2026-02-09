/**
 * Routes: Member
 * CRUD endpoints untuk data anggota
 */
const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const {
    getAllMembers,
    getMemberById,
    createMember,
    updateMember,
    deleteMember,
    getClasses
} = require('../controllers/memberController');

// GET /api/members/classes - Daftar kelas unik
router.get('/classes', getClasses);

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
