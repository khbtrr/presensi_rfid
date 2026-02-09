import { useState, useEffect, useRef } from 'react';
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    X,
    Upload,
    User,
    FileSpreadsheet,
    Download,
    CheckCircle,
    XCircle,
    AlertCircle
} from 'lucide-react';
import { memberAPI } from '../services/api';

function Members() {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingMember, setEditingMember] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    // Import modal state
    const [showImportModal, setShowImportModal] = useState(false);
    const [importFile, setImportFile] = useState(null);
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState(null);
    const [dragActive, setDragActive] = useState(false);
    const importInputRef = useRef(null);

    // Form state
    const [formData, setFormData] = useState({
        nrp: '',
        name: '',
        class: '',
        photo: null
    });
    const [photoPreview, setPhotoPreview] = useState(null);
    const [formError, setFormError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Fetch members
    const fetchMembers = async () => {
        try {
            setLoading(true);
            const res = await memberAPI.getAll({ search });
            setMembers(res.data.data);
        } catch (error) {
            console.error('Error fetching members:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMembers();
    }, [search]);

    // Handle form input
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setFormError('');
    };

    // Handle photo select
    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData(prev => ({ ...prev, photo: file }));
            setPhotoPreview(URL.createObjectURL(file));
        }
    };

    // Open modal for add/edit
    const openModal = (member = null) => {
        if (member) {
            setEditingMember(member);
            setFormData({
                nrp: member.nrp,
                name: member.name,
                class: member.class || '',
                photo: null
            });
            setPhotoPreview(member.photo_path || null);
        } else {
            setEditingMember(null);
            setFormData({ nrp: '', name: '', class: '', photo: null });
            setPhotoPreview(null);
        }
        setFormError('');
        setShowModal(true);
    };

    // Close modal
    const closeModal = () => {
        setShowModal(false);
        setEditingMember(null);
        setFormData({ nrp: '', name: '', class: '', photo: null });
        setPhotoPreview(null);
        setFormError('');
    };

    // Submit form
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.nrp || !formData.name) {
            setFormError('NRP dan Nama wajib diisi');
            return;
        }

        try {
            setSubmitting(true);
            const data = new FormData();
            data.append('nrp', formData.nrp);
            data.append('name', formData.name);
            data.append('class', formData.class);
            if (formData.photo) {
                data.append('photo', formData.photo);
            }

            if (editingMember) {
                await memberAPI.update(editingMember.id, data);
            } else {
                await memberAPI.create(data);
            }

            closeModal();
            fetchMembers();
        } catch (error) {
            setFormError(error.response?.data?.message || 'Terjadi kesalahan');
        } finally {
            setSubmitting(false);
        }
    };

    // Delete member
    const handleDelete = async () => {
        if (!deleteConfirm) return;

        try {
            await memberAPI.delete(deleteConfirm.id);
            setDeleteConfirm(null);
            fetchMembers();
        } catch (error) {
            console.error('Error deleting member:', error);
        }
    };

    // ============================================
    // Import Functions
    // ============================================

    const openImportModal = () => {
        setImportFile(null);
        setImportResult(null);
        setShowImportModal(true);
    };

    const closeImportModal = () => {
        setShowImportModal(false);
        setImportFile(null);
        setImportResult(null);
        setDragActive(false);
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            validateAndSetFile(file);
        }
    };

    const handleImportFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            validateAndSetFile(e.target.files[0]);
        }
    };

    const validateAndSetFile = (file) => {
        const allowedTypes = ['.xlsx', '.xls', '.csv'];
        const ext = '.' + file.name.split('.').pop().toLowerCase();

        if (!allowedTypes.includes(ext)) {
            alert('Format file tidak didukung. Gunakan Excel (.xlsx, .xls) atau CSV.');
            return;
        }

        setImportFile(file);
        setImportResult(null);
    };

    const handleImport = async () => {
        if (!importFile) return;

        try {
            setImporting(true);
            const formData = new FormData();
            formData.append('file', importFile);

            const res = await memberAPI.import(formData);
            setImportResult(res.data);
            fetchMembers(); // Refresh data
        } catch (error) {
            setImportResult({
                success: false,
                message: error.response?.data?.message || 'Gagal mengimport data'
            });
        } finally {
            setImporting(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Actions Bar */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Cari nama atau NRP..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="input pl-10"
                    />
                </div>
                <div className="flex gap-2">
                    <button onClick={openImportModal} className="btn-secondary">
                        <FileSpreadsheet className="w-5 h-5" />
                        <span>Import</span>
                    </button>
                    <button onClick={() => openModal()} className="btn-primary">
                        <Plus className="w-5 h-5" />
                        <span>Tambah Anggota</span>
                    </button>
                </div>
            </div>

            {/* Members Table */}
            <div className="card">
                <div className="table-container">
                    {loading ? (
                        <div className="p-8 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                        </div>
                    ) : members.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            <User className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p>Belum ada data anggota</p>
                        </div>
                    ) : (
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Foto</th>
                                    <th>NRP</th>
                                    <th>Nama</th>
                                    <th>Kelas</th>
                                    <th>Kartu RFID</th>
                                    <th className="text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {members.map((member) => (
                                    <tr key={member.id}>
                                        <td>
                                            {member.photo_path ? (
                                                <img
                                                    src={member.photo_path}
                                                    alt={member.name}
                                                    className="w-10 h-10 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                                    <User className="w-5 h-5 text-gray-500" />
                                                </div>
                                            )}
                                        </td>
                                        <td className="font-mono">{member.nrp}</td>
                                        <td className="font-medium text-gray-900">{member.name}</td>
                                        <td>{member.class || '-'}</td>
                                        <td>
                                            {member.cards?.length > 0 ? (
                                                <span className="badge badge-success">
                                                    {member.cards.length} kartu
                                                </span>
                                            ) : (
                                                <span className="badge bg-gray-100 text-gray-500">
                                                    Belum ada
                                                </span>
                                            )}
                                        </td>
                                        <td>
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openModal(member)}
                                                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteConfirm(member)}
                                                    className="p-2 rounded-lg hover:bg-danger-50 text-danger-600 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-slide-in">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900">
                                {editingMember ? 'Edit Anggota' : 'Tambah Anggota'}
                            </h3>
                            <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {formError && (
                                <div className="p-3 bg-danger-50 text-danger-600 rounded-lg text-sm">
                                    {formError}
                                </div>
                            )}

                            {/* Photo Upload */}
                            <div className="flex justify-center">
                                <label className="cursor-pointer group">
                                    <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden group-hover:ring-4 ring-primary-100 transition-all">
                                        {photoPreview ? (
                                            <img src={photoPreview} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="text-center">
                                                <Upload className="w-6 h-6 text-gray-400 mx-auto" />
                                                <span className="text-xs text-gray-400">Upload</span>
                                            </div>
                                        )}
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handlePhotoChange}
                                        className="hidden"
                                    />
                                </label>
                            </div>

                            {/* NRP */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    NRP <span className="text-danger-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="nrp"
                                    value={formData.nrp}
                                    onChange={handleInputChange}
                                    placeholder="Masukkan NRP"
                                    className="input"
                                />
                            </div>

                            {/* Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nama Lengkap <span className="text-danger-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="Masukkan nama lengkap"
                                    className="input"
                                />
                            </div>

                            {/* Class */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Kelas
                                </label>
                                <input
                                    type="text"
                                    name="class"
                                    value={formData.class}
                                    onChange={handleInputChange}
                                    placeholder="Misal: X-RPL-1"
                                    className="input"
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={closeModal} className="btn-secondary flex-1">
                                    Batal
                                </button>
                                <button type="submit" disabled={submitting} className="btn-primary flex-1">
                                    {submitting ? 'Menyimpan...' : 'Simpan'}
                                </button>
                            </div>
                        </form>
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
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                Hapus Anggota?
                            </h3>
                            <p className="text-gray-500 mb-6">
                                Apakah Anda yakin ingin menghapus <strong>{deleteConfirm.name}</strong>?
                                Data presensi terkait juga akan dihapus.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeleteConfirm(null)}
                                    className="btn-secondary flex-1"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="btn-danger flex-1"
                                >
                                    Hapus
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Import Modal */}
            {showImportModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg animate-slide-in">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900">
                                Import Anggota
                            </h3>
                            <button onClick={closeImportModal} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Download Template */}
                            <div className="flex items-center justify-between p-4 bg-primary-50 rounded-xl">
                                <div>
                                    <p className="font-medium text-primary-900">Download Template</p>
                                    <p className="text-sm text-primary-600">Gunakan template untuk format yang benar</p>
                                </div>
                                <a
                                    href={memberAPI.getTemplateUrl()}
                                    download
                                    className="btn-primary py-2"
                                >
                                    <Download className="w-4 h-4" />
                                    <span>Template</span>
                                </a>
                            </div>

                            {/* Dropzone */}
                            {!importResult && (
                                <div
                                    onDragEnter={handleDrag}
                                    onDragLeave={handleDrag}
                                    onDragOver={handleDrag}
                                    onDrop={handleDrop}
                                    onClick={() => importInputRef.current?.click()}
                                    className={`
                                        border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
                                        ${dragActive
                                            ? 'border-primary-500 bg-primary-50'
                                            : importFile
                                                ? 'border-success-500 bg-success-50'
                                                : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
                                        }
                                    `}
                                >
                                    <input
                                        ref={importInputRef}
                                        type="file"
                                        accept=".xlsx,.xls,.csv"
                                        onChange={handleImportFileChange}
                                        className="hidden"
                                    />

                                    {importFile ? (
                                        <div>
                                            <FileSpreadsheet className="w-12 h-12 mx-auto mb-3 text-success-500" />
                                            <p className="font-medium text-gray-900">{importFile.name}</p>
                                            <p className="text-sm text-gray-500 mt-1">
                                                {(importFile.size / 1024).toFixed(1)} KB
                                            </p>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setImportFile(null);
                                                }}
                                                className="mt-3 text-sm text-danger-600 hover:underline"
                                            >
                                                Hapus file
                                            </button>
                                        </div>
                                    ) : (
                                        <div>
                                            <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                                            <p className="font-medium text-gray-900">
                                                Drag & drop file atau klik untuk pilih
                                            </p>
                                            <p className="text-sm text-gray-500 mt-1">
                                                Format: Excel (.xlsx, .xls) atau CSV
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Import Result */}
                            {importResult && (
                                <div className="space-y-4">
                                    {/* Summary */}
                                    <div className={`p-4 rounded-xl ${importResult.success ? 'bg-success-50' : 'bg-danger-50'}`}>
                                        <p className={`font-medium ${importResult.success ? 'text-success-700' : 'text-danger-700'}`}>
                                            {importResult.message}
                                        </p>
                                    </div>

                                    {/* Details */}
                                    {importResult.data && (
                                        <div className="max-h-64 overflow-y-auto space-y-3">
                                            {/* Success */}
                                            {importResult.data.success?.length > 0 && (
                                                <div className="bg-success-50 rounded-lg p-3">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <CheckCircle className="w-5 h-5 text-success-600" />
                                                        <span className="font-medium text-success-700">
                                                            Berhasil ({importResult.data.success.length})
                                                        </span>
                                                    </div>
                                                    <div className="space-y-1 text-sm text-success-600">
                                                        {importResult.data.success.slice(0, 5).map((item, i) => (
                                                            <p key={i}>Baris {item.row}: {item.name} ({item.nrp})</p>
                                                        ))}
                                                        {importResult.data.success.length > 5 && (
                                                            <p className="text-success-500">
                                                                ... dan {importResult.data.success.length - 5} lainnya
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Skipped */}
                                            {importResult.data.skipped?.length > 0 && (
                                                <div className="bg-warning-50 rounded-lg p-3">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <AlertCircle className="w-5 h-5 text-warning-600" />
                                                        <span className="font-medium text-warning-700">
                                                            Dilewati ({importResult.data.skipped.length})
                                                        </span>
                                                    </div>
                                                    <div className="space-y-1 text-sm text-warning-600">
                                                        {importResult.data.skipped.slice(0, 5).map((item, i) => (
                                                            <p key={i}>Baris {item.row}: {item.nrp} - {item.reason}</p>
                                                        ))}
                                                        {importResult.data.skipped.length > 5 && (
                                                            <p className="text-warning-500">
                                                                ... dan {importResult.data.skipped.length - 5} lainnya
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Failed */}
                                            {importResult.data.failed?.length > 0 && (
                                                <div className="bg-danger-50 rounded-lg p-3">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <XCircle className="w-5 h-5 text-danger-600" />
                                                        <span className="font-medium text-danger-700">
                                                            Gagal ({importResult.data.failed.length})
                                                        </span>
                                                    </div>
                                                    <div className="space-y-1 text-sm text-danger-600">
                                                        {importResult.data.failed.slice(0, 5).map((item, i) => (
                                                            <p key={i}>Baris {item.row}: {item.reason}</p>
                                                        ))}
                                                        {importResult.data.failed.length > 5 && (
                                                            <p className="text-danger-500">
                                                                ... dan {importResult.data.failed.length - 5} lainnya
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={closeImportModal}
                                    className="btn-secondary flex-1"
                                >
                                    {importResult ? 'Tutup' : 'Batal'}
                                </button>
                                {!importResult && (
                                    <button
                                        onClick={handleImport}
                                        disabled={!importFile || importing}
                                        className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {importing ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                                <span>Mengimport...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="w-4 h-4" />
                                                <span>Import Sekarang</span>
                                            </>
                                        )}
                                    </button>
                                )}
                                {importResult && (
                                    <button
                                        onClick={() => {
                                            setImportFile(null);
                                            setImportResult(null);
                                        }}
                                        className="btn-primary flex-1"
                                    >
                                        <Upload className="w-4 h-4" />
                                        <span>Import Lagi</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Members;
