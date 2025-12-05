'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import * as Icons from 'lucide-react';

export default function AdminSidebar() {
    const router = useRouter();
    const pathname = usePathname();
    const [showPhotoModal, setShowPhotoModal] = useState(false);

    const menuItems = [
        {
            icon: 'LayoutDashboard',
            label: 'Dashboard',
            path: '/admin',
        },
        {
            icon: 'Users',
            label: 'User Management',
            path: '/admin/users',
        },
        {
            icon: 'UserCheck',
            label: 'Fellows Management',
            path: '/admin/fellows',
        },
        {
            icon: 'GraduationCap',
            label: 'Course Management',
            path: '/admin/courses',
        },
        {
            icon: 'UserCog',
            label: 'Instructor Approvals',
            path: '/admin/instructors',
            badge: 3,
        },
        {
            icon: 'Award',
            label: 'Certificates',
            path: '/admin/certificates',
        },
        {
            icon: 'MessageSquare',
            label: 'Discussions',
            path: '/admin/discussions',
            badge: 2,
        },
        {
            icon: 'BarChart3',
            label: 'Analytics & Reports',
            path: '/admin/analytics',
        },
        {
            icon: 'DollarSign',
            label: 'Revenue',
            path: '/admin/revenue',
        },
    ];

    const handleNavigation = (path) => {
        router.push(path);
    };

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="hidden lg:block fixed left-0 top-0 h-screen bg-white w-72 z-50 pt-16 shadow-lg border-r border-gray-200">
                <div className="flex flex-col h-full">
                    {/* Admin Profile Section */}
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="relative group">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-xl cursor-pointer shadow-md">
                                    AD
                                </div>
                                <button
                                    onClick={() => setShowPhotoModal(true)}
                                    className="absolute bottom-0 right-0 w-6 h-6 bg-blue-600 rounded-full border-2 border-white flex items-center justify-center hover:bg-blue-700 transition-colors shadow-md"
                                >
                                    <Icons.Camera className="w-3 h-3 text-white" />
                                </button>
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white shadow-sm"></div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-gray-900 truncate">Admin User</h3>
                                <p className="text-xs text-gray-600">System Administrator</p>
                                <p className="text-xs text-gray-500">ID: ADM-001</p>
                            </div>
                        </div>

                        <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-gray-700 text-xs font-medium">Platform Status</span>
                                <span className="text-green-600 text-xs flex items-center gap-1">
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                    Online
                                </span>
                            </div>
                            <div className="text-gray-600 text-xs">
                                Last login: 2 hours ago
                            </div>
                        </div>
                    </div>

                    {/* Navigation Menu */}
                    <nav className="flex-1 px-4 py-4 overflow-y-auto">
                        <ul className="space-y-1">
                            {menuItems.map((item) => {
                                const IconComponent = Icons[item.icon];
                                const isActive = pathname === item.path;

                                return (
                                    <li key={item.path}>
                                        <button
                                            onClick={() => handleNavigation(item.path)}
                                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-sm relative group ${isActive
                                                ? 'bg-blue-50 text-blue-600 font-medium border border-blue-100'
                                                : 'text-gray-700 hover:bg-gray-50'
                                                }`}
                                        >
                                            {IconComponent && (
                                                <IconComponent
                                                    className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-500'}`}
                                                />
                                            )}
                                            <span className="flex-1 text-left">{item.label}</span>
                                            {item.badge && (
                                                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                                    {item.badge}
                                                </span>
                                            )}
                                            {!isActive && (
                                                <Icons.ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                                            )}
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    </nav>

                    {/* Settings & Logout */}
                    <div className="p-4 border-t border-gray-200 space-y-2">
                        <button
                            onClick={() => router.push('/admin/settings')}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-all duration-200 text-sm"
                        >
                            <Icons.Settings className="w-5 h-5 text-gray-500" />
                            <span>System Settings</span>
                        </button>
                        <button
                            onClick={() => {
                                console.log('Logging out...');
                                router.push('/');
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-all duration-200 text-sm font-medium"
                        >
                            <Icons.LogOut className="w-5 h-5" />
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Photo Edit Modal */}
            {showPhotoModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg max-w-md w-full">
                        <div className="flex items-center justify-between p-4 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">Edit Photo</h3>
                            <button
                                onClick={() => setShowPhotoModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <Icons.X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6">
                            <div className="flex justify-center mb-6">
                                <div className="relative">
                                    <div className="w-40 h-40 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-5xl">
                                        AD
                                    </div>
                                    <button className="absolute bottom-2 right-2 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors">
                                        <Icons.Camera className="w-5 h-5 text-white" />
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
                                    <Icons.Upload className="w-4 h-4" />
                                    Upload Photo
                                </button>
                                <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
                                    <Icons.Trash2 className="w-4 h-4" />
                                    Remove Photo
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Mobile Bottom Navigation */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 shadow-lg">
                <div className="grid grid-cols-5 gap-1 px-2 py-2">
                    <button
                        onClick={() => handleNavigation('/admin')}
                        className={`flex flex-col items-center gap-1 p-2 rounded-lg ${pathname === '/admin' ? 'bg-blue-50 text-blue-600' : 'text-gray-600'
                            }`}
                    >
                        <Icons.LayoutDashboard className="w-5 h-5" />
                        <span className="text-xs">Dashboard</span>
                    </button>
                    <button
                        onClick={() => handleNavigation('/admin/users')}
                        className={`flex flex-col items-center gap-1 p-2 rounded-lg ${pathname === '/admin/users' ? 'bg-blue-50 text-blue-600' : 'text-gray-600'
                            }`}
                    >
                        <Icons.Users className="w-5 h-5" />
                        <span className="text-xs">Users</span>
                    </button>
                    <button
                        onClick={() => handleNavigation('/admin/courses')}
                        className={`flex flex-col items-center gap-1 p-2 rounded-lg ${pathname === '/admin/courses' ? 'bg-blue-50 text-blue-600' : 'text-gray-600'
                            }`}
                    >
                        <Icons.GraduationCap className="w-5 h-5" />
                        <span className="text-xs">Courses</span>
                    </button>
                    <button
                        onClick={() => handleNavigation('/admin/instructors')}
                        className={`flex flex-col items-center gap-1 p-2 rounded-lg relative ${pathname === '/admin/instructors' ? 'bg-blue-50 text-blue-600' : 'text-gray-600'
                            }`}
                    >
                        <Icons.UserCog className="w-5 h-5" />
                        <span className="text-xs">Instructors</span>
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                            3
                        </span>
                    </button>
                    <button
                        onClick={() => handleNavigation('/admin/settings')}
                        className={`flex flex-col items-center gap-1 p-2 rounded-lg ${pathname === '/admin/settings' ? 'bg-blue-50 text-blue-600' : 'text-gray-600'
                            }`}
                    >
                        <Icons.Settings className="w-5 h-5" />
                        <span className="text-xs">Settings</span>
                    </button>
                </div>
            </div>
        </>
    );
}