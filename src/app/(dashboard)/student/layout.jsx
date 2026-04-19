'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import StudentSidebar from '@/components/student/StudentSidebar';
import authService from '@/lib/api/authService';

export default function StudentLayout({ children }) {
    const router = useRouter();
    const pathname = usePathname();
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Hide dashboard sidebar on the immersive lesson page
    const isLessonPage = /^\/student\/modules\/[^/]+$/.test(pathname || '');

    useEffect(() => {
        // Check if user is authenticated and has student role
        // First try to get from cookie (set by backend), then fallback to localStorage (set by frontend)
        let user = authService.getCurrentUser();

        if (!user && typeof window !== 'undefined') {
            // Fallback to localStorage if cookie is not available yet
            const userStr = window.localStorage.getItem('user');
            console.log('[Auth] Cookie not found, checking localStorage for user data...');
            if (userStr) {
                try {
                    user = JSON.parse(userStr);
                } catch (error) {
                    console.error('Error parsing user from localStorage:', error);
                }
            }
        }

        if (!user) {
            // Not logged in, redirect to home
            router.replace('/');
            return;
        }

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
        console.log('[Auth] Student Authorized for Dashboard. User ID:', user._id || user.id);
        setIsAuthorized(true);
        setIsLoading(false);
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
        <div className={`flex bg-gray-50 overflow-x-hidden ${isLessonPage ? 'h-screen pt-20' : 'min-h-screen pt-20'}`}>
            {/* Sidebar — hidden on the immersive lesson view */}
            {!isLessonPage && <StudentSidebar />}

            {/* Main Content */}
            <div className={`flex-1 min-w-0 ${!isLessonPage ? 'lg:ml-64 pb-16 lg:pb-0' : 'overflow-hidden'}`}>
                {children}
            </div>
        </div>
    );
}