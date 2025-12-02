'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import * as Icons from 'lucide-react';

export default function StudentSidebar() {
    const router = useRouter();
    const pathname = usePathname();
    const [isCollapsed, setIsCollapsed] = useState(false);

    const menuItems = [
        {
            icon: 'LayoutDashboard',
            label: 'Dashboard',
            path: '/student',
        },
        {
            icon: 'Trophy',
            label: 'Your Achievements',
            path: '/student/achievements',
        },
        {
            icon: 'Award',
            label: 'Claim Your Certificates',
            path: '/student/certificates',
        },
        {
            icon: 'Settings',
            label: 'Account Settings',
            path: '/student/settings',
        },
    ];

    const handleNavigation = (path) => {
        router.push(path);
    };

    const handleLogout = () => {
        // Implement logout logic here
        console.log('Logging out...');
        router.push('/');
    };

    return (
        <div
            className={`fixed left-0 top-0 h-screen bg-white border-r border-gray-200 transition-all duration-300 z-50 ${isCollapsed ? 'w-20' : 'w-72'
                }`}
        >
            {/* Toggle Button */}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="absolute -right-3 top-6 bg-white border border-gray-200 rounded-full p-1 hover:bg-gray-50 transition-colors"
            >
                {isCollapsed ? (
                    <Icons.ChevronRight className="w-4 h-4 text-gray-600" />
                ) : (
                    <Icons.ChevronLeft className="w-4 h-4 text-gray-600" />
                )}
            </button>

            <div className="flex flex-col h-full py-6">
                {/* User Profile Section */}
                <div className={`px-6 mb-8 ${isCollapsed ? 'px-4' : ''}`}>
                    <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
                        <div className="relative">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
                                FM
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                        </div>
                        {!isCollapsed && (
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-gray-900 truncate">Faith Muiruri</h3>
                                <p className="text-xs text-gray-500 truncate">Student</p>
                            </div>
                        )}
                    </div>

                    {/* Continue Learning Button */}
                    {!isCollapsed && (
                        <button
                            onClick={() => router.push('/courses/1/learn/1/1')}
                            className="w-full mt-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-2.5 rounded-lg font-semibold text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                        >
                            <Icons.Play className="w-4 h-4" />
                            Continue Learning
                        </button>
                    )}
                </div>

                {/* Navigation Menu */}
                <nav className="flex-1 px-3">
                    <ul className="space-y-1">
                        {menuItems.map((item) => {
                            const IconComponent = Icons[item.icon];
                            const isActive = pathname === item.path;

                            return (
                                <li key={item.path}>
                                    <button
                                        onClick={() => handleNavigation(item.path)}
                                        className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all ${isActive
                                            ? 'bg-gradient-to-r from-orange-50 to-pink-50 text-orange-600 font-semibold'
                                            : 'text-gray-700 hover:bg-gray-50'
                                            } ${isCollapsed ? 'justify-center' : ''}`}
                                        title={isCollapsed ? item.label : ''}
                                    >
                                        {IconComponent && (
                                            <IconComponent
                                                className={`w-5 h-5 ${isActive ? 'text-orange-600' : 'text-gray-500'}`}
                                            />
                                        )}
                                        {!isCollapsed && <span className="text-sm">{item.label}</span>}
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                {/* Logout Button */}
                <div className="px-3 pt-4 border-t border-gray-200">
                    <button
                        onClick={handleLogout}
                        className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-all ${isCollapsed ? 'justify-center' : ''
                            }`}
                        title={isCollapsed ? 'Logout' : ''}
                    >
                        <Icons.LogOut className="w-5 h-5" />
                        {!isCollapsed && <span className="text-sm font-semibold">Logout</span>}
                    </button>
                </div>
            </div>
        </div>
    );
}