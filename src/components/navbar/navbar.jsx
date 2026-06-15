"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, X, Trophy, LayoutDashboard, Award, Settings, LogOut, Play } from 'lucide-react';
import authService from '@/lib/api/authService';
import moduleEnrollmentService from '@/lib/api/moduleEnrollmentService';
import NotificationBell from '@/components/shared/NotificationBell';

const Navbar = () => {
    const router = useRouter();
    const [mounted, setMounted] = useState(false); // Fix hydration
    const [isOpen, setIsOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [userRole, setUserRole] = useState('student');
    const [currentUser, setCurrentUser] = useState(null);

    // Set mounted to true on client-side only
    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return; // Only run on client after mount

        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [mounted]);

    // Load user from cookies on mount
    useEffect(() => {
        if (!mounted) return; // Only run on client after mount

        const loadUserData = () => {
            try {
                const user = authService.getCurrentUser();

                if (user) {
                    setCurrentUser(user);
                    setIsLoggedIn(true);
                    setUserRole(user.role || 'student');
                } else {
                    setIsLoggedIn(false);
                    setCurrentUser(null);
                }
            } catch (error) {
                console.error('Error loading user data:', error);
                setIsLoggedIn(false);
            }
        };

        loadUserData();

        // Re-read user whenever a profile update is dispatched (e.g. photo change from sidebar)
        const handleProfileUpdate = () => loadUserData();
        window.addEventListener('userProfileUpdated', handleProfileUpdate);
        return () => window.removeEventListener('userProfileUpdated', handleProfileUpdate);
    }, [mounted]);

    useEffect(() => {
        if (!mounted) return; // Only run on client after mount

        const handleClickOutside = (e) => {
            if (showProfileMenu && !e.target.closest('.profile-menu')) {
                setShowProfileMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showProfileMenu, mounted]);

    const getInitials = () => {
        if (currentUser) {
            const full =
                currentUser.fullName ||
                `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim();
            const parts = full.trim().split(' ').filter(Boolean);
            if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
            if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
        }
        return 'U';
    };

    const getFullName = () => {
        if (currentUser) {
            return (
                currentUser.fullName ||
                `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() ||
                'User'
            );
        }
        return 'User';
    };

    const calculateProfileCompletion = () => {
        if (!currentUser) return 0;
        const hasName = !!(currentUser.fullName || currentUser.firstName || currentUser.lastName);
        const hasRegion = !!(currentUser.region || currentUser.fellowData?.region);
        const hasPhoto = !!currentUser.profilePhotoUrl;
        return (hasName && hasRegion && hasPhoto) ? 100 : 0;
    };

    const navLinks = [
        { name: 'Home', href: '/' },
        { name: 'About', href: '/about' },
        { name: 'Publishing Academy', href: '/arin-publishing-academy' },
        { name: 'AI For Climate Resilience', href: '/ai-climate-resilience' },
        { name: 'Modules', href: '/modules' },
        { name: 'Contact', href: '#contact' }
    ];

    const handleLogout = () => {
        // Mark that we're logging out to prevent redirect loops
        if (typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem('isLoggingOut', 'true');
        }

        // Clear cookies immediately (synchronous)
        authService.logout();
        setIsLoggedIn(false);
        setCurrentUser(null);
        setShowProfileMenu(false);

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

    const handleDashboardClick = () => {
        setShowProfileMenu(false);

        // Redirect based on user role
        if (currentUser?.role === 'student') {
            router.push('/student');
        } else if (currentUser?.role === 'instructor') {
            router.push('/instructor');
        } else if (currentUser?.role === 'admin') {
            router.push('/admin');
        } else {
            // Fallback to home if role is unknown
            router.push('/');
        }
    };

    const handleContinueLearning = async () => {
        try {
            console.log('[ContinueLearning] Navbar button clicked — fetching enrollments...');
            const enrollments = await moduleEnrollmentService.getMyEnrollments();
            const list = Array.isArray(enrollments) ? enrollments : enrollments?.enrollments || [];

            const inProgress = list.find(e => !e.isCompleted);
            if (!inProgress) {
                console.log('[ContinueLearning] No in-progress module found — redirecting to modules list');
                router.push('/student/modules');
                return;
            }

            const moduleId = inProgress.moduleId?._id || inProgress.moduleId;
            const enrollmentId = inProgress._id;

            console.log('[ContinueLearning] Found in-progress module | moduleId=', moduleId, '| enrollmentId=', enrollmentId);

            // Fetch exact resume position from backend (lesson + slide).
            // currentLessonIndex can be null when the next lesson is locked or all
            // lessons are done — in that case walk lessonStates to find the last
            // accessible/completed lesson rather than falling back to 0 (Lesson 1).
            const progress = await moduleEnrollmentService.getProgress(enrollmentId);

            // currentLessonIndex from the backend is null when the next lesson is locked
            // (e.g. previous lesson's quiz hasn't been passed) OR when all lessons are done.
            // In the locked case we should still return the student to where they WERE,
            // not silently fall back to lesson 0 / the last completed lesson.
            // Strategy:
            //  - Use currentLessonIndex if the backend provided one
            //  - Otherwise scan lessonStates from the end: prefer lessons with any slide
            //    history (lastAccessedSlide > 0) even if currently locked, then fall back
            //    to last accessible/completed, then absolute fallback 0.
            let lessonIndex = progress?.currentLessonIndex;
            if (lessonIndex == null) {
                const states = progress?.lessonStates || [];
                // Pass 1: find last lesson the student actively visited (slide > 0)
                for (let i = states.length - 1; i >= 0; i--) {
                    if ((states[i]?.lastAccessedSlide ?? 0) > 0) {
                        lessonIndex = i;
                        break;
                    }
                }
                // Pass 2: fall back to last accessible or completed lesson
                if (lessonIndex == null) {
                    for (let i = states.length - 1; i >= 0; i--) {
                        if (states[i]?.isAccessible || states[i]?.isCompleted) {
                            lessonIndex = i;
                            break;
                        }
                    }
                }
                lessonIndex = lessonIndex ?? 0;
            }

            console.log(
                '[ContinueLearning] Navbar | resuming to | lessonIndex=', lessonIndex,
                '| currentLessonIndex (raw)=', progress?.currentLessonIndex,
                '| nextLessonIndex=', progress?.nextLessonIndex,
                '| url=', `/student/modules/${moduleId}?lesson=${lessonIndex}`,
            );

            router.push(`/student/modules/${moduleId}?lesson=${lessonIndex}`);
        } catch (error) {
            console.error('[ContinueLearning] Navbar failed:', error);
            router.push('/student/modules');
        }
    };

    const profileCompletion = calculateProfileCompletion();

    const closeMobile = () => setIsOpen(false);

    return (
        <>
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white shadow-lg' : 'bg-white shadow-md'}`}>
                <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16 sm:h-20">

                        {/* ── Logo ── */}
                        <div className="flex-shrink-0">
                            <a href="/" className="flex items-center gap-2">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-white rounded-lg shadow-md border-2 border-[#021d49] p-1">
                                    <img src="/Arin.png" alt="ARIN Logo" className="w-full h-full object-contain" />
                                </div>
                                <div className="hidden sm:flex flex-col">
                                    <span className="font-bold text-lg sm:text-xl leading-tight">
                                        <span className="text-[#021d49]">E</span>
                                        <span className="text-gray-800">-</span>
                                        <span className="text-[#1e40af]">L</span>
                                        <span className="text-gray-800">earning </span>
                                        <span className="text-[#16a34a]">P</span>
                                        <span className="text-gray-800">latform</span>
                                    </span>
                                </div>
                            </a>
                        </div>

                        {/* ── Desktop nav links (lg+) ── */}
                        <div className="hidden lg:flex items-center space-x-5 xl:space-x-6">
                            {navLinks.map((link) => (
                                <a key={link.name} href={link.href}
                                    className="text-gray-700 hover:text-[#021d49] font-medium text-sm transition-colors duration-200 relative group px-1 py-1 whitespace-nowrap">
                                    {link.name}
                                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#021d49] group-hover:w-full transition-all duration-300" />
                                </a>
                            ))}
                        </div>

                        {/* ── Desktop right actions (lg+) ── */}
                        <div className="hidden lg:flex items-center gap-2 xl:gap-3">
                            {!mounted ? (
                                <div className="flex items-center gap-3">
                                    <div className="h-9 w-28 bg-gray-200 rounded-lg animate-pulse" />
                                    <div className="h-9 w-9 bg-gray-200 rounded-full animate-pulse" />
                                </div>
                            ) : isLoggedIn ? (
                                <>
                                    {userRole === 'student' && (
                                        <button onClick={handleContinueLearning}
                                            className="flex items-center gap-1.5 bg-[#1e40af] hover:bg-[#1a35a0] text-white font-medium px-3 py-2 rounded-lg transition-all text-sm shadow-sm hover:shadow-md whitespace-nowrap">
                                            <Play size={15} />
                                            <span className="hidden xl:inline">Continue Learning</span>
                                            <span className="xl:hidden">Continue</span>
                                        </button>
                                    )}

                                    <button onClick={handleDashboardClick}
                                        className="flex items-center gap-1.5 text-gray-700 hover:text-[#021d49] font-medium px-3 py-2 rounded-lg hover:bg-blue-50 transition-all text-sm border border-gray-200 hover:border-[#021d49] whitespace-nowrap">
                                        <LayoutDashboard size={15} />
                                        <span className="hidden xl:inline">
                                            {userRole === 'instructor' ? 'Instructor Dashboard' : userRole === 'admin' ? 'Admin Dashboard' : 'My Dashboard'}
                                        </span>
                                        <span className="xl:hidden">Dashboard</span>
                                    </button>

                                    {userRole !== 'admin' && <NotificationBell />}

                                    <div className="relative profile-menu">
                                        <button onClick={() => setShowProfileMenu(!showProfileMenu)}
                                            className="flex items-center gap-2 p-1.5 hover:bg-blue-50 rounded-lg transition-all">
                                            {currentUser?.profilePhotoUrl ? (
                                                <img src={currentUser.profilePhotoUrl} alt={getFullName()}
                                                    className="w-9 h-9 rounded-full object-cover border-2 border-[#021d49]" />
                                            ) : (
                                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#021d49] to-[#1e40af] flex items-center justify-center text-white font-bold text-sm">
                                                    {getInitials()}
                                                </div>
                                            )}
                                            <span className="text-gray-700 font-medium text-sm hidden xl:inline max-w-[120px] truncate">{getFullName()}</span>
                                        </button>

                                        {showProfileMenu && (
                                            <div className="absolute right-0 mt-2 w-72 xl:w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 py-4 animate-fadeIn">
                                                <div className="px-5 pb-4 border-b border-gray-200">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        {currentUser?.profilePhotoUrl ? (
                                                            <img src={currentUser.profilePhotoUrl} alt={getFullName()}
                                                                className="w-14 h-14 rounded-full object-cover border-2 border-[#021d49]" />
                                                        ) : (
                                                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#021d49] to-[#1e40af] flex items-center justify-center text-white font-bold text-lg">
                                                                {getInitials()}
                                                            </div>
                                                        )}
                                                        <div className="min-w-0">
                                                            <h3 className="font-bold text-gray-900 truncate">{getFullName()}</h3>
                                                            <p className="text-sm text-gray-500 truncate">{currentUser?.email}</p>
                                                        </div>
                                                    </div>

                                                    {profileCompletion < 100 && (
                                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                                                            <div className="flex items-center justify-between mb-1.5">
                                                                <span className="text-sm font-semibold text-gray-700">Finish Your Profile</span>
                                                                <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full font-bold">New</span>
                                                            </div>
                                                            <div className="w-full bg-gray-200 rounded-full h-1.5 mb-1">
                                                                <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${profileCompletion}%` }} />
                                                            </div>
                                                            <span className="text-xs text-blue-600 font-medium">{profileCompletion}% Complete</span>
                                                        </div>
                                                    )}

                                                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-[#021d49]/20 rounded-lg p-3">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-7 h-7 rounded-full bg-yellow-400 flex items-center justify-center">
                                                                    <span className="text-base">💎</span>
                                                                </div>
                                                                <span className="text-sm font-semibold text-gray-700">XP</span>
                                                            </div>
                                                            <span className="text-2xl font-black text-[#021d49]">{currentUser?.totalPoints || 0}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="py-1">
                                                    {userRole === 'student' && (
                                                        <>
                                                            <button onClick={() => setShowProfileMenu(false)}
                                                                className="w-full px-5 py-2.5 flex items-center gap-3 hover:bg-blue-50 transition-colors text-left">
                                                                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                                                                    <Award className="w-4 h-4 text-purple-600" />
                                                                </div>
                                                                <span className="font-medium text-gray-700 text-sm">Claim Your Certificates</span>
                                                            </button>
                                                            <button onClick={() => setShowProfileMenu(false)}
                                                                className="w-full px-5 py-2.5 flex items-center gap-3 hover:bg-blue-50 transition-colors text-left">
                                                                <div className="w-8 h-8 rounded-lg bg-[#021d49] flex items-center justify-center flex-shrink-0">
                                                                    <Trophy className="w-4 h-4 text-white" />
                                                                </div>
                                                                <span className="font-medium text-gray-700 text-sm">Your Achievements</span>
                                                            </button>
                                                        </>
                                                    )}
                                                    <button onClick={handleDashboardClick}
                                                        className="w-full px-5 py-2.5 flex items-center gap-3 hover:bg-blue-50 transition-colors text-left">
                                                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                                                            <LayoutDashboard className="w-4 h-4 text-blue-600" />
                                                        </div>
                                                        <span className="font-medium text-gray-700 text-sm">
                                                            {userRole === 'instructor' ? 'Instructor Dashboard' : userRole === 'admin' ? 'Admin Dashboard' : 'Your Dashboard'}
                                                        </span>
                                                    </button>
                                                    <button onClick={() => setShowProfileMenu(false)}
                                                        className="w-full px-5 py-2.5 flex items-center gap-3 hover:bg-blue-50 transition-colors text-left">
                                                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                                                            <Settings className="w-4 h-4 text-gray-600" />
                                                        </div>
                                                        <span className="font-medium text-gray-700 text-sm">Account Settings</span>
                                                    </button>
                                                </div>

                                                <div className="pt-1 border-t border-gray-100">
                                                    <button onClick={handleLogout}
                                                        className="w-full px-5 py-2.5 flex items-center gap-3 hover:bg-red-50 transition-colors text-left">
                                                        <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                                                            <LogOut className="w-4 h-4 text-red-600" />
                                                        </div>
                                                        <span className="font-medium text-red-600 text-sm">Logout</span>
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <>
                                    <a href="/login"
                                        className="text-gray-700 hover:text-[#021d49] font-medium px-3 py-2 rounded-lg hover:bg-blue-50 transition-all text-sm">
                                        Sign In
                                    </a>
                                    <a href="/register"
                                        className="bg-[#021d49] hover:bg-[#03275f] text-white px-5 py-2 rounded-lg font-medium transition-all text-sm shadow-md hover:shadow-lg whitespace-nowrap">
                                        Join Now
                                    </a>
                                </>
                            )}
                        </div>

                        {/* ── Mobile/Tablet: right side compact actions + hamburger ── */}
                        <div className="flex lg:hidden items-center gap-2">
                            {mounted && isLoggedIn && userRole !== 'admin' && <NotificationBell />}
                            {mounted && isLoggedIn && (
                                <div className="flex items-center">
                                    {currentUser?.profilePhotoUrl ? (
                                        <img src={currentUser.profilePhotoUrl} alt={getFullName()}
                                            className="w-8 h-8 rounded-full object-cover border-2 border-[#021d49]" />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#021d49] to-[#1e40af] flex items-center justify-center text-white font-bold text-xs">
                                            {getInitials()}
                                        </div>
                                    )}
                                </div>
                            )}
                            <button onClick={() => setIsOpen(!isOpen)}
                                className="p-2 text-gray-700 hover:text-[#021d49] hover:bg-gray-100 rounded-lg transition-all">
                                {isOpen ? <X size={22} /> : <Menu size={22} />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── Mobile / Tablet slide-down menu ── */}
                <div className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="bg-white border-t border-gray-100 shadow-lg">
                        <div className="px-4 py-4 max-h-[80vh] overflow-y-auto">

                            {/* User info strip (logged in) */}
                            {mounted && isLoggedIn && (
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl mb-4">
                                    {currentUser?.profilePhotoUrl ? (
                                        <img src={currentUser.profilePhotoUrl} alt={getFullName()}
                                            className="w-10 h-10 rounded-full object-cover border-2 border-[#021d49] flex-shrink-0" />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#021d49] to-[#1e40af] flex items-center justify-center text-white font-bold flex-shrink-0">
                                            {getInitials()}
                                        </div>
                                    )}
                                    <div className="min-w-0">
                                        <p className="font-semibold text-gray-900 text-sm truncate">{getFullName()}</p>
                                        <p className="text-xs text-gray-500 truncate">{currentUser?.email}</p>
                                    </div>
                                    <div className="ml-auto flex items-center gap-1 bg-[#021d49]/5 px-2 py-1 rounded-lg">
                                        <span className="text-xs">💎</span>
                                        <span className="text-xs font-bold text-[#021d49]">{currentUser?.totalPoints || 0}</span>
                                    </div>
                                </div>
                            )}

                            {/* Nav links */}
                            <div className="space-y-1 mb-4">
                                {navLinks.map((link) => (
                                    <a key={link.name} href={link.href} onClick={closeMobile}
                                        className="flex items-center text-gray-700 hover:text-[#021d49] hover:bg-blue-50 font-medium py-2.5 px-3 rounded-lg transition-colors text-sm">
                                        {link.name}
                                    </a>
                                ))}
                            </div>

                            {/* Logged-in actions */}
                            {mounted && isLoggedIn ? (
                                <div className="border-t border-gray-100 pt-4 space-y-1">
                                    {userRole === 'student' && (
                                        <button onClick={() => { handleContinueLearning(); closeMobile(); }}
                                            className="w-full flex items-center gap-3 bg-[#1e40af] hover:bg-[#1a35a0] text-white font-medium px-3 py-2.5 rounded-xl transition-all text-sm mb-3">
                                            <Play size={16} className="flex-shrink-0" />
                                            Continue Learning
                                        </button>
                                    )}
                                    <button onClick={() => { handleDashboardClick(); closeMobile(); }}
                                        className="w-full flex items-center gap-3 text-gray-700 hover:bg-blue-50 px-3 py-2.5 rounded-xl transition-colors text-sm">
                                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                                            <LayoutDashboard className="w-4 h-4 text-blue-600" />
                                        </div>
                                        <span className="font-medium">
                                            {userRole === 'instructor' ? 'Instructor Dashboard' : userRole === 'admin' ? 'Admin Dashboard' : 'My Dashboard'}
                                        </span>
                                    </button>
                                    {userRole === 'student' && (
                                        <>
                                            <button onClick={() => { setShowProfileMenu(false); closeMobile(); }}
                                                className="w-full flex items-center gap-3 text-gray-700 hover:bg-blue-50 px-3 py-2.5 rounded-xl transition-colors text-sm">
                                                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                                                    <Award className="w-4 h-4 text-purple-600" />
                                                </div>
                                                <span className="font-medium">Certificates</span>
                                            </button>
                                            <button onClick={() => { setShowProfileMenu(false); closeMobile(); }}
                                                className="w-full flex items-center gap-3 text-gray-700 hover:bg-blue-50 px-3 py-2.5 rounded-xl transition-colors text-sm">
                                                <div className="w-8 h-8 rounded-lg bg-[#021d49] flex items-center justify-center flex-shrink-0">
                                                    <Trophy className="w-4 h-4 text-white" />
                                                </div>
                                                <span className="font-medium">Achievements</span>
                                            </button>
                                        </>
                                    )}
                                    <button onClick={() => { setShowProfileMenu(false); closeMobile(); }}
                                        className="w-full flex items-center gap-3 text-gray-700 hover:bg-blue-50 px-3 py-2.5 rounded-xl transition-colors text-sm">
                                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                                            <Settings className="w-4 h-4 text-gray-600" />
                                        </div>
                                        <span className="font-medium">Account Settings</span>
                                    </button>
                                    <button onClick={() => { handleLogout(); closeMobile(); }}
                                        className="w-full flex items-center gap-3 text-red-600 hover:bg-red-50 px-3 py-2.5 rounded-xl transition-colors text-sm">
                                        <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                                            <LogOut className="w-4 h-4 text-red-600" />
                                        </div>
                                        <span className="font-medium">Logout</span>
                                    </button>
                                </div>
                            ) : mounted && !isLoggedIn ? (
                                <div className="border-t border-gray-100 pt-4 grid grid-cols-2 gap-3">
                                    <a href="/login" onClick={closeMobile}
                                        className="text-center text-gray-700 hover:text-[#021d49] font-medium px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-blue-50 transition-all text-sm">
                                        Sign In
                                    </a>
                                    <a href="/register" onClick={closeMobile}
                                        className="text-center bg-[#021d49] hover:bg-[#03275f] text-white px-4 py-2.5 rounded-xl font-medium transition-all text-sm">
                                        Join Now
                                    </a>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            </nav>

            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-8px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn { animation: fadeIn 0.18s ease-out; }
            `}</style>
        </>
    );
};

export default Navbar;