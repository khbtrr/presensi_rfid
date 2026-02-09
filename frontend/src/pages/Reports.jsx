import { useState, useEffect } from 'react';
import {
    Calendar,
    Search,
    Download,
    LogIn,
    LogOut,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { attendanceAPI } from '../services/api';

function Reports() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({
        page: 1,
        totalPages: 1,
        count: 0
    });

    // Filters
    const [filters, setFilters] = useState({
        start_date: '',
        end_date: '',
        member_name: '',
        status: ''
    });

    // Set default date range (this month)
    useEffect(() => {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        setFilters(prev => ({
            ...prev,
            start_date: firstDay.toISOString().split('T')[0],
            end_date: lastDay.toISOString().split('T')[0]
        }));
    }, []);

    // Fetch logs
    const fetchLogs = async (page = 1) => {
        try {
            setLoading(true);
            const params = {
                ...filters,
                page,
                limit: 20
            };

            // Remove empty params
            Object.keys(params).forEach(key => {
                if (!params[key]) delete params[key];
            });

            const res = await attendanceAPI.getAll(params);
            setLogs(res.data.data);
            setPagination({
                page: res.data.page,
                totalPages: res.data.totalPages,
                count: res.data.count
            });
        } catch (error) {
            console.error('Error fetching logs:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (filters.start_date && filters.end_date) {
            fetchLogs(1);
        }
    }, [filters]);

    // Handle filter change
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    // Format date
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    // Format time
    const formatTime = (time) => {
        if (!time) return '-';
        return time.substring(0, 5);
    };

    // Calculate duration
    const calculateDuration = (clockIn, clockOut) => {
        if (!clockIn || !clockOut) return '-';

        const [inH, inM] = clockIn.split(':').map(Number);
        const [outH, outM] = clockOut.split(':').map(Number);

        let minutes = (outH * 60 + outM) - (inH * 60 + inM);
        if (minutes < 0) minutes += 24 * 60; // Handle overnight

        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;

        return `${hours}j ${mins}m`;
    };

    // Export to CSV
    const exportCSV = () => {
        const headers = ['Tanggal', 'NRP', 'Nama', 'Kelas', 'Jam Masuk', 'Jam Pulang', 'Durasi', 'Status'];
        const rows = logs.map(log => [
            log.date,
            log.member?.nrp || '',
            log.member?.name || '',
            log.member?.class || '',
            log.clock_in || '',
            log.clock_out || '',
            calculateDuration(log.clock_in, log.clock_out),
            log.status
        ]);

        const csvContent = [headers, ...rows]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `laporan_presensi_${filters.start_date}_${filters.end_date}.csv`;
        link.click();
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Filters */}
            <div className="card p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {/* Start Date */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tanggal Mulai
                        </label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="date"
                                name="start_date"
                                value={filters.start_date}
                                onChange={handleFilterChange}
                                className="input pl-10"
                            />
                        </div>
                    </div>

                    {/* End Date */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tanggal Akhir
                        </label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="date"
                                name="end_date"
                                value={filters.end_date}
                                onChange={handleFilterChange}
                                className="input pl-10"
                            />
                        </div>
                    </div>

                    {/* Member Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nama Anggota
                        </label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                name="member_name"
                                value={filters.member_name}
                                onChange={handleFilterChange}
                                placeholder="Cari nama..."
                                className="input pl-10"
                            />
                        </div>
                    </div>

                    {/* Status Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Status
                        </label>
                        <select
                            name="status"
                            value={filters.status}
                            onChange={handleFilterChange}
                            className="input"
                        >
                            <option value="">Semua Status</option>
                            <option value="ONTIME">Tepat Waktu</option>
                            <option value="LATE">Terlambat</option>
                        </select>
                    </div>

                    {/* Export Button */}
                    <div className="flex items-end">
                        <button
                            onClick={exportCSV}
                            disabled={logs.length === 0}
                            className="btn-secondary w-full"
                        >
                            <Download className="w-4 h-4" />
                            <span>Export CSV</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Results Summary */}
            <div className="flex items-center justify-between text-sm text-gray-500">
                <p>
                    Menampilkan {logs.length} dari {pagination.count} data
                </p>
            </div>

            {/* Table */}
            <div className="card">
                <div className="table-container">
                    {loading ? (
                        <div className="p-8 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p>Tidak ada data untuk periode yang dipilih</p>
                        </div>
                    ) : (
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Tanggal</th>
                                    <th>Anggota</th>
                                    <th>Kelas</th>
                                    <th>Jam Masuk</th>
                                    <th>Jam Pulang</th>
                                    <th>Durasi</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log) => (
                                    <tr key={log.id}>
                                        <td>
                                            <p className="font-medium text-gray-900">{formatDate(log.date)}</p>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-3">
                                                {log.member?.photo_path ? (
                                                    <img
                                                        src={log.member.photo_path}
                                                        alt=""
                                                        className="w-8 h-8 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                                        <span className="text-xs font-medium text-gray-600">
                                                            {log.member?.name?.charAt(0) || '?'}
                                                        </span>
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="font-medium text-gray-900">{log.member?.name || '-'}</p>
                                                    <p className="text-xs text-gray-500">{log.member?.nrp || '-'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>{log.member?.class || '-'}</td>
                                        <td>
                                            <div className="flex items-center gap-1.5 text-success-600">
                                                <LogIn className="w-4 h-4" />
                                                <span>{formatTime(log.clock_in)}</span>
                                            </div>
                                        </td>
                                        <td>
                                            {log.clock_out ? (
                                                <div className="flex items-center gap-1.5 text-gray-600">
                                                    <LogOut className="w-4 h-4" />
                                                    <span>{formatTime(log.clock_out)}</span>
                                                </div>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </td>
                                        <td className="text-gray-600">
                                            {calculateDuration(log.clock_in, log.clock_out)}
                                        </td>
                                        <td>
                                            <span className={`badge ${log.status === 'ONTIME' ? 'badge-success' : 'badge-warning'}`}>
                                                {log.status === 'ONTIME' ? 'Tepat Waktu' : 'Terlambat'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="p-4 border-t border-gray-100 flex items-center justify-between">
                        <p className="text-sm text-gray-500">
                            Halaman {pagination.page} dari {pagination.totalPages}
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => fetchLogs(pagination.page - 1)}
                                disabled={pagination.page === 1}
                                className="btn-ghost disabled:opacity-50"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                <span>Prev</span>
                            </button>
                            <button
                                onClick={() => fetchLogs(pagination.page + 1)}
                                disabled={pagination.page === pagination.totalPages}
                                className="btn-ghost disabled:opacity-50"
                            >
                                <span>Next</span>
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Reports;
