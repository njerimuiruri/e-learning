'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import * as Icons from 'lucide-react';

export default function StudentSidebar() {
    const router = useRouter();
    const pathname = usePathname();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [showPhotoModal, setShowPhotoModal] = useState(false);

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

    ];

    const handleNavigation = (path) => {
        router.push(path);
    };

    const handleContinueLearning = () => {
        router.push('/courses/1/learn/1/1');
    };

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="hidden lg:block fixed left-0 top-0 h-screen bg-white border-r border-gray-200 w-64 z-50 pt-16">
                <div className="flex flex-col h-full">
                    {/* User Profile Section */}
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="relative group">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white font-bold text-xl cursor-pointer">
                                    FM
                                </div>
                                <button
                                    onClick={() => setShowPhotoModal(true)}
                                    className="absolute bottom-0 right-0 w-6 h-6 bg-white rounded-full border-2 border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
                                >
                                    <Icons.Camera className="w-3 h-3 text-gray-600" />
                                </button>
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-gray-900 truncate">Faith Muiruri</h3>
                                <p className="text-xs text-gray-500">Finish Your Profile</p>
                                <p className="text-xs text-gray-400">Alison ID: 24223577</p>
                            </div>
                        </div>

                        <button
                            onClick={handleContinueLearning}
                            className="w-full bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2"
                        >
                            <Icons.Play className="w-4 h-4" />
                            Continue Learning
                        </button>

                        {/* Profile Completion */}
                        <div className="mt-4">
                            <div className="flex items-center justify-between text-xs mb-2">
                                <span className="text-orange-600 font-medium">100% Remaining</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div className="bg-orange-500 h-1.5 rounded-full" style={{ width: '0%' }}></div>
                            </div>
                        </div>
                    </div>

                    {/* Navigation Menu */}
                    <nav className="flex-1 px-3 py-4 overflow-y-auto">
                        <ul className="space-y-1">
                            {menuItems.map((item) => {
                                const IconComponent = Icons[item.icon];
                                const isActive = pathname === item.path;

                                return (
                                    <li key={item.path}>
                                        <button
                                            onClick={() => handleNavigation(item.path)}
                                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm ${isActive
                                                ? 'bg-green-50 text-green-700 font-medium'
                                                : 'text-gray-700 hover:bg-gray-50'
                                                }`}
                                        >
                                            {IconComponent && (
                                                <IconComponent
                                                    className={`w-5 h-5 ${isActive ? 'text-green-700' : 'text-gray-500'}`}
                                                />
                                            )}
                                            <span>{item.label}</span>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>

                        {/* Additional Options */}
                        <div className="mt-6 pt-6 border-t border-gray-200">
                            <button
                                onClick={() => router.push('/student/settings')}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm"
                            >
                                <Icons.Settings className="w-5 h-5 text-gray-500" />
                                <span>Account Settings</span>
                            </button>

                        </div>
                    </nav>

                    {/* Logout Button */}
                    <div className="p-3 border-t border-gray-200">
                        <button
                            onClick={() => {
                                console.log('Logging out...');
                                router.push('/');
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors text-sm font-medium"
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
                                    <div className="w-40 h-40 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white font-bold text-5xl">
                                        FM
                                    </div>
                                    <button className="absolute bottom-2 right-2 w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors">
                                        <Icons.Camera className="w-5 h-5 text-white" />
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <button className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
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
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
                <div className="grid grid-cols-5 gap-1 px-2 py-2">
                    <button
                        onClick={() => handleNavigation('/student/for-you')}
                        className={`flex flex-col items-center gap-1 p-2 rounded-lg ${pathname === '/student/for-you' ? 'text-green-600' : 'text-gray-600'
                            }`}
                    >
                        <Icons.Heart className="w-5 h-5" />
                        <span className="text-xs">For You</span>
                    </button>
                    <button
                        onClick={() => handleNavigation('/student')}
                        className={`flex flex-col items-center gap-1 p-2 rounded-lg ${pathname === '/student' ? 'text-green-600' : 'text-gray-600'
                            }`}
                    >
                        <Icons.LayoutDashboard className="w-5 h-5" />
                        <span className="text-xs">Dashboard</span>
                    </button>
                    <button
                        onClick={() => handleNavigation('/student/achievements')}
                        className={`flex flex-col items-center gap-1 p-2 rounded-lg ${pathname === '/student/achievements' ? 'text-green-600' : 'text-gray-600'
                            }`}
                    >
                        <Icons.Trophy className="w-5 h-5" />
                        <span className="text-xs">Achievements</span>
                    </button>
                    <button
                        onClick={() => handleNavigation('/student/certificates')}
                        className={`flex flex-col items-center gap-1 p-2 rounded-lg ${pathname === '/student/certificates' ? 'text-green-600' : 'text-gray-600'
                            }`}
                    >
                        <Icons.Award className="w-5 h-5" />
                        <span className="text-xs">Certificates</span>
                    </button>
                    <button
                        onClick={() => handleNavigation('/student/settings')}
                        className={`flex flex-col items-center gap-1 p-2 rounded-lg ${pathname === '/student/settings' ? 'text-green-600' : 'text-gray-600'
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