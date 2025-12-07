'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import * as Icons from 'lucide-react';
import axios from 'axios';

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!email) {
            setError('Please enter your email address');
            return;
        }

        try {
            setLoading(true);
            await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/api/auth/forgot-password`,
                { email }
            );
            setSubmitted(true);
            setEmail('');
        } catch (err) {
            // Don't reveal if email exists for security
            setSubmitted(true);
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
                    <Icons.Mail size={48} className="mx-auto text-green-500 mb-4" />
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Check Your Email</h1>
                    <p className="text-gray-600 mb-6">
                        If an account exists with that email, you will receive a password reset link shortly.
                    </p>
                    <button
                        onClick={() => router.push('/auth/login')}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                    >
                        Back to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
                <div className="text-center mb-8">
                    <Icons.HelpCircle size={48} className="mx-auto text-blue-600 mb-4" />
                    <h1 className="text-3xl font-bold text-gray-900">Forgot Password?</h1>
                    <p className="text-gray-600 mt-2">Enter your email to receive a reset link</p>
                </div>

                {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
                        <Icons.AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                        <p className="text-red-800">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                        <div className="relative">
                            <Icons.Mail className="absolute left-3 top-3 text-gray-400" size={20} />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email"
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Icons.Loader size={20} className="animate-spin" />
                                Sending...
                            </>
                        ) : (
                            <>
                                <Icons.Send size={20} />
                                Send Reset Link
                            </>
                        )}
                    </button>
                </form>

                <p className="text-center text-gray-600 text-sm mt-6">
                    Remember your password?{' '}
                    <button
                        onClick={() => router.push('/auth/login')}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                        Back to Login
                    </button>
                </p>
            </div>
        </div>
    );
}
