/**
 * Controller: Member
 * CRUD operations untuk data anggota
 */
const { Member, RfidCard } = require('../models');
const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs');

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

module.exports = {
    getAllMembers,
    getMemberById,
    createMember,
    updateMember,
    deleteMember,
    getClasses
};
