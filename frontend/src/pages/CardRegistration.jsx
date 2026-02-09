import { useState, useEffect, useRef } from 'react';
import {
    Plus,
    CreditCard,
    Link as LinkIcon,
    Unlink,
    Trash2,
    ToggleLeft,
    ToggleRight,
    X,
    Check,
    Wifi
} from 'lucide-react';
import { cardAPI, memberAPI, iotAPI } from '../services/api';

function CardRegistration() {
    const [cards, setCards] = useState([]);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [pairingCard, setPairingCard] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        uid_code: '',
        member_id: ''
    });
    const [formError, setFormError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Polling state untuk auto-fill UID
    const [isPolling, setIsPolling] = useState(false);
    const [lastPollTimestamp, setLastPollTimestamp] = useState(0);
    const pollingIntervalRef = useRef(null);

    // Fetch data
    const fetchData = async () => {
        try {
            setLoading(true);
            const [cardsRes, membersRes] = await Promise.all([
                cardAPI.getAll(),
                memberAPI.getAll()
            ]);
            setCards(cardsRes.data.data);
            setMembers(membersRes.data.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Polling untuk auto-fill UID saat modal terbuka
    useEffect(() => {
        if (showModal) {
            // Mulai polling
            setIsPolling(true);
            setLastPollTimestamp(Date.now());

            const pollForCard = async () => {
                try {
                    const response = await iotAPI.getLastScanned(lastPollTimestamp);
                    if (response.data.success && response.data.data) {
                        const { uid, timestamp } = response.data.data;
                        setFormData(prev => ({ ...prev, uid_code: uid }));
                        setLastPollTimestamp(timestamp);
                    }
                } catch (error) {
                    console.error('Error polling for card:', error);
                }
            };

            // Poll setiap 1 detik
            pollingIntervalRef.current = setInterval(pollForCard, 1000);

            return () => {
                // Cleanup saat modal ditutup
                if (pollingIntervalRef.current) {
                    clearInterval(pollingIntervalRef.current);
                }
                setIsPolling(false);
            };
        }
    }, [showModal, lastPollTimestamp]);

    // Handle form input
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setFormError('');
    };

    // Submit new card
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.uid_code) {
            setFormError('UID Kartu wajib diisi. Silakan tap kartu pada reader.');
            return;
        }

        try {
            setSubmitting(true);
            await cardAPI.create({
                uid_code: formData.uid_code.toUpperCase(),
                member_id: formData.member_id || null
            });

            // Clear scanned card di server
            await iotAPI.clearScanned();

            setShowModal(false);
            setFormData({ uid_code: '', member_id: '' });
            fetchData();
        } catch (error) {
            setFormError(error.response?.data?.message || 'Gagal mendaftarkan kartu');
        } finally {
            setSubmitting(false);
        }
    };

    // Pair card with member
    const handlePair = async (memberId) => {
        if (!pairingCard) return;

        try {
            await cardAPI.pair(pairingCard.id, memberId);
            setPairingCard(null);
            fetchData();
        } catch (error) {
            console.error('Error pairing card:', error);
        }
    };

    // Unpair card
    const handleUnpair = async (card) => {
        try {
            await cardAPI.pair(card.id, null);
            fetchData();
        } catch (error) {
            console.error('Error unpairing card:', error);
        }
    };

    // Toggle card status
    const handleToggle = async (card) => {
        try {
            await cardAPI.toggle(card.id);
            fetchData();
        } catch (error) {
            console.error('Error toggling card:', error);
        }
    };

    // Delete card
    const handleDelete = async () => {
        if (!deleteConfirm) return;

        try {
            await cardAPI.delete(deleteConfirm.id);
            setDeleteConfirm(null);
            fetchData();
        } catch (error) {
            console.error('Error deleting card:', error);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Actions Bar */}
            <div className="flex justify-between items-center">
                <div>
                    <p className="text-gray-500">
                        Total: {cards.length} kartu |
                        Aktif: {cards.filter(c => c.is_active).length} |
                        Terpasang: {cards.filter(c => c.member_id).length}
                    </p>
                </div>
                <button onClick={() => setShowModal(true)} className="btn-primary">
                    <Plus className="w-5 h-5" />
                    <span>Daftarkan Kartu</span>
                </button>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? (
                    <div className="col-span-full p-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                    </div>
                ) : cards.length === 0 ? (
                    <div className="col-span-full text-center py-12">
                        <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">Belum ada kartu RFID terdaftar</p>
                    </div>
                ) : (
                    cards.map((card) => (
                        <div key={card.id} className={`card-hover p-5 ${!card.is_active ? 'opacity-60' : ''}`}>
                            {/* Card Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.is_active ? 'bg-primary-100' : 'bg-gray-100'
                                        }`}>
                                        <CreditCard className={`w-5 h-5 ${card.is_active ? 'text-primary-600' : 'text-gray-400'
                                            }`} />
                                    </div>
                                    <div>
                                        <p className="font-mono font-semibold text-gray-900">{card.uid_code}</p>
                                        <p className="text-xs text-gray-500">
                                            {card.is_active ? 'Aktif' : 'Nonaktif'}
                                        </p>
                                    </div>
                                </div>

                                {/* Toggle Status */}
                                <button
                                    onClick={() => handleToggle(card)}
                                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                                >
                                    {card.is_active ? (
                                        <ToggleRight className="w-6 h-6 text-success-500" />
                                    ) : (
                                        <ToggleLeft className="w-6 h-6 text-gray-400" />
                                    )}
                                </button>
                            </div>

                            {/* Paired Member */}
                            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                                {card.member ? (
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Check className="w-4 h-4 text-success-500" />
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{card.member.name}</p>
                                                <p className="text-xs text-gray-500">{card.member.nrp} • {card.member.class}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleUnpair(card)}
                                            className="p-1.5 hover:bg-white rounded text-gray-400 hover:text-danger-500 transition-colors"
                                            title="Lepas pairing"
                                        >
                                            <Unlink className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm text-gray-500">Belum dipasangkan</p>
                                        <button
                                            onClick={() => setPairingCard(card)}
                                            className="btn text-xs bg-primary-50 text-primary-600 hover:bg-primary-100 py-1.5 px-3"
                                        >
                                            <LinkIcon className="w-3 h-3" />
                                            <span>Pasangkan</span>
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end">
                                <button
                                    onClick={() => setDeleteConfirm(card)}
                                    className="p-2 hover:bg-danger-50 rounded-lg text-gray-400 hover:text-danger-500 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Add Card Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-slide-in">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900">Daftarkan Kartu RFID</h3>
                            <button
                                onClick={() => { setShowModal(false); setFormError(''); }}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {formError && (
                                <div className="p-3 bg-danger-50 text-danger-600 rounded-lg text-sm">
                                    {formError}
                                </div>
                            )}

                            {/* UID Code - Auto-fill dari tap kartu */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    UID Kartu <span className="text-danger-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        name="uid_code"
                                        value={formData.uid_code}
                                        readOnly
                                        placeholder={isPolling ? "Menunggu tap kartu..." : "UID akan terisi otomatis"}
                                        className={`input font-mono uppercase pr-10 ${formData.uid_code
                                                ? 'border-success-500 bg-success-50'
                                                : 'border-primary-300 bg-primary-50'
                                            }`}
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        {formData.uid_code ? (
                                            <Check className="w-5 h-5 text-success-500" />
                                        ) : (
                                            <Wifi className={`w-5 h-5 text-primary-500 ${isPolling ? 'animate-pulse' : ''}`} />
                                        )}
                                    </div>
                                </div>
                                <p className={`text-xs mt-1 ${formData.uid_code ? 'text-success-600' : 'text-primary-600'}`}>
                                    {formData.uid_code
                                        ? '✓ Kartu terdeteksi! Silakan lanjutkan pendaftaran.'
                                        : '📶 Tempelkan kartu RFID pada reader untuk mengisi UID otomatis'}
                                </p>
                            </div>

                            {/* Member (Optional) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Pasangkan dengan Anggota (Opsional)
                                </label>
                                <select
                                    name="member_id"
                                    value={formData.member_id}
                                    onChange={handleInputChange}
                                    className="input"
                                >
                                    <option value="">-- Pilih Anggota --</option>
                                    {members.map((member) => (
                                        <option key={member.id} value={member.id}>
                                            {member.nrp} - {member.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => { setShowModal(false); setFormError(''); }}
                                    className="btn-secondary flex-1"
                                >
                                    Batal
                                </button>
                                <button type="submit" disabled={submitting} className="btn-primary flex-1">
                                    {submitting ? 'Mendaftarkan...' : 'Daftarkan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Pairing Modal */}
            {pairingCard && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-slide-in">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Pasangkan Kartu</h3>
                                <p className="text-sm text-gray-500">UID: {pairingCard.uid_code}</p>
                            </div>
                            <button
                                onClick={() => setPairingCard(null)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <div className="p-6">
                            <p className="text-sm text-gray-500 mb-4">Pilih anggota untuk dipasangkan:</p>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {members.map((member) => (
                                    <button
                                        key={member.id}
                                        onClick={() => handlePair(member.id)}
                                        className="w-full p-3 text-left rounded-lg border border-gray-200 hover:border-primary-500 hover:bg-primary-50 transition-all"
                                    >
                                        <p className="font-medium text-gray-900">{member.name}</p>
                                        <p className="text-xs text-gray-500">{member.nrp} • {member.class || '-'}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm animate-slide-in">
                        <div className="p-6 text-center">
                            <div className="w-12 h-12 bg-danger-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trash2 className="w-6 h-6 text-danger-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Hapus Kartu?</h3>
                            <p className="text-gray-500 mb-6">
                                Apakah Anda yakin ingin menghapus kartu <strong className="font-mono">{deleteConfirm.uid_code}</strong>?
                            </p>
                            <div className="flex gap-3">
                                <button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1">
                                    Batal
                                </button>
                                <button onClick={handleDelete} className="btn-danger flex-1">
                                    Hapus
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CardRegistration;
