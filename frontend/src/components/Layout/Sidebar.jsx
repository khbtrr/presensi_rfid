import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    CreditCard,
    FileText,
    Wifi
} from 'lucide-react';

const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/members', icon: Users, label: 'Anggota' },
    { path: '/cards', icon: CreditCard, label: 'Kartu RFID' },
    { path: '/reports', icon: FileText, label: 'Laporan' },
];

function Sidebar() {
    return (
        <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
            {/* Logo */}
            <div className="p-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                        <Wifi className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="font-bold text-gray-900">Presensi IoT</h1>
                        <p className="text-xs text-gray-500">RFID Attendance</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.path === '/'}
                        className={({ isActive }) =>
                            `nav-item ${isActive ? 'active' : ''}`
                        }
                    >
                        <item.icon className="w-5 h-5" />
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                    <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse"></div>
                    <span>Sistem Aktif</span>
                </div>
            </div>
        </aside>
    );
}

export default Sidebar;
