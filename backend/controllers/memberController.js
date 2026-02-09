/**
 * Controller: Member
 * CRUD operations untuk data anggota
 */
const { Member, RfidCard } = require('../models');
const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');

/**
 * GET /api/members
 * Mendapatkan semua anggota
 */
const getAllMembers = async (req, res) => {
    try {
        const { search, class: memberClass } = req.query;

        let whereClause = {};

        // Filter pencarian
        if (search) {
            whereClause[Op.or] = [
                { name: { [Op.like]: `%${search}%` } },
                { nrp: { [Op.like]: `%${search}%` } }
            ];
        }

        // Filter kelas
        if (memberClass) {
            whereClause.class = memberClass;
        }

        const members = await Member.findAll({
            where: whereClause,
            include: [{
                model: RfidCard,
                as: 'cards',
                attributes: ['id', 'uid_code', 'is_active']
            }],
            order: [['name', 'ASC']]
        });

        res.json({
            success: true,
            count: members.length,
            data: members
        });

    } catch (error) {
        console.error('Error getting members:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal mengambil data anggota',
            error: error.message
        });
    }
};

/**
 * GET /api/members/:id
 * Mendapatkan anggota berdasarkan ID
 */
const getMemberById = async (req, res) => {
    try {
        const { id } = req.params;

        const member = await Member.findByPk(id, {
            include: [{
                model: RfidCard,
                as: 'cards',
                attributes: ['id', 'uid_code', 'is_active']
            }]
        });

        if (!member) {
            return res.status(404).json({
                success: false,
                message: 'Anggota tidak ditemukan'
            });
        }

        res.json({
            success: true,
            data: member
        });

    } catch (error) {
        console.error('Error getting member:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal mengambil data anggota',
            error: error.message
        });
    }
};

/**
 * POST /api/members
 * Membuat anggota baru (dengan upload foto)
 */
const createMember = async (req, res) => {
    try {
        const { nrp, name, class: memberClass } = req.body;

        // Validasi input
        if (!nrp || !name) {
            return res.status(400).json({
                success: false,
                message: 'NRP dan Nama wajib diisi'
            });
        }

        // Cek NRP duplikat
        const existingMember = await Member.findOne({ where: { nrp } });
        if (existingMember) {
            return res.status(400).json({
                success: false,
                message: 'NRP sudah terdaftar'
            });
        }

        // Path foto jika ada upload
        let photoPath = null;
        if (req.file) {
            photoPath = `/uploads/photos/${req.file.filename}`;
        }

        const member = await Member.create({
            nrp,
            name,
            class: memberClass,
            photo_path: photoPath
        });

        res.status(201).json({
            success: true,
            message: 'Anggota berhasil ditambahkan',
            data: member
        });

    } catch (error) {
        console.error('Error creating member:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal menambahkan anggota',
            error: error.message
        });
    }
};

/**
 * PUT /api/members/:id
 * Mengupdate data anggota
 */
const updateMember = async (req, res) => {
    try {
        const { id } = req.params;
        const { nrp, name, class: memberClass } = req.body;

        const member = await Member.findByPk(id);
        if (!member) {
            return res.status(404).json({
                success: false,
                message: 'Anggota tidak ditemukan'
            });
        }

        // Cek NRP duplikat (kecuali member yang sama)
        if (nrp && nrp !== member.nrp) {
            const existingMember = await Member.findOne({ where: { nrp } });
            if (existingMember) {
                return res.status(400).json({
                    success: false,
                    message: 'NRP sudah digunakan anggota lain'
                });
            }
        }

        // Update foto jika ada upload baru
        let photoPath = member.photo_path;
        if (req.file) {
            // Hapus foto lama jika ada
            if (member.photo_path) {
                const oldPhotoPath = path.join(__dirname, '..', member.photo_path);
                if (fs.existsSync(oldPhotoPath)) {
                    fs.unlinkSync(oldPhotoPath);
                }
            }
            photoPath = `/uploads/photos/${req.file.filename}`;
        }

        await member.update({
            nrp: nrp || member.nrp,
            name: name || member.name,
            class: memberClass !== undefined ? memberClass : member.class,
            photo_path: photoPath
        });

        res.json({
            success: true,
            message: 'Anggota berhasil diupdate',
            data: member
        });

    } catch (error) {
        console.error('Error updating member:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal mengupdate anggota',
            error: error.message
        });
    }
};

/**
 * DELETE /api/members/:id
 * Menghapus anggota
 */
const deleteMember = async (req, res) => {
    try {
        const { id } = req.params;

        const member = await Member.findByPk(id);
        if (!member) {
            return res.status(404).json({
                success: false,
                message: 'Anggota tidak ditemukan'
            });
        }

        // Hapus foto jika ada
        if (member.photo_path) {
            const photoPath = path.join(__dirname, '..', member.photo_path);
            if (fs.existsSync(photoPath)) {
                fs.unlinkSync(photoPath);
            }
        }

        await member.destroy();

        res.json({
            success: true,
            message: 'Anggota berhasil dihapus'
        });

    } catch (error) {
        console.error('Error deleting member:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal menghapus anggota',
            error: error.message
        });
    }
};

/**
 * GET /api/members/classes
 * Mendapatkan daftar kelas unik
 */
const getClasses = async (req, res) => {
    try {
        const classes = await Member.findAll({
            attributes: ['class'],
            group: ['class'],
            where: {
                class: { [Op.ne]: null }
            },
            order: [['class', 'ASC']]
        });

        res.json({
            success: true,
            data: classes.map(c => c.class)
        });

    } catch (error) {
        console.error('Error getting classes:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal mengambil daftar kelas',
            error: error.message
        });
    }
};

/**
 * POST /api/members/import
 * Import anggota dari file Excel/CSV
 */
const importMembers = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'File tidak ditemukan. Upload file Excel atau CSV.'
            });
        }

        const filePath = req.file.path;
        const fileExt = path.extname(req.file.originalname).toLowerCase();

        // Baca file Excel/CSV
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        // Hapus file setelah dibaca
        fs.unlinkSync(filePath);

        if (data.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'File kosong atau format tidak valid'
            });
        }

        // Validasi header (minimal harus ada nrp dan name/nama)
        const firstRow = data[0];
        const keys = Object.keys(firstRow).map(k => k.toLowerCase().trim());

        const hasNrp = keys.some(k => k === 'nrp' || k === 'nim' || k === 'nis' || k === 'no');
        const hasName = keys.some(k => k === 'name' || k === 'nama' || k === 'nama lengkap');

        if (!hasNrp || !hasName) {
            return res.status(400).json({
                success: false,
                message: 'Format file tidak valid. Harus memiliki kolom NRP dan Nama.'
            });
        }

        // Mapping kolom (case insensitive)
        const getColumn = (row, possibleNames) => {
            for (const key of Object.keys(row)) {
                const lowerKey = key.toLowerCase().trim();
                if (possibleNames.includes(lowerKey)) {
                    return row[key];
                }
            }
            return '';
        };

        // Proses data
        const results = {
            success: [],
            failed: [],
            skipped: []
        };

        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const rowNum = i + 2; // +2 karena header dan index mulai dari 0

            const nrp = String(getColumn(row, ['nrp', 'nim', 'nis', 'no'])).trim();
            const name = String(getColumn(row, ['name', 'nama', 'nama lengkap'])).trim();
            const memberClass = String(getColumn(row, ['class', 'kelas'])).trim();

            // Validasi data
            if (!nrp || !name) {
                results.failed.push({
                    row: rowNum,
                    nrp: nrp || '-',
                    name: name || '-',
                    reason: 'NRP atau Nama kosong'
                });
                continue;
            }

            // Cek duplikat di database
            const existing = await Member.findOne({ where: { nrp } });
            if (existing) {
                results.skipped.push({
                    row: rowNum,
                    nrp,
                    name,
                    reason: 'NRP sudah terdaftar'
                });
                continue;
            }

            // Tambahkan anggota
            try {
                await Member.create({
                    nrp,
                    name,
                    class: memberClass || null
                });
                results.success.push({
                    row: rowNum,
                    nrp,
                    name
                });
            } catch (err) {
                results.failed.push({
                    row: rowNum,
                    nrp,
                    name,
                    reason: err.message
                });
            }
        }

        res.json({
            success: true,
            message: `Import selesai: ${results.success.length} berhasil, ${results.skipped.length} dilewati, ${results.failed.length} gagal`,
            data: results
        });

    } catch (error) {
        console.error('Error importing members:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal mengimport data anggota',
            error: error.message
        });
    }
};

/**
 * GET /api/members/import/template
 * Download template Excel untuk import
 */
const getImportTemplate = async (req, res) => {
    try {
        // Buat workbook baru dengan contoh data
        const workbook = XLSX.utils.book_new();
        const data = [
            { NRP: '12345', Nama: 'Contoh Nama', Kelas: 'X-TKJ-1' },
            { NRP: '12346', Nama: 'Nama Lainnya', Kelas: 'X-RPL-1' }
        ];
        const worksheet = XLSX.utils.json_to_sheet(data);

        // Set lebar kolom
        worksheet['!cols'] = [
            { wch: 15 },
            { wch: 30 },
            { wch: 15 }
        ];

        XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');

        // Generate buffer
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        res.setHeader('Content-Disposition', 'attachment; filename=template_import_anggota.xlsx');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buffer);

    } catch (error) {
        console.error('Error generating template:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal membuat template',
            error: error.message
        });
    }
};

module.exports = {
    getAllMembers,
    getMemberById,
    createMember,
    updateMember,
    deleteMember,
    getClasses,
    importMembers,
    getImportTemplate
};
