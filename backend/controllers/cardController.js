/**
 * Controller: Card
 * Operasi untuk registrasi dan pairing kartu RFID
 */
const { RfidCard, Member } = require('../models');
const { Op } = require('sequelize');

/**
 * GET /api/cards
 * Mendapatkan semua kartu RFID
 */
const getAllCards = async (req, res) => {
    try {
        const { status } = req.query; // 'active', 'inactive', 'paired', 'unpaired'

        let whereClause = {};

        if (status === 'active') {
            whereClause.is_active = true;
        } else if (status === 'inactive') {
            whereClause.is_active = false;
        } else if (status === 'paired') {
            whereClause.member_id = { [Op.ne]: null };
        } else if (status === 'unpaired') {
            whereClause.member_id = null;
        }

        const cards = await RfidCard.findAll({
            where: whereClause,
            include: [{
                model: Member,
                as: 'member',
                attributes: ['id', 'nrp', 'name', 'class']
            }],
            order: [['created_at', 'DESC']]
        });

        res.json({
            success: true,
            count: cards.length,
            data: cards
        });

    } catch (error) {
        console.error('Error getting cards:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal mengambil data kartu',
            error: error.message
        });
    }
};

/**
 * GET /api/cards/:id
 * Mendapatkan kartu berdasarkan ID
 */
const getCardById = async (req, res) => {
    try {
        const { id } = req.params;

        const card = await RfidCard.findByPk(id, {
            include: [{
                model: Member,
                as: 'member',
                attributes: ['id', 'nrp', 'name', 'class']
            }]
        });

        if (!card) {
            return res.status(404).json({
                success: false,
                message: 'Kartu tidak ditemukan'
            });
        }

        res.json({
            success: true,
            data: card
        });

    } catch (error) {
        console.error('Error getting card:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal mengambil data kartu',
            error: error.message
        });
    }
};

/**
 * POST /api/cards
 * Mendaftarkan kartu RFID baru
 */
const createCard = async (req, res) => {
    try {
        const { uid_code, member_id } = req.body;

        // Validasi input
        if (!uid_code) {
            return res.status(400).json({
                success: false,
                message: 'UID kartu wajib diisi'
            });
        }

        // Cek UID duplikat
        const existingCard = await RfidCard.findOne({
            where: { uid_code: uid_code.toUpperCase() }
        });
        if (existingCard) {
            return res.status(400).json({
                success: false,
                message: 'UID kartu sudah terdaftar'
            });
        }

        // Jika member_id diberikan, validasi member exists
        if (member_id) {
            const member = await Member.findByPk(member_id);
            if (!member) {
                return res.status(400).json({
                    success: false,
                    message: 'Anggota tidak ditemukan'
                });
            }
        }

        const card = await RfidCard.create({
            uid_code: uid_code.toUpperCase(),
            member_id: member_id || null,
            is_active: true
        });

        // Reload dengan member data
        await card.reload({
            include: [{
                model: Member,
                as: 'member',
                attributes: ['id', 'nrp', 'name', 'class']
            }]
        });

        res.status(201).json({
            success: true,
            message: 'Kartu berhasil didaftarkan',
            data: card
        });

    } catch (error) {
        console.error('Error creating card:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal mendaftarkan kartu',
            error: error.message
        });
    }
};

/**
 * PUT /api/cards/:id/pair
 * Pairing kartu dengan anggota
 */
const pairCard = async (req, res) => {
    try {
        const { id } = req.params;
        const { member_id } = req.body;

        const card = await RfidCard.findByPk(id);
        if (!card) {
            return res.status(404).json({
                success: false,
                message: 'Kartu tidak ditemukan'
            });
        }

        // Validasi member exists
        if (member_id) {
            const member = await Member.findByPk(member_id);
            if (!member) {
                return res.status(400).json({
                    success: false,
                    message: 'Anggota tidak ditemukan'
                });
            }
        }

        await card.update({
            member_id: member_id || null
        });

        // Reload dengan member data
        await card.reload({
            include: [{
                model: Member,
                as: 'member',
                attributes: ['id', 'nrp', 'name', 'class']
            }]
        });

        res.json({
            success: true,
            message: member_id ? 'Kartu berhasil dipasangkan' : 'Kartu berhasil dilepas',
            data: card
        });

    } catch (error) {
        console.error('Error pairing card:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal memasangkan kartu',
            error: error.message
        });
    }
};

/**
 * PUT /api/cards/:id/toggle
 * Toggle status aktif kartu
 */
const toggleCardStatus = async (req, res) => {
    try {
        const { id } = req.params;

        const card = await RfidCard.findByPk(id);
        if (!card) {
            return res.status(404).json({
                success: false,
                message: 'Kartu tidak ditemukan'
            });
        }

        await card.update({
            is_active: !card.is_active
        });

        res.json({
            success: true,
            message: card.is_active ? 'Kartu diaktifkan' : 'Kartu dinonaktifkan',
            data: card
        });

    } catch (error) {
        console.error('Error toggling card:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal mengubah status kartu',
            error: error.message
        });
    }
};

/**
 * DELETE /api/cards/:id
 * Menghapus kartu RFID
 */
const deleteCard = async (req, res) => {
    try {
        const { id } = req.params;

        const card = await RfidCard.findByPk(id);
        if (!card) {
            return res.status(404).json({
                success: false,
                message: 'Kartu tidak ditemukan'
            });
        }

        await card.destroy();

        res.json({
            success: true,
            message: 'Kartu berhasil dihapus'
        });

    } catch (error) {
        console.error('Error deleting card:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal menghapus kartu',
            error: error.message
        });
    }
};

module.exports = {
    getAllCards,
    getCardById,
    createCard,
    pairCard,
    toggleCardStatus,
    deleteCard
};
