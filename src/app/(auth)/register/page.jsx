'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Eye, EyeOff, User, Mail, Lock, AlertCircle, Phone, Upload, Building, Globe, CheckCircle } from 'lucide-react';
import authService from '@/lib/api/authService';

const GoogleIcon = () => (
    <svg viewBox="0 0 24 24" className="w-5 h-5">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
);

// Toast Notification Component
const Toast = ({ message, type, onClose }) => {
    const bgColor = type === 'success' ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500';
    const textColor = type === 'success' ? 'text-green-800' : 'text-red-800';
    const Icon = type === 'success' ? CheckCircle : AlertCircle;
    const iconColor = type === 'success' ? 'text-green-500' : 'text-red-500';

    return (
        <div className={`fixed top-20 right-4 z-[60] ${bgColor} border-l-4 rounded-lg shadow-2xl p-4 min-w-[320px] max-w-md animate-slideIn`}>
            <div className="flex items-start gap-3">
                <Icon className={`w-5 h-5 ${iconColor} flex-shrink-0 mt-0.5`} />
                <div className="flex-1">
                    <p className={`${textColor} font-medium text-sm`}>{message}</p>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                    <X size={18} />
                </button>
            </div>
        </div>
    );
};

export default function RegisterModal({ isOpen, onClose, onSwitchToLogin, onRegistrationSuccess }) {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [userRole, setUserRole] = useState('student');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [toast, setToast] = useState(null);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        phoneNumber: '',
        country: '',
        institution: '',
        bio: '',
        agreedToTerms: false,
        profileImage: null,
        cvFile: null,
    });

    if (!isOpen) return null;

    const showToast = (message, type) => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 5000);
    };

    const handleSubmit = async () => {
        setError('');

        if (!formData.agreedToTerms) {
            setError('Please agree to the terms and conditions');
            return;
        }

        if (userRole === 'instructor') {
            if (!formData.phoneNumber || !formData.institution || !formData.bio) {
                setError('Please fill in all required fields');
                return;
            }
            if (!formData.cvFile) {
                setError('CV/Resume is required for instructors');
                return;
            }
        }

        setLoading(true);

        try {
            if (userRole === 'student') {
                const response = await authService.registerStudent({
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    email: formData.email,
                    password: formData.password,
                    country: formData.country,
                });

                if (response.token) {
                    localStorage.setItem('token', response.token);
                    localStorage.setItem('user', JSON.stringify(response.user));
                }

                showToast('🎉 Registration successful! Welcome to the platform.', 'success');

                if (onRegistrationSuccess) {
                    onRegistrationSuccess(response.user);
                }

                setTimeout(() => {
                    onClose();
                    router.push('/student');
                }, 1500);

            } else if (userRole === 'instructor') {
                const response = await authService.registerInstructor({
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    email: formData.email,
                    password: formData.password,
                    phoneNumber: formData.phoneNumber,
                    institution: formData.institution,
                    bio: formData.bio,
                    country: formData.country,
                    profileImage: formData.profileImage,
                    cvFile: formData.cvFile,
                });

                showToast('✅ Instructor request submitted! You will be notified once approved.', 'success');

                setTimeout(() => {
                    onClose();
                    onSwitchToLogin();
                }, 2000);
            }
        } catch (err) {
            console.error('Registration error:', err);
            setError(err.message || 'Registration failed. Please try again.');
            showToast(err.message || 'Registration failed. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked, files } = e.target;

        if (type === 'file') {
            setFormData({ ...formData, [name]: files[0] });
        } else if (type === 'checkbox') {
            setFormData({ ...formData, [name]: checked });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleRoleChange = (role) => {
        setUserRole(role);
        setError('');
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    return (
        <>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm"
                onClick={onClose}
            >
                <div
                    className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl max-h-[92vh] overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        onClick={onClose}
                        className="sticky top-4 float-right mr-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all z-10 bg-white shadow-md"
                    >
                        <X size={20} />
                    </button>

                    <div className="p-6">
                        <div className="text-center mb-5">
                            <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl mx-auto mb-3 flex items-center justify-center shadow-lg">
                                <span className="text-2xl">🎓</span>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-1">Join Us Today!</h2>
                            <p className="text-sm text-gray-600">Start your learning journey</p>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                                <p className="text-xs text-red-800">{error}</p>
                            </div>
                        )}

                        <div className="mb-4">
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => handleRoleChange('student')}
                                    className={`h-auto py-3 px-3 rounded-lg font-semibold transition-all text-sm ${userRole === 'student'
                                        ? 'bg-gradient-to-br from-orange-500 to-pink-500 text-white shadow-md'
                                        : 'border-2 border-gray-200 text-gray-700 hover:border-orange-300'
                                        }`}
                                >
                                    <div className="text-xl mb-1">📚</div>
                                    Learn
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleRoleChange('instructor')}
                                    className={`h-auto py-3 px-3 rounded-lg font-semibold transition-all text-sm ${userRole === 'instructor'
                                        ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-md'
                                        : 'border-2 border-gray-200 text-gray-700 hover:border-green-300'
                                        }`}
                                >
                                    <div className="text-xl mb-1">👨‍🏫</div>
                                    Teach
                                </button>
                            </div>
                            {userRole === 'instructor' && (
                                <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                                    <p className="text-xs text-amber-800">⚠️ Requires admin approval</p>
                                </div>
                            )}
                        </div>

                        <button
                            type="button"
                            className="w-full h-10 border-2 border-gray-200 rounded-lg hover:border-red-500 hover:bg-red-50 flex items-center justify-center gap-2 transition-all mb-4"
                        >
                            <GoogleIcon />
                            <span className="text-sm font-medium text-gray-700">Continue with Google</span>
                        </button>

                        <div className="relative mb-4">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300"></div>
                            </div>
                            <div className="relative flex justify-center text-xs">
                                <span className="px-2 bg-white text-gray-500">OR</span>
                            </div>
                        </div>

                        <div className="space-y-3" onKeyPress={handleKeyPress}>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="relative">
                                    <User className="absolute left-3 top-2.5 text-gray-400" size={16} />
                                    <input
                                        type="text"
                                        name="firstName"
                                        placeholder="First Name *"
                                        value={formData.firstName}
                                        onChange={handleInputChange}
                                        className="w-full h-10 pl-9 pr-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none transition-colors text-sm"
                                        required
                                    />
                                </div>
                                <div className="relative">
                                    <User className="absolute left-3 top-2.5 text-gray-400" size={16} />
                                    <input
                                        type="text"
                                        name="lastName"
                                        placeholder="Last Name *"
                                        value={formData.lastName}
                                        onChange={handleInputChange}
                                        className="w-full h-10 pl-9 pr-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none transition-colors text-sm"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="relative">
                                <Mail className="absolute left-3 top-2.5 text-gray-400" size={16} />
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="Email address *"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className="w-full h-10 pl-9 pr-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none transition-colors text-sm"
                                    required
                                />
                            </div>

                            <div className="relative">
                                <Lock className="absolute left-3 top-2.5 text-gray-400" size={16} />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    placeholder="Password (min 6 chars) *"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    className="w-full h-10 pl-9 pr-9 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none transition-colors text-sm"
                                    required
                                    minLength={6}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>

                            <div className="relative">
                                <Globe className="absolute left-3 top-2.5 text-gray-400" size={16} />
                                <input
                                    type="text"
                                    name="country"
                                    placeholder="Country"
                                    value={formData.country}
                                    onChange={handleInputChange}
                                    className="w-full h-10 pl-9 pr-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none transition-colors text-sm"
                                />
                            </div>

                            {userRole === 'instructor' && (
                                <>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-2.5 text-gray-400" size={16} />
                                        <input
                                            type="tel"
                                            name="phoneNumber"
                                            placeholder="Phone Number *"
                                            value={formData.phoneNumber}
                                            onChange={handleInputChange}
                                            className="w-full h-10 pl-9 pr-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none transition-colors text-sm"
                                            required
                                        />
                                    </div>

                                    <div className="relative">
                                        <Building className="absolute left-3 top-2.5 text-gray-400" size={16} />
                                        <input
                                            type="text"
                                            name="institution"
                                            placeholder="Institution/Organization *"
                                            value={formData.institution}
                                            onChange={handleInputChange}
                                            className="w-full h-10 pl-9 pr-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none transition-colors text-sm"
                                            required
                                        />
                                    </div>

                                    <textarea
                                        name="bio"
                                        placeholder="Brief bio (teaching experience, expertise) *"
                                        value={formData.bio}
                                        onChange={handleInputChange}
                                        className="w-full h-20 px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none transition-colors resize-none text-sm"
                                        required
                                    />

                                    <div className="space-y-2">
                                        <label className="flex items-center justify-between p-3 border-2 border-gray-200 rounded-lg hover:border-green-300 cursor-pointer transition-colors">
                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                <Upload className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                                <span className="text-xs text-gray-600 truncate">
                                                    {formData.profileImage ? formData.profileImage.name : 'Profile Photo (Optional)'}
                                                </span>
                                            </div>
                                            <input
                                                type="file"
                                                name="profileImage"
                                                accept="image/*"
                                                onChange={handleInputChange}
                                                className="hidden"
                                            />
                                        </label>

                                        <label className="flex items-center justify-between p-3 border-2 border-green-200 rounded-lg hover:border-green-400 cursor-pointer transition-colors bg-green-50">
                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                <Upload className="w-4 h-4 text-green-600 flex-shrink-0" />
                                                <span className="text-xs font-medium text-gray-700 truncate">
                                                    {formData.cvFile ? formData.cvFile.name : 'Upload CV/Resume *'}
                                                </span>
                                            </div>
                                            <input
                                                type="file"
                                                name="cvFile"
                                                accept=".pdf,.doc,.docx"
                                                onChange={handleInputChange}
                                                className="hidden"
                                                required
                                            />
                                        </label>
                                    </div>
                                </>
                            )}

                            <div className="flex items-start space-x-2">
                                <input
                                    type="checkbox"
                                    id="terms"
                                    name="agreedToTerms"
                                    checked={formData.agreedToTerms}
                                    onChange={handleInputChange}
                                    className="w-4 h-4 mt-0.5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                    required
                                />
                                <label htmlFor="terms" className="text-xs text-gray-600 leading-tight">
                                    I agree to the{' '}
                                    <a href="#" className="text-green-600 hover:underline">Terms</a>
                                    {' '}and{' '}
                                    <a href="#" className="text-green-600 hover:underline">Privacy Policy</a>
                                </label>
                            </div>

                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={loading}
                                className="w-full h-10 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-lg transition-all transform hover:scale-[1.02] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center">
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Creating account...
                                    </span>
                                ) : (
                                    'Sign Up'
                                )}
                            </button>
                        </div>

                        <p className="text-center text-xs text-gray-600 mt-4">
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
        </>
    );
}