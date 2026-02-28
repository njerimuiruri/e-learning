'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, User, Mail, Lock, AlertCircle, Phone, Upload, Building, Globe, CheckCircle, ArrowLeft, BookOpen, GraduationCap, Award, Briefcase, Link2, FileText, Calendar } from 'lucide-react';
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

export default function RegisterPage() {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [userRole, setUserRole] = useState('student');
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [toast, setToast] = useState(null);
    const [showOtherOrg, setShowOtherOrg] = useState(false);

    const [formData, setFormData] = useState({
        // Common fields
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        country: '',
        organization: '',
        otherOrganization: '',
        agreedToTerms: false,

        // Instructor specific
        phoneNumber: '',
        profilePicture: null,
        bio: '',
        qualifications: '',
        expertise: '',
        linkedIn: '',
        portfolio: '',
        teachingExperience: '',
        yearsOfExperience: '',
        cv: null,
        institution: '',
    });

    const organizationOptions = [
        'University',
        'Research Institute',
        'NGO',
        'Government Agency',
        'Private Company',
        'Consulting Firm',
        'Individual/Freelance',
        'Other'
    ];

    const totalSteps = userRole === 'student' ? 2 : 3;

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

        setLoading(true);

        try {
            if (userRole === 'student') {
                const response = await authService.registerStudent({
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    email: formData.email,
                    password: formData.password,
                    country: formData.country,
                    organization: formData.organization === 'Other' ? formData.otherOrganization : formData.organization,
                });

                if (response.token) {
                    localStorage.setItem('token', response.token);
                    localStorage.setItem('user', JSON.stringify(response.user));
                }

                showToast('🎉 Registration successful! Welcome to the platform.', 'success');
                setTimeout(() => router.push('/student'), 1500);

            } else if (userRole === 'instructor') {
                const response = await authService.registerInstructor({
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    email: formData.email,
                    password: formData.password,
                    phoneNumber: formData.phoneNumber,
                    country: formData.country,
                    organization: formData.organization === 'Other' ? formData.otherOrganization : formData.organization,
                    institution: formData.institution,
                    profilePicture: formData.profilePicture,
                    bio: formData.bio,
                    qualifications: formData.qualifications,
                    expertise: formData.expertise,
                    linkedIn: formData.linkedIn,
                    portfolio: formData.portfolio,
                    teachingExperience: formData.teachingExperience,
                    yearsOfExperience: formData.yearsOfExperience,
                    cv: formData.cv,
                });

                showToast('✅ Instructor request submitted! You will be notified once approved.', 'success');
                setTimeout(() => router.push('/login'), 2000);
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
            if (name === 'organization') {
                setShowOtherOrg(value === 'Other');
            }
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleRoleChange = (role) => {
        setUserRole(role);
        setCurrentStep(1);
        setError('');
    };

    const nextStep = () => {
        // Validation for each step
        if (currentStep === 1) {
            if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
                setError('Please fill in all required fields');
                return;
            }
            if (formData.password.length < 6) {
                setError('Password must be at least 6 characters');
                return;
            }
        }

        if (currentStep === 2 && userRole === 'student') {
            if (!formData.country) {
                setError('Please fill in all required fields');
                return;
            }
        }

        if (currentStep === 2 && userRole === 'instructor') {
            if (!formData.phoneNumber || !formData.country) {
                setError('Please fill in all required fields');
                return;
            }
        }

        if (currentStep === 3 && userRole === 'instructor') {
            if (!formData.bio || !formData.qualifications || !formData.expertise || !formData.cv) {
                setError('Please fill in all required fields and upload your CV');
                return;
            }
        }

        setError('');
        setCurrentStep(currentStep + 1);
    };

    const prevStep = () => {
        setError('');
        setCurrentStep(currentStep - 1);
    };

    const renderStepIndicator = () => (
        <div className="flex items-center justify-center mb-8">
            {[...Array(totalSteps)].map((_, index) => (
                <div key={index} className="flex items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${index + 1 === currentStep
                        ? 'bg-gradient-to-br from-[#021d49] to-[#032a66] text-white shadow-lg scale-110'
                        : index + 1 < currentStep
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-200 text-gray-500'
                        }`}>
                        {index + 1 < currentStep ? '✓' : index + 1}
                    </div>
                    {index < totalSteps - 1 && (
                        <div className={`w-16 h-1 mx-2 transition-all ${index + 1 < currentStep ? 'bg-green-500' : 'bg-gray-200'
                            }`}></div>
                    )}
                </div>
            ))}
        </div>
    );

    const renderStep1 = () => (
        <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Basic Information</h3>

            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
                    <div className="relative">
                        <User className="absolute left-3 top-3.5 text-gray-400" size={18} />
                        <input
                            type="text"
                            name="firstName"
                            placeholder="John"
                            value={formData.firstName}
                            onChange={handleInputChange}
                            className="w-full h-12 pl-10 pr-4 border-2 border-gray-200 rounded-lg focus:border-[#021d49] focus:outline-none transition-colors"
                            required
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
                    <div className="relative">
                        <User className="absolute left-3 top-3.5 text-gray-400" size={18} />
                        <input
                            type="text"
                            name="lastName"
                            placeholder="Doe"
                            value={formData.lastName}
                            onChange={handleInputChange}
                            className="w-full h-12 pl-10 pr-4 border-2 border-gray-200 rounded-lg focus:border-[#021d49] focus:outline-none transition-colors"
                            required
                        />
                    </div>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                <div className="relative">
                    <Mail className="absolute left-3 top-3.5 text-gray-400" size={18} />
                    <input
                        type="email"
                        name="email"
                        placeholder="you@example.com"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full h-12 pl-10 pr-4 border-2 border-gray-200 rounded-lg focus:border-[#021d49] focus:outline-none transition-colors"
                        required
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
                <div className="relative">
                    <Lock className="absolute left-3 top-3.5 text-gray-400" size={18} />
                    <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        placeholder="Minimum 6 characters"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="w-full h-12 pl-10 pr-12 border-2 border-gray-200 rounded-lg focus:border-[#021d49] focus:outline-none transition-colors"
                        required
                        minLength={6}
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
        </div>
    );

    const renderStep2Student = () => (
        <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Additional Details</h3>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Country *</label>
                <div className="relative">
                    <Globe className="absolute left-3 top-3.5 text-gray-400" size={18} />
                    <input
                        type="text"
                        name="country"
                        placeholder="Your country"
                        value={formData.country}
                        onChange={handleInputChange}
                        className="w-full h-12 pl-10 pr-4 border-2 border-gray-200 rounded-lg focus:border-[#021d49] focus:outline-none transition-colors"
                        required
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Organization (Optional)</label>
                <div className="relative">
                    <Building className="absolute left-3 top-3.5 text-gray-400" size={18} />
                    <select
                        name="organization"
                        value={formData.organization}
                        onChange={handleInputChange}
                        className="w-full h-12 pl-10 pr-4 border-2 border-gray-200 rounded-lg focus:border-[#021d49] focus:outline-none transition-colors appearance-none bg-white"
                    >
                        <option value="">Select organization type</option>
                        {organizationOptions.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                    </select>
                </div>
            </div>

            {showOtherOrg && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Specify Organization</label>
                    <input
                        type="text"
                        name="otherOrganization"
                        placeholder="Enter your organization"
                        value={formData.otherOrganization}
                        onChange={handleInputChange}
                        className="w-full h-12 px-4 border-2 border-gray-200 rounded-lg focus:border-[#021d49] focus:outline-none transition-colors"
                    />
                </div>
            )}

            <div className="flex items-start space-x-2 pt-4">
                <input
                    type="checkbox"
                    id="terms"
                    name="agreedToTerms"
                    checked={formData.agreedToTerms}
                    onChange={handleInputChange}
                    className="w-4 h-4 mt-0.5 text-[#021d49] border-gray-300 rounded focus:ring-[#021d49]"
                    required
                />
                <label htmlFor="terms" className="text-sm text-gray-600">
                    I agree to the{' '}
                    <a href="#" className="text-[#021d49] hover:underline font-medium">Terms & Conditions</a>
                    {' '}and{' '}
                    <a href="#" className="text-[#021d49] hover:underline font-medium">Privacy Policy</a>
                </label>
            </div>
        </div>
    );

    const renderStep2Instructor = () => (
        <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Contact & Organization</h3>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                <div className="relative">
                    <Phone className="absolute left-3 top-3.5 text-gray-400" size={18} />
                    <input
                        type="tel"
                        name="phoneNumber"
                        placeholder="+1234567890"
                        value={formData.phoneNumber}
                        onChange={handleInputChange}
                        className="w-full h-12 pl-10 pr-4 border-2 border-gray-200 rounded-lg focus:border-[#021d49] focus:outline-none transition-colors"
                        required
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Country *</label>
                <div className="relative">
                    <Globe className="absolute left-3 top-3.5 text-gray-400" size={18} />
                    <input
                        type="text"
                        name="country"
                        placeholder="Your country"
                        value={formData.country}
                        onChange={handleInputChange}
                        className="w-full h-12 pl-10 pr-4 border-2 border-gray-200 rounded-lg focus:border-[#021d49] focus:outline-none transition-colors"
                        required
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Organization Type</label>
                <div className="relative">
                    <Building className="absolute left-3 top-3.5 text-gray-400" size={18} />
                    <select
                        name="organization"
                        value={formData.organization}
                        onChange={handleInputChange}
                        className="w-full h-12 pl-10 pr-4 border-2 border-gray-200 rounded-lg focus:border-[#021d49] focus:outline-none transition-colors appearance-none bg-white"
                    >
                        <option value="">Select organization type</option>
                        {organizationOptions.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                    </select>
                </div>
            </div>

            {showOtherOrg && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Specify Organization</label>
                    <input
                        type="text"
                        name="otherOrganization"
                        placeholder="Enter your organization"
                        value={formData.otherOrganization}
                        onChange={handleInputChange}
                        className="w-full h-12 px-4 border-2 border-gray-200 rounded-lg focus:border-[#021d49] focus:outline-none transition-colors"
                    />
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Institution Name</label>
                <div className="relative">
                    <Building className="absolute left-3 top-3.5 text-gray-400" size={18} />
                    <input
                        type="text"
                        name="institution"
                        placeholder="Your institution"
                        value={formData.institution}
                        onChange={handleInputChange}
                        className="w-full h-12 pl-10 pr-4 border-2 border-gray-200 rounded-lg focus:border-[#021d49] focus:outline-none transition-colors"
                    />
                </div>
            </div>
        </div>
    );

    const renderStep3Instructor = () => (
        <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Professional Profile</h3>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bio *</label>
                <textarea
                    name="bio"
                    placeholder="Tell us about yourself, your teaching philosophy, and experience..."
                    value={formData.bio}
                    onChange={handleInputChange}
                    className="w-full h-24 px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-[#021d49] focus:outline-none transition-colors resize-none"
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Qualifications *</label>
                <div className="relative">
                    <GraduationCap className="absolute left-3 top-3.5 text-gray-400" size={18} />
                    <input
                        type="text"
                        name="qualifications"
                        placeholder="e.g., PhD in Economics, MSc in Data Science"
                        value={formData.qualifications}
                        onChange={handleInputChange}
                        className="w-full h-12 pl-10 pr-4 border-2 border-gray-200 rounded-lg focus:border-[#021d49] focus:outline-none transition-colors"
                        required
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Expertise/Specialization *</label>
                <div className="relative">
                    <Briefcase className="absolute left-3 top-3.5 text-gray-400" size={18} />
                    <input
                        type="text"
                        name="expertise"
                        placeholder="e.g., Research Methods, Policy Analysis"
                        value={formData.expertise}
                        onChange={handleInputChange}
                        className="w-full h-12 pl-10 pr-4 border-2 border-gray-200 rounded-lg focus:border-[#021d49] focus:outline-none transition-colors"
                        required
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Years of Experience</label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-3.5 text-gray-400" size={18} />
                        <input
                            type="number"
                            name="yearsOfExperience"
                            placeholder="5"
                            value={formData.yearsOfExperience}
                            onChange={handleInputChange}
                            className="w-full h-12 pl-10 pr-4 border-2 border-gray-200 rounded-lg focus:border-[#021d49] focus:outline-none transition-colors"
                            min="0"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Teaching Experience</label>
                    <input
                        type="text"
                        name="teachingExperience"
                        placeholder="e.g., 10 years"
                        value={formData.teachingExperience}
                        onChange={handleInputChange}
                        className="w-full h-12 px-4 border-2 border-gray-200 rounded-lg focus:border-[#021d49] focus:outline-none transition-colors"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn Profile</label>
                <div className="relative">
                    <Link2 className="absolute left-3 top-3.5 text-gray-400" size={18} />
                    <input
                        type="url"
                        name="linkedIn"
                        placeholder="https://linkedin.com/in/yourprofile"
                        value={formData.linkedIn}
                        onChange={handleInputChange}
                        className="w-full h-12 pl-10 pr-4 border-2 border-gray-200 rounded-lg focus:border-[#021d49] focus:outline-none transition-colors"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Portfolio/Website</label>
                <div className="relative">
                    <Globe className="absolute left-3 top-3.5 text-gray-400" size={18} />
                    <input
                        type="url"
                        name="portfolio"
                        placeholder="https://yourportfolio.com"
                        value={formData.portfolio}
                        onChange={handleInputChange}
                        className="w-full h-12 pl-10 pr-4 border-2 border-gray-200 rounded-lg focus:border-[#021d49] focus:outline-none transition-colors"
                    />
                </div>
            </div>

            <div className="space-y-3 pt-2">
                <label className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg hover:border-[#021d49] cursor-pointer transition-colors">
                    <div className="flex items-center gap-3">
                        <Upload className="w-5 h-5 text-gray-400" />
                        <span className="text-sm text-gray-600">
                            {formData.profilePicture ? formData.profilePicture.name : 'Profile Photo (Optional)'}
                        </span>
                    </div>
                    <input
                        type="file"
                        name="profilePicture"
                        accept="image/*"
                        onChange={handleInputChange}
                        className="hidden"
                    />
                </label>

                <label className="flex items-center justify-between p-4 border-2 border-[#021d49] rounded-lg hover:border-[#032a66] cursor-pointer transition-colors bg-blue-50">
                    <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-[#021d49]" />
                        <span className="text-sm font-medium text-gray-700">
                            {formData.cv ? formData.cv.name : 'Upload CV/Resume (PDF only) *'}
                        </span>
                    </div>
                    <input
                        type="file"
                        name="cv"
                        accept=".pdf,application/pdf"
                        onChange={handleInputChange}
                        className="hidden"
                        required
                    />
                </label>
            </div>

            <div className="flex items-start space-x-2 pt-4">
                <input
                    type="checkbox"
                    id="terms"
                    name="agreedToTerms"
                    checked={formData.agreedToTerms}
                    onChange={handleInputChange}
                    className="w-4 h-4 mt-0.5 text-[#021d49] border-gray-300 rounded focus:ring-[#021d49]"
                    required
                />
                <label htmlFor="terms" className="text-sm text-gray-600">
                    I agree to the{' '}
                    <a href="#" className="text-[#021d49] hover:underline font-medium">Terms & Conditions</a>
                    {' '}and{' '}
                    <a href="#" className="text-[#021d49] hover:underline font-medium">Privacy Policy</a>
                </label>
            </div>
        </div>
    );

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
                            <p className="text-sm font-semibold text-gray-900">Processing your request</p>
                            <p className="text-xs text-gray-600">This may take a few seconds…</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 py-12 px-4">
                <div className="max-w-4xl mx-auto mt-20">
                    {/* Back Button */}
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
                    >
                        <ArrowLeft size={20} />
                        <span>Back to Home</span>
                    </Link>

                    {/* Main Card */}
                    <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
                        {/* Header Section */}
                        <div className="bg-gradient-to-br from-[#021d49] via-[#032a66] to-[#021d49] px-8 py-8 text-white relative overflow-hidden">
                            <div className="absolute inset-0 opacity-10">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-orange-300 rounded-full blur-3xl"></div>
                                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400 rounded-full blur-3xl"></div>
                            </div>

                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                                        <BookOpen className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h1 className="text-2xl font-bold">ARIN Publishing Academy</h1>
                                        <p className="text-orange-200 text-sm">Join Our Learning Community</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Role Selection */}
                        <div className="px-8 py-6 border-b border-gray-200">
                            <label className="block text-sm font-medium text-gray-700 mb-3">I want to:</label>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => handleRoleChange('student')}
                                    className={`h-auto py-5 px-4 rounded-xl font-semibold transition-all flex flex-col items-center gap-2 ${userRole === 'student'
                                        ? 'bg-gradient-to-br from-[#021d49] to-[#032a66] text-white shadow-lg border-2 border-[#021d49]'
                                        : 'border-2 border-gray-200 text-gray-700 hover:border-[#021d49] hover:bg-blue-50'
                                        }`}
                                >
                                    <div className="text-3xl">📚</div>
                                    <div>
                                        <div className="font-bold text-base">Student</div>
                                        <div className="text-xs opacity-80">Learn & Grow</div>
                                    </div>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleRoleChange('instructor')}
                                    className={`h-auto py-5 px-4 rounded-xl font-semibold transition-all flex flex-col items-center gap-2 ${userRole === 'instructor'
                                        ? 'bg-gradient-to-br from-[#021d49] to-[#032a66] text-white shadow-lg border-2 border-[#021d49]'
                                        : 'border-2 border-gray-200 text-gray-700 hover:border-[#021d49] hover:bg-blue-50'
                                        }`}
                                >
                                    <div className="text-3xl">👨‍🏫</div>
                                    <div>
                                        <div className="font-bold text-base">Instructor</div>
                                        <div className="text-xs opacity-80">Teach & Inspire</div>
                                    </div>
                                </button>
                            </div>
                            {userRole === 'instructor' && (
                                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                                    <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                                    <p className="text-xs text-amber-800">Instructor accounts require admin approval. Please complete all steps accurately.</p>
                                </div>
                            )}
                        </div>

                        {/* Form Content */}
                        <div className="px-8 py-8">
                            {renderStepIndicator()}

                            {error && (
                                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                                    <p className="text-sm text-red-800">{error}</p>
                                </div>
                            )}

                            <div className="max-h-[500px] overflow-y-auto pr-2">
                                {currentStep === 1 && renderStep1()}
                                {currentStep === 2 && userRole === 'student' && renderStep2Student()}
                                {currentStep === 2 && userRole === 'instructor' && renderStep2Instructor()}
                                {currentStep === 3 && userRole === 'instructor' && renderStep3Instructor()}
                            </div>

                            {/* Navigation Buttons */}
                            <div className="flex gap-3 mt-8 pt-6 border-t border-gray-200">
                                {currentStep > 1 && (
                                    <button
                                        type="button"
                                        onClick={prevStep}
                                        className="flex-1 h-12 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all"
                                    >
                                        ← Previous
                                    </button>
                                )}

                                {currentStep < totalSteps ? (
                                    <button
                                        type="button"
                                        onClick={nextStep}
                                        className="flex-1 h-12 bg-gradient-to-r from-[#021d49] to-[#032a66] hover:from-[#032a66] hover:to-[#021d49] text-white font-semibold rounded-lg transition-all transform hover:scale-[1.02] shadow-lg"
                                    >
                                        Next →
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={handleSubmit}
                                        disabled={loading}
                                        className="flex-1 h-12 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-lg transition-all transform hover:scale-[1.02] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? (
                                            <span className="flex items-center justify-center">
                                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Creating account...
                                            </span>
                                        ) : (
                                            '✓ Complete Registration'
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-8 py-4 bg-gray-50 border-t border-gray-200">
                            <p className="text-center text-sm text-gray-600">
                                Already have an account?{' '}
                                <Link
                                    href="/login"
                                    className="text-[#021d49] font-semibold hover:underline"
                                >
                                    Sign In
                                </Link>
                            </p>
                        </div>
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
            <Footer />
        </>
    );
}