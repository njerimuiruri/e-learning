'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import * as Icons from 'lucide-react';

export default function AdminSidebar() {
    const router = useRouter();
    const pathname = usePathname();
    const [showPhotoModal, setShowPhotoModal] = useState(false);
    const [showUserDropdown, setShowUserDropdown] = useState(false);
    const [adminUser, setAdminUser] = useState(null);

    useEffect(() => {
        // Load admin user details from localStorage
        const user = localStorage.getItem('user');
        if (user) {
            try {
                setAdminUser(JSON.parse(user));
            } catch (error) {
                console.error('Error parsing user data:', error);
            }
        }
    }, []);

    const handleLogout = () => {
        if (confirm('Are you sure you want to logout?')) {
            // Clear all authentication data
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            sessionStorage.clear();

            // Redirect to home page
            router.replace('/');
        }
    };

    // Get user initials
    const getUserInitials = () => {
        if (!adminUser) return 'AD';
        const firstName = adminUser.firstName || '';
        const lastName = adminUser.lastName || '';
        return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase() || 'AD';
    };

    // Get full name
    const getFullName = () => {
        if (!adminUser) return 'Admin User';
        return `${adminUser.firstName || ''} ${adminUser.lastName || ''}`.trim() || 'Admin User';
    };

    // Get email
    const getEmail = () => {
        return adminUser?.email || 'admin@platform.com';
    };

    const menuItems = [
        {
            icon: 'LayoutDashboard',
            label: 'Dashboard',
            path: '/admin',
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
            icon: 'Clock',
            label: 'Pending Course Approvals',
            path: '/admin/courses/pending',
            badge: null, // Will be updated with count
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
        // {
        //     icon: 'MessageSquare',
        //     label: 'Discussions',
        //     path: '/admin/discussions',
        //     badge: 2,
        // },
        {
            icon: 'BarChart3',
            label: 'Analytics & Reports',
            path: '/admin/analytics',
        },
        // {
        //     icon: 'DollarSign',
        //     label: 'Revenue',
        //     path: '/admin/revenue',
        // },
    ];

    const handleNavigation = (path) => {
        router.push(path);
    };

    return (
        <>
            {/* Top Navigation - moved here to be reused across admin pages */}
            <header className="fixed top-0 left-0 lg:left-72 right-0 bg-white border-b border-gray-200 z-40 shadow-sm">
                <div className="flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-md">
                                <Icons.Shield className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Admin Portal</h2>
                                <p className="text-xs text-gray-500">Management Dashboard</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
                            <Icons.Bell className="w-5 h-5 text-gray-600" />
                            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                        </button>

                        <button className="hidden md:flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                            <Icons.Search className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-600">Quick search...</span>
                            <kbd className="px-2 py-0.5 text-xs bg-white rounded border border-gray-300">⌘K</kbd>
                        </button>

                        <div className="relative">
                            <button
                                onClick={() => setShowUserDropdown(!showUserDropdown)}
                                className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-lg transition-all duration-200 group"
                            >
                                <div className="relative">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-md group-hover:shadow-lg transition-shadow">
                                        {getUserInitials()}
                                    </div>
                                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
                                </div>
                                <div className="hidden md:block text-left">
                                    <p className="text-sm font-semibold text-gray-900">{getFullName()}</p>
                                    <p className="text-xs text-gray-500">{adminUser?.role === 'admin' ? 'Administrator' : 'User'}</p>
                                </div>
                                <Icons.ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${showUserDropdown ? 'rotate-180' : ''}`} />
                            </button>

                            {showUserDropdown && (
                                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50">
                                    <div className="px-4 py-3 border-b border-gray-100">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold shadow-md">
                                                {getUserInitials()}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-semibold text-gray-900">{getFullName()}</p>
                                                <p className="text-xs text-gray-500">{getEmail()}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-gray-600">Role: {adminUser?.role || 'Administrator'}</span>
                                            <span className="flex items-center gap-1 text-green-600">
                                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                                                Active
                                            </span>
                                        </div>
                                    </div>
                                    <div className="py-2">
                                        <button
                                            onClick={() => {
                                                setShowUserDropdown(false);
                                                router.push('/admin/profile');
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
                                        >
                                            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                                                <Icons.User className="w-4 h-4 text-blue-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">My Profile</p>
                                                <p className="text-xs text-gray-500">View and edit profile</p>
                                            </div>
                                        </button>

                                        <button
                                            onClick={() => {
                                                setShowUserDropdown(false);
                                                router.push('/admin/settings');
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
                                        >
                                            <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                                                <Icons.Settings className="w-4 h-4 text-purple-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">Settings</p>
                                                <p className="text-xs text-gray-500">System preferences</p>
                                            </div>
                                        </button>

                                        <button
                                            onClick={() => {
                                                setShowUserDropdown(false);
                                                router.push('/admin/activity');
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
                                        >
                                            <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                                                <Icons.Activity className="w-4 h-4 text-green-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">Activity Log</p>
                                                <p className="text-xs text-gray-500">View recent actions</p>
                                            </div>
                                        </button>

                                        <button
                                            onClick={() => {
                                                setShowUserDropdown(false);
                                                alert('Help Center opened');
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
                                        >
                                            <div className="w-8 h-8 bg-yellow-50 rounded-lg flex items-center justify-center">
                                                <Icons.HelpCircle className="w-4 h-4 text-yellow-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">Help & Support</p>
                                                <p className="text-xs text-gray-500">Get assistance</p>
                                            </div>
                                        </button>
                                    </div>

                                    <div className="border-t border-gray-100 pt-2 px-2">
                                        <button
                                            onClick={() => {
                                                setShowUserDropdown(false);
                                                handleLogout();
                                            }}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-red-50 rounded-lg transition-colors text-left group"
                                        >
                                            <div className="w-8 h-8 bg-red-50 group-hover:bg-red-100 rounded-lg flex items-center justify-center transition-colors">
                                                <Icons.LogOut className="w-4 h-4 text-red-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-red-600">Logout</p>
                                                <p className="text-xs text-red-500">Sign out of your account</p>
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>
            {/* Desktop Sidebar */}
            <aside className="hidden lg:block fixed left-0 top-0 h-screen bg-white w-72 z-50 shadow-lg border-r border-gray-200">
                <div className="flex flex-col h-full">
                    {/* Admin Profile Section */}
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="relative group">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-xl cursor-pointer shadow-md">
                                    {getUserInitials()}
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
                                <h3 className="font-semibold text-gray-900 truncate">{getFullName()}</h3>
                                <p className="text-xs text-gray-600">{adminUser?.role === 'admin' ? 'System Administrator' : 'User'}</p>
                                <p className="text-xs text-gray-500 truncate">{getEmail()}</p>
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