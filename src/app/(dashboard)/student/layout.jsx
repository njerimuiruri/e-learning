'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import StudentSidebar from '@/components/student/StudentSidebar';

export default function StudentLayout({ children }) {
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check if user is authenticated and has student role
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');

        if (!token || !userStr) {
            // Not logged in, redirect to home
            router.replace('/');
            return;
        }

        try {
            const user = JSON.parse(userStr);
            if (user.role !== 'student') {
                // Not a student, redirect based on their role
                if (user.role === 'admin') {
                    router.replace('/admin');
                } else if (user.role === 'instructor') {
                    router.replace('/instructor');
                } else {
                    router.replace('/');
                }
                return;
            }

            // User is authorized
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
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading student dashboard...</p>
                </div>
            </div>
        );
    }

    // Don't render anything if not authorized (redirect is in progress)
    if (!isAuthorized) {
        return null;
    }

    return (
        <div className="flex min-h-screen bg-gray-50 pt-16">
            {/* Sidebar */}
            <StudentSidebar />

            {/* Main Content */}
            <div className="flex-1 lg:ml-64 pb-16 lg:pb-0">
                {children}
            </div>
        </div>
    );
}