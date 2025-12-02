"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Menu, X, Search, User, Trophy, LayoutDashboard, Award, Settings, LogOut, BookOpen, ChevronDown } from 'lucide-react';
import LoginModal from '@/app/(auth)/login/page';
import RegisterModal from '@/app/(auth)/register/page';
import { getStudentProgress, getLastAccessedLesson } from '@/data/courses/courses';

const Navbar = () => {
    const router = useRouter();
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [userRole, setUserRole] = useState('student');
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

    // Check if user is logged in
    useEffect(() => {
        const checkAuth = () => {
            const isDashboard = pathname?.startsWith('/student') ||
                pathname?.startsWith('/instructor') ||
                pathname?.startsWith('/admin');
            setIsLoggedIn(isDashboard);

            if (pathname?.startsWith('/student')) {
                setUserRole('student');
                // Load student data
                const data = getStudentProgress();
                setStudentData(data);
            } else if (pathname?.startsWith('/instructor')) {
                setUserRole('instructor');
            } else if (pathname?.startsWith('/admin')) {
                setUserRole('admin');
            }
        };
        checkAuth();
    }, [pathname]);

    const navLinks = [
        { name: 'Home', href: '/' },
        { name: 'About', href: '#about' },
        { name: 'Courses', href: '/courses' },
        { name: 'Community', href: '#community' },
        { name: 'Contact', href: '#contact' }
    ];

    const courseCategories = [
        { title: 'Courses', items: ['Free Courses', 'Certificated Courses'] },
        { title: 'Content', items: ['Business', 'Health', 'Leadership', 'Government', 'Data and Computer Science'] }
    ];

    const handleSwitchToRegister = () => {
        setShowLoginModal(false);
        setShowRegisterModal(true);
    };

    const handleSwitchToLogin = () => {
        setShowRegisterModal(false);
        setShowLoginModal(true);
    };

    const handleLogout = () => {
        setIsLoggedIn(false);
        setShowProfileMenu(false);
        router.push('/');
    };

    const handleContinueLearning = () => {
        // Get the first course in progress
        if (studentData && studentData.enrolledCourses.length > 0) {
            const firstCourse = studentData.enrolledCourses.find(ec => ec.status === 'in_progress');
            if (firstCourse) {
                const lastLesson = getLastAccessedLesson(firstCourse.courseId);
                router.push(`/courses/${firstCourse.courseId}/learn/${lastLesson.moduleId}/${lastLesson.lessonId}`);
            } else {
                // No courses in progress, go to courses page
                router.push('/courses');
            }
        } else {
            // No enrolled courses, go to courses page
            router.push('/courses');
        }
    };

    return (
        <>
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white shadow-lg' : 'bg-white shadow-md'
                }`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16 md:h-20">
                        <div className="flex-shrink-0">
                            <Link href="/" className="flex items-center gap-2">
                                <img src="/logo.png" alt="Arin Elearning Platform" className="w-10 h-10 rounded-lg object-cover" />
                                <div className="hidden sm:flex flex-col">
                                    <span className="font-bold text-xl text-gray-900">Arin Elearning Platform</span>
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

                                    {/* Profile Menu */}
                                    <div className="relative profile-menu">
                                        <button
                                            onClick={() => setShowProfileMenu(!showProfileMenu)}
                                            className="flex items-center gap-2 p-2 hover:bg-orange-50 rounded-lg transition-all duration-200"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white font-bold">
                                                FM
                                            </div>
                                        </button>

                                        {showProfileMenu && (
                                            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border-2 border-gray-100 py-4 animate-fadeIn">
                                                {/* Profile Header */}
                                                <div className="px-6 pb-4 border-b border-gray-200">
                                                    <div className="flex items-center gap-4 mb-3">
                                                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white font-bold text-xl">
                                                            FM
                                                        </div>
                                                        <div>
                                                            <h3 className="font-bold text-gray-900 text-lg">Faith Muiruri</h3>
                                                            <p className="text-sm text-gray-500">faith@example.com</p>
                                                        </div>
                                                    </div>

                                                    {/* Profile Completion */}
                                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="text-sm font-semibold text-gray-700">Finish Your Profile</span>
                                                            <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full font-bold">New</span>
                                                        </div>
                                                        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                                                            <div className="bg-blue-500 h-2 rounded-full" style={{ width: '0%' }}></div>
                                                        </div>
                                                        <span className="text-xs text-blue-600 font-medium">0% Complete</span>
                                                    </div>

                                                    {/* XP Points */}
                                                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-orange-200 rounded-lg p-3">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center">
                                                                    <span className="text-xl">💎</span>
                                                                </div>
                                                                <span className="text-sm font-semibold text-gray-700">XP</span>
                                                            </div>
                                                            <span className="text-2xl font-black text-orange-600">
                                                                {studentData?.totalXP || 310}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Menu Items */}
                                                <div className="py-2">
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
                                                            router.push('/student');
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

                                                    <button
                                                        onClick={() => {
                                                            router.push('/student/settings');
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

                                                {/* Logout */}
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
                                    <button
                                        onClick={() => setShowLoginModal(true)}
                                        className="text-gray-700 hover:text-[#f65e14] font-medium px-4 py-2 rounded-lg hover:bg-orange-50 transition-all duration-200"
                                    >
                                        Sign In
                                    </button>

                                    <button
                                        onClick={() => setShowRegisterModal(true)}
                                        className="bg-[#f65e14] hover:bg-[#e54d03] text-white px-6 py-2.5 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg"
                                    >
                                        Join Now
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Mobile menu button */}
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

                {/* Search Dropdown - Same as before */}
                <div
                    className={`search-container absolute top-full left-0 right-0 bg-white shadow-2xl transition-all duration-300 ease-in-out overflow-hidden ${isSearchOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
                        }`}
                >
                    {/* Search content */}
                </div>

                {/* Mobile Menu - Same as before */}
                <div
                    className={`lg:hidden transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
                        }`}
                >
                    {/* Mobile menu content */}
                </div>
            </nav>

            {/* Modals */}
            <LoginModal
                isOpen={showLoginModal}
                onClose={() => setShowLoginModal(false)}
                onSwitchToRegister={handleSwitchToRegister}
            />
            <RegisterModal
                isOpen={showRegisterModal}
                onClose={() => setShowRegisterModal(false)}
                onSwitchToLogin={handleSwitchToLogin}
            />

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