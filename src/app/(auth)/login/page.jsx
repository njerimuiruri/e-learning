'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
    Eye, EyeOff, Mail, Lock, AlertCircle, CheckCircle, ArrowLeft, BookOpen
} from 'lucide-react';
import authService from '@/lib/api/authService';

// shadcn/ui imports
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

function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectParam = searchParams.get('redirect');

    // Decode base64url-encoded email from invitation links (?ref=...)
    const refParam = searchParams.get('ref') || '';
    const emailFromRef = (() => {
        if (!refParam) return '';
        try { return atob(refParam.replace(/-/g, '+').replace(/_/g, '/')); } catch { return ''; }
    })();

    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [toast, setToast] = useState(null);
    const [showPasswordChangeModal, setShowPasswordChangeModal] = useState(false);
    const [passwordChangeData, setPasswordChangeData] = useState({ newPassword: '', confirmPassword: '' });
    const [passwordChangeLoading, setPasswordChangeLoading] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [userDataForRedirect, setUserDataForRedirect] = useState(null);
    const [formData, setFormData] = useState({ email: emailFromRef, password: '', rememberMe: false });

    useEffect(() => {
        if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem('isLoggingOut');
    }, []);

    const showToast = (message, type) => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 5000);
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setError('');
        if (!formData.email || !formData.password) { setError('Please fill in all fields'); return; }
        setLoading(true);
        try {
            const response = await authService.login({ email: formData.email, password: formData.password });
            if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem('isLoggingOut');
            const displayName = response.user.fullName || `${response.user.firstName || ''} ${response.user.lastName || ''}`.trim() || response.user.firstName;
            showToast(`Welcome back, ${displayName}!`, 'success');

            if (response.user.mustSetPassword) {
                setUserDataForRedirect(response.user);
                setShowPasswordChangeModal(true);
                setLoading(false);
                return;
            }

            const pendingEnrollment = localStorage.getItem('pendingEnrollment');
            if (pendingEnrollment && response.user.role === 'student') {
                localStorage.removeItem('pendingEnrollment');
                setTimeout(async () => {
                    try {
                        const courseService = (await import('@/lib/api/courseService')).default;
                        await courseService.enrollCourse(pendingEnrollment);
                        router.replace(`/courses/${pendingEnrollment}/learn/0/0`);
                    } catch { router.replace(`/courses/${pendingEnrollment}`); }
                }, 500);
                return;
            }

            if (redirectParam && response.user.role === 'student') {
                const moduleMatch = redirectParam.match(/^\/modules\/([a-f0-9]+)$/i);
                if (moduleMatch) {
                    const targetModuleId = moduleMatch[1];
                    setTimeout(async () => {
                        try {
                            const { default: moduleEnrollService } = await import('@/lib/api/moduleEnrollmentService');
                            const result = await moduleEnrollService.enrollInModule(targetModuleId);
                            router.replace(result?.requiresPayment ? `/modules/${targetModuleId}` : `/student/modules/${targetModuleId}`);
                        } catch { router.replace(`/modules/${targetModuleId}`); }
                    }, 500);
                    return;
                }
                setTimeout(() => router.replace(redirectParam), 300);
                return;
            }

            setTimeout(() => {
                if (response.user.role === 'student') router.replace('/student');
                else if (response.user.role === 'instructor') router.replace('/instructor');
                else if (response.user.role === 'admin') router.replace('/admin');
                else router.replace('/');
            }, 300);
        } catch (err) {
            setError(err.message || 'Login failed. Please check your credentials.');
            showToast(err.message || 'Login failed. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e) => { if (e.key === 'Enter') { e.preventDefault(); handleSubmit(); } };

    const handlePasswordChange = async () => {
        if (!passwordChangeData.newPassword || !passwordChangeData.confirmPassword) { showToast('Please fill in all fields', 'error'); return; }
        if (passwordChangeData.newPassword.length < 6) { showToast('Password must be at least 6 characters', 'error'); return; }
        if (passwordChangeData.newPassword !== passwordChangeData.confirmPassword) { showToast('Passwords do not match', 'error'); return; }
        setPasswordChangeLoading(true);
        try {
            await authService.changePassword({ currentPassword: formData.password, newPassword: passwordChangeData.newPassword });
            showToast('Password changed! Please sign in again.', 'success');
            authService.logout();
            setShowPasswordChangeModal(false);
            setPasswordChangeData({ newPassword: '', confirmPassword: '' });
            setUserDataForRedirect(null);
            setFormData({ email: formData.email, password: '' });
        } catch (err) {
            showToast(err.message || 'Failed to change password', 'error');
        } finally {
            setPasswordChangeLoading(false);
        }
    };

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
                        <p className="text-sm font-semibold text-[#021d49]">Signing you in…</p>
                    </div>
                </div>
            )}

            <div className="min-h-screen w-full flex flex-col lg:flex-row lg:h-screen lg:overflow-hidden">

                {/* ══ LEFT PANEL ══ */}
                <div className="hidden lg:flex lg:w-1/2 relative flex-col">
                    <img
                        src="/image/1.png"
                        alt=""
                        aria-hidden="true"
                        className="absolute inset-0 w-full h-full object-cover object-center"
                    />
                    <div className="absolute inset-0 bg-[#021d49]/65" />
                    <div className="absolute bottom-0 inset-x-0 h-48 bg-gradient-to-t from-[#021d49]/80 to-transparent" />

                    <div className="relative z-10 flex flex-col h-full px-10 py-9">

                        {/* Top row: logo + back btn */}
                        <div className="flex items-center justify-between">
                            {/* LEFT panel logo — h-16 gives a tall, prominent logo */}
                            <img
                                src="/Arin.png"
                                alt="ARIN Publishing Academy"
                                className="h-16 w-auto object-contain"
                            />

                            <Link
                                href="/"
                                className="inline-flex items-center gap-1.5 text-white/65 hover:text-white text-xs font-medium transition-colors group"
                            >
                                <span className="w-7 h-7 rounded-full bg-white/12 group-hover:bg-white/22 flex items-center justify-center transition-colors">
                                    <ArrowLeft size={13} className="group-hover:-translate-x-0.5 transition-transform" />
                                </span>
                                Back to Home
                            </Link>
                        </div>

                        {/* Centre brand copy */}
                        <div className="flex-1 flex flex-col justify-center">
                            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-snug mb-5">
                                Welcome to<br />
                                <span className="text-[#00c4b3]">ARIN Publishing</span><br />
                                Academy
                            </h1>
                            <div className="w-12 h-0.5 bg-[#00c4b3]/60 mb-5" />
                            <p className="text-blue-100/75 text-sm font-medium tracking-wide">
                                An <span className="text-white font-semibold">ARIN Press</span> Initiative
                            </p>
                            <p className="text-blue-100/55 text-xs mt-1.5 tracking-wide">
                                In Collaboration with{' '}
                                <span className="text-white/70 font-semibold">Taylor & Francis</span>
                            </p>
                        </div>

                        <p className="text-white/25 text-[10px] tracking-wider uppercase">
                            © {new Date().getFullYear()} ARIN Publishing Academy
                        </p>
                    </div>
                </div>

                {/* ══ RIGHT PANEL ══ */}
                <div className="w-full lg:w-1/2 bg-gray-50 flex flex-col lg:h-screen">

                    {/* Mobile top bar — sticky so always visible while scrolling */}
                    <div className="lg:hidden sticky top-0 z-10 flex items-center justify-between px-5 py-4 bg-white border-b border-gray-100 shadow-sm">
                        <img
                            src="/Arin.png"
                            alt="ARIN Publishing Academy"
                            className="h-10 w-auto object-contain"
                        />
                        <Link href="/" className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-[#021d49] transition-colors group">
                            <ArrowLeft size={13} className="group-hover:-translate-x-0.5 transition-transform" />
                            Home
                        </Link>
                    </div>

                    {/* Desktop back link */}
                    <div className="hidden lg:flex justify-end px-8 pt-7 flex-shrink-0">
                        <Link
                            href="/"
                            className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-[#021d49] transition-colors group"
                        >
                            <ArrowLeft size={13} className="group-hover:-translate-x-0.5 transition-transform" />
                            Back to Home
                        </Link>
                    </div>

                    {/* 
                        Mobile: normal block flow so everything renders and page scrolls naturally.
                        Desktop: flex centering so card sits in the middle of the panel.
                    */}
                    <div className="w-full px-5 py-8 lg:flex-1 lg:flex lg:items-center lg:justify-center lg:px-8 lg:py-6 lg:overflow-auto">
                        <Card className="w-full max-w-[480px] mx-auto shadow-xl border-0 rounded-2xl bg-white">

                            <CardHeader className="px-7 pt-7 pb-3 space-y-0">
                                {/* Card logo — h-14 makes it prominent inside the card */}
                                <div className="mb-5">
                                    <img
                                        src="/Arin.png"
                                        alt="ARIN Publishing Academy"
                                        className="h-14 w-auto object-contain"
                                    />
                                </div>

                                <h2 className="text-xl font-bold text-[#021d49]">Sign in</h2>
                                <p className="text-gray-400 text-xs mt-0.5">Enter your credentials to continue</p>
                            </CardHeader>

                            <CardContent className="px-7 pb-7 pt-2">

                                {emailFromRef && (
                                    <div className="mb-4 flex gap-2 items-start bg-green-50 border border-green-200 rounded-lg px-3 py-2.5">
                                        <CheckCircle className="h-3.5 w-3.5 text-green-600 mt-0.5 flex-shrink-0" />
                                        <p className="text-xs text-green-700">
                                            Your email has been filled in. Enter the <strong>temporary password</strong> from your invitation email to continue.
                                        </p>
                                    </div>
                                )}

                                {error && (
                                    <Alert variant="destructive" className="mb-4 py-2.5 border-red-200 bg-red-50 text-red-700 rounded-lg">
                                        <AlertCircle className="h-3.5 w-3.5" />
                                        <AlertDescription className="text-xs ml-1">{error}</AlertDescription>
                                    </Alert>
                                )}

                                <div className="space-y-4">

                                    {/* Email */}
                                    <div className="space-y-1.5">
                                        <Label htmlFor="email" className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                            Email address
                                        </Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="you@example.com"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                onKeyPress={handleKeyPress}
                                                className="pl-9 h-10 text-sm border-gray-200 focus:border-[#021d49] focus:ring-[#021d49]/10 rounded-lg bg-gray-50 focus:bg-white transition-all"
                                            />
                                        </div>
                                    </div>

                                    {/* Password */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="password" className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                                Password
                                            </Label>
                                            <Link href="/forgot-password" className="text-[10px] text-[#00c4b3] hover:text-[#021d49] font-semibold transition-colors">
                                                Forgot password?
                                            </Link>
                                        </div>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                            <Input
                                                id="password"
                                                type={showPassword ? 'text' : 'password'}
                                                placeholder="Enter your password"
                                                value={formData.password}
                                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                onKeyPress={handleKeyPress}
                                                className="pl-9 pr-10 h-10 text-sm border-gray-200 focus:border-[#021d49] focus:ring-[#021d49]/10 rounded-lg bg-gray-50 focus:bg-white transition-all"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                            >
                                                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Remember me */}
                                    <div className="flex items-center gap-2">
                                        <Checkbox
                                            id="rememberMe"
                                            checked={formData.rememberMe}
                                            onCheckedChange={(checked) => setFormData({ ...formData, rememberMe: checked })}
                                            className="border-gray-300 data-[state=checked]:bg-[#021d49] data-[state=checked]:border-[#021d49] w-3.5 h-3.5"
                                        />
                                        <Label htmlFor="rememberMe" className="text-xs text-gray-500 cursor-pointer font-normal">
                                            Remember me for 30 days
                                        </Label>
                                    </div>

                                    {/* Sign In */}
                                    <Button
                                        type="button"
                                        onClick={handleSubmit}
                                        disabled={loading}
                                        className="w-full h-10 bg-[#021d49] hover:bg-[#032a66] text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 shadow-md shadow-[#021d49]/20"
                                    >
                                        {loading ? (
                                            <span className="flex items-center gap-2">
                                                <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                </svg>
                                                Signing in…
                                            </span>
                                        ) : 'Sign In'}
                                    </Button>

                                    {/* Divider */}
                                    <div className="flex items-center gap-3">
                                        <Separator className="flex-1 bg-gray-100" />
                                        <span className="text-[10px] text-gray-400 whitespace-nowrap">No account yet?</span>
                                        <Separator className="flex-1 bg-gray-100" />
                                    </div>

                                    {/* Create account */}
                                    <Button
                                        variant="outline"
                                        asChild
                                        className="w-full h-10 border-gray-200 text-[#021d49] text-sm font-semibold rounded-lg hover:border-[#021d49] hover:bg-[#021d49]/5 transition-all"
                                    >
                                        <Link href="/register">Create an account</Link>
                                    </Button>
                                </div>

                                {/* Footer */}
                                <p className="text-center text-[10px] text-gray-300 mt-5">
                                    An ARIN Press Initiative · In Collaboration with Taylor & Francis
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* ══ PASSWORD CHANGE MODAL ══ */}
            {showPasswordChangeModal && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <Card className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl border-0">
                        <div className="bg-[#021d49] px-6 py-5">
                            <h3 className="text-base font-bold text-white">Set Your Password</h3>
                            <p className="text-blue-200 text-xs mt-1">Required before you continue.</p>
                        </div>
                        <CardContent className="p-6 space-y-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">New Password</Label>
                                <div className="relative">
                                    <Input
                                        type={showNewPassword ? 'text' : 'password'}
                                        value={passwordChangeData.newPassword}
                                        onChange={(e) => setPasswordChangeData({ ...passwordChangeData, newPassword: e.target.value })}
                                        placeholder="Enter new password"
                                        className="pr-10 h-10 text-sm border-gray-200 rounded-lg"
                                    />
                                    <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                        {showNewPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Confirm Password</Label>
                                <div className="relative">
                                    <Input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        value={passwordChangeData.confirmPassword}
                                        onChange={(e) => setPasswordChangeData({ ...passwordChangeData, confirmPassword: e.target.value })}
                                        placeholder="Confirm new password"
                                        className="pr-10 h-10 text-sm border-gray-200 rounded-lg"
                                    />
                                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                        {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                    </button>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <span className={`flex items-center gap-1.5 text-[10px] ${passwordChangeData.newPassword.length >= 6 ? 'text-[#00c4b3]' : 'text-gray-400'}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${passwordChangeData.newPassword.length >= 6 ? 'bg-[#00c4b3]' : 'bg-gray-300'}`} />
                                    6+ characters
                                </span>
                                <span className={`flex items-center gap-1.5 text-[10px] ${passwordChangeData.newPassword && passwordChangeData.newPassword === passwordChangeData.confirmPassword ? 'text-[#00c4b3]' : 'text-gray-400'}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${passwordChangeData.newPassword && passwordChangeData.newPassword === passwordChangeData.confirmPassword ? 'bg-[#00c4b3]' : 'bg-gray-300'}`} />
                                    Passwords match
                                </span>
                            </div>
                            <Button
                                type="button"
                                onClick={handlePasswordChange}
                                disabled={passwordChangeLoading}
                                className="w-full h-10 bg-[#021d49] hover:bg-[#032a66] text-white text-sm font-semibold rounded-lg disabled:opacity-50"
                            >
                                {passwordChangeLoading ? (
                                    <span className="flex items-center gap-2">
                                        <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Updating…
                                    </span>
                                ) : 'Set New Password'}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            )}

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

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="h-screen w-screen flex items-center justify-center bg-white">
                <svg className="animate-spin h-5 w-5 text-[#021d49]" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
            </div>
        }>
            <LoginContent />
        </Suspense>
    );
}