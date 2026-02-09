/**
 * Routes: Card
 * Endpoints untuk registrasi dan pairing kartu RFID
 */
const express = require('express');
const router = express.Router();
const {
    getAllCards,
    getCardById,
    createCard,
    pairCard,
    toggleCardStatus,
    deleteCard
} = require('../controllers/cardController');

// GET /api/cards - Semua kartu
router.get('/', getAllCards);

// GET /api/cards/:id - Kartu by ID
router.get('/:id', getCardById);

// POST /api/cards - Daftarkan kartu baru
router.post('/', createCard);

// PUT /api/cards/:id/pair - Pairing kartu dengan member
router.put('/:id/pair', pairCard);

// PUT /api/cards/:id/toggle - Toggle status aktif
router.put('/:id/toggle', toggleCardStatus);

// DELETE /api/cards/:id - Hapus kartu
router.delete('/:id', deleteCard);

module.exports = router;
