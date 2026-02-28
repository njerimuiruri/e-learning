'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function UploadCourseRedirect() {
    const router = useRouter();
    useEffect(() => { router.replace('/instructor/modules/create'); }, [router]);
    return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-500">Redirecting to create module...</p></div>;
}
