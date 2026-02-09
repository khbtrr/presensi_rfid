import { useState, useEffect } from 'react';
import {
    Users,
    Clock,
    AlertTriangle,
    LogIn,
    LogOut,
    RefreshCw
} from 'lucide-react';
import { attendanceAPI } from '../services/api';

function Dashboard() {
    const [stats, setStats] = useState(null);
    const [liveFeed, setLiveFeed] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Fetch data
    const fetchData = async (showRefresh = false) => {
        try {
            if (showRefresh) setRefreshing(true);

            const [statsRes, feedRes] = await Promise.all([
                attendanceAPI.getStats(),
                attendanceAPI.getToday(10)
            ]);

            setStats(statsRes.data.data);
            setLiveFeed(feedRes.data.data);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Initial load and auto-refresh
    useEffect(() => {
        fetchData();

        // Auto-refresh setiap 5 detik
        const interval = setInterval(() => fetchData(false), 5000);

        return () => clearInterval(interval);
    }, []);

    // Format time
    const formatTime = (time) => {
        if (!time) return '-';
        return time.substring(0, 5); // HH:mm
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Hadir */}
                <div className="stat-card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="stat-label">Hadir Hari Ini</p>
                            <p className="stat-value">{stats?.total_present || 0}</p>
                        </div>
                        <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                            <Users className="w-6 h-6 text-primary-600" />
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-3">
                        dari {stats?.total_members || 0} anggota terdaftar
                    </p>
                </div>

                {/* Tepat Waktu */}
                <div className="stat-card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="stat-label">Tepat Waktu</p>
                            <p className="stat-value text-success-600">{stats?.total_ontime || 0}</p>
                        </div>
                        <div className="w-12 h-12 bg-success-100 rounded-xl flex items-center justify-center">
                            <Clock className="w-6 h-6 text-success-600" />
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-3">
                        sebelum jam 08:00
                    </p>
                </div>

                {/* Terlambat */}
                <div className="stat-card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="stat-label">Terlambat</p>
                            <p className="stat-value text-warning-600">{stats?.total_late || 0}</p>
                        </div>
                        <div className="w-12 h-12 bg-warning-100 rounded-xl flex items-center justify-center">
                            <AlertTriangle className="w-6 h-6 text-warning-600" />
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-3">
                        setelah jam 08:00
                    </p>
                </div>

                {/* Sudah Pulang */}
                <div className="stat-card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="stat-label">Sudah Pulang</p>
                            <p className="stat-value">{stats?.total_clock_out || 0}</p>
                        </div>
                        <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                            <LogOut className="w-6 h-6 text-gray-600" />
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-3">
                        sudah clock out
                    </p>
                </div>
            </div>

            {/* Live Feed */}
            <div className="card">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold text-gray-900">Live Feed Presensi</h3>
                        <p className="text-sm text-gray-500">10 aktivitas terakhir hari ini</p>
                    </div>
                    <button
                        onClick={() => fetchData(true)}
                        disabled={refreshing}
                        className="btn-ghost"
                    >
                        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                        <span className="hidden md:inline">Refresh</span>
                    </button>
                </div>

                <div className="overflow-x-auto">
                    {liveFeed.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p>Belum ada aktivitas presensi hari ini</p>
                        </div>
                    ) : (
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Anggota</th>
                                    <th>Kelas</th>
                                    <th>Masuk</th>
                                    <th>Pulang</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {liveFeed.map((log, index) => (
                                    <tr key={log.id} className={index === 0 ? 'animate-new-entry' : ''}>
                                        <td>
                                            <div className="flex items-center gap-3">
                                                {log.member?.photo_path ? (
                                                    <img
                                                        src={log.member.photo_path}
                                                        alt=""
                                                        className="w-9 h-9 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-9 h-9 bg-gray-200 rounded-full flex items-center justify-center">
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
            </div>
        </div>
    );
}

export default Dashboard;
