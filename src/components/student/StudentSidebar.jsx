'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import * as Icons from 'lucide-react';
import authService from '@/lib/api/authService';
import moduleEnrollmentService from '@/lib/api/moduleEnrollmentService';
import { useToast } from '@/components/ui/ToastProvider';
import { summarizeEnrollments } from '@/lib/utils/enrollmentProgress';

export default function StudentSidebar() {
    const router = useRouter();
    const pathname = usePathname();
    const { showToast } = useToast();
    const [showPhotoModal, setShowPhotoModal] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [learningProgress, setLearningProgress] = useState(0);
    const [enrolledCount, setEnrolledCount] = useState(0);

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
                router.push('/');
                return;
            }
            // Fetch enrollment data for dynamic learning progress
            try {
                const enrollments = await moduleEnrollmentService.getMyEnrollments();
                const list = Array.isArray(enrollments) ? enrollments : enrollments?.enrollments || [];
                setEnrolledCount(list.length);
                const { overallProgress } = summarizeEnrollments(list);
                setLearningProgress(overallProgress);
            } catch {
                setLearningProgress(0);
                setEnrolledCount(0);
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getInitials = () => {
        if (!currentUser) return 'U';
        const combined = `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim()
            || currentUser.fullName || '';
        const parts = combined.split(' ');
        return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || 'U';
    };

    const getFullName = () => {
        if (!currentUser) return 'User';
        const combined = `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim();
        return combined || currentUser.fullName || 'User';
    };

    const calculateProfileCompletion = () => {
        if (!currentUser) return 0;
        const hasName = !!(currentUser.fullName || currentUser.firstName || currentUser.lastName);
        const hasRegion = !!(currentUser.region || currentUser.fellowData?.region);
        const hasPhoto = !!currentUser.profilePhotoUrl;
        return (hasName && hasRegion && hasPhoto) ? 100 : 0;
    };

    const handlePhotoUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        if (!file.type.match(/image\/(jpeg|jpg|png|gif)/)) {
            showToast('Please upload a valid image file (JPEG, PNG, or GIF)', { type: 'warning' });
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            showToast('File size must be less than 5MB', { type: 'warning' });
            return;
        }
        setUploadingPhoto(true);
        try {
            const reader = new FileReader();
            reader.onloadend = () => {
                const photoUrl = reader.result;
                const updated = { ...currentUser, profilePhotoUrl: photoUrl };
                setCurrentUser(updated);
                // Update both localStorage and cookie so all components see the new photo
                localStorage.setItem('user', JSON.stringify(updated));
                authService.updateCurrentUser({ profilePhotoUrl: photoUrl });
                // Notify navbar and other components
                window.dispatchEvent(new CustomEvent('userProfileUpdated', { detail: { profilePhotoUrl: photoUrl } }));
            };
            reader.readAsDataURL(file);
            setShowPhotoModal(false);
        } catch {
            showToast('Failed to upload photo.', { type: 'error' });
        } finally {
            setUploadingPhoto(false);
        }
    };

    const handleRemovePhoto = () => {
        const updated = { ...currentUser, profilePhotoUrl: null };
        setCurrentUser(updated);
        localStorage.setItem('user', JSON.stringify(updated));
        authService.updateCurrentUser({ profilePhotoUrl: null });
        window.dispatchEvent(new CustomEvent('userProfileUpdated', { detail: { profilePhotoUrl: null } }));
        setShowPhotoModal(false);
    };

    const handleLogout = () => {
        if (typeof sessionStorage !== 'undefined') sessionStorage.setItem('isLoggingOut', 'true');
        authService.logout();
        setCurrentUser(null);
        setTimeout(() => {
            router.push('/login');
            setTimeout(() => {
                if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem('isLoggingOut');
            }, 500);
        }, 50);
    };

    const handleContinueLearning = async () => {
        try {
            console.log('[ContinueLearning] Sidebar button clicked — fetching enrollments...');
            const enrollments = await moduleEnrollmentService.getMyEnrollments();
            const list = Array.isArray(enrollments) ? enrollments : enrollments?.enrollments || [];
            const inProgress = list.find(e => !e.isCompleted);

            if (!inProgress) {
                console.log('[ContinueLearning] No in-progress module — redirecting to modules list');
                router.push('/student/modules');
                return;
            }

            const moduleId = inProgress.moduleId?._id || inProgress.moduleId;
            const enrollmentId = inProgress._id;
            console.log('[ContinueLearning] Sidebar | found module | moduleId=', moduleId, '| enrollmentId=', enrollmentId);

            // Fetch exact resume position (lesson + slide) from backend
            const progress = await moduleEnrollmentService.getProgress(enrollmentId);
            const lessonIndex = progress?.currentLessonIndex ?? 0;
            const slideIndex = progress?.currentSlideIndex ?? 0;

            console.log('[ContinueLearning] Sidebar | resuming to | lessonIndex=', lessonIndex, '| slideIndex=', slideIndex);
            router.push(`/student/modules/${moduleId}?lesson=${lessonIndex}`);
        } catch (err) {
            console.error('[ContinueLearning] Sidebar failed:', err);
            router.push('/student/modules');
        }
    };

    const menuItems = [
        { icon: 'LayoutDashboard', label: 'Dashboard',         path: '/student'                   },
        { icon: 'BookOpen',        label: 'Browse Modules',    path: '/student/modules'            },
        { icon: 'FileText',        label: 'My Notes',          path: '/notes'                      },
        { icon: 'MessageCircle',   label: 'Messages',          path: '/student/messages'           },
        { icon: 'Trophy',          label: 'Your Achievements', path: '/student/achievements'       },
        { icon: 'Award',           label: 'Certificates',      path: '/student/certificates', locked: true },
        { icon: 'Settings',        label: 'Account Settings',  path: '/student/account-settings'   },
    ];

    const profileCompletion = calculateProfileCompletion();

    const isActive = (path) => {
        if (path === '/student') return pathname === '/student';
        return pathname.startsWith(path);
    };

    if (loading) {
        return (
            <aside className="hidden lg:flex fixed left-0 top-0 h-screen bg-white border-r border-gray-100 w-64 z-50 pt-20 items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#021d49]" />
            </aside>
        );
    }

    return (
        <>
            {/* ── Desktop Sidebar ── */}
            <aside className="hidden lg:flex fixed left-0 top-0 h-screen bg-white border-r border-gray-100 w-64 z-50 pt-20 flex-col">

                {/* Profile section */}
                <div className="px-4 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="relative shrink-0">
                            {currentUser?.profilePhotoUrl ? (
                                <img
                                    src={currentUser.profilePhotoUrl}
                                    alt={getFullName()}
                                    className="w-12 h-12 rounded-full object-cover border-2 border-[#021d49]/20"
                                />
                            ) : (
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#021d49] to-[#1e40af] flex items-center justify-center text-white font-bold text-base">
                                    {getInitials()}
                                </div>
                            )}
                            <button
                                onClick={() => setShowPhotoModal(true)}
                                className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-white rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm"
                            >
                                <Icons.Camera className="w-2.5 h-2.5 text-gray-500" />
                            </button>
                            <div className="absolute top-0 right-0 w-3 h-3 bg-[#1e40af] rounded-full border-2 border-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 text-sm truncate leading-tight">{getFullName()}</p>
                            <p className="text-xs text-gray-500 mt-0.5 leading-tight">
                                {profileCompletion === 100 ? 'Profile complete' : 'Finish your profile'}
                            </p>
                        </div>
                    </div>

                    {/* Continue Learning button */}
                    <button
                        onClick={handleContinueLearning}
                        className="w-full bg-[#021d49] hover:bg-[#032a66] text-white py-2 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2 shadow-sm"
                    >
                        <Icons.Play className="w-3.5 h-3.5" />
                        Continue Learning
                    </button>

                    {/* Learning progress bar */}
                    <div className="mt-3">
                        <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className="text-[#021d49] font-semibold">{learningProgress}% Complete</span>
                            <span className="text-gray-400">{100 - learningProgress}% left</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                            <div
                                className="bg-gradient-to-r from-[#021d49] to-[#1e40af] h-1.5 rounded-full transition-all duration-500"
                                style={{ width: `${learningProgress}%` }}
                            />
                        </div>
                        {enrolledCount === 0 && (
                            <p className="text-[10px] text-gray-400 mt-1">Enroll in a module to start tracking progress</p>
                        )}
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-3 overflow-y-auto">
                    <ul className="space-y-0.5">
                        {menuItems.map((item) => {
                            const Icon = Icons[item.icon];
                            const active = isActive(item.path);
                            if (item.locked) {
                                return (
                                    <li key={item.path}>
                                        <div
                                            title="Certificates will be available after completing all modules"
                                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-300 cursor-not-allowed select-none"
                                        >
                                            {Icon && <Icon className="shrink-0 text-gray-300" style={{ width: '1.1rem', height: '1.1rem' }} />}
                                            <span>{item.label}</span>
                                            <Icons.Lock className="ml-auto w-3 h-3 text-gray-300" />
                                        </div>
                                    </li>
                                );
                            }
                            return (
                                <li key={item.path}>
                                    <button
                                        onClick={() => router.push(item.path)}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm group ${
                                            active
                                                ? 'bg-[#021d49]/8 text-[#021d49] font-semibold'
                                                : 'text-gray-600 hover:bg-blue-50 hover:text-[#021d49]'
                                        }`}
                                    >
                                        {Icon && (
                                            <Icon className={`w-4.5 h-4.5 shrink-0 transition-colors ${
                                                active ? 'text-[#021d49]' : 'text-gray-400 group-hover:text-[#021d49]'
                                            }`} style={{ width: '1.1rem', height: '1.1rem' }} />
                                        )}
                                        <span>{item.label}</span>
                                        {active && (
                                            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#021d49]" />
                                        )}
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                {/* Logout */}
                <div className="px-3 py-3 border-t border-gray-100">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors text-sm font-medium group"
                    >
                        <Icons.LogOut className="shrink-0" style={{ width: '1.1rem', height: '1.1rem' }} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* ── Photo Edit Modal ── */}
            {showPhotoModal && (
                <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                            <h3 className="text-base font-semibold text-gray-900">Edit Profile Photo</h3>
                            <button onClick={() => setShowPhotoModal(false)} className="text-gray-400 hover:text-gray-600">
                                <Icons.X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-5">
                            <div className="flex justify-center mb-5">
                                {currentUser?.profilePhotoUrl ? (
                                    <img src={currentUser.profilePhotoUrl} alt="" className="w-28 h-28 rounded-full object-cover border-4 border-[#021d49]/20" />
                                ) : (
                                    <div className="w-28 h-28 rounded-full bg-gradient-to-br from-[#021d49] to-[#1e40af] flex items-center justify-center text-white font-bold text-4xl">
                                        {getInitials()}
                                    </div>
                                )}
                            </div>
                            <div className="space-y-2.5">
                                <label className="w-full bg-[#021d49] hover:bg-[#032a66] text-white py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer text-sm">
                                    <Icons.Upload className="w-4 h-4" />
                                    {uploadingPhoto ? 'Uploading…' : 'Upload New Photo'}
                                    <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" disabled={uploadingPhoto} />
                                </label>
                                {currentUser?.profilePhotoUrl && (
                                    <button onClick={handleRemovePhoto} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm">
                                        <Icons.Trash2 className="w-4 h-4" />
                                        Remove Photo
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Mobile Bottom Navigation ── */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50 safe-area-inset-bottom">
                <div className="grid grid-cols-5 px-1 py-1">
                    {[
                        { icon: 'LayoutDashboard', label: 'Home',     path: '/student'                },
                        { icon: 'BookOpen',         label: 'Modules',  path: '/student/modules'        },
                        { icon: 'Trophy',           label: 'Achieve',  path: '/student/achievements'   },
                        { icon: 'Award',            label: 'Certs',    path: '/student/certificates', locked: true },
                        { icon: 'Settings',         label: 'Settings', path: '/student/account-settings' },
                    ].map(({ icon, label, path, locked }) => {
                        const Icon = Icons[icon];
                        const active = isActive(path);
                        if (locked) {
                            return (
                                <div key={path} className="flex flex-col items-center gap-0.5 py-2 px-1 rounded-xl text-gray-300 cursor-not-allowed select-none relative">
                                    <Icon className="w-5 h-5" />
                                    <span className="text-[10px] font-medium">{label}</span>
                                    <Icons.Lock className="absolute top-1 right-1 w-2.5 h-2.5" />
                                </div>
                            );
                        }
                        return (
                            <button
                                key={path}
                                onClick={() => router.push(path)}
                                className={`flex flex-col items-center gap-0.5 py-2 px-1 rounded-xl transition-colors ${
                                    active ? 'text-[#021d49]' : 'text-gray-400 hover:text-[#021d49]'
                                }`}
                            >
                                <Icon className="w-5 h-5" />
                                <span className={`text-[10px] font-medium ${active ? 'text-[#021d49]' : ''}`}>{label}</span>
                                {active && <span className="w-1 h-1 rounded-full bg-[#021d49]" />}
                            </button>
                        );
                    })}
                </div>
            </div>
        </>
    );
}
