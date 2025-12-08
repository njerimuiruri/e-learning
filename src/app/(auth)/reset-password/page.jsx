'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import * as Icons from 'lucide-react';
import axios from 'axios';

export default function ResetPasswordPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [formData, setFormData] = useState({
        newPassword: '',
        confirmPassword: '',
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    if (!token) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
                    <Icons.AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Reset Link</h1>
                    <p className="text-gray-600 mb-6">The password reset link is missing or invalid.</p>
                    <button
                        onClick={() => router.push('/login')}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Back to Login
                    </button>
                </div>
            </div>
        );
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (!formData.newPassword || !formData.confirmPassword) {
            setError('Please fill in all fields');
            return;
        }

        if (formData.newPassword !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (formData.newPassword.length < 8) {
            setError('Password must be at least 8 characters long');
            return;
        }

        try {
            setLoading(true);
            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/api/auth/reset-password`,
                {
                    token,
                    newPassword: formData.newPassword,
                    confirmPassword: formData.confirmPassword,
                }
            );

            setMessage('Password reset successfully! Redirecting to login...');
            setTimeout(() => {
                router.push('/login');
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
                <div className="text-center mb-8">
                    <Icons.Lock size={48} className="mx-auto text-blue-600 mb-4" />
                    <h1 className="text-3xl font-bold text-gray-900">Reset Password</h1>
                    <p className="text-gray-600 mt-2">Enter your new password below</p>
                </div>

                {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
                        <Icons.AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                        <p className="text-red-800">{error}</p>
                    </div>
                )}

                {message && (
                    <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex gap-3">
                        <Icons.CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
                        <p className="text-green-800">{message}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={formData.newPassword}
                                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                                placeholder="Enter new password"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                disabled={loading}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-2.5 text-gray-600 hover:text-gray-800"
                            >
                                {showPassword ? <Icons.EyeOff size={20} /> : <Icons.Eye size={20} />}
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">At least 8 characters</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            placeholder="Confirm password"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={loading}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Icons.Loader size={20} className="animate-spin" />
                                Resetting...
                            </>
                        ) : (
                            <>
                                <Icons.Lock size={20} />
                                Reset Password
                            </>
                        )}
                    </button>
                </form>

                <p className="text-center text-gray-600 text-sm mt-6">
                    Remember your password?{' '}
                    <button
                        onClick={() => router.push('/login')}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                        Back to Login
                    </button>
                </p>
            </div>
        </div>
    );
}
