// components/ProtectedInstructorRoute.jsx - Wrapper for instructor-only pages

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { handleInstructorRedirect } from '@/lib/api/redirects';

export default function ProtectedInstructorRoute({ children }) {
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        const checkAccess = async () => {
            const token = localStorage.getItem('token');
            const authorized = await handleInstructorRedirect(router, token);

            if (authorized) {
                setIsAuthorized(true);
            }
            setIsChecking(false);
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
        return null; // Will be redirected by handleInstructorRedirect
    }

    return children;
}
