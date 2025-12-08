'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import * as Icons from 'lucide-react';

export default function PendingApprovalPage() {
    const router = useRouter();
    const [instructor, setInstructor] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Immediate check on mount
        fetchInstructorData();

        // Poll for approval status every 5 seconds (more aggressive checking)
        const interval = setInterval(fetchInstructorData, 5000);
        return () => clearInterval(interval);
    }, [router]);

    const fetchInstructorData = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                router.replace('/login');
                return;
            }

            const response = await fetch('http://localhost:5000/api/users/profile/current', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch instructor data');
            }

            const data = await response.json();
            const instructorData = data.data;

            console.log('Instructor status:', instructorData.instructorStatus); // Debug log

            setInstructor(instructorData);

            // Redirect immediately based on status
            if (instructorData.instructorStatus === 'approved') {
                console.log('Redirecting to dashboard - approved');
                router.replace('/instructor');
                return;
            } else if (instructorData.instructorStatus === 'rejected') {
                console.log('Redirecting to rejection page - rejected');
                router.replace('/instructor/application-rejected');
                return;
            }

            // Still pending, show page
            setLoading(false);
        } catch (error) {
            console.error('Error fetching instructor data:', error);
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.replace('/login');
    };

    const handleCheckNow = async () => {
        setLoading(true);
        await fetchInstructorData();
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
                {/* Icon */}
                <div className="flex justify-center mb-6">
                    <div className="w-20 h-20 bg-yellow-50 rounded-full flex items-center justify-center">
                        <Icons.Clock className="w-10 h-10 text-yellow-600" />
                    </div>
                </div>

                {/* Title */}
                <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
                    Application Under Review
                </h1>

                {/* Subtitle */}
                <p className="text-gray-600 text-center mb-6">
                    Your instructor application has been received and is currently under review by our admin team.
                </p>

                {/* Status Details */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                    <div className="flex items-start gap-3">
                        <Icons.AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-semibold text-gray-900 text-sm mb-1">Current Status</p>
                            <p className="text-sm text-gray-700">
                                Your application status is <span className="font-bold text-yellow-600">PENDING</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* What Happens Next */}
                <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-3 text-sm">What Happens Next</h3>
                    <div className="space-y-3">
                        <div className="flex gap-3">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                                <span className="text-xs font-bold text-blue-600">1</span>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-900">Review Process</p>
                                <p className="text-xs text-gray-600">Your credentials and institution are being verified</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                                <span className="text-xs font-bold text-blue-600">2</span>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-900">Approval Email</p>
                                <p className="text-xs text-gray-600">You'll receive an email when your application is approved</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                                <span className="text-xs font-bold text-blue-600">3</span>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-900">Full Access</p>
                                <p className="text-xs text-gray-600">You'll gain access to create and manage courses</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <p className="text-xs text-gray-700">
                        <span className="font-semibold">💡 Tip:</span> This page automatically checks for approval every 5 seconds. You can manually click "Check Status Now" or close and log back in when you receive the approval email.
                    </p>
                </div>

                {/* Instructor Info */}
                {instructor && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                        <p className="text-xs text-gray-600 mb-2">Registered as:</p>
                        <p className="font-semibold text-gray-900">
                            {instructor.firstName} {instructor.lastName}
                        </p>
                        <p className="text-sm text-gray-600">{instructor.email}</p>
                        {instructor.institution && (
                            <p className="text-sm text-gray-600">{instructor.institution}</p>
                        )}
                    </div>
                )}

                {/* Buttons */}
                <div className="space-y-3">
                    <button
                        onClick={fetchInstructorData}
                        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                        <Icons.RefreshCw className="w-4 h-4" />
                        Check Status Now
                    </button>
                    <button
                        onClick={handleLogout}
                        className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg font-medium transition-colors"
                    >
                        Logout
                    </button>
                </div>

                {/* Timeline */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                    <p className="text-xs text-gray-600 text-center mb-3">Typical approval timeline</p>
                    <div className="flex justify-between text-xs">
                        <div className="text-center">
                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-1">
                                <Icons.Check className="w-4 h-4 text-green-600" />
                            </div>
                            <p className="font-medium text-gray-700">Application</p>
                            <p className="text-gray-500">Submitted</p>
                        </div>
                        <div className="flex-1 flex items-end px-2 pb-4">
                            <div className="flex-1 h-1 bg-gray-300"></div>
                        </div>
                        <div className="text-center">
                            <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-1">
                                <Icons.Clock className="w-4 h-4 text-yellow-600" />
                            </div>
                            <p className="font-medium text-gray-700">Review</p>
                            <p className="text-gray-500">In Progress</p>
                        </div>
                        <div className="flex-1 flex items-end px-2 pb-4">
                            <div className="flex-1 h-1 bg-gray-300"></div>
                        </div>
                        <div className="text-center">
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mx-auto mb-1">
                                <Icons.Lock className="w-4 h-4 text-gray-600" />
                            </div>
                            <p className="font-medium text-gray-700">Approval</p>
                            <p className="text-gray-500">Pending</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
