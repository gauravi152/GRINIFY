import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    ScanLine,
    BarChart3,
    Trophy,
    BookOpen,
    MapPin,
    User,
    LogOut,
    Leaf
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useAuth } from '../context/AuthContext';

export const Sidebar: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { logout } = useAuth();

    const handleLogout = () => {
        logout();
        navigate('/auth');
    };

    const navItems = [
        { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
        { name: 'Scan Waste', icon: ScanLine, path: '/scan' },
        { name: 'Analytics', icon: BarChart3, path: '/analytics' },
        { name: 'Leaderboard', icon: Trophy, path: '/leaderboard' },
        { name: 'Tips & Education', icon: BookOpen, path: '/tips' },
        { name: 'Nearby Recycling', icon: MapPin, path: '/map' },
        { name: 'Profile', icon: User, path: '/profile' },
    ];

    return (
        <div className="hidden md:flex flex-col w-64 bg-white h-full border-r border-gray-100 shadow-sm">
            <div className="p-6 flex items-center space-x-2">
                <div className="bg-primary/20 p-2 rounded-xl">
                    <Leaf className="w-6 h-6 text-primary" />
                </div>
                <span className="text-2xl font-bold text-text">Grinify</span>
            </div>

            <nav className="flex-1 px-4 py-4 space-y-2">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={twMerge(
                                clsx(
                                    "flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                                    isActive
                                        ? "bg-primary text-white shadow-md shadow-primary/20"
                                        : "text-gray-500 hover:bg-secondary/20 hover:text-primary"
                                )
                            )}
                        >
                            <item.icon className={clsx("w-5 h-5", isActive ? "text-white" : "text-gray-400 group-hover:text-primary")} />
                            <span className="font-medium">{item.name}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-gray-100">
                <button
                    onClick={handleLogout}
                    className="flex items-center space-x-3 px-4 py-3 w-full rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors"
                >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Logout</span>
                </button>
            </div>
        </div>
    );
};
