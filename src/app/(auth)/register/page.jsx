'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Eye, EyeOff, User, Mail, Lock, AlertCircle, Phone,
    Upload, Building, Globe, CheckCircle, ArrowLeft,
    GraduationCap, Briefcase, Link2, FileText, Calendar
} from 'lucide-react';
import authService from '@/lib/api/authService';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

/* ─── Toast ─── */
const Toast = ({ message, type, onClose }) => (
    <div className={`
        fixed top-5 right-5 z-[60] bg-white border-l-4 rounded-xl shadow-2xl p-4
        min-w-[280px] max-w-xs flex items-start gap-3 animate-slideIn
        ${type === 'success' ? 'border-[#00c4b3]' : 'border-red-400'}
    `}>
        {type === 'success'
            ? <CheckCircle className="w-4 h-4 text-[#00c4b3] mt-0.5 flex-shrink-0" />
            : <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />}
        <p className="text-gray-800 text-sm font-medium flex-1">{message}</p>
        <button onClick={onClose} className="text-gray-300 hover:text-gray-500 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
        </button>
    </div>
);

/* ─── Step indicator dot ─── */
const StepDot = ({ step, current, total }) => {
    const done = step < current;
    const active = step === current;
    return (
        <div className="flex items-center">
            <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300
                ${done ? 'bg-[#00c4b3] text-white' : active ? 'bg-[#021d49] text-white ring-4 ring-[#021d49]/20' : 'bg-gray-100 text-gray-400'}
            `}>
                {done ? <CheckCircle size={14} /> : step}
            </div>
            {step < total && (
                <div className={`w-10 h-0.5 mx-1 transition-all duration-300 ${done ? 'bg-[#00c4b3]' : 'bg-gray-200'}`} />
            )}
        </div>
    );
};

/* ─── Field wrapper ─── */
const Field = ({ label, required, children }) => (
    <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            {label}{required && <span className="text-red-400 ml-0.5">*</span>}
        </Label>
        {children}
    </div>
);

/* ─── Icon input ─── */
const IconInput = ({ icon: Icon, ...props }) => (
    <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
        <Input {...props} className={`pl-9 h-10 text-sm border-gray-200 focus:border-[#021d49] focus:ring-[#021d49]/10 rounded-lg bg-gray-50 focus:bg-white transition-all ${props.className || ''}`} />
    </div>
);

const organizationOptions = [
    'University', 'Research Institute', 'NGO', 'Government Agency',
    'Private Company', 'Consulting Firm', 'Individual/Freelance', 'Other'
];

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
        firstName: '', lastName: '', email: '', password: '', country: '',
        organization: '', otherOrganization: '', agreedToTerms: false,
        phoneNumber: '', profilePicture: null, bio: '', qualifications: '',
        expertise: '', linkedIn: '', portfolio: '', teachingExperience: '',
        yearsOfExperience: '', cv: null, institution: '',
    });

    const totalSteps = userRole === 'student' ? 2 : 3;

    const showToast = (message, type) => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 5000);
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked, files } = e.target;
        if (type === 'file') {
            setFormData({ ...formData, [name]: files[0] });
        } else if (type === 'checkbox') {
            setFormData({ ...formData, [name]: checked });
        } else {
            if (name === 'organization') setShowOtherOrg(value === 'Other');
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleRoleChange = (role) => {
        setUserRole(role);
        setCurrentStep(1);
        setError('');
    };

    const nextStep = () => {
        if (currentStep === 1) {
            if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
                setError('Please fill in all required fields'); return;
            }
            if (formData.password.length < 6) { setError('Password must be at least 6 characters'); return; }
        }
        if (currentStep === 2 && userRole === 'student' && !formData.country) {
            setError('Please fill in all required fields'); return;
        }
        if (currentStep === 2 && userRole === 'instructor' && (!formData.phoneNumber || !formData.country)) {
            setError('Please fill in all required fields'); return;
        }
        if (currentStep === 3 && userRole === 'instructor' && (!formData.bio || !formData.qualifications || !formData.expertise || !formData.cv)) {
            setError('Please fill in all required fields and upload your CV'); return;
        }
        setError('');
        setCurrentStep(currentStep + 1);
    };

    const prevStep = () => { setError(''); setCurrentStep(currentStep - 1); };

    const handleSubmit = async () => {
        setError('');
        if (!formData.agreedToTerms) { setError('Please agree to the terms and conditions'); return; }
        setLoading(true);
        try {
            if (userRole === 'student') {
                const response = await authService.registerStudent({
                    firstName: formData.firstName, lastName: formData.lastName,
                    email: formData.email, password: formData.password,
                    country: formData.country,
                    organization: formData.organization === 'Other' ? formData.otherOrganization : formData.organization,
                });
                if (response.token) {
                    localStorage.setItem('token', response.token);
                    localStorage.setItem('user', JSON.stringify(response.user));
                }
                showToast('Registration successful! Welcome aboard.', 'success');
                setTimeout(() => router.push('/student'), 1500);
            } else {
                await authService.registerInstructor({
                    firstName: formData.firstName, lastName: formData.lastName,
                    email: formData.email, password: formData.password,
                    phoneNumber: formData.phoneNumber, country: formData.country,
                    organization: formData.organization === 'Other' ? formData.otherOrganization : formData.organization,
                    institution: formData.institution, profilePicture: formData.profilePicture,
                    bio: formData.bio, qualifications: formData.qualifications,
                    expertise: formData.expertise, linkedIn: formData.linkedIn,
                    portfolio: formData.portfolio, teachingExperience: formData.teachingExperience,
                    yearsOfExperience: formData.yearsOfExperience, cv: formData.cv,
                });
                showToast('Instructor request submitted! We will notify you once approved.', 'success');
                setTimeout(() => router.push('/login'), 2000);
            }
        } catch (err) {
            setError(err.message || 'Registration failed. Please try again.');
            showToast(err.message || 'Registration failed. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    /* ── Step renders ── */
    const renderStep1 = () => (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
                <Field label="First name" required>
                    <IconInput icon={User} name="firstName" placeholder="John" value={formData.firstName} onChange={handleInputChange} />
                </Field>
                <Field label="Last name" required>
                    <IconInput icon={User} name="lastName" placeholder="Doe" value={formData.lastName} onChange={handleInputChange} />
                </Field>
            </div>
            <Field label="Email address" required>
                <IconInput icon={Mail} type="email" name="email" placeholder="you@example.com" value={formData.email} onChange={handleInputChange} />
            </Field>
            <Field label="Password" required>
                <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                    <Input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        placeholder="Minimum 6 characters"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="pl-9 pr-10 h-10 text-sm border-gray-200 focus:border-[#021d49] focus:ring-[#021d49]/10 rounded-lg bg-gray-50 focus:bg-white transition-all"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                </div>
            </Field>
        </div>
    );

    const renderStep2Student = () => (
        <div className="space-y-4">
            <Field label="Country" required>
                <IconInput icon={Globe} name="country" placeholder="Your country" value={formData.country} onChange={handleInputChange} />
            </Field>
            <Field label="Organization type">
                <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" size={14} />
                    <select name="organization" value={formData.organization} onChange={handleInputChange}
                        className="w-full pl-9 h-10 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-[#021d49] outline-none appearance-none transition-all">
                        <option value="">Select organization type</option>
                        {organizationOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                </div>
            </Field>
            {showOtherOrg && (
                <Field label="Specify organization">
                    <Input name="otherOrganization" placeholder="Enter your organization" value={formData.otherOrganization} onChange={handleInputChange}
                        className="h-10 text-sm border-gray-200 focus:border-[#021d49] focus:ring-[#021d49]/10 rounded-lg bg-gray-50 focus:bg-white transition-all" />
                </Field>
            )}
            <div className="flex items-start gap-2.5 pt-2">
                <Checkbox id="terms" checked={formData.agreedToTerms}
                    onCheckedChange={(checked) => setFormData({ ...formData, agreedToTerms: checked })}
                    className="border-gray-300 data-[state=checked]:bg-[#021d49] data-[state=checked]:border-[#021d49] mt-0.5" />
                <label htmlFor="terms" className="text-xs text-gray-500 leading-relaxed cursor-pointer">
                    I agree to the{' '}
                    <a href="#" className="text-[#00c4b3] hover:text-[#021d49] font-semibold transition-colors">Terms & Conditions</a>
                    {' '}and{' '}
                    <a href="#" className="text-[#00c4b3] hover:text-[#021d49] font-semibold transition-colors">Privacy Policy</a>
                </label>
            </div>
        </div>
    );

    const renderStep2Instructor = () => (
        <div className="space-y-4">
            <Field label="Phone number" required>
                <IconInput icon={Phone} type="tel" name="phoneNumber" placeholder="+1234567890" value={formData.phoneNumber} onChange={handleInputChange} />
            </Field>
            <Field label="Country" required>
                <IconInput icon={Globe} name="country" placeholder="Your country" value={formData.country} onChange={handleInputChange} />
            </Field>
            <Field label="Organization type">
                <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" size={14} />
                    <select name="organization" value={formData.organization} onChange={handleInputChange}
                        className="w-full pl-9 h-10 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-[#021d49] outline-none appearance-none transition-all">
                        <option value="">Select organization type</option>
                        {organizationOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                </div>
            </Field>
            {showOtherOrg && (
                <Field label="Specify organization">
                    <Input name="otherOrganization" placeholder="Enter your organization" value={formData.otherOrganization} onChange={handleInputChange}
                        className="h-10 text-sm border-gray-200 focus:border-[#021d49] focus:ring-[#021d49]/10 rounded-lg bg-gray-50 focus:bg-white transition-all" />
                </Field>
            )}
            <Field label="Institution name">
                <IconInput icon={Building} name="institution" placeholder="Your institution" value={formData.institution} onChange={handleInputChange} />
            </Field>
        </div>
    );

    const renderStep3Instructor = () => (
        <div className="space-y-4">
            <Field label="Bio" required>
                <textarea name="bio" placeholder="Tell us about yourself, your teaching philosophy and experience…"
                    value={formData.bio} onChange={handleInputChange}
                    className="w-full h-20 px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-[#021d49] outline-none resize-none transition-all" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
                <Field label="Qualifications" required>
                    <IconInput icon={GraduationCap} name="qualifications" placeholder="PhD, MSc…" value={formData.qualifications} onChange={handleInputChange} />
                </Field>
                <Field label="Expertise" required>
                    <IconInput icon={Briefcase} name="expertise" placeholder="Research, Policy…" value={formData.expertise} onChange={handleInputChange} />
                </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <Field label="Years of experience">
                    <IconInput icon={Calendar} type="number" name="yearsOfExperience" placeholder="5" value={formData.yearsOfExperience} onChange={handleInputChange} min="0" />
                </Field>
                <Field label="Teaching experience">
                    <Input name="teachingExperience" placeholder="e.g. 10 years" value={formData.teachingExperience} onChange={handleInputChange}
                        className="h-10 text-sm border-gray-200 focus:border-[#021d49] focus:ring-[#021d49]/10 rounded-lg bg-gray-50 focus:bg-white transition-all" />
                </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <Field label="LinkedIn">
                    <IconInput icon={Link2} type="url" name="linkedIn" placeholder="linkedin.com/in/you" value={formData.linkedIn} onChange={handleInputChange} />
                </Field>
                <Field label="Portfolio">
                    <IconInput icon={Globe} type="url" name="portfolio" placeholder="yoursite.com" value={formData.portfolio} onChange={handleInputChange} />
                </Field>
            </div>

            {/* File uploads */}
            <div className="grid grid-cols-2 gap-3">
                <label className={`flex flex-col items-center justify-center gap-1.5 h-16 rounded-lg border-2 border-dashed cursor-pointer transition-all
                    ${formData.profilePicture ? 'border-[#00c4b3] bg-[#00c4b3]/5' : 'border-gray-200 bg-gray-50 hover:border-gray-300'}`}>
                    <Upload size={16} className={formData.profilePicture ? 'text-[#00c4b3]' : 'text-gray-400'} />
                    <span className="text-[10px] text-center text-gray-500 px-2 leading-tight">
                        {formData.profilePicture ? formData.profilePicture.name : 'Profile photo (optional)'}
                    </span>
                    <input type="file" name="profilePicture" accept="image/*" onChange={handleInputChange} className="hidden" />
                </label>

                <label className={`flex flex-col items-center justify-center gap-1.5 h-16 rounded-lg border-2 border-dashed cursor-pointer transition-all
                    ${formData.cv ? 'border-[#00c4b3] bg-[#00c4b3]/5' : 'border-[#021d49]/30 bg-[#021d49]/5 hover:border-[#021d49]/50'}`}>
                    <FileText size={16} className={formData.cv ? 'text-[#00c4b3]' : 'text-[#021d49]'} />
                    <span className="text-[10px] text-center text-gray-500 px-2 leading-tight">
                        {formData.cv ? formData.cv.name : 'Upload CV (PDF)*'}
                    </span>
                    <input type="file" name="cv" accept=".pdf,application/pdf" onChange={handleInputChange} className="hidden" required />
                </label>
            </div>

            <div className="flex items-start gap-2.5 pt-1">
                <Checkbox id="terms3" checked={formData.agreedToTerms}
                    onCheckedChange={(checked) => setFormData({ ...formData, agreedToTerms: checked })}
                    className="border-gray-300 data-[state=checked]:bg-[#021d49] data-[state=checked]:border-[#021d49] mt-0.5" />
                <label htmlFor="terms3" className="text-xs text-gray-500 leading-relaxed cursor-pointer">
                    I agree to the{' '}
                    <a href="#" className="text-[#00c4b3] hover:text-[#021d49] font-semibold transition-colors">Terms & Conditions</a>
                    {' '}and{' '}
                    <a href="#" className="text-[#00c4b3] hover:text-[#021d49] font-semibold transition-colors">Privacy Policy</a>
                </label>
            </div>
        </div>
    );

    const stepLabels = userRole === 'student'
        ? ['Account', 'Details']
        : ['Account', 'Contact', 'Profile'];

    return (
        <>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {loading && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/25 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl px-6 py-4 shadow-2xl flex items-center gap-3">
                        <svg className="animate-spin h-5 w-5 text-[#021d49]" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <p className="text-sm font-semibold text-[#021d49]">Creating your account…</p>
                    </div>
                </div>
            )}

            {/* 40 / 60 split — consistent with login */}
            <div className="w-full flex flex-col lg:flex-row">

                {/* ══ LEFT PANEL — 40% ══ */}
                <div className="hidden lg:flex lg:w-2/5 relative flex-col lg:sticky lg:top-0 lg:h-screen flex-shrink-0">
                    <img src="/image/1.png" alt="" aria-hidden="true"
                        className="absolute inset-0 w-full h-full object-cover object-center" />
                    <div className="absolute inset-0 bg-[#021d49]/65" />
                    <div className="absolute bottom-0 inset-x-0 h-48 bg-gradient-to-t from-[#021d49]/80 to-transparent" />

                    <div className="relative z-10 flex flex-col h-full px-9 py-9">
                        {/* Logo + back */}
                        <div className="flex items-center justify-between">
                            <img src="/Arin.png" alt="ARIN Publishing Academy" className="h-14 w-auto object-contain" />
                            <Link href="/" className="inline-flex items-center gap-1.5 text-white/65 hover:text-white text-xs font-medium transition-colors group">
                                <span className="w-7 h-7 rounded-full bg-white/12 group-hover:bg-white/22 flex items-center justify-center transition-colors">
                                    <ArrowLeft size={13} className="group-hover:-translate-x-0.5 transition-transform" />
                                </span>
                                Back to Home
                            </Link>
                        </div>

                        {/* Centre copy */}
                        <div className="flex-1 flex flex-col justify-center">
                            <h1 className="text-3xl xl:text-4xl font-bold text-white leading-snug mb-4">
                                Join the<br />
                                <span className="text-[#00c4b3]">ARIN Publishing</span><br />
                                Community
                            </h1>
                            <div className="w-10 h-0.5 bg-[#00c4b3]/60 mb-4" />
                            <p className="text-blue-100/75 text-sm font-medium tracking-wide">
                                An <span className="text-white font-semibold">ARIN Press</span> Initiative
                            </p>
                            <p className="text-blue-100/55 text-xs mt-1.5 tracking-wide">
                                In Collaboration with{' '}
                                <span className="text-white/70 font-semibold">Taylor & Francis</span>
                            </p>

                            {/* Step progress on left panel */}
                            <div className="mt-10 space-y-2.5">
                                {[...Array(totalSteps)].map((_, i) => (
                                    <div key={i} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${i + 1 === currentStep
                                        ? 'bg-white/12 border border-white/15'
                                        : 'opacity-50'
                                        }`}>
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${i + 1 < currentStep ? 'bg-[#00c4b3] text-white' :
                                            i + 1 === currentStep ? 'bg-white text-[#021d49]' :
                                                'bg-white/20 text-white/60'
                                            }`}>
                                            {i + 1 < currentStep ? <CheckCircle size={11} /> : i + 1}
                                        </div>
                                        <span className={`text-xs font-medium ${i + 1 === currentStep ? 'text-white' : 'text-white/60'}`}>
                                            {stepLabels[i]}
                                        </span>
                                        {i + 1 === currentStep && (
                                            <span className="ml-auto text-[#00c4b3] text-[10px] font-semibold">Current</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <p className="text-white/25 text-[10px] tracking-wider uppercase">
                            © {new Date().getFullYear()} ARIN Publishing Academy
                        </p>
                    </div>
                </div>

                {/* ══ RIGHT PANEL — 60%, scrollable ══ */}
                <div className="w-full lg:w-3/5 bg-gray-50 flex flex-col">

                    {/* Mobile top bar */}
                    <div className="lg:hidden sticky top-0 z-10 flex items-center justify-between px-5 py-3.5 bg-white border-b border-gray-100 shadow-sm">
                        <img src="/Arin.png" alt="ARIN Publishing Academy" className="h-9 w-auto object-contain" />
                        <Link href="/" className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-[#021d49] transition-colors group">
                            <ArrowLeft size={13} className="group-hover:-translate-x-0.5 transition-transform" />
                            Home
                        </Link>
                    </div>

                    {/* Desktop top row */}
                    <div className="hidden lg:flex items-center justify-between px-8 pt-7 pb-1 flex-shrink-0">
                        <div>
                            <h2 className="text-lg font-bold text-[#021d49]">Create your account</h2>
                            <p className="text-gray-400 text-xs mt-0.5">Join thousands of African scholars today</p>
                        </div>
                        <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-[#021d49] transition-colors group">
                            <ArrowLeft size={13} className="group-hover:-translate-x-0.5 transition-transform" />
                            Back to Home
                        </Link>
                    </div>

                    {/* Scrollable form content */}
                    <div className="flex-1 px-5 py-6 lg:px-8 lg:py-5">

                        {/* Role toggle */}
                        <div className="grid grid-cols-2 gap-2 mb-5 p-1 bg-white border border-gray-200 rounded-xl shadow-sm">
                            {['student', 'instructor'].map((role) => (
                                <button key={role} type="button" onClick={() => handleRoleChange(role)}
                                    className={`h-9 rounded-lg text-xs font-semibold transition-all ${userRole === role
                                        ? 'bg-[#021d49] text-white shadow-md'
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}>
                                    {role === 'student' ? '📚 Student' : '👨‍🏫 Instructor'}
                                </button>
                            ))}
                        </div>

                        {/* Instructor notice */}
                        {userRole === 'instructor' && (
                            <div className="mb-4 flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                <AlertCircle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" />
                                <p className="text-[10px] text-amber-700 leading-relaxed">
                                    Instructor accounts require admin approval. Please complete all steps accurately.
                                </p>
                            </div>
                        )}

                        {/* Mobile step indicator */}
                        <div className="lg:hidden flex items-center mb-5 bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
                            {[...Array(totalSteps)].map((_, i) => (
                                <div key={i} className="flex items-center flex-1">
                                    <div className="flex flex-col items-center flex-1">
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${i + 1 < currentStep ? 'bg-[#00c4b3] text-white' :
                                            i + 1 === currentStep ? 'bg-[#021d49] text-white' :
                                                'bg-gray-100 text-gray-400'
                                            }`}>
                                            {i + 1 < currentStep ? <CheckCircle size={10} /> : i + 1}
                                        </div>
                                        <span className={`text-[8px] mt-0.5 font-medium ${i + 1 === currentStep ? 'text-[#021d49]' : 'text-gray-400'}`}>
                                            {stepLabels[i]}
                                        </span>
                                    </div>
                                    {i < totalSteps - 1 && (
                                        <div className={`h-px w-6 mb-3 transition-all ${i + 1 < currentStep ? 'bg-[#00c4b3]' : 'bg-gray-200'}`} />
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Error */}
                        {error && (
                            <Alert variant="destructive" className="mb-4 py-2.5 border-red-200 bg-red-50 text-red-700 rounded-lg">
                                <AlertCircle className="h-3.5 w-3.5" />
                                <AlertDescription className="text-xs ml-1">{error}</AlertDescription>
                            </Alert>
                        )}

                        {/* Form card */}
                        <Card className="shadow-sm border border-gray-200/80 rounded-2xl bg-white">
                            <CardContent className="p-5 sm:p-7">
                                {currentStep === 1 && renderStep1()}
                                {currentStep === 2 && userRole === 'student' && renderStep2Student()}
                                {currentStep === 2 && userRole === 'instructor' && renderStep2Instructor()}
                                {currentStep === 3 && userRole === 'instructor' && renderStep3Instructor()}

                                {/* Navigation */}
                                <div className="flex gap-2.5 mt-6 pt-5 border-t border-gray-100">
                                    {currentStep > 1 && (
                                        <Button type="button" variant="outline" onClick={prevStep}
                                            className="h-10 px-5 border-gray-200 text-gray-600 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-all">
                                            ← Back
                                        </Button>
                                    )}
                                    {currentStep < totalSteps ? (
                                        <Button type="button" onClick={nextStep}
                                            className="flex-1 h-10 bg-[#021d49] hover:bg-[#032a66] text-white text-sm font-semibold rounded-lg transition-colors shadow-md shadow-[#021d49]/20">
                                            Continue →
                                        </Button>
                                    ) : (
                                        <Button type="button" onClick={handleSubmit} disabled={loading}
                                            className="flex-1 h-10 bg-[#00c4b3] hover:bg-[#00b0a0] text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 shadow-md shadow-[#00c4b3]/25">
                                            {loading ? (
                                                <span className="flex items-center gap-2">
                                                    <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                    </svg>
                                                    Creating…
                                                </span>
                                            ) : '✓ Complete Registration'}
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Sign in */}
                        <div className="flex items-center gap-3 mt-5">
                            <Separator className="flex-1 bg-gray-200" />
                            <span className="text-[10px] text-gray-400 whitespace-nowrap">Already have an account?</span>
                            <Separator className="flex-1 bg-gray-200" />
                        </div>
                        <Button variant="outline" asChild
                            className="w-full h-10 mt-3 border-gray-200 text-[#021d49] text-sm font-semibold rounded-lg hover:border-[#021d49] hover:bg-[#021d49]/5 transition-all">
                            <Link href="/login">Sign In</Link>
                        </Button>

                        <p className="text-center text-[10px] text-gray-300 mt-5 pb-8">
                            An ARIN Press Initiative · In Collaboration with Taylor & Francis
                        </p>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to   { transform: translateX(0);    opacity: 1; }
                }
                .animate-slideIn { animation: slideIn 0.25s ease-out; }
            `}</style>
        </>
    );
}