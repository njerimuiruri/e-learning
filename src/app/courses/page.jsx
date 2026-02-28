"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Redirect /courses to /modules — the platform now uses Modules terminology.
export default function CoursesRedirectPage() {
    const router = useRouter();
    useEffect(() => {
        router.replace('/modules');
    }, [router]);
    return null;
}
