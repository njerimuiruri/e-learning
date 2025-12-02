'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Eye, EyeOff, User, Mail, Lock, Facebook, Linkedin } from 'lucide-react';

const AppleIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
);

const GoogleIcon = () => (
    <svg viewBox="0 0 24 24" className="w-5 h-5">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
);

export default function RegisterModal({ isOpen, onClose, onSwitchToLogin }) {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [userRole, setUserRole] = useState('student');
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
    });

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!agreedToTerms) {
            alert('Please agree to the terms and conditions');
            return;
        }

        if (userRole === 'instructor') {
            alert('Your instructor account request has been submitted for approval. You will be notified once approved.');
            onClose();
            router.push('/login');
        } else {
            onClose();
            router.push(`/${userRole}`);
        }
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all z-10"
                >
                    <X size={24} />
                </button>

                <div className="p-8">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl mx-auto mb-4 flex items-center justify-center transform -rotate-3 shadow-lg">
                            <span className="text-3xl">🎓</span>
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">Join Us Today!</h2>
                        <p className="text-gray-600">Start your learning journey with 50M+ learners</p>
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-3">I want to:</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setUserRole('student')}
                                className={`h-auto py-4 px-4 rounded-xl font-semibold transition-all ${userRole === 'student'
                                    ? 'bg-gradient-to-br from-orange-500 to-pink-500 text-white shadow-lg scale-105'
                                    : 'border-2 border-gray-200 text-gray-700 hover:border-orange-300 hover:bg-orange-50'
                                    }`}
                            >
                                <div className="text-2xl mb-1">📚</div>
                                Learn
                            </button>
                            <button
                                type="button"
                                onClick={() => setUserRole('instructor')}
                                className={`h-auto py-4 px-4 rounded-xl font-semibold transition-all ${userRole === 'instructor'
                                    ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg scale-105'
                                    : 'border-2 border-gray-200 text-gray-700 hover:border-green-300 hover:bg-green-50'
                                    }`}
                            >
                                <div className="text-2xl mb-1">👨‍🏫</div>
                                Teach
                            </button>
                        </div>
                        {userRole === 'instructor' && (
                            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                <p className="text-xs text-amber-800 flex items-center">
                                    <span className="mr-2">⚠️</span>
                                    Instructor accounts require admin approval
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-4 gap-3 mb-6">
                        <button className="h-12 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 flex items-center justify-center transition-all hover:scale-105">
                            <Facebook className="w-5 h-5 text-blue-600" />
                        </button>
                        <button className="h-12 border-2 border-gray-200 rounded-xl hover:border-gray-800 hover:bg-gray-50 flex items-center justify-center transition-all hover:scale-105">
                            <AppleIcon />
                        </button>
                        <button className="h-12 border-2 border-gray-200 rounded-xl hover:border-red-500 hover:bg-red-50 flex items-center justify-center transition-all hover:scale-105">
                            <GoogleIcon />
                        </button>
                        <button className="h-12 border-2 border-gray-200 rounded-xl hover:border-blue-700 hover:bg-blue-50 flex items-center justify-center transition-all hover:scale-105">
                            <Linkedin className="w-5 h-5 text-blue-700" />
                        </button>
                    </div>

                    <div className="relative mb-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-3 bg-white text-gray-500 font-medium">OR</span>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="relative">
                                <User className="absolute left-4 top-3.5 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    name="firstName"
                                    placeholder="First Name"
                                    value={formData.firstName}
                                    onChange={handleInputChange}
                                    className="w-full h-12 pl-11 pr-4 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none transition-colors"
                                    required
                                />
                            </div>
                            <div className="relative">
                                <User className="absolute left-4 top-3.5 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    name="lastName"
                                    placeholder="Last Name"
                                    value={formData.lastName}
                                    onChange={handleInputChange}
                                    className="w-full h-12 pl-11 pr-4 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none transition-colors"
                                    required
                                />
                            </div>
                        </div>

                        <div className="relative">
                            <Mail className="absolute left-4 top-3.5 text-gray-400" size={20} />
                            <input
                                type="email"
                                name="email"
                                placeholder="Email address"
                                value={formData.email}
                                onChange={handleInputChange}
                                className="w-full h-12 pl-12 pr-4 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none transition-colors"
                                required
                            />
                        </div>

                        <div className="relative">
                            <Lock className="absolute left-4 top-3.5 text-gray-400" size={20} />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                placeholder="Password"
                                value={formData.password}
                                onChange={handleInputChange}
                                className="w-full h-12 pl-12 pr-12 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none transition-colors"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>

                        <div className="flex items-start space-x-2">
                            <input
                                type="checkbox"
                                id="terms"
                                checked={agreedToTerms}
                                onChange={(e) => setAgreedToTerms(e.target.checked)}
                                className="w-4 h-4 mt-1 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                required
                            />
                            <label htmlFor="terms" className="text-sm text-gray-600">
                                I agree to the{' '}
                                <a href="#" className="text-green-600 hover:underline">
                                    Terms & Conditions
                                </a>
                            </label>
                        </div>

                        <button
                            type="submit"
                            className="w-full h-12 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all transform hover:scale-[1.02] shadow-lg"
                        >
                            Sign Up
                        </button>
                    </form>

                    <p className="text-center text-sm text-gray-600 mt-6">
                        Already have an account?{' '}
                        <button
                            onClick={onSwitchToLogin}
                            className="text-green-600 font-semibold hover:text-green-700"
                        >
                            Log In
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}