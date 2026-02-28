'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import * as Icons from 'lucide-react';
import authService from '@/lib/api/authService';
import moduleEnrollmentService from '@/lib/api/moduleEnrollmentService';
import { useToast } from '@/components/ui/ToastProvider';

export default function StudentSidebar() {
    const router = useRouter();
    const pathname = usePathname();
    const { showToast } = useToast();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [showPhotoModal, setShowPhotoModal] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [studentData, setStudentData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);

    // Fetch user data on component mount
    useEffect(() => {
        fetchUserData();
    }, []);

    const fetchUserData = async () => {
        try {
            setLoading(true);
            const user = authService.getCurrentUser();

            if (user) {
                setCurrentUser(user);
            } else {
                // If no user found, redirect to home
                router.push('/');
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getInitials = () => {
        if (currentUser) {
            const first = currentUser.firstName?.charAt(0) || '';
            const last = currentUser.lastName?.charAt(0) || '';
            return (first + last).toUpperCase();
        }
        return 'U';
    };

    const getFullName = () => {
        if (currentUser) {
            return `${currentUser.firstName} ${currentUser.lastName}`;
        }
        return 'User';
    };

    const calculateProfileCompletion = () => {
        if (!currentUser) return 0;

        let completed = 0;
        const totalFields = 8;

        if (currentUser.firstName) completed++;
        if (currentUser.lastName) completed++;
        if (currentUser.email) completed++;
        if (currentUser.profilePhotoUrl) completed++;
        if (currentUser.bio) completed++;
        if (currentUser.phoneNumber) completed++;
        if (currentUser.country) completed++;
        if (currentUser.emailVerified) completed++;

        return Math.round((completed / totalFields) * 100);
    };

    const handlePhotoUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.match(/image\/(jpeg|jpg|png|gif)/)) {
            showToast('Please upload a valid image file (JPEG, PNG, or GIF)', { type: 'warning', title: 'Invalid file type' });
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            showToast('File size must be less than 5MB', { type: 'warning', title: 'File too large' });
            return;
        }

        setUploadingPhoto(true);

        try {

            const reader = new FileReader();
            reader.onloadend = () => {
                setCurrentUser({
                    ...currentUser,
                    profilePhotoUrl: reader.result
                });
                // Update localStorage
                localStorage.setItem('user', JSON.stringify({
                    ...currentUser,
                    profilePhotoUrl: reader.result
                }));
            };
            reader.readAsDataURL(file);

            setShowPhotoModal(false);
        } catch (error) {
            console.error('Error uploading photo:', error);
            showToast('Failed to upload photo. Please try again.', { type: 'error', title: 'Upload failed' });
        } finally {
            setUploadingPhoto(false);
        }
    };

    const handleRemovePhoto = () => {
        setCurrentUser({
            ...currentUser,
            profilePhotoUrl: null
        });
        localStorage.setItem('user', JSON.stringify({
            ...currentUser,
            profilePhotoUrl: null
        }));
        setShowPhotoModal(false);
    };

    const handleLogout = () => {
        // Mark that we're logging out to prevent redirect loops
        if (typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem('isLoggingOut', 'true');
        }

        // Clear auth data using authService (synchronous)
        authService.logout();

        // Clear any other local data
        setCurrentUser(null);
        setStudentData(null);

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
    };

    const menuItems = [
        {
            icon: 'LayoutDashboard',
            label: 'Dashboard',
            path: '/student',
        },
        {
            icon: 'BookOpen',
            label: 'Browse Modules',
            path: '/student/modules',
        },
        {
            icon: 'FileText',
            label: 'My Notes',
            path: '/student/../notes',
        },
        {
            icon: 'MessageCircle',
            label: 'Messages',
            path: '/student/messages',
        },
        {
            icon: 'Trophy',
            label: 'Your Achievements',
            path: '/student/achievements',
        },
        {
            icon: 'Award',
            label: 'Certificates',
            path: '/student/certificates',
        },
        {
            icon: 'Settings',
            label: 'Account Settings',
            path: '/student/account-settings',
        },
    ];

    const handleNavigation = (path) => {
        router.push(path);
    };

    const handleContinueLearning = async () => {
        try {
            const enrollments = await moduleEnrollmentService.getMyEnrollments();

            if (enrollments && enrollments.length > 0) {
                const inProgress = enrollments.find(e => !e.isCompleted);
                if (inProgress) {
                    router.push(`/student/modules/${inProgress._id}`);
                } else {
                    router.push('/student/modules');
                }
            } else {
                router.push('/student/modules');
            }
        } catch (error) {
            console.error('Failed to continue learning:', error);
            router.push('/student/modules');
        }
    };

    const profileCompletion = calculateProfileCompletion();
    const remainingPercentage = 100 - profileCompletion;

    if (loading) {
        return (
            <aside className="hidden lg:block fixed left-0 top-0 h-screen bg-white border-r border-gray-200 w-64 z-50 pt-16">
                <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                </div>
            </aside>
        );
    }

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="hidden lg:block fixed left-0 top-0 h-screen bg-white border-r border-gray-200 w-64 z-50 pt-16">
                <div className="flex flex-col h-full">
                    {/* User Profile Section */}
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="relative group">
                                {currentUser?.profilePhotoUrl ? (
                                    <img
                                        src={currentUser.profilePhotoUrl}
                                        alt={getFullName()}
                                        className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                                    />
                                ) : (
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white font-bold text-xl">
                                        {getInitials()}
                                    </div>
                                )}
                                <button
                                    onClick={() => setShowPhotoModal(true)}
                                    className="absolute bottom-0 right-0 w-6 h-6 bg-white rounded-full border-2 border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
                                >
                                    <Icons.Camera className="w-3 h-3 text-gray-600" />
                                </button>
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-gray-900 truncate">{getFullName()}</h3>
                                <p className="text-xs text-gray-500">
                                    {profileCompletion === 100 ? 'Profile Complete' : 'Finish Your Profile'}
                                </p>
                                <p className="text-xs text-gray-400">
                                    XP: {currentUser?.totalPoints || 0}
                                </p>
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
                        {profileCompletion < 100 && (
                            <div className="mt-4">
                                <div className="flex items-center justify-between text-xs mb-2">
                                    <span className="text-orange-600 font-medium">
                                        {remainingPercentage}% Remaining
                                    </span>
                                    <span className="text-gray-500">{profileCompletion}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-1.5">
                                    <div
                                        className="bg-[#021d49] h-1.5 rounded-full transition-all duration-500"
                                        style={{ width: `${profileCompletion}%` }}
                                    ></div>
                                </div>
                            </div>
                        )}
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
                    </nav>

                    {/* Logout Button */}
                    <div className="p-3 border-t border-gray-200">
                        <button
                            onClick={handleLogout}
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
                                    {currentUser?.profilePhotoUrl ? (
                                        <img
                                            src={currentUser.profilePhotoUrl}
                                            alt={getFullName()}
                                            className="w-40 h-40 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-40 h-40 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white font-bold text-5xl">
                                            {getInitials()}
                                        </div>
                                    )}
                                    <label className="absolute bottom-2 right-2 w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors cursor-pointer">
                                        <Icons.Camera className="w-5 h-5 text-white" />
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handlePhotoUpload}
                                            className="hidden"
                                            disabled={uploadingPhoto}
                                        />
                                    </label>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer">
                                    <Icons.Upload className="w-4 h-4" />
                                    {uploadingPhoto ? 'Uploading...' : 'Upload Photo'}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handlePhotoUpload}
                                        className="hidden"
                                        disabled={uploadingPhoto}
                                    />
                                </label>
                                {currentUser?.profilePhotoUrl && (
                                    <button
                                        onClick={handleRemovePhoto}
                                        className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Icons.Trash2 className="w-4 h-4" />
                                        Remove Photo
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Mobile Bottom Navigation */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
                <div className="grid grid-cols-5 gap-1 px-2 py-2">
                    <button
                        onClick={() => handleNavigation('/student')}
                        className={`flex flex-col items-center gap-1 p-2 rounded-lg ${pathname === '/student' ? 'text-green-600' : 'text-gray-600'
                            }`}
                    >
                        <Icons.LayoutDashboard className="w-5 h-5" />
                        <span className="text-xs">Dashboard</span>
                    </button>
                    <button
                        onClick={() => handleNavigation('/student/modules')}
                        className={`flex flex-col items-center gap-1 p-2 rounded-lg ${pathname === '/student/modules' ? 'text-green-600' : 'text-gray-600'
                            }`}
                    >
                        <Icons.BookOpen className="w-5 h-5" />
                        <span className="text-xs">Modules</span>
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