'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ProtectedStudentRoute({ children }) {
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        const checkAccess = async () => {
            try {
                const token = localStorage.getItem('token');
                const userStr = localStorage.getItem('user');

                if (!token || !userStr) {
                    router.push('/login');
                    return;
                }

                const user = JSON.parse(userStr);

                // Check if user must set password (admin-created student)
                if (user.mustSetPassword) {
                    router.push('/auth/set-initial-password');
                    setIsChecking(false);
                    return;
                }

                // User is authorized
                setIsAuthorized(true);
            } catch (error) {
                console.error('Error checking student access:', error);
                router.push('/login');
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
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Verifying access...</p>
                </div>
            </div>
        );
    }

    if (!isAuthorized) {
        return null; // Will be redirected
    }

    return children;
}
