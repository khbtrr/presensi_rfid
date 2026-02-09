import { useLocation } from 'react-router-dom';
import { Bell, Search } from 'lucide-react';

const pageTitles = {
    '/': 'Dashboard',
    '/members': 'Manajemen Anggota',
    '/cards': 'Registrasi Kartu RFID',
    '/reports': 'Laporan Presensi',
};

function Header() {
    const location = useLocation();
    const title = pageTitles[location.pathname] || 'Sistem Presensi';

    // Get current date/time
    const now = new Date();
    const dateString = now.toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
        <header className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
                {/* Left - Title */}
                <div>
                    <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
                    <p className="text-sm text-gray-500">{dateString}</p>
                </div>

                {/* Right - Actions */}
                <div className="flex items-center gap-4">
                    {/* Search */}
                    <div className="relative hidden md:block">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Cari..."
                            className="pl-10 pr-4 py-2 w-64 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                        />
                    </div>

                    {/* Notifications */}
                    <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
                        <Bell className="w-5 h-5 text-gray-600" />
                        <span className="absolute top-1 right-1 w-2 h-2 bg-danger-500 rounded-full"></span>
                    </button>

                    {/* User Avatar */}
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-medium">AD</span>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}

export default Header;
