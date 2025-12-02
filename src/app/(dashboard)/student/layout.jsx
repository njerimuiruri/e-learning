'use client';

import React from 'react';
import StudentSidebar from '@/components/student/StudentSidebar';

export default function StudentLayout({ children }) {
    return (
        <div className="flex min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-red-50">
            {/* Sidebar */}
            <StudentSidebar />

            {/* Main Content */}
            <div className="flex-1 ml-72 transition-all duration-300">
                {children}
            </div>
        </div>
    );
}