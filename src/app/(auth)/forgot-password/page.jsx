'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, ArrowLeft, KeyRound, Lock, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import authService from '@/lib/api/authService';

const STEPS = { EMAIL: 'email', OTP: 'otp', PASSWORD: 'password', DONE: 'done' };

export default function ForgotPasswordPage() {
    const router = useRouter();

    const [step, setStep] = useState(STEPS.EMAIL);
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [resetToken, setResetToken] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSendOtp = async (e) => {
        e.preventDefault();
        if (!email.trim()) { setError('Please enter your email address.'); return; }
        setError('');
        setLoading(true);
        try {
            await authService.sendForgotPasswordOtp(email.trim());
            setStep(STEPS.OTP);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        if (otp.trim().length !== 6) { setError('Please enter the 6-digit code.'); return; }
        setError('');
        setLoading(true);
        try {
            const res = await authService.verifyForgotPasswordOtp(email.trim(), otp.trim());
            setResetToken(res.resetToken);
            setStep(STEPS.PASSWORD);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (newPassword.length < 8) { setError('Password must be at least 8 characters.'); return; }
        if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }
        setError('');
        setLoading(true);
        try {
            await authService.resetPasswordWithToken(resetToken, newPassword, confirmPassword);
            setStep(STEPS.DONE);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const stepIndex = { [STEPS.EMAIL]: 1, [STEPS.OTP]: 2, [STEPS.PASSWORD]: 3 };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#021d49] via-[#0a2d6e] to-[#1e40af] flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg mb-3">
                        <img src="/Arin.png" alt="ARIN" className="w-12 h-12 object-contain" />
                    </div>
                    <h1 className="text-white font-bold text-xl">ARIN E-Learning</h1>
                </div>

                <div className="bg-white rounded-2xl shadow-2xl p-8">
                    {/* Progress dots */}
                    {step !== STEPS.DONE && (
                        <div className="flex items-center justify-center gap-2 mb-6">
                            {[1, 2, 3].map((n) => (
                                <div key={n} className={`h-2 rounded-full transition-all duration-300 ${
                                    n === stepIndex[step] ? 'w-8 bg-[#021d49]' :
                                    n < stepIndex[step] ? 'w-2 bg-green-400' : 'w-2 bg-gray-200'
                                }`} />
                            ))}
                        </div>
                    )}

                    {/* Error alert */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}

                    {/* Step 1 — Email */}
                    {step === STEPS.EMAIL && (
                        <>
                            <div className="text-center mb-6">
                                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-50 rounded-xl mb-3">
                                    <Mail className="w-6 h-6 text-[#021d49]" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">Forgot Password?</h2>
                                <p className="text-sm text-gray-500 mt-1">Enter your email and we&apos;ll send a verification code.</p>
                            </div>

                            <form onSubmit={handleSendOtp} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="you@example.com"
                                            autoFocus
                                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#021d49]/25 focus:border-[#021d49] outline-none transition"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-[#021d49] hover:bg-[#032a66] disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2"
                                >
                                    {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                                    {loading ? 'Sending…' : 'Send Verification Code'}
                                </button>
                            </form>
                        </>
                    )}

                    {/* Step 2 — OTP */}
                    {step === STEPS.OTP && (
                        <>
                            <div className="text-center mb-6">
                                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-50 rounded-xl mb-3">
                                    <KeyRound className="w-6 h-6 text-[#021d49]" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">Enter Your Code</h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    We sent a 6-digit code to{' '}
                                    <span className="font-semibold text-gray-700">{email}</span>
                                </p>
                            </div>

                            <form onSubmit={handleVerifyOtp} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Verification Code</label>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={6}
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        placeholder="000000"
                                        autoFocus
                                        className="w-full text-center text-3xl font-bold tracking-[16px] py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#021d49]/25 focus:border-[#021d49] outline-none transition"
                                    />
                                    <p className="text-xs text-gray-400 mt-1.5 text-center">Code expires in 10 minutes</p>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading || otp.length !== 6}
                                    className="w-full bg-[#021d49] hover:bg-[#032a66] disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2"
                                >
                                    {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                                    {loading ? 'Verifying…' : 'Verify Code'}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => { setStep(STEPS.EMAIL); setError(''); setOtp(''); }}
                                    className="w-full text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center gap-1.5 py-1 transition"
                                >
                                    <ArrowLeft className="w-3.5 h-3.5" /> Use a different email
                                </button>
                            </form>
                        </>
                    )}

                    {/* Step 3 — New Password */}
                    {step === STEPS.PASSWORD && (
                        <>
                            <div className="text-center mb-6">
                                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-50 rounded-xl mb-3">
                                    <Lock className="w-6 h-6 text-[#021d49]" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">Set New Password</h2>
                                <p className="text-sm text-gray-500 mt-1">Choose a strong password for your account.</p>
                            </div>

                            <form onSubmit={handleResetPassword} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type={showNew ? 'text' : 'password'}
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="Min. 8 characters"
                                            autoFocus
                                            className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#021d49]/25 focus:border-[#021d49] outline-none transition"
                                        />
                                        <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                            {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type={showConfirm ? 'text' : 'password'}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="Repeat your password"
                                            className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#021d49]/25 focus:border-[#021d49] outline-none transition"
                                        />
                                        <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                            {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    {confirmPassword && newPassword !== confirmPassword && (
                                        <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-[#021d49] hover:bg-[#032a66] disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2"
                                >
                                    {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                                    {loading ? 'Saving…' : 'Reset Password'}
                                </button>
                            </form>
                        </>
                    )}

                    {/* Step 4 — Done */}
                    {step === STEPS.DONE && (
                        <div className="text-center py-4">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-50 rounded-2xl mb-4">
                                <CheckCircle className="w-8 h-8 text-green-500" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 mb-2">Password Reset!</h2>
                            <p className="text-sm text-gray-500 mb-6">
                                Your password has been updated. You can now sign in with your new password.
                            </p>
                            <button
                                onClick={() => router.push('/login')}
                                className="w-full bg-[#021d49] hover:bg-[#032a66] text-white font-semibold py-3 rounded-xl transition"
                            >
                                Go to Login
                            </button>
                        </div>
                    )}

                    {step !== STEPS.DONE && (
                        <div className="mt-6 text-center">
                            <Link href="/login" className="text-sm text-gray-500 hover:text-[#021d49] inline-flex items-center gap-1.5 transition">
                                <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
