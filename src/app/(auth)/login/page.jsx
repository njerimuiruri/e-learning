'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Mail, Lock, AlertCircle, CheckCircle, ArrowLeft, BookOpen, GraduationCap, Award } from 'lucide-react';
import authService from '@/lib/api/authService';
import Navbar from '@/components/navbar/navbar';
import Footer from '@/components/Footer/Footer';

const Toast = ({ message, type, onClose }) => {
    const bgColor = type === 'success' ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500';
    const textColor = type === 'success' ? 'text-green-800' : 'text-red-800';
    const Icon = type === 'success' ? CheckCircle : AlertCircle;
    const iconColor = type === 'success' ? 'text-green-500' : 'text-red-500';

    return (
        <div className={`fixed top-6 right-6 z-[60] ${bgColor} border-l-4 rounded-lg shadow-2xl p-4 min-w-[320px] max-w-md animate-slideIn`}>
            <div className="flex items-start gap-3">
                <Icon className={`w-5 h-5 ${iconColor} flex-shrink-0 mt-0.5`} />
                <div className="flex-1">
                    <p className={`${textColor} font-medium text-sm`}>{message}</p>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectParam = searchParams.get('redirect');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [toast, setToast] = useState(null);
    const [showPasswordChangeModal, setShowPasswordChangeModal] = useState(false);
    const [passwordChangeData, setPasswordChangeData] = useState({
        newPassword: '',
        confirmPassword: '',
    });
    const [passwordChangeLoading, setPasswordChangeLoading] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [userDataForRedirect, setUserDataForRedirect] = useState(null);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        rememberMe: false,
    });

    useEffect(() => {
        // Clear the logout flag when entering login page
        if (typeof sessionStorage !== 'undefined') {
            sessionStorage.removeItem('isLoggingOut');
        }
    }, []);

    const showToast = (message, type) => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 5000);
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setError('');

        if (!formData.email || !formData.password) {
            setError('Please fill in all fields');
            return;
        }

        setLoading(true);

        try {
            const response = await authService.login({
                email: formData.email,
                password: formData.password,
            });

            // Clear the logout flag on successful login
            if (typeof sessionStorage !== 'undefined') {
                sessionStorage.removeItem('isLoggingOut');
            }

            const userName = `${response.user.firstName} ${response.user.lastName}`;
            showToast(`🎉 Welcome back, ${userName}!`, 'success');

            // Check if user must set password (admin-created user)
            if (response.user.mustSetPassword) {
                setUserDataForRedirect(response.user);
                setShowPasswordChangeModal(true);
                setLoading(false);
                return;
            }

            // Check for pending enrollment
            const pendingEnrollment = localStorage.getItem('pendingEnrollment');

            if (pendingEnrollment && response.user.role === 'student') {
                localStorage.removeItem('pendingEnrollment');
                setTimeout(async () => {
                    try {
                        const courseService = (await import('@/lib/api/courseService')).default;
                        await courseService.enrollCourse(pendingEnrollment);
                        router.replace(`/courses/${pendingEnrollment}/learn/0/0`);
                    } catch (err) {
                        console.error('Auto-enrollment failed:', err);
                        router.replace(`/courses/${pendingEnrollment}`);
                    }
                }, 500);
                return;
            }

            // Check for module redirect param (set when unauthenticated user clicks Enroll)
            if (redirectParam && response.user.role === 'student') {
                const moduleMatch = redirectParam.match(/^\/modules\/([a-f0-9]+)$/i);
                if (moduleMatch) {
                    const targetModuleId = moduleMatch[1];
                    setTimeout(async () => {
                        try {
                            const { default: moduleEnrollService } = await import('@/lib/api/moduleEnrollmentService');
                            const result = await moduleEnrollService.enrollInModule(targetModuleId);
                            if (result?.requiresPayment) {
                                router.replace(`/modules/${targetModuleId}`);
                            } else {
                                router.replace(`/student/modules/${targetModuleId}`);
                            }
                        } catch {
                            // Enrollment failed — go back to module detail page to show proper message
                            router.replace(`/modules/${targetModuleId}`);
                        }
                    }, 500);
                    return;
                }
                // General redirect param (non-module)
                setTimeout(() => router.replace(redirectParam), 300);
                return;
            }

            // Default: redirect based on role
            setTimeout(() => {
                if (response.user.role === 'student') {
                    router.replace('/student');
                } else if (response.user.role === 'instructor') {
                    router.replace('/instructor');
                } else if (response.user.role === 'admin') {
                    router.replace('/admin');
                } else {
                    router.replace('/');
                }
            }, 300);

        } catch (err) {
            console.error('Login error:', err);
            setError(err.message || 'Login failed. Please check your credentials.');
            showToast(err.message || 'Login failed. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSubmit();
        }
    };

    const handlePasswordChange = async () => {
        if (!passwordChangeData.newPassword || !passwordChangeData.confirmPassword) {
            showToast('Please fill in all fields', 'error');
            return;
        }

        if (passwordChangeData.newPassword.length < 6) {
            showToast('Password must be at least 6 characters', 'error');
            return;
        }

        if (passwordChangeData.newPassword !== passwordChangeData.confirmPassword) {
            showToast('Passwords do not match', 'error');
            return;
        }

        setPasswordChangeLoading(true);

        try {
            await authService.changePassword({
                currentPassword: formData.password,
                newPassword: passwordChangeData.newPassword,
            });

            showToast('Password changed successfully! Please log in with your new password.', 'success');
            
            // Log out the user
            authService.logout();
            
            // Close modal and reset form
            setShowPasswordChangeModal(false);
            setPasswordChangeData({ newPassword: '', confirmPassword: '' });
            setUserDataForRedirect(null);
            setFormData({ email: formData.email, password: '' });
            setShowPassword(false);
            
        } catch (err) {
            console.error('Password change error:', err);
            showToast(err.message || 'Failed to change password', 'error');
        } finally {
            setPasswordChangeLoading(false);
        }
    };

    return (
        <>
            {/* <Navbar /> */}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            {loading && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-xl px-6 py-4 shadow-2xl flex items-center gap-3 border border-gray-200">
                        <svg className="animate-spin h-6 w-6 text-[#021d49]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <div>
                            <p className="text-sm font-semibold text-gray-900">Signing you in</p>
                            <p className="text-xs text-gray-600">Please wait a moment…</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 py-6 px-4">
                <div className="max-w-4xl mx-auto mt-8">
                    {/* Back Button */}
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/80 backdrop-blur-sm shadow-md hover:shadow-lg text-gray-700 hover:text-[#021d49] transition-all mb-6 group border border-gray-200 hover:border-[#021d49]"
                    >
                        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="font-medium">Back to Home</span>
                    </Link>

                    {/* Main Card */}
                    <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
                        {/* Header Section */}
                        <div className="bg-gradient-to-br from-[#021d49] via-[#032a66] to-[#021d49] px-8 py-10 text-white relative overflow-hidden">
                            <div className="absolute inset-0 opacity-10">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-orange-300 rounded-full blur-3xl"></div>
                                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400 rounded-full blur-3xl"></div>
                            </div>
                            
                            <div className="relative z-10 text-center">
                                <div className="flex justify-center mb-4">
                                    <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-pink-500 rounded-xl flex items-center justify-center shadow-2xl">
                                        <BookOpen className="w-8 h-8 text-white" />
                                    </div>
                                </div>
                                <h1 className="text-3xl font-bold mb-2">Welcome Back!</h1>
                                <p className="text-blue-100 text-lg">Sign in to continue your learning journey</p>
                            </div>
                        </div>

                        {/* Decorative Feature Cards */}
                        <div className="px-8 py-6 bg-gradient-to-r from-blue-50 to-orange-50 border-b border-gray-200">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="text-center">
                                    <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-pink-500 rounded-lg flex items-center justify-center mx-auto mb-2 shadow-lg">
                                        <BookOpen className="w-6 h-6 text-white" />
                                    </div>
                                    <p className="text-xs font-medium text-gray-700">Expert Courses</p>
                                </div>
                                <div className="text-center">
                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-lg flex items-center justify-center mx-auto mb-2 shadow-lg">
                                        <Award className="w-6 h-6 text-white" />
                                    </div>
                                    <p className="text-xs font-medium text-gray-700">Certificates</p>
                                </div>
                                <div className="text-center">
                                    <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-lg flex items-center justify-center mx-auto mb-2 shadow-lg">
                                        <GraduationCap className="w-6 h-6 text-white" />
                                    </div>
                                    <p className="text-xs font-medium text-gray-700">Community</p>
                                </div>
                            </div>
                        </div>

                        {/* Form Content */}
                        <div className="px-8 py-10">
                            <div className="max-w-md mx-auto">
                                <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Sign In</h2>
                                <p className="text-gray-600 mb-8 text-center">Enter your credentials to access your account</p>

                                {error && (
                                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                                        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                                        <p className="text-sm text-red-800">{error}</p>
                                    </div>
                                )}

                                {/* Login Form */}
                                <div className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Email Address
                                        </label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-3.5 text-gray-400" size={18} />
                                            <input
                                                type="email"
                                                name="email"
                                                placeholder="you@example.com"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                onKeyPress={handleKeyPress}
                                                className="w-full h-12 pl-10 pr-4 border-2 border-gray-200 rounded-lg focus:border-[#021d49] focus:outline-none transition-colors"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Password
                                        </label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-3.5 text-gray-400" size={18} />
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                name="password"
                                                placeholder="Enter your password"
                                                value={formData.password}
                                                onChange={handleInputChange}
                                                onKeyPress={handleKeyPress}
                                                className="w-full h-12 pl-10 pr-12 border-2 border-gray-200 rounded-lg focus:border-[#021d49] focus:outline-none transition-colors"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                                            >
                                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <label className="flex items-center space-x-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                name="rememberMe"
                                                checked={formData.rememberMe}
                                                onChange={handleInputChange}
                                                className="w-4 h-4 text-[#021d49] border-gray-300 rounded focus:ring-[#021d49]"
                                            />
                                            <span className="text-sm text-gray-700">Remember me</span>
                                        </label>
                                        <Link href="/forgot-password" className="text-sm text-[#021d49] hover:underline font-medium">
                                            Forgot password?
                                        </Link>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleSubmit}
                                        disabled={loading}
                                        className="w-full h-12 bg-gradient-to-r from-[#021d49] to-[#032a66] hover:from-[#032a66] hover:to-[#021d49] text-white font-semibold rounded-lg transition-all transform hover:scale-[1.02] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? (
                                            <span className="flex items-center justify-center">
                                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Signing in...
                                            </span>
                                        ) : (
                                            'Sign In'
                                        )}
                                    </button>
                                </div>

                                {/* Divider */}
                                <div className="relative my-8">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-gray-200"></div>
                                    </div>
                                    <div className="relative flex justify-center text-sm">
                                        <span className="px-4 bg-white text-gray-500">New to ARIN Academy?</span>
                                    </div>
                                </div>

                                {/* Sign Up Link */}
                                <Link
                                    href="/register"
                                    className="block w-full h-12 border-2 border-[#021d49] text-[#021d49] font-semibold rounded-lg hover:bg-blue-50 transition-all text-center leading-[2.75rem]"
                                >
                                    Create Account
                                </Link>
                            </div>
                        </div>

                        {/* Footer Quote */}
                        <div className="px-8 py-6 bg-gradient-to-r from-blue-50 to-orange-50 border-t border-gray-200">
                            <div className="max-w-md mx-auto text-center">
                                <p className="text-sm text-gray-600 italic">
                                    "Empowering African scholars to share knowledge and shape the future of research excellence."
                                </p>
                                <p className="text-xs text-gray-500 mt-2 font-medium">ARIN Publishing Academy</p>
                            </div>
                        </div>
                    </div>

                    {/* Additional Info */}
                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600">
                            In collaboration with <span className="font-semibold text-[#021d49]">Taylor & Francis</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Password Change Modal */}
            {showPasswordChangeModal && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-[#021d49] to-[#032a66] px-6 py-5 text-white">
                            <h3 className="text-xl font-bold">Change Your Password</h3>
                            <p className="text-sm text-blue-100 mt-1">
                                You must change your auto-generated password before continuing
                            </p>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6">
                            <div className="space-y-4">
                                {/* New Password Field */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        New Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showNewPassword ? 'text' : 'password'}
                                            value={passwordChangeData.newPassword}
                                            onChange={(e) =>
                                                setPasswordChangeData({
                                                    ...passwordChangeData,
                                                    newPassword: e.target.value,
                                                })
                                            }
                                            className="w-full h-11 pl-4 pr-11 border-2 border-gray-300 rounded-lg focus:border-[#021d49] focus:ring-2 focus:ring-[#021d49]/20 transition-all outline-none"
                                            placeholder="Enter new password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                        >
                                            {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>
                                </div>

                                {/* Confirm Password Field */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Confirm Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            value={passwordChangeData.confirmPassword}
                                            onChange={(e) =>
                                                setPasswordChangeData({
                                                    ...passwordChangeData,
                                                    confirmPassword: e.target.value,
                                                })
                                            }
                                            className="w-full h-11 pl-4 pr-11 border-2 border-gray-300 rounded-lg focus:border-[#021d49] focus:ring-2 focus:ring-[#021d49]/20 transition-all outline-none"
                                            placeholder="Confirm new password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                        >
                                            {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>
                                </div>

                                {/* Password Requirements */}
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                    <p className="text-xs font-semibold text-gray-700 mb-2">Password Requirements:</p>
                                    <ul className="text-xs text-gray-600 space-y-1">
                                        <li className="flex items-center gap-2">
                                            <div className={`w-1.5 h-1.5 rounded-full ${passwordChangeData.newPassword.length >= 6 ? 'bg-green-500' : 'bg-gray-400'}`} />
                                            At least 6 characters
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <div className={`w-1.5 h-1.5 rounded-full ${passwordChangeData.newPassword === passwordChangeData.confirmPassword && passwordChangeData.newPassword ? 'bg-green-500' : 'bg-gray-400'}`} />
                                            Passwords match
                                        </li>
                                    </ul>
                                </div>
                            </div>

                            {/* Modal Actions */}
                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={handlePasswordChange}
                                    disabled={passwordChangeLoading}
                                    className="flex-1 h-11 bg-gradient-to-r from-[#021d49] to-[#032a66] hover:from-[#032a66] hover:to-[#021d49] text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {passwordChangeLoading ? (
                                        <span className="flex items-center justify-center">
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Changing...
                                        </span>
                                    ) : (
                                        'Change Password'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                .animate-slideIn {
                    animation: slideIn 0.3s ease-out;
                }
            `}</style>
            <Footer />
        </>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-[#021d49] border-t-transparent rounded-full" /></div>}>
            <LoginContent />
        </Suspense>
    );
}