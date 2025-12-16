"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Menu, X, Search, User, Trophy, LayoutDashboard, Award, Settings, LogOut, BookOpen, ChevronDown } from 'lucide-react';
import authService from '@/lib/api/authService';
import courseService from '@/lib/api/courseService';

const Navbar = () => {
    const router = useRouter();
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [userRole, setUserRole] = useState('student');
    const [currentUser, setCurrentUser] = useState(null);
    const [studentData, setStudentData] = useState(null);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (isSearchOpen && !e.target.closest('.search-container')) {
                setIsSearchOpen(false);
            }
            if (showProfileMenu && !e.target.closest('.profile-menu')) {
                setShowProfileMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isSearchOpen, showProfileMenu]);

    // Check authentication and load user data
    useEffect(() => {
        checkAuth();
    }, [pathname]);

    const checkAuth = async () => {
        try {
            const user = authService.getCurrentUser();
            const isDashboard = pathname?.startsWith('/student') ||
                pathname?.startsWith('/instructor') ||
                pathname?.startsWith('/admin');

            if (user) {
                setCurrentUser(user);
                setIsLoggedIn(true);
                setUserRole(user.role);

                // Load student-specific data from API
                if (user.role === 'student') {
                    try {
                        const enrollments = await courseService.getStudentEnrollments();
                        setStudentData(enrollments);
                    } catch (error) {
                        console.error('Error fetching enrollments:', error);
                        setStudentData([]);
                    }
                }
            } else if (isDashboard) {
                // User is on dashboard but not logged in - redirect
                router.push('/');
            } else {
                setIsLoggedIn(false);
                setCurrentUser(null);
            }
        } catch (error) {
            console.error('Auth check error:', error);
            setIsLoggedIn(false);
            setCurrentUser(null);
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

    const navLinks = [
        { name: 'Home', href: '/' },
        { name: 'About', href: '#about' },
        { name: 'Courses', href: '/courses' },
        { name: 'Community', href: '#community' },
        { name: 'Contact', href: '#contact' }
    ];

    const handleLoginSuccess = async (user) => {
        setCurrentUser(user);
        setIsLoggedIn(true);
        setUserRole(user.role);

        if (user.role === 'student') {
            try {
                const enrollments = await courseService.getStudentEnrollments();
                setStudentData(enrollments);
            } catch (error) {
                console.error('Error fetching enrollments:', error);
                setStudentData([]);
            }
        }
    };

    const handleLogout = () => {
        authService.logout();
        setIsLoggedIn(false);
        setCurrentUser(null);
        setStudentData(null);
        setShowProfileMenu(false);
        router.push('/');
    };

    const handleContinueLearning = () => {
        // studentData is now an array of enrollments from the backend
        if (studentData && Array.isArray(studentData) && studentData.length > 0) {
            // Get the first enrollment (most recently accessed due to sorting by lastAccessedAt)
            const firstEnrollment = studentData[0];

            // Use the lastAccessedModule and lastAccessedLesson from the enrollment
            const courseId = firstEnrollment.courseId._id || firstEnrollment.courseId;
            const moduleIndex = firstEnrollment.lastAccessedModule || 0;
            const lessonIndex = firstEnrollment.lastAccessedLesson || 0;

            router.push(`/courses/${courseId}/learn/${moduleIndex}/${lessonIndex}`);
        } else {
            router.push('/courses');
        }
    };

    const profileCompletion = calculateProfileCompletion();

    return (
        <>
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white shadow-lg' : 'bg-white shadow-md'}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16 md:h-20">
                        <div className="flex-shrink-0">
                            <Link href="/" className="flex items-center gap-3">
                                <div className="relative w-14 h-14 flex items-center justify-center bg-white rounded-xl shadow-lg border-2 border-orange-400 p-1">
                                    <img 
                                        src="/Arin.png" 
                                        alt="Logo" 
                                        className="w-full h-full object-contain" 
                                    />
                                </div>
                                                              <div className="hidden sm:flex flex-col">
                                    <span className="font-bold text-2xl">
                                        <span className="text-gray-800">ARIN </span>
                                        <span className="text-[#f65e14]">E</span>
                                        <span className="text-gray-800">-</span>
                                        <span className="text-[#1e40af]">L</span>
                                        <span className="text-gray-800">earning </span>
                                        <span className="text-[#16a34a]">P</span>
                                        <span className="text-gray-800">latform</span>
                                    </span>
                                </div>
                            </Link>
                        </div>

                        <div className="hidden lg:flex items-center space-x-8">
                            {navLinks.map((link) => (
                                <a
                                    key={link.name}
                                    href={link.href}
                                    className="text-gray-700 hover:text-[#f65e14] font-medium transition-colors duration-200 relative group"
                                >
                                    {link.name}
                                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#f65e14] group-hover:w-full transition-all duration-300"></span>
                                </a>
                            ))}
                        </div>

                        <div className="hidden lg:flex items-center space-x-4">
                            <button
                                onClick={() => setIsSearchOpen(!isSearchOpen)}
                                className="p-2 text-gray-700 hover:text-[#f65e14] hover:bg-orange-50 rounded-lg transition-all duration-200"
                            >
                                <Search size={22} />
                            </button>

                            {isLoggedIn ? (
                                <>
                                    {userRole === 'student' && (
                                        <button
                                            onClick={handleContinueLearning}
                                            className="flex items-center gap-2 text-gray-700 hover:text-[#16a34a] font-medium px-4 py-2 rounded-lg hover:bg-green-50 transition-all duration-200 border-2 border-green-500"
                                        >
                                            <BookOpen size={20} className="text-green-600" />
                                            Continue Learning
                                        </button>
                                    )}

                                    <div className="relative profile-menu">
                                        <button
                                            onClick={() => setShowProfileMenu(!showProfileMenu)}
                                            className="flex items-center gap-2 p-2 hover:bg-orange-50 rounded-lg transition-all duration-200"
                                        >
                                            {currentUser?.profilePhotoUrl ? (
                                                <img
                                                    src={currentUser.profilePhotoUrl}
                                                    alt={getFullName()}
                                                    className="w-10 h-10 rounded-full object-cover border-2 border-orange-400"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white font-bold">
                                                    {getInitials()}
                                                </div>
                                            )}
                                        </button>

                                        {showProfileMenu && (
                                            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border-2 border-gray-100 py-4 animate-fadeIn">
                                                <div className="px-6 pb-4 border-b border-gray-200">
                                                    <div className="flex items-center gap-4 mb-3">
                                                        {currentUser?.profilePhotoUrl ? (
                                                            <img
                                                                src={currentUser.profilePhotoUrl}
                                                                alt={getFullName()}
                                                                className="w-16 h-16 rounded-full object-cover border-2 border-orange-400"
                                                            />
                                                        ) : (
                                                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white font-bold text-xl">
                                                                {getInitials()}
                                                            </div>
                                                        )}
                                                        <div>
                                                            <h3 className="font-bold text-gray-900 text-lg">{getFullName()}</h3>
                                                            <p className="text-sm text-gray-500">{currentUser?.email}</p>
                                                        </div>
                                                    </div>

                                                    {profileCompletion < 100 && (
                                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <span className="text-sm font-semibold text-gray-700">Finish Your Profile</span>
                                                                <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full font-bold">New</span>
                                                            </div>
                                                            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                                                                <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${profileCompletion}%` }}></div>
                                                            </div>
                                                            <span className="text-xs text-blue-600 font-medium">{profileCompletion}% Complete</span>
                                                        </div>
                                                    )}

                                                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-orange-200 rounded-lg p-3">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center">
                                                                    <span className="text-xl">💎</span>
                                                                </div>
                                                                <span className="text-sm font-semibold text-gray-700">XP</span>
                                                            </div>
                                                            <span className="text-2xl font-black text-orange-600">
                                                                {currentUser?.totalPoints || 0}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="py-2">
                                                    {userRole === 'student' && (
                                                        <>
                                                            <button
                                                                onClick={() => {
                                                                    router.push('/student/certificates');
                                                                    setShowProfileMenu(false);
                                                                }}
                                                                className="w-full px-6 py-3 flex items-center gap-3 hover:bg-orange-50 transition-colors text-left"
                                                            >
                                                                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                                                                    <Award className="w-5 h-5 text-purple-600" />
                                                                </div>
                                                                <span className="font-medium text-gray-700">Claim Your Certificates</span>
                                                            </button>

                                                            <button
                                                                onClick={() => {
                                                                    router.push('/student/achievements');
                                                                    setShowProfileMenu(false);
                                                                }}
                                                                className="w-full px-6 py-3 flex items-center gap-3 hover:bg-orange-50 transition-colors text-left"
                                                            >
                                                                <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                                                                    <Trophy className="w-5 h-5 text-orange-600" />
                                                                </div>
                                                                <span className="font-medium text-gray-700">Your Achievements</span>
                                                            </button>
                                                        </>
                                                    )}

                                                    <button
                                                        onClick={() => {
                                                            const dashboardPath = userRole === 'student' ? '/student' :
                                                                userRole === 'instructor' ? '/instructor' : '/admin';
                                                            router.push(dashboardPath);
                                                            setShowProfileMenu(false);
                                                        }}
                                                        className="w-full px-6 py-3 flex items-center gap-3 hover:bg-orange-50 transition-colors text-left"
                                                    >
                                                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                                                            <LayoutDashboard className="w-5 h-5 text-blue-600" />
                                                        </div>
                                                        <span className="font-medium text-gray-700">Your Dashboard</span>
                                                    </button>

                                                    <button
                                                        onClick={() => {
                                                            router.push(`/${userRole}/settings`);
                                                            setShowProfileMenu(false);
                                                        }}
                                                        className="w-full px-6 py-3 flex items-center gap-3 hover:bg-orange-50 transition-colors text-left"
                                                    >
                                                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                                                            <Settings className="w-5 h-5 text-gray-600" />
                                                        </div>
                                                        <span className="font-medium text-gray-700">Account Settings</span>
                                                    </button>
                                                </div>

                                                <div className="pt-2 border-t border-gray-200">
                                                    <button
                                                        onClick={handleLogout}
                                                        className="w-full px-6 py-3 flex items-center gap-3 hover:bg-red-50 transition-colors text-left text-red-600"
                                                    >
                                                        <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                                                            <LogOut className="w-5 h-5 text-red-600" />
                                                        </div>
                                                        <span className="font-medium">Logout</span>
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <>
                                    <Link
                                        href="/login"
                                        className="text-gray-700 hover:text-[#f65e14] font-medium px-4 py-2 rounded-lg hover:bg-orange-50 transition-all duration-200"
                                    >
                                        Sign In
                                    </Link>

                                    <Link
                                        href="/register"
                                        className="bg-[#f65e14] hover:bg-[#e54d03] text-white px-6 py-2.5 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg"
                                    >
                                        Join Now
                                    </Link>
                                </>
                            )}
                        </div>

                        <div className="flex lg:hidden items-center space-x-2">
                            <button
                                onClick={() => setIsSearchOpen(!isSearchOpen)}
                                className="p-2 text-gray-700 hover:text-[#f65e14] transition-colors duration-200"
                            >
                                <Search size={22} />
                            </button>
                            <button
                                onClick={() => setIsOpen(!isOpen)}
                                className="text-gray-700 hover:text-[#f65e14] focus:outline-none transition-colors duration-200"
                            >
                                {isOpen ? <X size={28} /> : <Menu size={28} />}
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <style jsx>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.2s ease-out;
                }
            `}</style>
        </>
    );
};

export default Navbar;