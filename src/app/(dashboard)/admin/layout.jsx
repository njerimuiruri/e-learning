'use client';

import React from 'react';
import AdminSidebar from '@/components/Admin/AdminSidebar';

export default function AdminLayout({ children }) {
    return (
        <div className="flex min-h-screen bg-gray-50 pt-16">
            {/* Sidebar */}
            <AdminSidebar />
            {/* Main Content */}
            <div className="flex-1 lg:ml-64 pb-16 lg:pb-0">
                {children}
            </div>
        </div>
    );
}