'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import InstructorSidebar from '@/components/instructor/InstructorSidebar';
import * as Icons from 'lucide-react';

export default function InstructorLayout({ children }) {
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isApproved, setIsApproved] = useState(false);
    const [instructorData, setInstructorData] = useState(null);

    useEffect(() => {
        // Check if user is authenticated and has instructor role
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');

        if (!token || !userStr) {
            router.replace('/');
            return;
        }

        try {
            const user = JSON.parse(userStr);
            if (user.role !== 'instructor') {
                // Not an instructor, redirect based on their role
                if (user.role === 'admin') {
                    router.replace('/admin');
                } else if (user.role === 'student') {
                    router.replace('/student');
                } else {
                    router.replace('/');
                }
                return;
            }

            setInstructorData(user);

            // Check if instructor is approved
            // The backend returns 'instructorStatus' field with values: 'pending', 'approved', 'rejected'
            const approved = user.instructorStatus === 'approved';
            setIsApproved(approved);
            setIsAuthorized(true);
        } catch (error) {
            console.error('Error parsing user data:', error);
            router.replace('/');
        } finally {
            setIsLoading(false);
        }
    }, [router]);

    // Show loading state
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading instructor dashboard...</p>
                </div>
            </div>
        );
    }

    // Don't render anything if not authorized (redirect is in progress)
    if (!isAuthorized) {
        return null;
    }

    // Show pending approval message if not approved
    if (!isApproved) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-4">
                <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8 md:p-12 text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-blue-500 rounded-full mx-auto mb-6 flex items-center justify-center">
                        <Icons.Clock className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">
                        Application Under Review
                    </h1>
                    <p className="text-lg text-gray-600 mb-6">
                        Thank you for applying to become an instructor, <span className="font-semibold text-emerald-600">{instructorData?.firstName}!</span>
                    </p>
                    <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6 mb-6">
                        <Icons.Mail className="w-8 h-8 text-yellow-600 mx-auto mb-3" />
                        <p className="text-gray-700 mb-2">
                            Our admin team is currently reviewing your application and credentials.
                        </p>
                        <p className="text-gray-700">
                            You will receive an email at <span className="font-semibold text-emerald-600">{instructorData?.email}</span> once your account has been approved.
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <button
                            onClick={() => router.replace('/')}
                            className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                        >
                            Return to Home
                        </button>
                        <button
                            onClick={() => {
                                localStorage.removeItem('token');
                                localStorage.removeItem('user');
                                router.replace('/');
                            }}
                            className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-lg font-medium transition-all"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-gray-50 pt-16">
            <InstructorSidebar />
            <div className="flex-1 lg:ml-72 pb-16 lg:pb-0">
                {children}
            </div>
        </div>
    );
}
