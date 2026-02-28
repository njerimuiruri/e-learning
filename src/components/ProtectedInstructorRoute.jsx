// components/ProtectedInstructorRoute.jsx - Wrapper for instructor-only pages

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import authService from '@/lib/api/authService';

export default function ProtectedInstructorRoute({ children }) {
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        const checkAccess = () => {
            try {
                const user = authService.getCurrentUser();

                // If no user data, not authorized
                if (!user) {
                    router.replace('/login');
                    setIsChecking(false);
                    return;
                }

                // Check if user is an instructor and is approved
                if (user.role === 'instructor' && user.instructorStatus === 'approved') {
                    setIsAuthorized(true);
                } else if (user.role === 'instructor' && user.instructorStatus === 'pending') {
                    router.replace('/instructor/pending-approval');
                } else if (user.role === 'instructor' && user.instructorStatus === 'rejected') {
                    router.replace('/instructor/application-rejected');
                } else {
                    router.replace('/login');
                }
            } catch (error) {
                console.error('Error checking access:', error);
                router.replace('/login');
            } finally {
                setIsChecking(false);
            }
        };

        checkAccess();
    }, [router]);

    if (isChecking) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Verifying access...</p>
                </div>
            </div>
        );
    }

    if (!isAuthorized) {
        return null; // Will be redirected by useEffect above
    }

    return children;
}
