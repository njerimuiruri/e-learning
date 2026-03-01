'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import * as Icons from 'lucide-react';
import authService from '@/lib/api/authService';
import moduleService from '@/lib/api/moduleService';

export default function InstructorSidebar() {
    const router = useRouter();
    const pathname = usePathname();
    const [showUserDropdown, setShowUserDropdown] = useState(false);
    const [instructorUser, setInstructorUser] = useState(null);
    const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
    const [moduleStats, setModuleStats] = useState({ totalModules: 0, totalStudents: 0 });

    useEffect(() => {
        // Load instructor user details from cookies and refresh from backend
        const loadUser = async () => {
            try {
                // Fetch fresh data from backend
                const user = await authService.fetchUserProfile();
                if (user) {
                    setInstructorUser(user);
                    // Update cookie with fresh data
                    authService.updateCurrentUser(user);
                }
            } catch (error) {
                console.error('Error loading user:', error);
                // Fallback to cookie data
                const user = authService.getCurrentUser();
                if (user) {
                    setInstructorUser(user);
                }
            }
        };

        loadUser();
    }, []);

    useEffect(() => {
        const fetchModuleStats = async () => {
            try {
                const stats = await moduleService.getInstructorStats();
                setModuleStats({
                    totalModules: stats.totalModules || 0,
                    totalStudents: stats.totalStudents || 0,
                });
            } catch (error) {
                console.error('Error fetching module stats:', error);
            }
        };

        fetchModuleStats();
    }, []);

    useEffect(() => {
        // Fetch unread messages count
        const fetchUnreadCount = async () => {
            try {
                const token = authService.getCookie('token');
                if (!token) return;

                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.elearning.arin-africa.org';
                const response = await fetch(`${API_URL}/api/messages/unread-count`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    const count = data?.data?.count ?? data?.count ?? 0;
                    setUnreadMessagesCount(count);
                }
            } catch (error) {
                // Silently fail - don't show error to user for polling
                console.error('Error fetching unread messages:', error.message);
            }
        };

        fetchUnreadCount();

        // Poll every 30 seconds
        const interval = setInterval(fetchUnreadCount, 30000);

        return () => clearInterval(interval);
    }, []);

    const handleLogout = () => {
        if (confirm('Are you sure you want to logout?')) {
            // Mark that we're logging out to prevent redirect loops
            if (typeof sessionStorage !== 'undefined') {
                sessionStorage.setItem('isLoggingOut', 'true');
            }

            // Clear cookies immediately (synchronous)
            authService.logout();

            // Use router.push for clean navigation
            setTimeout(() => {
                router.push('/login');
                // Clear the logout flag after a delay to allow redirect to complete
                setTimeout(() => {
                    if (typeof sessionStorage !== 'undefined') {
                        sessionStorage.removeItem('isLoggingOut');
                    }
                }, 500);
            }, 50);
        }
    };

    // Get user initials
    const getUserInitials = () => {
        if (!instructorUser) return 'IN';
        const firstName = instructorUser.firstName || '';
        const lastName = instructorUser.lastName || '';
        return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase() || 'IN';
    };

    // Get full name
    const getFullName = () => {
        if (!instructorUser) return 'Instructor';
        return `${instructorUser.firstName || ''} ${instructorUser.lastName || ''}`.trim() || 'Instructor';
    };

    // Get email
    const getEmail = () => {
        return instructorUser?.email || 'instructor@platform.com';
    };

    const menuItems = [
        {
            icon: 'LayoutDashboard',
            label: 'Dashboard',
            path: '/instructor',
        },
        {
            icon: 'User',
            label: 'My Profile',
            path: '/instructor/profile',
        },
        {
            icon: 'Layers',
            label: 'My Modules',
            path: '/instructor/modules',
        },
        {
            icon: 'PlusCircle',
            label: 'Create Module',
            path: '/instructor/modules/create',
        },
        {
            icon: 'ClipboardList',
            label: 'Assessments',
            path: '/instructor/assessments',
        },
        {
            icon: 'FileCheck',
            label: 'Review Submissions',
            path: '/instructor/submissions',
        },
        {
            icon: 'Users',
            label: 'Student Responses',
            path: '/instructor/students',
        },
        {
            icon: 'MessageCircle',
            label: 'Messages',
            path: '/instructor/messages',
            badge: unreadMessagesCount,
        },
        {
            icon: 'BarChart3',
            label: 'Analytics',
            path: '/instructor/analytics',
        },
    ];

    const handleNavigation = (path) => {
        router.push(path);
    };

    return (
        <>
            {/* Top Navigation */}
            <header className="fixed top-0 left-0 lg:left-72 right-0 bg-white border-b border-gray-200 z-40 shadow-sm">
                <div className="flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-[#16a34a] to-emerald-700 rounded-lg flex items-center justify-center shadow-md">
                                <Icons.GraduationCap className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Instructor Portal</h2>
                                <p className="text-xs text-gray-500">Teaching Dashboard</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
                            <Icons.Bell className="w-5 h-5 text-gray-600" />
                            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                        </button>

                        <div className="relative">
                            <button
                                onClick={() => setShowUserDropdown(!showUserDropdown)}
                                className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-lg transition-all duration-200 group"
                            >
                                <div className="relative">
                                    {instructorUser?.profilePhotoUrl ? (
                                        <img
                                            src={
                                                instructorUser.profilePhotoUrl.startsWith('http')
                                                    ? instructorUser.profilePhotoUrl
                                                    : `${process.env.NEXT_PUBLIC_API_URL || 'https://api.elearning.arin-africa.org'}/api/files/download/${instructorUser.profilePhotoUrl.split('/').pop()}?inline=true`
                                            }
                                            alt="Profile"
                                            className="w-10 h-10 rounded-full object-cover shadow-md group-hover:shadow-lg transition-shadow"
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                                if (e.target.nextElementSibling?.nextElementSibling) {
                                                    e.target.nextElementSibling.nextElementSibling.style.display = 'flex';
                                                }
                                            }}
                                        />
                                    ) : null}
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#16a34a] to-emerald-700 flex items-center justify-center text-white font-bold text-sm shadow-md group-hover:shadow-lg transition-shadow" style={{ display: instructorUser?.profilePhotoUrl ? 'none' : 'flex' }}>
                                        {getUserInitials()}
                                    </div>
                                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
                                </div>
                                <div className="hidden md:block text-left">
                                    <p className="text-sm font-semibold text-gray-900">{getFullName()}</p>
                                    <p className="text-xs text-gray-500">Instructor</p>
                                </div>
                                <Icons.ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${showUserDropdown ? 'rotate-180' : ''}`} />
                            </button>

                            {showUserDropdown && (
                                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50">
                                    <div className="px-4 py-3 border-b border-gray-100">
                                        <div className="flex items-center gap-3 mb-3">
                                            {instructorUser?.profilePhotoUrl ? (
                                                <img
                                                    src={
                                                        instructorUser.profilePhotoUrl.startsWith('http')
                                                            ? instructorUser.profilePhotoUrl
                                                            : `${process.env.NEXT_PUBLIC_API_URL || 'https://api.elearning.arin-africa.org'}/api/files/download/${instructorUser.profilePhotoUrl.split('/').pop()}?inline=true`
                                                    }
                                                    alt="Profile"
                                                    className="w-12 h-12 rounded-full object-cover shadow-md"
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                        if (e.target.nextElementSibling) {
                                                            e.target.nextElementSibling.style.display = 'flex';
                                                        }
                                                    }}
                                                />
                                            ) : null}
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#16a34a] to-emerald-700 flex items-center justify-center text-white font-bold shadow-md" style={{ display: instructorUser?.profilePhotoUrl ? 'none' : 'flex' }}>
                                                {getUserInitials()}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-semibold text-gray-900">{getFullName()}</p>
                                                <p className="text-xs text-gray-500">{getEmail()}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-gray-600">Role: Instructor</span>
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
                                                router.push('/instructor/profile');
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
                                        >
                                            <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                                                <Icons.User className="w-4 h-4 text-emerald-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">My Profile</p>
                                                <p className="text-xs text-gray-500">View and edit profile</p>
                                            </div>
                                        </button>

                                        <button
                                            onClick={() => {
                                                setShowUserDropdown(false);
                                                router.push('/instructor/settings');
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
                                        >
                                            <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                                                <Icons.Settings className="w-4 h-4 text-purple-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">Settings</p>
                                                <p className="text-xs text-gray-500">Preferences</p>
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
                    {/* Instructor Profile Section */}
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="relative group">
                                {instructorUser?.profilePhotoUrl ? (
                                    <img
                                        src={
                                            instructorUser.profilePhotoUrl.startsWith('http')
                                                ? instructorUser.profilePhotoUrl
                                                : `${process.env.NEXT_PUBLIC_API_URL || 'https://api.elearning.arin-africa.org'}/api/files/download/${instructorUser.profilePhotoUrl.split('/').pop()}?inline=true`
                                        }
                                        alt="Profile"
                                        className="w-16 h-16 rounded-full object-cover cursor-pointer shadow-md"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            if (e.target.nextElementSibling?.nextElementSibling) {
                                                e.target.nextElementSibling.nextElementSibling.style.display = 'flex';
                                            }
                                        }}
                                    />
                                ) : null}
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#16a34a] to-emerald-700 flex items-center justify-center text-white font-bold text-xl cursor-pointer shadow-md" style={{ display: instructorUser?.profilePhotoUrl ? 'none' : 'flex' }}>
                                    {getUserInitials()}
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white shadow-sm"></div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-gray-900 truncate">{getFullName()}</h3>
                                <p className="text-xs text-gray-600">Instructor</p>
                                <p className="text-xs text-gray-500 truncate">{getEmail()}</p>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg p-3 border border-emerald-100">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-gray-700 text-xs font-medium">Teaching Status</span>
                                <span className="text-green-600 text-xs flex items-center gap-1">
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                    Active
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-gray-600">
                                <span>Modules: {moduleStats.totalModules}</span>
                                <span>Students: {moduleStats.totalStudents}</span>
                            </div>
                        </div>
                    </div>

                    {/* Navigation Menu */}
                    <nav className="flex-1 overflow-y-auto py-4 px-3">
                        <div className="space-y-1">
                            {menuItems.map((item, index) => {
                                const IconComponent = Icons[item.icon];
                                const isActive = pathname === item.path;

                                return (
                                    <button
                                        key={index}
                                        onClick={() => handleNavigation(item.path)}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${isActive
                                            ? 'bg-gradient-to-r from-[#16a34a] to-emerald-600 text-white shadow-md'
                                            : 'text-gray-700 hover:bg-emerald-50'
                                            }`}
                                    >
                                        {IconComponent && (
                                            <IconComponent className={`w-5 h-5 ${isActive ? 'text-white' : 'text-emerald-600'}`} />
                                        )}
                                        <span className="font-medium flex-1 text-left">{item.label}</span>
                                        {item.badge && (
                                            <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${typeof item.badge === 'string' && item.badge === 'NEW'
                                                ? 'bg-emerald-500 text-white'
                                                : isActive
                                                    ? 'bg-white text-emerald-600'
                                                    : 'bg-emerald-100 text-emerald-700'
                                                }`}>
                                                {item.badge}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </nav>

                    {/* Footer */}
                    <div className="p-4 border-t border-gray-200">
                        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg p-4 border border-emerald-200">
                            <Icons.Lightbulb className="w-8 h-8 text-emerald-600 mb-2" />
                            <h4 className="font-semibold text-gray-900 text-sm mb-1">Need Help?</h4>
                            <p className="text-xs text-gray-600 mb-3">
                                Check our instructor guide for tips and best practices.
                            </p>
                            <button className="w-full px-3 py-2 bg-gradient-to-r from-[#16a34a] to-emerald-600 text-white rounded-lg text-xs font-medium hover:from-emerald-600 hover:to-emerald-700 transition-all">
                                View Guide
                            </button>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Mobile Menu Button */}
            <button className="lg:hidden fixed bottom-4 right-4 w-14 h-14 bg-gradient-to-br from-[#16a34a] to-emerald-700 text-white rounded-full shadow-lg flex items-center justify-center z-50">
                <Icons.Menu className="w-6 h-6" />
            </button>
        </>
    );
}
