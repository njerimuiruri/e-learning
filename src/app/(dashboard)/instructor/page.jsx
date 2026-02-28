'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import * as Icons from 'lucide-react';
import moduleService from '@/lib/api/moduleService';
import ProtectedInstructorRoute from '@/components/ProtectedInstructorRoute';

function InstructorDashboardContent() {
    const router = useRouter();
    const [modules, setModules] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                setLoading(true);
                setError('');

                const [modulesData, statsData] = await Promise.all([
                    moduleService.getInstructorModules(),
                    moduleService.getInstructorStats(),
                ]);

                const modulesList = Array.isArray(modulesData) ? modulesData : modulesData?.modules || [];
                setModules(modulesList);
                setStats(statsData);
            } catch (err) {
                setError('Failed to load dashboard data');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboard();
    }, []);

    const statCards = stats ? [
        {
            label: 'Total Modules',
            value: stats.totalModules?.toString() || '0',
            icon: 'Layers',
            bgColor: 'bg-emerald-50',
            iconColor: 'text-emerald-600',
        },
        {
            label: 'Active Students',
            value: stats.totalStudents?.toLocaleString() || '0',
            icon: 'Users',
            bgColor: 'bg-blue-50',
            iconColor: 'text-blue-600',
        },
        {
            label: 'Completion Rate',
            value: `${stats.completionRate || 0}%`,
            icon: 'TrendingUp',
            bgColor: 'bg-yellow-50',
            iconColor: 'text-yellow-600',
        },
        {
            label: 'Content Hours',
            value: stats.totalContentHours?.toString() || '0',
            icon: 'Clock',
            bgColor: 'bg-purple-50',
            iconColor: 'text-purple-600',
        },
    ] : [];

    const getStatusBadge = (status) => {
        const badges = {
            draft: { color: 'bg-gray-100 text-gray-700', label: 'Draft' },
            submitted: { color: 'bg-blue-100 text-blue-700', label: 'Submitted' },
            approved: { color: 'bg-green-100 text-green-700', label: 'Approved' },
            published: { color: 'bg-emerald-100 text-emerald-700', label: 'Published' },
            rejected: { color: 'bg-red-100 text-red-700', label: 'Rejected' },
        };
        return badges[status] || badges.draft;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-emerald-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading instructor dashboard...</p>
                </div>
            </div>
        );
    }
    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <p className="text-red-600 font-bold">{error}</p>
                </div>
            </div>
        );
    }
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50/30">
            <main className="pt-20 p-6 lg:p-8">
                <div className="max-w-full">
                    {/* Header */}
                    <div className="mb-6">
                        <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-[#16a34a] to-emerald-700 bg-clip-text text-transparent mb-2">
                            Instructor Dashboard
                        </h1>
                        <p className="text-gray-600">Manage your modules and track student progress.</p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        {statCards.map((stat, index) => {
                            const IconComponent = Icons[stat.icon];
                            return (
                                <div key={index} className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-lg transition-all duration-300 group">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className={`p-3 rounded-lg ${stat.bgColor} shadow-md group-hover:scale-110 transition-transform duration-300`}>
                                            {IconComponent && <IconComponent className={`w-6 h-6 ${stat.iconColor}`} />}
                                        </div>
                                    </div>
                                    <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{stat.value}</h3>
                                    <p className="text-sm text-gray-600">{stat.label}</p>
                                </div>
                            );
                        })}
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white rounded-xl p-6 mb-6 shadow-sm border border-gray-200">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Icons.Zap className="w-5 h-5 text-emerald-600" />
                            Quick Actions
                        </h2>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                            <button
                                onClick={() => router.push('/instructor/modules/create')}
                                className="bg-gradient-to-r from-[#16a34a] to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-4 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                            >
                                <Icons.PlusCircle className="w-4 h-4" />
                                Create Module
                            </button>
                            <button
                                onClick={() => router.push('/instructor/modules')}
                                className="bg-white hover:bg-emerald-50 text-gray-700 px-4 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 border border-gray-200 hover:border-emerald-300"
                            >
                                <Icons.Layers className="w-4 h-4 text-emerald-600" />
                                My Modules
                            </button>
                            <button
                                onClick={() => router.push('/instructor/students')}
                                className="bg-white hover:bg-emerald-50 text-gray-700 px-4 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 border border-gray-200 hover:border-emerald-300"
                            >
                                <Icons.Users className="w-4 h-4 text-emerald-600" />
                                View Students
                            </button>
                            <button
                                onClick={() => router.push('/instructor/analytics')}
                                className="bg-white hover:bg-emerald-50 text-gray-700 px-4 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 border border-gray-200 hover:border-emerald-300"
                            >
                                <Icons.BarChart3 className="w-4 h-4 text-emerald-600" />
                                View Analytics
                            </button>
                        </div>
                    </div>

                    {/* Module Status Summary + Recent Modules */}
                    <div className="grid lg:grid-cols-3 gap-6 mb-6">
                        {/* My Modules */}
                        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm">
                            <div className="p-5 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                        <Icons.Layers className="w-5 h-5 text-emerald-600" />
                                        My Modules
                                    </h2>
                                    <button
                                        onClick={() => router.push('/instructor/modules')}
                                        className="text-emerald-600 hover:text-emerald-700 text-sm font-medium flex items-center gap-1"
                                    >
                                        View All <Icons.ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="p-5">
                                <div className="space-y-4">
                                    {modules.length === 0 ? (
                                        <div className="text-center py-8">
                                            <Icons.Layers className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                            <p className="text-gray-500 mb-4">You haven't created any modules yet.</p>
                                            <button
                                                onClick={() => router.push('/instructor/modules/create')}
                                                className="px-6 py-2 bg-gradient-to-r from-[#16a34a] to-emerald-600 text-white rounded-lg font-medium hover:from-emerald-600 hover:to-emerald-700 transition-all"
                                            >
                                                Create Your First Module
                                            </button>
                                        </div>
                                    ) : (
                                        modules.slice(0, 4).map((mod) => {
                                            const badge = getStatusBadge(mod.status);
                                            return (
                                                <div key={mod._id} className="flex items-start gap-4 p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg hover:shadow-md transition-all border border-emerald-100">
                                                    <div className="w-16 h-16 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                                        <Icons.Layers className="w-8 h-8 text-emerald-600" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h3 className="font-bold text-gray-900 truncate">{mod.title}</h3>
                                                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${badge.color}`}>
                                                                {badge.label}
                                                            </span>
                                                        </div>
                                                        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600 mb-2">
                                                            <span className="flex items-center gap-1">
                                                                <Icons.BookOpen className="w-3 h-3" />
                                                                {mod.lessons?.length || 0} lessons
                                                            </span>
                                                            <span className="flex items-center gap-1 capitalize">
                                                                <Icons.Signal className="w-3 h-3" />
                                                                {mod.level}
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <Icons.Users className="w-3 h-3" />
                                                                {mod.enrollmentCount || 0} students
                                                            </span>
                                                        </div>
                                                        <button
                                                            onClick={() => router.push(`/instructor/modules/${mod._id}`)}
                                                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded-lg font-medium transition-colors"
                                                        >
                                                            Manage
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Module Status Summary */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                            <div className="p-5 border-b border-gray-200">
                                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <Icons.PieChart className="w-5 h-5 text-emerald-600" />
                                    Status Overview
                                </h2>
                            </div>
                            <div className="p-5 space-y-3">
                                {stats?.modulesByStatus && Object.entries(stats.modulesByStatus).map(([status, count]) => {
                                    const badge = getStatusBadge(status);
                                    return (
                                        <div key={status} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${badge.color}`}>
                                                {badge.label}
                                            </span>
                                            <span className="text-lg font-bold text-gray-900">{count}</span>
                                        </div>
                                    );
                                })}
                                {(!stats?.modulesByStatus || Object.keys(stats.modulesByStatus).length === 0) && (
                                    <p className="text-gray-500 text-sm text-center py-4">No modules yet</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function InstructorDashboardPage() {
    return (
        <ProtectedInstructorRoute>
            <InstructorDashboardContent />
        </ProtectedInstructorRoute>
    );
}
