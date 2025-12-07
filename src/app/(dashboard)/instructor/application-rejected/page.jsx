'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import * as Icons from 'lucide-react';

export default function ApplicationRejectedPage() {
    const router = useRouter();
    const [instructor, setInstructor] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchInstructorData();
    }, []);

    const fetchInstructorData = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/users/profile', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to fetch instructor data');

            const data = await response.json();
            setInstructor(data.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching instructor data:', error);
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.replace('/auth/login');
    };

    const handleReapply = () => {
        router.replace('/auth/register');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
                {/* Icon */}
                <div className="flex justify-center mb-6">
                    <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center">
                        <Icons.XCircle className="w-10 h-10 text-red-600" />
                    </div>
                </div>

                {/* Title */}
                <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
                    Application Not Approved
                </h1>

                {/* Subtitle */}
                <p className="text-gray-600 text-center mb-6">
                    Unfortunately, your instructor application was not approved at this time.
                </p>

                {/* Status Details */}
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <div className="flex items-start gap-3">
                        <Icons.AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-semibold text-gray-900 text-sm mb-1">Application Status</p>
                            <p className="text-sm text-gray-700">
                                Your application status is <span className="font-bold text-red-600">REJECTED</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Rejection Reason */}
                {instructor?.rejectionReason && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                        <p className="text-xs text-gray-600 mb-2 font-semibold">Reason for Rejection:</p>
                        <p className="text-sm text-gray-700">{instructor.rejectionReason}</p>
                    </div>
                )}

                {/* What You Can Do */}
                <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-3 text-sm">What You Can Do</h3>
                    <div className="space-y-3">
                        <div className="flex gap-3">
                            <div className="flex-shrink-0 w-5 h-5 text-gray-400">
                                <Icons.ChevronRight className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-700">
                                    Review the rejection reason carefully
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <div className="flex-shrink-0 w-5 h-5 text-gray-400">
                                <Icons.ChevronRight className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-700">
                                    Address the concerns mentioned in the feedback
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <div className="flex-shrink-0 w-5 h-5 text-gray-400">
                                <Icons.ChevronRight className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-700">
                                    Reapply with updated information
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <p className="text-xs text-gray-700">
                        <span className="font-semibold">📧 Contact Support:</span> If you believe this was an error, please contact our support team for clarification.
                    </p>
                </div>

                {/* Instructor Info */}
                {instructor && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                        <p className="text-xs text-gray-600 mb-2">Your Profile:</p>
                        <p className="font-semibold text-gray-900">
                            {instructor.firstName} {instructor.lastName}
                        </p>
                        <p className="text-sm text-gray-600">{instructor.email}</p>
                    </div>
                )}

                {/* Buttons */}
                <div className="space-y-3">
                    <button
                        onClick={handleReapply}
                        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                        <Icons.RotateCcw className="w-4 h-4" />
                        Reapply
                    </button>
                    <button
                        onClick={handleLogout}
                        className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg font-medium transition-colors"
                    >
                        Logout
                    </button>
                </div>

                {/* FAQ */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Common Questions</h4>
                    <div className="space-y-2 text-xs">
                        <div>
                            <p className="font-medium text-gray-700">Can I reapply?</p>
                            <p className="text-gray-600">Yes, you can submit a new application after addressing the concerns.</p>
                        </div>
                        <div>
                            <p className="font-medium text-gray-700">How long before I can reapply?</p>
                            <p className="text-gray-600">You can reapply immediately with improved credentials.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
