'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import authService from '@/lib/api/authService';

export default function ProtectedStudentRoute({ children }) {
    const router = useRouter();
    const pathname = usePathname();
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        const checkAccess = async () => {
            try {
                const user = authService.getCurrentUser();

                if (!user) {
                    const redirect = pathname ? `?redirect=${encodeURIComponent(pathname)}` : '';
                    router.push(`/login${redirect}`);
                    return;
                }

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
